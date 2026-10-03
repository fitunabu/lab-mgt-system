# Computer Laboratory Monitoring and Reservation System

A Next.js-based computer laboratory monitoring and reservation platform for educational institutions. The system supports role-based access for administrators, technical assistants, and teachers.

## Features

- Role-based authentication and route protection
- Laboratory request creation and approval workflow
- Reservation conflict detection
- Session lifecycle tracking
- Equipment reporting and inspection workflows
- Audit logging and notifications
- Prisma + PostgreSQL data layer
- Responsive dashboards and forms

## Tech Stack

- Next.js 16
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- NextAuth.js
- Zod + React Hook Form
- Recharts
- Radix UI

## Requirements

- Node.js 20+
- PostgreSQL database
- npm

## Installation

```bash
npm install
```

## Environment variables

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Example:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lab_management?schema=public"
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="your-secret"
NEXTAUTH_SECRET="your-secret"
```

## Database setup

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

## Run the application

```bash
npm run dev
```

Open http://localhost:3000

## Default development accounts

- admin@example.com / Password123!
- assistant1@example.com / Password123!
- assistant2@example.com / Password123!
- teacher1@example.com / Password123!
- teacher2@example.com / Password123!
- teacher3@example.com / Password123!

## Project structure

- app/ - routes and pages
- components/ - UI and reusable components
- lib/ - auth, Prisma, utilities, validation, actions
- prisma/ - Prisma schema and seeding logic

## Deployment

Deploy the app to a platform such as Vercel or a Node.js server. Ensure that PostgreSQL credentials and auth secrets are defined in the runtime environment.
