<?php
class UserController {

    public function dashboard() {

        // 🔐 kiểm tra đăng nhập
        if (!isset($_SESSION['user'])) {
            header("Location: index.php?action=login");
            exit;
        }

        // 🔐 kiểm tra quyền
        if ($_SESSION['role'] != 'user') {
            echo "Không có quyền truy cập!";
            exit;
        }

        include __DIR__ . "/../views/user/dashboard.php";
    }
}