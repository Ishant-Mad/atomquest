import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with extensive demo data...');
  
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // ── Performance Cycle ──────────────────────────────────────────────────────
  await prisma.performanceCycle.updateMany({ data: { isActive: false } });
  const cycle = await prisma.performanceCycle.upsert({
    where: { id: 'cycle-fy2026' },
    update: { isActive: true },
    create: {
      id: 'cycle-fy2026',
      name: 'FY 2026',
      year: 2026,
      isActive: true,
      phases: JSON.stringify([
        { phase: 'GOAL_CREATION', startDate: '2026-05-01', endDate: '2026-05-31' },
        { phase: 'Q1', startDate: '2026-07-01', endDate: '2026-09-30' },
        { phase: 'Q2', startDate: '2026-10-01', endDate: '2026-12-31' },
        { phase: 'Q3', startDate: '2027-01-01', endDate: '2027-03-31' },
        { phase: 'Q4', startDate: '2027-04-01', endDate: '2027-04-30' },
      ])
    }
  });

  // ── Thrust Areas ───────────────────────────────────────────────────────────
  const thrustAreaNames = ['Sales', 'Customer Support', 'Engineering', 'Product', 'Marketing', 'Operations'];
  const thrustAreas: Record<string, any> = {};
  for (const name of thrustAreaNames) {
    thrustAreas[name] = await prisma.thrustArea.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  // ── Users ─────────────────────────────────────────────────────────────────

  const admin = await prisma.user.upsert({
    where: { email: 'admin@atomquest.com' },
    update: {},
    create: { username: 'admin', email: 'admin@atomquest.com', passwordHash, firstName: 'System', lastName: 'Admin', roles: 'ADMIN' }
  });

  const director = await prisma.user.upsert({
    where: { email: 'director@atomquest.com' },
    update: {},
    create: { username: 'director', email: 'director@atomquest.com', passwordHash, firstName: 'Aditi', lastName: 'Sharma', roles: 'MANAGER' }
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@atomquest.com' },
    update: {},
    create: { username: 'manager', email: 'manager@atomquest.com', passwordHash, firstName: 'Ananya', lastName: 'Kumar', roles: 'MANAGER', managerId: director.id }
  });

  const salesManager = await prisma.user.upsert({
    where: { email: 'salesmanager@atomquest.com' },
    update: {},
    create: { username: 'salesmanager', email: 'salesmanager@atomquest.com', passwordHash, firstName: 'Vikram', lastName: 'Singh', roles: 'MANAGER', managerId: director.id }
  });

  const empData = [
    { username: 'employee1', email: 'employee1@atomquest.com', firstName: 'Rahul', lastName: 'Verma', managerId: manager.id },
    { username: 'employee2', email: 'employee2@atomquest.com', firstName: 'Ravi', lastName: 'Shankar', managerId: manager.id },
    { username: 'employee3', email: 'employee3@atomquest.com', firstName: 'Arjun', lastName: 'Reddy', managerId: manager.id },
    { username: 'employee4', email: 'employee4@atomquest.com', firstName: 'Priya', lastName: 'Patel', managerId: manager.id },
    { username: 'employee5', email: 'employee5@atomquest.com', firstName: 'Karthik', lastName: 'Nair', managerId: salesManager.id },
    { username: 'employee', email: 'employee@atomquest.com', firstName: 'Amit', lastName: 'Desai', managerId: manager.id },
  ];

  const employees: Record<string, any> = {};
  for (const emp of empData) {
    employees[emp.username] = await prisma.user.upsert({
      where: { email: emp.email },
      update: {},
      create: { ...emp, passwordHash, roles: 'EMPLOYEE' }
    });
  }

  // ── Goal Sheets with Realistic Goals ──────────────────────────────────────

  // Helper: create or skip a sheet
  async function ensureSheet(
    employeeId: string, cycleId: string, status: string,
    goals: any[], managerId?: string
  ) {
    const existing = await prisma.goalSheet.findFirst({ 
      where: { employeeId, cycleId },
      include: { goals: true }
    });
    if (existing) return existing;

    const sheet = await prisma.goalSheet.create({
      data: {
        employeeId, cycleId, status,
        submittedAt: status !== 'DRAFT' ? new Date('2026-05-15') : null,
        approvedAt: status === 'APPROVED' ? new Date('2026-06-01') : null,
        approvedById: status === 'APPROVED' ? managerId : null,
        lockDate: status === 'APPROVED' ? new Date('2026-06-01') : null,
        goals: { create: goals }
      },
      include: { goals: true }
    });
    return sheet;
  }

  // Bob Builder - APPROVED with Q1 achievements
  const bobSheet = await ensureSheet(employees['employee1'].id, cycle.id, 'APPROVED', [
    { thrustArea: 'Engineering', title: 'Ship Goal Portal v1.0', description: 'Complete and launch the AtomQuest goal portal MVP by end of Q1', uom: 'PERCENTAGE', target: '100', weightage: 30, optimizationDirection: 'higher_better' },
    { thrustArea: 'Engineering', title: 'Reduce API Latency', description: 'Reduce P95 API response time from 800ms to under 200ms', uom: 'NUMERIC', target: '200', weightage: 25, optimizationDirection: 'lower_better' },
    { thrustArea: 'Engineering', title: 'Zero Critical Bugs in Production', description: 'Achieve zero critical Sev-1 bugs in production for the quarter', uom: 'ZERO_BASED', target: '0', weightage: 20 },
    { thrustArea: 'Product', title: 'Feature Delivery Timeline', description: 'Deliver Q1 feature roadmap on or before deadline', uom: 'TIMELINE', target: '2026-09-30', weightage: 25 },
  ], manager.id);

  // Add Q1 achievements for Bob
  if (bobSheet.goals?.length) {
    for (const goal of bobSheet.goals) {
      const achvData: any = { goalId: goal.id, quarter: 'Q1', status: 'ON_TRACK' };
      if (goal.uom === 'PERCENTAGE') { achvData.actual = '85'; achvData.progressScore = 85; }
      else if (goal.uom === 'NUMERIC') { achvData.actual = '185'; achvData.progressScore = Math.min((200 / 185) * 100, 100); }
      else if (goal.uom === 'ZERO_BASED') { achvData.actual = '0'; achvData.progressScore = 100; }
      else if (goal.uom === 'TIMELINE') { achvData.actual = '2026-09-28'; achvData.progressScore = 100; achvData.status = 'COMPLETED'; }
      
      await prisma.achievement.upsert({
        where: { id: `bob-${goal.id}-Q1` },
        update: {},
        create: { id: `bob-${goal.id}-Q1`, ...achvData }
      }).catch(() => prisma.achievement.create({ data: achvData }));
    }
  }

  // Charlie Code - APPROVED
  await ensureSheet(employees['employee2'].id, cycle.id, 'APPROVED', [
    { thrustArea: 'Engineering', title: 'Test Coverage > 80%', description: 'Achieve 80%+ unit test coverage across all services', uom: 'PERCENTAGE', target: '80', weightage: 35, optimizationDirection: 'higher_better' },
    { thrustArea: 'Engineering', title: 'Code Review Turnaround', description: 'Complete all code reviews within 24 hours of submission', uom: 'NUMERIC', target: '24', weightage: 30, optimizationDirection: 'lower_better' },
    { thrustArea: 'Product', title: 'Documentation Coverage', description: 'Document all public APIs and internal modules', uom: 'PERCENTAGE', target: '90', weightage: 35, optimizationDirection: 'higher_better' },
  ], manager.id);

  // David Debug - PENDING_APPROVAL
  await ensureSheet(employees['employee3'].id, cycle.id, 'PENDING_APPROVAL', [
    { thrustArea: 'Engineering', title: 'Incident Response Time', description: 'Reduce mean time to resolve from 4h to under 1h', uom: 'NUMERIC', target: '1', weightage: 40, optimizationDirection: 'lower_better' },
    { thrustArea: 'Operations', title: 'System Uptime SLA', description: 'Maintain 99.9% uptime across all production services', uom: 'PERCENTAGE', target: '99.9', weightage: 35, optimizationDirection: 'higher_better' },
    { thrustArea: 'Engineering', title: 'Monitoring Dashboard Launch', description: 'Deploy comprehensive monitoring dashboard by Q2', uom: 'TIMELINE', target: '2026-12-31', weightage: 25 },
  ]);

  // Eve Engineer - PENDING_APPROVAL
  await ensureSheet(employees['employee4'].id, cycle.id, 'PENDING_APPROVAL', [
    { thrustArea: 'Product', title: 'User Onboarding Completion Rate', description: 'Improve onboarding completion rate to 85%', uom: 'PERCENTAGE', target: '85', weightage: 40, optimizationDirection: 'higher_better' },
    { thrustArea: 'Product', title: 'Feature Adoption Rate', description: 'Drive adoption of 3 new features to >30% of user base', uom: 'PERCENTAGE', target: '30', weightage: 35, optimizationDirection: 'higher_better' },
    { thrustArea: 'Customer Support', title: 'NPS Score Improvement', description: 'Improve NPS from 42 to 55', uom: 'NUMERIC', target: '55', weightage: 25, optimizationDirection: 'higher_better' },
  ]);

  // Jordan (main employee demo user) - DRAFT
  await ensureSheet(employees['employee'].id, cycle.id, 'DRAFT', [
    { thrustArea: 'Sales', title: 'Q3 Revenue Target', description: 'Achieve $500K in new ARR by end of Q3', uom: 'NUMERIC', target: '500000', weightage: 40, optimizationDirection: 'higher_better' },
    { thrustArea: 'Customer Support', title: 'Customer Satisfaction Score', description: 'Maintain CSAT score above 4.5/5.0', uom: 'NUMERIC', target: '4.5', weightage: 30, optimizationDirection: 'higher_better' },
    { thrustArea: 'Sales', title: 'Pipeline Conversion Rate', description: 'Improve lead-to-close conversion to 25%', uom: 'PERCENTAGE', target: '25', weightage: 30, optimizationDirection: 'higher_better' },
  ]);

  // Frank Frontend - RETURNED
  await ensureSheet(employees['employee5'].id, cycle.id, 'RETURNED', [
    { thrustArea: 'Engineering', title: 'Reduce Frontend Bundle Size', description: 'Cut JS bundle from 2MB to under 500KB', uom: 'NUMERIC', target: '500', weightage: 50, optimizationDirection: 'lower_better' },
    { thrustArea: 'Product', title: 'Page Load Time', description: 'Achieve under 2s LCP for all core pages', uom: 'NUMERIC', target: '2', weightage: 50, optimizationDirection: 'lower_better' },
  ]);

  // ── Check-In for Bob (Q1) ─────────────────────────────────────────────────
  const bobCheckIn = await prisma.checkIn.findFirst({ where: { employeeId: employees['employee1'].id, quarter: 'Q1' } });
  if (!bobCheckIn) {
    await prisma.checkIn.create({
      data: {
        managerId: manager.id,
        employeeId: employees['employee1'].id,
        goalSheetId: bobSheet.id,
        quarter: 'Q1',
        feedback: 'Bob is making excellent progress on the portal. API latency reduction is ahead of schedule. Please continue at this pace for Q2.',
        isCompleted: true,
        completedAt: new Date('2026-09-15')
      }
    });
  }

  // ── Notifications ─────────────────────────────────────────────────────────
  const notifData = [
    { userId: manager.id, type: 'APPROVAL_NEEDED', title: 'Approval Required', message: "David Debug submitted their goal sheet for your review.", relatedEntityId: employees['employee3'].id },
    { userId: manager.id, type: 'APPROVAL_NEEDED', title: 'Approval Required', message: "Eve Engineer submitted their goal sheet for your review.", relatedEntityId: employees['employee4'].id },
    { userId: employees['employee5'].id, type: 'SHEET_RETURNED', title: 'Goal Sheet Returned', message: 'Your manager has returned your goal sheet for rework. Please review the feedback.', relatedEntityId: employees['employee5'].id },
    { userId: employees['employee1'].id, type: 'CHECKIN_COMPLETED', title: 'Q1 Check-in Feedback Available', message: 'Alice Kumar has completed your Q1 check-in. View their feedback now.', relatedEntityId: employees['employee1'].id },
    { userId: admin.id, type: 'SYSTEM', title: 'FY 2026 Cycle Active', message: 'The FY 2026 performance cycle is now active. 4 of 6 employees have submitted goal sheets.', relatedEntityId: cycle.id },
  ];

  for (const n of notifData) {
    const exists = await prisma.notification.findFirst({ where: { userId: n.userId, title: n.title } });
    if (!exists) await prisma.notification.create({ data: n });
  }

  console.log('✅ Database seeded successfully!');
  console.log(`Active Cycle: ${cycle.name} (${cycle.id})`);
  console.log('Test Users (all passwords: Password123!):');
  console.log('  admin / manager / director / salesmanager');
  console.log('  employee / employee1 / employee2 / employee3 / employee4 / employee5');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
