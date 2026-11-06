# Job Portal (CareerNest)

Full-stack MERN job portal with three roles: **Admin**, **Recruiter** and **Applicant**.

## Start

1. Copy `backend/.env.example` and `frontend/.env.example` to `.env` in their folders and fill in your values
   (MongoDB URI, JWT secret, Cloudinary credentials).
2. Run `npm install` in both `frontend` and `backend`.
3. Run `npm run dev` in each folder (API on `:5000`, app on `:5173`).

## Screens

| Route | Who | What |
| --- | --- | --- |
| `/jobs` | everyone | Browse and search open roles |
| `/jobs/:id` | everyone | Job detail page; applicants can apply with a cover letter + résumé |
| `/dashboard` | signed in | Recruiters: post a role + view job submissions |
| `/dashboard/jobs/:id/edit` | recruiter | Edit a job post |
| `/profile` | signed in | Update name, email and profile image |

## API

| Method & path | Access | Purpose |
| --- | --- | --- |
| `GET /api/jobs` | public | List open jobs (`keyword`, `location`, `employmentType`) |
| `GET /api/jobs/:id` | public | Job detail |
| `GET /api/jobs/mine` | recruiter/admin | Jobs you posted |
| `GET /api/jobs/mine/:id` | recruiter/admin | One of your jobs (used by the edit screen) |
| `POST /api/jobs` | recruiter/admin | Publish a job |
| `PATCH /api/jobs/:id` | owner/admin | Edit a job (including `status: open/closed`) |
| `DELETE /api/jobs/:id` | owner/admin | Delete a job |
| `POST /api/applications` | applicant | Apply (multipart: `jobId`, `coverLetter`, `resume` PDF/DOC/DOCX ≤ 5 MB) |
| `GET /api/applications?jobId=` | signed in | Your applications, or applicants for your job |
| `PATCH /api/applications/:id/status` | owner/admin | Update an application's status |
| `PATCH /api/auth/profile` | signed in | Update profile (multipart: `name`, `email`, `avatar` JPG/PNG/WEBP ≤ 2 MB) |
