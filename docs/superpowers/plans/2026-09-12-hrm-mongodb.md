# HRM MongoDB Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thành dữ liệu, truy vấn và ứng dụng web cho toàn bộ 10 câu của bài tập HRM MongoDB.

**Architecture:** MongoDB lưu ba collection; các script `mongosh` giải câu 1-8. Một Node.js HTTP server cung cấp REST API và phục vụ giao diện HTML/CSS/JS cho câu 9-10.

**Tech Stack:** MongoDB, mongosh, Node.js, MongoDB Node Driver, HTML, CSS, JavaScript.

---

## Chunk 1: Dữ liệu và truy vấn

### Task 1: Tạo dữ liệu JSON

**Files:** `data/departments.json`, `data/employees.json`, `data/projects.json`

- [ ] Nhập đủ 4 phòng ban, 10 nhân viên và 4 dự án.
- [ ] Dùng Extended JSON cho Date, Boolean/Number đúng kiểu, address và members đúng cấu trúc.
- [ ] Kiểm tra JSON có thể parse và đúng số document.

### Task 2: Viết script câu 1-8

**Files:** `scripts/01_create_database.js` đến `scripts/08_create_indexes.js`

- [ ] Tạo/import dữ liệu và kiểm tra số lượng.
- [ ] Viết đủ truy vấn cơ bản, nested/array, projection/sort.
- [ ] Viết update/delete có truy vấn kiểm tra trước và sau.
- [ ] Viết đủ aggregation và index.
- [ ] Kiểm tra cú pháp bằng `node --check`.

## Chunk 2: Ứng dụng HRM

### Task 3: Tạo API

**Files:** `package.json`, `server.js`, `test/server.test.js`

- [ ] Tạo API dashboard, departments, employees và projects.
- [ ] Hỗ trợ CRUD, tìm kiếm, lọc, sort, limit, skip, nested array.
- [ ] Kiểm tra dữ liệu đầu vào và lỗi trùng unique index.
- [ ] Chạy kiểm thử với `npm test`.

### Task 4: Tạo giao diện

**Files:** `public/index.html`, `public/styles.css`, `public/app.js`

- [ ] Tạo các tab Dashboard, Nhân viên, Dự án.
- [ ] Tạo bảng, bộ lọc, form thêm/sửa, chi tiết và xác nhận xóa.
- [ ] Tạo thống kê phòng ban/kỹ năng và tương tác chọn phòng ban/dự án.
- [ ] Kiểm tra trên desktop và mobile.

### Task 5: Hướng dẫn và xác minh

**Files:** `README.md`, `.env.example`

- [ ] Viết lệnh cài đặt, import, chạy script và chạy web.
- [ ] Import vào database thử nghiệm, chạy các script và kiểm tra API.
- [ ] Ghi rõ vị trí chụp màn hình minh chứng.
