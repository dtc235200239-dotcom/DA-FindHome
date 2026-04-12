<?php
require_once __DIR__ . '/../models/User.php';

class AuthController {

    // ĐĂNG NHẬP
    public function login() {
    $data = json_decode(file_get_contents("php://input"), true);

    $identifier = $data['identifier'] ?? '';
    $password   = $data['password'] ?? '';

    if (!$identifier || !$password) {
        echo json_encode(["status" => "error", "message" => "Thiếu dữ liệu"]);
        return;
    }

    $userModel = new User();
        $user = $userModel->checkLogin($identifier, $password);

    if (!$user) {
        echo json_encode(["status" => "error", "message" => "Sai tài khoản hoặc mật khẩu"]);
        return;
    }

    // check khóa đăng nhập 
    if ($user['status'] === 'locked') {
        echo json_encode([
            "status" => "error",
            "message" => "Tài khoản đã bị khóa"
        ]);
        return;
    }

    unset($user['password']);

    //PHÂN QUYỀN
    // $redirect = ($user['role'] === 'admin')
    //     ? "/MY_PROJECT/personal_project/personal_project_2/frontend/admin/add-admin"
    //     : "/MY_PROJECT/personal_project/personal_project_2/frontend/user/dashboard";

    $role = strtolower($user['role'] ?? '');

    switch ($role) {
        case 'admin':
            $redirect = "/MY_PROJECT/personal_project/personal_project_2/frontend/admin/add-admin";
        break;

        case 'user':
            $redirect = "/MY_PROJECT/personal_project/personal_project_2/frontend/user/dashboard";
        break;

        default:
            $redirect = "/MY_PROJECT/personal_project/personal_project_2/frontend/";
        break;
    }
    echo json_encode([
        "status" => "success",
        "message" => "Đăng nhập thành công",
        "data" => $user,
        "redirect" => $redirect
    ]);
}

    // ĐĂNG KÝ
    public function register() {
        $data = $this->getJsonInput();

        $username        = trim($data->username ?? '');
        $email           = trim($data->email ?? '');
        $password        = trim($data->password ?? '');
        $confirmPassword = trim($data->confirm_password ?? '');

        // --- Validate ---
        if (empty($username) || empty($email) || empty($password) || empty($confirmPassword)) {
            $this->respond(400, 'error', 'Vui lòng nhập đầy đủ thông tin!');
            return;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->respond(400, 'error', 'Email không hợp lệ!');
            return;
        }

        // if (strlen($password) < 6) {
        //     $this->respond(400, 'error', 'Mật khẩu phải có ít nhất 6 ký tự!');
        //     return;
        // }
        $errors = [];

        // Độ dài
        if (strlen($password) < 8) {
            $errors[] = "ít nhất 8 ký tự";
        }

        // Chữ thường
        if (!preg_match('/[a-z]/', $password)) {
            $errors[] = "chữ thường";
        }

        // Chữ hoa
        if (!preg_match('/[A-Z]/', $password)) {
            $errors[] = "chữ hoa";
        }

        // Số
        if (!preg_match('/[0-9]/', $password)) {
            $errors[] = "số";
        }

        // Ký tự đặc biệt
        if (!preg_match('/[\W_]/', $password)) {
            $errors[] = "ký tự đặc biệt";
        }

        // Nếu có lỗi → báo chi tiết
        if (!empty($errors)) {
            $this->respond(
                400,
                'error',
                'Mật khẩu phải có: ' . implode(', ', $errors)
            );
            return;
        }

        if ($password !== $confirmPassword) {
            $this->respond(400, 'error', 'Mật khẩu nhập lại không khớp!');
            return;
        }

        // Check password leak
        if ($this->isPasswordLeaked($password)) {
            $this->respond(400, 'error', 'Mật khẩu này đã bị lộ trong các vụ rò rỉ dữ liệu. Hãy đổi sang một mật khẩu khác bảo mật hơn!');
            return;
        }

        $userModel = new User();

        // --- Kiểm tra trùng username / email ---
        if ($userModel->findByUsername($username)) {
            $this->respond(409, 'error', 'Tên đăng nhập đã tồn tại!');
            return;
        }

        if ($userModel->findByEmail($email)) {
            $this->respond(409, 'error', 'Email đã được sử dụng!');
            return;
        }

        // --- Tạo tài khoản ---
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        $newUserId      = $userModel->createUser($username, $email, $hashedPassword);

        if ($newUserId) {
            $this->respond(201, 'success', 'Đăng ký thành công!', [
                'user' => [
                    'id'       => $newUserId,
                    'username' => $username,
                    'email'    => $email,
                ]
            ]);
        } else {
            $this->respond(500, 'error', 'Đăng ký thất bại, vui lòng thử lại!');
        }
    }

    // ĐĂNG XUẤT
    public function logout() {
        $this->startSession();
        $_SESSION = [];
        session_destroy();
        $this->respond(200, 'success', 'Đăng xuất thành công!');
    }

    // KIỂM TRA SESSION (dùng cho frontend check trạng thái login)
    public function me() {
        $this->startSession();

        if (!empty($_SESSION['user_id'])) {
            $this->respond(200, 'success', 'Đã đăng nhập', [
                'user' => [
                    'id'       => $_SESSION['user_id'],
                    'username' => $_SESSION['username'],
                    'email'    => $_SESSION['email'],
                ]
            ]);
        } else {
            $this->respond(401, 'error', 'Chưa đăng nhập');
        }
    }

    // HELPERS PRIVATE

    /** Đọc JSON từ body request */
    private function getJsonInput(): object {
        $raw = file_get_contents('php://input');
        return json_decode($raw) ?? (object)[];
    }

    /** Khởi động session an toàn (không khởi động 2 lần) */
    private function startSession(): void {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    /** Trả về JSON chuẩn */
    private function respond(int $code, string $status, string $message, array $extra = []): void {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(
            array_merge(['status' => $status, 'message' => $message], $extra),
            JSON_UNESCAPED_UNICODE
        );
    }

    // Kiểm tra mật khẩu
    private function isPasswordLeaked($password): bool {
    // 1. Hash SHA1
    $sha1 = strtoupper(sha1($password));

    // 2. Tách prefix + suffix
    $prefix = substr($sha1, 0, 5);
    $suffix = substr($sha1, 5);

    // 3. Gọi API HIBP
    $url = "https://api.pwnedpasswords.com/range/" . $prefix;

    $response = @file_get_contents($url);
    if ($response === false) {
        return false; // nếu lỗi API thì bỏ qua
    }

    // 4. So sánh
    $lines = explode("\n", $response);

    foreach ($lines as $line) {
        list($hashSuffix, $count) = explode(":", trim($line));
        if ($hashSuffix === $suffix) {
            return true; // password đã bị leak
        }
    }

    return false;
}
}
?>