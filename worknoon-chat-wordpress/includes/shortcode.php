<?php
// Shortcode to display chat widget
function wnc_chat_shortcode($atts) {
    $atts = shortcode_atts(array(
        'title' => get_option('wnc_chat_title', 'Support Chat'),
        'height' => '500px',
        'width' => '100%',
    ), $atts);
    
    $primary_color = get_option('wnc_primary_color', '#3b82f6');
    
    ob_start();
    ?>
    <div class="wnc-chat-container" style="width: <?php echo esc_attr($atts['width']); ?>; height: <?php echo esc_attr($atts['height']); ?>;">
        <div id="wnc-chat-root" data-title="<?php echo esc_attr($atts['title']); ?>" data-color="<?php echo esc_attr($primary_color); ?>"></div>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('worknoon_chat', 'wnc_chat_shortcode');