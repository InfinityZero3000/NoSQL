db = db.getSiblingDB(process.env.DB_NAME || "hrm_mongodb");

print("Dữ liệu trước cập nhật");
printjson(db.employees.find(
  { employeeId: { $in: ["E001", "E002", "E003", "E004", "E008"] } },
  { _id: 0, employeeId: 1, phone: 1, departmentCode: 1, salary: 1, active: 1, skills: 1 }
).toArray());
printjson(db.projects.find(
  { projectId: { $in: ["P001", "P002", "P003"] } },
  { _id: 0, projectId: 1, members: 1 }
).toArray());

db.employees.updateOne({ employeeId: "E002" }, { $set: { phone: "0901999999" } });
db.employees.updateOne({ employeeId: "E001" }, { $inc: { salary: 2000000 } });
db.employees.updateOne({ employeeId: "E004" }, { $set: { departmentCode: "SALE" } });
db.employees.updateOne({ employeeId: "E008" }, { $set: { active: false } });
db.employees.updateMany({ departmentCode: "IT" }, { $mul: { salary: 1.05 } });
db.employees.updateOne({ employeeId: "E001" }, { $addToSet: { skills: "Git" } });
db.employees.updateMany({ active: true }, { $addToSet: { skills: "Git" } });
db.employees.updateOne({ employeeId: "E003" }, { $pull: { skills: "Redis" } });

db.projects.updateOne(
  { projectId: "P002" },
  { $addToSet: { members: {
    employeeId: "E005",
    role: "Technical Consultant",
    joinDate: ISODate("2026-03-15T00:00:00.000Z"),
    hoursPerWeek: 10
  } } }
);

db.projects.updateOne(
  { projectId: "P001" },
  { $set: { "members.$[member].hoursPerWeek": 25 } },
  { arrayFilters: [{ "member.employeeId": "E008" }] }
);

db.projects.updateOne(
  { projectId: "P003" },
  { $pull: { members: { employeeId: "E004" } } }
);

print("Dữ liệu sau cập nhật");
printjson(db.employees.find(
  { employeeId: { $in: ["E001", "E002", "E003", "E004", "E008"] } },
  { _id: 0, employeeId: 1, phone: 1, departmentCode: 1, salary: 1, active: 1, skills: 1 }
).toArray());
printjson(db.projects.find(
  { projectId: { $in: ["P001", "P002", "P003"] } },
  { _id: 0, projectId: 1, members: 1 }
).toArray());
