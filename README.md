# Hospital Ticket Management System

A phased hospital-focused ticket management system with:
- Backend: Node.js, Express, Prisma, MySQL, JWT, Multer
- Frontend: React, Vite, Bootstrap, React Router, Axios

## Project Structure
- `backend/` Express API, Prisma schema, seed script, uploads
- `frontend/` React application for hospital staff and requesters

## Backend Setup
1. Open a terminal in `D:\TMS_Hospital\backend`
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Copy environment file:
   ```powershell
   copy .env.example .env
   ```
4. Update `.env` values for MySQL and JWT.
5. Generate Prisma client:
   ```powershell
   npx prisma generate
   ```
6. Run migrations:
   ```powershell
   npx prisma migrate dev --name init
   ```
7. Seed the default admin user:
   ```powershell
   npm run seed
   ```
8. Start the backend:
   ```powershell
   npm run dev
   ```

## Frontend Setup
1. Open a terminal in `D:\TMS_Hospital\frontend`
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Copy environment file:
   ```powershell
   copy .env.example .env
   ```
4. Start the frontend:
   ```powershell
   npm run dev
   ```

## MySQL Configuration
1. Ensure MySQL server is running.
2. Create a database, for example:
   ```sql
   CREATE DATABASE tms_hospital;
   ```
3. Set `DATABASE_URL` in `backend/.env` using this pattern:
   ```env
   DATABASE_URL="mysql://USERNAME:PASSWORD@localhost:3306/tms_hospital"
   ```

## Prisma Commands
- Generate client:
  ```powershell
  npx prisma generate
  ```
- Create/apply migrations during development:
  ```powershell
  npx prisma migrate dev --name your_migration_name
  ```
- Open Prisma Studio:
  ```powershell
  npx prisma studio
  ```

## Seed Commands
Default admin seed values can be controlled from `backend/.env`:
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `SEED_ADMIN_NAME`
- `SEED_ADMIN_PHONE`

Run the seed with:
```powershell
npm run seed
```

## Environment Files
### Backend
Required values in `backend/.env`:
- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CLIENT_URL`
- `BCRYPT_SALT_ROUNDS`

### Frontend
Required value in `frontend/.env`:
- `VITE_API_BASE_URL`

## Current Notes
- User management UI is limited by current backend support. The backend exposes user registration, but not user list, edit, or status-toggle endpoints yet.
- Ticket assignment now rejects requester accounts and only allows operational roles.
- Frontend now includes shared toasts, confirmation dialogs, stronger form validation, and better mobile layout behavior.

## Recommended Run Order
1. Configure backend `.env`
2. Run backend migration and seed
3. Start backend server
4. Configure frontend `.env`
5. Start frontend server
"# tms" 
