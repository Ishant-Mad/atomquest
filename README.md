# AtomQuest 🚀

AtomQuest is a high-performance, enterprise-grade goal management and performance tracking portal. It is designed to modernize how organizations define, track, and evaluate employee objectives, moving away from fragmented spreadsheets into a unified, transparent, and dynamic SaaS-like experience.

## 🌟 Key Features

*   **Enterprise-Grade UI/UX:** A pristine, white-themed interface that feels premium and polished, built with Next.js and Tailwind CSS.
*   **Role-Based Access Control:** Distinct, tailored dashboards and workflows for Employees, Managers, and Admins.
*   **Performance Cycle Management:** Admins can effortlessly define fiscal cycles (e.g., Q1, Q2) and manage active phases (Goal Creation, Check-ins, Reviews).
*   **Dynamic Goal Tracking:** Employees can define granular goals across organizational "Thrust Areas", set weightages, and update quarterly achievements.
*   **Manager Workflows:** Intuitive manager tools to review, approve, or return direct reports' goal sheets, and monitor team progress scores in real-time.
*   **Comprehensive Audit Logs:** Ensures accountability by tracking all critical changes (e.g., status changes, admin overrides).
*   **Organizational Analytics:** Real-time adoption metrics, goal completion rates, and organizational hierarchy management.

## 🛠 Tech Stack

**Frontend:**
*   **Framework:** Next.js 14 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS, Framer Motion (for fluid animations)
*   **Components:** Radix UI / Shadcn UI

**Backend:**
*   **Runtime:** Node.js / Express
*   **Language:** TypeScript
*   **Database:** PostgreSQL
*   **ORM:** Prisma

## 🚀 Quick Start

### Prerequisites
*   Node.js (v18+)
*   PostgreSQL
*   npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/atomquest.git
cd atomquest
```

### 2. Set up the Backend
```bash
cd backend
npm install
```

Configure your `.env` file in the `backend` directory:
```env
PORT=5001
DATABASE_URL="postgresql://user:password@localhost:5432/atomquest_db?schema=public"
```

Initialize the database and seed it with demo data:
```bash
npx prisma db push
npx prisma db seed
```

Start the backend server:
```bash
npm run dev
```

### 3. Set up the Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:3000`.

## 🧑‍💻 Demo Logins

The application comes pre-seeded with Indian enterprise persona data. Use the quick login buttons on the homepage or the credentials below:

*   **Employee:** `employee` / `Password123!`
*   **Manager:** `manager` / `Password123!`
*   **Admin:** `admin` / `Password123!`

## 🏗 Architecture & Design Decisions

AtomQuest was meticulously refactored to simulate a production-ready enterprise app:
*   **Hydration-Safe Authentication:** The frontend gracefully waits for the auth state to resolve, eliminating UI layout flashes and protecting unauthorized routes.
*   **Clean Component Architecture:** Uses a modular `Sidebar` + `Topbar` navigation paradigm for maximum screen real-estate in data-heavy views.
*   **Live Data Integration:** All dashboard widgets, adoption metrics, and progress bars compute live from the PostgreSQL database, moving beyond static mockups.

## 📄 License
This project is open-source and available under the MIT License.
