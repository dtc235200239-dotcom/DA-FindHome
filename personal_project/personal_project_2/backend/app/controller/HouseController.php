<?php
require_once "../app/models/House.php";
require_once "../app/models/User.php";

class HouseController {
    private $houseModel;
    private $userModel;

    public function __construct() {
        $this->houseModel = new House();
        $this->userModel  = new User();
    }

    // ========================
    // THÊM NHÀ (TRẢ VỀ ID MỚI ĐỂ GẮN ẢNH)
    // ========================
    public function addHouse() {
        // 1. Phải lấy dữ liệu bằng luồng này vì JS gửi dạng JSON
        $input = json_decode(file_get_contents('php://input'), true);

        // Nếu không có dữ liệu JSON thì báo lỗi ngay
        if (!$input) {
            echo json_encode(['status' => 'error', 'message' => 'Dữ liệu không hợp lệ hoặc trống!']);
            return;
        }

        // 2. Chuẩn bị mảng data (Hứng chính xác các trường từ Payload của bạn)
        $data = [
            'user_id'     => $input['user_id'] ?? null,  // Đây là dòng quan trọng nhất!
            'name'        => $input['name'] ?? '',
            'type'        => $input['type'] ?? '',
            'area'        => $input['area'] ?? '',
            'address'     => $input['address'] ?? '',
            'district'    => $input['district'] ?? '',
            'price'       => $input['price'] ?? 0,
            'areaM2'      => $input['areaM2'] ?? 0,
            'rating'      => $input['rating'] ?? 5,
            'description' => $input['description'] ?? '',
            'verified'    => $input['verified'] ?? 0,
            'phone'       => $input['phone'] ?? '',
            'tags'        => $input['tags'] ?? []
        ];

        // 3. Kiểm tra an toàn trước khi gọi Model
        if (empty($data['user_id'])) {
            echo json_encode(['status' => 'error', 'message' => 'Lỗi: Backend không nhận được user_id!']);
            return;
        }

        // 4. Gọi Model để Insert vào DB
        $houseModel = new House();
        $houseId = $houseModel->create($data); // Hàm này nằm ở House.php (dòng 44)

        // 5. Trả kết quả về cho JS
        if ($houseId) {
            echo json_encode(['status' => 'success', 'id' => $houseId]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Lỗi câu lệnh SQL khi lưu vào database!']);
        }
    }

    // ========================
    // UPLOAD ẢNH (NHẬN TỪNG ẢNH TỪ JS FORM DATA)
    // ========================
    public function uploadImage() {
        if (!isset($_FILES['image'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Không có file được gửi lên"]);
            return;
        }

        $file     = $_FILES['image'];
        $house_id = $_POST['house_id'] ?? null;

        if (!$house_id) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Thiếu ID nhà (house_id) để gắn ảnh"]);
            return;
        }

        if ($file['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Lỗi upload: " . $file['error']]);
            return;
        }

        $allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        $finfo    = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        // finfo_close($finfo);

        $isPrimary = isset($_POST['is_primary']) ? (int)$_POST['is_primary'] : 0;

        if (!in_array($mimeType, $allowedTypes)) {
            http_response_code(415);
            echo json_encode(["status" => "error", "message" => "Chỉ chấp nhận file ảnh định dạng JPG, PNG, WEBP"]);
            return;
        }

        if ($file['size'] > 5 * 1024 * 1024) {
            http_response_code(413);
            echo json_encode(["status" => "error", "message" => "File quá lớn, tối đa 5MB"]);
            return;
        }

        $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = uniqid('house_', true) . '.' . strtolower($ext);
        
        // Đảm bảo thư mục tồn tại
        $uploadDir = __DIR__ . '/../../public/uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $savePath = $uploadDir . $filename;
        $publicUrl = '/public/uploads/' . $filename;

        if (!move_uploaded_file($file['tmp_name'], $savePath)) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Không thể lưu file trên server"]);
            return;
        }

        $result = $this->houseModel->addImage($house_id, $publicUrl, $isPrimary);

        if (!$result) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Lưu thông tin ảnh vào CSDL thất bại"]);
            return;
        }

        echo json_encode(["status" => "success", "message" => "Upload ảnh thành công!", "url" => $publicUrl]);
    }

    // ========================
    // LẤY NHÀ (USER)
    // ========================
    public function getHouses() {
    $page    = isset($_GET['page'])    ? (int)$_GET['page'] : 1;
    $area    = $_GET['area']           ?? null;
    $keyword = $_GET['keyword']        ?? null;

    $result = (new House())->getAllHousesPaged($area, $keyword, $page);

    echo json_encode([
        'status'       => 'success',
        'data'         => $result['houses'],
        'total_pages'  => $result['total_pages'],
        'current_page' => $result['current_page'],
    ]);
}

    // ========================
    // LẤY TẤT CẢ NHÀ (ADMIN)
    // ========================
    public function getAllHouses() {
        $search = $_GET['search'] ?? null;
        $status = $_GET['status'] ?? null;
        $area   = $_GET['area']   ?? null;
        $houses = $this->houseModel->getAllAdmin($search, $status, $area);
        echo json_encode(["status" => "success", "data" => $houses]);
    }

    // ========================
    // CẬP NHẬT NHÀ
    // ========================
    public function updateHouse() {
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['id']) || empty($data['name'])) {
            http_response_code(422);
            echo json_encode(["status" => "error", "message" => "Thiếu ID hoặc tên phòng"]);
            return;
        }

        $ok = $this->houseModel->update($data);
        if ($ok) {
            echo json_encode(["status" => "success", "message" => "Đã cập nhật thành công"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Lỗi khi cập nhật"]);
        }
    }

    // ========================
    // XÓA NHÀ
    // ========================
    public function deleteHouse() {
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['id'])) {
            http_response_code(422);
            echo json_encode(["status" => "error", "message" => "Thiếu ID để xóa"]);
            return;
        }

        $ok = $this->houseModel->delete((int)$data['id']);
        if ($ok) {
            echo json_encode(["status" => "success", "message" => "Đã xóa bài viết"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Lỗi khi xóa"]);
        }
    }

    // ========================
    // DANH SÁCH USER (ADMIN)
    // ========================
    public function getUsers() {
        $users = $this->userModel->getAll();
        echo json_encode(["status" => "success", "data" => $users]);
    }

    // ========================
    // KHÓA USER
    // ========================
    public function lockUser() {
        $data = json_decode(file_get_contents("php://input"), true);
        if (empty($data['id'])) { http_response_code(422); echo json_encode(["status" => "error", "message" => "Thiếu id"]); return; }
        $ok = $this->userModel->setStatus((int)$data['id'], 'locked');
        echo json_encode($ok ? ["status" => "success"] : ["status" => "error", "message" => "Lỗi thực thi DB"]);
    }

    // ========================
    // MỞ KHÓA USER
    // ========================
    public function unlockUser() {
        $data = json_decode(file_get_contents("php://input"), true);
        if (empty($data['id'])) { http_response_code(422); echo json_encode(["status" => "error", "message" => "Thiếu id"]); return; }
        $ok = $this->userModel->setStatus((int)$data['id'], 'active');
        echo json_encode($ok ? ["status" => "success"] : ["status" => "error", "message" => "Lỗi thực thi DB"]);
    }

    // ========================
    // XÓA USER
    // ========================
    public function deleteUser() {
        $data = json_decode(file_get_contents("php://input"), true);
        if (empty($data['id'])) { http_response_code(422); echo json_encode(["status" => "error", "message" => "Thiếu id"]); return; }
        $ok = $this->userModel->delete((int)$data['id']);
        echo json_encode($ok ? ["status" => "success"] : ["status" => "error", "message" => "Lỗi thực thi DB"]);
    }

    // ========================
    // LẤY BÀI CỦA USER
    // ========================
    public function getMyPosts() {
        try {
            if (!isset($_GET['user_id']) || !is_numeric($_GET['user_id'])) {
                http_response_code(422);
                echo json_encode([
                    "status" => "error",
                    "message" => "Thiếu hoặc sai user_id"
                ]);
                return;
            }

            $userId = (int)$_GET['user_id'];
            $houses = $this->houseModel->getByUser($userId);

            echo json_encode([
                "status" => "success",
                "data" => $houses ?: []
            ]);

        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode([
                "status" => "error",
                "message" => "Lỗi máy chủ: " . $e->getMessage()
            ]);
        }
    }
    
    // ========================
    // THỐNG KÊ DASHBOARD
    // ========================
    public function getStats() {
        $houseStats = $this->houseModel->getStats();
        $userStats  = $this->userModel->getStats();
        echo json_encode([
            "status" => "success",
            "data"   => [
                "total_houses"  => (int)($houseStats['total_houses']  ?? 0),
                "active_houses" => (int)($houseStats['active_houses'] ?? 0),
                "total_users"   => (int)($userStats['total_users']    ?? 0),
                "locked_users"  => (int)($userStats['locked_users']   ?? 0),
            ]
        ]);
    }
}
?>