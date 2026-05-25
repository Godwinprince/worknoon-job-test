<?php
// Register Chat Session Custom Post Type
function wnc_register_chat_session_cpt() {
    $labels = array(
        'name' => 'Chat Sessions',
        'singular_name' => 'Chat Session',
        'menu_name' => 'Chat Sessions',
        'add_new_item' => 'Add New Chat Session',
        'edit_item' => 'Edit Chat Session',
        'view_item' => 'View Chat Session',
        'all_items' => 'All Chat Sessions',
    );
    
    $args = array(
        'labels' => $labels,
        'public' => true,
        'publicly_queryable' => false,
        'show_ui' => true,
        'show_in_menu' => true,
        'query_var' => true,
        'rewrite' => array('slug' => 'chat-session'),
        'capability_type' => 'post',
        'has_archive' => false,
        'hierarchical' => false,
        'menu_position' => 30,
        'menu_icon' => 'dashicons-format-chat',
        'supports' => array('title', 'custom-fields'),
    );
    
    register_post_type('chat_session', $args);
}
add_action('init', 'wnc_register_chat_session_cpt');

// Add custom meta boxes
function wnc_add_chat_session_metabox() {
    add_meta_box(
        'wnc_chat_details',
        'Chat Details',
        'wnc_chat_details_callback',
        'chat_session',
        'normal',
        'default'
    );
}
add_action('add_meta_boxes', 'wnc_add_chat_session_metabox');

function wnc_chat_details_callback($post) {
    $participants = get_post_meta($post->ID, '_participants', true);
    $messages_count = get_post_meta($post->ID, '_messages_count', true);
    ?>
    <p><strong>Participants:</strong> <?php echo esc_html($participants); ?></p>
    <p><strong>Messages:</strong> <?php echo esc_html($messages_count); ?></p>
    <?php
}