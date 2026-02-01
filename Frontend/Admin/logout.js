document.getElementById("btnLogout").addEventListener("click", () => {
    if (!confirm("Bạn có chắc chắn muốn đăng xuất?")) return;

    fetch("https://hoanghai69.id.vn/project/Backend/logout.php", {
        method: "POST",
        credentials: "include" // QUAN TRỌNG để gửi session
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert("Đăng xuất thành công");
            window.location.href = "/project/Frontend/index.html";
        } else {
            alert("Logout thất bại");
        }
    })
    .catch(err => {
        console.error(err);
        alert("Lỗi kết nối server");
    });
});
