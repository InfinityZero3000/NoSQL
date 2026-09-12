# HRM MongoDB Design

## Mục tiêu

Hoàn thành 10 câu trong đề bằng bộ dữ liệu MongoDB, các script truy vấn độc lập và một ứng dụng web quản lý nhân viên/dự án có dashboard tương tác.

## Kiến trúc

- `data/`: ba mảng document dùng MongoDB Extended JSON cho các trường ngày.
- `scripts/`: từng câu 1-8 có một script `mongosh`, giữ đúng tên file trong đề.
- `server.js`: HTTP server và REST API, dùng MongoDB Node Driver kết nối `hrm_mongodb`.
- `public/`: một giao diện quản trị gồm Dashboard, Nhân viên và Dự án.

Ứng dụng không hard-code số liệu. Danh sách, bộ lọc, CRUD và thống kê đều gọi API, API truy vấn trực tiếp MongoDB.

## Luồng dữ liệu

Trình duyệt gọi `/api/*`; server kiểm tra đầu vào, tạo truy vấn MongoDB và trả JSON. Dashboard dùng aggregation trên cả ba collection. Khi chọn phòng ban hoặc dự án, giao diện gọi lại API với mã tương ứng.

## Xử lý lỗi và kiểm tra

Server trả mã HTTP phù hợp cho dữ liệu không hợp lệ, không tìm thấy và unique index bị trùng. Kiểm thử tối thiểu dùng `node:test` cho chuẩn hóa dữ liệu nhân viên; cú pháp toàn bộ JavaScript được kiểm tra trước khi chạy thử với MongoDB.
