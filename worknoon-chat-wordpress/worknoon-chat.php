<?php
/**
 * Plugin Name: Worknoon Chat
 * Description: Real-time chat widget for eCommerce platforms
 * Version: 1.0.0
 * Author: Worknoon
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define constants
define('WNC_PLUGIN_URL', plugin_dir_url(__FILE__));
define('WNC_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('WNC_BACKEND_URL', 'http://localhost:5000'); // Change to your backend URL
//define('WNC_BACKEND_URL', 'http://127.0.0.1:5000');
// Enqueue scripts
function wnc_enqueue_scripts() {
    // Only load on pages that need chat
    if (!is_admin()) {
        wp_enqueue_script('wnc-socket', 'https://cdn.socket.io/4.5.4/socket.io.min.js', array(), null, true);
        wp_enqueue_script('wnc-chat-widget', WNC_PLUGIN_URL . 'assets/chat-widget.js', array('wnc-socket'), '1.0.0', true);
        wp_enqueue_style('wnc-chat-style', WNC_PLUGIN_URL . 'assets/chat-widget.css', array(), '1.0.0');
        
        // Pass data to JavaScript
        wp_localize_script('wnc-chat-widget', 'wncData', array(
            'backendUrl' => WNC_BACKEND_URL,
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('wnc_nonce')
        ));
    }
}
add_action('wp_enqueue_scripts', 'wnc_enqueue_scripts');

// Include required files
require_once WNC_PLUGIN_PATH . 'includes/cpt.php';
require_once WNC_PLUGIN_PATH . 'includes/shortcode.php';
require_once WNC_PLUGIN_PATH . 'includes/rest-api.php';

// Create database table on activation
function wnc_activate() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'chat_sessions';
    
    $charset_collate = $wpdb->get_charset_collate();
    
    $sql = "CREATE TABLE IF NOT EXISTS $table_name (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        user_id varchar(100) NOT NULL,
        conversation_id varchar(100) NOT NULL,
        session_token text NOT NULL,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}
register_activation_hook(__FILE__, 'wnc_activate');

// Add admin menu
function wnc_admin_menu() {
    add_menu_page(
        'Chat Settings',
        'Worknoon Chat',
        'manage_options',
        'worknoon-chat',
        'wnc_admin_page',
        'dashicons-format-chat',
        30
    );
}
add_action('admin_menu', 'wnc_admin_menu');

// Admin page callback
function wnc_admin_page() {
    ?>
    <div class="wrap">
        <h1>Worknoon Chat Settings</h1>
        <form method="post" action="options.php">
            <?php settings_fields('wnc_settings_group'); ?>
            <table class="form-table">
                <tr>
                    <th scope="row">Backend URL</th>
                    <td>
                        <input type="text" name="wnc_backend_url" value="<?php echo esc_attr(get_option('wnc_backend_url', 'http://localhost:5000')); ?>" class="regular-text" />
                        <p class="description">Your Node.js backend URL (e.g., http://localhost:5000 or https://your-api.com)</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Chat Title</th>
                    <td>
                        <input type="text" name="wnc_chat_title" value="<?php echo esc_attr(get_option('wnc_chat_title', 'Support Chat')); ?>" class="regular-text" />
                    </td>
                </tr>
                <tr>
                    <th scope="row">Primary Color</th>
                    <td>
                        <input type="color" name="wnc_primary_color" value="<?php echo esc_attr(get_option('wnc_primary_color', '#3b82f6')); ?>" />
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
        
        <hr />
        
        <h2>Shortcode Usage</h2>
        <p>Add this shortcode to any page or post:</p>
        <code>[worknoon_chat]</code>
        
        <h3>Or use as floating widget</h3>
        <p>The chat widget will automatically appear as a floating button on all pages when logged in.</p>
    </div>
    <?php
}

// Register settings
function wnc_register_settings() {
    register_setting('wnc_settings_group', 'wnc_backend_url');
    register_setting('wnc_settings_group', 'wnc_chat_title');
    register_setting('wnc_settings_group', 'wnc_primary_color');
}
add_action('admin_init', 'wnc_register_settings');

// Add floating widget button
function wnc_add_floating_button() {
    if (!is_admin()) {
        echo '<div id="wnc-chat-widget-container"></div>';
    }
}
add_action('wp_footer', 'wnc_add_floating_button');