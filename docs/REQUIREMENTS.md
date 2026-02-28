# HỆ THỐNG IOT ĐA PHƯƠNG THỨC & AI HỖ TRỢ RA QUYẾT ĐỊNH CHO MÔ HÌNH LUÂN CANH TÔM - LÚA THÍCH ỨNG BIẾN ĐỔI KHÍ HẬU TẠI ĐBSCL

**Tên viết tắt:** Mekong Sight AI

## I. TỔNG QUAN DỰ ÁN
### 1. Đặt vấn đề
Đồng bằng sông Cửu Long (ĐBSCL) đang chịu tác động nặng nề của biến đổi khí hậu, đặc biệt là tình trạng xâm nhập mặn thất thường. Mô hình Luân canh Tôm - Lúa gặp khó khăn do thiếu dữ liệu giám sát và công cụ hỗ trợ ra quyết định.

### 2. Giải pháp đề xuất
**Mekong Sight AI** tích hợp IoT và AI:
- **Giám sát thời gian thực & Cảnh báo:** Đo độ mặn, pH, nhiệt độ, mực nước.
- **Hỗ trợ ra quyết định:** Tư vấn lịch thời vụ linh hoạt, chẩn đoán bệnh qua hình ảnh.

## II. QUY TRÌNH VẬN HÀNH
### 1. Thiết lập ban đầu
- Khai báo mô hình (Tôm-Lúa / Cá-Lúa).
- Vị trí địa lý & Ngày xuống giống.

### 2. Giám sát & Cảnh báo (Real-time)
- Cập nhật 10-15 phút/lần.
- Chỉ số: Độ mặn, Nhiệt độ, pH, Mực nước.
- Cảnh báo theo ngưỡng (Xanh - Vàng - Đỏ).
  - *Ví dụ:* Độ mặn > 2‰ trong vụ Lúa -> Cảnh báo Đỏ.

### 3. Phân tích theo yêu cầu (AI)
- Nông dân chụp 4 ảnh: Màu nước, Vật nuôi, Cây lúa, Môi trường.
- AI Vision: Chẩn đoán bệnh (đốm trắng, đạo ôn), đánh giá rủi ro (tảo, oxy).
- Đề xuất giải pháp xử lý.

## III. TÍNH NĂNG CHIẾN LƯỢC: TRỢ LÝ CHUYỂN ĐỔI MÙA VỤ
- **Lịch thời vụ động** dựa trên: Thời gian + Độ mặn 3 ngày qua + Dự báo thời tiết.
- Kịch bản:
  - **Mặn đến sớm:** Khuyến nghị thu hoạch lúa sớm, chuyển sang tôm.
  - **Ngọt hóa kéo dài:** Khuyến nghị chờ thả tôm hoặc xử lý nước.

## IV. GIẢI PHÁP KỸ THUẬT
### 1. Phần cứng (IoT Node)
- **ESP32** + **LoRaWAN**.
- Năng lượng mặt trời.
- Cảm biến: EC (Độ mặn), pH, Nhiệt độ, Mực nước (Siêu âm).

### 2. Phần mềm & AI
- **AI Model:** CNN cho bệnh & màu nước.
- **Mobile App:** Flutter/React Native, hỗ trợ giọng nói.

## V. TÁC ĐỘNG
- **Môi trường:** Tối ưu nước, giảm ô nhiễm.
- **Kinh tế:** Giảm 30% thiệt hại, tăng năng suất.
- **Xã hội:** Chuyển đổi số trong canh tác.
