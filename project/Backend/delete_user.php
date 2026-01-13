<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

require __DIR__ . "/db.php"; // ✅ SỬA Ở ĐÂY
//require "/session.php";

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Không có quyền"
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$id = intval($data['id'] ?? 0);

// ❌ Không cho xóa chính mình
if ($id === intval($_SESSION['user_id'])) {
    echo json_encode([
        "success" => false,
        "message" => "Không thể xóa chính tài khoản đang đăng nhập"
    ]);
    exit;
}

if ($id <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "ID không hợp lệ"
    ]);
    exit;
}

$stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Đã xóa user thành công"
    ]);
    exit;
} else {
    echo json_encode([
        "success" => false,
        "message" => "Xóa user thất bại"
    ]);
    exit;
}

