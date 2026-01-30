<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");
require "db.php";

$data = json_decode(file_get_contents("php://input"), true);

$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

if ($username === '' || $password === '') {
    echo json_encode(["success"=>false, "code"=>"EMPTY"]);
    exit;
}

/* ================= THÊM BẮT ĐẦU ================= */
// kiểm tra người dùng nhập email hay username
$isEmail = filter_var($username, FILTER_VALIDATE_EMAIL);
/* ================= THÊM KẾT THÚC ================= */

$stmt = $conn->prepare(
    /* ================= THÊM: đổi điều kiện WHERE ================= */
    "SELECT id, password, email, role 
     FROM users 
     WHERE " . ($isEmail ? "email = ?" : "username = ?")
);
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["success"=>false, "code"=>"USER_NOT_FOUND"]);
    exit;
}

$user = $result->fetch_assoc();

if (!password_verify($password, $user['password'])) {
    echo json_encode(["success"=>false, "code"=>"WRONG_PASSWORD"]);
    exit;
}

// tạo thời gian đăng nhập 
$update_stmt = $conn->prepare(
    "UPDATE users SET timelogin = NOW() WHERE id = ?"
);
$update_stmt->bind_param("i", $user['id']);
$update_stmt->execute();
$update_stmt->close();

// TẠO SESSION – ĐÂY MỚI LÀ BẢO MẬT 
$_SESSION['user_id'] = $user['id'];
$_SESSION['role']    = $user['role'];

echo json_encode([
    "success" => true,
    "role" => $user['role']
]);
