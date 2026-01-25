// 1. Dữ liệu giả lập (Database simulation)
const roomsData = [
    {
        id: 1,
        title: "Chung cư Mini Full đồ Cầu Giấy",
        price: 4500000,
        area: 30,
        address: "Ngõ 165 Cầu Giấy, Hà Nội",
        image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        isVerified: true, // Tin đã xác thực
        type: "Chung cư mini"
    },
    {
        id: 2,
        title: "Phòng trọ giá rẻ cho sinh viên",
        price: 2500000,
        area: 20,
        address: "Nguyễn Trãi, Thanh Xuân, Hà Nội",
        image: "https://images.unsplash.com/photo-1596293933390-5e26b7721590?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        isVerified: false,
        type: "Phòng trọ"
    },
    {
        id: 3,
        title: "Studio cao cấp, ban công thoáng",
        price: 6000000,
        area: 45,
        address: "Tây Hồ, Hà Nội",
        image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        isVerified: true,
        type: "Căn hộ dịch vụ"
    },
    {
        id: 4,
        title: "Chung cư mini gần ĐH Bách Khoa",
        price: 3800000,
        area: 25,
        address: "Lê Thanh Nghị, Hai Bà Trưng",
        image: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        isVerified: true,
        type: "Chung cư mini"
    },
    {
        id: 5,
        title: "Phòng khép kín, giờ giấc tự do",
        price: 3200000,
        area: 22,
        address: "Đống Đa, Hà Nội",
        image: "https://images.unsplash.com/photo-1630699144867-37acec97df5a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        isVerified: false,
        type: "Phòng trọ"
    }
];

// 2. Hàm hiển thị danh sách phòng
function renderRooms(data) {
    const grid = document.getElementById('roomGrid');
    grid.innerHTML = ""; // Xóa nội dung cũ

    if (data.length === 0) {
        grid.innerHTML = "<p>Không tìm thấy phòng phù hợp.</p>";
        return;
    }

    data.forEach(room => {
        // Định dạng giá tiền
        const formattedPrice = room.price.toLocaleString('vi-VN');
        
        // Kiểm tra huy hiệu xác thực
        const verifiedBadge = room.isVerified 
            ? `<div class="verified-badge"><i class="fas fa-check-circle"></i> Đã xác thực</div>` 
            : '';

        const cardHTML = `
            <div class="card">
                ${verifiedBadge}
                <img src="${room.image}" alt="${room.title}" class="card-img">
                <div class="card-body">
                    <div class="card-price">${formattedPrice} đ/tháng</div>
                    <h3 class="card-title">${room.title}</h3>
                    <div class="card-address"><i class="fas fa-map-marker-alt"></i> ${room.address}</div>
                    <div class="card-meta">
                        <span><i class="fas fa-ruler-combined"></i> ${room.area}m²</span>
                        <span>${room.type}</span>
                    </div>
                    <button class="btn-book" onclick="bookRoom('${room.title}')">
                        <i class="far fa-calendar-check"></i> Đặt lịch xem
                    </button>
                </div>
            </div>
        `;
        grid.innerHTML += cardHTML;
    });
}

// 3. Hàm Lọc dữ liệu (Core Function)
function filterRooms() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const priceRange = document.getElementById('priceFilter').value;

    const filtered = roomsData.filter(room => {
        // Lọc theo tên hoặc địa chỉ
        const matchText = room.title.toLowerCase().includes(searchText) || 
                          room.address.toLowerCase().includes(searchText);

        // Lọc theo giá
        let matchPrice = true;
        if (priceRange === "low") matchPrice = room.price < 3000000;
        if (priceRange === "mid") matchPrice = room.price >= 3000000 && room.price <= 5000000;
        if (priceRange === "high") matchPrice = room.price > 5000000;

        return matchText && matchPrice;
    });

    renderRooms(filtered);
}

// 4. Sự kiện Đặt phòng (Simulation)
function bookRoom(roomName) {
    // Trong thực tế, đây sẽ mở ra Modal điền thông tin
    const confirmAction = confirm(`Bạn muốn đặt lịch xem phòng: "${roomName}"?\nChúng tôi sẽ gửi thông báo đến chủ nhà.`);
    if (confirmAction) {
        alert("Yêu cầu thành công! Chủ nhà sẽ liên hệ lại với bạn trong vòng 30 phút.");
    }
}

// Chạy lần đầu khi load trang
document.addEventListener('DOMContentLoaded', () => {
    renderRooms(roomsData);
});