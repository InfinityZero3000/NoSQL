db = db.getSiblingDB(process.env.DB_NAME || "hrm_mongodb");

print("1. Toàn bộ nhân viên");
printjson(db.employees.find({}).toArray());

print("2. Nhân viên E005");
printjson(db.employees.findOne({ employeeId: "E005" }));

print("3. Nhân viên đang làm việc");
printjson(db.employees.find({ active: true }).toArray());

print("4. Nhân viên phòng IT");
printjson(db.employees.find({ departmentCode: "IT" }).toArray());

print("5. Lương trên 20 triệu");
printjson(db.employees.find({ salary: { $gt: 20000000 } }).toArray());

print("6. Lương từ 15 đến 25 triệu");
printjson(db.employees.find({ salary: { $gte: 15000000, $lte: 25000000 } }).toArray());

print("7. Phòng IT và đang làm việc");
printjson(db.employees.find({ departmentCode: "IT", active: true }).toArray());

print("8. Không thuộc phòng HR");
printjson(db.employees.find({ departmentCode: { $ne: "HR" } }).toArray());
