'use strict';

// ===== CẤU HÌNH =====
const BASE_URL = 'http://localhost:8080/MY_PROJECT/personal_project/personal_project_2/backend';
const API_URL = `${BASE_URL}/public/index.php`;
const FALLBACK_IMG = '../assets/images/nha_so_1.jpg';

// ===== KIỂM TRA SESSION =====
const currentUser = (() => {
    try {
        return JSON.parse(localStorage.getItem('user'));
    } catch {
        return null;
    }
})();

if (!currentUser) {
    alert('Bạn chưa đăng nhập!');
    window.location.href = './index.html';
}

// Hiện tên người dùng
const usernameDisplay = document.getElementById('username-display');
if (usernameDisplay && currentUser) {
    usernameDisplay.textContent = currentUser.username || 'Người dùng';
}

// ===== ĐĂNG XUẤT =====
document.getElementById('btn-logout')?.addEventListener('click', async () => {
    try {
        await fetch(`${API_URL}?action=logout`, { method: 'POST' });
    } catch (_) { }
    localStorage.removeItem('user'); // Đổi thành 'user' cho đồng bộ với lúc Get
    window.location.href = '../index.html';
});

// =====================================================
// ĐIỀU HƯỚNG TAB
// =====================================================
const tabBtns = document.querySelectorAll('.user-tab');
const tabPanels = document.querySelectorAll('.tab-content');

window.switchTab = function (tabName) {
    tabBtns.forEach(btn => btn.classList.toggle('user-tab--active', btn.dataset.tab === tabName));
    tabPanels.forEach(p => p.classList.toggle('tab-content--active', p.id === `tab-${tabName}`));

    // Khởi tạo/Cập nhật khi đổi tab
    if (tabName === 'map') {
        initMap();
        setTimeout(() => mapInstance?.invalidateSize(), 100); // Fix lỗi UI bản đồ bị xám
    }
    if (tabName === 'my-posts') loadMyPosts();
}

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// =====================================================
// STAR RATING
// =====================================================
const stars = document.querySelectorAll('.star');
const ratingInput = document.getElementById('post-rating');

function setStars(val) {
    stars.forEach(s => s.classList.toggle('active', Number(s.dataset.val) <= val));
    if (ratingInput) ratingInput.value = val;
}

setStars(5);

stars.forEach(s => {
    s.addEventListener('mouseover', () => {
        stars.forEach(st => st.classList.toggle('active', Number(st.dataset.val) <= Number(s.dataset.val)));
    });
    s.addEventListener('mouseout', () => setStars(Number(ratingInput?.value || 5)));
    s.addEventListener('click', () => setStars(Number(s.dataset.val)));
});

// =====================================================
// TAG PICKER
// =====================================================
document.querySelectorAll('.tag-option').forEach(label => {
    label.addEventListener('click', () => {
        const cb = label.querySelector('input[type="checkbox"]');
        setTimeout(() => {
            label.classList.toggle('selected', cb.checked);
        }, 0);
    });
});

function getSelectedTags() {
    return [...document.querySelectorAll('.tag-option input:checked')].map(cb => cb.value);
}

// =====================================================
// IMAGE UPLOAD PREVIEW
// =====================================================
let selectedFiles = [];

const imgInput = document.getElementById('img-input');
const imgPreviewList = document.getElementById('img-preview-list');

imgInput?.addEventListener('change', (e) => {
    const newFiles = [...e.target.files];

    if (selectedFiles.length + newFiles.length > 5) {
        showToast('Chỉ được chọn tối đa 5 ảnh!', 'error');
        return;
    }

    newFiles.forEach(file => {
        if (!file.type.startsWith('image/')) return;
        selectedFiles.push(file);
    });

    renderImgPreviews();
    imgInput.value = '';
});

function renderImgPreviews() {
    if (!imgPreviewList) return;
    imgPreviewList.innerHTML = '';
    selectedFiles.forEach((file, index) => {
        const url = URL.createObjectURL(file);
        const item = document.createElement('div');
        item.className = `img-preview-item ${index === 0 ? 'img-preview-item--primary' : ''}`;
        item.innerHTML = `
            <img src="${url}" alt="preview">
            ${index === 0 ? '<div class="img-preview-primary-badge">Ảnh chính</div>' : ''}
            <button type="button" class="img-preview-remove" data-index="${index}" title="Xóa">✕</button>
        `;
        imgPreviewList.appendChild(item);
    });

    imgPreviewList.querySelectorAll('.img-preview-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedFiles.splice(Number(btn.dataset.index), 1);
            renderImgPreviews();
        });
    });
}

// Hiển thị giá tiền Realtime
const priceInput = document.getElementById('post-price');
const pricePreview = document.getElementById('price-preview');

priceInput?.addEventListener('input', (e) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
        pricePreview.textContent = '';
        return;
    }
    pricePreview.textContent = `${Number(raw).toLocaleString('vi-VN')} đ/tháng`;
});

// =====================================================
// VALIDATION & SUBMIT
// =====================================================
function validatePostForm() {
    let valid = true;
    const fields = [
        { id: 'post-name', errId: 'err-name', msg: 'Vui lòng nhập tiêu đề!' },
        { id: 'post-type', errId: 'err-type', msg: 'Vui lòng chọn loại phòng!' },
        { id: 'post-address', errId: 'err-address', msg: 'Vui lòng nhập địa chỉ!' },
        { id: 'post-area', errId: 'err-area', msg: 'Vui lòng chọn khu vực!' },
        { id: 'post-price', errId: 'err-price', msg: 'Vui lòng nhập giá thuê!' },
        { id: 'post-area-m2', errId: 'err-area-m2', msg: 'Vui lòng nhập diện tích!' },
        { id: 'post-phone', errId: 'err-phone', msg: 'Vui lòng nhập số điện thoại!' },
    ];

    fields.forEach(({ id, errId, msg }) => {
        const el = document.getElementById(id);
        const err = document.getElementById(errId);
        if (el && !el.value.trim()) {
            if (err) err.textContent = msg;
            el.style.borderColor = '#e53e3e';
            valid = false;
        } else if (el) {
            if (err) err.textContent = '';
            el.style.borderColor = '';
        }
    });

    const errImg = document.getElementById('err-img');
    if (selectedFiles.length === 0) {
        if (errImg) errImg.textContent = 'Vui lòng chọn ít nhất 1 ảnh!';
        valid = false;
    } else {
        if (errImg) errImg.textContent = '';
    }

    return valid;
}

document.getElementById('post-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validatePostForm()) return;

    const submitBtn = document.getElementById('btn-submit-post');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';

    try {
        // 1. Lưu thông tin nhà TRƯỚC để lấy ID
        const payload = {
            name: document.getElementById('post-name').value.trim(),
            type: document.getElementById('post-type').value,
            area: document.getElementById('post-area').value,
            address: document.getElementById('post-address').value.trim(),
            district: document.getElementById('post-district')?.value.trim() || '',
            price: Number(document.getElementById('post-price').value),
            areaM2: Number(document.getElementById('post-area-m2').value),
            rating: Number(document.getElementById('post-rating')?.value || 5),
            description: document.getElementById('post-desc')?.value.trim() || '',
            phone: document.getElementById('post-phone').value.trim(),
            verified: document.getElementById('post-verified')?.checked ? 1 : 0,
            tags: getSelectedTags(),
            user_id: currentUser.id,
        };

        const res = await fetch(`${API_URL}?action=add_house`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (data.status === 'success') {
            const newHouseId = data.id;

            // 2. Upload ảnh dựa trên ID nhà vừa tạo (chạy ngầm song song)
            await uploadImages(selectedFiles, newHouseId);

            showToast('✅ Đăng tin thành công!', 'success');
            resetForm();
            // Điều hướng sang tab bài viết nếu muốn
            switchTab('my-posts');
        } else {
            showToast(data.message || 'Đăng tin thất bại!', 'error');
        }
    } catch (err) {
        console.error('Submit error:', err);
        showToast('Không thể kết nối đến server!', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
});

// 🔥 Đã sửa logic: Upload từng ảnh qua FormData có chứa house_id
async function uploadImages(files, houseId) {
    if (!files || files.length === 0) return;

    const uploadPromises = files.map((file, index) => {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('house_id', houseId);
        formData.append('is_primary', index === 0 ? 1 : 0);

        return fetch(`${API_URL}?action=upload_image`, {
            method: 'POST',
            body: formData,
        });
    });

    await Promise.allSettled(uploadPromises);
}

// ===== RESET FORM =====
function resetForm() {
    document.getElementById('post-form')?.reset();
    selectedFiles = [];
    renderImgPreviews();
    setStars(5);
    if (pricePreview) pricePreview.textContent = '';
    document.querySelectorAll('.tag-option').forEach(l => l.classList.remove('selected'));
    document.querySelectorAll('.post-form__input, .post-form__select').forEach(el => el.style.borderColor = '');
    document.querySelectorAll('.post-form__error').forEach(el => el.textContent = '');
}

document.getElementById('btn-reset-form')?.addEventListener('click', resetForm);

// ===== TOAST =====
function showToast(msg, type = 'success') {
    const toast = document.getElementById('post-toast');
    if (!toast) return alert(msg);
    toast.textContent = msg;
    toast.className = `post-toast post-toast--show post-toast--${type}`;
    setTimeout(() => toast.className = 'post-toast', 4000);
}

// =====================================================
// BẢN ĐỒ LEAFLET
// =====================================================
let mapInstance = null;
let mapMarkers = [];
let allHousesGeo = [];

const AREA_COORDS = {
    'Thái Nguyên': [21.5928, 105.8442],
    'Sông Công': [21.5283, 105.8867],
    'Phổ Yên': [21.4667, 105.9167],
    'Bắc Kạn': [22.1470, 105.8348],
};

function markerColor(price) {
    if (price < 3_000_000) return '#22c55e';
    if (price < 6_000_000) return '#f59e0b';
    return '#ef4444';
}

function makeCircleIcon(color) {
    return L.divIcon({
        className: '',
        html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,0.4);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        popupAnchor: [0, -10],
    });
}

async function initMap() {
    if (mapInstance || typeof L === 'undefined') return;

    mapInstance = L.map('leaflet-map').setView([21.5928, 105.8442], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap', maxZoom: 19,
    }).addTo(mapInstance);

    await loadHousesForMap();

    document.getElementById('map-filter-area')?.addEventListener('change', filterMapMarkers);
    document.getElementById('map-filter-type')?.addEventListener('change', filterMapMarkers);
}

async function loadHousesForMap() {
    try {
        const res = await fetch(`${API_URL}?action=get_houses`);
        const result = await res.json();
        allHousesGeo = (result.data || []).filter(h => h.status === 'active');
        renderMapMarkers(allHousesGeo);
    } catch (err) {
        console.error('Map load error:', err);
    }
}

function renderMapMarkers(houses) {
    mapMarkers.forEach(m => mapInstance.removeLayer(m));
    mapMarkers = [];

    houses.forEach(h => {
        let lat = parseFloat(h.lat);
        let lng = parseFloat(h.lng);

        if (!lat || !lng) {
            const base = AREA_COORDS[h.area] || [21.5928, 105.8442];
            lat = base[0] + (Math.random() - 0.5) * 0.04;
            lng = base[1] + (Math.random() - 0.5) * 0.04;
        }

        const price = Number(h.price || 0);
        const marker = L.marker([lat, lng], { icon: makeCircleIcon(markerColor(price)) });
        // Thêm /public/ vào giữa
        const imgUrl = h.primary_img ? (h.primary_img.startsWith('http') ? h.primary_img : `${BASE_URL}${h.primary_img}`) : FALLBACK_IMG;
        marker.bindPopup(`
            <div class="map-popup">
                <img src="${imgUrl}" alt="" style="width:100%;height:100px;object-fit:cover;border-radius:6px;margin-bottom:8px" onerror="this.src='${FALLBACK_IMG}'">
                <strong>${h.name}</strong><br>
                <span style="color:#888;font-size:1.2rem"><i class="fa-solid fa-location-dot"></i> ${h.address || h.area}</span><br>
                <span class="map-popup-price">${price.toLocaleString('vi-VN')}đ/tháng</span> &nbsp;·&nbsp;
                <span class="map-popup-area">${h.areaM2}m²</span>
            </div>
        `, { maxWidth: 220 });

        marker.addTo(mapInstance);
        mapMarkers.push(marker);
    });
}

function filterMapMarkers() {
    const areaVal = document.getElementById('map-filter-area')?.value || 'all';
    const typeVal = document.getElementById('map-filter-type')?.value || 'all';

    const filtered = allHousesGeo.filter(h => {
        return (areaVal === 'all' || h.area === areaVal) && (typeVal === 'all' || h.type === typeVal);
    });

    renderMapMarkers(filtered);

    if (areaVal !== 'all' && AREA_COORDS[areaVal]) {
        mapInstance.flyTo(AREA_COORDS[areaVal], 13, { duration: 1 });
    } else {
        mapInstance.flyTo([21.5928, 105.8442], 11, { duration: 1 });
    }
}

// =====================================================
// BÀI ĐÃ ĐĂNG
// =====================================================
async function loadMyPosts() {
    const grid = document.getElementById('my-posts-grid');
    const countEl = document.getElementById('my-posts-count');
    if (!grid) return;

    grid.innerHTML = '<p style="padding:20px;color:#888;font-size:1.4rem"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải...</p>';

    try {
        const res = await fetch(`${API_URL}?action=get_my_posts&user_id=${currentUser.id}`);
        const result = await res.json();
        const posts = result.data || [];

        if (countEl) countEl.textContent = `${posts.length} bài`;

        if (posts.length === 0) {
            grid.innerHTML = `
                <div class="my-posts-empty">
                    <i class="fa-regular fa-folder-open"></i>
                    <p>Bạn chưa đăng bài nào.</p>
                    <button class="btn-form btn-form--primary" onclick="switchTab('post')">Đăng bài ngay</button>
                </div>`;
            return;
        }

        grid.innerHTML = posts.map(h => {
            const imgUrl = h.primary_img ? (h.primary_img.startsWith('http') ? h.primary_img : `${BASE_URL}${h.primary_img}`) : FALLBACK_IMG;
            const statusLabel = { active: 'Đang hiện', draft: 'Bản nháp', hidden: 'Đã ẩn' }[h.status] || h.status;
            const statusClass = { active: 'status--active', draft: 'status--draft', hidden: 'status--hidden' }[h.status] || '';

            return `
            <div class="my-post-card" data-id="${h.id}">
                <img class="my-post-card__img" src="${imgUrl}" alt="${h.name}" onerror="this.src='${FALLBACK_IMG}'">
                <div class="my-post-card__body">
                    <div class="my-post-card__title">${h.name}</div>
                    <div class="my-post-card__price">${Number(h.price).toLocaleString('vi-VN')}đ/tháng</div>
                    <div class="my-post-card__meta">
                        <span>${h.areaM2}m² · ${h.district || h.area}</span>
                        <span class="my-post-card__status ${statusClass}">${statusLabel}</span>
                    </div>
                    <div class="my-post-card__actions">
                        <button class="my-post-card__btn my-post-card__btn--edit" onclick="editPost(${h.id})">
                            <i class="fa-solid fa-pen"></i> Sửa
                        </button>
                        <button class="my-post-card__btn my-post-card__btn--delete" onclick="deletePost(${h.id})">
                            <i class="fa-solid fa-trash"></i> Xóa
                        </button>
                    </div>
                </div>
            </div>`;
        }).join('');
    } catch (err) {
        console.error('loadMyPosts error:', err);
        grid.innerHTML = '<p style="padding:20px;color:#e53e3e;font-size:1.4rem">Lỗi tải dữ liệu!</p>';
    }
}

window.deletePost = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa bài này không?')) return;
    try {
        const res = await fetch(`${API_URL}?action=delete_house`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, user_id: currentUser.id }),
        });
        const data = await res.json();

        if (data.status === 'success') {
            document.querySelector(`.my-post-card[data-id="${id}"]`)?.remove();
            const remaining = document.querySelectorAll('.my-post-card').length;
            const countEl = document.getElementById('my-posts-count');
            if (countEl) countEl.textContent = `${remaining} bài`;
            showToast('Đã xóa thành công!');
        } else {
            showToast(data.message || 'Xóa thất bại!', 'error');
        }
    } catch {
        showToast('Không thể kết nối đến server!', 'error');
    }
};

window.editPost = (id) => {
    alert(`Chức năng sửa bài #${id} đang phát triển.`);
};