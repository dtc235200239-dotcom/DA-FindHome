
const API = 'http://localhost:8080/MY_PROJECT/personal_project/personal_project_2/backend/public/index.php';
const BASE_URL = 'http://localhost:8080/MY_PROJECT/personal_project/personal_project_2/backend';

// ===== TOAST =====
function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = toast.querySelector('i');
    document.getElementById('toast-msg').textContent = msg;
    toast.className = 'toast ' + type;
    icon.className = type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== MODAL =====
function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => { if (e.target === o) o.classList.remove('show'); });
});

// ===== TABS =====
function switchTab(tab) {
    document.querySelectorAll('.section-tab').forEach((b, i) => {
        b.classList.toggle('active', (i === 0 && tab === 'houses') || (i === 1 && tab === 'users'));
    });
    document.getElementById('panel-houses').classList.toggle('active', tab === 'houses');
    document.getElementById('panel-users').classList.toggle('active', tab === 'users');
    if (tab === 'users' && !usersLoaded) loadUsers();
}

// ===== FORMAT =====
function fmtPrice(p) { return parseInt(p).toLocaleString('vi-VN') + 'đ/tháng'; }
function fmtDate(d) { if (!d) return '—'; const dt = new Date(d); return dt.toLocaleDateString('vi-VN'); }
function statusBadge(s) {
    const map = { active: ['badge-active', 'Hiển thị'], draft: ['badge-draft', 'Nháp'], hidden: ['badge-hidden', 'Ẩn'] };
    const [cls, lbl] = map[s] || ['badge-hidden', s];
    return `<span class="badge ${cls}">${lbl}</span>`;
}

// ===== STATS =====
async function loadStats() {
    try {
        const r = await fetch(`${API}?action=get_stats`);
        const d = await r.json();
        if (d.status === 'success') {
            document.getElementById('stat-total-houses').textContent = d.data.total_houses ?? 0;
            document.getElementById('stat-active-houses').textContent = d.data.active_houses ?? 0;
            document.getElementById('stat-total-users').textContent = d.data.total_users ?? 0;
            document.getElementById('stat-locked-users').textContent = d.data.locked_users ?? 0;
        }
    } catch (e) { console.error('Stats error', e); }
}

// ===== HOUSES =====
let allHouses = [], housesLoaded = false;
const HOUSE_PAGE_SIZE = 10;
let housePage = 1;

async function loadHouses() {
    try {
        const r = await fetch(`${API}?action=get_all_houses`);
        const d = await r.json();
        allHouses = d.data || [];
        housesLoaded = true;
        renderHouses();
    } catch (e) {
        document.getElementById('house-tbody').innerHTML = '<tr class="empty-row"><td colspan="8">Không thể tải dữ liệu.</td></tr>';
    }
}

function filterHouses() {
    housePage = 1;
    renderHouses();
}

function renderHouses() {
    const search = document.getElementById('house-search').value.toLowerCase();
    const status = document.getElementById('house-filter-status').value;
    const area = document.getElementById('house-filter-area').value;

    let filtered = allHouses.filter(h => {
        const matchSearch = !search || h.name?.toLowerCase().includes(search) || h.address?.toLowerCase().includes(search);
        const matchStatus = !status || h.status === status;
        const matchArea = !area || h.area === area;
        return matchSearch && matchStatus && matchArea;
    });

    const total = filtered.length;
    const start = (housePage - 1) * HOUSE_PAGE_SIZE;
    const page = filtered.slice(start, start + HOUSE_PAGE_SIZE);

    const tbody = document.getElementById('house-tbody');
    if (!page.length) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="8"><i class="fa-regular fa-folder-open" style="font-size:24px;display:block;margin-bottom:8px"></i>Không có dữ liệu</td></tr>';
    } else {
        tbody.innerHTML = page.map(h => `
            <tr>
                <td>${h.primary_img
                ? `<img class="house-thumb" src="${BASE_URL + h.primary_img}" alt="ảnh">`
                : `<div class="house-thumb-placeholder"><i class="fa-regular fa-image"></i></div>`}</td>
                <td>
                    <div style="font-weight:500;font-size:13.5px;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${h.name}</div>
                    <div style="font-size:11px;color:var(--muted);margin-top:2px">${h.district || ''}</div>
                </td>
                <td>${h.area || '—'}</td>
                <td class="price-text">${fmtPrice(h.price)}</td>
                <td>${h.area_m2 || '—'} m²</td>
                <td>${statusBadge(h.status)}</td>
                <td>${h.verified == 1 ? '<span class="badge badge-verified"><i class="fa-solid fa-circle-check"></i> Xác thực</span>' : '<span style="color:var(--muted);font-size:12px">—</span>'}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon edit" title="Chỉnh sửa" onclick='openEditHouse(${JSON.stringify(h)})'><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-icon del" title="Xóa nhà" onclick="confirmDeleteHouse(${h.id}, '${h.name?.replace(/'/g, "\\'")}')"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderPagination('house-pagination', total, housePage, HOUSE_PAGE_SIZE, (p) => { housePage = p; renderHouses(); });
}

function openEditHouse(h) {
    document.getElementById('edit-house-id').value = h.id;
    document.getElementById('edit-house-name').value = h.name || '';
    document.getElementById('edit-house-type').value = h.type || '';
    document.getElementById('edit-house-area').value = h.area || '';
    document.getElementById('edit-house-address').value = h.address || '';
    document.getElementById('edit-house-district').value = h.district || '';
    document.getElementById('edit-house-price').value = h.price || '';
    document.getElementById('edit-house-area-m2').value = h.area_m2 || '';
    document.getElementById('edit-house-status').value = h.status || 'active';
    document.getElementById('edit-house-desc').value = h.description || '';
    document.getElementById('edit-house-verified').checked = h.verified == 1;
    openModal('modal-edit-house');
}

async function saveHouseEdit() {
    const id = document.getElementById('edit-house-id').value;
    const data = {
        id,
        name: document.getElementById('edit-house-name').value.trim(),
        type: document.getElementById('edit-house-type').value,
        area: document.getElementById('edit-house-area').value,
        address: document.getElementById('edit-house-address').value.trim(),
        district: document.getElementById('edit-house-district').value.trim(),
        price: document.getElementById('edit-house-price').value,
        areaM2: document.getElementById('edit-house-area-m2').value,
        status: document.getElementById('edit-house-status').value,
        desc: document.getElementById('edit-house-desc').value.trim(),
        verified: document.getElementById('edit-house-verified').checked ? 1 : 0,
    };
    if (!data.name) { showToast('Vui lòng nhập tên phòng', 'error'); return; }
    try {
        const r = await fetch(`${API}?action=update_house`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const res = await r.json();
        if (res.status === 'success') {
            closeModal('modal-edit-house');
            showToast('Đã lưu thay đổi!', 'success');
            // Update local data
            const idx = allHouses.findIndex(h => h.id == id);
            if (idx > -1) Object.assign(allHouses[idx], { ...data, area_m2: data.areaM2, description: data.desc });
            renderHouses();
            loadStats();
        } else {
            showToast(res.message || 'Lỗi khi lưu', 'error');
        }
    } catch (e) { showToast('Lỗi kết nối server', 'error'); }
}

function confirmDeleteHouse(id, name) {
    document.getElementById('confirm-icon').className = 'confirm-icon';
    document.getElementById('confirm-icon-i').className = 'fa-solid fa-trash';
    document.getElementById('confirm-title').textContent = 'Xác nhận xóa nhà?';
    document.getElementById('confirm-sub').textContent = `Bạn sắp xóa "${name}". Hành động này không thể hoàn tác.`;
    document.getElementById('confirm-btn').className = 'btn-danger';
    document.getElementById('confirm-btn').textContent = 'Xóa ngay';
    document.getElementById('confirm-btn').onclick = () => deleteHouse(id);
    openModal('modal-confirm');
}

async function deleteHouse(id) {
    try {
        const r = await fetch(`${API}?action=delete_house`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const res = await r.json();
        closeModal('modal-confirm');
        if (res.status === 'success') {
            allHouses = allHouses.filter(h => h.id != id);
            renderHouses();
            loadStats();
            showToast('Đã xóa nhà!', 'success');
        } else { showToast(res.message || 'Lỗi', 'error'); }
    } catch (e) { showToast('Lỗi kết nối server', 'error'); }
}

// ===== USERS =====
let allUsers = [], usersLoaded = false;
const USER_PAGE_SIZE = 10;
let userPage = 1;

async function loadUsers() {
    try {
        const r = await fetch(`${API}?action=get_users`);
        const d = await r.json();
        allUsers = d.data || [];
        usersLoaded = true;
        renderUsers();
    } catch (e) {
        document.getElementById('user-tbody').innerHTML = '<tr class="empty-row"><td colspan="7">Không thể tải dữ liệu.</td></tr>';
    }
}

function filterUsers() { userPage = 1; renderUsers(); }

function renderUsers() {
    const search = document.getElementById('user-search').value.toLowerCase();
    const status = document.getElementById('user-filter-status').value;
    let filtered = allUsers.filter(u => {
        const matchSearch = !search || u.name?.toLowerCase().includes(search) || u.email?.toLowerCase().includes(search);
        const matchStatus = !status || u.status === status;
        return matchSearch && matchStatus;
    });
    const total = filtered.length;
    const start = (userPage - 1) * USER_PAGE_SIZE;
    const page = filtered.slice(start, start + USER_PAGE_SIZE);

    const tbody = document.getElementById('user-tbody');
    if (!page.length) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="7"><i class="fa-regular fa-user" style="font-size:24px;display:block;margin-bottom:8px"></i>Không có dữ liệu</td></tr>';
    } else {
        tbody.innerHTML = page.map(u => {
            const locked = u.status === 'locked';
            const initials = (u.name || 'U').split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();
            return `
                <tr>
                    <td><div class="avatar">${initials}</div></td>
                    <td><div style="font-weight:500">${u.name || '—'}</div></td>
                    <td style="color:var(--muted)">${u.email || '—'}</td>
                    <td>${u.phone || '—'}</td>
                    <td style="color:var(--muted)">${fmtDate(u.created_at)}</td>
                    <td>${locked
                    ? '<span class="badge badge-locked"><i class="fa-solid fa-lock"></i> Bị khóa</span>'
                    : '<span class="badge badge-active"><i class="fa-solid fa-circle-check"></i> Hoạt động</span>'}</td>
                    <td>
                        <div class="action-btns">
                            ${locked
                    ? `<button class="btn-icon unlock" title="Mở khóa" onclick="confirmToggleLock(${u.id},'${u.name?.replace(/'/g, "\\'")}','unlock')"><i class="fa-solid fa-lock-open"></i></button>`
                    : `<button class="btn-icon lock" title="Khóa tài khoản" onclick="confirmToggleLock(${u.id},'${u.name?.replace(/'/g, "\\'")}','lock')"><i class="fa-solid fa-lock"></i></button>`
                }
                            <button class="btn-icon del" title="Xóa người dùng" onclick="confirmDeleteUser(${u.id},'${u.name?.replace(/'/g, "\\'")}')"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
    renderPagination('user-pagination', total, userPage, USER_PAGE_SIZE, (p) => { userPage = p; renderUsers(); });
}

function confirmToggleLock(id, name, action) {
    const isLock = action === 'lock';
    document.getElementById('confirm-icon').className = 'confirm-icon warn';
    document.getElementById('confirm-icon-i').className = isLock ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open';
    document.getElementById('confirm-title').textContent = isLock ? 'Khóa tài khoản?' : 'Mở khóa tài khoản?';
    document.getElementById('confirm-sub').textContent = isLock
        ? `Tài khoản của "${name}" sẽ bị khóa và không thể đăng nhập.`
        : `Tài khoản của "${name}" sẽ được mở khóa trở lại.`;
    document.getElementById('confirm-btn').className = 'btn-warn';
    document.getElementById('confirm-btn').textContent = isLock ? 'Khóa ngay' : 'Mở khóa';
    document.getElementById('confirm-btn').onclick = () => toggleLockUser(id, action);
    openModal('modal-confirm');
}

async function toggleLockUser(id, action) {
    try {
        const r = await fetch(`${API}?action=${action === 'lock' ? 'lock_user' : 'unlock_user'}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: Number(id) }) // 👈 ép kiểu chắc chắn
        });

        const text = await r.text();
        console.log("RAW RESPONSE:", text); // 👈 debug

        const res = JSON.parse(text);

        closeModal('modal-confirm');

        if (res.status === 'success') {
            const u = allUsers.find(u => u.id == id);
            if (u) u.status = action === 'lock' ? 'locked' : 'active';
            renderUsers();
            loadStats();
            showToast(action === 'lock' ? 'Đã khóa!' : 'Đã mở khóa!', 'success');
        } else {
            showToast(res.message || 'Lỗi', 'error');
        }

    } catch (e) {
        console.error(e);
        showToast('Lỗi kết nối server', 'error');
    }
}

function confirmDeleteUser(id, name) {
    document.getElementById('confirm-icon').className = 'confirm-icon';
    document.getElementById('confirm-icon-i').className = 'fa-solid fa-trash';
    document.getElementById('confirm-title').textContent = 'Xóa người dùng?';
    document.getElementById('confirm-sub').textContent = `Bạn sắp xóa tài khoản "${name}". Không thể hoàn tác.`;
    document.getElementById('confirm-btn').className = 'btn-danger';
    document.getElementById('confirm-btn').textContent = 'Xóa ngay';
    document.getElementById('confirm-btn').onclick = () => deleteUser(id);
    openModal('modal-confirm');
}

async function deleteUser(id) {
    try {
        const r = await fetch(`${API}?action=delete_user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const res = await r.json();
        closeModal('modal-confirm');
        if (res.status === 'success') {
            allUsers = allUsers.filter(u => u.id != id);
            renderUsers();
            loadStats();
            showToast('Đã xóa người dùng!', 'success');
        } else { showToast(res.message || 'Lỗi', 'error'); }
    } catch (e) { showToast('Lỗi kết nối server', 'error'); }
}

// ===== PAGINATION =====
function renderPagination(containerId, total, current, pageSize, onPageChange) {
    const container = document.getElementById(containerId);
    const totalPages = Math.ceil(total / pageSize);
    if (total === 0) { container.innerHTML = ''; return; }
    const start = (current - 1) * pageSize + 1;
    const end = Math.min(current * pageSize, total);

    let pages = '';
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= current - 1 && i <= current + 1)) {
            pages += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="(${onPageChange.toString()})(${i})">${i}</button>`;
        } else if (i === current - 2 || i === current + 2) {
            pages += `<span style="padding:0 4px;color:var(--muted);line-height:30px">…</span>`;
        }
    }

    container.innerHTML = `
        <span>Hiển thị ${start}–${end} / ${total} mục</span>
        <div class="pagination__pages">
            <button class="page-btn" onclick="(${onPageChange.toString()})(${Math.max(1, current - 1)})" ${current === 1 ? 'disabled style="opacity:.4"' : ''}><i class="fa-solid fa-chevron-left" style="font-size:10px"></i></button>
            ${pages}
            <button class="page-btn" onclick="(${onPageChange.toString()})(${Math.min(totalPages, current + 1)})" ${current === totalPages ? 'disabled style="opacity:.4"' : ''}><i class="fa-solid fa-chevron-right" style="font-size:10px"></i></button>
        </div>
    `;
}

// ===== INIT =====
loadStats();
loadHouses();