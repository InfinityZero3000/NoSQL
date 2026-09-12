const state = { departments: [], employeeSkip: 0, employeeTotal: 0, employeePageSize: 6 };

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const money = (value) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value || 0);
const shortDate = (value) => value ? new Intl.DateTimeFormat("vi-VN").format(new Date(value)) : "-";
const h = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Không thể xử lý yêu cầu.");
  return data;
}

let toastTimer;
function toast(message, isError = false) {
  const element = $("#toast");
  clearTimeout(toastTimer);
  element.textContent = message;
  element.className = `toast show${isError ? " error" : ""}`;
  toastTimer = setTimeout(() => { element.className = "toast"; }, 2800);
}

async function safely(action) {
  try { await action(); } catch (error) { toast(error.message, true); }
}

function employeeStatus(active) {
  return `<span class="status${active ? "" : " inactive"}">${active ? "Đang làm việc" : "Đã nghỉ việc"}</span>`;
}

function projectStatus(status) {
  const className = status === "Completed" ? " inactive" : status === "Planning" ? " planning" : "";
  return `<span class="status${className}">${h(status)}</span>`;
}

async function loadDepartments() {
  state.departments = await api("/api/departments");
  const options = state.departments.map((department) =>
    `<option value="${h(department.departmentCode)}">${h(department.departmentCode)} - ${h(department.departmentName)}</option>`
  ).join("");
  [$("#dashboard-department"), $("#employee-filters [name=departmentCode]")].forEach((select) => {
    const value = select.value;
    select.innerHTML = `<option value="">Tất cả${select.id ? " phòng ban" : ""}</option>${options}`;
    select.value = value;
  });
  $("#employee-form [name=departmentCode]").innerHTML = options;
}

function renderMetrics(overview) {
  const metrics = [
    ["Phòng ban", overview.departments],
    ["Tổng nhân viên", overview.employees],
    ["Đang làm việc", overview.activeEmployees],
    ["Đã nghỉ việc", overview.inactiveEmployees],
    ["Tổng dự án", overview.projects],
    ["Đang thực hiện", overview.inProgressProjects],
    ["Đã hoàn thành", overview.completedProjects],
    ["Ngân sách đang chạy", money(overview.inProgressBudget)]
  ];
  $("#metrics").innerHTML = metrics.map(([label, value]) =>
    `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`
  ).join("");
}

async function loadDashboard() {
  const departmentCode = $("#dashboard-department").value;
  const data = await api(`/api/dashboard${departmentCode ? `?departmentCode=${encodeURIComponent(departmentCode)}` : ""}`);
  renderMetrics(data.overview);
  $("#department-stats").innerHTML = data.departmentStats.length ? data.departmentStats.map((item) => `
    <tr>
      <td><strong>${h(item.departmentCode)}</strong><span class="employee-email">${h(item.departmentName)}</span></td>
      <td>${item.employeeCount}</td><td>${money(item.averageSalary)}</td><td>${money(item.maxSalary)}</td><td>${money(item.minSalary)}</td>
    </tr>`).join("") : `<tr><td colspan="5" class="empty">Chưa có dữ liệu.</td></tr>`;

  const maxSkill = Math.max(...data.skills.map((item) => item.employeeCount), 1);
  $("#skill-stats").innerHTML = data.skills.length ? data.skills.map((item) => `
    <div class="skill-row"><span>${h(item.skill)}</span><span class="skill-bar"><i style="width:${item.employeeCount / maxSkill * 100}%"></i></span><strong>${item.employeeCount}</strong></div>
  `).join("") : `<p class="empty">Chưa có dữ liệu kỹ năng.</p>`;

  const panel = $("#department-employees-panel");
  panel.classList.toggle("hidden", !departmentCode);
  if (departmentCode) {
    $("#selected-department-label").textContent = departmentCode;
    $("#department-employees").innerHTML = data.employees.length ? data.employees.map((employee) => `
      <tr><td><strong>${h(employee.employeeId)}</strong></td><td>${h(employee.fullName)}</td><td>${h(employee.position)}</td><td>${money(employee.salary)}</td><td>${employeeStatus(employee.active)}</td></tr>
    `).join("") : `<tr><td colspan="5" class="empty">Phòng ban chưa có nhân viên.</td></tr>`;
  }
}

function employeeQuery() {
  const params = new URLSearchParams(new FormData($("#employee-filters")));
  for (const [key, value] of [...params]) if (!value) params.delete(key);
  params.set("skip", state.employeeSkip);
  params.set("limit", state.employeePageSize);
  return params;
}

async function loadEmployees() {
  const data = await api(`/api/employees?${employeeQuery()}`);
  state.employeeTotal = data.total;
  $("#employee-count").textContent = `${data.total} nhân viên phù hợp`;
  $("#employee-rows").innerHTML = data.items.length ? data.items.map((employee) => `
    <tr>
      <td><strong>${h(employee.employeeId)}</strong></td>
      <td><span class="employee-name">${h(employee.fullName)}</span><span class="employee-email">${h(employee.email)}</span></td>
      <td>${h(employee.departmentCode)}</td><td>${h(employee.position)}</td><td>${money(employee.salary)}</td><td>${employeeStatus(employee.active)}</td>
      <td class="actions"><div class="row-actions">
        <button class="button small secondary" data-action="detail" data-id="${h(employee.employeeId)}">Chi tiết</button>
        <button class="button small secondary" data-action="edit" data-id="${h(employee.employeeId)}">Sửa</button>
        <button class="button small danger" data-action="delete" data-id="${h(employee.employeeId)}">Xóa</button>
      </div></td>
    </tr>`).join("") : `<tr><td colspan="7" class="empty">Không tìm thấy nhân viên phù hợp.</td></tr>`;

  const page = Math.floor(state.employeeSkip / state.employeePageSize) + 1;
  const pageTotal = Math.max(Math.ceil(data.total / state.employeePageSize), 1);
  $("#page-info").textContent = `Trang ${page}/${pageTotal}`;
  $("#previous-page").disabled = state.employeeSkip === 0;
  $("#next-page").disabled = state.employeeSkip + state.employeePageSize >= data.total;
}

function setFormValue(name, value) {
  const input = $("#employee-form").elements.namedItem(name);
  if (input.type === "checkbox") input.checked = Boolean(value);
  else input.value = value ?? "";
}

async function openEmployeeForm(employeeId = "") {
  const form = $("#employee-form");
  form.reset();
  form.dataset.employeeId = employeeId;
  $("#employee-form-title").textContent = employeeId ? "Cập nhật nhân viên" : "Thêm nhân viên";
  form.elements.employeeId.readOnly = Boolean(employeeId);
  if (employeeId) {
    const employee = await api(`/api/employees/${encodeURIComponent(employeeId)}`);
    for (const field of ["employeeId", "fullName", "gender", "email", "phone", "departmentCode", "position", "salary", "active"]) {
      setFormValue(field, employee[field]);
    }
    setFormValue("dateOfBirth", employee.dateOfBirth?.slice(0, 10));
    setFormValue("hireDate", employee.hireDate?.slice(0, 10));
    setFormValue("street", employee.address?.street);
    setFormValue("district", employee.address?.district);
    setFormValue("city", employee.address?.city);
    setFormValue("skills", employee.skills?.join(", "));
  }
  $("#employee-dialog").showModal();
}

function employeePayload() {
  const form = $("#employee-form");
  const values = Object.fromEntries(new FormData(form));
  return {
    employeeId: values.employeeId,
    fullName: values.fullName,
    gender: values.gender,
    dateOfBirth: values.dateOfBirth,
    email: values.email,
    phone: values.phone,
    address: { street: values.street, district: values.district, city: values.city },
    departmentCode: values.departmentCode,
    position: values.position,
    salary: Number(values.salary),
    hireDate: values.hireDate,
    skills: values.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
    active: form.elements.active.checked
  };
}

async function saveEmployee(event) {
  event.preventDefault();
  const employeeId = event.currentTarget.dataset.employeeId;
  await api(employeeId ? `/api/employees/${encodeURIComponent(employeeId)}` : "/api/employees", {
    method: employeeId ? "PUT" : "POST",
    body: JSON.stringify(employeePayload())
  });
  $("#employee-dialog").close();
  state.employeeSkip = 0;
  await Promise.all([loadEmployees(), loadDashboard()]);
  toast(employeeId ? "Đã cập nhật nhân viên." : "Đã thêm nhân viên.");
}

async function showEmployeeDetail(employeeId) {
  const employee = await api(`/api/employees/${encodeURIComponent(employeeId)}`);
  $("#detail-dialog").dataset.employeeId = employeeId;
  $("#detail-title").textContent = `${employee.employeeId} · ${employee.fullName}`;
  $("#employee-detail").innerHTML = `
    <div class="detail-grid">
      <div class="detail-field"><span>Phòng ban</span><strong>${h(employee.departmentCode)}</strong></div>
      <div class="detail-field"><span>Chức vụ</span><strong>${h(employee.position)}</strong></div>
      <div class="detail-field"><span>Email</span><strong>${h(employee.email)}</strong></div>
      <div class="detail-field"><span>Điện thoại</span><strong>${h(employee.phone)}</strong></div>
      <div class="detail-field"><span>Ngày sinh</span><strong>${shortDate(employee.dateOfBirth)}</strong></div>
      <div class="detail-field"><span>Ngày vào làm</span><strong>${shortDate(employee.hireDate)}</strong></div>
      <div class="detail-field"><span>Lương</span><strong>${money(employee.salary)}</strong></div>
      <div class="detail-field"><span>Trạng thái</span><strong>${employee.active ? "Đang làm việc" : "Đã nghỉ việc"}</strong></div>
      <div class="detail-field" style="grid-column:1/-1"><span>Địa chỉ</span><strong>${h(employee.address?.street)}, ${h(employee.address?.district)}, ${h(employee.address?.city)}</strong></div>
    </div>
    <section class="skill-editor"><h3>Kỹ năng</h3>
      <div class="skill-list">${employee.skills?.length ? employee.skills.map((skill) => `<button class="skill-chip" data-remove-skill="${h(skill)}" title="Xóa kỹ năng">${h(skill)} ×</button>`).join("") : "Chưa có kỹ năng."}</div>
      <form class="add-skill"><input name="skill" required placeholder="Nhập kỹ năng mới"><button class="button primary">Thêm kỹ năng</button></form>
    </section>`;
  if (!$("#detail-dialog").open) $("#detail-dialog").showModal();
}

async function updateSkill(skill, action) {
  const employeeId = $("#detail-dialog").dataset.employeeId;
  await api(`/api/employees/${encodeURIComponent(employeeId)}/skills`, {
    method: "PATCH", body: JSON.stringify({ skill, action })
  });
  await showEmployeeDetail(employeeId);
  await loadDashboard();
  toast(action === "remove" ? "Đã xóa kỹ năng." : "Đã thêm kỹ năng.");
}

async function deleteEmployee(employeeId) {
  if (!confirm(`Xóa nhân viên ${employeeId}?`)) return;
  await api(`/api/employees/${encodeURIComponent(employeeId)}`, { method: "DELETE" });
  if (state.employeeSkip >= state.employeeTotal - 1) state.employeeSkip = Math.max(0, state.employeeSkip - state.employeePageSize);
  await Promise.all([loadEmployees(), loadDashboard(), loadProjects()]);
  toast("Đã xóa nhân viên.");
}

function projectQuery() {
  const params = new URLSearchParams(new FormData($("#project-filters")));
  for (const [key, value] of [...params]) if (!value) params.delete(key);
  return params;
}

async function loadProjects() {
  const projects = await api(`/api/projects?${projectQuery()}`);
  $("#project-rows").innerHTML = projects.length ? projects.map((project) => `
    <tr>
      <td><strong>${h(project.projectId)}</strong></td><td>${h(project.projectName)}</td><td>${projectStatus(project.status)}</td>
      <td>${money(project.budget)}</td><td>${h(project.managerName)}</td><td>${project.memberCount}</td><td>${project.totalHoursPerWeek}</td>
      <td><button class="button small secondary" data-project="${h(project.projectId)}">Xem</button></td>
    </tr>`).join("") : `<tr><td colspan="8" class="empty">Không tìm thấy dự án phù hợp.</td></tr>`;
}

async function showProject(projectId) {
  const project = await api(`/api/projects/${encodeURIComponent(projectId)}`);
  const profiles = new Map((project.memberProfiles || []).map((profile) => [profile.employeeId, profile]));
  $("#project-title").textContent = `${project.projectId} · ${project.projectName}`;
  $("#project-detail").innerHTML = `
    <div class="project-flow">
      <div class="detail-field"><span>Thông tin dự án</span><strong>${projectStatus(project.status)} · ${money(project.budget)}</strong></div>
      <div class="detail-field"><span>Người quản lý</span><strong>${h(project.manager?.fullName || project.managerId)}</strong></div>
      <div class="detail-field"><span>Thời gian</span><strong>${shortDate(project.startDate)} - ${shortDate(project.endDate)}</strong></div>
    </div>
    <section class="project-members"><h3>Danh sách thành viên</h3><div class="table-wrap"><table>
      <thead><tr><th>Mã</th><th>Họ tên</th><th>Vai trò</th><th>Ngày tham gia</th><th>Giờ/tuần</th></tr></thead>
      <tbody>${project.members.map((member) => `<tr><td><strong>${h(member.employeeId)}</strong></td><td>${h(profiles.get(member.employeeId)?.fullName || "Không còn hồ sơ")}</td><td>${h(member.role)}</td><td>${shortDate(member.joinDate)}</td><td>${member.hoursPerWeek}</td></tr>`).join("")}</tbody>
    </table></div></section>`;
  $("#project-dialog").showModal();
}

function activateView(view) {
  $$(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  $$(".view").forEach((section) => section.classList.toggle("active", section.id === `${view}-view`));
  $("#page-title").textContent = { dashboard: "Tổng quan", employees: "Nhân viên", projects: "Dự án" }[view];
}

function bindEvents() {
  $$(".nav-item").forEach((button) => button.addEventListener("click", () => activateView(button.dataset.view)));
  $("#dashboard-department").addEventListener("change", () => safely(loadDashboard));
  $("#employee-filters").addEventListener("submit", (event) => {
    event.preventDefault(); state.employeeSkip = 0; safely(loadEmployees);
  });
  $("#project-filters").addEventListener("submit", (event) => { event.preventDefault(); safely(loadProjects); });
  $("#add-employee").addEventListener("click", () => safely(() => openEmployeeForm()));
  $("#employee-form").addEventListener("submit", (event) => safely(() => saveEmployee(event)));
  $$(".close-dialog").forEach((button) => button.addEventListener("click", () => $("#employee-dialog").close()));
  $(".close-detail").addEventListener("click", () => $("#detail-dialog").close());
  $(".close-project").addEventListener("click", () => $("#project-dialog").close());

  $("#employee-rows").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    if (button.dataset.action === "detail") safely(() => showEmployeeDetail(button.dataset.id));
    if (button.dataset.action === "edit") safely(() => openEmployeeForm(button.dataset.id));
    if (button.dataset.action === "delete") safely(() => deleteEmployee(button.dataset.id));
  });
  $("#employee-detail").addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-skill]");
    if (button) safely(() => updateSkill(button.dataset.removeSkill, "remove"));
  });
  $("#employee-detail").addEventListener("submit", (event) => {
    event.preventDefault();
    const skill = new FormData(event.target).get("skill");
    safely(() => updateSkill(skill, "add"));
  });
  $("#project-rows").addEventListener("click", (event) => {
    const button = event.target.closest("[data-project]");
    if (button) safely(() => showProject(button.dataset.project));
  });
  $("#previous-page").addEventListener("click", () => {
    state.employeeSkip = Math.max(0, state.employeeSkip - state.employeePageSize); safely(loadEmployees);
  });
  $("#next-page").addEventListener("click", () => {
    state.employeeSkip += state.employeePageSize; safely(loadEmployees);
  });
}

async function init() {
  $("#today").textContent = new Intl.DateTimeFormat("vi-VN", { dateStyle: "full" }).format(new Date());
  bindEvents();
  await loadDepartments();
  await Promise.all([loadDashboard(), loadEmployees(), loadProjects()]);
}

safely(init);
