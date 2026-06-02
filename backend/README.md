# 🎓 Campus Club & Activity Coordination Platform

A beginner-friendly full-stack web application where students can join clubs, register for events, view announcements, and track attendance.

---

## 📁 Project Structure

```
campus-platform/
│
├── backend/
│   ├── app.py              ← Main Flask app (start here)
│   ├── database.py         ← MongoDB connection
│   ├── requirements.txt    ← Python dependencies
│   └── routes/
│       ├── __init__.py
│       ├── auth.py         ← Register & Login
│       ├── clubs.py        ← Club management
│       ├── events.py       ← Event management
│       ├── attendance.py   ← Attendance tracking
│       └── announcements.py← Announcements
│
└── frontend/
    ├── index.html          ← Main HTML page
    ├── style.css           ← All styles
    └── script.js           ← All JavaScript / API calls
```

---

## ⚙️ Setup Instructions

### Step 1: Install MongoDB

- **Windows**: Download from https://www.mongodb.com/try/download/community
- **Mac**: `brew tap mongodb/brew && brew install mongodb-community`
- **Linux**: Follow https://docs.mongodb.com/manual/installation/

Start MongoDB:
```bash
# Windows (run as Admin)
net start MongoDB

# Mac/Linux
mongod --dbpath /data/db
```

---

### Step 2: Setup the Backend

```bash
# Go into the backend folder
cd campus-platform/backend

# Create a virtual environment (keeps packages isolated)
python -m venv venv

# Activate the virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install all required packages
pip install -r requirements.txt

# Start the Flask server
python app.py
```

You should see:
```
✅ MongoDB connected successfully!
🚀 Starting Campus Platform backend...
📡 API running at: http://localhost:5000
```

---

### Step 3: Run the Frontend

Simply open the file in your browser:
```
campus-platform/frontend/index.html
```

Or use VS Code **Live Server** extension for a better experience.

---

## 🔑 User Roles

| Role    | Can Do |
|---------|--------|
| student | View clubs/events, join clubs, register for events |
| leader  | Everything above + create clubs/events, post announcements, mark attendance |
| admin   | Full access to everything |

---

## 📡 API Endpoints

### Authentication
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/register` | Create a new account |
| POST | `/login` | Login, returns JWT token |

### Clubs
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/clubs` | No | Get all clubs |
| POST | `/clubs` | Leader/Admin | Create a club |
| POST | `/clubs/<id>/join` | Student | Request to join |
| POST | `/clubs/<id>/approve` | Leader/Admin | Approve member |
| GET | `/clubs/<id>` | No | Get one club |

### Events
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/events` | No | Get all events |
| POST | `/events` | Leader/Admin | Create an event |
| POST | `/events/<id>/register` | Student | Register for event |

### Attendance
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/attendance` | Leader/Admin | Mark attendance |
| GET | `/attendance` | Any | View records |

### Announcements
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/announcements` | No | View all |
| POST | `/announcements` | Leader/Admin | Post one |

---

## 🧪 API Testing with curl

```bash
# 1. Register a new user
curl -X POST http://localhost:5000/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@test.com","password":"pass123","role":"student"}'

# 2. Login
curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"pass123"}'

# 3. Get all clubs (no auth needed)
curl http://localhost:5000/clubs

# 4. Create a club (replace TOKEN with your JWT from login)
curl -X POST http://localhost:5000/clubs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"name":"Coding Club","description":"For coding enthusiasts"}'

# 5. Get all events
curl http://localhost:5000/events

# 6. Post an announcement
curl -X POST http://localhost:5000/announcements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"title":"Welcome!","content":"Welcome to campus!","club":"General"}'
```

---

## 🗄️ MongoDB Collections

```
campus_platform (database)
│
├── users        { name, email, password(hashed), role, clubs[] }
├── clubs        { name, description, leader, members[], pending[] }
├── events       { title, description, date, time, location, club, registered[] }
├── attendance   { event_id, student_email, status, date, marked_by }
└── announcements{ title, content, posted_by, club, created_at }
```

---

## 🐛 Common Issues

**"Cannot connect to server"**
→ Make sure Flask is running: `python app.py`

**"MongoDB connection failed"**
→ Make sure MongoDB service is running

**CORS errors in browser**
→ Make sure Flask-CORS is installed and `CORS(app)` is in app.py

**JWT errors**
→ Token might have expired. Log out and log in again.

---

## 📚 Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Backend | Python + Flask |
| Database | MongoDB (via PyMongo) |
| Auth | JWT (Flask-JWT-Extended) |
| Frontend | HTML + CSS + JavaScript |
| Cross-origin | Flask-CORS |
