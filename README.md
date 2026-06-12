# ⚡ Health Engine — Personal Dashboard

> **Karthik Chary · 32yr · 178cm · 95kg → 85kg goal**  
> LCHF/Keto Indian diet · Spinal-safe workout · Thyroid + Fatty Liver protocol

A full-stack personal health tracking app built with Node.js, Express, MongoDB, and vanilla JS.

---

## 🖥️ Features

| Section | What it does |
|---|---|
| 🏠 **Dashboard** | Daily 12-checkpoint timeline, water tracker (4L), workout log, mood & energy check-in |
| 🥗 **Diet Plan** | 7-day LCHF/Keto Indian meal plan with per-meal macros (~1600 kcal/day) |
| 📖 **Recipes** | 12 thyroid-safe, fatty-liver-safe recipes with ingredients, steps & tips |
| 💪 **Workout** | Spinal-safe weekly split (no axial loading) — dumbbells & barbells at home |
| 🏃 **Cardio** | Phase-based cardio plan with heart rate zones |
| 📈 **Progress** | Weight loss chart (Chart.js), streak tracker, BMI gauge, milestone badges |
| 🛡️ **Guidelines** | Clinical guardrails for hypothyroid, fatty liver & mechanical lower back pain |

---

## 🏗️ Tech Stack

- **Backend:** Node.js + Express
- **Database:** MongoDB (Mongoose ODM) — MongoDB Atlas M0 free tier
- **Frontend:** Vanilla HTML5 / CSS3 / JavaScript (single-page app)
- **Charts:** Chart.js
- **Fonts:** Google Fonts (Inter)

---

## 🚀 Local Setup

```bash
# 1. Clone
git clone https://github.com/karthikchary2606/health-dashboard.git
cd health-dashboard

# 2. Install dependencies
npm install

# 3. Set environment variable
# Copy .env.example → .env and fill in your MongoDB URI
cp .env.example .env

# 4. Start
npm start
# → http://localhost:3000
```

---

## ⚙️ Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `PORT` | Server port (default: 3000) |

See `.env.example` for the template.

---

## 🏥 Clinical Guardrails

- **Thyronorm 12.5mg** — taken 06:30 AM on empty stomach (45-min food gap)
- **Zero soy/soya** — blocks thyroid hormone synthesis
- **Cruciferous veggies cooked only** — deactivates goitrogens
- **Zero refined sugar/jaggery** — fatty liver reversal protocol
- **No axial spinal loading** — mechanical LBP protection (no heavy deadlifts/squats)
- **Seed & nut allotment** — strict 30g/day combined cap

---

## 📁 Project Structure

```
health-dashboard/
├── server.js          # Express server + MongoDB API endpoints
├── package.json
├── .env.example       # Environment variable template
├── .replit            # Replit deployment config
├── railway.toml       # Railway deployment config
└── public/
    └── index.html     # Complete single-page frontend app
```

---

## 🌐 Deployment

Deployed on **Replit** (free tier) with **MongoDB Atlas M0** (free).

> Keep the app awake 24/7 with a free [UptimeRobot](https://uptimerobot.com) monitor pinging every 5 minutes.
