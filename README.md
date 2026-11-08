# Neon StudentHub — Student Management Dashboard

A responsive student management dashboard with a neon pink and neon green dark theme. Built with HTML, CSS, vanilla JavaScript, Express.js, and SQLite.

## Features
- Dashboard totals for all, active, and inactive students
- Create, read, update, and delete student records
- Search by first name, last name, or email
- Filter by course
- SQLite database persistence
- Input validation and duplicate-email handling
- Responsive layout

## Requirements
- Node.js (LTS recommended)
- npm
- Visual Studio Code (recommended)

## Run locally

1. Download and extract the project ZIP.
2. Open the `neon-studenthub` folder in VS Code.
3. Open Terminal → New Terminal.
4. Install dependencies:

   ```bash
   npm install
   ```

5. Start the application:

   ```bash
   npm start
   ```

6. Open this address in your browser:

   `http://localhost:3000`

The SQLite database file (`students.db`) is created automatically when the server starts. Keep the terminal running while using the app. Press `Ctrl + C` to stop the server.

## Project structure

```text
neon-studenthub/
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── database.js
├── server.js
├── package.json
├── .gitignore
├── .env.example
└── README.md
```

## API routes

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/stats` | Dashboard statistics |
| GET | `/api/students` | List/search/filter students |
| GET | `/api/students/:id` | Get one student |
| POST | `/api/students` | Add student |
| PUT | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Delete student |

Example JSON for POST or PUT:

```json
{
  "first_name": "Alex",
  "last_name": "Morgan",
  "email": "alex@example.com",
  "course": "BSIT",
  "year_level": "1st Year",
  "status": "Active"
}
```

## Upload to GitHub

1. Sign in at https://github.com and click **New repository**.
2. Repository name: `neon-studenthub`.
3. Choose Public or Private, then click **Create repository**.
4. In VS Code, open the project terminal.
5. Run these commands (replace the URL with your own repository URL):

   ```bash
   git init
   git add .
   git commit -m "Create Neon StudentHub CRUD dashboard"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/neon-studenthub.git
   git push -u origin main
   ```

6. Refresh your GitHub repository page. Your source files should appear there.

If Git asks you to identify yourself, configure your Git name and email:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

Then repeat the commit and push commands.

## Important
- Do not upload `node_modules`, `.env`, or the generated `students.db` file.
- The `.gitignore` file excludes these automatically.
- GitHub stores your source code; it does not automatically host/run this Express application.
