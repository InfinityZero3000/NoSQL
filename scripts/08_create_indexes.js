db = db.getSiblingDB(process.env.DB_NAME || "hrm_mongodb");

function duplicateValues(collection, field) {
  return collection.aggregate([
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $match: { _id: { $ne: null }, count: { $gt: 1 } } }
  ]).toArray();
}

function createUniqueIndex(collection, field) {
  const duplicates = duplicateValues(collection, field);
  print(`Dữ liệu trùng của ${field}:`);
  printjson(duplicates);
  if (duplicates.length === 0) {
    print("Đã tạo index:", collection.createIndex({ [field]: 1 }, { unique: true }));
  } else {
    print(`Không tạo index vì ${field} đang bị trùng.`);
  }
}

createUniqueIndex(db.departments, "departmentCode");
createUniqueIndex(db.employees, "employeeId");
createUniqueIndex(db.employees, "email");
createUniqueIndex(db.projects, "projectId");

print("Compound index departmentCode + salary:");
print(db.employees.createIndex({ departmentCode: 1, salary: -1 }));

print("Danh sách index của employees:");
printjson(db.employees.getIndexes());
