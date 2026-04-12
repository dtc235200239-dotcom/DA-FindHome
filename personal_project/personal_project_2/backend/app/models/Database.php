<?php
// require_once "../app/config/db.php";
//require_once __DIR__ . '/../config/db.php';

class Database {
    private static ?Database $instance = null;
    private string $host = "localhost";
    private string $user = "root";
    private string $pass = "";
    private string $db   = "dbwebsite";
    private int    $port = 3307;
    private PDO $conn;
    private function __construct() {
        $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->db};charset=utf8mb4";

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,   // Ném exception khi lỗi SQL
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,         // Fetch mặc định là mảng kết hợp
            PDO::ATTR_EMULATE_PREPARES   => false,                    // Dùng prepared statement thật
        ];

        try {
            $this->conn = new PDO($dsn, $this->user, $this->pass, $options);
        } catch (PDOException $e) {
            header('Content-Type: application/json; charset=UTF-8');
            http_response_code(500);
            echo json_encode([
                "status"  => "error",
                "message" => "Không thể kết nối đến cơ sở dữ liệu!",
                // Bỏ dòng dưới khi lên production để không lộ thông tin nhạy cảm
                "debug"   => $e->getMessage(),
            ], JSON_UNESCAPED_UNICODE);
            exit();
        }
    }

    /** Singleton — chỉ tạo 1 kết nối duy nhất trong toàn bộ request */
    public static function getInstance(): static {
        if (static::$instance === null) {
            static::$instance = new static();
        }
        return static::$instance;
    }

    /** Trả về object PDO để các Model dùng */
    public function getConnection(): PDO {
        return $this->conn;
    }

    /** Chặn clone và unserialize để bảo vệ Singleton */
    private function __clone() {}
    public function __wakeup() {
        throw new \Exception("Không thể deserialize singleton Database!");
    }
}
?>