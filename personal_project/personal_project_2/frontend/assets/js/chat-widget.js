(function() {
    // 1. Tạo HTML cho bong bóng chat
    const chatHTML = `
        <div class="chat-bubble" id="chatBubble">
            <i class="fa-solid fa-comment-dots"></i>
        </div>
        <div class="chat-window" id="chatWindow">
            <div class="chat-window-header">
                <span id="widget-partner-name">Hỗ trợ khách hàng</span>
                <button id="closeChat" style="background:none; border:none; color:white; cursor:pointer;">&times;</button>
            </div>
            <div class="chat-window-body" id="widget-chat-body"></div>
            <div class="chat-window-footer">
                <input type="text" id="widget-input" placeholder="Nhập tin nhắn...">
                <button id="widget-send" style="border:none; background:none; color:#ee4d2d; cursor:pointer;">
                    <i class="fa-solid fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', chatHTML);

    const bubble = document.getElementById('chatBubble');
    const window = document.getElementById('chatWindow');
    const closeBtn = document.getElementById('closeChat');

    bubble.onclick = () => window.classList.toggle('active');
    closeBtn.onclick = () => window.classList.remove('active');

    // Logic lấy tin nhắn và gửi tin nhắn (tương tự như messages.js của bạn)
    // Gọi API get_messages và send_message tại đây...
})();