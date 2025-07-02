<?php
/**
 * REST API Authentication Endpoints
 */
class Auth_Endpoints {
    
    /**
     * Register REST API routes
     */
    public function register_routes() {
        $namespace = 'simple-auth/v1';
        
        // Login endpoint
        register_rest_route($namespace, '/login', [
            'methods' => 'POST',
            'callback' => [$this, 'login'],
            'permission_callback' => '__return_true',
            'args' => [
                'username' => [
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_text_field'
                ],
                'password' => [
                    'required' => true,
                    'type' => 'string'
                ]
            ]
        ]);
        
        // Logout endpoint
        register_rest_route($namespace, '/logout', [
            'methods' => 'POST',
            'callback' => [$this, 'logout'],
            'permission_callback' => 'is_user_logged_in'
        ]);
        
        // Verify token endpoint
        register_rest_route($namespace, '/verify', [
            'methods' => 'GET',
            'callback' => [$this, 'verify_token'],
            'permission_callback' => 'is_user_logged_in'
        ]);
        
        // Refresh token endpoint
        register_rest_route($namespace, '/refresh', [
            'methods' => 'POST',
            'callback' => [$this, 'refresh_token'],
            'permission_callback' => 'is_user_logged_in'
        ]);
    }
    
    /**
     * Handle login request
     */
    public function login($request) {
        $username = $request->get_param('username');
        $password = $request->get_param('password');
        
        // Authenticate user
        $user = wp_authenticate($username, $password);
        
        if (is_wp_error($user)) {
            return new WP_Error(
                'invalid_credentials',
                'Invalid username or password',
                ['status' => 401]
            );
        }
        
        // Check if user has required capabilities
        if (!user_can($user, 'read')) {
            return new WP_Error(
                'insufficient_permissions',
                'User does not have required permissions',
                ['status' => 403]
            );
        }
        
        // Generate token
        $token_manager = new Token_Manager();
        $token = $token_manager->generate_token($user->ID);
        
        if (!$token) {
            return new WP_Error(
                'token_generation_failed',
                'Failed to generate authentication token',
                ['status' => 500]
            );
        }
        
        // Get user data
        $user_data = [
            'id' => $user->ID,
            'username' => $user->user_login,
            'email' => $user->user_email,
            'display_name' => $user->display_name,
            'roles' => $user->roles,
            'capabilities' => [
                'read_private_posts' => user_can($user, 'read_private_posts'),
                'edit_posts' => user_can($user, 'edit_posts')
            ]
        ];
        
        // For multisite, add blog information
        if (is_multisite()) {
            $user_data['blogs'] = get_blogs_of_user($user->ID);
            $user_data['current_blog_id'] = get_current_blog_id();
        }
        
        return [
            'success' => true,
            'token' => $token,
            'user' => $user_data,
            'expires_in' => SIMPLE_AUTH_TOKEN_EXPIRY
        ];
    }
    
    /**
     * Handle logout request
     */
    public function logout($request) {
        $user_id = get_current_user_id();
        
        if (!$user_id) {
            return new WP_Error(
                'not_authenticated',
                'No authenticated user found',
                ['status' => 401]
            );
        }
        
        // Get token from request
        $auth_header = $request->get_header('Authorization');
        $token = null;
        
        if ($auth_header && preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
            $token = $matches[1];
        }
        
        if (!$token) {
            $token = $request->get_header('X-Auth-Token');
        }
        
        // Revoke token
        if ($token) {
            $token_manager = new Token_Manager();
            $token_manager->revoke_token($token);
        }
        
        return [
            'success' => true,
            'message' => 'Successfully logged out'
        ];
    }
    
    /**
     * Verify current token
     */
    public function verify_token($request) {
        $user_id = get_current_user_id();
        
        if (!$user_id) {
            return new WP_Error(
                'invalid_token',
                'Token is invalid or expired',
                ['status' => 401]
            );
        }
        
        $user = get_user_by('id', $user_id);
        
        return [
            'success' => true,
            'user' => [
                'id' => $user->ID,
                'username' => $user->user_login,
                'email' => $user->user_email,
                'display_name' => $user->display_name,
                'roles' => $user->roles
            ]
        ];
    }
    
    /**
     * Refresh authentication token
     */
    public function refresh_token($request) {
        $user_id = get_current_user_id();
        
        if (!$user_id) {
            return new WP_Error(
                'not_authenticated',
                'No authenticated user found',
                ['status' => 401]
            );
        }
        
        // Get current token
        $auth_header = $request->get_header('Authorization');
        $old_token = null;
        
        if ($auth_header && preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
            $old_token = $matches[1];
        }
        
        if (!$old_token) {
            $old_token = $request->get_header('X-Auth-Token');
        }
        
        // Generate new token
        $token_manager = new Token_Manager();
        $new_token = $token_manager->generate_token($user_id);
        
        if (!$new_token) {
            return new WP_Error(
                'token_generation_failed',
                'Failed to generate new token',
                ['status' => 500]
            );
        }
        
        // Revoke old token
        if ($old_token) {
            $token_manager->revoke_token($old_token);
        }
        
        return [
            'success' => true,
            'token' => $new_token,
            'expires_in' => SIMPLE_AUTH_TOKEN_EXPIRY
        ];
    }
}