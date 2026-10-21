# 🚀 StaffSync - Modern Human Resource Management System

> A comprehensive, role-based web application built with the MERN Stack (MongoDB, Express.js, React.js, Node.js) designed to streamline and automate core HR operations, attendance tracking, leave workflows, and team management within an organization.

---

## 🌟 Key Features & Role-Based Access Control (RBAC)

StaffSync provides distinct roles and secure access levels to ensure operational transparency:

*   👤 **Employees:** 
    *   Register, login, and manage personal profile settings.
    *   Mark daily attendance (with automatic late-marking detection).
    *   Apply for leaves, track approval statuses, and prevent overlapping leave requests.
    *   View company-wide announcements and assigned training programs.
*   👔 **Managers:**
    *   Oversee direct report team members.
    *   Review, approve, or reject team leave requests (with automated notifications).
    *   Monitor team attendance logs and performance metrics.
    *   Manage and assign training & development programs.
*   👑 **HR (Admin):**
    *   Full CRUD control over employee and manager records, roles, and departments.
    *   Company-wide attendance tracking and comprehensive reporting/analytics.
    *   Post and broadcast company announcements.
    *   System security guards (e.g., HR protection safeguards, cascading cleanup on user deletion).

---

## 🛠️ Tech Stack

### **Backend**
*   **Node.js & Express.js** — RESTful API architecture
*   **MongoDB & Mongoose** — NoSQL database & ODM
*   **JWT (JSON Web Tokens)** — Secure stateless authentication
*   **Bcrypt.js** — Password hashing and security

### **Frontend (Upcoming / Client Integration)**
*   **React.js** — Component-based UI library
*   **Redux Toolkit** — State management
*   **React Router** — Protected routing & navigation
*   **Axios** — API communication layer with interceptors
*   **Bootstrap / Material UI** — Responsive styling & components

---

## 📁 Project Architecture

```text
staffsync/
│
├── server/                    # Backend Node/Express Application
│   ├── config/                # Database and environment configurations
│   ├── controllers/           # Route logic (users, attendance, leaves, etc.)
│   ├── middleware/            # JWT authentication & RBAC authorization
│   ├── models/                # Mongoose schemas (User, Attendance, Leave, etc.)
│   ├── routes/                # Express API routers
│   ├── utils/                 # Helpers (pagination, team lookup, notifications)
│   ├── server.js              # Entry point
│   └── package.json
│
└── client/                    # Frontend React Application (Setup phase)
    ├── src/
    └── package.json
