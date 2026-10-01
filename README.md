# Student Placement Management System

Full-stack college project:
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MySQL
- Authentication: JWT + bcrypt

## Requirements
- Node.js 18+
- MySQL 8+
- VS Code

## 1. Database
Open MySQL Workbench or MySQL Command Line and run:

```sql
source backend/database/schema.sql
```

If `source` does not work, open `backend/database/schema.sql`, copy all SQL and run it in MySQL Workbench.

## 2. Backend
```bash
cd backend
npm install
```

Edit `backend/.env`:
- DB_USER
- DB_PASSWORD
- JWT_SECRET

Then:
```bash
npm run dev
```

Backend runs on http://localhost:5000

## 3. Frontend
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on the URL shown by Vite, normally http://localhost:5173

## Demo admin
Register a normal account first. To make it admin, run:
```sql
UPDATE users SET role='admin' WHERE email='your@email.com';
```

## Important
Do not put real passwords or production secrets in `.env`.
