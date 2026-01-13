<?php
header("Content-Type: application/json; charset=UTF-8");
require "db.php";
//require "session.php";

$data = json_decode(file_get_contents("php://input"), true);

$username = $data['username'] ?? '';
$email    = $data['email'] ?? '';
$password = $data['password'] ?? '';

// THÊM: kiểm tra độ dài mật khẩu
if (strlen($password) < 8) {
    echo json_encode([
        "success" => false,
        "code" => "PASSWORD_TOO_SHORT",
        "message" => "Mật khẩu phải có ít nhất 8 ký tự"
    ]);
    exit;
}


if ($username === '' || $email === '' || $password === '') {
    echo json_encode(["success"=>false,"message"=>"Thiếu dữ liệu"]);
    exit;
}

$hash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $conn->prepare(
    "INSERT INTO users(username, email, password, role)
     VALUES (?, ?, ?, 'user')"
);
$stmt->bind_param("sss", $username, $email, $hash);

if ($stmt->execute()) {
    echo json_encode(["success"=>true,"message"=>"Đăng ký thành công"]);
} else {
    echo json_encode(["success"=>false,"message"=>"Tên đăng nhập hoặc email đã tồn tại"]);
}
