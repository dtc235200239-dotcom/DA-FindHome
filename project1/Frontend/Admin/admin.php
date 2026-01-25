<?php
session_start();
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    header("Location: /project/Frontend/Login/login.html");
    exit;
}
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Admin - Quản lý user</title>
    <link rel="stylesheet" href="admin.css">
    <link rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>

<body>
<div class="container">
    <h1>Quản Trị Người Dùng</h1>

    <div id="status">Đang tải dữ liệu...</div>

    <!-- BẢNG -->
    <table>
        <thead>
        <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Login cuối</th>
        </tr>
        </thead>
        <tbody id="user-table-body"></tbody>
    </table>

    <h3>Thêm / Sửa / Xóa</h3>

    <!-- FORM -->
        <div class="box-sua">

            <div class="box-input">
                <label>ID</label>
                <input id="userId" disabled>

                <label>Username</label>
                <input type="text" id="username">

                <label>Email</label>
                <input type="email" id="email">

                <label>Password</label>
                <div class="password-box">
                    <input type="password" id="password" disabled>
                    <i class="fa-solid fa-eye" id="eye"></i>
                </div>

                <label>Role</label>
                <select id="role">
                    <option value="user">USER</option>
                    <option value="admin">ADMIN</option>
                </select>
            </div>
            <br>

            <div class="check">
                <label for="addCheckbox">
                    <input type="checkbox" id="addCheckbox">Thêm người dùng mới
                </label>
            </div>
            <!-- BUTTON -->
            <div class="btn">
                <!-- CHECKBOX -->
                
                <button class="btn1" type="button" id="btnAdd">➕ Thêm</button>
                <button class="btn2" type="button" id="btnUpdate">✏️ Sửa</button>
                <button class="btn3" type="button" id="deleteBtn" disabled>❌ Xóa</button>
                <button class="btn4" type="button" id="btnClear">🔄 Đặt lại</button>
                <button class="btn5" type="button" id="btnReload">🔃 Load lại bảng</button>
            </div>
        </div>

    <br>
    <a href="/project/Frontend/Home/home.php">Trang người dùng</a> |
    <a href="/project/Backend/logout.php">Logout</a>
</div>

<script src="script_admin.js"></script>
</body>
</html>
