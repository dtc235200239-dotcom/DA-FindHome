<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");
require "db.php";

if ($_SESSION['role'] !== 'admin') {
    echo json_encode(["success"=>false,"message"=>"Không có quyền"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$username = trim($data['username'] ?? '');
$email = trim($data['email'] ?? '');
$password = $data['password'] ??'';
$role = $data['role'] ?? 'user';

$hash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $conn->prepare(
    "INSERT INTO users(username, email, password, role) VALUES (?, ?, ?, ?)"
);

$stmt->bind_param("ssss", $username, $email,$password, $role);

if ($stmt->execute()) {
    echo json_encode(["success"=>true,"message"=>"Đã thêm user"]);
} else {
    echo json_encode(["success"=>false,"message"=>"Thêm thất bại"]);
}
