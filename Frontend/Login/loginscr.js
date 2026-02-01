// Hiện / Ẩn mật khẩu
function togglePassword() {
    const password = document.getElementById("password");
    const eye = document.getElementById("eye");

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

// kiểm tra mk 
function send() {
    fetch("https://hoanghai69.id.vn/project/Backend/logindb.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: document.getElementById("email-username").value,
            password: document.getElementById("password").value
        })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showMessage("🎉 Đăng nhập thành công!", "success");

                setTimeout(() => {
                    if (data.role === "user") {
                        window.location.href = "../DA-FindHome/project/Frontend/Home/home.php";
                    } else {
                        window.location.href = "../DA-FindHome/project/Frontend/Admin/admin.php";
                    }
                }, 1000);

            } else {
                switch (data.code) {
                    case "EMPTY":
                        showMessage("⚠ Vui lòng nhập đầy đủ thông tin", "warning");
                        break;
                    case "USER_NOT_FOUND":
                        showMessage("❌ Tài khoản không tồn tại", "error");
                        break;
                    case "WRONG_PASSWORD":
                        showMessage("❌ Mật khẩu không đúng", "error");
                        break;
                    default:
                        showMessage("❌ Có lỗi xảy ra", "error");
                }
            }
        });
}


// Hiển thị thông báo
function showMessage(message, type = "success") {
    const notification = document.getElementById("notification");
    notification.classList.remove("success", "error", "warning", "show");
    notification.textContent = message;
    notification.classList.add(type);
    setTimeout(() => {
        notification.classList.add("show");
    }, 10);
    setTimeout(() => {
        notification.classList.remove("show");
    }, 4000);
}
