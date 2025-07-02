<?php
/**
 * Token management class
 */
class Token_Manager {
    
    private $table_name;
    
    public function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'simple_auth_tokens';
    }
    
    /**
     * Generate a new token for a user
     */
    public function generate_token($user_id) {
        global $wpdb;
        
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
        
        return $wpdb->get_results($wpdb->prepare(
            "SELECT token, created_at, last_used, expires_at 
             FROM {$this->table_name} 
             WHERE user_id = %d AND expires_at > %s
             ORDER BY created_at DESC",
            $user_id,
            current_time('mysql')
        ));
    }
}