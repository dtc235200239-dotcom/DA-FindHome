<?php
require_once "../app/models/Database.php";

class House {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    // ========================
    // TẠO NHÀ MỚI
    // ========================
    public function create($data) {
        // 1. Câu lệnh SQL đã thêm user_id và đủ 13 dấu ?
        $sql = "
            INSERT INTO houses
            (user_id, name, type, area, address, district, price, area_m2, rating, description, verified, phone, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ";

        $stmt = $this->db->prepare($sql);

        // 2. Xử lý các trường dữ liệu
        $verified = !empty($data['verified']) ? 1 : 0;
        $status   = $data['status'] ?? 'active';
        $rating   = !empty($data['rating']) ? (float)$data['rating'] : null;
        $desc     = $data['description'] ?? ''; // Đổi thành 'description' cho khớp với JS gửi lên

        // 3. Thực thi câu lệnh (Đủ 13 tham số)
        $ok = $stmt->execute([
            $data['user_id'], // Bắt buộc phải có
            $data['name'],
            $data['type'],
            $data['area'],
            $data['address'],
            $data['district'],
            $data['price'],
            $data['areaM2'],
            $rating,
            $desc,
            $verified,
            $data['phone'] ?? '',
            $status
        ]);

        if (!$ok) return false;

        $houseId = $this->db->lastInsertId();

        // 4. Lưu tags nếu có
        if (!empty($data['tags']) && is_array($data['tags'])) {
            $this->saveTags($houseId, $data['tags']);
        }

        return $houseId;
    }

    // ========================
    // LƯU TAGS
    // ========================
    private function saveTags($houseId, $tags) {
        $stmt = $this->db->prepare(
            "INSERT INTO house_tags (house_id, tag) VALUES (?, ?)"
        );
        foreach ($tags as $tag) {
            $tag = trim($tag);
            if ($tag) $stmt->execute([$houseId, $tag]);
        }
    }

    // ========================
    // THÊM ẢNH
    // ========================
    public function addImage($houseId, $url, $isPrimary = 0) {
        if ($isPrimary) {
            $this->db->prepare(
                "UPDATE house_images SET is_primary = 0 WHERE house_id = ?"
            )->execute([$houseId]);
        }

        $stmt = $this->db->prepare(
            "INSERT INTO house_images (house_id, url, is_primary) VALUES (?, ?, ?)"
        );

        return $stmt->execute([$houseId, $url, $isPrimary]);
    }

    // ========================
    // LẤY DANH SÁCH NHÀ (USER — chỉ active)
    // ========================
    public function getAll($area = null, $search = null) {
        $where  = ["h.status = 'active'"];
        $params = [];

        if ($area && $area !== 'all') {
            $where[]  = "h.area = ?";
            $params[] = $area;
        }

        if ($search) {
            $where[]  = "(h.name LIKE ? OR h.address LIKE ?)";
            $searchTerm = "%{$search}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $whereSQL = "WHERE " . implode(" AND ", $where);

        return $this->fetchHouses($whereSQL, $params);
    }

    // ========================
    // LẤY TẤT CẢ NHÀ (ADMIN — mọi status)
    // ========================
    public function getAllAdmin($search = null, $status = null, $area = null) {
        $where  = [];
        $params = [];

        if ($status) {
            $where[]  = "h.status = ?";
            $params[] = $status;
        }

        if ($area) {
            $where[]  = "h.area = ?";
            $params[] = $area;
        }

        if ($search) {
            $where[]  = "(h.name LIKE ? OR h.address LIKE ?)";
            $searchTerm = "%{$search}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $whereSQL = count($where) ? "WHERE " . implode(" AND ", $where) : "";

        return $this->fetchHouses($whereSQL, $params);
    }

    // ========================
    // HELPER: QUERY CHUNG
    // ========================
    private function fetchHouses($whereSQL, $params) {
        $sql = "
            SELECT
                h.*,
                (
                    SELECT url FROM house_images
                    WHERE house_id = h.id AND is_primary = 1
                    LIMIT 1
                ) AS primary_img,
                GROUP_CONCAT(ht.tag ORDER BY ht.id SEPARATOR ',') AS tags
            FROM houses h
            LEFT JOIN house_tags ht ON ht.house_id = h.id
            $whereSQL
            GROUP BY h.id
            ORDER BY h.created_at DESC
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $houses = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($houses as &$house) {
            $house['tags'] = $house['tags'] ? explode(',', $house['tags']) : [];
        }

        return $houses;
    }

    // ========================
    // CẬP NHẬT NHÀ
    // ========================
    public function update($data) {
        $sql = "
            UPDATE houses SET
                name        = ?,
                type        = ?,
                area        = ?,
                address     = ?,
                district    = ?,
                price       = ?,
                area_m2     = ?,
                status      = ?,
                description = ?,
                verified    = ?,
                phone       = ?
            WHERE id = ?
        ";

        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            $data['name'],
            $data['type'],
            $data['area'],
            $data['address'],
            $data['district'],
            $data['price'],
            $data['areaM2'],
            $data['status'],
            $data['desc'] ?? '',
            $data['verified'] ?? 0,
            $data['phone'] ?? '',
            $data['id']
        ]);
    }

    // ========================
    // XÓA NHÀ
    // ========================
    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM houses WHERE id = ?");
        return $stmt->execute([$id]);
    }

    // ========================
    // THỐNG KÊ
    // ========================
    public function getStats() {
        $row = $this->db->query("
            SELECT
                COUNT(*) AS total_houses,
                SUM(status = 'active') AS active_houses
            FROM houses
        ")->fetch(PDO::FETCH_ASSOC);

        return $row;
    }

    // ========================
    // LẤY NHÀ THEO USER
    // ========================
    public function getByUser($userId) {
        $sql = "
            SELECT h.*,
                (SELECT url FROM house_images WHERE house_id = h.id AND is_primary = 1 LIMIT 1) AS primary_img,
                GROUP_CONCAT(ht.tag ORDER BY ht.id SEPARATOR ',') AS tags
            FROM houses h
            LEFT JOIN house_tags ht ON ht.house_id = h.id
            WHERE h.user_id = ?
            GROUP BY h.id
            ORDER BY h.created_at DESC
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$userId]);
        $houses = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($houses as &$h) {
            $h['tags'] = $h['tags'] ? explode(',', $h['tags']) : [];
        }

        return $houses;
    }
    public function getAllHousesPaged($area = null, $search = null, $page = 1, $perPage = 12) {
    $where  = ["h.status = 'active'"];
    $params = [];

    if ($area && $area !== 'all') {
        $where[]  = "h.area = ?";
        $params[] = $area;
    }

    if ($search) {
        $where[]  = "(h.name LIKE ? OR h.address LIKE ?)";
        $params[] = "%{$search}%";
        $params[] = "%{$search}%";
    }

    $whereSQL = "WHERE " . implode(" AND ", $where);

    // Đếm tổng
    $countStmt = $this->db->prepare("SELECT COUNT(DISTINCT h.id) FROM houses h $whereSQL");
    $countStmt->execute($params);
    $total      = $countStmt->fetchColumn();
    $totalPages = (int)ceil($total / $perPage);

    // Lấy data có ảnh + tags
    $offset   = ($page - 1) * $perPage;
    $params[] = (int)$perPage;
    $params[] = (int)$offset;

    $sql = "
        SELECT h.*,
            (SELECT url FROM house_images
             WHERE house_id = h.id AND is_primary = 1
             LIMIT 1) AS primary_img,
            GROUP_CONCAT(ht.tag ORDER BY ht.id SEPARATOR ',') AS tags
        FROM houses h
        LEFT JOIN house_tags ht ON ht.house_id = h.id
        $whereSQL
        GROUP BY h.id
        ORDER BY h.created_at DESC
        LIMIT ? OFFSET ?
    ";

    $stmt = $this->db->prepare($sql);
    $stmt->execute($params);
    $houses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($houses as &$h) {
        $h['tags'] = $h['tags'] ? explode(',', $h['tags']) : [];
    }

    return [
        'houses'       => $houses,
        'total_pages'  => $totalPages,
        'current_page' => (int)$page,
        'total'        => (int)$total,
    ];
}
}
?>