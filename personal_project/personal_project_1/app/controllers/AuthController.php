<?php
require_once __DIR__ . "/../models/User.php";

class AuthController {

    // Hiển thị form login
    public function showLogin() {
        include __DIR__ . "/../views/auth/login.php";
    }

    // Xử lý login
    public function login() {

        $username = $_POST['username'];
        $password = $_POST['password'];

        $userModel = new User();
        $user = $userModel->checkLogin($username, $password);

        if ($user) {
            $_SESSION['user'] = $user['username'];
            $_SESSION['role'] = $user['role'];

            // 🔥 phân quyền
            if ($user['role'] == 'admin') {
                header("Location: index.php?action=admin");
            } else {
                header("Location: index.php?action=dashboard");
            }
            exit;

        } else {
            echo "Sai tài khoản hoặc mật khẩu!";
        }
    }

    // Logout
    public function logout() {
        session_start();
        session_destroy();

        header("Location: index.php?action=login");
        exit;
    }
}