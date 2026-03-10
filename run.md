# MockMate AI — How to Run the Project

## Prerequisites

Make sure the following are installed before you begin:

- **Python 3.11+** — [python.org](https://python.org)
- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **MongoDB** — running locally on the default port `27017`
  - [Install MongoDB Community Edition](https://www.mongodb.com/try/download/community)
  - Or use **MongoDB Atlas** (update `MONGODB_URI` in `.env` accordingly)

---

## 1. Clone / Open the Project

Open the project folder in your terminal:

```
cd "C:\Users\Sourabh Chaudhari\Downloads\MockmateGemini"
```

---

## 2. Backend Setup & Run

### 2a. Install Python dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2b. Configure environment variables

The `.env` file is already present at `backend/.env`. Verify it has:

```
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=mockmate
JWT_SECRET=mockmate-dev-secret-change-in-production
GEMINI_API_KEY=<your-gemini-api-key>
FRONTEND_URL=http://localhost:5173
```

### 2c. (First time only) Seed the demo user & data

This inserts the test user, resume, and 6 sessions into MongoDB. Safe to re-run — it skips already-existing data.

```bash
python seed_dummy_user.py
```

**Demo credentials seeded:**
- Email: `connect@sourabhchaudhari.com`
- Password: `mockmate@123`

### 2d. Start the backend server

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend will be live at: **http://localhost:8000**  
Interactive API docs: **http://localhost:8000/docs**

---

## 3. Frontend Setup & Run

Open a **new terminal** and run:

```bash
cd frontend
npm install
npm run dev
```

Frontend will be live at: **http://localhost:5173**

---

## 4. Use the App

1. Open **http://localhost:5173** in your browser
2. Click **Login**
3. Enter the demo credentials:
   - **Email:** `connect@sourabhchaudhari.com`
   - **Password:** `mockmate@123`
4. You'll land on the dashboard with all pre-filled sessions and resume data

---

## 5. Quick Reference — Start Commands

| Service   | Command                                                                          | Directory  |
|-----------|----------------------------------------------------------------------------------|------------|
| Backend   | `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`            | `backend/` |
| Frontend  | `npm run dev`                                                                     | `frontend/`|
| Seed data | `python seed_dummy_user.py`                                                       | `backend/` |

---

## 6. Stop / Kill Running Processes

### Stop Gracefully
If the terminal is still open, just press **`Ctrl + C`** in the terminal window running the backend or frontend.

---

### Force Kill by Port (if terminal is closed or Ctrl+C doesn't work)

**Kill the Backend (port 8000):**

```powershell
# Step 1 — find the PID using port 8000
netstat -ano | findstr :8000

# Step 2 — kill it (replace <PID> with the number from step 1)
taskkill /PID <PID> /F
```

**Kill the Frontend (port 5173 or 5174+):**

```powershell
# Step 1 — find the PID
netstat -ano | findstr :5173

# Step 2 — kill it
taskkill /PID <PID> /F
```

---

### Kill All Node.js Processes (kills all frontends at once)

```powershell
taskkill /IM node.exe /F
```

### Kill All Python/Uvicorn Processes (kills all backends at once)

```powershell
taskkill /IM python.exe /F
```

> ⚠️ The `/IM` commands above kill **all** running Node or Python processes. Use the port-specific method if you have other processes you want to keep alive.

---

## 7. Troubleshooting

| Problem | Fix |
|---------|-----|
| `MongoServerSelectionError` | Make sure MongoDB is running (`mongod`) |
| Port 8000 already in use | Kill the old process: `netstat -ano \| findstr :8000` then `taskkill /PID <pid> /F` |
| Port 5173 already in use | Vite will auto-pick the next port (5174, 5175…) |
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` again |
| Login fails | Re-run `python seed_dummy_user.py` inside the `backend/` folder |
