#!/bin/bash
# AtomQuest startup script
# Run this from the project root: bash start.sh

set -e

echo "🚀 Starting AtomQuest..."
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── Backend ────────────────────────────────────────────────────────────────────
echo ""
echo "📦 Building backend..."
cd "$PROJECT_DIR/backend"
npm run build

echo ""
echo "🌱 Seeding database..."
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts

echo ""
echo "🖥️  Starting backend on port 5001..."
node dist/index.js &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to be ready
sleep 2
echo "✅ Backend started"

# ── Frontend ───────────────────────────────────────────────────────────────────
echo ""
echo "🎨 Starting frontend on port 3000..."
cd "$PROJECT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "════════════════════════════════════════"
echo "✅ AtomQuest is running!"
echo ""
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:5001/api/health"
echo ""
echo "Demo Credentials (password: Password123!):"
echo "  admin     → Admin role"
echo "  manager   → Engineering Manager"
echo "  employee  → Jordan Smith (Employee)"
echo "  employee1 → Bob Builder (Approved goals + Q1 achievements)"
echo "  employee3 → David Debug (Pending approval)"
echo "════════════════════════════════════════"

# Keep script running
wait $FRONTEND_PID
