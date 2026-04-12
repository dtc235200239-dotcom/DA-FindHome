<!-- làm việc với database - kết nối database -->
<?php
class Database {
    private $host = "localhost";
    private $user = "root";
    private $pass = "";
    private $db   = "dbwebsite";
    private $port = 3307;

    public $conn;

    public function __construct() {
        $this->conn = new mysqli(
            $this->host,
            $this->user,
            $this->pass,
            $this->db,
            $this->port
        );

        if ($this->conn->connect_error) {
            die("Lỗi KẾT NỐI DB: " . $this->conn->connect_error);
        }

        $this->conn->set_charset("utf8");
    }
}
?>