# Bài tập tổng hợp MongoDB - HRM

Bài làm hoàn chỉnh gồm dữ liệu và truy vấn cho Câu 1-8, ứng dụng quản lý nhân viên cho Câu 9, Dashboard nhân sự và dự án cho Câu 10.

## Công nghệ sử dụng

- Ngôn ngữ: JavaScript, HTML, CSS.
- Backend: Node.js HTTP server và MongoDB Node Driver.
- Database: MongoDB, database `hrm_mongodb`.
- Frontend: HTML/CSS/JavaScript thuần, responsive cho desktop và điện thoại.
- AI hỗ trợ: OpenAI Codex hỗ trợ phân tích đề, tạo mã nguồn và kiểm thử.

Ứng dụng chỉ dùng một package là `mongodb`; không dùng framework frontend nên dễ cài đặt và trình bày.

## Cấu trúc thư mục

```text
BT_Tổng hợp/
├── README.md
├── package.json
├── server.js
├── data/
│   ├── departments.json
│   ├── employees.json
│   └── projects.json
├── scripts/
│   ├── 01_create_database.js
│   ├── 02_basic_queries.js
│   ├── 03_array_nested_queries.js
│   ├── 04_projection_sort.js
│   ├── 05_update_data.js
│   ├── 06_delete_data.js
│   ├── 07_aggregation.js
│   └── 08_create_indexes.js
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── test/server.test.js
└── screenshots/
```

## Cài đặt và chạy

Yêu cầu máy đã cài Node.js, MongoDB Community Server và `mongosh`.

```bash
cd "BT_Tổng hợp "
npm install
npm run seed
mongosh --quiet scripts/08_create_indexes.js
npm start
```

Mở `http://localhost:3000` để sử dụng ứng dụng.

Nếu MongoDB dùng địa chỉ khác, đặt biến môi trường trước khi chạy:

```bash
MONGODB_URI="mongodb://127.0.0.1:27017" DB_NAME="hrm_mongodb" PORT=3000 npm start
```

## Câu 1 - Tạo và nhập dữ liệu

Ba file trong `data/` đều chứa một mảng document. Ngày dùng MongoDB Extended JSON dạng `{ "$date": "..." }`; `salary`, `budget`, `hoursPerWeek` là Number và `active` là Boolean.

Lệnh `npm run seed` tạo database/collection, đọc ba file JSON và upsert theo mã. Có thể import bằng `mongoimport` như sau:

```bash
mongoimport --db hrm_mongodb --collection departments --file data/departments.json --jsonArray
mongoimport --db hrm_mongodb --collection employees --file data/employees.json --jsonArray
mongoimport --db hrm_mongodb --collection projects --file data/projects.json --jsonArray
```

Kiểm tra số document:

```javascript
db.departments.countDocuments({}) // 4
db.employees.countDocuments({})   // 10
db.projects.countDocuments({})    // 4
```

## Câu 2-4 - Truy vấn

Chạy từng file:

```bash
mongosh --quiet scripts/02_basic_queries.js
mongosh --quiet scripts/03_array_nested_queries.js
mongosh --quiet scripts/04_projection_sort.js
```

Các toán tử chính:

- `$gt`, `$gte`, `$lte`, `$ne`: lớn hơn, lớn hơn hoặc bằng, nhỏ hơn hoặc bằng, khác.
- `$in`: mảng có ít nhất một giá trị trong danh sách; `$all`: mảng có đủ mọi giá trị.
- `$elemMatch`: nhiều điều kiện phải đúng trên cùng một phần tử trong mảng document.
- Projection `{ _id: 0, employeeId: 1 }`: ẩn `_id`, chỉ hiện trường được đánh dấu `1`.
- `sort({ salary: -1 })`: giảm dần; `1` là tăng dần. `skip()` bỏ qua và `limit()` giới hạn kết quả.

## Câu 5-6 - Cập nhật và xóa

```bash
mongosh --quiet scripts/05_update_data.js
mongosh --quiet scripts/06_delete_data.js
```

Hai script đều in dữ liệu kiểm tra trước và sau thao tác. Câu 5 dùng `$set`, `$inc`, `$mul`, `$addToSet`, `$pull` và toán tử vị trí có `arrayFilters`. Câu 6 chỉ xóa document đúng điều kiện, không xóa collection.

Lưu ý: Câu 5 tăng lương và Câu 6 xóa nhân viên nên trước khi chạy lại, dùng `npm run seed` để phục hồi dữ liệu gốc.

## Câu 7-8 - Aggregation và index

```bash
mongosh --quiet scripts/07_aggregation.js
mongosh --quiet scripts/08_create_indexes.js
```

Câu 7 có đủ `$match`, `$group`, `$project`, `$sort`, `$unwind`, `$sum`, `$avg`, `$max`, `$min`. Câu 8 kiểm tra giá trị trùng trước khi tạo unique index và in toàn bộ index của `employees`.

## Câu 9 - Quản lý nhân viên

Trang Nhân viên lấy dữ liệu trực tiếp từ collection `employees` và có:

- Tìm theo `employeeId`, `fullName`, `departmentCode`.
- Lọc trạng thái, phòng ban, khoảng lương.
- Sắp xếp tăng/giảm và phân trang bằng `sort`, `skip`, `limit`.
- Thêm, sửa, xóa và xem chi tiết nhân viên.
- Hiển thị address lồng nhau; thêm/xóa phần tử trong mảng skills.
- Thông báo thành công hoặc lỗi, kiểm tra email, lương, ngày và phòng ban.

## Câu 10 - Dashboard HRM

Trang Tổng quan và Dự án dùng cả ba collection, toàn bộ số liệu được tính từ MongoDB:

- Tám chỉ số tổng quan theo yêu cầu.
- Thống kê số nhân viên và lương theo phòng ban bằng Aggregation.
- Thống kê kỹ năng bằng `$unwind` và `$group`.
- Chọn phòng ban để cập nhật thống kê và danh sách nhân viên.
- Tìm kiếm/lọc/sắp xếp dự án; tính số thành viên và tổng giờ mỗi tuần.
- Xem dự án theo luồng thông tin, người quản lý, thành viên, vai trò và số giờ.

## Kiểm thử

```bash
npm test
node --check server.js
node --check public/app.js
```

Danh sách ảnh cần chụp cho báo cáo nằm tại `screenshots/README.md`.
