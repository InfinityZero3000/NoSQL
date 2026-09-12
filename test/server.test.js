const test = require("node:test");
const assert = require("node:assert/strict");
const { buildEmployeeFilter, normalizeEmployee } = require("../server");

test("buildEmployeeFilter tạo đúng điều kiện tìm kiếm, trạng thái và khoảng lương", () => {
  const params = new URLSearchParams({
    search: "E00",
    active: "true",
    minSalary: "15000000",
    maxSalary: "25000000"
  });
  const filter = buildEmployeeFilter(params);
  assert.equal(filter.active, true);
  assert.deepEqual(filter.salary, { $gte: 15000000, $lte: 25000000 });
  assert.equal(filter.$or.length, 3);
});

test("normalizeEmployee chuyển đúng ngày, lương và loại kỹ năng trùng", () => {
  const employee = normalizeEmployee({
    employeeId: "e011",
    fullName: "Nguyễn Văn Test",
    gender: "Nam",
    dateOfBirth: "2000-01-01",
    email: "TEST@ABC.COM",
    phone: "0901",
    address: { street: "1 Test", district: "Quận 1", city: "TP.HCM" },
    departmentCode: "it",
    position: "Tester",
    salary: "15000000",
    hireDate: "2026-01-01",
    skills: ["Git", "Git", " MongoDB "],
    active: true
  });
  assert.equal(employee.employeeId, "E011");
  assert.equal(employee.departmentCode, "IT");
  assert.equal(employee.email, "test@abc.com");
  assert.equal(employee.salary, 15000000);
  assert.deepEqual(employee.skills, ["Git", "MongoDB"]);
  assert.ok(employee.hireDate instanceof Date);
});
