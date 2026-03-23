# 🩺 MediSense AI — Ultimate Edition

> AI-powered personal health companion built for **CodeCure AI Hackathon — SPIRIT'26, IIT BHU**

![MediSense AI](https://img.shields.io/badge/MediSense-AI-38bdf8?style=for-the-badge&logo=heart)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)

---

## ✨ Features

| # | Feature | Description |
|---|---|---|
| 1 | 🌐 Multilingual | English, Hindi, Tamil |
| 2 | 💊 Medicine Checker | Drug interaction checker |
| 3 | 📊 Health Dashboard | Session stats & trends |
| 4 | 🧬 Body Map | Tap where it hurts |
| 5 | 🔔 Medication Reminders | Set medicine reminders |
| 6 | 💬 AI Chat | Follow-up health questions |
| 7 | 🩸 Vitals Input | BP, Temp, HR, Sugar, SpO2 |
| 8 | 🌙 Dark / Light Mode | Theme toggle |
| 9 | 🔊 Text-to-Speech | Results read aloud |
| 10 | 🆘 Emergency SOS | One-tap Call 112 |
| 11 | 🗺️ Nearby Doctors | Google Maps integration |
| 12 | 📄 PDF Export | Downloadable health report |
| + | 🎙️ Voice Input | Speak your symptoms |
| + | 📷 Photo Analysis | Upload symptom images |
| + | 🔐 Supabase Auth | Real email/password login |
| + | 💾 Cloud History | Sessions saved to Supabase |
| + | 🛡️ Admin Panel | Full admin control center |
| + | 📢 Announcements | Push messages to all users |

---

## 🚀 Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Start development server
```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
medisense-ai/
├── public/
│   └── index.html          ← HTML entry point
├── src/
│   ├── App.jsx             ← Main app (all features)
│   └── index.js            ← React entry point
├── package.json
├── .gitignore
└── README.md
```

---

## 🗄️ Supabase Setup

Run this SQL in your Supabase SQL Editor:

```sql
-- Health sessions
create table health_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  symptoms text,
  result jsonb,
  vitals jsonb,
  created_at timestamp with time zone default now()
);

-- Announcements
create table announcements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  body text not null,
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- RLS Policies
alter table health_sessions enable row level security;
alter table announcements enable row level security;

create policy "Users read own sessions" on health_sessions for select using (auth.uid() = user_id);
create policy "Users insert own sessions" on health_sessions for insert with check (auth.uid() = user_id);
create policy "Users delete own sessions" on health_sessions for delete using (auth.uid() = user_id);
create policy "Anyone reads announcements" on announcements for select using (true);
create policy "Admin manages announcements" on announcements for all using (true);
```

---

## 🌐 Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Or connect your GitHub repo at [vercel.com](https://vercel.com)

---

## 🛡️ Admin Access

From the Hero page → click **"🛡️ Admin"** → Enter password: **`Ash1`**

---

## 🛠️ Tech Stack

- **Frontend** — React 18
- **AI** — Claude API (claude-sonnet-4)
- **Database & Auth** — Supabase
- **Maps** — Google Maps Embed API
- **Voice** — Web Speech API
- **Photo** — FileReader API + Claude Vision

---

## ⚕️ Disclaimer

MediSense AI is not a substitute for professional medical advice. Always consult a qualified healthcare provider.

---

**Built for CodeCure AI Hackathon — SPIRIT'26, IIT BHU Varanasi** 🏆
