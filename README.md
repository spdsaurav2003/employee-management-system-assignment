# Employee Management System (EMS)

A full-stack Employee Management System built to handle organizational hierarchies, user roles, and employee records. This project features secure authentication, role-based access control (RBAC), and a responsive dashboard.

## 🚀 Tech Stack
*   **Frontend:** Next.js (App Router), React, Tailwind CSS, Axios
*   **Backend:** Node.js, Express.js, JSON Web Tokens (JWT) for authentication
*   **Database:** MongoDB (Mongoose)

## ✨ Core Features
*   **Authentication & Authorization:** Secure login system using JWT.
*   **Role-Based Access Control:** 
    *   **Super Admin / HR:** Full access to create, edit, and delete employee records.
    *   **Employee:** Read-only access to view the organizational structure and their own details.
*   **Interactive Dashboard:** Metrics overview displaying total staff, active employees, and department breakdowns.
*   **Organizational Management:** Add, update, and manage employee profiles and department assignments.
*   **Dark Mode Support:** Fully responsive UI with a built-in light/dark theme toggle.

## 🛠️ Local Development Setup

### 1. Clone the repository
`git clone https://github.com/YourUsername/employee-management-system-assignment.git`
`cd employee-management-system-assignment`

### 2. Environment Variables
Create a `.env` file in both the `frontend` and `backend` directories.

**Backend (`backend/.env`):**
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key

**Frontend (`frontend/.env.local`):**
NEXT_PUBLIC_API_URL=http://localhost:5000/api

### 3. Install Dependencies & Run
You will need two terminal windows open to run the frontend and backend concurrently.

**Terminal 1 (Backend):**
`cd backend`
`npm install`
`npm run dev`
*(Server will start on http://localhost:5000)*

**Terminal 2 (Frontend):**
`cd frontend`
`npm install`
`npm run dev`
*(App will start on http://localhost:3000)*

## 🧪 Test Accounts
Use the following credentials to test Role-Based Access Control:
*   **Admin:** `admin@ems.com` / `Password123` (Full Access)
*   **HR:** `hr@ems.com` / `Password123` (Full Access)
*   **Employee:** `employee@ems.com` / `Password123` (Read-Only)

---