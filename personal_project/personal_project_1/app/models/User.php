<?php
require_once "Database.php";

class User {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    public function checkLogin($username, $password) {
    $sql = "SELECT * FROM users 
            WHERE username='$username' 
            AND password='$password'";

    $result = $this->db->conn->query($sql);

    if ($result->num_rows > 0) {
        return $result->fetch_assoc(); // 🔥 trả về mảng
    } else {
        return false;
    }
}
}