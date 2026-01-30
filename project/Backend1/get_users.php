<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");
require "db.php";
//require "../../Backend/session.php";

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(["success"=>false,"message"=>"Không có quyền truy cập"]);
    exit;
}

$stmt = $conn->prepare(
    "SELECT id, username, email, timelogin, role FROM users ORDER BY id ASC"
);
$stmt->execute();
$result = $stmt->get_result();

$users = [];
while ($row = $result->fetch_assoc()) {
    $users[] = $row;
}

echo json_encode([
    "success" => true,
    "total" => count($users),
    "users" => $users
]);
