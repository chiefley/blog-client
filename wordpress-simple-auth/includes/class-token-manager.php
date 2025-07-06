<?php
/**
 * Token management class with multisite support
 */
class Token_Manager {
    
    private $table_name;
    private $table_checked = false;
    
    public function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'simple_auth_tokens';
    }
    
    /**
     * Ensure the tokens table exists for the current site
     */
    private function ensure_table_exists() {
        // Only check once per request to avoid multiple checks
        if ($this->table_checked) {
            return true;
        }
        
        global $wpdb;
        
        // Check if table exists
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '{$this->table_name}'") === $this->table_name;
        
        if (!$table_exists) {
            // Create the table
            $this->create_tokens_table();
        }
        
        $this->table_checked = true;
        return true;
    }
    
    /**
     * Create the tokens table for the current site
     */
    private function create_tokens_table() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE IF NOT EXISTS {$this->table_name} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            token varchar(64) NOT NULL,
            expires_at datetime NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            last_used datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY token (token),
            KEY expires_at (expires_at)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
        
        // Update database version for this site
        update_option('simple_auth_db_version', SIMPLE_AUTH_VERSION);
    }
    
    /**
     * Generate a new token for a user
     */
    public function generate_token($user_id) {
        global $wpdb;
        
        // Ensure table exists
        $this->ensure_table_exists();
        
        // Generate a secure random token
        $token = bin2hex(random_bytes(32));
        
        // Calculate expiry time
        $expires_at = date('Y-m-d H:i:s', time() + SIMPLE_AUTH_TOKEN_EXPIRY);
        
        // Store token in database
        $result = $wpdb->insert(
            $this->table_name,
            [
                'user_id' => $user_id,
                'token' => $token,
                'expires_at' => $expires_at,
                'created_at' => current_time('mysql'),
                'last_used' => current_time('mysql')
            ],
            ['%d', '%s', '%s', '%s', '%s']
        );
        
        if ($result === false) {
            return false;
        }
        
        // Also store in user meta for quick lookups
        update_user_meta($user_id, '_simple_auth_token', $token);
        update_user_meta($user_id, '_simple_auth_token_expires', $expires_at);
        
        return $token;
    }
    
    /**
     * Validate a token and return the user ID if valid
     */
    public function validate_token($token) {
        global $wpdb;
        
        // Ensure table exists
        $this->ensure_table_exists();
        
        // Sanitize token
        $token = sanitize_text_field($token);
        
        if (empty($token)) {
            return false;
        }
        
        // Look up token in database
        $row = $wpdb->get_row($wpdb->prepare(
            "SELECT user_id, expires_at FROM {$this->table_name} 
             WHERE token = %s AND expires_at > %s",
            $token,
            current_time('mysql')
        ));
        
        if (!$row) {
            return false;
        }
        
        // Update last used timestamp
        $wpdb->update(
            $this->table_name,
            ['last_used' => current_time('mysql')],
            ['token' => $token],
            ['%s'],
            ['%s']
        );
        
        return (int) $row->user_id;
    }
    
    /**
     * Revoke a specific token
     */
    public function revoke_token($token) {
        global $wpdb;
        
        // Ensure table exists
        $this->ensure_table_exists();
        
        // Get user ID before deleting
        $user_id = $this->validate_token($token);
        
        // Delete from database
        $wpdb->delete(
            $this->table_name,
            ['token' => $token],
            ['%s']
        );
        
        // Clear user meta if this was their active token
        if ($user_id) {
            $stored_token = get_user_meta($user_id, '_simple_auth_token', true);
            if ($stored_token === $token) {
                delete_user_meta($user_id, '_simple_auth_token');
                delete_user_meta($user_id, '_simple_auth_token_expires');
            }
        }
        
        return true;
    }
    
    /**
     * Revoke all tokens for a user
     */
    public function revoke_all_user_tokens($user_id) {
        global $wpdb;
        
        // Ensure table exists
        $this->ensure_table_exists();
        
        // Delete all tokens for this user
        $wpdb->delete(
            $this->table_name,
            ['user_id' => $user_id],
            ['%d']
        );
        
        // Clear user meta
        delete_user_meta($user_id, '_simple_auth_token');
        delete_user_meta($user_id, '_simple_auth_token_expires');
        
        return true;
    }
    
    /**
     * Clean up expired tokens
     */
    public function cleanup_expired_tokens() {
        global $wpdb;
        
        // Ensure table exists
        $this->ensure_table_exists();
        
        // Delete expired tokens from database
        $deleted = $wpdb->query($wpdb->prepare(
            "DELETE FROM {$this->table_name} WHERE expires_at < %s",
            current_time('mysql')
        ));
        
        // Clean up orphaned user meta
        $wpdb->query("
            DELETE meta FROM {$wpdb->usermeta} meta
            LEFT JOIN {$this->table_name} tokens 
                ON meta.meta_value = tokens.token 
                AND meta.meta_key = '_simple_auth_token'
            WHERE meta.meta_key = '_simple_auth_token' 
                AND tokens.token IS NULL
        ");
        
        return $deleted;
    }
    
    /**
     * Get active tokens for a user
     */
    public function get_user_tokens($user_id) {
        global $wpdb;
        
        // Ensure table exists
        $this->ensure_table_exists();
        
        return $wpdb->get_results($wpdb->prepare(
            "SELECT token, created_at, last_used, expires_at 
             FROM {$this->table_name} 
             WHERE user_id = %d AND expires_at > %s
             ORDER BY created_at DESC",
            $user_id,
            current_time('mysql')
        ));
    }
    
    /**
     * Static method to handle activation for multisite
     */
    public static function create_tables_for_network() {
        global $wpdb;
        
        if (is_multisite()) {
            // Get all sites in the network
            $sites = get_sites();
            
            foreach ($sites as $site) {
                switch_to_blog($site->blog_id);
                
                // Create token manager instance for this site
                $token_manager = new self();
                $token_manager->create_tokens_table();
                
                restore_current_blog();
            }
        } else {
            // Single site installation
            $token_manager = new self();
            $token_manager->create_tokens_table();
        }
    }
    
    /**
     * Handle new site creation in multisite
     */
    public static function on_create_blog($blog_id, $user_id, $domain, $path, $site_id, $meta) {
        if (is_plugin_active_for_network('simple-auth/simple-auth.php')) {
            switch_to_blog($blog_id);
            
            $token_manager = new self();
            $token_manager->create_tokens_table();
            
            restore_current_blog();
        }
    }
    
    /**
     * Handle site deletion in multisite
     */
    public static function on_delete_blog($tables) {
        global $wpdb;
        $tables[] = $wpdb->prefix . 'simple_auth_tokens';
        return $tables;
    }
}