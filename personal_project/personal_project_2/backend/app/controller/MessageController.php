<?php
require_once "../app/models/Database.php";

class MessageController {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getConversations() {
        $uid = $_GET['user_id'] ?? null;
        if (!$uid) {
            echo json_encode(["status" => "error", "message" => "Thiếu user_id"]);
            return;
        }

        $sql = "SELECT m1.*, 
                       u.username AS partner_name, 
                       h.name AS house_name
                FROM messages m1
                JOIN (
                    SELECT MAX(id) as last_id
                    FROM messages
                    WHERE sender_id = ? OR receiver_id = ?
                    GROUP BY IF(sender_id = ?, receiver_id, sender_id), house_id
                ) m2 ON m1.id = m2.last_id
                JOIN users u ON u.id = IF(m1.sender_id = ?, m1.receiver_id, m1.sender_id)
                LEFT JOIN houses h ON h.id = m1.house_id
                ORDER BY m1.created_at DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$uid, $uid, $uid, $uid]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $result = array_map(function($r) use ($uid) {
            return [
                'partner_id'   => ($r['sender_id'] == $uid) ? $r['receiver_id'] : $r['sender_id'],
                'partner_name' => $r['partner_name'],
                'house_id'     => $r['house_id'],
                'house_name'   => $r['house_name'],
                'last_msg'     => $r['content'],
                'unread'       => 0
            ];
        }, $rows);

        echo json_encode(["status" => "success", "data" => $result]);
    }

    public function getMessages() {
        $uid = $_GET['user_id'] ?? null;
        $pid = $_GET['partner_id'] ?? null;
        $hid = $_GET['house_id'] ?? null;

        // ✅ Validate đầu vào - thiếu return khiến query chạy với giá trị null
        if (!$uid || !$pid) {
            echo json_encode(["status" => "error", "message" => "Thiếu user_id hoặc partner_id"]);
            return;
        }

        // ✅ Dùng prepared statement thay vì nhúng biến trực tiếp vào SQL (SQL Injection)
        if ($hid !== null) {
            $sql = "SELECT * FROM messages 
                    WHERE ((sender_id = ? AND receiver_id = ?) 
                       OR  (sender_id = ? AND receiver_id = ?))
                    AND house_id = ?
                    ORDER BY created_at ASC";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([$uid, $pid, $pid, $uid, $hid]);
        } else {
            $sql = "SELECT * FROM messages 
                    WHERE ((sender_id = ? AND receiver_id = ?) 
                       OR  (sender_id = ? AND receiver_id = ?))
                    AND house_id IS NULL
                    ORDER BY created_at ASC";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([$uid, $pid, $pid, $uid]);
        }

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // ✅ Trả về response - thiếu phần này khiến server không gửi gì / gửi 2 lần
        echo json_encode(["status" => "success", "data" => $rows]);
    }
    public function send() {
    $data = json_decode(file_get_contents("php://input"), true);
    if (empty($data['sender_id']) || empty($data['receiver_id']) || empty($data['content'])) {
        echo json_encode(["status" => "error", "message" => "Thiếu dữ liệu"]);
        return;
    }

    $stmt = $this->db->prepare("
        INSERT INTO messages (house_id, sender_id, receiver_id, content, created_at)
        VALUES (?, ?, ?, ?, NOW())
    ");
    $ok = $stmt->execute([
        $data['house_id'] ?? null,
        $data['sender_id'],
        $data['receiver_id'],
        trim($data['content'])
    ]);

    if ($ok) {
        // ✅ Trả về id để JS cập nhật tempMsg
        echo json_encode(["status" => "success", "data" => ["id" => (int)$this->db->lastInsertId()]]);
    } else {
        echo json_encode(["status" => "error"]);
    }
}

// ✅ Thêm mới
public function getUnread() {
    $uid = $_GET['user_id'] ?? null;
    if (!$uid) {
        echo json_encode(["status" => "error", "message" => "Thiếu user_id"]);
        return;
    }
    $stmt = $this->db->prepare("
        SELECT COUNT(*) as cnt FROM messages
        WHERE receiver_id = ? AND is_read = 0
    ");
    $stmt->execute([$uid]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode(["status" => "success", "unread" => (int)$row['cnt']]);
}

// ✅ Thêm mới
public function deleteMessage() {
    $data = json_decode(file_get_contents("php://input"), true);
    $msgId = $data['message_id'] ?? null;
    $uid   = $data['user_id'] ?? null; // bảo vệ: chỉ xóa tin của chính mình

    if (!$msgId) {
        echo json_encode(["status" => "error", "message" => "Thiếu message_id"]);
        return;
    }

    $stmt = $this->db->prepare("
        DELETE FROM messages WHERE id = ? AND sender_id = ?
    ");
    $ok = $stmt->execute([$msgId, $uid]);
    echo json_encode($ok && $stmt->rowCount() > 0
        ? ["status" => "success"]
        : ["status" => "error", "message" => "Không tìm thấy hoặc không có quyền"]
    );
}
public function searchUsers() {
    $q   = trim($_GET['q']   ?? '');
    $uid = $_GET['user_id']  ?? null;

    if (!$q) {
        echo json_encode(["status" => "success", "data" => []]);
        return;
    }

    $stmt = $this->db->prepare("
        SELECT id, username, email
        FROM users
        WHERE (username LIKE ? OR email LIKE ?)
          AND id != ?
          AND status != 'locked'
        LIMIT 10
    ");
    $stmt->execute(["%$q%", "%$q%", $uid ?: 0]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $rows]);
}
}