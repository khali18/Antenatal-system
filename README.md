# Antenatal and Postnatal Care Management System (ANC/PNC)

A professional, secure, full-stack **Antenatal and Postnatal Care Management System (ANC/PNC)** designed for hospital maternity departments. This system digitizes patient management from registration and active pregnancy tracking to sequential ANC visits, labor/delivery registration, newborn baby records, postnatal follow-up (PNC), and executive analytics.

> **Disclaimer:** This is a hospital management workflow prototype intended for administrative tracking and clinical record management. It does **not** provide automated medical diagnoses or treatment recommendations.

---

## 🌟 Key System Features

1. **Role-Based Access Control (RBAC)**
   - **Administrator (Doctor/IT):** Full system privileges, user management, audit logs, system-wide analytics.
   - **Midwife / Nurse:** Register patients, log ANC/PNC visits, record labor & delivery, register newborns, view 360 profile.
   - **Records Officer:** Register patients, update demographic details, schedule appointments, generate reports.

2. **Patient 360-Degree Clinical Profile**
   - 10 tabbed consolidated views: Overview, Active Pregnancy, ANC Visits, Journey Timeline, Appointments, Labor & Delivery, Baby Records, PNC Visits, Laboratory Logs, Prescriptions.
   - One-click **Print Summary** formatting for hospital paper charts.

3. **Clinical Modules & Automated Logic**
   - **Pregnancy Manager & EDD Calculator:** Auto-calculates Expected Date of Delivery (EDD using Naegele's rule) and current Gestational Age in weeks.
   - **Sequential ANC Visit Logger:** Tracks visit numbers, vital signs, fundal height, fetal heart rate, risk flags, lab orders, and prescriptions.
   - **Visual Journey Timeline:** Vertical chronological progression of patient maternity care events.
   - **Labor & Delivery Register:** Records delivery mode (Vaginal, C-Section, Assisted), maternal outcome, and blood loss.
   - **Newborn Baby Module:** Registers baby linked to mother and delivery record with APGAR scores (1 & 5 min), birth weight, and immunizations.
   - **Postnatal Care (PNC) Module:** Simultaneous maternal and infant postnatal checkups (24hr, 1-week, 6-week visits).

4. **Executive Dashboard & Reporting**
   - 6 Interactive **Chart.js** dynamic data visualizers: ANC Registrations, Trimester Distribution, Risk Flag Ratios, Delivery Modes, PNC Attendance, Age Demographics.
   - One-click **CSV Data Exports** for ANC monthly statistics, PNC records, and delivery outcomes.

5. **Security & Governance**
   - **JWT Authentication** with password hashing using `bcryptjs`.
   - Immutable **Audit Logging** tracking all user actions (`LOGIN`, `PATIENT_CREATE`, `ANC_VISIT_CREATE`, etc.).

---

## 🛠️ Technology Stack

- **Backend:** Node.js, Express.js (v5), MongoDB (Mongoose v8)
- **Frontend:** Single Page Application (SPA) using HTML5, Vanilla JavaScript, Bootstrap 5, FontAwesome 6, Chart.js
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs
- **Environment:** dotenv

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally on port `27017` or MongoDB Atlas URI

### Installation & Setup

1. **Clone/Navigate to Project Directory:**
   ```bash
   cd "c:/Users/Sherifa/Desktop/Antenatal sys"
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables (`.env`):**
   ```env
   PORT=7000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/antenatal_pnc_db
   JWT_SECRET=anc_pnc_super_secret_jwt_key_2026_maternity_care_hospital_app
   JWT_EXPIRE=24h
   ```

4. **Seed Database with Demo Data:**
   Populates MongoDB with 20 realistic anonymized Ghanaian patient records, active pregnancies, ANC visits, appointments, deliveries, babies, PNC visits, and audit logs:
   ```bash
   npm run seed
   ```

5. **Start Application Server:**
   ```bash
   npm start
   ```
   *Client Portal will be accessible at:* `http://localhost:7000`

---

## 🔑 Demo Account Credentials

| Role | Username | Password | Full Name |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `Admin@123` | Abdulai Osman |
| **Midwife / Nurse** | `nurse` | `Nurse@123` | Midwife Abena Osei |
| **Records Officer** | `records` | `Records@123` | Kofi Appiah |

---

## 📂 Project Directory Structure

```
Antenatal sys/
├── client/
│   ├── css/
│   │   └── styles.css          # Master design system & hospital styling
│   ├── js/
│   │   ├── api.js              # Unified API client & JWT management
│   │   ├── auth.js             # Authentication controller
│   │   ├── dashboard.js        # Executive analytics & Chart.js engine
│   │   ├── patients.js         # Patient directory & registration modal
│   │   ├── patientProfile.js   # 360-degree patient profile (10 tabs)
│   │   ├── pregnancy.js        # Pregnancy manager & EDD calculator
│   │   ├── anc.js              # ANC visit logger
│   │   ├── timeline.js         # Visual maternity journey renderer
│   │   ├── appointments.js     # Appointment manager
│   │   ├── delivery.js         # Labor & delivery registry
│   │   ├── babies.js           # Newborn baby manager
│   │   ├── pnc.js              # Postnatal care logger
│   │   ├── labMeds.js          # Laboratory & medication logs
│   │   ├── reports.js          # CSV report generator
│   │   ├── admin.js            # User management & audit log viewer
│   │   ├── notifications.js    # System notification drawer
│   │   └── app.js              # SPA router & app initialization
│   └── index.html              # Main layout single-page application
├── server/
│   ├── config/
│   │   └── db.js               # MongoDB connection handler
│   ├── controllers/            # Controller business logic
│   ├── middleware/             # Auth & error handling middlewares
│   ├── models/                 # Mongoose database models (11 schemas)
│   ├── routes/                 # Express API routes
│   ├── seed/
│   │   └── seeder.js           # Comprehensive database seeder
│   ├── utils/
│   │   └── auditLogger.js      # Immutable audit logging helper
│   └── server.js               # Main Express.js application server
├── test_system.js              # Integration test suite
├── package.json
├── .env
├── .env.example
└── README.md
```

---

## 🧪 Integration Verification

Run the automated API test suite to verify end-to-end functionality:
```bash
node test_system.js
```

---

## 📄 License & Academic Attribution
Developed as an Antenatal & Postnatal Care Management Prototype for Ghanaian Maternal Healthcare Record Improvement.
