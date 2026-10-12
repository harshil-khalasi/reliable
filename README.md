# Reliable Solution — Workforce & Project Management System

A production-grade **MERN Stack** (MongoDB, Express.js, React.js, Node.js) web application engineered for managing organizational workforce directories and tracking project lifecycles with strict Role-Based Access Control (RBAC).


### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- Git (or extracted zip project folder)

---

### 2. Install Dependencies
Open a terminal in the root project folder:
```bash
# Option A: Install both server & client in one command
npm run install:all

# Option B: Or install individually
cd server && npm install
cd ../client && npm install
```

---

### 3. Start the Application
Open **two separate terminal windows**:

#### **Terminal 1 — Backend API Server:**
```bash
cd server
node server.js
```
**Expected Output:**
```text
MongoDB connected: ac-rq05f3h-shard-00-00.sqqubw3.mongodb.net (Live Atlas Cloud)
Server running on port 5000
Health Check: http://localhost:5000/api/health
```

#### **Terminal 2 — Frontend Client:**
```bash
cd client
npm run dev
```
**Expected Output:**
```text
  VITE v8.3.4  ready

  ➜  Local:   http://localhost:3000/  (or http://localhost:3001/)
```

Now open your browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)** *(or the port displayed in your frontend terminal)*

---

## 🔑 Test Login Credentials

The cloud database contains pre-configured test accounts ready for testing:

| Role | Email | Password | What You Can Test |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `admin123` | **Full Access**: Add/Edit/Delete employees (with 10-digit mobile validation), create projects, assign staff, change priorities, and view high-level analytics. |
| **Employee (harshil)** | `harshil789@gmail.com` | `employee123` | **Employee Workspace**: View assigned project (*Internal HR & Payroll Portal*), update execution status (*Pending / In Progress / Completed*), and search staff directory. |
| **Employee (tanik45)** | `tanik@gmail.co` | `employee123` | Assigned to *Enterprise Cloud Migration* project. |
| **Employee (Arjun)** | `arjun.verma@example.com` | `employee123` | Assigned to *Financial Analytics & Audit Dashboard* project. |

---
