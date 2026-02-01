fetch("https://hoanghai69.id.vn/project/Backend/logout.php", {
    method: "POST",
    credentials: "include"
})
.then(res => res.json())
.then(data => {
    alert(data.message);
    if (data.success) {
        window.location.href = "/DA-FindHome/Frontend/Login/login.html";
    }
})
.catch(err => {
    console.error(err);
    alert("Logout thất bại");
});
