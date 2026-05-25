<?php
// REST API endpoints for WordPress integration
add_action('rest_api_init', function () {
    register_rest_route('wnc/v1', '/sync-user', array(
        'methods' => 'POST',
        'callback' => 'wnc_sync_user',
        'permission_callback' => '__return_true'
    ));
    
    register_rest_route('wnc/v1', '/get-context', array(
        'methods' => 'GET',
        'callback' => 'wnc_get_context',
        'permission_callback' => '__return_true'
    ));
    
    register_rest_route('wnc/v1', '/product-context', array(
        'methods' => 'GET',
        'callback' => 'wnc_get_product_context',
        'permission_callback' => '__return_true'
    ));
});

function wnc_sync_user($request) {
    $params = $request->get_json_params();
    $wp_user_id = get_current_user_id();
    
    if ($wp_user_id) {
        $user = get_userdata($wp_user_id);
        return rest_ensure_response(array(
            'success' => true,
            'user' => array(
                'id' => $wp_user_id,
                'name' => $user->display_name,
                'email' => $user->user_email,
                'role' => implode(', ', $user->roles)
            )
        ));
    }
    
    return rest_ensure_response(array('success' => false, 'message' => 'Not logged in'));
}

function wnc_get_context() {
    global $wp_query;
    
    $context = array(
        'page' => 'home',
        'page_id' => 0
    );
    
    if (is_shop()) {
        $context['page'] = 'shop';
    } elseif (is_product_category()) {
        $context['page'] = 'product_category';
        $context['category'] = single_cat_title('', false);
    } elseif (is_product()) {
        $context['page'] = 'product';
        $context['product_id'] = get_the_ID();
        $context['product_name'] = get_the_title();
    } elseif (is_cart()) {
        $context['page'] = 'cart';
    } elseif (is_checkout()) {
        $context['page'] = 'checkout';
    }
    
    return rest_ensure_response($context);
}

function wnc_get_product_context($request) {
    $product_id = $request->get_param('id');
    
    if ($product_id && function_exists('wc_get_product')) {
        $product = wc_get_product($product_id);
        if ($product) {
            return rest_ensure_response(array(
                'id' => $product_id,
                'name' => $product->get_name(),
                'price' => $product->get_price(),
                'image' => wp_get_attachment_url($product->get_image_id())
            ));
        }
    }
    
    return rest_ensure_response(array('error' => 'Product not found'));
}