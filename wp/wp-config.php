<?php

/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the web site, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * Localized language
 * * ABSPATH
 *
 * @link https://wordpress.org/support/article/editing-wp-config-php/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'u598898806_vk90v' );

/** Database username */
define( 'DB_USER', 'u598898806_odj3w' );

/** Database password */
define( 'DB_PASSWORD', 'rW0SeRnESS' );

/** Database hostname */
define( 'DB_HOST', '127.0.0.1' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',          'y3E]>,}4_m0/AC+fxQu63#g0FMX!Le4to#^A^l$;w6uPQGt!.Z/F}elN.hvG)h%F' );
define( 'SECURE_AUTH_KEY',   'H96ds`([D#S=jWUp.FxTd>4Bk`yTv+,E8dZY}gIaqbk<x 82mZD4ZY^k}A{aAn&a' );
define( 'LOGGED_IN_KEY',     '|@|r$bHs6B+Rd>V1Ck~9%y4ounCci@oIvEm&nf+nkdb;.ICWl*ghY/)h9?H*3I/B' );
define( 'NONCE_KEY',         '?.a *tWsO_+@Nl$h =O+MQsqtoS~>~0yiSS>(e7@ywT%D6NabrcsB[fm34|3A#:r' );
define( 'AUTH_SALT',         'T^^R8?$Rq2+ao ap zH]433QO(:5+9LYo><]VA*K|?xC=;_b@|OQi%XkyKXgk<4*' );
define( 'SECURE_AUTH_SALT',  '(.E!9e8mye1-WytT0,4O&JBXp?y$T8qHcsat75,J4)rP1%0n@uV-|wJ|1c..@+H)' );
define( 'LOGGED_IN_SALT',    'vg@jBs:~}#X>V4RQxoj{,f1*2i iWyIhO??6N//w,SV_niQ` K^s(jv$#DZeCw[N' );
define( 'NONCE_SALT',        'w(p#7VDhK-PfOrjCk1^dlQIL(X9x%GVMdd}N`P=V8X60j[/7eQa5Sc)6B9)&iF:&' );
define( 'WP_CACHE_KEY_SALT', ')+lvPB%,EQK!*=aK]GXI2StJRxp2IwgrQ&|F7)i^  `D(ak5{{nIrKIn{%Bz hz~' );


/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'wp_';


/* Add any custom values between this line and the "stop editing" line. */
define( 'WP_ALLOW_MULTISITE', true );
define( 'MULTISITE', true );
define( 'SUBDOMAIN_INSTALL', false );
define( 'DOMAIN_CURRENT_SITE', 'wpcms.thechief.com' );
define( 'PATH_CURRENT_SITE', '/' );
define( 'SITE_ID_CURRENT_SITE', 1 );
define( 'BLOG_ID_CURRENT_SITE', 1 );

define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
define('JWT_AUTH_SECRET_KEY', 'ztA5~PFxIoBpL<}g!0D~hyi2RQ;wsCxQp)(T?ci@a@AnEv-ih|b[)B ^aW+^P-Gc');
define('JWT_AUTH_CORS_ENABLE', true);

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://wordpress.org/support/article/debugging-in-wordpress/
 */
if ( ! defined( 'WP_DEBUG' ) ) {
	define( 'WP_DEBUG', false );
}

define( 'FS_METHOD', 'direct' );
define( 'COOKIEHASH', '7398dfffdb71bbe24083c806e24930ae' );
define( 'WP_AUTO_UPDATE_CORE', 'minor' );
/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
