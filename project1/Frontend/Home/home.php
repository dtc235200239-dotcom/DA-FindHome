<?php
session_start();

if (!isset($_SESSION['user_id'])) {
    header("Location: /project/Frontend/Login/login.html");
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Home</title>
    <link rel="stylesheet" href="stylehome.css">
</head>
<body>
    <div class="homemenu">
        <h1>Trang chủ</h1>
        
        <div class="out">
            <button>
                <a href="/project/Backend/logout.php">Logout</a>
            </button>
        </div>
    </div>
</body>
</html>