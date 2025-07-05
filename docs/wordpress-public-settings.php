<?php
/**
 * Register public site settings for REST API
 * Add this to your WordPress theme's functions.php or create a custom plugin
 */

// Register public settings that can be accessed without authentication
function register_public_site_settings() {
    // Register the blogname (site title) as public
    register_setting('general', 'blogname', [
        'show_in_rest' => [
            'name' => 'title',
            'schema' => [
                'type' => 'string',
                'description' => 'Site title',
                'context' => ['view', 'embed']
            ]
        ],
        'type' => 'string',
        'description' => 'Site Title'
    ]);

    // Register the blogdescription (tagline) as public
    register_setting('general', 'blogdescription', [
        'show_in_rest' => [
            'name' => 'description',
            'schema' => [
                'type' => 'string',
                'description' => 'Site tagline',
                'context' => ['view', 'embed']
            ]
        ],
        'type' => 'string',
        'description' => 'Site Tagline'
    ]);

    // Register timezone settings as public
    register_setting('general', 'timezone_string', [
        'show_in_rest' => [
            'schema' => [
                'type' => 'string',
                'description' => 'Timezone string',
                'context' => ['view', 'embed']
            ]
        ],
        'type' => 'string',
        'description' => 'Timezone'
    ]);

    register_setting('general', 'gmt_offset', [
        'show_in_rest' => [
            'schema' => [
                'type' => 'number',
                'description' => 'GMT offset',
                'context' => ['view', 'embed']
            ]
        ],
        'type' => 'number',
        'description' => 'GMT Offset'
    ]);

    // Register site URL settings as public
    register_setting('general', 'siteurl', [
        'show_in_rest' => [
            'name' => 'url',
            'schema' => [
                'type' => 'string',
                'format' => 'uri',
                'description' => 'Site URL',
                'context' => ['view', 'embed']
            ]
        ],
        'type' => 'string',
        'description' => 'Site URL'
    ]);

    register_setting('general', 'home', [
        'show_in_rest' => [
            'schema' => [
                'type' => 'string',
                'format' => 'uri',
                'description' => 'Home URL',
                'context' => ['view', 'embed']
            ]
        ],
        'type' => 'string',
        'description' => 'Home URL'
    ]);
}
add_action('init', 'register_public_site_settings');

// Create a custom REST endpoint for public site info
function register_public_site_info_endpoint() {
    register_rest_route('site-info/v1', '/public', [
        'methods' => 'GET',
        'callback' => 'get_public_site_info',
        'permission_callback' => '__return_true', // Make it public
        'args' => []
    ]);
}
add_action('rest_api_init', 'register_public_site_info_endpoint');

// Callback function for the custom endpoint
function get_public_site_info($request) {
    // Get custom logo URL if available
    $custom_logo_id = get_theme_mod('custom_logo');
    $logo_url = null;
    
    if ($custom_logo_id) {
        $logo_data = wp_get_attachment_image_src($custom_logo_id, 'full');
        if ($logo_data) {
            $logo_url = $logo_data[0];
        }
    }

    return [
        'name' => get_option('blogname'),
        'description' => get_option('blogdescription'), // This is the tagline!
        'url' => get_option('siteurl'),
        'home' => get_option('home'),
        'gmt_offset' => get_option('gmt_offset'),
        'timezone_string' => get_option('timezone_string'),
        'site_logo' => $logo_url,
        // Add any other public info you want to expose
        'language' => get_locale(),
        'date_format' => get_option('date_format'),
        'time_format' => get_option('time_format')
    ];
}

// Alternative: Make specific settings accessible via the standard settings endpoint
// This requires modifying the REST API permissions
function allow_public_access_to_settings($allowed, $meta_key, $object_type, $sub_type) {
    // List of settings that should be publicly accessible
    $public_settings = [
        'blogname',
        'blogdescription',
        'siteurl',
        'home',
        'timezone_string',
        'gmt_offset'
    ];
    
    if (in_array($meta_key, $public_settings)) {
        return true;
    }
    
    return $allowed;
}
// Uncomment this line if you want to use this approach
// add_filter('rest_pre_get_setting', 'allow_public_access_to_settings', 10, 4);