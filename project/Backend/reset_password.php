<?php
header("Content-Type: application/json");
require "db.php";

$data = json_decode(file_get_contents("php://input"), true);

$token = $data['token'] ?? '';
$password = $data['password'] ?? '';

if (!$token || !$password) {
    echo json_encode(["success"=>false,"message"=>"Thiếu dữ liệu"]);
    exit;
}

// Kiểm tra token còn hạn
$stmt = $conn->prepare(
    "SELECT id FROM users WHERE reset_token=? AND reset_expire > NOW()"
);
$stmt->bind_param("s", $token);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    echo json_encode(["success"=>false,"message"=>"Link không hợp lệ hoặc hết hạn"]);
    exit;
}

$user = $res->fetch_assoc();
$hash = password_hash($password, PASSWORD_DEFAULT);

// Cập nhật mật khẩu + xóa token
$stmt = $conn->prepare(
    "UPDATE users SET password=?, reset_token=NULL, reset_expire=NULL WHERE id=?"
);
$stmt->bind_param("si", $hash, $user['id']);
$stmt->execute();

echo json_encode(["success"=>true,"message"=>"Đổi mật khẩu thành công"]);
