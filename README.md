Mekong Sight AI

Hệ thống phần mềm IoT và AI hỗ trợ quản lý mô hình luân canh Tôm – Lúa

Giới thiệu

Mekong Sight AI là hệ thống phần mềm được xây dựng nhằm hỗ trợ quản lý và giám sát mô hình luân canh Tôm – Lúa dựa trên dữ liệu môi trường. Hệ thống áp dụng kiến trúc IoT kết hợp với các kỹ thuật phân tích dữ liệu và trí tuệ nhân tạo để phục vụ quá trình theo dõi, đánh giá và hỗ trợ ra quyết định trong sản xuất nông nghiệp.

Dự án tập trung vào thiết kế và phát triển phần mềm, sử dụng dữ liệu mô phỏng nhằm phục vụ mục đích học tập, nghiên cứu khoa học và đồ án sinh viên.

Mục tiêu dự án

Thiết kế kiến trúc hệ thống IoT và AI cho nông nghiệp thông minh

Xây dựng Backend quản lý và xử lý dữ liệu môi trường

Phát triển ứng dụng Web và Mobile phục vụ giám sát

Mô phỏng dữ liệu cảm biến để kiểm thử hệ thống

Đề xuất cơ chế hỗ trợ ra quyết định cho mô hình luân canh Tôm – Lúa

Kiến trúc hệ thống

Hệ thống được thiết kế theo mô hình nhiều tầng:

Nguồn dữ liệu (Cảm biến / Dữ liệu mô phỏng)
                    ↓
              Truyền dữ liệu
                    ↓
            Xử lý Backend
                    ↓
              Phân tích AI
                    ↓
           Ứng dụng Web / Mobile

Mô tả kiến trúc

Nguồn dữ liệu: dữ liệu môi trường thu từ cảm biến hoặc được sinh giả lập

Truyền dữ liệu: dữ liệu được gửi về hệ thống thông qua API

Xử lý Backend: xử lý nghiệp vụ, kiểm tra và lưu trữ dữ liệu

Phân tích AI: áp dụng luật hoặc mô hình học máy để phân tích xu hướng và đưa ra khuyến nghị

Tầng ứng dụng: giao diện người dùng phục vụ giám sát và hỗ trợ quyết định

Công nghệ sử dụng
Backend

Node.js / Java / Go

RESTful API

Xác thực JWT

PostgreSQL / MySQL

Ứng dụng Web

ReactJS

Tailwind CSS

Thư viện trực quan hóa dữ liệu

Ứng dụng Mobile

Flutter hoặc React Native

Phân tích dữ liệu và AI

Python

Luật suy diễn (rule-based)

Mô hình học máy (mức thử nghiệm)

Cấu trúc thư mục dự án
mekong-sight-ai/
│
├── backend/
│   ├── controllers/
│   ├── services/
│   ├── models/
│   └── routes/
│
├── ai-engine/
│   ├── data/
│   ├── models/
│   └── analysis/
│
├── web-app/
│   ├── src/
│   └── components/
│
├── mobile-app/
│   ├── lib/
│   └── screens/
│
├── docs/
│   └── architecture.md
│
└── README.md

Dữ liệu sử dụng

Hệ thống sử dụng dữ liệu môi trường mô phỏng, bao gồm:

Độ mặn

Độ pH

Nhiệt độ nước

Mực nước

Thời gian và vị trí đo

Dữ liệu được xây dựng nhằm phản ánh các điều kiện môi trường đặc trưng tại khu vực Đồng bằng sông Cửu Long.

Chức năng chính
Backend

Quản lý người dùng và phân quyền

Quản lý trạm đo và dữ liệu môi trường

Lưu trữ và cung cấp dữ liệu qua API

Ứng dụng Web

Dashboard giám sát môi trường

Biểu đồ và thống kê theo thời gian

Quản lý trạm đo

Ứng dụng Mobile

Theo dõi dữ liệu môi trường từ xa

Xem lịch sử dữ liệu

Nhận khuyến nghị hỗ trợ ra quyết định (mô phỏng)

Hướng dẫn khởi chạy (Development)

Clone repository:

git clone https://github.com/your-username/mekong-sight-ai.git
cd mekong-sight-ai


Khởi chạy Backend:

cd backend
npm install
npm run dev


Khởi chạy Web App:

cd web-app
npm install
npm start

Phạm vi ứng dụng

Đồ án học phần

Nghiên cứu khoa học sinh viên

Mô hình hóa hệ thống IoT và AI trong nông nghiệp

Nền tảng cho phát triển hệ thống thực tế

Hướng phát triển

Tích hợp cảm biến IoT thực tế

Nâng cấp mô hình dự báo xâm nhập mặn

Tích hợp bản đồ và GIS

Triển khai thử nghiệm thực địa
