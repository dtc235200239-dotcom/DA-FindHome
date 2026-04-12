'use strict';

/* =====================================================
   dashboard.js - PHIÊN BẢN ĐÃ CẬP NHẬT PHÂN TRANG
   ===================================================== */

const API_BASE = 'http://localhost:8080/MY_PROJECT/personal_project/personal_project_2/backend/public/index.php';
const FALLBACK = '../assets/images/nha_so_1.jpg';
const BASE_URL = 'http://localhost:8080/MY_PROJECT/personal_project/personal_project_2/backend';

// Biến quản lý trang hiện tại
let currentPage = 1;

// =====================================================
// KIỂM TRA SESSION
// =====================================================
const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user')); }
    catch { return null; }
})();

if (!currentUser) {
    alert('Vui lòng đăng nhập!');
    window.location.href = '../index.html';
}

// Hiển thị thông tin User
document.getElementById('username-display').textContent = currentUser.username || 'Bạn';
document.getElementById('user-dropdown-name').textContent = currentUser.username || 'Bạn';
document.getElementById('user-dropdown-email').textContent = currentUser.email || '';
document.getElementById('welcome-name').textContent = currentUser.username || 'bạn';
const firstLetter = (currentUser.username || 'U')[0].toUpperCase();
document.getElementById('user-avatar-letter').textContent = firstLetter;

// =====================================================
// SỰ KIỆN GIAO DIỆN (BANNER, DROPDOWN, LOGOUT)
// =====================================================
document.getElementById('welcome-close').addEventListener('click', () => {
    document.getElementById('dashboard-welcome').style.display = 'none';
});

document.getElementById('welcome-post-link').addEventListener('click', () => {
    window.location.href = './user.html';
});

document.getElementById('btn-go-post').addEventListener('click', () => {
    window.location.href = './user.html';
});

document.getElementById('btn-logout').addEventListener('click', async () => {
    try { await fetch(`${API_BASE}?action=logout`, { method: 'POST' }); } catch (_) { }
    localStorage.removeItem('user');
    window.location.href = '../index.html';
});

const userMenuToggle = document.getElementById('user-menu-toggle');
const userDropdown = document.getElementById('user-dropdown');

userMenuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('user-dropdown--open');
});

document.addEventListener('click', () => {
    userDropdown.classList.remove('user-dropdown--open');
});

document.getElementById('dd-my-posts').addEventListener('click', () => {
    window.location.href = './user.html?tab=my-posts';
});

// =====================================================
// LOGIC RENDER DANH SÁCH NHÀ (CÓ PHÂN TRANG)
// =====================================================

/**
 * Hàm tải dữ liệu từ server theo trang và bộ lọc
 * @param {number} page - Trang cần tải
 */
async function loadHouses(page = 1) {
    currentPage = page;
    const grid = document.getElementById('product-grid');
    grid.innerHTML = `<p style="color:#888;font-size:1.4rem;padding:20px 0">Đang tải...</p>`;

    const area = document.getElementById('search-area').value;
    const keyword = document.getElementById('search-input').value.trim();

    try {
        // Gửi tham số page, area, keyword lên server
        const url = `${API_BASE}?action=get_houses&page=${page}&area=${area}&keyword=${encodeURIComponent(keyword)}`;
        const res = await fetch(url);
        const result = await res.json();

        if (result.status === 'success') {
            const list = result.data || [];

            if (list.length === 0) {
                grid.innerHTML = `<p style="color:#888;font-size:1.4rem;padding:20px 0;width:100%;text-align:center">
                    Không tìm thấy phòng nào phù hợp.</p>`;
                renderPagination(0, 0); // Xóa phân trang nếu không có kết quả
                return;
            }

            // Vẽ danh sách Card
            grid.innerHTML = list.map(h => createHouseCard(h)).join('');

            // Vẽ các nút phân trang
            renderPagination(result.total_pages, result.current_page);
        }
    } catch (err) {
        console.error('loadHouses error:', err);
        grid.innerHTML = `<p style="color:#e53e3e;font-size:1.4rem;padding:20px 0">Lỗi kết nối server!</p>`;
    }
}

/**
 * Hàm tạo HTML cho từng card nhà
 */
function createHouseCard(h) {
    let imgUrl = FALLBACK;

    if (h.primary_img) {
        if (h.primary_img.startsWith('http')) {
            imgUrl = h.primary_img;
        } else {
            // DB lưu /public/uploads/... nên ghép thẳng vào BASE_URL là đúng
            imgUrl = `${BASE_URL}${h.primary_img}`;
        }
    }

    const isSaved = savedList.some(i => i.id == h.id);
    const tagsHTML = Array.isArray(h.tags)
        ? h.tags.slice(0, 3).map(t => `<span class="product-card__tag">${t}</span>`).join('')
        + (h.tags.length > 3 ? `<span class="product-card__tag product-card__tag--more">+${h.tags.length - 3}</span>` : '')
        : '';

    return `
    <div class="product-card">
        <div class="product-card__img-wrap">
            <img src="${imgUrl}" alt="${h.name}" class="product-card__img" onerror="this.src='${FALLBACK}'">
            <button class="product-card__save-btn ${isSaved ? 'active' : ''}" data-id="${h.id}" aria-label="Lưu">
                <i class="${isSaved ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
            </button>
            ${h.verified == 1 ? `<span class="product-card__badge">✓ Đã xác thực</span>` : ''}
        </div>
        <div class="product-card__body">
            <div class="product-card__meta">
                <span class="product-card__district">${h.district || h.area || ''}</span>
                ${h.rating ? `<span class="product-card__rating">${h.rating} ★</span>` : ''}
            </div>
            <h3 class="product-card__name">${h.name}</h3>
            <p class="product-card__address"><i class="fa-solid fa-location-dot"></i> ${h.address || ''}</p>
            <div class="product-card__price-row">
                <span class="product-card__price">${Number(h.price || 0).toLocaleString('vi-VN')}đ<span class="product-card__price-unit">/tháng</span></span>
                <span class="product-card__area">${h.area_m2 || 0}m²</span>
            </div>
            <div class="product-card__tags">${tagsHTML}</div>
            <div class="product-card__actions">
                <button class="product-card__btn product-card__btn--primary btn-call" data-phone="${h.phone || ''}">
                    <i class="fa-solid fa-phone"></i> Gọi điện
                </button>
                <button class="product-card__btn product-card__btn--outline" onclick="startChat(${h.id}, ${h.user_id}, '${h.name.replace(/'/g, "\\'")}')">
                    <i class="fa-regular fa-comment-dots"></i> Chat
                </button>
            </div>
        </div>
    </div>`;
}

/**
 * Hàm vẽ các nút phân trang
 */
function renderPagination(totalPages, current) {
    const container = document.getElementById('pagination-container');
    if (!container) return;
    if (totalPages <= 1) { container.innerHTML = ''; return; }

    let html = '';

    // Nút Lùi (Previous)
    html += `<button class="page-btn" ${current === 1 ? 'disabled' : ''} 
                onclick="loadHouses(${current - 1})">
                <i class="fa-solid fa-angle-left"></i>
             </button>`;

    // Các nút số trang
    for (let i = 1; i <= totalPages; i++) {
        // Kiểm tra nếu i bằng trang hiện tại thì thêm class 'active'
        const activeClass = (i === current) ? 'active' : '';
        html += `<button class="page-btn ${activeClass}" 
                    onclick="loadHouses(${i})">${i}
                 </button>`;
    }

    // Nút Tiến (Next)
    html += `<button class="page-btn" ${current === totalPages ? 'disabled' : ''} 
                onclick="loadHouses(${current + 1})">
                <i class="fa-solid fa-angle-right"></i>
             </button>`;

    container.innerHTML = html;
}

// =====================================================
// TÌM KIẾM
// =====================================================
const searchInput = document.getElementById('search-input');
const searchArea = document.getElementById('search-area');
const btnSearch = document.getElementById('btn-search');

function doSearch() {
    loadHouses(1); // Luôn về trang 1 khi tìm kiếm mới
}

btnSearch.addEventListener('click', doSearch);
searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
searchArea.addEventListener('change', doSearch);

// =====================================================
// YÊU THÍCH (SAVED HOUSES)
// =====================================================
let savedList = JSON.parse(localStorage.getItem('saved_houses') || '[]');
const cartEl = document.getElementById('cart-el');
const savedDropdown = document.getElementById('saved-dropdown');

function updateSavedCount() {
    document.getElementById('saved-count').textContent = savedList.length;
    document.getElementById('dd-saved-count').textContent = savedList.length;
    localStorage.setItem('saved_houses', JSON.stringify(savedList));
}

function renderSavedDropdown() {
    if (savedList.length === 0) {
        savedDropdown.innerHTML = `<p class="header__saved-empty">Chưa có phòng nào được lưu</p>`;
        return;
    }
    savedDropdown.innerHTML = savedList.map(item => `
        <div class="header__saved-item">
            <img src="${item.img}" class="header__saved-img" onerror="this.src='${FALLBACK}'">
            <div class="header__saved-info">
                <span class="header__saved-name">${item.name}</span>
                <span class="header__saved-price">${item.price}</span>
            </div>
            <button class="header__saved-remove" data-id="${item.id}">✕</button>
        </div>
    `).join('');

    savedDropdown.querySelectorAll('.header__saved-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            savedList = savedList.filter(i => i.id != id);
            const heartBtn = document.querySelector(`.product-card__save-btn[data-id="${id}"]`);
            if (heartBtn) {
                heartBtn.classList.remove('active');
                heartBtn.querySelector('i').className = 'fa-regular fa-heart';
            }
            updateSavedCount();
            renderSavedDropdown();
        });
    });
}

cartEl.addEventListener('click', (e) => {
    e.stopPropagation();
    savedDropdown.classList.toggle('header__saved-dropdown--open');
    if (savedDropdown.classList.contains('header__saved-dropdown--open')) renderSavedDropdown();
});

document.addEventListener('click', (e) => {
    const btn = e.target.closest('.product-card__save-btn');
    if (!btn) {
        savedDropdown.classList.remove('header__saved-dropdown--open');
        return;
    };

    const card = btn.closest('.product-card');
    const id = btn.dataset.id;
    const index = savedList.findIndex(i => i.id == id);

    if (index > -1) {
        savedList.splice(index, 1);
        btn.classList.remove('active');
        btn.querySelector('i').className = 'fa-regular fa-heart';
    } else {
        savedList.push({
            id,
            name: card.querySelector('.product-card__name')?.innerText || '',
            price: card.querySelector('.product-card__price')?.innerText || '',
            img: card.querySelector('.product-card__img')?.src || FALLBACK,
        });
        btn.classList.add('active');
        btn.querySelector('i').className = 'fa-solid fa-heart';
    }
    updateSavedCount();
});

// =====================================================
// CHAT & GỌI ĐIỆN
// =====================================================
function startChat(houseId, ownerId, houseName) {
    if (currentUser.id == ownerId) {
        alert('Đây là phòng của bạn!');
        return;
    }
    localStorage.setItem('open_conv', JSON.stringify({
        partner_id: ownerId,
        house_id: houseId,
        house_name: houseName
    }));
    window.location.href = './messages.html';
}

document.addEventListener('click', (e) => {
    const callBtn = e.target.closest('.btn-call');
    if (!callBtn) return;
    const phone = callBtn.dataset.phone;
    if (!phone) { alert('Số điện thoại chưa được cập nhật!'); return; }

    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        window.location.href = `tel:${phone}`;
    } else {
        navigator.clipboard.writeText(phone);
        alert(`Số điện thoại: ${phone}\n(Đã tự động copy)`);
    }
});



// =====================================================
// KHỞI CHẠY
// =====================================================
updateSavedCount();
loadHouses(1); // Tải trang 1 khi vào Dashboard