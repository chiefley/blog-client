<?php
/**
 * Main plugin class
 */
class Simple_Auth {
    
    private static $instance = null;
    
    /**
     * Get singleton instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        $this->init_hooks();
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // Initialize REST API endpoints
        add_action('rest_api_init', [$this, 'register_rest_routes']);
        
        // Add authentication to REST requests
        add_filter('determine_current_user', [$this, 'authenticate_request'], 20);
        add_filter('rest_authentication_errors', [$this, 'check_authentication_error']);
        
        // Modify post queries to include drafts for authenticated users
        add_filter('rest_post_query', [$this, 'include_draft_posts'], 10, 2);
        add_filter('rest_page_query', [$this, 'include_draft_posts'], 10, 2);
        
        // Add CORS headers
        add_action('rest_api_init', [$this, 'add_cors_headers'], 15);
        
        // Clean up expired tokens periodically
        add_action('simple_auth_cleanup', [$this, 'cleanup_expired_tokens']);
        if (!wp_next_scheduled('simple_auth_cleanup')) {
            wp_schedule_event(time(), 'daily', 'simple_auth_cleanup');
        }
    }
    
    /**
     * Register REST API routes
     */
    public function register_rest_routes() {
        $auth_endpoints = new Auth_Endpoints();
        $auth_endpoints->register_routes();
    }
    
    /**
     * Authenticate REST API request
     */
    public function authenticate_request($user_id) {
        // Don't authenticate twice
        if (!empty($user_id)) {
            return $user_id;
        }
        
        // Check for auth token in header
        $token = $this->get_auth_token();
        if (!$token) {
            return $user_id;
        }
        
        // Validate token
        $token_manager = new Token_Manager();
        $validated_user_id = $token_manager->validate_token($token);
        
        if ($validated_user_id) {
            return $validated_user_id;
        }
        
        return $user_id;
    }
    
    /**
     * Get auth token from request headers
     */
    private function get_auth_token() {
        $token = null;
        
        // Check Authorization header
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $auth_header = $_SERVER['HTTP_AUTHORIZATION'];
            if (preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
                $token = $matches[1];
            }
        }
        
        // Check X-Auth-Token header as fallback
        if (!$token && isset($_SERVER['HTTP_X_AUTH_TOKEN'])) {
            $token = $_SERVER['HTTP_X_AUTH_TOKEN'];
        }
        
        return $token;
    }
    
    /**
     * Check for authentication errors
     */
    public function check_authentication_error($error) {
        // Pass through existing errors
        if (!empty($error)) {
            return $error;
        }
        
        return true;
    }
    
    /**
     * Include draft posts for authenticated users
     */
    public function include_draft_posts($args, $request) {
        if (is_user_logged_in()) {
            // Include both published and draft posts
            if (!isset($args['post_status']) || $args['post_status'] === 'publish') {
                $args['post_status'] = ['publish', 'draft'];
            }
        }
        return $args;
    }
    
    /**
     * Add CORS headers
     */
    public function add_cors_headers() {
        // Get allowed origins from settings or use default
        $allowed_origins = apply_filters('simple_auth_allowed_origins', [
            'http://localhost:5173',
            'http://localhost:3000',
            'https://wa1x.thechief.com',
            'https://applefinch.thechief.com'
        ]);
        
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
        
        if (in_array($origin, $allowed_origins)) {
            header("Access-Control-Allow-Origin: {$origin}");
            header("Access-Control-Allow-Credentials: true");
            header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
            header("Access-Control-Allow-Headers: Authorization, X-Auth-Token, Content-Type, X-WP-Nonce");
        }
        
        // Handle preflight requests
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            status_header(200);
            exit();
        }
    }
    
    /**
     * Clean up expired tokens
     */
    public function cleanup_expired_tokens() {
        $token_manager = new Token_Manager();
        $token_manager->cleanup_expired_tokens();
    }
    
    /**
     * Plugin activation
     */
    public static function activate() {
        // Create tokens table
        global $wpdb;
        $table_name = $wpdb->prefix . 'simple_auth_tokens';
        
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE IF NOT EXISTS $table_name (
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
    }
    
    /**
     * Plugin deactivation
     */
    public static function deactivate() {
        wp_clear_scheduled_hook('simple_auth_cleanup');
    }
}