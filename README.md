# Poosdlargeproject
Mern stack 

## Running locally

You need [Node.js](https://nodejs.org) (LTS version) installed.

### Backend (Express + MongoDB)

```bash
cd backend
cp .env.example .env   # then fill in the real MongoDB username/password and a JWT secret
npm install
npm run dev
```

The API runs on http://localhost:5000.

### Frontend (React + TypeScript)

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). Requests to `/api` are forwarded to the backend.

## API

| Method | Path            | Body                                                  | Returns                 |
|--------|-----------------|-------------------------------------------------------|-------------------------|
| POST   | `/api/register` | `username`, `password`, `confirmPassword`, `email`    | `{ token, username }`   |
| POST   | `/api/login`    | `username`, `password`                                | `{ token, username }`   |
| GET    | `/api/me`       | header `Authorization: Bearer <token>`                | `{ username }`          |
