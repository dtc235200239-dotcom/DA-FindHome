<?php
header("Content-Type: application/json");
require "db.php";

$data = json_decode(file_get_contents("php://input"), true);
$email = trim($data['email'] ?? '');

if ($email === '') {
    echo json_encode(["success"=>false,"message"=>"Email không hợp lệ"]);
    exit;
}

// Kiểm tra email tồn tại
$stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    echo json_encode(["success"=>false,"message"=>"Email không tồn tại"]);
    exit;
}

$user = $res->fetch_assoc();

// Tạo token
$token = bin2hex(random_bytes(32));

$expire = (new DateTime('now', new DateTimeZone('Asia/Ho_Chi_Minh')))
            ->modify('+5 minutes')
            ->format('Y-m-d H:i:s');

$stmt = $conn->prepare(
    "UPDATE users SET reset_token=?, reset_expire=? WHERE id=?"
);
$stmt->bind_param("ssi", $token, $expire, $user['id']);
$stmt->execute();

// 🔥 DEV MODE: trả link về frontend
$link = "http://localhost:8080/project/Frontend/Forgot/reset.html?token=$token";

echo json_encode([
    "success" => true,
    "message" => "Đã gửi link đặt lại mật khẩu",
    "link" => $link
]);
