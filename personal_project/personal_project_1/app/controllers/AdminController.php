<?php
class AdminController {

    public function dashboard() {

        // 🔐 kiểm tra đăng nhập
        if (!isset($_SESSION['user'])) {
            header("Location: index.php?action=login");
            exit;
        }

        // 🔐 kiểm tra quyền admin
        if ($_SESSION['role'] != 'admin') {
            echo "Bạn không phải admin!";
            exit;
        }

        include __DIR__ . "/../views/admin/dashboard.php";
    }
}