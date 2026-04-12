<?php

if (!isset($_SESSION['user'])) {
    header("Location: index.php?action=login");
    exit;
}
?>

<h2>Xin chào <?= $_SESSION['user'] ?> 🎉</h2>

<nav>
    <a href="index.php?action=home">Trang chủ</a>
    <a href="#">Tìm nhà</a>
    <a href="#">Liên hệ</a>
    <a href="logout.php">Đăng xuất</a>
</nav>