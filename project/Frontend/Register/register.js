function register() {
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm").value;
    
    if (username === "" || email === "" || password === "") {
        alert("Vui lòng nhập đầy đủ thông tin");
        return;
    }

    if (password !== confirm) {
        alert("Mật khẩu nhập lại không khớp");
        return;
    }

    fetch("../../Backend/register.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username,
            email,
            password
        })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        if (data.success) {
            window.location.href = "../Login/login.html";
        }
    })
    .catch(() => {
        alert("Server không phản hồi");
    });
}

// nút hiển thị mật khẩu 
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
function toggleconfirm() {
    const password = document.getElementById("confirm");
    const eye2 = document.getElementById("eye2");

    if (password.type === "password") {
        password.type = "text";
        eye2.classList.remove("fa-eye");
        eye2.classList.add("fa-eye-slash");
    } else {
        password.type = "password";
        eye2.classList.remove("fa-eye-slash");
        eye2.classList.add("fa-eye");
    }
}
