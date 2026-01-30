<?php
session_start();
header("Content-Type: application/json");
require "db.php";

if ($_SESSION['role'] !== 'admin') {
    echo json_encode(["success"=>false,"message"=>"Không có quyền"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$id = intval($data['id']);
$username = trim($data['username']);
$email = trim($data['email']);
$role = $data['role'];

$stmt = $conn->prepare(
    "UPDATE users SET username=?, email=?, role=? WHERE id=?"
);
$stmt->bind_param("sssi", $username, $email, $role, $id);

if ($stmt->execute()) {
    echo json_encode(["success"=>true,"message"=>"Cập nhật thành công"]);
} else {
    echo json_encode(["success"=>false,"message"=>"Cập nhật thất bại"]);
}
