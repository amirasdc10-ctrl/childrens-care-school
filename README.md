# Children's Care School

A premium, front-end-only school website in plain HTML, CSS and vanilla JavaScript. No build step, no frameworks, no external images. Light and dark themes, role-based login UI, courses, enrolment, attendance and a dashboard, all driven by mock data.

## Folder structure
```
childrens-care-school/
  *.html            index, about, courses, enrollment, attendance, dashboard, login, contact
  assets/css/       variables, base, components, pages
  assets/js/        data (config, mock data, Store, Api stubs), main (shared utils), theme, nav (navbar + footer),
                    courses, enrollment, attendance, dashboard
  assets/img/       logo.svg, favicon.svg
```

## Run locally
Open `index.html` in a browser. Or serve the folder: `python3 -m http.server 8000` and visit http://localhost:8000.

## Change the name, tagline, contact details
Edit `CONFIG` at the top of `assets/js/data.js`.

## Deploy on GitHub Pages
Push to GitHub, then Settings → Pages → Deploy from a branch → `main` / root. All paths are relative.

## API endpoints
`GET /students`, `GET /courses`, `GET/PUT /enrollments`, `GET/POST /attendance`, `POST /enquiries`, `POST /auth/login`.
Data is stored in `localStorage` (keys prefixed `ccs:`) with an in-memory fallback if storage is blocked.

## Backend (Node.js, zero dependencies)
```
backend/
  server.js            HTTP server: /api routes + serves the website
  package.json  .env.example
  src/config.js  util.js  auth.js  seed.js  db.js  access.js
  src/routes/          students, courses, enrollments, attendance, dashboard, auth, enquiries
  test/smoke.js        end-to-end test (npm test)
```
Run: `cd backend && npm start` then open http://localhost:3000 (Node 18+, no `npm install` needed).
Optional: copy `.env.example` to `.env` and set `JWT_SECRET`.

Demo accounts (change before going live): admin@childrenscare.example / Admin@123, teacher@… / Teacher@123, student@… / Student@123, parent@… / Parent@123.

Rules: courses and enquiry form are public. Everything else needs login. Attendance writes and the dashboard are admin/teacher only. Students and parents only see their own children. Enquiries can be read by admin only (`GET /api/enquiries`).

**Two modes:** if the backend answers, the site uses it. If not (GitHub Pages, double-click on index.html), it falls back to demo mode with localStorage. To use a hosted backend from GitHub Pages, set `CONFIG.apiBase` in `assets/js/data.js` and `CORS_ORIGIN` in the backend.

Data lives in `backend/data/db.json` (git-ignored). For large-scale production, replace only `src/db.js` with PostgreSQL/MongoDB.

## Known limits
Fonts load from Google Fonts with system fallbacks, so the site still renders offline.

## License
MIT
