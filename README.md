# IIITApfolio – AI-Driven Campus Placement Automation System

<p align="center">
  <img src="assets/images/IIITA_Logo.png" alt="IIITA Logo" width="80"/>
</p>

<p align="center">
  <strong>A comprehensive student portfolio management and placement automation platform built for IIIT Allahabad.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v14+-green" alt="Node.js"/>
  <img src="https://img.shields.io/badge/MySQL-8.0-blue" alt="MySQL"/>
  <img src="https://img.shields.io/badge/Express-4.x-lightgrey" alt="Express"/>
  <img src="https://img.shields.io/badge/AI-Gemini%202.5-orange" alt="Gemini AI"/>
  <img src="https://img.shields.io/badge/Template-EJS-yellow" alt="EJS"/>
</p>

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [Module Breakdown](#module-breakdown)
  - [Student Module](#1-student-module)
  - [Admin Module](#2-admin-module)
  - [Placement Module](#3-placement-module)
  - [AI Resume Analyzer](#4-ai-resume-analyzer)
  - [Verification System](#5-verification--change-request-system)
  - [Notification System](#6-notification-system)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Seed Data](#seed-data)
- [API Routes](#api-routes)
- [Screenshots](#screenshots)
- [Security Features](#security-features)
- [Future Enhancements](#future-enhancements)
- [Contributors](#contributors)

---

## Overview

**IIITApfolio** is a full-stack, AI-powered campus placement automation system designed for **IIIT Allahabad**. It replaces the traditional, manual placement process where students fill repetitive forms for every company and placement cell (P-Cell) members manually verify and shortlist candidates.

The system provides a unified platform where:
- Students maintain a single verified portfolio (academic + non-academic + skills)
- Admins (P-Cell) manage companies, drives, and verify student data with document proof
- Companies can shortlist candidates instantly based on CGPA, backlogs, branch filters
- AI-powered resume analysis helps students optimize resumes per drive/role

---

## Problem Statement

During campus placements at IIIT Allahabad:

1. **Students** have to fill the same personal, academic, and project details repeatedly for every company that visits campus.
2. **P-Cell members** manually verify student details (CGPA, backlogs, projects) against records — a tedious and error-prone process.
3. **Companies** shortlist candidates based on criteria (min CGPA, branch, max backlogs) — P-Cell has to do this filtering manually for each drive.
4. **No centralized system** exists to track application status, placement statistics, or provide resume guidance.

---

## Solution

IIITApfolio automates the entire placement lifecycle:

| Traditional Process | IIITApfolio |
|---|---|
| Students fill forms repeatedly | Fill once, apply to any drive with one click |
| P-Cell manually verifies data | Admin verification with document proof workflow |
| Manual CGPA/branch filtering | Automatic eligibility checks per drive |
| No resume feedback | AI-powered resume analyzer tailored per role |
| Scattered communication | Real-time notifications + email alerts |
| No analytics | Full dashboard with branch stats, CGPA distribution, placement rates |

---

## Key Features

### For Students
- **Portfolio Management** – Maintain personal info, academic records, non-academic achievements, skills, projects, internships, coding profiles
- **One-Click Apply** – Apply to eligible placement drives instantly
- **Eligibility Check** – Automatic CGPA, branch, and backlog verification before application
- **AI Resume Analyzer** – Upload resume PDF and get role-specific AI feedback (Gemini 2.5) with automatic local fallback
- **Application Tracking** – View status (applied → shortlisted → selected/rejected) for all drives
- **Change Request System** – Edit verified details by submitting proof; admin approves/rejects
- **Real-Time Notifications** – In-app + email notifications for application status changes
- **Request History** – Track all past change requests with admin remarks

### For Admin (P-Cell)
- **Rich Dashboard** – Overview cards, charts (Chart.js) for branch stats, CGPA distribution, placement rates
- **Company Management** – Add, edit, delete recruiting companies
- **Drive Management** – Create placement drives with role, package, eligibility criteria, dates, status
- **Student Filtering** – Filter students by min CGPA, max backlogs, branch with real-time results
- **Applicant Management** – View applicants per drive, update status (shortlisted/selected/rejected)
- **Verification Workflow** – Review change requests with diff view (current vs proposed data)
- **Bulk Analytics** – Branch-wise placement stats, CGPA distribution, drive status breakdown
- **Email Notifications** – Auto-send emails when approving/rejecting requests or updating application status

### AI-Powered Features
- **Gemini 2.5 Flash Lite Integration** – Contextual resume analysis with role, company, and eligibility info
- **Smart Fallback** – If Gemini quota exceeds or times out (12s), seamlessly falls back to rule-based local analysis
- **Role-Specific Keywords** – Different keyword sets for Frontend, Backend, Full Stack, ML, Data, DevOps, Security roles
- **Scoring System** – 0-100 role fit score with strengths, missing keywords, improvements, quick fixes
- **PDF Parsing** – Extracts text from uploaded PDF resumes (up to 2MB)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│   Landing Page │ Student Dashboard │ Admin Dashboard │ Forms     │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP / HTTPS
┌──────────────────────────────▼──────────────────────────────────┐
│                      EXPRESS.JS SERVER (Node.js)                  │
│                                                                   │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌───────────────┐   │
│  │  Auth    │  │  Student  │  │  Admin   │  │  Placements   │   │
│  │  Module  │  │  Routes   │  │  Routes  │  │  & Drives     │   │
│  └──────────┘  └───────────┘  └──────────┘  └───────────────┘   │
│                                                                   │
│  ┌──────────────┐  ┌─────────────────┐  ┌────────────────────┐  │
│  │  Change      │  │  Notification   │  │  Resume Analyzer   │  │
│  │  Requests    │  │  System         │  │  (Gemini + Local)  │  │
│  └──────────────┘  └─────────────────┘  └────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
   ┌────────▼────────┐  ┌─────▼──────┐  ┌───────▼───────┐
   │    MySQL DB      │  │  Gmail     │  │  Gemini API   │
   │  (12 tables)     │  │  SMTP      │  │  (Google AI)  │
   │  Sessions Store  │  │  (Email)   │  │               │
   └──────────────────┘  └────────────┘  └───────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express.js 4.x |
| **Frontend** | EJS Templates, CSS3 (custom), JavaScript |
| **Database** | MySQL 8.0 with mysql2 driver |
| **Authentication** | bcryptjs (password hashing), express-session, express-mysql-session |
| **AI/ML** | Google Gemini 2.5 Flash Lite API + Local rule-based fallback |
| **PDF Parsing** | pdf-parse (text extraction from resume PDFs) |
| **File Upload** | Multer (memory storage, PDF only, 2MB limit) |
| **Email** | Nodemailer with Gmail SMTP |
| **Session** | UUID-based sessions stored in MySQL |
| **Charts** | Chart.js 4.x (admin dashboard analytics) |
| **Icons** | Unicons (Iconscout) |
| **Fonts** | Inter (Google Fonts) |

---

## Database Schema

The system uses **12 MySQL tables** with proper foreign key constraints and cascade deletes:

```
┌─────────────────────┐       ┌─────────────────────┐
│ student_credentials │◄──────│    student_basic     │
│  - email (PK)      │       │  - email (PK/FK)    │
│  - UserName         │       │  - name, branch     │
│  - Password (hash)  │       │  - phone, address   │
└─────────┬───────────┘       │  - linkedin, github │
          │                   └─────────────────────┘
          │
          ├──────────┬──────────────┬────────────────┐
          ▼          ▼              ▼                ▼
┌──────────────┐ ┌────────┐ ┌──────────────┐ ┌──────────────────┐
│academic_detls│ │ skills │ │non_acad_detls│ │ change_requests  │
│- cur_cgpa    │ │- one   │ │- p1-p4 (proj)│ │- proposed_data   │
│- backlogs    │ │- two   │ │- i1-i2 (int) │ │- reason          │
│- C1-C4       │ │- three │ │- cp1-cp2     │ │- doc_link        │
│- aw1-aw3     │ │- four  │ │- cpa1-cpa3   │ │- status          │
│- pap1-pap3   │ │- five  │ │- ha1-ha2     │ │- admin_remarks   │
└──────────────┘ └────────┘ │- cca1-cca5   │ └──────────────────┘
                            └──────────────┘
┌────────────────────┐      ┌──────────────────┐
│ admin_credentials  │      │   notifications  │
│  - email (PK)      │      │  - recipient     │
│  - Password        │      │  - type          │
│  - Securityq       │      │  - title/message │
└────────────────────┘      │  - is_read       │
                            └──────────────────┘
┌─────────────┐    ┌──────────────────┐    ┌──────────────┐
│  companies  │◄───│ placement_drives │◄───│ applications │
│  - id (PK)  │    │  - id (PK)       │    │  - id (PK)   │
│  - name     │    │  - company_id(FK)│    │  - drive_id  │
│  - website  │    │  - role          │    │  - email     │
│  - desc     │    │  - package_lpa   │    │  - status    │
└─────────────┘    │  - min_cgpa      │    └──────────────┘
                   │  - max_backlogs  │
                   │  - branches      │    ┌──────────────┐
                   │  - drive_date    │    │    review    │
                   │  - status        │    │  - name      │
                   └──────────────────┘    │  - review    │
                                           └──────────────┘
```

### Table Details

| Table | Purpose |
|---|---|
| `student_credentials` | Login credentials (email + bcrypt hashed password) |
| `student_basic` | Core profile info (name, branch, semester, 10th/12th marks, links) |
| `academic_details` | CGPA, backlogs, courses (C1-C4), awards (aw1-aw3), papers (pap1-pap3) |
| `non_academic_details` | Projects (p1-p4), internships (i1-i2), coding profiles, hackathons, co-curriculars |
| `skills` | Top 5 skills |
| `admin_credentials` | Admin login with security question for password recovery |
| `change_requests` | Verification workflow – stores proposed JSON, reason, doc link, status |
| `notifications` | In-app notifications for students and admin |
| `companies` | Recruiting company master data |
| `placement_drives` | Drive details – role, package, eligibility, dates, status |
| `applications` | Student applications to drives (unique per student+drive) |
| `review` | Public review/testimonials |

---

## Module Breakdown

### 1. Student Module

**Registration & Auth:**
- Sign up with `@iiita.ac.in` email only (domain validation)
- Password hashed with bcrypt (8 rounds)
- Session-based authentication stored in MySQL
- Forgot password – generates temp password, emails it
- Change password from dashboard

**Portfolio Sections:**
- **Basic Details** – Name, role/designation, about me, phone, address, semester, branch, 10th/12th marks, LinkedIn, GitHub
- **Academic Details** – Current CGPA, backlogs, 4 courses, 3 awards, 3 papers
- **Non-Academic Details** – 4 projects (name/tech/link), 2 coding profiles, 3 competitive achievements, 2 hackathons, 5 co-curricular activities, 2 internships (company/duration/role)
- **Skills** – Top 5 technical skills

**Profile Search:**
- Public search by email from landing page
- Renders full portfolio view (read-only for searchers)

### 2. Admin Module

**Dashboard Overview:**
- Total students, placed students count
- Branch-wise student distribution with avg CGPA
- Branch-wise placement rates
- CGPA distribution chart (9-10, 8-9, 7-8, 6-7, Below 6)
- Drive status breakdown (upcoming, active, completed, cancelled)
- Placed students list with company/role/package details

**Management Sections:**
- **Companies** – CRUD operations for recruiting companies
- **Drives** – Create/manage placement drives with full eligibility criteria
- **Students** – Filter and view all students with CGPA/branch/backlog filters
- **Change Requests** – Review, approve (apply changes), or reject (with remarks)
- **Reviews** – View public testimonials

### 3. Placement Module

**Student Side:**
- View all active/upcoming drives with company info
- See eligibility status per drive (eligible/not eligible/already applied)
- One-click apply with automatic eligibility verification:
  - Branch check against eligible branches
  - CGPA check against minimum required
  - Backlog check against maximum allowed
  - Drive status must be "active"
- Application tracking (applied → shortlisted → selected/rejected)
- Search and filter drives by company, role, package, eligibility

**Admin Side:**
- Create drives: company, role, package, description, min CGPA, max backlogs, eligible branches, dates, status
- Update drive status (upcoming → active → completed/cancelled)
- View applicants per drive sorted by CGPA
- Update individual applicant status (shortlisted/selected/rejected)
- Auto-email students on status change
- Delete drives

### 4. AI Resume Analyzer

**How It Works:**
1. Student uploads resume PDF (max 2MB, PDF only) for a specific active drive
2. PDF text is extracted using `pdf-parse`
3. System attempts **Gemini 2.5 Flash Lite API** with a detailed prompt including:
   - Role, company, package info
   - Eligibility criteria
   - Student's branch and CGPA
   - Full resume text
4. If Gemini responds within 12 seconds with valid JSON → uses AI response
5. If quota exceeded / timeout / error → falls back to **local rule-based analysis**

**Gemini AI Analysis Output:**
- **Score** (0-100): Role fit score
- **Summary**: 2-3 sentence overall assessment
- **Strengths**: Up to 5 specific strengths identified
- **Missing Keywords**: Up to 6 keywords missing for the target role
- **Improvements**: Up to 5 actionable suggestions
- **Role Fit Notes**: Up to 4 notes on company/role alignment
- **Quick Fixes**: Up to 5 formatting/ATS tips

**Local Fallback Analysis:**
Rule-based scoring checking for:
- Projects presence (+10)
- Internship/experience (+8)
- Skills section (+8)
- Profile links (GitHub, LinkedIn, LeetCode) (+7)
- Quantifiable metrics (+10)
- Action verbs usage (+7)
- Role-specific keyword matching (up to +15)

**Role-Specific Keyword Sets:**
| Role Category | Keywords Checked |
|---|---|
| Frontend | HTML, CSS, JavaScript, React, Responsive Design, API Integration, Accessibility |
| Backend | Node.js, Express, REST API, SQL, MongoDB, Authentication, Caching, System Design |
| Full Stack | React, Node.js, Express, REST API, Database, Authentication, Deployment |
| Data Science | Python, SQL, Pandas, NumPy, Visualization, Statistics, Machine Learning |
| ML/AI | Python, ML, Deep Learning, TensorFlow, PyTorch, Data Preprocessing, Model Evaluation |
| DevOps | Linux, Docker, CI/CD, AWS, Kubernetes, Monitoring, Shell Scripting |
| Security | Network Security, OWASP, Cryptography, Linux, Burp Suite, Vulnerability Assessment |

### 5. Verification & Change Request System

**Workflow:**
1. Student edits academic or non-academic details
2. Must provide a **reason** and optionally a **document/proof link** (e.g., marksheet, certificate)
3. Changes are NOT applied directly – stored as `proposed_data` (JSON) in `change_requests` table
4. Admin receives notification about new request
5. Admin views **diff** (current data vs proposed changes) on review page
6. Admin **approves** (changes applied to actual table) or **rejects** (with remarks)
7. Student receives in-app notification + email about decision
8. Full history maintained with timestamps

**Why This Matters:**
- Prevents fake CGPA/backlog claims
- Ensures data integrity for placement eligibility
- Provides audit trail for P-Cell

### 6. Notification System

**Features:**
- Real-time notification bell in navbar (student + admin)
- Unread count badge
- Mark individual or all as read
- Types: `new_request`, `approved`, `rejected`, application status updates
- Persistent (stored in DB)
- Email notifications via Gmail SMTP for critical events

---

## Project Structure

```
IIITA-Pfollio-main/
├── server.js                    # Main application file (all routes + logic)
├── package.json                 # Dependencies and scripts
├── .env                         # Environment variables (not committed)
├── _portfolio_.sql              # Complete database schema + seed data
├── README.md                    # This file
│
├── assets/
│   ├── images/                  # Static images (logos, SVGs, backgrounds)
│   │   ├── IIITA_Logo.png
│   │   ├── Group63.svg          # Hero illustration
│   │   ├── bg.png, bg4.jpg     # Background images
│   │   ├── img1.svg, img2.svg  # Auth page illustrations
│   │   └── profile.jpg         # Default avatar
│   │
│   └── styles/                  # CSS and client-side JS
│       ├── style.css            # Landing page styles
│       ├── home.css             # Student dashboard
│       ├── admind.css           # Admin dashboard layout
│       ├── admind.js            # Admin dashboard interactivity
│       ├── admin_manage.css     # Admin management pages
│       ├── placements.css       # Placement drives page
│       ├── resume_analysis.css  # AI resume analysis results page
│       ├── sb.css               # Form pages (basic, academic, non-academic)
│       ├── sb.js                # Form page interactivity
│       ├── signstudent.css      # Auth pages (login/register)
│       ├── signstudent.js       # Auth form validation
│       ├── notifications.css    # Notification dropdown styles
│       ├── notifications.js     # Notification polling and UI logic
│       ├── review.css           # Public review page
│       ├── validate.css         # Validation styling
│       ├── error.css            # Error page
│       └── success.css          # Success page
│
├── views/                       # EJS templates
│   ├── index.ejs                # Landing page (hero + search)
│   ├── register.ejs             # Student login/signup
│   ├── registeradmin.ejs        # Admin login/signup
│   ├── home.ejs                 # Student dashboard (portfolio view)
│   ├── admind.ejs               # Admin dashboard (analytics + management)
│   ├── sbdetails.ejs            # Basic details form
│   ├── academic_details.ejs     # Academic details form (with verification)
│   ├── non_academic.ejs         # Non-academic details form (with verification)
│   ├── skills.ejs               # Skills form
│   ├── placements.ejs           # Student placement drives view
│   ├── resume_analysis.ejs      # AI resume analysis results
│   ├── my_requests.ejs          # Student's change request history
│   ├── admin_review.ejs         # Admin: list all change requests
│   ├── admin_review_detail.ejs  # Admin: diff view for single request
│   ├── admin_companies.ejs      # Admin: company management
│   ├── admin_drives.ejs         # Admin: drive management
│   ├── admin_applicants.ejs     # Admin: applicants per drive
│   ├── admin_students.ejs       # Admin: student filtering/analytics
│   ├── fpass.ejs                # Student forgot password
│   ├── adminfpass.ejs           # Admin forgot password
│   ├── cpass.ejs                # Change password
│   ├── review.ejs               # Public review submission
│   ├── error.ejs                # Error message page
│   ├── success.ejs              # Success message page
│   └── nav.ejs                  # Legacy navbar (partial)
│
└── ss/                          # Screenshots for documentation
    ├── Screenshot (60).png
    ├── Screenshot (62).png
    ├── Screenshot (63).png
    ├── Screenshot (69).png
    └── mail.png
```

---

## Installation & Setup

### Prerequisites
- **Node.js** v14 or higher
- **MySQL** 8.0 or higher
- **Gmail Account** (for SMTP email – enable App Passwords)
- **Google AI API Key** (for Gemini – get from [aistudio.google.com](https://aistudio.google.com))

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-username/IIITA-Pfollio.git
cd IIITA-Pfollio

# 2. Install dependencies
npm install

# 3. Create MySQL database
mysql -u root -p -e "CREATE DATABASE portfolio;"

# 4. Import schema and seed data
mysql -u root -p portfolio < _portfolio_.sql

# 5. Create .env file (see Environment Variables below)
cp .env.example .env
# Edit .env with your credentials

# 6. Start the server
npm start
# or for development with auto-reload:
npx nodemon server.js
```

The server will start on **http://localhost:3000**

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Database
DB=portfolio
host=localhost
user=root
password=your_mysql_password

# Email (Gmail SMTP)
authemail=your_gmail@gmail.com
authepass=your_gmail_app_password

# Session
secret=MYSECRET

# AI Resume Analyzer
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash-lite
```

> **Note:** For Gmail, you need to enable 2FA and create an App Password at https://myaccount.google.com/apppasswords

---

## Seed Data

The SQL file includes pre-loaded test data for immediate testing:

| Data | Details |
|---|---|
| **Admin** | `iec2022116@iiita.ac.in` / `Karthik@2004` |
| **5 ECE Students** | `iec2022001` to `iec2022005` / password: `12345678` |
| **5 IT Students** | `iit2022001` to `iit2022005` / password: `12345678` |
| **2 IT-BI Students** | `iib2022001` to `iib2022002` / password: `12345678` |
| **5 Companies** | Google, Microsoft, Texas Instruments, Flipkart, ISRO |
| **5 Placement Drives** | Various roles with different eligibility criteria |
| **4 Reviews** | Sample testimonials |

All students have complete profiles with academic details, projects, skills, internships, and coding profiles.

---

## API Routes

### Public Routes
| Method | Route | Description |
|---|---|---|
| GET | `/` | Landing page |
| POST | `/search` | Search student portfolio by email |
| GET | `/review` | Review submission page |
| POST | `/review` | Submit a review |

### Authentication
| Method | Route | Description |
|---|---|---|
| GET | `/signup` | Student login/register page |
| POST | `/signup` | Register new student |
| POST | `/signin` | Student login |
| GET | `/logout` | Destroy student session |
| GET | `/forgotpass` | Forgot password page |
| POST | `/fpass` | Send temp password via email |
| GET | `/cpass` | Change password page |
| POST | `/cpass` | Update password |
| GET | `/adminsignup` | Admin login page |
| POST | `/adminsignin` | Admin login |
| GET | `/alogout` | Destroy admin session |
| GET | `/aforgotpass` | Admin forgot password |
| POST | `/adminfpass` | Admin password reset (security Q) |

### Student Routes (Auth Required)
| Method | Route | Description |
|---|---|---|
| GET | `/home` | Student dashboard |
| GET | `/sb` | Basic details form |
| POST | `/sb` | Save/update basic details |
| GET | `/acad` | Academic details form |
| POST | `/acad` | Submit academic change request |
| GET | `/nacad` | Non-academic details form |
| POST | `/nacad` | Submit non-academic change request |
| GET | `/skills` | Skills form |
| POST | `/skills` | Save skills |
| GET | `/placements` | View placement drives |
| POST | `/apply` | Apply to a drive |
| POST | `/resume-analyzer` | AI resume analysis (file upload) |
| GET | `/my-requests` | View change request history |
| GET | `/du` | Delete user account |
| GET | `/reseta` | Reset academic details |
| GET | `/resetna` | Reset non-academic details |

### Admin Routes (Auth Required)
| Method | Route | Description |
|---|---|---|
| GET | `/adminlog` | Admin dashboard |
| GET | `/admin/review` | View change requests (filterable) |
| GET | `/admin/review/:id` | View single request diff |
| POST | `/valid` | Approve a change request |
| POST | `/decline` | Reject a change request |
| GET | `/admin/companies` | Company management page |
| POST | `/admin/companies` | Add new company |
| POST | `/admin/companies/delete` | Delete company |
| GET | `/admin/drives` | Drive management page |
| POST | `/admin/drives` | Create new drive |
| POST | `/admin/drives/status` | Update drive status |
| POST | `/admin/drives/delete` | Delete drive |
| GET | `/admin/drives/:id/applicants` | View drive applicants |
| POST | `/admin/applicant/status` | Update applicant status |
| GET | `/admin/students` | Student filtering & analytics |

### Notification API
| Method | Route | Description |
|---|---|---|
| GET | `/notifications` | Fetch notifications (JSON) |
| POST | `/notifications/read` | Mark notification as read |
| POST | `/notifications/read-all` | Mark all as read |

---

## Screenshots

| Page | Screenshot |
|---|---|
| Landing Page | ![Landing](ss/Screenshot%20(60).png) |
| Student Dashboard | ![Dashboard](ss/Screenshot%20(62).png) |
| Admin Dashboard | ![Admin](ss/Screenshot%20(63).png) |
| Placement Drives | ![Placements](ss/Screenshot%20(69).png) |
| Email Notification | ![Mail](ss/mail.png) |

---

## Security Features

- **Password Hashing** – bcryptjs with 8 salt rounds
- **Session Security** – UUID-based session IDs, no client-side storage of credentials
- **Domain Restriction** – Only `@iiita.ac.in` emails can register
- **Route Protection** – Middleware guards (`redirectULogin`, `redirectALogin`) on all protected routes
- **Cache Prevention** – `no-store, no-cache` headers prevent back-button data leakage
- **File Upload Validation** – PDF only, 2MB limit, memory storage (no disk write)
- **SQL Injection Prevention** – Parameterized queries with `?` placeholders throughout
- **Session Store** – Server-side MySQL session storage (not cookies)
- **Input Validation** – Server-side checks on all form submissions
- **Cascading Deletes** – FK constraints ensure no orphaned data

---

## Future Enhancements

- [ ] Student profile photo upload
- [ ] Resume builder (generate PDF from portfolio data)
- [ ] Company login portal for direct shortlisting
- [ ] Batch email to all eligible students when new drive is created
- [ ] Interview scheduling module
- [ ] Offer letter tracking
- [ ] Alumni network integration
- [ ] Mobile responsive PWA
- [ ] Export placement statistics as PDF reports
- [ ] Multi-college support (SaaS model)

---

## Contributors

| Name | Role | Email |
|---|---|---|
| Karthik Reddy | Developer | iec2022116@iiita.ac.in |

---

## License

This project is developed as a **Major Project** for IIIT Allahabad.

---

<p align="center">
  <strong>Built with ❤️ at IIIT Allahabad</strong>
</p>
