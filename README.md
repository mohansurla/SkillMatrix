# SkillMatrix – Student Learning Progress & Skill Assessment System

A full-stack web application for tracking student learning progress, skill assessments, and performance analytics across training modules.

**Stack**: ReactJS (Vite) + Node.js/Express + SQLite

---

## 🎯 Features

- **3 User Roles**: Student, Mentor, Admin with full role-based access control
- **Student**: Submit assignments, track skill progress, view scores & feedback, leaderboard
- **Mentor**: Evaluate submissions, manage assigned students, view skill progress
- **Admin**: Full analytics dashboard, manage users/skills/modules, assign mentors to students
- **Progress Charts**: Bar, Line, Doughnut charts (Chart.js) for visual analytics
- **Notifications**: Real-time notification panel with auto-polling (30s interval)
- **Rankings**: Skill-based ranking system for students
- **Pagination**: All list views paginated
- **Responsive**: Mobile-friendly layout

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- npm

### 1. Clone the repository

```bash
git clone https://github.com/mohansurla/SkillMatrix.git
cd SkillMatrix
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
PORT=5000
JWT_SECRET=skillmatrix_super_secret_2024_xK9mP3qR
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

Start the backend:

```bash
npm run dev     # Development (nodemon)
npm start       # Production
```

The API will be available at **http://localhost:5000**

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at **http://localhost:5173**

---

## 🔐 Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@skillmatrix.com | Admin@123 |
| **Mentor** | mentor@skillmatrix.com | Mentor@123 |
| **Student** | student@skillmatrix.com | Student@123 |

---

## 📦 Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `JWT_SECRET` | — | JWT signing secret (required) |
| `JWT_EXPIRES_IN` | `7d` | Token expiry |
| `NODE_ENV` | `development` | Environment |
| `DB_PATH` | `./data/skillmatrix.db` | SQLite database path |

---

## 🗄️ Database Initialization

The database is **automatically initialized** when the backend starts. Tables are created and seed data is inserted if not already present.

**SQLite file location**: `backend/data/skillmatrix.db`

**Tables created**:
- `users` – Students, Mentors, Admins
- `skills` – Skill categories
- `modules` – Learning modules
- `mentor_students` – Mentor-student assignments
- `assignments` – Student submissions
- `evaluations` – Mentor scores and feedback
- `progress_tracking` – Per-skill completion percentage
- `notifications` – User notifications

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login & get JWT |
| GET | `/api/auth/me` | Get current user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users (admin) |
| GET | `/api/users/:id` | Get user by ID |
| PUT | `/api/users/:id` | Update profile |
| DELETE | `/api/users/:id` | Delete user (admin) |
| GET | `/api/users/mentors` | List mentors |
| GET | `/api/users/mentor-students` | List mentor's students |
| POST | `/api/users/mentor-students` | Assign mentor to student |

### Skills
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/skills` | List skills |
| POST | `/api/skills` | Create skill (admin) |
| PUT | `/api/skills/:id` | Update skill (admin) |
| DELETE | `/api/skills/:id` | Delete skill (admin) |

### Modules
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/modules` | List modules |
| GET | `/api/modules/:id` | Get module |
| POST | `/api/modules` | Create module |
| PUT | `/api/modules/:id` | Update module |
| DELETE | `/api/modules/:id` | Delete module (admin) |

### Assignments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assignments` | List assignments (role-filtered) |
| GET | `/api/assignments/:id` | Get assignment |
| POST | `/api/assignments` | Submit assignment (student) |

### Evaluations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/evaluations` | List evaluations |
| POST | `/api/evaluations` | Submit evaluation (mentor) |

### Progress
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/progress` | Fetch student progress |
| GET | `/api/progress/overview` | Admin overview stats |
| GET | `/api/progress/rankings` | Student rankings |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get user notifications |
| PUT | `/api/notifications/:id/read` | Mark as read |
| PUT | `/api/notifications/read-all` | Mark all as read |

---

## 📁 Project Structure

```
SkillMatrix/
├── backend/
│   ├── src/
│   │   ├── config/          Configuration
│   │   ├── controllers/     Business logic
│   │   ├── database/        SQLite init + seeds
│   │   ├── middleware/      Auth, validation, errors
│   │   └── routes/          API endpoints
│   ├── data/                SQLite database file
│   └── package.json
└── frontend/
    └── src/
        ├── api/             Axios + API services
        ├── components/      Reusable UI components
        ├── context/         Auth + Notification context
        ├── layouts/         Dashboard layout
        ├── pages/
        │   ├── auth/        Login, Register
        │   ├── student/     Dashboard, Assignments, Progress, Profile
        │   ├── mentor/      Dashboard, Evaluate, Students
        │   └── admin/       Dashboard, Analytics, Users, Skills, Modules
        └── routes/          Protected routes
```

---

## 🎨 Design

- **Dark mode** premium UI with glassmorphism effects
- **Inter + Plus Jakarta Sans** typography (Google Fonts)
- **Chart.js** for progress analytics (Bar, Doughnut charts)
- **Smooth animations** and micro-interactions
- CSS variables design system (no Tailwind, pure CSS)

---

## ✅ Business Rules Enforced

1. Duplicate assignment submission for same module → **409 Conflict**
2. Mentor can only evaluate assigned students → **403 Forbidden**
3. Students can only see their own assignments
4. Role-based route protection on frontend and backend
5. All inputs validated on both frontend (inline) and backend (express-validator)

---

## 🏆 Bonus Features

- ✅ Progress charts (Bar + Doughnut)
- ✅ Skill-based ranking system with medals (🥇🥈🥉)
- ✅ Notification panel with unread badge
- ✅ Auto-polling notifications every 30 seconds
- ✅ Score circle with color-coded performance tiers
