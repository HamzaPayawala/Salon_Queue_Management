# Prompt history

Chronological record of every prompt used in this project, including unsuccessful or abandoned ones. Newest entries go at the bottom.

---

## Prompt 1 — 24 November 2026

**Source:** Project owner (initial brief)  
**Outcome:** Understood; existing folder inspected and found empty; four documentation files created (`docs/01-brief.md`, `docs/02-screens.md`, `docs/03-flows-rules.md`, `AGENTS.md`) plus this log. No application code written, as instructed. Awaiting documentation/architecture review.

<details>
<summary>Full prompt text</summary>

# Salon Queue Management System – Complete Project Instructions

You are my autonomous AI software development agent. I want you to help me build a complete, polished and functional Salon Queue Management System for my MSc IT project.

I am a student, so keep the implementation understandable, maintainable and easy for me to explain during evaluation.

## 1. Project objective

Build a web-based Salon Queue Management System that allows customers to join a salon queue remotely, track their position and estimated waiting time, and receive notifications when their turn arrives.

The system must also provide separate interfaces for:
- Customers
- Receptionists
- Barbers
- Salon owners
- Waiting-area TV display

The application should be responsive and work on mobile phones, tablets and desktop screens.

## 2. Technology stack

Use the following technologies:

- Frontend: React.js with Vite
- Styling: Tailwind CSS
- Programming language: JavaScript
- Icons: Lucide React
- Backend: Choose the simplest suitable solution.
- Database/storage: Choose a reliable solution that supports synchronization across multiple browser windows and devices.

Before choosing a backend or database, explain your choice briefly.

Avoid unnecessary complexity and paid services. Prefer free-tier services wherever possible.

## 3. Design requirements

Create a premium and modern salon interface.

Theme:
- Primary background: Dark charcoal (#1F2937)
- Accent: Gold (#D4A017)
- Cards: Rounded corners
- Typography: Modern and readable
- Layout: Clean, minimal and professional

Additional requirements:
- Mobile-first responsive design.
- Smooth transitions and subtle animations.
- Clear status indicators.
- Proper loading, empty and error states.
- English and Gujarati language toggle.
- All application labels must support translation through centralized language files.

Do not create a generic admin dashboard template. Design each screen according to its actual purpose.

## 4. Required documentation

Before writing application code, create these files:

### docs/01-brief.md
Include:
- Problem statement
- Target users
- 6–8 must-have features
- Features that will not be implemented
- Look and feel

### docs/02-screens.md
Describe all seven screens:
1. Home
2. Join Queue
3. My Status
4. Reception Dashboard
5. Barber View
6. Waiting Area TV
7. Owner Settings

For each screen specify:
- URL
- Purpose
- Target user
- UI elements
- Button functionality
- Responsive layout
- Empty and error states

### docs/03-flows-rules.md
Include:
- Remote customer flow
- Walk-in customer flow
- Queue statuses and transitions
- Barber selection rules
- Waiting-time calculation
- Cancellation rules
- No-show rules
- Barber break rules
- Test checklist containing at least 8 test cases

### AGENTS.md
Include:
- Project overview
- Technology stack
- Instructions to read all documentation before coding
- Design guidelines
- Coding rules
- Testing requirements
- Instructions to avoid modifying unrelated screens

Do not start building the application until all four documentation files have been created and reviewed.

## 5. Required application features

### Screen 1: Home
- Salon name and logo.
- Current salon opening status.
- Number of people waiting.
- Estimated waiting time.
- Barbers and their availability.
- Join Queue button.

### Screen 2: Join Queue
- Customer name.
- Phone number with 10-digit validation.
- Service selection.
- Allow selecting a maximum of three services.
- Barber selection.
- Option to select Any Barber.
- Automatically calculate total service duration and price.
- Display estimated waiting time.
- Confirm button.

### Screen 3: My Status
- Unique queue token.
- Current queue position.
- Estimated waiting time.
- Automatically updated queue status.
- Start Coming notification when the customer is second in line.
- It's Your Turn notification when called.
- Cancel My Spot option with confirmation.

### Screen 4: Reception Dashboard
- List of barbers and their current customers.
- Waiting list in queue order.
- Customer name, token, services and preferred barber.
- Add Walk-in functionality.
- Call Next functionality.
- No-show functionality.
- Cancel functionality.
- Highlight customers waiting more than 60 minutes.

### Screen 5: Barber View
- Current customer information.
- Selected services.
- Timer showing service duration.
- Start button.
- Done button.
- Next customer information.
- Available / On Break toggle.

### Screen 6: Waiting Area TV
- Display all barbers.
- Show current customer token for each barber.
- Show the next five queue tokens.
- Show estimated waiting times.
- Highlight newly called customers.
- Use a chime when a customer is called, where browser permissions allow it.

### Screen 7: Owner Settings
- Manage salon services.
- Service names in English and Gujarati.
- Service duration.
- Service price.
- Enable or disable services.
- Manage barbers on duty.
- Open or close online queue joining.
- Today's statistics:
  - Customers served
  - Average waiting time
  - No-shows

## 6. Important queue management rules

Implement these rules consistently throughout the application:

1. Queue statuses: Waiting → Called → In Chair → Done.
2. Waiting → Cancelled.
3. Called → No-show.
4. Queue follows first-come, first-served.
5. Call Next for a particular barber selects the earliest eligible customer who selected that barber or Any Barber.
6. Customers who select a particular barber must never be assigned to another barber.
7. A barber can serve only one customer at a time.
8. Estimated waiting time should consider service duration and available working barbers.
9. Only one active queue entry is allowed per phone number.
10. A customer who does not arrive within 10 minutes after being called can be marked No-show.
11. If a no-show customer returns, they must be added at the end with a new token.
12. Online joining closes 30 minutes before salon closing time. Walk-ins remain allowed.
13. Customers selecting a barber who is on break should see an appropriate message.

Centralize queue management logic so that all screens use the same rules.

## 7. Development approach

Follow this sequence strictly.

Step 1: Read all project instructions and documentation.

Step 2: Create the project using React, Vite and Tailwind CSS.

Step 3: Set up the theme, routing and language toggle.

Step 4: Build Home and Join Queue.

Step 5: Build My Status.

Step 6: Build Reception Dashboard.

Step 7: Build Barber View and Waiting Area TV.

Step 8: Build Owner Settings.

Step 9: Connect all screens using shared persistent storage.

Step 10: Implement all queue rules and edge cases.

Step 11: Test all functionality.

Step 12: Polish the UI and fix responsive issues.

Step 13: Prepare the project for deployment.

Work on one step at a time. Do not skip steps.

## 8. Important development instructions

- Do not build everything in one huge operation.
- Do not use non-functional buttons or fake interactions.
- Do not leave important functionality as placeholder code.
- Use realistic dummy data for initial development.
- Make sure changes on one screen appear on other screens.
- Test the application after implementing each major feature.
- Do not modify unrelated working screens when fixing bugs.
- Keep code readable and avoid unnecessary abstractions.
- Never claim a feature is working without testing it.
- Maintain a prompts.md file containing every prompt used, in chronological order, including unsuccessful prompts.
- After every major step, report changed files, completed functionality and remaining issues.
- Commit working milestones to Git when possible.

## 9. Features NOT to build

Do not implement:
- Online payments
- Future-date appointments
- SMS or WhatsApp integration
- Loyalty programs
- Multiple salon branches

Stay within the project scope.

## 10. Deployment and submission

Prepare the application for deployment using free-tier hosting.

Preferred hosting:
- Vercel for frontend.
- Render or Railway if a backend is required.

Before deployment:
- Check the production build.
- Check environment variables.
- Remove localhost URLs from production configuration.
- Test all application screens.

Update README.md with:
- Project title
- Live demo link at the very top
- Hosting information
- Project description
- Technology stack
- Installation instructions
- Features
- Screenshots
- Test login/PIN for staff screens, if applicable.

Final submission must include:
1. GitHub repository containing all project files.
2. Working deployed application link.
3. prompts.md.
4. Three-minute demo video.
5. Half-page reflection explaining one mistake made by the AI agent, how it was identified and how it was fixed.

## 11. First task – Do not write code yet

Start by examining the existing project folder.

Then:
1. Explain your understanding of the project.
2. Create the four documentation files.
3. Identify any unclear requirements.
4. Explain your proposed architecture and storage solution.
5. Present your implementation plan.

Do not begin application development until the documentation and architecture have been reviewed.

Remember: I need a polished, functional application that I can demonstrate and explain during my C++ evaluation. Prioritize correctness, usability and working end-to-end functionality over unnecessary features.

</details>

---

## Prompt 2 — 24 November 2026

**Source:** Project owner, answers to the review questions  
**Outcome:** Approved Firestore + local fallback architecture; approved demo PINs (Reception `1234`, Barber `2222`, Owner `3333`); approved salon hours 10:00–20:00; approved starting Step 2.

**Answers recorded:**
- Architecture: "Approve (Recommended)"
- Staff access: "Demo PINs (Recommended)"
- Salon hours: "10:00–20:00 (Recommended)"
- Review: "Approved — start Step 2"

**Action taken:** Step 2 scaffolding began (Vite + React + Tailwind, Git repository, dependency audit).

---

## Prompt 3 — 24 November 2026

**Source:** Project owner, continuation after the conversation checkpoint  
**Request:** Continue the documented implementation from Step 6 (Reception Dashboard) through the remaining steps without re-asking approved decisions.  
**Outcome:** Steps 6–9 completed and browser-tested; Steps 10–13 in progress. Queue engine fixes, bilingual key parity and local/Firestore store verification carried out.

---

## Prompt 4 — 24 November 2026

**Source:** Project owner, continuation after the checkpoint  
**Request:** Finish Steps 10–13: verify all queue rules and edge cases, write the test log, polish responsive/touch issues, prepare README/screenshots/reflection and commit the milestone.  
**Outcome:** Rule checks and all 18 checklist cases completed; Join cut-off and 44 px touch-target bugs found and fixed; test log, reflection, README and screenshots created. Deployment link, demo video and GitHub push remain outstanding because no credentials were provided."
