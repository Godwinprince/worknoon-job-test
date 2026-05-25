(function() {
    // Check if user is logged into WordPress
    const isWpLoggedIn = document.body.classList.contains('logged-in');
    
    if (!isWpLoggedIn) {
        // Show login prompt
        console.log('Please login to use chat');
        return;
    }
    
    // Create floating button
    const createFloatingButton = () => {
        const button = document.createElement('div');
        button.id = 'wnc-chat-button';
        button.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Chat</span>
        `;
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${getComputedStyle(document.documentElement).getPropertyValue('--wnc-color') || '#3b82f6'};
            color: white;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            transition: all 0.3s;
        `;
        button.onclick = toggleChatModal;
        document.body.appendChild(button);
    };
    
    // Chat modal container
    let modal = null;
    
    const createChatModal = () => {
        const modalDiv = document.createElement('div');
        modalDiv.id = 'wnc-chat-modal';
        modalDiv.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 20px;
            width: 380px;
            height: 550px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2);
            z-index: 10000;
            display: none;
            flex-direction: column;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        `;
        
        // Chat header
        const header = document.createElement('div');
        header.style.cssText = `
            background: ${getComputedStyle(document.documentElement).getPropertyValue('--wnc-color') || '#3b82f6'};
            color: white;
            padding: 12px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 600;
        `;
        header.innerHTML = `
            <span>Chat Support</span>
            <button id="wnc-close-chat" style="background: none; border: none; color: white; cursor: pointer; font-size: 20px;">×</button>
        `;
        
        // Chat iframe to load your React app
        const iframe = document.createElement('iframe');
        iframe.src = `http://localhost:3039`/*`${wncData.backendUrl}/chat-widget`*/; // Your React chat URL
        iframe.style.cssText = `
            flex: 1;
            border: none;
            width: 100%;
        `;
        
        modalDiv.appendChild(header);
        modalDiv.appendChild(iframe);
        document.body.appendChild(modalDiv);
        
        document.getElementById('wnc-close-chat').onclick = () => {
            modalDiv.style.display = 'none';
        };
        
        return modalDiv;
    };
    
    const toggleChatModal = () => {
        if (!modal) {
            modal = createChatModal();
        }
        modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
    };
    
    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        createFloatingButton();
    });
})();