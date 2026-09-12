db = db.getSiblingDB(process.env.DB_NAME || "hrm_mongodb");

print("1. Số nhân viên theo phòng ban");
printjson(db.employees.aggregate([
  { $group: { _id: "$departmentCode", employeeCount: { $sum: 1 } } },
  { $sort: { _id: 1 } }
]).toArray());

print("2. Lương trung bình theo phòng ban");
printjson(db.employees.aggregate([
  { $group: { _id: "$departmentCode", averageSalary: { $avg: "$salary" } } },
  { $sort: { _id: 1 } }
]).toArray());

print("3. Lương cao nhất theo phòng ban");
printjson(db.employees.aggregate([
  { $group: { _id: "$departmentCode", maxSalary: { $max: "$salary" } } },
  { $sort: { _id: 1 } }
]).toArray());

print("4. Lương thấp nhất theo phòng ban");
printjson(db.employees.aggregate([
  { $group: { _id: "$departmentCode", minSalary: { $min: "$salary" } } },
  { $sort: { _id: 1 } }
]).toArray());

print("5. Phòng ban có ít nhất hai nhân viên");
printjson(db.employees.aggregate([
  { $group: { _id: "$departmentCode", employeeCount: { $sum: 1 } } },
  { $match: { employeeCount: { $gte: 2 } } },
  { $sort: { employeeCount: -1 } }
]).toArray());

print("6. Số dự án theo trạng thái");
printjson(db.projects.aggregate([
  { $group: { _id: "$status", projectCount: { $sum: 1 } } },
  { $sort: { _id: 1 } }
]).toArray());

print("7. Tổng ngân sách dự án đang thực hiện");
printjson(db.projects.aggregate([
  { $match: { status: "In Progress" } },
  { $group: { _id: null, totalBudget: { $sum: "$budget" } } },
  { $project: { _id: 0, totalBudget: 1 } }
]).toArray());

print("8. Số nhân viên theo từng kỹ năng");
printjson(db.employees.aggregate([
  { $unwind: "$skills" },
  { $group: { _id: "$skills", employeeCount: { $sum: 1 } } },
  { $sort: { employeeCount: -1, _id: 1 } }
]).toArray());

print("9. Số thành viên từng dự án");
printjson(db.projects.aggregate([
  { $unwind: "$members" },
  { $group: {
    _id: { projectId: "$projectId", projectName: "$projectName" },
    memberCount: { $sum: 1 }
  } },
  { $project: {
    _id: 0,
    projectId: "$_id.projectId",
    projectName: "$_id.projectName",
    memberCount: 1
  } },
  { $sort: { projectId: 1 } }
]).toArray());
