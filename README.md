# DIR-12 Compliance Portal

A web-based corporate compliance portal for filing **DIR-12 forms** — the statutory form required by Indian companies to notify the Ministry of Corporate Affairs (MCA) about changes in company directors and Key Managerial Personnel (KMP).

Built for **Technowire Data Science** as part of a freelance contract (Apr 2026 – Sep 2026).

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the App](#running-the-app)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Screenshots](#screenshots)
- [License](#license)

---

## Overview

DIR-12 is a mandatory statutory filing under the Companies Act, 2013. Companies must file this form with the MCA within 30 days whenever a director or KMP is appointed, resigned, or removed. Non-compliance attracts significant penalties.

This portal replaces error-prone manual filing by guiding compliance officers through a structured 6-step form wizard, validating data against MCA business rules in real time, integrating with MCA APIs for CIN/DIN lookups, and generating submission-ready PDF reports for audit records.

---

## Features

### Filing Workflow
- **6-step guided form wizard** — Company details → Outgoing director → Incoming director → DIN verification → Digital signature → Review & submit
- Real-time field validation against MCA business rules at every step
- Contextual help text to prevent common filing errors
- Save-and-resume — incomplete filings are auto-saved and can be resumed later
- Multi-company support — manage filings across multiple client companies from one account

### MCA Integration
- Live **CIN lookup** — auto-fill company name, registered address, and incorporation date
- **DIN validation** — verify Director Identification Numbers against MCA registry
- Form submission via MCA API with acknowledgement number tracking
- Submission status polling with real-time updates

### Document Generation
- Auto-generated **PDF reports** for every completed filing with full submission details
- Downloadable filing history with timestamp, status, and reference numbers
- Audit-ready document trail for each submission

### Admin Dashboard
- Review and manage pending submissions across all client companies
- Approve, reject, or request corrections on submissions with inline comments
- Submission status board: Draft → Pending Review → Submitted → Acknowledged
- Role-based access: Super Admin, Compliance Manager, Filing Officer

### Security & Audit
- Full **audit log** — every action (view, edit, submit, approve) is recorded with user, timestamp, and IP
- Role-based access control (RBAC) with JWT authentication
- Email notifications at key workflow stages (submission received, approved, MCA acknowledged)
- Session management with secure token refresh

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, TailwindCSS |
| Backend | Node.js, Express |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT (JSON Web Tokens) |
| PDF Generation | Puppeteer / PDFKit |
| Email | Nodemailer |
| Deployment | Docker, Nginx |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      React Frontend                      │
│         6-Step Wizard · Dashboard · PDF Viewer          │
└────────────────────────┬────────────────────────────────┘
                         │ REST API (JWT)
┌────────────────────────▼────────────────────────────────┐
│                    Express Backend                       │
│       Auth · Filing · MCA Integration · PDF · Email     │
└──────┬─────────────────┬──────────────────┬─────────────┘
       │                 │                  │
┌──────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
│ PostgreSQL  │  │  MCA API     │  │  File Storage │
│  (Prisma)   │  │  (CIN/DIN)   │  │  (PDFs/Docs)  │
└─────────────┘  └──────────────┘  └───────────────┘
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Clone the Repository

```bash
git clone https://github.com/Aayush-Ramrakhyani/dir12-compliance-portal.git
cd dir12-compliance-portal
```

### Install Dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

---

## Environment Variables

Create a `.env` file in the `/server` directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dir12_db

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# MCA API
MCA_API_BASE_URL=https://api.mca.gov.in
MCA_API_KEY=your_mca_api_key

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# File Storage
UPLOAD_DIR=./uploads
PDF_OUTPUT_DIR=./pdfs
```

---

## Database Setup

```bash
cd server

# Run Prisma migrations
npx prisma migrate dev --name init

# Seed initial admin user
npx prisma db seed
```

---

## Running the App

### Development

```bash
# Start backend (from /server)
npm run dev

# Start frontend (from /client)
npm run dev
```

Backend runs on `http://localhost:5000`
Frontend runs on `http://localhost:5173`

### Production (Docker)

```bash
docker-compose up --build
```

---

## Project Structure

```
dir12-compliance-portal/
├── client/                   # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── wizard/       # 6-step form wizard steps
│   │   │   ├── dashboard/    # Admin dashboard components
│   │   │   └── shared/       # Reusable UI components
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/         # API call functions
│   │   └── types/            # TypeScript interfaces
│   └── package.json
│
├── server/                   # Express backend
│   ├── src/
│   │   ├── routes/           # API route definitions
│   │   ├── controllers/      # Request handlers
│   │   ├── services/         # Business logic
│   │   │   ├── mca.service.ts
│   │   │   ├── pdf.service.ts
│   │   │   └── email.service.ts
│   │   ├── middleware/       # Auth, validation, audit logging
│   │   └── utils/
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.ts
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login and receive JWT |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Invalidate session |

### Filings
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/filings` | List all filings |
| POST | `/api/filings` | Create new filing |
| GET | `/api/filings/:id` | Get filing by ID |
| PUT | `/api/filings/:id` | Update filing (step data) |
| POST | `/api/filings/:id/submit` | Submit filing to MCA |
| GET | `/api/filings/:id/pdf` | Download PDF report |

### MCA Integration
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/mca/company/:cin` | Lookup company by CIN |
| GET | `/api/mca/director/:din` | Validate DIN |
| GET | `/api/filings/:id/status` | Poll MCA submission status |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/filings` | All filings across companies |
| POST | `/api/admin/filings/:id/approve` | Approve filing |
| POST | `/api/admin/filings/:id/reject` | Reject with comments |
| GET | `/api/admin/audit-log` | Full audit trail |

---

## Screenshots

> Add screenshots of the following:
> - Step 1 of the form wizard (Company Details)
> - Admin Dashboard (Submission Status Board)
> - Generated PDF Report
> - Audit Log view

---

## License

This project was built under a freelance contract for **Technowire Data Science**.
All rights reserved. Not open for redistribution.
