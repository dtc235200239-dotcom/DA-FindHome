<?php
// 🔴 BẮT BUỘC ĐẦU FILE
session_start();

// 🔹 KẾT NỐI REDIS
$redis = new Redis();
$redis->connect("127.0.0.1", 6379);

// 🔹 ĐÁNH DẤU USER ONLINE
if (isset($_SESSION['user_id'])) {
    $redis->setex(
        "user_online:{$_SESSION['user_id']}",
        300, // 5 phút
        time()
    );
}
