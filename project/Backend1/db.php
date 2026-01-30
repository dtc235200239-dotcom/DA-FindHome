<?php
$conn = new mysqli("localhost", "root", "", "ql_dangnhap", 3307);
if ($conn->connect_error) {
    // die("Kết nối CSDL thất bại");
    die("Lỗi KẾT NỐI DB: " . $conn->connect_error);
}
$conn->set_charset("utf8");
date_default_timezone_set('Asia/Ho_Chi_Minh');
$conn->query("SET time_zone = '+07:00'");
?>
