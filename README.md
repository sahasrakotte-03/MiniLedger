# MiniLedger — Full-Stack Loan Tracking Mobile Application

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.88-61DAFB.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo%20SDK-58-black.svg)](https://expo.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1.svg)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma%20ORM-5.22-2D3748.svg)](https://www.prisma.io/)
[![Vitest](https://img.shields.io/badge/Vitest-Automated%20Tests-FCC72B.svg)](https://vitest.dev/)

**MiniLedger** is a full-stack, production-quality mobile application engineered to help individuals track money lent to friends with total clarity. Built for the Full-Stack Internship Assignment, it features end-to-end type safety, real PostgreSQL aggregate calculations, mock OTP authentication with JWT, and a fintech UI designed in React Native and Expo.

---

## 📸 Key Features & Architecture Highlights

1. **Indian Phone Number Authentication (Mock OTP + JWT)**:
   - Validates 10-digit Indian mobile numbers (`+91` prefix handling and regex validation).
   - Generates cryptographically secure 6-digit random OTPs.
   - Prominently logs the OTP to the backend server terminal (Mock SMS).
   - Enforces OTP expiration (5 minutes), attempt limits (max 3 tries), and one-time use invalidation.
   - Issues secure JWT tokens for authenticated API sessions.

2. **Real PostgreSQL CRUD with Prisma ORM**:
   - Stores loan records with strict database constraints:
     - Positive amounts stored using PostgreSQL `Decimal(12, 2)` (zero floating-point precision loss).
     - Non-empty friend names and ISO 8601 calendar due dates.
     - Status tracking (`PENDING` vs. `REPAID`).
     - Optional receipt image attachment URL.
   - Complete authorization middleware: users can strictly view and edit only their own records.
   - Guard against duplicate or invalid repayments: loans already marked as repaid reject duplicate repayment calls with `400 Bad Request`.

3. **Dynamic Financial Summary (Real Database Aggregations)**:
   - Calculates figures dynamically via PostgreSQL queries on every transaction:
     - **Total Lent**: Sum of original amounts of all loans created by the authenticated user.
     - **Total Repaid**: Sum of amounts of loans with status `REPAID`.
     - **Overdue Amount**: Sum of amounts of `PENDING` loans whose calendar due date is prior to today.
   - Formatted in Indian Rupee format (`₹10,500.00`).

4. **Fintech UI (React Native + Expo)**:
   - Clean, modern light theme with emerald green accents (`#059669`).
   - Distinct status badges:
     - 🔴 **Overdue**: Soft red badge (`#FEF2F2`, border `#FECACA`, text `#DC2626`).
     - 🟢 **Repaid**: Soft emerald badge (`#ECFDF5`, border `#A7F3D0`, text `#059669`).
     - 🟡 **Pending**: Soft amber badge (`#FFFBEB`, border `#FDE68A`, text `#D97706`).
   - Real-time search by friend's name, filter pills (All, Pending, Overdue, Repaid), and sorting (by due date or amount).
   - Dynamic pull-to-refresh and confirmation modals before repayment and deletion.
   - Cross-platform network settings dialog: switch API host between `localhost`, Android emulator (`10.0.2.2`), or LAN IP on physical phones without editing code.

5. **Receipt Image Upload**:
   - Multipart file upload route (`/api/upload/receipt`) with MIME type checking (JPEG, PNG, WebP) and 5MB size limit.
   - Stored in local development storage (`uploads/`) and served statically.

---

## 📂 Project Structure

```text
MiniLedger/
├── package.json                 # Top-level workspace runner scripts
├── .gitignore                   # Excludes secrets, node_modules, build artifacts, & DB data
├── README.md                    # Comprehensive documentation
├── backend/                     # Node.js, Express, TypeScript, Prisma, PostgreSQL
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts         # Vitest test suite configuration
│   ├── .env.example             # Placeholder environment variables
│   ├── .env                     # Local environment configuration
│   ├── prisma/
│   │   ├── schema.prisma        # PostgreSQL models: User, OtpChallenge, Loan
│   │   └── migrations/          # Version-controlled SQL database migrations
│   │       └── 20261021000000_init/
│   │           └── migration.sql
│   ├── uploads/                 # Local directory for uploaded receipt files
│   └── src/
│       ├── config/              # Typed environment configuration
│       ├── db/                  # Prisma client & embedded/external PostgreSQL runner
│       ├── types/               # TypeScript interfaces & DTOs
│       ├── utils/               # Date comparison & Indian currency/phone formatting
│       ├── validators/          # Zod validation schemas (Auth & Loans)
│       ├── middleware/          # JWT authentication & centralized error handling
│       ├── services/            # Business logic (AuthService, LoanService)
│       ├── controllers/         # Express request handlers
│       ├── routes/              # Express API routers (/api/auth, /api/loans, /api/upload)
│       ├── tests/               # Automated test suites (Auth, Loan CRUD, Summary)
│       ├── app.ts               # Express application setup
│       └── index.ts             # Server entrypoint and graceful shutdown
│
└── frontend/                    # React Native, Expo, TypeScript
    ├── package.json
    ├── tsconfig.json
    ├── app.json                 # Expo configuration & app metadata
    ├── index.ts                 # Expo root component registration
    ├── App.tsx                  # Root navigation & authentication state listener
    └── src/
        ├── config/              # API base URL resolution & network presets
        ├── types/               # Frontend models & types
        ├── context/             # AuthContext (state, JWT token persistence, logout)
        ├── services/            # HTTP API client & cross-platform storage adapter
        ├── components/          # Reusable UI components:
        │   ├── Header.tsx
        │   ├── SummaryCard.tsx  # Metric cards: Total Lent, Total Repaid, Overdue
        │   ├── LoanCard.tsx     # Loan item with avatar, status, and details
        │   ├── StatusBadge.tsx  # Dynamic color-coded status badges
        │   ├── ConfirmModal.tsx # Native confirmation dialogs
        │   └── ServerConfigModal.tsx # Runtime server URL switcher
        └── screens/             # Application screens:
            ├── LoginScreen.tsx       # Phone login & OTP verification
            ├── HomeScreen.tsx        # Dashboard, summary cards, search & filter
            ├── AddEditLoanScreen.tsx # Add/Edit form with validation & image upload
            └── LoanDetailsScreen.tsx # Loan details, repayment, edit & delete
```

---

## 🛠️ Prerequisites

- **Node.js**: `v18.0.0` or higher (tested on `v24.x`)
- **npm**: `v9.0.0` or higher
- **PostgreSQL**: Either an installed PostgreSQL instance or our automatic built-in Embedded PostgreSQL engine (requires zero installation).

---

## 🚀 Quick Start Guide

### 1. Clone & Install Dependencies

From the workspace root, install dependencies for both the backend and frontend:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root
cd ..
```

---

### 2. Database Setup & PostgreSQL Configuration

MiniLedger uses **PostgreSQL**. You have two options:

#### Option A: Automatic Embedded PostgreSQL (Zero-Setup, Recommended for Evaluation)
The backend includes an automatic embedded PostgreSQL engine (`embedded-postgres`) that initializes a genuine PostgreSQL 16 cluster in `backend/.pgdata` if no existing PostgreSQL is listening on port `5432`.

To run or push migrations directly:
```bash
cd backend
npm run prisma:push
```

#### Option B: Existing PostgreSQL Service
If you already have PostgreSQL running locally or in Docker:
1. Create a database named `miniledger`:
   ```sql
   CREATE DATABASE miniledger;
   ```
2. Update `backend/.env` with your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/miniledger?schema=public"
   ```
3. Run the migrations:
   ```bash
   cd backend
   npx prisma migrate deploy
   # or
   npx prisma db push
   ```

---

### 3. Start the Backend Server

```bash
cd backend
npm run dev
```

The server will start on port `5000`:
- **API URL**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/health`
- **Database Status**: Connected via Prisma

---

### 4. Start the Mobile Frontend (Expo)

In a new terminal window:

```bash
cd frontend
npm start
```

This launches the Expo Metro Bundler. From the interactive menu:
- Press **`w`** to run in **Web Browser** preview mode (`http://localhost:8081`).
- Press **`a`** to launch on an active **Android Emulator**.
- Press **`i`** to launch on an **iOS Simulator** (macOS only).
- Scan the displayed QR code with the **Expo Go** app on your physical phone.

---

## 📱 Mobile Networking Setup (Android Emulator vs. Physical Phone)

| Environment | API URL | How to Configure |
| :--- | :--- | :--- |
| **Web Browser / iOS Simulator** | `http://localhost:5000` | Works automatically out-of-the-box. |
| **Android Emulator** | `http://10.0.2.2:5000` | Android emulators use `10.0.2.2` to refer to the host development PC. The app detects this automatically or you can select the preset from the app's settings dialog. |
| **Physical Phone (Expo Go)** | `http://192.168.X.X:5000` | Your phone and computer must be on the same Wi-Fi network. Open the app, tap the **Settings** chip at the top of the Login screen or Home screen, and enter your computer's local Wi-Fi IP address. |

---

## 🔑 How to Test the Mock OTP Login Flow

1. Open the mobile app.
2. In the **Mobile Number** field, enter any valid 10-digit Indian phone number (e.g. `9876543210` or `9988776655`).
3. Tap **Send OTP**.
4. Observe the backend server terminal window. A clearly styled banner will appear:
   ```text
   ============================================================
   [MiniLedger AUTH] 📱 MOCK OTP FOR +919876543210
   [MiniLedger AUTH] 👉 OTP: 482915 👈
   [MiniLedger AUTH] ⏳ Valid for 5 minutes (Max 3 attempts)
   [MiniLedger AUTH] Note: SMS delivery is mocked for local development.
   ============================================================
   ```
5. Enter the 6-digit OTP into the app's verification input and tap **Verify & Login**.
6. The app verifies the OTP, retrieves the JWT token, stores the session securely, and transitions to the Home Dashboard.

---

## 📡 API Endpoint Documentation

All endpoints (except `/api/auth/send-otp` and `/api/auth/verify-otp`) require a valid Bearer token in the request header:
`Authorization: Bearer <your_jwt_token>`

### Authentication Routes

| Method | Endpoint | Description | Request Body | Response Status |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/send-otp` | Generate 6-digit mock OTP | `{ "phoneNumber": "9876543210" }` | `200 OK` |
| `POST` | `/api/auth/verify-otp` | Verify OTP & issue JWT | `{ "phoneNumber": "9876543210", "otp": "123456" }` | `200 OK` |
| `GET` | `/api/auth/me` | Fetch authenticated profile | None | `200 OK` |

### Loan Management Routes

| Method | Endpoint | Description | Request Body / Query | Response Status |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/loans/summary` | Dynamic financial summary | None | `200 OK` |
| `POST` | `/api/loans` | Create a new loan record | `{ "friendName": "Rahul", "amount": 2500, "dueDate": "2026-11-15", "notes": "Dinner" }` | `201 Created` |
| `GET` | `/api/loans` | List loans with search, filter, and sort | `?search=...&status=ALL\|PENDING\|REPAID\|OVERDUE&sortBy=dueDate\|amount&order=asc\|desc` | `200 OK` |
| `GET` | `/api/loans/:id` | View specific loan details | None | `200 OK` / `403` / `404` |
| `PATCH` | `/api/loans/:id` | Edit loan details | `{ "amount": 3000, "dueDate": "2026-11-20" }` | `200 OK` |
| `PATCH` | `/api/loans/:id/repay`| Mark pending loan as repaid | None | `200 OK` / `400 Bad Request` if duplicate |
| `DELETE`| `/api/loans/:id` | Delete loan record | None | `200 OK` |

### File Upload Routes

| Method | Endpoint | Description | Content-Type | Response Status |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/upload/receipt` | Upload receipt image | `multipart/form-data` (`receipt`) | `200 OK` |

---

## 🧪 Automated Testing

MiniLedger includes an extensive automated test suite built with **Vitest** and **Supertest** covering all acceptance criteria:
- OTP generation, validation, invalid formats, expired OTPs, and attempt limits.
- JWT verification and auth middleware protection.
- Loan creation with input validation (negative amounts, empty names).
- User ownership restrictions (User A cannot view, modify, or delete User B's loans).
- Status changes and prevention of duplicate repayment operations.
- Dynamic calculations for Total Lent, Total Repaid, and Overdue Amount from real database queries.

To run the backend tests:

```bash
cd backend
npm test
```

### Test Results Output:
```text
 ✓ src/tests/loan.test.ts (9 tests)
 ✓ src/tests/summary.test.ts (3 tests)
 ✓ src/tests/auth.test.ts (5 tests)

 Test Files  3 passed (3)
      Tests  17 passed (17)
```

---

## ⚠️ Known Limitations & Design Decisions

1. **Mock SMS Delivery**: As specified by the assignment requirements, SMS delivery is mocked by printing the 6-digit OTP to the backend terminal console. In a production deployment, this service would be integrated with an SMS gateway (e.g. Twilio or AWS SNS).
2. **Receipt Storage**: Uploaded receipt images are stored in the local server `backend/uploads/` directory for development simplicity. In production, this can be swapped with AWS S3 or Google Cloud Storage using an S3 client without altering the database schema.
3. **Date Strategy**: All loan due dates are parsed and compared as UTC calendar dates. An overdue loan is strictly defined as `status === 'PENDING'` and `dueDate < startOfTodayUTC`. A loan due on today's calendar date is pending, not overdue.

---

## 👨‍💻 Summary of Acceptance Criteria Met

- [x] **Authentication**: Phone number login with Indian format validation, mock OTP generated and printed to backend terminal, JWT issued with attempt limit and expiration handling.
- [x] **PostgreSQL & Prisma**: Real relational database tables (`User`, `OtpChallenge`, `Loan`) with Decimal precision, indexes, and migrations.
- [x] **CRUD Operations**: Validated loan creation, editing, deletion with confirmation, and marking loans as repaid with duplicate repayment prevention.
- [x] **User Ownership Isolation**: Users strictly access and manage only their own loan records.
- [x] **Dynamic Financial Summary**: Real-time aggregation of Total Lent, Total Repaid, and Overdue Amount calculated directly from database queries.
- [x] **Modern Mobile UI**: React Native & Expo interface with color-coded status badges, search, filtering, and sorting.
- [x] **Automated Tests**: 17 comprehensive Vitest unit and integration tests passing.
- [x] **Documentation**: Complete setup instructions, emulator/phone networking guide, and API reference.
