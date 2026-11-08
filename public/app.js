const API = "/api";
const tableBody = document.getElementById("studentTable");
const modal = document.getElementById("modalBackdrop");
const form = document.getElementById("studentForm");
const formError = document.getElementById("formError");
const searchInput = document.getElementById("searchInput");
const courseFilter = document.getElementById("courseFilter");
let editingId = null;
let toastTimer;

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

async function loadStats() {
  const stats = await request(`${API}/stats`);
  document.getElementById("totalCount").textContent = stats.total;
  document.getElementById("activeCount").textContent = stats.active;
  document.getElementById("inactiveCount").textContent = stats.inactive;
}

async function loadStudents() {
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set("search", searchInput.value.trim());
  if (courseFilter.value) params.set("course", courseFilter.value);

  const students = await request(`${API}/students?${params.toString()}`);
  renderStudents(students);
  updateCourseFilter(students);
  document.getElementById("recordCount").textContent =
    `Showing ${students.length} record${students.length === 1 ? "" : "s"}`;
}

function renderStudents(students) {
  if (!students.length) {
    tableBody.innerHTML = '<tr><td colspan="6" class="empty-state">No student records found. Click “Add Student” to create one.</td></tr>';
    return;
  }

  tableBody.innerHTML = students.map(student => {
    const fullName = `${escapeHTML(student.first_name)} ${escapeHTML(student.last_name)}`;
    const statusClass = student.status === "Active" ? "active" : "inactive";
    return `<tr>
      <td><span class="student-name">${fullName}</span><span class="student-id">STU-${String(student.id).padStart(4, "0")}</span></td>
      <td>${escapeHTML(student.email)}</td>
      <td>${escapeHTML(student.course)}</td>
      <td>${escapeHTML(student.year_level)}</td>
      <td><span class="status ${statusClass}">${escapeHTML(student.status)}</span></td>
      <td><div class="actions"><button class="action-btn" data-action="edit" data-id="${student.id}">Edit</button><button class="action-btn delete" data-action="delete" data-id="${student.id}">Delete</button></div></td>
    </tr>`;
  }).join("");
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function updateCourseFilter(students) {
  // Keep the selected filter while refreshing; course options also include all standard choices.
  const current = courseFilter.value || "All Courses";
  const courses = ["BSIT", "BSCS", "BSIS", "BSBA", "BSED", "BEED", "Other"];
  const existing = [...courseFilter.options].map(option => option.value);
  courses.forEach(course => {
    if (!existing.includes(course)) {
      const option = document.createElement("option");
      option.value = course;
      option.textContent = course;
      courseFilter.appendChild(option);
    }
  });
  courseFilter.value = current;
}

async function refreshDashboard() {
  await Promise.all([loadStats(), loadStudents()]);
}

function openModal(student = null) {
  editingId = student ? student.id : null;
  form.reset();
  formError.textContent = "";
  document.getElementById("modalTitle").textContent = student ? "Edit Student" : "Add Student";
  document.getElementById("saveBtn").textContent = student ? "Update Student" : "Save Student";

  if (student) {
    for (const [key, value] of Object.entries(student)) {
      if (form.elements[key]) form.elements[key].value = value;
    }
  }
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  form.elements.first_name.focus();
}

function closeModal() {
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  editingId = null;
}

document.getElementById("addStudentBtn").addEventListener("click", () => openModal());
document.getElementById("closeModalBtn").addEventListener("click", closeModal);
document.getElementById("cancelBtn").addEventListener("click", closeModal);
modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
document.addEventListener("keydown", event => { if (event.key === "Escape") closeModal(); });

form.addEventListener("submit", async event => {
  event.preventDefault();
  formError.textContent = "";
  const payload = Object.fromEntries(new FormData(form).entries());

  try {
    await request(editingId ? `${API}/students/${editingId}` : `${API}/students`, {
      method: editingId ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    closeModal();
    await refreshDashboard();
    showToast(editingId ? "Student updated successfully!" : "Student added successfully!");
  } catch (error) {
    formError.textContent = error.message;
  }
});

tableBody.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = button.dataset.id;

  if (button.dataset.action === "edit") {
    try {
      const student = await request(`${API}/students/${id}`);
      openModal(student);
    } catch (error) {
      showToast(error.message);
    }
  }

  if (button.dataset.action === "delete") {
    if (!confirm("Are you sure you want to delete this student? This action cannot be undone.")) return;
    try {
      await request(`${API}/students/${id}`, { method: "DELETE" });
      await refreshDashboard();
      showToast("Student deleted successfully!");
    } catch (error) {
      showToast(error.message);
    }
  }
});

let searchDelay;
searchInput.addEventListener("input", () => {
  clearTimeout(searchDelay);
  searchDelay = setTimeout(() => loadStudents().catch(error => showToast(error.message)), 250);
});
courseFilter.addEventListener("change", () => loadStudents().catch(error => showToast(error.message)));

refreshDashboard().catch(error => {
  tableBody.innerHTML = `<tr><td colspan="6" class="empty-state">${escapeHTML(error.message)} Check that the server is running.</td></tr>`;
});