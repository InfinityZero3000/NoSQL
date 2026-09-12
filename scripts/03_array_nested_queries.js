db = db.getSiblingDB(process.env.DB_NAME || "hrm_mongodb");

print("1. Sống tại TP.HCM");
printjson(db.employees.find({ "address.city": "TP.HCM" }).toArray());

print("2. Sống tại Quận 1");
printjson(db.employees.find({ "address.district": "Quận 1" }).toArray());

print("3. Có kỹ năng Java");
printjson(db.employees.find({ skills: "Java" }).toArray());

print("4. Có cả Java và MongoDB");
printjson(db.employees.find({ skills: { $all: ["Java", "MongoDB"] } }).toArray());

print("5. Có Redis hoặc Docker");
printjson(db.employees.find({ skills: { $in: ["Redis", "Docker"] } }).toArray());

print("6. Phòng IT có kỹ năng Docker");
printjson(db.employees.find({ departmentCode: "IT", skills: "Docker" }).toArray());

print("7. Dự án có E001 tham gia");
printjson(db.projects.find({ "members.employeeId": "E001" }).toArray());

print("8. Dự án có thành viên làm trên 20 giờ/tuần");
printjson(db.projects.find({ "members.hoursPerWeek": { $gt: 20 } }).toArray());

print("9. Dự án có E008 làm Frontend Developer");
printjson(db.projects.find({
  members: { $elemMatch: { employeeId: "E008", role: "Frontend Developer" } }
}).toArray());
