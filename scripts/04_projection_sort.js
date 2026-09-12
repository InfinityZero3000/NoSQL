db = db.getSiblingDB(process.env.DB_NAME || "hrm_mongodb");

print("1. Chỉ mã, họ tên và lương; ẩn _id");
printjson(db.employees.find({}, { _id: 0, employeeId: 1, fullName: 1, salary: 1 }).toArray());

print("2. Tên, phòng ban, kỹ năng của nhân viên đang làm việc");
printjson(db.employees.find(
  { active: true },
  { _id: 0, fullName: 1, departmentCode: 1, skills: 1 }
).toArray());

print("3. Lương tăng dần");
printjson(db.employees.find({}).sort({ salary: 1 }).toArray());

print("4. Lương giảm dần");
printjson(db.employees.find({}).sort({ salary: -1 }).toArray());

print("5. Ba nhân viên lương cao nhất");
printjson(db.employees.find({}).sort({ salary: -1 }).limit(3).toArray());

print("6. Bỏ ba nhân viên đầu, lấy ba nhân viên tiếp theo");
printjson(db.employees.find({}).sort({ employeeId: 1 }).skip(3).limit(3).toArray());

print("7. Theo phòng ban, sau đó lương giảm dần");
printjson(db.employees.find({}).sort({ departmentCode: 1, salary: -1 }).toArray());
