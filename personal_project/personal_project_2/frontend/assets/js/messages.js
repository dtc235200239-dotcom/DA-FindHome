/**
 * messages.js – Chat frontend logic
 * Connects to index.php router via fetch API
 */

const API_BASE = 'http://localhost:8080/MY_PROJECT/personal_project/personal_project_2/backend/public/index.php';

const state = {
    currentUserId:     null,
    currentConvUserId: null,
    currentHouseId:    null,
    currentConvName:   '',
    page:              1,
    isLoading:         false,
    pollInterval:      null,
    lastMessageId:     0,
};

// ─── Utility ─────────────────────────────────────────────────────────────────

async function api(action, params = {}) {
    const url = new URL(API_BASE, window.location.origin);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
    const r    = await fetch(url);
    const text = await r.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error(`[api] action="${action}" – server không trả JSON:`, text.slice(0, 300));
        return { status: 'error', message: 'Server không trả về JSON hợp lệ' };
    }
}

async function apiPost(action, body = {}) {
    const url = new URL(API_BASE, window.location.origin);
    url.searchParams.set('action', action);
    const r    = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
    });
    const text = await r.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error(`[apiPost] action="${action}" – server không trả JSON:`, text.slice(0, 300));
        return { status: 'error', message: 'Server không trả về JSON hợp lệ' };
    }
}

function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr) {
    const d         = new Date(dateStr);
    const today     = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString())     return 'Hôm nay';
    if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua';
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60)    return 'Vừa xong';
    if (diff < 3600)  return Math.floor(diff / 60)  + ' phút';
    if (diff < 86400) return Math.floor(diff / 3600) + ' giờ';
    return formatDate(dateStr);
}

function avatarHTML(name, avatarUrl, size = 46) {
    if (avatarUrl) {
        return `<img src="/backend/public/uploads/${avatarUrl}" alt="${escapeHtml(name)}"
                     style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;">`;
    }
    const initial = (name || '?').charAt(0).toUpperCase();
    return `<div class="avatar-placeholder" style="width:${size}px;height:${size}px;">${initial}</div>`;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function showToast(msg) {
    let t = document.getElementById('global-toast');
    if (!t) {
        t = document.createElement('div');
        t.id        = 'global-toast';
        t.className = 'toast';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2800);
}

// ✅ Helper tập trung — so sánh string để tránh bug "1" !== 1
function isMine(senderId) {
    return String(senderId) === String(state.currentUserId);
}

// ─── Sidebar – Conversations ──────────────────────────────────────────────────

async function loadConversations() {
    const list = document.getElementById('conv-list');
    list.innerHTML = '<div class="loading-spinner">⏳ Đang tải...</div>';
    try {
        const res = await api('get_conversations', { user_id: state.currentUserId });
        if (res.status !== 'success') {
            list.innerHTML = '<div class="conv-item-no-data">Không thể tải hội thoại</div>';
            return;
        }
        if (!res.data || !res.data.length) {
            list.innerHTML = '<div class="conv-item-no-data">💬 Chưa có tin nhắn nào</div>';
            return;
        }
        list.innerHTML = res.data.map(conv => {
            const name     = conv.partner_name || 'Người dùng';
            const preview  = escapeHtml((conv.last_msg || '').slice(0, 50));
            const unread   = parseInt(conv.unread) || 0;
            const isActive = conv.partner_id == state.currentConvUserId;
            return `
            <div class="conv-item ${isActive ? 'active' : ''}"
                 data-user-id="${conv.partner_id}"
                 data-house-id="${conv.house_id || ''}"
                 data-name="${escapeHtml(name)}"
                 onclick="openConversation(this)">
                <div class="conv-avatar">${avatarHTML(name, conv.avatar)}</div>
                <div class="conv-info">
                    <div class="conv-info-top">
                        <span class="conv-name">${escapeHtml(name)}</span>
                        <span class="conv-time">${timeAgo(conv.created_at || '')}</span>
                    </div>
                    <div class="conv-preview ${unread > 0 ? 'unread' : ''}">${preview}</div>
                    ${conv.house_name
                        ? `<div class="conv-house-tag">🏠 ${escapeHtml(conv.house_name)}</div>`
                        : ''}
                </div>
                ${unread > 0 ? `<span class="conv-badge">${unread}</span>` : ''}
            </div>`;
        }).join('');
    } catch (e) {
        list.innerHTML = '<div class="conv-item-no-data">Lỗi kết nối</div>';
    }
}

// ─── Open Conversation ────────────────────────────────────────────────────────

async function openConversation(el) {
    const userId  = el.dataset.userId;
    const houseId = el.dataset.houseId || null;
    const name    = el.dataset.name;

    state.currentConvUserId = userId;
    state.currentHouseId    = houseId;
    state.currentConvName   = name;
    state.page              = 1;
    state.lastMessageId     = 0;

    document.querySelectorAll('.conv-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');

    document.getElementById('chat-header-avatar').innerHTML =
        el.querySelector('.conv-avatar').innerHTML;
    document.getElementById('chat-header-name').textContent = name;
    document.getElementById('chat-header-sub').textContent  =
        houseId ? '🏠 Về bất động sản' : 'Trực tiếp';

    const houseBar = document.getElementById('house-info-bar');
    if (houseId) {
        houseBar.style.display = 'flex';
        houseBar.querySelector('.house-title').textContent =
            el.querySelector('.conv-house-tag')?.textContent?.replace('🏠 ', '') || 'Bất động sản';
    } else {
        houseBar.style.display = 'none';
    }

    document.getElementById('no-conv').style.display   = 'none';
    document.getElementById('chat-area').style.display = 'flex';

    await loadMessages(true);
    clearInterval(state.pollInterval);
    state.pollInterval = setInterval(pollNewMessages, 3000);
    document.getElementById('msg-input').focus();
}

// ─── Build Message Row ────────────────────────────────────────────────────────
// Tách ra 1 function để cả renderMessages và renderSingleMessage dùng chung

function buildMessageRow(msg, lastSenderId) {
    const mine        = isMine(msg.sender_id);
    const consecutive = String(lastSenderId) === String(msg.sender_id);

    const row = document.createElement('div');
    // ✅ class "me"  → bubble bên PHẢI (tin của mình)
    // ✅ không "me"  → bubble bên TRÁI (tin đối phương)
    row.className        = `msg-row${mine ? ' me' : ''}${consecutive ? ' consecutive' : ''}`;
    row.dataset.msgId    = msg.id;
    row.dataset.senderId = msg.sender_id;

    // Avatar chỉ hiện bên trái (đối phương)
    const avatarEl = mine ? '' : `
        <div class="msg-avatar ${msg.sender_avatar ? '' : 'placeholder'}">
            ${msg.sender_avatar
                ? `<img src="/backend/public/uploads/${msg.sender_avatar}"
                        style="width:32px;height:32px;border-radius:50%;object-fit:cover;">`
                : (msg.sender_name || '?').charAt(0).toUpperCase()}
        </div>`;

    const statusIcon = mine
        ? `<span class="msg-status ${msg.is_read == 1 ? 'read' : ''}">
               ${msg.is_read == 1 ? '✓✓' : '✓'}
           </span>`
        : '';

    row.innerHTML = `
        ${avatarEl}
        <div class="msg-content-wrap">
            <div class="msg-bubble">
                ${escapeHtml(msg.content)}
                <div class="msg-options">
                    ${mine
                        ? `<button class="msg-opt-btn"
                                   onclick="deleteMessage(${msg.id}, this)">🗑️</button>`
                        : ''}
                </div>
            </div>
            <div class="msg-meta">
                <span class="msg-time">${formatTime(msg.created_at)}</span>
                ${statusIcon}
            </div>
        </div>`;

    return row;
}

// ─── Load & Render Messages ───────────────────────────────────────────────────

async function loadMessages(scrollToBottom = false) {
    if (state.isLoading) return;
    state.isLoading = true;

    const container = document.getElementById('msg-container');
    if (scrollToBottom) container.innerHTML = '<div class="loading-spinner">⏳</div>';

    try {
        const res = await api('get_messages', {
            user_id:    state.currentUserId,
            partner_id: state.currentConvUserId,
            house_id:   state.currentHouseId,
            page:       state.page,
        });

        if (res.status !== 'success') return;

        const msgs = res.data;
        if (!msgs.length && state.page === 1) {
            container.innerHTML = `
                <div class="chat-empty">
                    <div class="chat-empty-icon">💬</div>
                    <h3>Bắt đầu cuộc trò chuyện</h3>
                    <p>Gửi tin nhắn đầu tiên để kết nối với ${escapeHtml(state.currentConvName)}</p>
                </div>`;
            return;
        }

        renderMessages(msgs, scrollToBottom);
        if (msgs.length) state.lastMessageId = Math.max(...msgs.map(m => m.id));

        const activeConv = document.querySelector('.conv-item.active');
        if (activeConv) {
            activeConv.querySelector('.conv-badge')?.remove();
            activeConv.querySelector('.conv-preview')?.classList.remove('unread');
        }
    } catch (e) {
        console.error('loadMessages error:', e);
    } finally {
        state.isLoading = false;
    }
}

function renderMessages(msgs, scrollToBottom) {
    const container    = document.getElementById('msg-container');
    if (scrollToBottom) container.innerHTML = '';

    let lastDate       = '';
    let lastSenderId   = null;
    const scrollPos    = container.scrollTop;
    const scrollHeight = container.scrollHeight;

    msgs.forEach(msg => {
        const dateStr = formatDate(msg.created_at);
        if (dateStr !== lastDate) {
            container.insertAdjacentHTML('beforeend',
                `<div class="date-separator"><span>${dateStr}</span></div>`);
            lastDate = dateStr;
        }
        container.appendChild(buildMessageRow(msg, lastSenderId));
        lastSenderId = msg.sender_id;
    });

    if (scrollToBottom) {
        container.scrollTop = container.scrollHeight;
    } else {
        container.scrollTop = container.scrollHeight - scrollHeight + scrollPos;
    }
}

function renderSingleMessage(msg, container) {
    const lastRow    = container.querySelector('.msg-row:last-of-type');
    const lastSender = lastRow ? lastRow.dataset.senderId : null;
    container.appendChild(buildMessageRow(msg, lastSender));
}

// ─── Poll New Messages ────────────────────────────────────────────────────────

async function pollNewMessages() {
    if (!state.currentConvUserId) return;
    try {
        const res = await api('get_messages', {
            user_id:    state.currentUserId,
            partner_id: state.currentConvUserId,
            house_id:   state.currentHouseId,
            page:       1,
        });
        if (res.status !== 'success' || !res.data.length) return;

        const newMsgs = res.data.filter(m => m.id > state.lastMessageId);
        if (!newMsgs.length) return;

        const container  = document.getElementById('msg-container');
        container.querySelector('.chat-empty')?.remove();
        const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 60;

        newMsgs.forEach(msg => {
            if (!container.querySelector(`[data-msg-id="${msg.id}"]`)) {
                renderSingleMessage(msg, container);
            }
        });

        state.lastMessageId = Math.max(state.lastMessageId, ...newMsgs.map(m => m.id));
        if (isAtBottom) container.scrollTop = container.scrollHeight;
        loadConversations();
    } catch (e) {}
}

// ─── Send Message ─────────────────────────────────────────────────────────────

async function sendMessage() {
    const input   = document.getElementById('msg-input');
    const content = input.value.trim();
    if (!content || !state.currentConvUserId) return;

    const sendBtn      = document.getElementById('send-btn');
    sendBtn.disabled   = true;
    input.value        = '';
    input.style.height = 'auto';

    // ✅ sender_id = currentUserId → isMine() = true → bubble bên PHẢI
    const tempMsg = {
        id:          'temp_' + Date.now(),
        sender_id:   state.currentUserId,
        receiver_id: state.currentConvUserId,
        content,
        is_read:     0,
        created_at:  new Date().toISOString(),
    };

    const container = document.getElementById('msg-container');
    container.querySelector('.chat-empty')?.remove();
    renderSingleMessage(tempMsg, container);
    container.scrollTop = container.scrollHeight;

    try {
        const res = await apiPost('send_message', {
            sender_id:   state.currentUserId,
            receiver_id: state.currentConvUserId,
            content,
            house_id:    state.currentHouseId || null,
        });

        if (res.status === 'success') {
            const tempRow = container.querySelector(`[data-msg-id="${tempMsg.id}"]`);
            if (tempRow && res.data?.id) {
                tempRow.dataset.msgId = res.data.id;
                state.lastMessageId   = Math.max(state.lastMessageId, res.data.id);
            }
            loadConversations();
        } else {
            showToast('❌ Không gửi được tin nhắn');
            container.querySelector(`[data-msg-id="${tempMsg.id}"]`)?.remove();
        }
    } catch (e) {
        showToast('❌ Lỗi kết nối');
        container.querySelector(`[data-msg-id="${tempMsg.id}"]`)?.remove();
    } finally {
        sendBtn.disabled = false;
        input.focus();
    }
}

// ─── Delete Message ───────────────────────────────────────────────────────────

async function deleteMessage(msgId, btn) {
    if (!confirm('Xóa tin nhắn này?')) return;
    try {
        const res = await apiPost('delete_message', {
            message_id: msgId,
            user_id:    state.currentUserId,
        });
        if (res.status === 'success') {
            const row = btn.closest('.msg-row');
            row.style.opacity    = '0';
            row.style.transform  = 'scale(0.9)';
            row.style.transition = 'all 0.2s';
            setTimeout(() => row.remove(), 200);
        } else {
            showToast('❌ Không thể xóa');
        }
    } catch (e) {
        showToast('❌ Lỗi kết nối');
    }
}

// ─── Unread Badge ─────────────────────────────────────────────────────────────

async function updateUnreadBadge() {
    try {
        const res = await api('get_unread', { user_id: state.currentUserId });
        if (res.status === 'success' && res.unread > 0) {
            const badge = document.getElementById('unread-nav-badge');
            if (badge) badge.textContent = res.unread;
        }
    } catch (e) {}
}

// ─── Filter Conversations ─────────────────────────────────────────────────────

function filterConversations(query) {
    document.querySelectorAll('.conv-item').forEach(item => {
        const name = item.dataset.name || '';
        item.style.display =
            name.toLowerCase().includes(query.toLowerCase()) ? '' : 'none';
    });
}

// ─── Input Auto-resize ────────────────────────────────────────────────────────

function setupInput() {
    const input = document.getElementById('msg-input');
    if (!input) return;
    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

// ─── Load More on Scroll ──────────────────────────────────────────────────────

function setupScrollLoad() {
    const container = document.getElementById('msg-container');
    if (!container) return;
    container.addEventListener('scroll', () => {
        if (container.scrollTop < 80 && !state.isLoading) {
            state.page++;
            loadMessages(false);
        }
    });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init() {
    const meta = document.querySelector('meta[name="user-id"]');
    state.currentUserId = meta ? meta.content : null;

    if (!state.currentUserId) {
        console.error('Không tìm thấy user-id. Kiểm tra <meta name="user-id"> trong HTML.');
    }

    setupInput();
    setupScrollLoad();
    loadConversations();
    updateUnreadBadge();

    const searchEl = document.getElementById('conv-search');
    if (searchEl) {
        searchEl.addEventListener('input', e => filterConversations(e.target.value));
    }

    const params        = new URLSearchParams(window.location.search);
    const targetUserId  = params.get('user');
    const targetHouseId = params.get('house');

    if (targetUserId) {
        setTimeout(async () => {
            const item = document.querySelector(`.conv-item[data-user-id="${targetUserId}"]`);
            if (item) {
                openConversation(item);
            } else {
                state.currentConvUserId = targetUserId;
                state.currentHouseId   = targetHouseId;
                state.currentConvName  = 'Người dùng';

                document.getElementById('no-conv').style.display   = 'none';
                document.getElementById('chat-area').style.display = 'flex';
                document.getElementById('chat-header-name').textContent = 'Người dùng';
                document.getElementById('chat-header-sub').textContent  =
                    targetHouseId ? '🏠 Về bất động sản' : 'Trực tiếp';
                document.getElementById('house-info-bar').style.display =
                    targetHouseId ? 'flex' : 'none';

                await loadMessages(true);
                state.pollInterval = setInterval(pollNewMessages, 3000);
                document.getElementById('msg-input').focus();
            }
        }, 400);
    }
}

document.addEventListener('DOMContentLoaded', init);

// ─── New Conversation Modal ───────────────────────────────────────────────────

function openNewConvModal() {
    document.getElementById('new-conv-modal').style.display = 'flex';
    document.getElementById('user-search-input').value      = '';
    document.getElementById('user-search-results').innerHTML =
        '<div class="search-hint">Nhập tên để tìm kiếm</div>';
    setTimeout(() => document.getElementById('user-search-input').focus(), 100);
}

function closeNewConvModal() {
    document.getElementById('new-conv-modal').style.display = 'none';
}

let searchTimer = null;
function searchUsers(query) {
    clearTimeout(searchTimer);
    const results = document.getElementById('user-search-results');
    if (!query.trim()) {
        results.innerHTML = '<div class="search-hint">Nhập tên để tìm kiếm</div>';
        return;
    }
    results.innerHTML = '<div class="search-hint">⏳ Đang tìm...</div>';
    searchTimer = setTimeout(async () => {
        try {
            const res = await api('search_users', {
                q:       query,
                user_id: state.currentUserId,
            });
            if (res.status !== 'success' || !res.data.length) {
                results.innerHTML = '<div class="search-hint">Không tìm thấy người dùng</div>';
                return;
            }
            results.innerHTML = res.data.map(u => `
                <div class="user-result-item"
                     onclick="startConversation(${u.id}, '${escapeHtml(u.username)}')">
                    <div class="user-result-avatar">${avatarHTML(u.username, null, 38)}</div>
                    <div class="user-result-info">
                        <div class="user-result-name">${escapeHtml(u.username)}</div>
                        <div class="user-result-email">${escapeHtml(u.email || '')}</div>
                    </div>
                </div>`).join('');
        } catch (e) {
            results.innerHTML = '<div class="search-hint">Lỗi kết nối</div>';
        }
    }, 350);
}

function startConversation(userId, userName) {
    closeNewConvModal();

    state.currentConvUserId = userId;
    state.currentHouseId    = null;
    state.currentConvName   = userName;
    state.page              = 1;
    state.lastMessageId     = 0;

    document.getElementById('chat-header-avatar').innerHTML = avatarHTML(userName, null, 40);
    document.getElementById('chat-header-name').textContent = userName;
    document.getElementById('chat-header-sub').textContent  = 'Trực tiếp';
    document.getElementById('house-info-bar').style.display = 'none';
    document.getElementById('no-conv').style.display        = 'none';
    document.getElementById('chat-area').style.display      = 'flex';

    document.querySelectorAll('.conv-item').forEach(i => {
        i.classList.toggle('active', i.dataset.userId == userId);
    });

    loadMessages(true);
    clearInterval(state.pollInterval);
    state.pollInterval = setInterval(pollNewMessages, 3000);
    document.getElementById('msg-input').focus();
}