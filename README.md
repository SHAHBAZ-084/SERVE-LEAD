# SERVE & LEAD SOCIETY (SLS) - Management System

A comprehensive Full-Stack (MERN) platform designed to streamline society memberships, event coordination, and administrative oversight. This system features a high-end, responsive UI and a robust secondary security layer for member verification.

---

## 🚀 Core Features

### 👤 Member Portal
- **Advanced Registration:** Multi-step onboarding with mandatory **Gmail OTP Verification**.
- **Security Checkpoint:** Strict "Application Pending" workflow. Access is only granted after Admin approval.
- **Dynamic Dashboard:** Real-time stats on joined events and society announcements.
- **Event Highlights:** Browse upcoming society events, view posters, and register with one click.

### 🛡️ Admin Command Center
- **Membership Oversight:** Review, Approve, Block, or Terminate members with integrated activity tracking.
- **Event Factory:** Create events with high-resolution image posters, timing details, and venue locations.
- **Participant Manager:** View and export registration lists for specific events.
- **Activity Forensic Logs:** Automatic tracking of all admin actions (Who changed what and when). 
  - *Note: Logs are automatically purged every 3 days to maintain database performance.*

---

## 🛠️ Tech Stack

- **Frontend:** React.js (Vite), Tailwind CSS, Lucide Icons, Axios.
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB (with TTL Indexing for auto-cleanup).
- **Authentication:** JSON Web Tokens (JWT) & Bcrypt password hashing.
- **Security:** Helmet.js (with Cross-Origin Resource Policy for media).

---

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas or Local Community Server

### 1. Backend Configuration
Navigate to `/backend_node` and create a `.env` file:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_secure_secret
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
```
Run the server:
```bash
npm install
npm run dev
```

### 2. Frontend Configuration
Navigate to `/frontend`:
```bash
npm install
npm run dev
```
The application will be available at `http://localhost:5173`.

---

## 🔒 Security Policy
- Sensitive credentials (`.env`) are kept out of version control via `.gitignore`.
- Password encryption using individual salt rounds.
- Automated 3-day log rotation to ensure data privacy and system speed.

---

## 🎨 Layout & Design
The system uses a **Liquid Glass** aesthetic combined with high-contrast typography, designed to be fully fluid across all screen sizes (Mobile, Tablet, and Desktop).

*Designed and Developed for SLS Architecture.*
