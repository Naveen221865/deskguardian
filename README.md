# DeskGuard – Library Seat Booking & Anti-Hoarding App

## Project Structure
```
deskguardian/
├── backend/        # Node.js + Express API
└── frontend/       # React + Tailwind UI
```

## Prerequisites
- Node.js 18+
- PostgreSQL running on localhost:5432
- Redis running on localhost:6379

## Setup

### 1. Database
Create a PostgreSQL database named `deskguard`:
```sql
CREATE DATABASE deskguard;
```

### 2. Backend
```bash
cd backend
npm install
# Edit .env with your DB credentials
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

## Default URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## First-Time Setup
Register a librarian account via POST /api/auth/register with role: "librarian",
then add desks from the Admin Dashboard.

## API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | - | Register student/librarian |
| POST | /api/auth/login | - | Login |
| GET | /api/desks | - | All desk statuses |
| GET | /api/desks/qr/:qr | - | Get desk by QR code |
| GET | /api/desks/my-session | JWT | Current session |
| POST | /api/desks/checkin | JWT | Check in to desk |
| POST | /api/desks/checkout | JWT | Check out |
| POST | /api/desks/away | JWT | Start away mode |
| POST | /api/desks/resume | JWT | Resume from away |
| POST | /api/desks/presence | JWT | Confirm presence |
| GET | /api/admin/stats | Librarian | Dashboard stats |
| GET | /api/admin/sessions | Librarian | All active sessions |
| POST | /api/admin/force-checkout/:id | Librarian | Force release desk |
| POST | /api/admin/desks | Librarian | Add desk + generate QR |
| DELETE | /api/admin/desks/:id | Librarian | Delete desk |
