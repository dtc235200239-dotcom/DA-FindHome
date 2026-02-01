document.addEventListener("DOMContentLoaded", () => {
    // ===== ELEMENTS =====
    const status = document.getElementById("status");
    const tbody = document.getElementById("user-table-body");
    const addCheckbox = document.getElementById("addCheckbox");
    const password = document.getElementById("password");
    const eye = document.getElementById("eye");
    const deleteBtn = document.getElementById("deleteBtn");
    const userIdInput = document.getElementById("userId");
    const usernameInput = document.getElementById("username");
    const emailInput = document.getElementById("email");
    const roleInput = document.getElementById("role");

    let selectedUserId = null;

    //===== EVENTS =====
    addCheckbox.addEventListener("change", () => {
        if (!addCheckbox.checked) {
            password.disabled = true;
        } else {
            // clearForm();
            password.disabled = false;
        }
    });

    eye.addEventListener("click", togglePassword);

    document.getElementById("btnAdd").addEventListener("click", addUser);
    document.getElementById("btnUpdate").addEventListener("click", updateUser);
    document.getElementById("btnClear").addEventListener("click", clearForm);
    document.getElementById("btnReload").addEventListener("click", fetchUserData);
    deleteBtn.addEventListener("click", confirmDelete);

    // ===== FUNCTIONS =====

    async function fetchUserData() {
        tbody.innerHTML = "";
        status.textContent = "Đang tải dữ liệu...";
        try {
            const res = await ffetch("https://hoanghai69.id.vn/project/Backend/get_users.php", {
                method: "GET",
                credentials: "include"
            });

            const data = await res.json();

            if (!data.success) {
                status.innerHTML = `<span class="error-message">${data.message}</span>`;
                return;
            }

            status.textContent = "Tổng số user: " + data.total;

            data.users.forEach(user => {
                const row = tbody.insertRow();
                row.insertCell().textContent = user.id;
                row.insertCell().textContent = user.username;
                row.insertCell().textContent = user.email;

                const roleCell = row.insertCell();
                roleCell.textContent = user.role.toUpperCase();
                roleCell.style.fontWeight = "bold";
                roleCell.style.color = user.role === "admin" ? "darkred" : "black";

                row.insertCell().textContent =
                    user.timelogin ? formatDateTime(user.timelogin) : "Chưa đăng nhập";

                row.style.cursor = "pointer";
                row.onclick = () => selectUser(row, user);
            });
        } catch (e) {
            console.error(e);
            status.innerHTML = `<span class="error-message">Không thể tải dữ liệu</span>`;
        }
    }

    function selectUser(row, user) {
        document.querySelectorAll("#user-table-body tr").forEach(tr => tr.classList.remove("selected"));
        row.classList.add("selected");

        selectedUserId = user.id;

        userIdInput.value = user.id;
        usernameInput.value = user.username;
        emailInput.value = user.email;
        roleInput.value = user.role;

        addCheckbox.checked = false;
        password.value = "";
        password.disabled = true;
        deleteBtn.disabled = false;
    }

    function togglePassword() {
        if (password.disabled) return;
        if (password.type === "password") {
            password.type = "text";
            eye.classList.remove("fa-eye");
            eye.classList.add("fa-eye-slash");
        } else {
            password.type = "password";
            eye.classList.remove("fa-eye-slash");
            eye.classList.add("fa-eye");
        }
    }

    function addUser() {

        if (!addCheckbox.checked) {
            alert("Hãy tick Thêm người dùng mới");
            return;
        }

        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const pwd = password.value.trim();
        const role = roleInput.value;

        if (!username || !email || !pwd) {
            alert("Vui lòng nhập đầy đủ thông tin");
            return;
        }

        fetch("https://hoanghai69.id.vn/project/Backend/add_user.php", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password: pwd, role })
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                if (data.success) {
                    fetchUserData();
                    clearForm();
                }
            })
            .catch(err => {
                console.error(err);
                alert("Lỗi kết nối server");
            });
    }

    function updateUser() {
        const id = userIdInput.value;
        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const role = roleInput.value;

        if (!id) {
            alert("Vui lòng chọn user cần sửa");
            return;
        }

        fetch("https://hoanghai69.id.vn/project/Backend/update_user.php", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, username, email, role })
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                if (data.success) {
                    fetchUserData();
                    clearForm();
                }
            })
            .catch(err => {
                console.error(err);
                alert("Lỗi kết nối server");
            });
    }

    function confirmDelete() {
        if (!selectedUserId) {
            alert("Vui lòng chọn user cần xóa");
            return;
        }

        if (!confirm("Bạn có chắc chắn muốn xóa user ID = " + selectedUserId + " ?")) return;

        fetch("https://hoanghai69.id.vn/project/Backend/delete_user.php", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: selectedUserId })
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                if (data.success) {
                    fetchUserData();
                    clearForm();
                }
            })
            .catch(err => {
                console.error(err);
                alert("Lỗi kết nối server");
            });
    }

    function clearForm() {
        selectedUserId = null;
        userIdInput.value = "";
        usernameInput.value = "";
        emailInput.value = "";
        password.value = "";
        roleInput.value = "user";
        password.disabled = true;
        addCheckbox.checked = false;
        deleteBtn.disabled = true;
        document.querySelectorAll("#user-table-body tr").forEach(tr => tr.classList.remove("selected"));
    }

    function formatDateTime(str) {
        const d = new Date(str);
        return d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN");
    }

    // ===== LOAD DỮ LIỆU BAN ĐẦU =====
    fetchUserData();
});
