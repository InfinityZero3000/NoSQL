db = db.getSiblingDB(process.env.DB_NAME || "hrm_mongodb");

const fs = require("fs");
const path = require("path");
const dataDir = path.join(process.cwd(), "data");

for (const name of ["departments", "employees", "projects"]) {
  if (!db.getCollectionNames().includes(name)) db.createCollection(name);
}

function importJson(fileName, collectionName, key) {
  const documents = EJSON.parse(fs.readFileSync(path.join(dataDir, fileName), "utf8"));
  for (const document of documents) {
    db[collectionName].replaceOne({ [key]: document[key] }, document, { upsert: true });
  }
}

importJson("departments.json", "departments", "departmentCode");
importJson("employees.json", "employees", "employeeId");
importJson("projects.json", "projects", "projectId");

print("Số phòng ban:", db.departments.countDocuments({}));
print("Số nhân viên:", db.employees.countDocuments({}));
print("Số dự án:", db.projects.countDocuments({}));
