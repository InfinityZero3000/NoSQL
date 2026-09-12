db = db.getSiblingDB(process.env.DB_NAME || "hrm_mongodb");

db.employees.updateOne(
  { employeeId: "TEST01" },
  { $set: {
    fullName: "Nhân viên thử nghiệm",
    gender: "Nam",
    dateOfBirth: ISODate("2000-01-01T00:00:00.000Z"),
    email: "test01@abc.com",
    phone: "0900000000",
    address: { street: "Test", district: "Test", city: "TP.HCM" },
    departmentCode: "IT",
    position: "Tester",
    salary: 10000000,
    hireDate: ISODate("2026-01-01T00:00:00.000Z"),
    skills: ["Testing"],
    active: true
  } },
  { upsert: true }
);
print("TEST01 trước khi xóa");
printjson(db.employees.findOne({ employeeId: "TEST01" }));
printjson(db.employees.deleteOne({ employeeId: "TEST01" }));

db.projects.updateOne(
  { projectId: "TESTP01" },
  { $set: {
    projectName: "Dự án thử nghiệm",
    startDate: ISODate("2026-01-01T00:00:00.000Z"),
    endDate: ISODate("2026-02-01T00:00:00.000Z"),
    budget: 1000000,
    status: "Planning",
    managerId: "E001",
    members: []
  } },
  { upsert: true }
);
print("TESTP01 trước khi xóa");
printjson(db.projects.findOne({ projectId: "TESTP01" }));
printjson(db.projects.deleteOne({ projectId: "TESTP01" }));

print("Nhân viên active=false trước khi xóa");
printjson(db.employees.find({ active: false }, { _id: 0, employeeId: 1, fullName: 1 }).toArray());
print("Tổng số nhân viên trước khi xóa:", db.employees.countDocuments({}));
printjson(db.employees.deleteMany({ active: false }));
print("Tổng số nhân viên sau khi xóa:", db.employees.countDocuments({}));
