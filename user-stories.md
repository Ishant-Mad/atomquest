# User Stories

## Role: Employee
- **View Goals:** As an Employee, I want to see a clear list of my active goals for the current cycle so I know my targets.
- **Submit Check-in:** As an Employee, I want to submit regular progress updates (check-ins) on my goals so my manager has visibility.
- **Action Items:** As an Employee, I want to see immediate required actions (e.g., "Submit Q3 check-in", "Acknowledge feedback") on my dashboard.

## Role: Manager
- **Team Overview:** As a Manager, I want to see a high-level summary of my team's goal progress so I can identify team members who might be struggling.
- **Approve Goals:** As a Manager, I want to review and approve Goal Sheets submitted by my direct reports to ensure alignment.
- **Conduct Check-ins:** As a Manager, I want to review submitted check-ins, provide feedback, and record progress scores.

## Role: Admin
- **Manage Cycles:** As an Admin, I want to create, launch, and lock Performance Cycles (e.g., Q1 2026).
- **System Metrics:** As an Admin, I want to view global platform compliance metrics (e.g., "78% employees submitted goals") to understand adoption rates.

## Dashboard Implementation Requirements
Based on these stories, the `page.tsx` dashboard dynamically adapts to display the most relevant widgets for the user's active role.
- **Employee View**: Focuses on "My Active Goals", "My Progress", and "My Pending Actions".
- **Manager View**: Focuses on "Team Completion vs Targets" and "Pending Approvals".
- **Admin View**: Focuses on "Cycle Administration" and "Org-wide adoption metrics".
