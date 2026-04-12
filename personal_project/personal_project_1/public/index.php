<?php 
session_start();

require_once "../app/controllers/HomeController.php";
require_once "../app/controllers/AuthController.php";
require_once "../app/controllers/UserController.php";
require_once "../app/controllers/AdminController.php";

$action = $_GET['action'] ?? 'home';

switch ($action) {

    case "login":
        $auth = new AuthController();

        if ($_SERVER["REQUEST_METHOD"] == "POST") {
            $auth->login();
        } else {
            $auth->showLogin();
        }
        break;

    case "dashboard":
        $user = new UserController();
        $user->dashboard();
        break;

    case "admin":
        $admin = new AdminController();
        $admin->dashboard();
        break;

    case "logout":
        $auth = new AuthController();
        $auth->logout();
        break;

    default:
        $home = new HomeController();
        $home->index();
        break;
}