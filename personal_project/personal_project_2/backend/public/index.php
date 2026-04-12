<?php
ini_set('display_errors', 1);  // ← đổi 0 thành 1 tạm thời
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header('Content-Type: application/json; charset=UTF-8');

require_once "../app/controller/AuthController.php";
require_once "../app/controller/HouseController.php";
require_once "../app/controller/MessageController.php";

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// Helper trả lỗi method không hợp lệ
function methodNotAllowed() {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method không hợp lệ"]);
    exit();
}

switch ($action) {

    // ── AUTH ────────────────────────────────────────────────
    case "login":
        if ($method !== "POST") methodNotAllowed();
        (new AuthController())->login();
        break;

    case "register":
        if ($method !== "POST") methodNotAllowed();
        (new AuthController())->register();
        break;

    case "logout":
        (new AuthController())->logout();
        break;

    // ── HOUSE — USER ────────────────────────────────────────
    case "get_houses":
        if ($method !== "GET") methodNotAllowed();
        (new HouseController())->getHouses();
        break;

    case "get_my_posts":
        if ($method !== "GET") methodNotAllowed();
        (new HouseController())->getMyPosts();
        break;

    // ── MESSAGE ─────────────────────────────────────────────
    case "send_message":
        if ($method !== "POST") methodNotAllowed();
        (new MessageController())->send();
        break;

    case "get_conversations":
        if ($method !== "GET") methodNotAllowed();
        (new MessageController())->getConversations();
        break;

    case "get_messages":
        if ($method !== "GET") methodNotAllowed();
        (new MessageController())->getMessages();
        break;

        case "search_users":
    if ($method !== "GET") methodNotAllowed();
    (new MessageController())->searchUsers();
    break;

    // ── HOUSE — ADMIN ───────────────────────────────────────
    case "get_all_houses":
        if ($method !== "GET") methodNotAllowed();
        (new HouseController())->getAllHouses();
        break;

    case "add_house":
        if ($method !== "POST") methodNotAllowed();
        (new HouseController())->addHouse();
        break;

    case "upload_image":   // ✅ Gộp upload_images + upload_image thành một
        if ($method !== "POST") methodNotAllowed();
        (new HouseController())->uploadImage();
        break;

    case "update_house":
        if ($method !== "POST") methodNotAllowed();
        (new HouseController())->updateHouse();
        break;

    case "delete_house":
        if ($method !== "POST") methodNotAllowed();
        (new HouseController())->deleteHouse();
        break;

    // ── USER — ADMIN ─────────────────────────────────────────
    case "get_users":
        if ($method !== "GET") methodNotAllowed();
        (new HouseController())->getUsers();
        break;

    case "lock_user":
        if ($method !== "POST") methodNotAllowed();
        (new HouseController())->lockUser();
        break;

    case "unlock_user":
        if ($method !== "POST") methodNotAllowed();
        (new HouseController())->unlockUser();
        break;

    case "delete_user":
        if ($method !== "POST") methodNotAllowed();
        (new HouseController())->deleteUser();
        break;

    // ── STATS ────────────────────────────────────────────────
    case "get_stats":
        if ($method !== "GET") methodNotAllowed();
        (new HouseController())->getStats();
        break;

    // Them 
    case "get_unread":
        if ($method !== "GET") methodNotAllowed();
        (new MessageController())->getUnread();
        break;

    case "delete_message":
        if ($method !== "POST") methodNotAllowed();
        (new MessageController())->deleteMessage();
        break;

    // ── DEFAULT ──────────────────────────────────────────────
    default:
        http_response_code(404);
        // ✅ Không trả về $action để tránh lộ cấu trúc API
        echo json_encode(["status" => "error", "message" => "Action không tồn tại"]);
        break;
}
?>