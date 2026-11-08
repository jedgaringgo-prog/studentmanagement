require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const clean = (value) => String(value ?? "").trim();

function validateStudent(body) {
  const student = {
    first_name: clean(body.first_name),
    last_name: clean(body.last_name),
    email: clean(body.email).toLowerCase(),
    course: clean(body.course),
    year_level: clean(body.year_level),
    status: clean(body.status || "Active")
  };

  const required = ["first_name", "last_name", "email", "course", "year_level"];
  for (const field of required) {
    if (!student[field]) return { error: `${field.replace("_", " ")} is required.` };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
    return { error: "Please enter a valid email address." };
  }

  if (!["Active", "Inactive"].includes(student.status)) {
    return { error: "Status must be Active or Inactive." };
  }

  return { student };
}

// Dashboard summary
app.get("/api/stats", (req, res) => {
  const total = db.prepare("SELECT COUNT(*) AS count FROM students").get().count;
  const active = db.prepare("SELECT COUNT(*) AS count FROM students WHERE status = 'Active'").get().count;
  const inactive = total - active;
  res.json({ total, active, inactive });
});

// Read all students; optional search and course filters
app.get("/api/students", (req, res) => {
  const search = `%${clean(req.query.search)}%`;
  const course = clean(req.query.course);

  let rows;
  if (course && course !== "All Courses") {
    rows = db.prepare(`
      SELECT * FROM students
      WHERE (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)
      AND course = ?
      ORDER BY id DESC
    `).all(search, search, search, course);
  } else {
    rows = db.prepare(`
      SELECT * FROM students
      WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ?
      ORDER BY id DESC
    `).all(search, search, search);
  }
  res.json(rows);
});

// Read one student
app.get("/api/students/:id", (req, res) => {
  const student = db.prepare("SELECT * FROM students WHERE id = ?").get(req.params.id);
  if (!student) return res.status(404).json({ error: "Student not found." });
  res.json(student);
});

// Create student
app.post("/api/students", (req, res) => {
  const { student, error } = validateStudent(req.body);
  if (error) return res.status(400).json({ error });

  try {
    const result = db.prepare(`
      INSERT INTO students (first_name, last_name, email, course, year_level, status)
      VALUES (@first_name, @last_name, @email, @course, @year_level, @status)
    `).run(student);

    const created = db.prepare("SELECT * FROM students WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ error: "That email address is already registered." });
    }
    console.error(err);
    res.status(500).json({ error: "Unable to create student." });
  }
});

// Update student
app.put("/api/students/:id", (req, res) => {
  const { student, error } = validateStudent(req.body);
  if (error) return res.status(400).json({ error });

  try {
    const result = db.prepare(`
      UPDATE students SET
        first_name = @first_name,
        last_name = @last_name,
        email = @email,
        course = @course,
        year_level = @year_level,
        status = @status
      WHERE id = @id
    `).run({ ...student, id: req.params.id });

    if (!result.changes) return res.status(404).json({ error: "Student not found." });
    res.json(db.prepare("SELECT * FROM students WHERE id = ?").get(req.params.id));
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ error: "That email address is already registered." });
    }
    console.error(err);
    res.status(500).json({ error: "Unable to update student." });
  }
});

// Delete student
app.delete("/api/students/:id", (req, res) => {
  const result = db.prepare("DELETE FROM students WHERE id = ?").run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: "Student not found." });
  res.json({ message: "Student deleted successfully." });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Neon StudentHub running at http://localhost:${PORT}`);
});