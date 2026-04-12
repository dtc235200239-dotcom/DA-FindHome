// ===== 1. CẤU HÌNH ĐƯỜNG DẪN =====
const BASE_URL = 'http://localhost:8080/MY_PROJECT/personal_project/personal_project_2/backend';
const API_URL = `${BASE_URL}/public/index.php`;
const FALLBACK_IMG = './assets/images/nha_so_1.jpg';

// ===== 2. BIẾN TOÀN CỤC =====
let savedList = JSON.parse(localStorage.getItem('saved_houses') || '[]');

// ===== 3. KIỂM TRA ĐĂNG NHẬP =====
function isLoggedIn() {
    const user = localStorage.getItem('user');
    return user && user !== "null" && user !== "undefined";
}

// ===== 4. PASSWORD CHECK =====
function checkPasswordStrength(password) {
    return {
        length: password.length >= 8,
        lower: /[a-z]/.test(password),
        upper: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[\W_]/.test(password)
    };
}

// ===== 5. RENDER DỮ LIỆU NHÀ =====
async function renderHouses() {
    try {
        const res = await fetch(`${API_URL}?action=get_houses`);
        const result = await res.json();

        const houses = result.data || [];
        const grid = document.querySelector('.product-grid');
        if (!grid) return;

        const activeHouses = houses.filter(h => h.status === 'active');

        if (activeHouses.length === 0) {
            grid.innerHTML = `<p style="padding:20px;text-align:center;color:#888;width:100%;font-size:1.4rem;">Chưa có phòng nào.</p>`;
            return;
        }

        grid.innerHTML = activeHouses.map(h => {
            let imgUrl = FALLBACK_IMG;
            if (h.primary_img) {
                imgUrl = h.primary_img.startsWith('http')
                    ? h.primary_img
                    : `${BASE_URL}${h.primary_img}`;
            }

            const isSaved = savedList.some(item => item.id == h.id);

            let tagsHTML = '';
            if (Array.isArray(h.tags)) {
                tagsHTML = h.tags.map(tag => `<span class="product-card__tag">${tag}</span>`).join('');
            }

            return `
                <div class="product-card">
                    <div class="product-card__img-wrap">
                        <img
                            src="${imgUrl}"
                            class="product-card__img"
                            alt="${h.name}"
                            onerror="this.src='${FALLBACK_IMG}'"
                        >
                        <button class="product-card__save-btn ${isSaved ? 'active' : ''}" data-id="${h.id}">
                            <i class="${isSaved ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                        </button>
                        ${h.verified == 1 ? `<span class="product-card__badge">✓ Đã xác thực</span>` : ''}
                    </div>

                    <div class="product-card__body">
                        <div class="product-card__meta">
                            <span class="product-card__district">${h.district || 'Thái Nguyên'}</span>
                            <span class="product-card__rating">${h.rating || '5.0'} ★</span>
                        </div>
                        <h3 class="product-card__name">${h.name}</h3>
                        <p class="product-card__address"><i class="fa-solid fa-location-dot"></i> ${h.address || ''}</p>
                        <div class="product-card__price-row">
                            <span class="product-card__price">
                                ${Number(h.price || 0).toLocaleString('vi-VN')}đ<span class="product-card__price-unit">/tháng</span>
                            </span>
                            <span class="product-card__area">${h.area_m2 || 0}m²</span>
                        </div>
                        <div class="product-card__tags">${tagsHTML}</div>
                        <div class="product-card__actions">
                            <button class="product-card__btn product-card__btn--primary btn-call" data-phone="${h.phone || ''}">
                                <i class="fa-solid fa-phone"></i> Gọi điện
                            </button>
                            <button class="product-card__btn product-card__btn--outline btn-chat" data-id="${h.id}">
                                <i class="fa-regular fa-comment-dots"></i> Chat
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error('Lỗi load houses:', err);
        const grid = document.querySelector('.product-grid');
        if (grid) {
            grid.innerHTML = `<p style="padding:20px;text-align:center;color:#888;width:100%;font-size:1.4rem;">Không thể tải dữ liệu. Vui lòng thử lại sau.</p>`;
        }
    }
}

// ===== 6. KHỞI TẠO - TẤT CẢ TRONG DOMContentLoaded =====
document.addEventListener('DOMContentLoaded', () => {

    // --- Lấy element ---
    const modal = document.querySelector('.modal');
    const overlay = document.querySelector('.modal__overlay');
    const btnRegister = document.querySelectorAll('.header__navbar-item--strong')[0];
    const btnLogin = document.querySelectorAll('.header__navbar-item--strong')[1];
    const authForms = document.querySelectorAll('.auth-form');
    const switchBtns = document.querySelectorAll('.auth-form__switch-btn');
    const backBtns = document.querySelectorAll('.auth-form__controls-back');
    const cartEl = document.querySelector('.header__cart');
    const passwordInput = document.getElementById('register-password');

    // --- Hàm modal ---
    const showModal = () => { if (modal) modal.style.display = 'flex'; };
    const hideModal = () => { if (modal) modal.style.display = 'none'; };

    const showForm = (index) => {
        authForms.forEach((f, i) => {
            f.style.display = i === index ? 'block' : 'none';
        });
    };

    // Hàm mở modal đăng nhập - dùng chung cho tất cả nút cần guard
    const openLoginModal = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        showModal();
        showForm(1);
    };

    // --- Nút header ---
    if (btnRegister) btnRegister.onclick = () => { showModal(); showForm(0); };
    if (btnLogin) btnLogin.onclick = () => { showModal(); showForm(1); };
    if (overlay) overlay.onclick = hideModal;
    backBtns.forEach(btn => btn.onclick = hideModal);
    switchBtns.forEach((btn, i) => btn.onclick = () => showForm(i === 0 ? 1 : 0));

    // --- Tìm kiếm: yêu cầu đăng nhập ---
    const searchInput = document.getElementById('serch_input');
    const searchSelect = document.querySelector('.header__search-select');
    const searchBtn = document.querySelector('.header__search-btn');

    const handleSearchGuard = (e) => {
        if (!isLoggedIn()) openLoginModal(e);
    };

    if (searchInput) {
        searchInput.addEventListener('focus', handleSearchGuard);
        searchInput.addEventListener('keydown', handleSearchGuard);
    }
    if (searchSelect) searchSelect.addEventListener('click', handleSearchGuard);
    if (searchBtn) searchBtn.addEventListener('click', handleSearchGuard);

    // --- Giỏ lưu ---
    const savedDropdown = document.createElement('div');
    savedDropdown.className = 'header__saved-dropdown';
    if (cartEl) cartEl.appendChild(savedDropdown);

    const updateCartCount = () => {
        const span = document.querySelector('.header__cart-span');
        if (span) span.textContent = `Đã lưu ( ${savedList.length} )`;
        localStorage.setItem('saved_houses', JSON.stringify(savedList));
    };

    const renderSavedDropdown = () => {
        if (savedList.length === 0) {
            savedDropdown.innerHTML = `<p class="header__saved-empty">Chưa có phòng nào được lưu</p>`;
            return;
        }
        savedDropdown.innerHTML = savedList.map(item => `
            <div class="header__saved-item">
                <img src="${item.img}" class="header__saved-img" onerror="this.src='${FALLBACK_IMG}'">
                <div class="header__saved-info">
                    <span class="header__saved-name">${item.name}</span>
                    <span class="header__saved-price">${item.price}</span>
                </div>
                <button class="header__saved-remove" onclick="removeSaved('${item.id}')">✕</button>
            </div>
        `).join('');
    };

    window.removeSaved = (id) => {
        savedList = savedList.filter(i => i.id != id);
        const btn = document.querySelector(`.product-card__save-btn[data-id="${id}"]`);
        if (btn) btn.classList.remove('active');
        updateCartCount();
        renderSavedDropdown();
    };

    if (cartEl) {
        cartEl.onclick = (e) => {
            e.stopPropagation();
            savedDropdown.classList.toggle('header__saved-dropdown--open');
            renderSavedDropdown();
        };
    }

    // --- Click toàn trang: xử lý tim, gọi điện, chat ---
    document.addEventListener('click', (e) => {
        // Đóng dropdown khi click ngoài
        if (cartEl && !cartEl.contains(e.target)) {
            savedDropdown.classList.remove('header__saved-dropdown--open');
        }

        // Nút GỌI ĐIỆN
        const callBtn = e.target.closest('.btn-call');
        if (callBtn) {
            if (!isLoggedIn()) { openLoginModal(e); return; }
            const phone = callBtn.dataset.phone;
            if (phone) {
                window.location.href = `tel:${phone}`;
            } else {
                alert('Số điện thoại chưa được cập nhật.');
            }
            return;
        }

        // Nút CHAT
        const chatBtn = e.target.closest('.btn-chat');
        if (chatBtn) {
            if (!isLoggedIn()) { openLoginModal(e); return; }
            const houseId = chatBtn.dataset.id;
            window.location.href = `../frontend/user/chat?house_id=${houseId}`;
            return;
        }

        // Nút TIM (lưu)
        const saveBtn = e.target.closest('.product-card__save-btn');
        if (!saveBtn) return;

        const card = saveBtn.closest('.product-card');
        const id = saveBtn.dataset.id;
        const index = savedList.findIndex(i => i.id == id);

        if (index > -1) {
            savedList.splice(index, 1);
            saveBtn.classList.remove('active');
        } else {
            savedList.push({
                id,
                name: card.querySelector('.product-card__name').innerText,
                price: card.querySelector('.product-card__price').innerText,
                img: card.querySelector('.product-card__img').src
            });
            saveBtn.classList.add('active');
        }
        updateCartCount();
    });

    // --- Password realtime check ---
    if (passwordInput) {
        passwordInput.addEventListener('input', function () {
            const r = checkPasswordStrength(this.value);
            document.getElementById('check-length').innerText = (r.length ? '✅' : '❌') + ' Ít nhất 8 ký tự';
            document.getElementById('check-lower').innerText = (r.lower ? '✅' : '❌') + ' Chữ thường';
            document.getElementById('check-upper').innerText = (r.upper ? '✅' : '❌') + ' Chữ hoa';
            document.getElementById('check-number').innerText = (r.number ? '✅' : '❌') + ' Số';
            document.getElementById('check-special').innerText = (r.special ? '✅' : '❌') + ' Ký tự đặc biệt';
        });
    }

    // --- Đăng ký ---
    const btnRegisterSubmit = document.getElementById('btn-register');
    if (btnRegisterSubmit) {
        btnRegisterSubmit.onclick = async () => {
            const username = document.getElementById('register-username').value.trim();
            const email = document.getElementById('register-email').value.trim();
            const password = document.getElementById('register-password').value;
            const confirm_password = document.getElementById('register-confirm').value;

            if (!username || !email || !password || !confirm_password) {
                alert('Vui lòng nhập đầy đủ thông tin!');
                return;
            }

            const check = checkPasswordStrength(password);
            if (!check.length || !check.lower || !check.upper || !check.number || !check.special) {
                alert('Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt!');
                return;
            }

            if (password !== confirm_password) {
                alert('Mật khẩu nhập lại không khớp!');
                return;
            }

            const res = await fetch(`${API_URL}?action=register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, confirm_password })
            });

            const result = await res.json();
            alert(result.message);
            if (result.status === 'success') hideModal();
        };
    }

    // --- Đăng nhập ---
    const btnLoginSubmit = document.getElementById('btn-login');
    if (btnLoginSubmit) {
        btnLoginSubmit.onclick = async () => {
            const identifier = document.getElementById('login-identifier').value.trim();
            const password = document.getElementById('login-password').value;

            if (!identifier || !password) {
                alert('Vui lòng nhập đủ thông tin');
                return;
            }

            const res = await fetch(`${API_URL}?action=login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password })
            });

            const result = await res.json();

            if (result.status === 'success') {
                localStorage.setItem('user', JSON.stringify(result.data));
                window.location.href = result.redirect;
            } else {
                alert(result.message);
            }
        };
    }

    // --- Khởi tạo ---
    renderHouses();
    updateCartCount();
});