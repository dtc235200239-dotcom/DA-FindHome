<?php
require_once __DIR__ . '/../models/Database.php';

class User {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    // ========================
    // ĐĂNG NHẬP
    // ========================
    public function checkLogin(string $identifier, string $password): array|false {
        $stmt = $this->db->prepare(
            "SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1"
        );
        $stmt->execute([$identifier, $identifier]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) return false;

        $valid = password_verify($password, $user['password'])
              || $user['password'] === $password;

        return $valid ? $user : false;
    }

    // ========================
    // TÌM KIẾM
    // ========================
    public function findByUsername(string $username): array|false {
        $stmt = $this->db->prepare("SELECT id FROM users WHERE username = ? LIMIT 1");
        $stmt->execute([$username]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function findByEmail(string $email): array|false {
        $stmt = $this->db->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function findByUsernameOrEmail(string $identifier): array|false {
        $stmt = $this->db->prepare(
            "SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1"
        );
        $stmt->execute([$identifier, $identifier]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // ========================
    // TẠO TÀI KHOẢN
    // ========================
    public function createUser(string $username, string $email, string $hashedPassword): int|false {
        $stmt = $this->db->prepare(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)"
        );
        $ok = $stmt->execute([$username, $email, $hashedPassword]);
        return $ok ? (int)$this->db->lastInsertId() : false;
    }

    // ========================
    // LẤY TẤT CẢ USER (ADMIN)
    // ========================
    public function getAll(): array {
        $stmt = $this->db->query(
            "SELECT id, username, email, phone, status, role, created_at FROM users ORDER BY created_at DESC"
        );
        // Trả về name = username để frontend dùng được u.name
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($users as &$u) {
            $u['name'] = $u['username'];
        }
        return $users;
    }

    // ========================
    // KHÓA / MỞ KHÓA
    // ========================
    public function setStatus(int $id, string $status): bool {
        $stmt = $this->db->prepare("UPDATE users SET status = ? WHERE id = ?");
        return $stmt->execute([$status, $id]);
    }

    // ========================
    // XÓA USER
    // ========================
    public function delete(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM users WHERE id = ?");
        return $stmt->execute([$id]);
    }

    // ========================
    // THỐNG KÊ
    // ========================
    public function getStats(): array {
        return $this->db->query("
            SELECT
                COUNT(*) AS total_users,
                SUM(status = 'locked') AS locked_users
            FROM users
        ")->fetch(PDO::FETCH_ASSOC);
    }
}
?>