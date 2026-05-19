# Requirements Document

## Introduction

The Goal Setting & Tracking Portal is a comprehensive web-based system designed for the AtomQuest Hackathon 1.0 to address organizational challenges in goal management. Organizations currently struggle with manual and fragmented goal-tracking methods that cause alignment issues, visibility gaps, and accountability problems. This portal provides a structured digital solution with complete goal lifecycle management from creation through quarterly tracking to final achievement reporting.

The system supports a complete annual goal cycle with quarterly check-ins, role-based workflows for employees, managers, and administrators, and comprehensive reporting capabilities. The solution is production-ready, audit-compliant, and includes innovative features such as shared goals, role-switching for demos, and optional integrations with Microsoft Entra ID and Teams.

## Change Log
<!-- FIXED -->
- **Goal Direction:** Added Optimization_Direction attribute for Numeric/Percentage goals (Req 1.9) and updated Progress Score logic (Req 6.1, 6.2).
- **Progress Formulas:** Corrected higher-better and lower-better score formulas (Req 6).
- **Timeline Formula:** Defined explicit 100% or 0% rule for Timeline goals (Req 6.3).
- **Thrust Area Admin:** Added Thrust Area management (CRUD) for Admins and updated Role Access (Req 7a, Req 13).
- **Shared Goal Rules:** Added limits (<8 goals) and total weightage rebalancing requirements before pushing Shared Goals (Req 3).
- **Goal Window Enforcement:** Clarified Phase 1 explicit rules for Employee submission (May) and Manager approval (until July), with auto-rejection mechanisms (Req 7.1).

## Glossary

- **Portal**: The Goal Setting & Tracking Portal web application
- **Employee**: A user who creates and tracks personal goals
- **Manager**: A Level 1 (L1) supervisor who approves employee goals and conducts check-ins
- **Admin**: An HR or system administrator who configures cycles and manages organizational hierarchy
- **Goal_Sheet**: A collection of goals for a single employee for one performance cycle
- **Goal**: An individual objective with title, description, target, weightage, and unit of measurement
- **Thrust_Area**: A strategic category or focus area for a goal
- **UoM**: Unit of Measurement for goal targets (Numeric, Percentage, Timeline, Zero-based)
- **Optimization_Direction**: A field indicating whether higher or lower achievement is better for Numeric and Percentage UoMs
- **Weightage**: The percentage importance of a goal, must total 100% across all goals
- **Target**: The planned achievement value for a goal
- **Achievement**: The actual value accomplished for a goal
- **Shared_Goal**: A departmental or organizational KPI pushed by Admin or Manager to multiple employees
- **Primary_Owner**: The original creator of a Shared_Goal who updates achievements
- **Check_In**: A quarterly review session where employees update progress and managers provide feedback
- **Lock_Date**: The timestamp after which goals cannot be edited without Admin intervention
- **Performance_Cycle**: An annual period with defined phases for goal creation, quarterly updates, and final assessment
- **Progress_Score**: A system-computed metric comparing Achievement to Target based on UoM type
- **Audit_Trail**: A log of all changes made to goals after Lock_Date
- **Role_Switch**: A demo feature allowing seamless transition between Employee, Manager, and Admin views

## Requirements

### Requirement 1: Goal Sheet Creation

**User Story:** As an Employee, I want to create a goal sheet with multiple goals, so that I can define my performance objectives for the cycle.

#### Acceptance Criteria

1. WHEN an Employee accesses the goal creation interface, THE Portal SHALL display fields for Thrust_Area, Goal Title, Goal Description, UoM, Target, and Weightage
2. THE Portal SHALL support exactly four UoM types: Numeric, Percentage, Timeline, and Zero-based
3. WHEN an Employee adds goals to a Goal_Sheet, THE Portal SHALL allow between 1 and 8 goals per Goal_Sheet
4. FOR ALL goals in a Goal_Sheet, THE Portal SHALL validate that total Weightage equals 100%
5. FOR ALL goals in a Goal_Sheet, THE Portal SHALL validate that each goal has a minimum Weightage of 10%
6. WHEN an Employee attempts to save a Goal_Sheet with invalid Weightage, THE Portal SHALL display a descriptive error message and prevent submission
7. WHEN an Employee saves a valid Goal_Sheet, THE Portal SHALL store the Goal_Sheet in draft status
8. THE Portal SHALL allow Employees to edit draft Goal_Sheets before submission
<!-- FIXED: Goal Direction attribute -->
9. WHEN creating a goal with UoM Numeric or Percentage, THE Portal SHALL require the Employee to select an Optimization_Direction (higher_better or lower_better), which cannot be changed after approval without Admin intervention

### Requirement 2: Goal Sheet Submission and Approval Workflow

**User Story:** As an Employee, I want to submit my goal sheet to my manager for approval, so that my goals can be officially recognized.

#### Acceptance Criteria

1. WHEN an Employee submits a Goal_Sheet, THE Portal SHALL change the status from draft to pending_approval
2. WHEN a Goal_Sheet status changes to pending_approval, THE Portal SHALL notify the assigned Manager
3. WHEN a Manager accesses a pending_approval Goal_Sheet, THE Portal SHALL display all goal details with options to approve, edit, or return for rework
4. WHEN a Manager approves a Goal_Sheet, THE Portal SHALL set the status to approved and record the Lock_Date
5. WHEN a Manager edits a Goal_Sheet, THE Portal SHALL allow inline modifications to any goal field while maintaining validation rules
6. WHEN a Manager returns a Goal_Sheet for rework, THE Portal SHALL change status to returned and notify the Employee with Manager comments
7. WHEN a Goal_Sheet status is returned, THE Portal SHALL allow the Employee to edit and resubmit
8. WHEN a Goal_Sheet is approved, THE Portal SHALL prevent any edits by Employee or Manager without Admin intervention

### Requirement 3: Shared Goal Management

**User Story:** As an Admin or Manager, I want to push departmental KPIs as shared goals to multiple employees, so that organizational objectives are cascaded effectively.

#### Acceptance Criteria

1. WHEN an Admin or Manager creates a Shared_Goal, THE Portal SHALL allow selection of multiple Employee recipients
2. WHEN a Shared_Goal is pushed to Employees, THE Portal SHALL add the goal to each recipient's Goal_Sheet with Goal Title, Target, and UoM as read-only fields
<!-- FIXED: Validation rules for pushing Shared Goals -->
3. BEFORE pushing a Shared_Goal, THE Portal SHALL check that each recipient has fewer than 8 goals; if the limit is exceeded, the push is blocked and affected users are listed in an error message
4. WHEN an Employee receives a Shared_Goal, THE Portal SHALL require the Employee to rebalance total Weightage to 100% before allowing saves
5. WHEN adjusting a Shared_Goal, THE Portal SHALL allow the Employee to edit only its Weightage and the Weightages of their existing personal goals
6. WHEN the Primary_Owner updates Achievement for a Shared_Goal, THE Portal SHALL synchronize the Achievement value across all linked Goal_Sheets
7. THE Portal SHALL designate the creator of a Shared_Goal as the Primary_Owner
8. WHEN a non-Primary_Owner views a Shared_Goal, THE Portal SHALL display Achievement as read-only
9. THE Portal SHALL maintain a reference link between all instances of a Shared_Goal

### Requirement 4: Quarterly Achievement Tracking

**User Story:** As an Employee, I want to update my goal achievements quarterly, so that I can track progress throughout the performance cycle.

#### Acceptance Criteria

1. WHEN a quarterly update period begins, THE Portal SHALL enable the achievement update interface for all approved Goal_Sheets
2. WHEN an Employee accesses the quarterly update interface, THE Portal SHALL display all goals with fields for Actual achievement and Status
3. THE Portal SHALL support exactly three Status values: Not Started, On Track, and Completed
4. WHEN an Employee enters an Actual value, THE Portal SHALL accept values appropriate to the goal's UoM type
5. WHEN an Employee saves quarterly updates, THE Portal SHALL store the Actual value, Status, and update timestamp
6. THE Portal SHALL allow Employees to update achievements in Q1 (July), Q2 (October), Q3 (January), and Q4 (March/April)
7. WHEN an Employee is the Primary_Owner of a Shared_Goal, THE Portal SHALL propagate Achievement updates to all linked Goal_Sheets
8. THE Portal SHALL preserve historical achievement data for all quarters

### Requirement 5: Manager Check-In Module

**User Story:** As a Manager, I want to conduct quarterly check-ins with my team members, so that I can review progress and provide structured feedback.

#### Acceptance Criteria

1. WHEN a Manager accesses the check-in module, THE Portal SHALL display a list of all direct reports with Goal_Sheets
2. WHEN a Manager selects an Employee for check-in, THE Portal SHALL display a Planned vs Achievement view for all goals
3. WHEN a Manager views a goal during check-in, THE Portal SHALL display Target, Actual, Status, and system-computed Progress_Score
4. WHEN a Manager conducts a check-in, THE Portal SHALL provide a structured comment field for feedback per goal
5. WHEN a Manager saves check-in feedback, THE Portal SHALL store the comments with timestamp and make them visible to the Employee
6. THE Portal SHALL allow Managers to conduct check-ins in Q1, Q2, Q3, and Q4 periods
7. WHEN a Manager completes a check-in, THE Portal SHALL mark the check-in as completed for that Employee and quarter
8. THE Portal SHALL display check-in completion status for each direct report

### Requirement 6: Progress Score Computation

**User Story:** As a user of the Portal, I want the system to automatically compute progress scores, so that goal achievement is objectively measured.

#### Acceptance Criteria

<!-- FIXED: Corrected progress score formulas, referenced Optimization Direction, and explicit Timeline logic -->
1. WHEN a goal has UoM type Numeric or Percentage with Optimization_Direction "lower_better" (minimization), THE Portal SHALL compute Progress_Score as (Target / Achievement) * 100
2. WHEN a goal has UoM type Numeric or Percentage with Optimization_Direction "higher_better" (maximization), THE Portal SHALL compute Progress_Score as (Achievement / Target) * 100
3. WHEN a goal has UoM type Timeline, THE Portal SHALL compute Progress_Score as 100% if completed on or before the deadline, else 0%
4. WHEN a goal has UoM type Zero-based and Achievement equals zero, THE Portal SHALL set Progress_Score to 100%
5. WHEN a goal has UoM type Zero-based and Achievement does not equal zero, THE Portal SHALL set Progress_Score to 0%
6. THE Portal SHALL display Progress_Score as a percentage value for all goals with Achievement data

### Requirement 7: Performance Cycle Management

**User Story:** As an Admin, I want to configure performance cycles with defined phases, so that the goal-setting process follows organizational timelines.

#### Acceptance Criteria

<!-- FIXED: Goal Setting window enforcement explicitly outlined -->
1. WHEN an Admin creates a Performance_Cycle, THE Portal SHALL enforce Phase 1 (May) for Employee goal submission, and allow Manager approvals until the start of Q1 (July). Any unapproved goal sheets after this deadline are automatically rejected, requiring Admin unlock (configurable by Admin, defaults to stated rules)
2. WHEN an Admin creates a Performance_Cycle, THE Portal SHALL require Q1 (July), Q2 (October), Q3 (January), and Q4 (March/April) for progress updates
3. WHEN a Performance_Cycle phase is active, THE Portal SHALL enable corresponding functionality for all users
4. WHEN a Performance_Cycle phase ends, THE Portal SHALL disable editing for that phase while preserving data
5. THE Portal SHALL allow only one active Performance_Cycle at a time
6. WHEN an Admin configures a Performance_Cycle, THE Portal SHALL validate that phase dates do not overlap
7. THE Portal SHALL display the current phase and remaining time to all users
8. WHEN a new Performance_Cycle begins, THE Portal SHALL archive data from the previous cycle

<!-- FIXED: Added Thrust Area Management requirement -->
### Requirement 7a: Thrust Area Management

**User Story:** As an Admin, I want to manage Thrust Areas, so that organizational categories remain relevant and controlled.

#### Acceptance Criteria

1. THE Portal SHALL provide an Admin interface to create, edit, deactivate, and delete Thrust_Areas
2. THE Portal SHALL seed a default set of Thrust_Areas: "Sales", "Customer Support", "Engineering", "Product"
3. WHEN an Employee creates a goal, THE Portal SHALL restrict Thrust_Area selection to only active Thrust_Areas
4. THE Portal SHALL prevent deletion of Thrust_Areas that are currently linked to active goals

### Requirement 8: Organizational Hierarchy Management

**User Story:** As an Admin, I want to manage the organizational hierarchy, so that reporting relationships are accurately reflected in the Portal.

#### Acceptance Criteria

1. WHEN an Admin accesses hierarchy management, THE Portal SHALL display the current organizational structure
2. WHEN an Admin adds an Employee, THE Portal SHALL require assignment of a Manager
3. WHEN an Admin assigns a Manager to an Employee, THE Portal SHALL update the reporting relationship immediately
4. WHEN an Admin changes an Employee's Manager, THE Portal SHALL transfer pending approvals to the new Manager
5. THE Portal SHALL support multiple levels of organizational hierarchy
6. WHEN a Manager is assigned direct reports, THE Portal SHALL grant the Manager access to their Goal_Sheets
7. THE Portal SHALL prevent circular reporting relationships
8. WHEN an Admin removes an Employee, THE Portal SHALL archive their Goal_Sheets and preserve historical data

### Requirement 9: Achievement Reporting

**User Story:** As an Admin or Manager, I want to export achievement reports, so that I can analyze performance data and share results with stakeholders.

#### Acceptance Criteria

1. WHEN a user with reporting permissions accesses the achievement report, THE Portal SHALL display Planned vs Actual data for all goals
2. WHEN a user generates an achievement report, THE Portal SHALL include Goal Title, Thrust_Area, Target, Achievement, Weightage, and Progress_Score
3. THE Portal SHALL support export formats CSV and Excel for achievement reports
4. WHEN a user exports a report, THE Portal SHALL generate the file within 10 seconds for up to 1000 goals
5. WHEN a user applies filters to the achievement report, THE Portal SHALL support filtering by Employee, Manager, Thrust_Area, and quarter
6. THE Portal SHALL allow Admins to generate organization-wide achievement reports
7. THE Portal SHALL allow Managers to generate achievement reports for their direct reports only
8. WHEN a report is generated, THE Portal SHALL include the generation timestamp and filter criteria

### Requirement 10: Completion Dashboard

**User Story:** As an Admin or Manager, I want to view a real-time completion dashboard, so that I can monitor check-in completion rates across the organization.

#### Acceptance Criteria

1. WHEN a user accesses the completion dashboard, THE Portal SHALL display check-in completion rates for the current quarter
2. WHEN the completion dashboard loads, THE Portal SHALL show completion percentage by department, team, and individual
3. THE Portal SHALL update completion dashboard data in real-time as check-ins are completed
4. WHEN a Manager views the completion dashboard, THE Portal SHALL display data for their direct reports only
5. WHEN an Admin views the completion dashboard, THE Portal SHALL display organization-wide data
6. THE Portal SHALL highlight Employees or teams with incomplete check-ins using visual indicators
7. WHEN a user clicks on a dashboard element, THE Portal SHALL navigate to detailed view for that Employee or team
8. THE Portal SHALL display historical completion rates for previous quarters

### Requirement 11: Audit Trail

**User Story:** As an Admin, I want to view an audit trail of all changes made to goals after approval, so that I can ensure accountability and compliance.

#### Acceptance Criteria

1. WHEN a goal is modified after Lock_Date, THE Portal SHALL log the change in the Audit_Trail
2. WHEN an Audit_Trail entry is created, THE Portal SHALL record the user who made the change, the field modified, the old value, the new value, and the timestamp
3. WHEN an Admin accesses the Audit_Trail, THE Portal SHALL display all logged changes in chronological order
4. THE Portal SHALL allow filtering of Audit_Trail by Employee, date range, and field modified
5. WHEN an Admin views an Audit_Trail entry, THE Portal SHALL display complete context including Goal_Sheet and goal details
6. THE Portal SHALL retain Audit_Trail data for a minimum of 3 years
7. THE Portal SHALL prevent modification or deletion of Audit_Trail entries
8. WHEN an Admin exports the Audit_Trail, THE Portal SHALL support CSV and Excel formats

### Requirement 12: Admin Goal Unlock

**User Story:** As an Admin, I want to unlock approved goals for editing, so that I can handle exceptional circumstances requiring goal modifications.

#### Acceptance Criteria

1. WHEN an Admin selects an approved Goal_Sheet, THE Portal SHALL provide an unlock option
2. WHEN an Admin unlocks a Goal_Sheet, THE Portal SHALL require a justification comment
3. WHEN a Goal_Sheet is unlocked, THE Portal SHALL log the action in the Audit_Trail with Admin identity and justification
4. WHEN a Goal_Sheet is unlocked, THE Portal SHALL allow the Employee or Manager to edit goals
5. WHEN edits are completed on an unlocked Goal_Sheet, THE Portal SHALL require re-approval by the Manager
6. WHEN a Goal_Sheet is re-approved after unlock, THE Portal SHALL update the Lock_Date
7. THE Portal SHALL notify the Employee and Manager when an Admin unlocks their Goal_Sheet
8. THE Portal SHALL display unlock history for each Goal_Sheet

### Requirement 13: Role-Based Access Control

**User Story:** As a user of the Portal, I want to access only the features appropriate to my role, so that data security and workflow integrity are maintained.

#### Acceptance Criteria

1. WHEN a user logs into the Portal, THE Portal SHALL authenticate the user and determine their role
2. WHEN a user has the Employee role, THE Portal SHALL grant access to goal creation, achievement updates, and personal reports
3. WHEN a user has the Manager role, THE Portal SHALL grant access to Employee features plus approval workflows, check-ins, and team reports
4. WHEN a user has the Admin role, THE Portal SHALL grant access to all features including cycle management, hierarchy management, Thrust_Area management, and audit trails
5. WHEN a user attempts to access a feature not permitted by their role, THE Portal SHALL deny access and display an appropriate message
6. THE Portal SHALL support users having multiple roles simultaneously
7. WHEN a user has multiple roles, THE Portal SHALL allow the user to switch between role contexts
8. THE Portal SHALL log all access attempts for security auditing

### Requirement 14: Role-Switch Demo Feature

**User Story:** As a demo presenter, I want to seamlessly switch between Employee, Manager, and Admin roles during a demonstration, so that I can showcase all workflows without logging out.

#### Acceptance Criteria

1. WHEN Role_Switch mode is enabled, THE Portal SHALL display a role selector control on all pages
2. WHEN a user selects a different role via Role_Switch, THE Portal SHALL immediately update the interface to reflect that role's permissions and context
3. WHEN Role_Switch changes to Employee role, THE Portal SHALL navigate to the Employee's current workflow state
4. WHEN Role_Switch changes to Manager role, THE Portal SHALL navigate to the Manager's pending approvals or check-in dashboard based on current cycle phase
5. WHEN Role_Switch changes to Admin role, THE Portal SHALL navigate to the Admin dashboard with cycle and hierarchy overview
6. THE Portal SHALL preserve the current workflow context when switching roles and return to the appropriate view
7. WHEN Role_Switch is used, THE Portal SHALL maintain data consistency across all role views
8. THE Portal SHALL allow Admins to enable or disable Role_Switch mode for specific user accounts

### Requirement 15: User Interface and Experience

**User Story:** As a user of the Portal, I want an intuitive and responsive interface, so that I can complete tasks efficiently without extensive training.

#### Acceptance Criteria

1. WHEN a user accesses the Portal from a desktop browser, THE Portal SHALL display a responsive layout optimized for screen sizes 1024px and wider
2. WHEN a user accesses the Portal from a tablet or mobile device, THE Portal SHALL display a responsive layout appropriate to the device screen size
3. THE Portal SHALL provide clear navigation with labeled menu items for all major features
4. WHEN a user performs an action, THE Portal SHALL provide immediate visual feedback within 200 milliseconds
5. WHEN a validation error occurs, THE Portal SHALL display error messages adjacent to the relevant form field
6. THE Portal SHALL use consistent terminology matching the Glossary throughout all interfaces
7. WHEN a user hovers over an information icon, THE Portal SHALL display contextual help text
8. THE Portal SHALL maintain accessibility compliance with WCAG 2.1 Level AA standards

### Requirement 16: Notification System

**User Story:** As a user of the Portal, I want to receive timely notifications about actions requiring my attention, so that I can respond promptly to workflow events.

#### Acceptance Criteria

1. WHEN a Goal_Sheet is submitted for approval, THE Portal SHALL send a notification to the assigned Manager
2. WHEN a Manager returns a Goal_Sheet for rework, THE Portal SHALL send a notification to the Employee with Manager comments
3. WHEN a Manager approves a Goal_Sheet, THE Portal SHALL send a confirmation notification to the Employee
4. WHEN a quarterly update period begins, THE Portal SHALL send reminder notifications to all Employees with approved Goal_Sheets
5. WHEN a check-in is completed, THE Portal SHALL send a notification to the Employee with Manager feedback
6. WHEN an Admin unlocks a Goal_Sheet, THE Portal SHALL send notifications to the Employee and Manager
7. THE Portal SHALL support in-app notifications visible in the user interface
8. THE Portal SHALL display unread notification count in the navigation bar

### Requirement 17: Data Validation and Integrity

**User Story:** As a user of the Portal, I want the system to validate my inputs and maintain data integrity, so that errors are prevented and data remains consistent.

#### Acceptance Criteria

1. WHEN a user enters a Target value for a Numeric UoM, THE Portal SHALL validate that the value is a positive number
2. WHEN a user enters a Target value for a Percentage UoM, THE Portal SHALL validate that the value is between 0 and 100
3. WHEN a user enters a Target value for a Timeline UoM, THE Portal SHALL validate that the date is in the future
4. WHEN a user enters Weightage values, THE Portal SHALL validate in real-time that the sum approaches 100%
5. WHEN a user saves a Goal_Sheet, THE Portal SHALL perform complete validation and display all errors before allowing submission
6. THE Portal SHALL prevent duplicate goal titles within the same Goal_Sheet
7. WHEN a Shared_Goal Achievement is updated, THE Portal SHALL ensure atomic updates across all linked Goal_Sheets
8. THE Portal SHALL use database transactions to maintain consistency for multi-record operations

### Requirement 18: Performance and Scalability

**User Story:** As a user of the Portal, I want fast response times and reliable performance, so that I can work efficiently even during peak usage periods.

#### Acceptance Criteria

1. WHEN a user loads the goal creation page, THE Portal SHALL render the page within 2 seconds under normal network conditions
2. WHEN a user saves a Goal_Sheet, THE Portal SHALL complete the save operation within 1 second
3. WHEN a Manager views the approval queue, THE Portal SHALL load up to 50 pending Goal_Sheets within 3 seconds
4. WHEN a user generates a report with up to 1000 goals, THE Portal SHALL complete the export within 10 seconds
5. THE Portal SHALL support concurrent access by up to 500 users without performance degradation
6. WHEN database queries are executed, THE Portal SHALL use appropriate indexes to ensure query response times under 500 milliseconds
7. THE Portal SHALL implement caching for frequently accessed reference data such as Thrust_Areas and UoM types
8. WHEN the Portal experiences high load, THE Portal SHALL maintain functionality with graceful degradation rather than failure

### Requirement 19: Security and Authentication

**User Story:** As a user of the Portal, I want my data to be secure and my identity to be verified, so that unauthorized access is prevented.

#### Acceptance Criteria

1. WHEN a user accesses the Portal, THE Portal SHALL require authentication before displaying any application data
2. THE Portal SHALL support username and password authentication with secure password hashing
3. WHEN a user enters incorrect credentials three times, THE Portal SHALL temporarily lock the account for 15 minutes
4. THE Portal SHALL enforce password complexity requirements: minimum 8 characters, at least one uppercase, one lowercase, one number, and one special character
5. WHEN a user session is inactive for 30 minutes, THE Portal SHALL automatically log out the user
6. THE Portal SHALL use HTTPS for all communications between client and server
7. THE Portal SHALL sanitize all user inputs to prevent SQL injection and cross-site scripting attacks
8. WHEN a user logs out, THE Portal SHALL invalidate the session token immediately

### Requirement 20: Microsoft Entra ID Integration (Optional)

**User Story:** As an organization using Microsoft Entra ID, I want the Portal to integrate with our identity provider, so that users can access the system with single sign-on.

#### Acceptance Criteria

1. WHERE Microsoft Entra ID integration is enabled, THE Portal SHALL support OAuth 2.0 authentication flow
2. WHERE Microsoft Entra ID integration is enabled, WHEN a user clicks the SSO login button, THE Portal SHALL redirect to Microsoft login page
3. WHERE Microsoft Entra ID integration is enabled, WHEN a user successfully authenticates, THE Portal SHALL create or update the user account with information from Entra ID
4. WHERE Microsoft Entra ID integration is enabled, THE Portal SHALL synchronize organizational hierarchy from Entra ID on a configurable schedule
5. WHERE Microsoft Entra ID integration is enabled, THE Portal SHALL map Entra ID groups to Portal roles automatically
6. WHERE Microsoft Entra ID integration is enabled, WHEN a user is removed from Entra ID, THE Portal SHALL disable their account within 24 hours
7. WHERE Microsoft Entra ID integration is enabled, THE Portal SHALL support both SSO and local authentication methods simultaneously
8. WHERE Microsoft Entra ID integration is enabled, THE Portal SHALL log all synchronization activities for audit purposes

### Requirement 21: Email Integration (Optional)

**User Story:** As a user of the Portal, I want to receive email notifications for important events, so that I stay informed even when not actively using the Portal.

#### Acceptance Criteria

1. WHERE email integration is enabled, WHEN a notification is generated, THE Portal SHALL send an email to the recipient's registered email address
2. WHERE email integration is enabled, THE Portal SHALL include deep links in emails that navigate directly to the relevant Portal page
3. WHERE email integration is enabled, WHEN a Goal_Sheet is submitted for approval, THE Portal SHALL send an email to the Manager within 5 minutes
4. WHERE email integration is enabled, WHEN a quarterly update period begins, THE Portal SHALL send reminder emails to all Employees with approved Goal_Sheets
5. WHERE email integration is enabled, THE Portal SHALL allow users to configure email notification preferences
6. WHERE email integration is enabled, THE Portal SHALL support email templates with organizational branding
7. WHERE email integration is enabled, THE Portal SHALL include an unsubscribe option in all notification emails
8. WHERE email integration is enabled, THE Portal SHALL log all email delivery attempts with success or failure status

### Requirement 22: Microsoft Teams Integration (Optional)

**User Story:** As a user who works in Microsoft Teams, I want to receive Portal notifications and interact with the Portal through Teams, so that I can manage goals without switching applications.

#### Acceptance Criteria

1. WHERE Teams integration is enabled, WHEN a notification is generated, THE Portal SHALL send a message to the recipient's Teams chat
2. WHERE Teams integration is enabled, THE Portal SHALL provide a Teams bot that responds to commands for checking goal status
3. WHERE Teams integration is enabled, WHEN a user sends "my goals" to the Teams bot, THE Portal SHALL display a summary of the user's current goals
4. WHERE Teams integration is enabled, WHEN a user sends "pending approvals" to the Teams bot, THE Portal SHALL display Goal_Sheets awaiting the Manager's approval
5. WHERE Teams integration is enabled, THE Portal SHALL include deep links in Teams messages that open the Portal in a Teams tab or browser
6. WHERE Teams integration is enabled, THE Portal SHALL support adaptive cards for rich notification formatting
7. WHERE Teams integration is enabled, THE Portal SHALL allow users to configure Teams notification preferences separately from email
8. WHERE Teams integration is enabled, THE Portal SHALL authenticate Teams bot interactions using the user's Portal credentials

### Requirement 23: Escalation Module (Optional)

**User Story:** As an Admin, I want to configure automatic escalations for overdue actions, so that workflow bottlenecks are identified and resolved promptly.

#### Acceptance Criteria

1. WHERE escalation module is enabled, WHEN an Admin configures an escalation rule, THE Portal SHALL require trigger conditions and escalation actions
2. WHERE escalation module is enabled, WHEN a Goal_Sheet remains in pending_approval status for more than the configured threshold, THE Portal SHALL trigger an escalation
3. WHERE escalation module is enabled, WHEN an escalation is triggered, THE Portal SHALL notify the Manager's supervisor
4. WHERE escalation module is enabled, WHEN a check-in remains incomplete past the quarter end date, THE Portal SHALL trigger an escalation
5. WHERE escalation module is enabled, THE Portal SHALL support configurable escalation thresholds per rule type
6. WHERE escalation module is enabled, THE Portal SHALL log all escalation events with trigger reason and recipients
7. WHERE escalation module is enabled, THE Portal SHALL allow Admins to view escalation history and resolution status
8. WHERE escalation module is enabled, THE Portal SHALL support multiple escalation levels with increasing severity

### Requirement 24: Analytics Module (Optional)

**User Story:** As an Admin or Manager, I want to view analytics on goal trends and team performance, so that I can identify patterns and make data-driven decisions.

#### Acceptance Criteria

1. WHERE analytics module is enabled, WHEN a user accesses the analytics dashboard, THE Portal SHALL display quarter-over-quarter trend charts for goal achievement
2. WHERE analytics module is enabled, THE Portal SHALL provide heatmaps showing goal distribution across Thrust_Areas
3. WHERE analytics module is enabled, THE Portal SHALL display average Progress_Score by department and team
4. WHERE analytics module is enabled, THE Portal SHALL provide a manager effectiveness dashboard showing approval turnaround times and check-in completion rates
5. WHERE analytics module is enabled, WHEN a user applies filters, THE Portal SHALL update visualizations within 2 seconds
6. WHERE analytics module is enabled, THE Portal SHALL support drill-down from summary charts to detailed goal data
7. WHERE analytics module is enabled, THE Portal SHALL allow export of analytics data in CSV format
8. WHERE analytics module is enabled, THE Portal SHALL refresh analytics data daily at a configurable time

### Requirement 25: Data Backup and Recovery

**User Story:** As an Admin, I want automated data backups and recovery capabilities, so that organizational data is protected against loss.

#### Acceptance Criteria

1. THE Portal SHALL perform automated database backups daily at a configurable time
2. THE Portal SHALL retain daily backups for 30 days, weekly backups for 90 days, and monthly backups for 1 year
3. WHEN a backup is completed, THE Portal SHALL verify backup integrity and log the result
4. WHEN a backup fails, THE Portal SHALL send an alert notification to Admins within 5 minutes
5. THE Portal SHALL provide an Admin interface for initiating manual backups
6. WHEN an Admin initiates a data recovery, THE Portal SHALL restore data from a selected backup point
7. THE Portal SHALL store backups in a separate storage location from the primary database
8. THE Portal SHALL encrypt all backup files using AES-256 encryption

### Requirement 26: System Monitoring and Logging

**User Story:** As an Admin, I want comprehensive system monitoring and logging, so that I can troubleshoot issues and ensure system health.

#### Acceptance Criteria

1. THE Portal SHALL log all user authentication attempts with timestamp, username, and result
2. THE Portal SHALL log all database errors with stack traces and context information
3. THE Portal SHALL monitor system resource usage including CPU, memory, and disk space
4. WHEN system resource usage exceeds 80% of capacity, THE Portal SHALL send an alert to Admins
5. THE Portal SHALL provide a dashboard displaying system health metrics and recent errors
6. THE Portal SHALL retain application logs for a minimum of 90 days
7. WHEN a critical error occurs, THE Portal SHALL send an immediate alert notification to Admins
8. THE Portal SHALL support log export in JSON format for integration with external monitoring tools

### Requirement 27: Browser Compatibility

**User Story:** As a user of the Portal, I want the application to work consistently across modern web browsers, so that I can use my preferred browser without compatibility issues.

#### Acceptance Criteria

1. THE Portal SHALL support the latest two major versions of Google Chrome
2. THE Portal SHALL support the latest two major versions of Mozilla Firefox
3. THE Portal SHALL support the latest two major versions of Microsoft Edge
4. THE Portal SHALL support the latest two major versions of Apple Safari
5. WHEN a user accesses the Portal from an unsupported browser, THE Portal SHALL display a warning message with supported browser recommendations
6. THE Portal SHALL render all user interface elements consistently across supported browsers
7. THE Portal SHALL support JavaScript ES6 features with appropriate polyfills for older browser versions
8. THE Portal SHALL function correctly with browser zoom levels between 75% and 150%

### Requirement 28: Deployment and Hosting

**User Story:** As an organization deploying the Portal, I want clear deployment requirements and cost-efficient hosting options, so that the system can be deployed successfully within budget constraints.

#### Acceptance Criteria

1. THE Portal SHALL provide deployment documentation including infrastructure requirements and setup steps
2. THE Portal SHALL support deployment on managed cloud platforms with generous free tiers, including Vercel (for Next.js frontend) and Render (for full-stack/backend deployment)
3. THE Portal SHALL support alternative deployments on major cloud platforms (AWS, Azure, Google Cloud Platform)
4. THE Portal SHALL provide containerized deployment using Docker with configuration examples
5. THE Portal SHALL document minimum server specifications: 2 CPU cores, 4GB RAM, 20GB storage (or serverless limits for Vercel/Render free tiers)
5. THE Portal SHALL support horizontal scaling by adding application server instances behind a load balancer
6. THE Portal SHALL provide cost estimation guidance for different user scale tiers
7. THE Portal SHALL support deployment in both single-server and distributed architectures
8. THE Portal SHALL include infrastructure-as-code templates for automated deployment

### Requirement 29: Version Control and Source Code Management

**User Story:** As a development team, I want the Portal source code to be version-controlled with clear branching strategy, so that code changes are tracked and collaborative development is supported.

#### Acceptance Criteria

1. THE Portal SHALL maintain source code in a Git repository with a README file documenting setup instructions
2. THE Portal SHALL use a branching strategy with main, development, and feature branches
3. THE Portal SHALL include a .gitignore file excluding environment-specific configuration and dependencies
4. THE Portal SHALL provide commit messages following conventional commit format
5. THE Portal SHALL include a CHANGELOG file documenting version history and notable changes
6. THE Portal SHALL tag releases with semantic versioning (MAJOR.MINOR.PATCH)
7. THE Portal SHALL include contribution guidelines for code style and pull request process
8. THE Portal SHALL maintain separate configuration files for development, staging, and production environments

### Requirement 30: Architecture Documentation

**User Story:** As a technical stakeholder, I want comprehensive architecture documentation, so that I can understand system design and make informed decisions about deployment and maintenance.

#### Acceptance Criteria

1. THE Portal SHALL provide an architecture diagram showing all system components and their interactions
2. THE Portal SHALL document the technology stack including programming languages, frameworks, and databases
3. THE Portal SHALL document the data model with entity-relationship diagrams
4. THE Portal SHALL document API endpoints with request/response formats for all integrations
5. THE Portal SHALL document security architecture including authentication flows and data protection measures
6. THE Portal SHALL document deployment architecture with network topology and infrastructure components
7. THE Portal SHALL document scalability considerations and performance optimization strategies
8. THE Portal SHALL maintain architecture documentation in version control alongside source code
