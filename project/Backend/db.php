<?php
$conn = new mysqli("localhost", "h12448183e_ql_dangnhap", "dZEkSPs8gZe6Ax97PCVR", "h12448183e_ql_dangnhap");
if ($conn->connect_error) {
    // die("Kết nối CSDL thất bại");
    die("Lỗi KẾT NỐI DB: " . $conn->connect_error);
}
$conn->set_charset("utf8");
date_default_timezone_set('Asia/Ho_Chi_Minh');
$conn->query("SET time_zone = '+07:00'");
?>
