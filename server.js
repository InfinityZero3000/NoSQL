const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const { MongoClient } = require("mongodb");

const PORT = Number(process.env.PORT) || 3000;
const DB_NAME = process.env.DB_NAME || "hrm_mongodb";
const client = new MongoClient(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017");
const publicDir = path.join(__dirname, "public");
let database;

async function getDb() {
  if (!database) {
    await client.connect();
    database = client.db(DB_NAME);
  }
  return database;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildEmployeeFilter(params) {
  const filter = {};
  const search = params.get("search")?.trim();
  const departmentCode = params.get("departmentCode")?.trim();
  const active = params.get("active");
  const minSalary = Number(params.get("minSalary"));
  const maxSalary = Number(params.get("maxSalary"));

  if (search) {
    const regex = { $regex: escapeRegex(search), $options: "i" };
    filter.$or = [{ employeeId: regex }, { fullName: regex }, { departmentCode: regex }];
  }
  if (departmentCode) filter.departmentCode = departmentCode;
  if (active === "true" || active === "false") filter.active = active === "true";
  if (params.get("minSalary") && Number.isFinite(minSalary)) filter.salary = { $gte: minSalary };
  if (params.get("maxSalary") && Number.isFinite(maxSalary)) {
    filter.salary = { ...filter.salary, $lte: maxSalary };
  }
  return filter;
}

function requiredText(value, label) {
  const text = String(value ?? "").trim();
  if (!text) throw Object.assign(new Error(`${label} không được để trống.`), { status: 400 });
  return text;
}

function validDate(value, label) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw Object.assign(new Error(`${label} không hợp lệ.`), { status: 400 });
  }
  return date;
}

function normalizeEmployee(body, existingId) {
  const salary = Number(body.salary);
  if (!Number.isFinite(salary) || salary < 0) {
    throw Object.assign(new Error("Lương phải là số không âm."), { status: 400 });
  }

  const employeeId = requiredText(body.employeeId || existingId, "Mã nhân viên").toUpperCase();
  if (existingId && employeeId !== existingId) {
    throw Object.assign(new Error("Không được thay đổi mã nhân viên."), { status: 400 });
  }

  const email = requiredText(body.email, "Email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw Object.assign(new Error("Email không hợp lệ."), { status: 400 });
  }

  const skills = Array.isArray(body.skills)
    ? [...new Set(body.skills.map((skill) => String(skill).trim()).filter(Boolean))]
    : [];

  return {
    employeeId,
    fullName: requiredText(body.fullName, "Họ tên"),
    gender: requiredText(body.gender, "Giới tính"),
    dateOfBirth: validDate(body.dateOfBirth, "Ngày sinh"),
    email,
    phone: requiredText(body.phone, "Số điện thoại"),
    address: {
      street: requiredText(body.address?.street, "Đường"),
      district: requiredText(body.address?.district, "Quận/huyện"),
      city: requiredText(body.address?.city, "Thành phố")
    },
    departmentCode: requiredText(body.departmentCode, "Phòng ban").toUpperCase(),
    position: requiredText(body.position, "Chức vụ"),
    salary,
    hireDate: validDate(body.hireDate, "Ngày vào làm"),
    skills,
    active: body.active === undefined ? true : body.active === true
  };
}

function send(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1_000_000) {
      throw Object.assign(new Error("Dữ liệu gửi lên quá lớn."), { status: 413 });
    }
  }
  try {
    return JSON.parse(raw || "{}");
  } catch {
    throw Object.assign(new Error("JSON không hợp lệ."), { status: 400 });
  }
}

async function listEmployees(db, url) {
  const filter = buildEmployeeFilter(url.searchParams);
  const allowedSorts = new Set(["employeeId", "fullName", "departmentCode", "salary"]);
  const sortField = allowedSorts.has(url.searchParams.get("sort"))
    ? url.searchParams.get("sort")
    : "employeeId";
  const direction = url.searchParams.get("order") === "desc" ? -1 : 1;
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 100);
  const skip = Math.max(Number(url.searchParams.get("skip")) || 0, 0);
  const [items, total] = await Promise.all([
    db.collection("employees").find(filter).sort({ [sortField]: direction }).skip(skip).limit(limit).toArray(),
    db.collection("employees").countDocuments(filter)
  ]);
  return { items, total };
}

async function dashboard(db, departmentCode) {
  const employeeMatch = departmentCode ? { departmentCode } : {};
  const [departmentTotal, employeeTotals, projectTotals, inProgressBudget, departmentStats, skills, employees] =
    await Promise.all([
      db.collection("departments").countDocuments({}),
      db.collection("employees").aggregate([
        { $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ["$active", 1, 0] } },
          inactive: { $sum: { $cond: ["$active", 0, 1] } }
        } }
      ]).next(),
      db.collection("projects").aggregate([
        { $group: {
          _id: null,
          total: { $sum: 1 },
          inProgress: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } }
        } }
      ]).next(),
      db.collection("projects").aggregate([
        { $match: { status: "In Progress" } },
        { $group: { _id: null, total: { $sum: "$budget" } } }
      ]).next(),
      db.collection("employees").aggregate([
        { $match: employeeMatch },
        { $group: {
          _id: "$departmentCode",
          employeeCount: { $sum: 1 },
          averageSalary: { $avg: "$salary" },
          maxSalary: { $max: "$salary" },
          minSalary: { $min: "$salary" }
        } },
        { $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "departmentCode",
          as: "department"
        } },
        { $project: {
          _id: 0,
          departmentCode: "$_id",
          departmentName: { $first: "$department.departmentName" },
          employeeCount: 1,
          averageSalary: 1,
          maxSalary: 1,
          minSalary: 1
        } },
        { $sort: { departmentCode: 1 } }
      ]).toArray(),
      db.collection("employees").aggregate([
        { $match: employeeMatch },
        { $unwind: "$skills" },
        { $group: { _id: "$skills", employeeCount: { $sum: 1 } } },
        { $project: { _id: 0, skill: "$_id", employeeCount: 1 } },
        { $sort: { employeeCount: -1, skill: 1 } }
      ]).toArray(),
      departmentCode
        ? db.collection("employees").find(employeeMatch, {
          projection: { _id: 0, employeeId: 1, fullName: 1, position: 1, salary: 1, active: 1 }
        }).sort({ salary: -1 }).toArray()
        : []
    ]);

  return {
    overview: {
      departments: departmentTotal,
      employees: employeeTotals?.total || 0,
      activeEmployees: employeeTotals?.active || 0,
      inactiveEmployees: employeeTotals?.inactive || 0,
      projects: projectTotals?.total || 0,
      inProgressProjects: projectTotals?.inProgress || 0,
      completedProjects: projectTotals?.completed || 0,
      inProgressBudget: inProgressBudget?.total || 0
    },
    departmentStats,
    skills,
    employees
  };
}

async function listProjects(db, url) {
  const match = {};
  const search = url.searchParams.get("search")?.trim();
  const status = url.searchParams.get("status")?.trim();
  if (search) {
    const regex = { $regex: escapeRegex(search), $options: "i" };
    match.$or = [{ projectId: regex }, { projectName: regex }];
  }
  if (status) match.status = status;
  const direction = url.searchParams.get("order") === "asc" ? 1 : -1;
  return db.collection("projects").aggregate([
    { $match: match },
    { $lookup: { from: "employees", localField: "managerId", foreignField: "employeeId", as: "manager" } },
    { $addFields: {
      managerName: { $ifNull: [{ $first: "$manager.fullName" }, "Không tìm thấy"] },
      memberCount: { $size: "$members" },
      totalHoursPerWeek: { $sum: "$members.hoursPerWeek" }
    } },
    { $project: { manager: 0 } },
    { $sort: { budget: direction, projectId: 1 } }
  ]).toArray();
}

async function serveStatic(pathname, res) {
  const relative = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.resolve(publicDir, `.${relative}`);
  if (!filePath.startsWith(publicDir + path.sep)) return send(res, 403, { error: "Truy cập bị từ chối." });
  const mime = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml"
  }[path.extname(filePath)] || "application/octet-stream";
  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": mime });
    res.end(data);
  } catch {
    send(res, 404, { error: "Không tìm thấy tài nguyên." });
  }
}

async function handleApi(req, res, url) {
  const db = await getDb();
  const pathname = decodeURIComponent(url.pathname);

  if (req.method === "GET" && pathname === "/api/departments") {
    return send(res, 200, await db.collection("departments").find({}).sort({ departmentCode: 1 }).toArray());
  }
  if (req.method === "GET" && pathname === "/api/dashboard") {
    return send(res, 200, await dashboard(db, url.searchParams.get("departmentCode") || ""));
  }
  if (req.method === "GET" && pathname === "/api/employees") {
    return send(res, 200, await listEmployees(db, url));
  }
  if (req.method === "POST" && pathname === "/api/employees") {
    const employee = normalizeEmployee(await readJson(req));
    if (!await db.collection("departments").findOne({ departmentCode: employee.departmentCode })) {
      throw Object.assign(new Error("Phòng ban không tồn tại."), { status: 400 });
    }
    await db.collection("employees").insertOne(employee);
    return send(res, 201, employee);
  }
  if (req.method === "GET" && pathname === "/api/projects") {
    return send(res, 200, await listProjects(db, url));
  }

  const skillMatch = pathname.match(/^\/api\/employees\/([^/]+)\/skills$/);
  if (skillMatch && req.method === "PATCH") {
    const employeeId = skillMatch[1];
    const { skill, action } = await readJson(req);
    const skillName = requiredText(skill, "Kỹ năng");
    const update = action === "remove"
      ? { $pull: { skills: skillName } }
      : { $addToSet: { skills: skillName } };
    const result = await db.collection("employees").findOneAndUpdate(
      { employeeId }, update, { returnDocument: "after" }
    );
    if (!result) throw Object.assign(new Error("Không tìm thấy nhân viên."), { status: 404 });
    return send(res, 200, result);
  }

  const employeeMatch = pathname.match(/^\/api\/employees\/([^/]+)$/);
  if (employeeMatch) {
    const employeeId = employeeMatch[1];
    if (req.method === "GET") {
      const employee = await db.collection("employees").findOne({ employeeId });
      if (!employee) throw Object.assign(new Error("Không tìm thấy nhân viên."), { status: 404 });
      return send(res, 200, employee);
    }
    if (req.method === "PUT") {
      const employee = normalizeEmployee(await readJson(req), employeeId);
      if (!await db.collection("departments").findOne({ departmentCode: employee.departmentCode })) {
        throw Object.assign(new Error("Phòng ban không tồn tại."), { status: 400 });
      }
      const result = await db.collection("employees").findOneAndReplace(
        { employeeId }, employee, { returnDocument: "after" }
      );
      if (!result) throw Object.assign(new Error("Không tìm thấy nhân viên."), { status: 404 });
      return send(res, 200, result);
    }
    if (req.method === "DELETE") {
      const result = await db.collection("employees").deleteOne({ employeeId });
      if (!result.deletedCount) throw Object.assign(new Error("Không tìm thấy nhân viên."), { status: 404 });
      return send(res, 200, { message: "Đã xóa nhân viên." });
    }
  }

  const projectMatch = pathname.match(/^\/api\/projects\/([^/]+)$/);
  if (projectMatch && req.method === "GET") {
    const items = await db.collection("projects").aggregate([
      { $match: { projectId: projectMatch[1] } },
      { $lookup: { from: "employees", localField: "managerId", foreignField: "employeeId", as: "manager" } },
      { $lookup: { from: "employees", localField: "members.employeeId", foreignField: "employeeId", as: "memberProfiles" } },
      { $addFields: { manager: { $first: "$manager" } } }
    ]).toArray();
    if (!items[0]) throw Object.assign(new Error("Không tìm thấy dự án."), { status: 404 });
    return send(res, 200, items[0]);
  }

  send(res, 404, { error: "API không tồn tại." });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  try {
    if (url.pathname.startsWith("/api/")) await handleApi(req, res, url);
    else await serveStatic(url.pathname, res);
  } catch (error) {
    const status = error.code === 11000 ? 409 : error.status || 500;
    const message = error.code === 11000
      ? `Dữ liệu bị trùng: ${Object.keys(error.keyPattern || {}).join(", ")}.`
      : error.message || "Lỗi máy chủ.";
    send(res, status, { error: message });
  }
});

if (require.main === module) {
  server.listen(PORT, () => console.log(`HRM đang chạy tại http://localhost:${PORT}`));
}

async function close() {
  await client.close();
}

process.once("SIGINT", close);
process.once("SIGTERM", close);

module.exports = { buildEmployeeFilter, normalizeEmployee, server, close };

