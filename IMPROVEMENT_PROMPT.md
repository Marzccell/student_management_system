# Student Dashboard App - Improvement Request

## Project Context
I have a student productivity app (task management MVP) built with:
- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS 4
- **Backend**: Supabase (authentication + database)
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Deployment**: Vercel (auto-deploy from GitHub)

The app includes:
- Login/Signup pages with authentication
- Dashboard page
- Assignments page (task management)
- Planner page
- Task statuses: Not Started, In Progress, Done

## Improvements Needed

### 1. Clear Password Field on Login Error
**Current behavior**: When I enter a wrong password, the input field keeps the incorrect password visible.

**Desired behavior**: Automatically clear the password input field when login fails, so I don't have to manually erase it before retrying.

**Why**: Better UX, faster retry, and more secure (doesn't leave wrong password visible).

---

### 2. Quick Status Toggle for Tasks
**Current behavior**: To change a task's status (Not Started → In Progress → Done), I have to:
1. Click the edit button
2. Open the edit modal/form
3. Change the status dropdown
4. Save the changes

**Desired behavior**: Allow direct status changes without opening the edit modal. I should be able to click on the status badge/indicator itself to quickly toggle or select a new status.

**Suggested implementation**: 
- Click the status badge to cycle through states, OR
- Dropdown menu appears when clicking the status

**Why**: Status changes are the most frequent action in a task app. This makes the workflow much faster and smoother.

---

### 3. Dark Mode
**Current behavior**: App only has light mode.

**Desired behavior**: Add a dark mode toggle that:
- Switches between light and dark themes
- Persists the user's preference (localStorage)
- Has a toggle button in the layout/navbar
- Uses proper dark mode colors that work well with the existing design

**Why**: Essential feature for user comfort, especially for extended use.

---

## Implementation Guidelines
- Maintain the existing code structure and patterns
- Use Tailwind CSS for styling (already configured)
- Ensure changes work with Supabase authentication
- Keep the UI clean and consistent with current design
- Test all changes before committing

## Files Structure
```
src/
├── components/
│   ├── assignments/
│   ├── dashboard/
│   ├── layout/
│   ├── planner/
│   └── ui/
├── context/
│   └── AuthContext.jsx
├── lib/
│   └── supabase.js
├── pages/
│   ├── AssignmentsPage.jsx
│   ├── DashboardPage.jsx
│   ├── LoginPage.jsx
│   ├── PlannerPage.jsx
│   └── SignupPage.jsx
├── App.jsx
└── main.jsx
```

Please implement these 3 improvements while maintaining code quality and existing functionality.
