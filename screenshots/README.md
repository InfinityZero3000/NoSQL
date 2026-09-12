# Ảnh minh chứng bài tập HRM MongoDB

Ảnh được đánh số theo thứ tự trình bày trong báo cáo: dữ liệu MongoDB, truy vấn, quản lý nhân viên, Dashboard và quản lý dự án.

## 1. Dữ liệu MongoDB

### Departments

Collection `departments` có 4 document.

![Collection departments](./01-data-departments.png)

### Employees

Collection `employees` có 10 document.

![Collection employees](./02-data-employees.png)

### Projects

Collection `projects` có 4 document và mảng `members`.

![Collection projects](./03-data-projects.png)

## 2. Aggregation và Index

Kết quả chạy `scripts/07_aggregation.js` và `scripts/08_create_indexes.js` trong `mongosh`.

![Kết quả Aggregation và Index](./04-aggregation-index-results.png)

## 3. Quản lý nhân viên

### Danh sách và bộ lọc

![Danh sách nhân viên](./05-employee-list.png)

### Form thêm hoặc sửa

![Form nhân viên](./06-employee-form.png)

### Thông báo CRUD

**Còn thiếu:** `07-crud-success.png`. Chụp ngay khi giao diện hiển thị thông báo “Đã thêm nhân viên”, “Đã cập nhật nhân viên” hoặc “Đã xóa nhân viên”.

### Chi tiết và kỹ năng

![Chi tiết nhân viên](./08-employee-detail.png)

## 4. Dashboard

### Tổng quan

![Dashboard tổng quan](./09-dashboard-overview.png)

### Lọc theo phòng ban

![Dashboard lọc phòng ban](./10-dashboard-department-filter.png)

## 5. Quản lý dự án

### Danh sách dự án

![Danh sách dự án](./11-project-list.png)

### Chi tiết dự án

![Chi tiết dự án](./12-project-detail.png)

## Kiểm tra nhanh

| STT | Tên file | Trạng thái |
|---:|---|:---:|
| 01 | `01-data-departments.png` | Có |
| 02 | `02-data-employees.png` | Có |
| 03 | `03-data-projects.png` | Có |
| 04 | `04-aggregation-index-results.png` | Có |
| 05 | `05-employee-list.png` | Có |
| 06 | `06-employee-form.png` | Có |
| 07 | `07-crud-success.png` | **Thiếu** |
| 08 | `08-employee-detail.png` | Có |
| 09 | `09-dashboard-overview.png` | Có |
| 10 | `10-dashboard-department-filter.png` | Có |
| 11 | `11-project-list.png` | Có |
| 12 | `12-project-detail.png` | Có |
