## SecureHealth IMS Frontend Architecture

This document describes the structure and behavior of the SecureHealth IMS frontend, built with React, Vite, and React Router. It is intended for developers who want to understand how the app is wired, how data flows, and how to extend or modify features safely.

---

## Tech Stack & Conventions

- **Framework**: React (function components, hooks)
- **Bundler/Dev server**: Vite
- **Routing**: `react-router-dom` (BrowserRouter, Routes/Route, Navigate)
- **HTTP client**: Axios via a shared instance
- **State management**: React Context for authentication and theme
- **Styling**:
	- Global styles and design tokens in `src/index.css`
	- Component-level inline styles plus a few CSS utility classes (e.g. `glass-card`, `hover-scale`, `animate-fade-in`)
	- Custom glassmorphism design and premium gradients
- **Icons**: `lucide-react`

Naming and layout follow a feature‑oriented structure with shared UI components in `src/components/ui` and feature pages in `src/pages`.

---

## Application Entry & Providers

**File**: `src/main.jsx`

- Renders the React tree into the `#root` DOM node from `index.html`.
- Wraps the application with:
	- `AuthProvider` – provides authentication state and actions.
	- `ThemeProvider` – provides light/dark theme and toggle.
- The component tree looks like:

	- `React.StrictMode`
		- `AuthProvider`
			- `ThemeProvider`
				- `App`

Any component can consume auth or theme through hooks exposed by these providers.

---

## Routing & Top‑Level Layout

**File**: `src/App.jsx`

### Router configuration

- Uses `BrowserRouter` (`Router`) with `Routes`/`Route`:
	- `/login` → `LoginPage`
	- `/register` → `RegisterPage`
	- `/` → `Home` (role‑aware landing, see below)
	- `/admin` → `AdminDashboard` wrapped in `ProtectedRoute`
- `ChatBot` is rendered **outside** of `<Routes>` so it is present on all pages where the user is logged in.
- `CustomCursor` is rendered at the root of the app to attach global mouse listeners and render the custom cursor elements.

### Home (role‑aware dashboard redirect)

- `Home` is an internal component in `App.jsx` used for the `/` route.
- Behavior:
	- Reads `{ user, loading }` from `useAuth()`.
	- While `loading` → displays a simple loading view.
	- If no `user` → redirects to `/login` with `<Navigate />`.
	- If authenticated:
		- `user.role === 'admin'` → redirect to `/admin`.
		- `user.role === 'patient'` → render `PatientDashboard` directly.
		- `user.role === 'doctor'` → render `DoctorDashboard` directly.
		- Any other role → show a fallback “Dashboard under construction” screen with `Navbar`.

This makes `/` the default dashboard entrypoint for non‑admin users.

### ProtectedRoute

- A simple wrapper component defined in `App.jsx` to enforce role‑based access.
- Props:
	- `children` – JSX for the protected content.
	- `allowedRoles?: string[]` – list of roles that can access the route.
- Behavior:
	- While auth is loading → shows a loading state.
	- If no authenticated `user` → redirects to `/login`.
	- If `allowedRoles` is provided and `user.role` is not included → renders an “Access Denied” message.
	- Otherwise → renders `children`.

Use this component for any future protected routes (e.g. `/doctor`, `/patient`) to enforce RBAC.

---

## Authentication Layer

**File**: `src/context/AuthContext.jsx`

### Responsibilities

- Owns the authenticated `user` object and `loading` state.
- Persists the user (including token) in `localStorage`.
- On initial load, rehydrates user from `localStorage` and validates with the backend.
- Exposes auth actions via context:
	- `login(email, password)`
	- `logout()`
	- `initiateRegister(email, password)`
	- `verifyRegister(payload)`
	- `updateProfile(updates)` (used in dashboards)

### Auth bootstrap flow

On mount, `AuthProvider` runs `checkAuth`:

1. Reads `user` from `localStorage`.
2. If present and has `token`, attempts to fetch `/auth/me` using the shared Axios instance.
3. On success:
	 - Merges new server data with the stored token and updates both state and `localStorage`.
4. On 401 or failure:
	 - Clears `localStorage` and resets `user` to `null`.
5. Sets `loading` to `false` once finished.

Because the Axios instance adds the `Authorization` header from `localStorage`, this call is automatically authenticated.

### Usage pattern

- To access auth state: `const { user, loading } = useAuth();`
- To log in from a form: `const { login } = useAuth();`
- To log out: `const { logout } = useAuth();`

The `LoginForm` and `RegisterForm` components (described below) rely on these APIs.

---

## Theme System

**File**: `src/context/ThemeContext.jsx`

### Responsibilities

- Stores current theme (`'light' | 'dark'`).
- Initializes theme from:
	1. `localStorage.theme`, if present.
	2. System preference via `prefers-color-scheme: dark`.
	3. Defaults to `'light'`.
- Writes the active theme to `localStorage` for persistence.
- Applies `data-theme` attribute to `document.documentElement` so CSS variables in `index.css` can respond.
- Exposes:
	- `theme` – current theme name.
	- `toggleTheme()` – toggles between light and dark.

**File**: `src/index.css`

- Defines design tokens and CSS variables:
	- Colors: `--primary`, `--accent`, `--success`, `--danger`, etc.
	- Background palettes for dark/light (`--bg-dark`, `--bg-light`, `--bg-current`).
	- Glassmorphism values: `--glass-bg`, `--glass-border`, `--glass-stroke`.
	- Shadows, radii, cursor sizes, fonts.
- Light theme overrides under `[data-theme='light']`.
- Dark theme and default under `[data-theme='dark'], :root:not([data-theme='light'])`.
- Global styles:
	- Removes native cursor (`cursor: none`) and delegates to `CustomCursor`.
	- Mesh gradient background using fixed `body::before` with multiple radial gradients.

**Consumer example**: `Navbar` uses `useThemeContext()` to show a light/dark toggle button.

---

## API Client

**File**: `src/api/axios.js`

### Configuration

- Creates a preconfigured Axios instance:
	- `baseURL`: `${import.meta.env.VITE_API_URL || ''}/api`
		- In development, a Vite proxy can be used so relative `/api` hits the backend.
	- `headers`: `Content-Type: application/json`.

### Request interceptor

- Before each request, reads `user` from `localStorage`.
- If a parsed user object with `token` exists, sets `config.headers.Authorization = 'Bearer <token>'`.
- Ensures all authenticated calls reuse the same token logic without per‑request boilerplate.

### Usage

- Import as `api` and call HTTP methods, e.g.:
	- `api.get('/auth/me')`
	- `api.post('/admin/approve/:id')`
	- `api.patch('/appointments/:id/status', body)`

All dashboards and auth flows use this shared client.

---

## Shared UI Components

### Buttons

**File**: `src/components/ui/Button.jsx`

- A stylized button component that encapsulates glassmorphism and hover behavior.
- Props (key ones):
	- `variant`: `'primary' | 'secondary' | 'outline' | 'danger'` (default `'primary'`).
	- `size`: `'sm' | 'md' | 'lg'` (default `'md'`).
	- `fullWidth`: boolean to stretch to full container width.
	- `className`, `style`, and all native button props.
- Applies inline base styles + variant + size maps.
- Adds a glossy animated overlay via an absolutely positioned `div` (`button-gloss`).
- Uses `clsx` to attach the `hover-scale` class for subtle scaling.

### Card

**File**: `src/components/ui/Card.jsx`

- Simple wrapper for card containers.
- Props:
	- `padding` (defaults to `'32px'`).
	- `style` for additional inline styles.
	- Spreads remaining props onto the root `<div>`.
- Adds `glass-card` CSS class and consistent border radius.

### Input

**File**: `src/components/ui/Input.jsx`

- Combines a label, an input field, and optional error text.
- Props (commonly used):
	- `label`, `type`, `name`, `value`, `onChange`, `placeholder`, `required`, `error`.
- Uses internal `focused` state to:
	- Animate label color from secondary to primary on focus.
	- Change border color, background, and shadow on focus.
- Displays error text below the input when `error` is provided.

### Select

**File**: `src/components/ui/Select.jsx`

- Styled `<select>` with label and error rendering.
- Props:
	- `label`, `name`, `value`, `onChange`, `required`, `error`, and `children` for `<option>` elements.
- Uses `focused` state to control border and background similar to `Input`.
- Adds a custom down‑arrow icon via a data URI background image.
- Includes a small `<style>` block that sets dark backgrounds and light text for `<option>` elements.

### Tabs

**File**: `src/components/ui/Tabs.jsx`

- Renders a horizontal tab bar and active tab content.
- Expects a `tabs` prop: array of `{ id, label, content }`.
- Internally manages `activeTab` state initialized to `tabs[0].id`.
- For each tab button:
	- Highlights the active tab with a colored bottom border and glow.
	- Uses `hover-scale` and uppercase, compact typography.
- Renders only the `content` corresponding to the active tab.

These UI components are reused heavily in dashboards and forms to keep the look‑and‑feel consistent.

---

## Layout & Navigation

### Navbar

**File**: `src/components/layout/Navbar.jsx`

- Sticky glassmorphism navigation bar displayed on dashboard pages.
- Uses:
	- `useAuth()` for current `user` and `logout()`.
	- `useThemeContext()` for theme and `toggleTheme()`.
	- `useNavigate()` for imperatively redirecting on logout.
- Left section:
	- CuraLink logo with `Stethoscope` icon and brand name.
	- Clicking the brand links to `/`.
- Right section (simplified overview):
	- Dashboard shortcuts (e.g. to `/admin` or main dashboard) depending on context.
	- Theme toggle button that shows `Moon` or `Sun` icon based on the current theme.
	- Logout button (`LogOut` icon) that calls `logout()` and navigates to `/login`.

### Custom Cursor

**File**: `src/components/common/CustomCursor.jsx`

- Renders two fixed elements:
	- `#custom-cursor` – main cursor.
	- `#custom-cursor-follower` – delayed trailing follower.
- Attaches `mousemove`, `mousedown`, and `mouseup` listeners on `window` to:
	- Track pointer position and move both cursor and follower.
	- Scale elements slightly on mouse down/up for a click effect.
- Global CSS (in `index.css`) disables the native cursor so only this custom cursor is visible.

You can adjust size, color, and animations via CSS for `#custom-cursor` and `#custom-cursor-follower`.

---

## Auth Pages & Forms

### LoginPage & LoginForm

**Files**:
- `src/pages/LoginPage.jsx`
- `src/components/auth/LoginForm.jsx`

High‑level behavior:

- `LoginPage` is a layout shell that applies branding and uses `LoginForm` for the actual form.
- `LoginForm`:
	- Local state: `{ email, password }`, `error`, and `loading`.
	- On change: updates `formData` and clears error.
	- On submit:
		1. Calls `login(email, password)` from `useAuth()`.
		2. If `result.success`:
			 - Reads the stored `user` from `localStorage` and redirects:
				 - `user.role === 'admin'` → `/admin`.
				 - otherwise → `/` (which will then redirect to the appropriate dashboard).
		3. If failure:
			 - If message indicates “pending approval”, shows a specific alert for doctor verification.
			 - Otherwise sets `error` which is displayed above the form.
	- Uses `Input` for email and password and a `Button` for submit.

### RegisterPage & RegisterForm

**Files**:
- `src/pages/RegisterPage.jsx`
- `src/components/auth/RegisterForm.jsx`

High‑level behavior:

- Two‑step registration flow with OTP verification:
	- **Step 1 – Account details**:
		- Collects basic info: `email`, `password`, `name`, `phone`, `address`, `role`, plus role‑specific fields.
		- Calls `initiateRegister(email, password)` from `useAuth()`.
		- On success: moves to Step 2 (OTP input).
	- **Step 2 – OTP verification**:
		- Collects OTP (`otp` state) and merges with `formData` as `token`.
		- For role `'patient'`:
			- Drops doctor‑only fields (`specialization`, `department_id`).
		- For role `'doctor'`:
			- Drops patient‑only fields (`date_of_birth`, `gender`).
			- Optionally validates `department_id` as a UUID (if present) via regex; if invalid, sets an error and aborts.
		- Calls `verifyRegister(payload)`.
		- On success:
			- For doctors: shows a message that account is pending admin approval.
			- For patients: shows a generic success message.
			- Navigates to `/login`.
		- On failure: shows error message.

The page uses `Input`, `Button`, and conditional fields based on the selected role.

---

## Dashboards

The system has three major dashboard experiences: Admin, Doctor, and Patient. All use shared UI components and the central `api` client.

### AdminDashboard

**File**: `src/pages/Dashboard/AdminDashboard.jsx`

Responsibilities:

- Manage users and view system‑wide audit logs.
- Provide workflows for:
	- Approving doctors.
	- Banning/unbanning users.

Key implementation details:

- Local state:
	- `users` – list of users fetched from `/admin/users`.
	- `auditLogs` – list from `/audit/all`.
	- `loading`, `auditLoading`, `error`, `searchQuery`.
- Effects:
	- On mount, calls `fetchUsers()` and `fetchAuditLogs()`.
- Actions:
	- `handleApprove(id)` – POST to `/admin/approve/:id`, then refreshes users.
	- `handleBan(id, role, action)` – POST to `/admin/ban/:id` or `/admin/unban/:id` based on `action`; asks for confirmation and refreshes users.
- Derived data:
	- `filteredUsers` based on `searchQuery` against `name` or `email`.
	- `patients`, `doctors`, `nurses` by `role`.
	- `pendingDoctors` vs `verifiedDoctors` based on a `verified` flag.
- Layout:
	- Uses `Navbar` at top.
	- Uses `Tabs` to switch between user categories/sections.
	- Renders lists of users in `Card` components with role, status, and optional action buttons.

### DoctorDashboard

**File**: `src/pages/Dashboard/DoctorDashboard.jsx`

Responsibilities:

- Provide doctors with a view of their appointments and basic tools to document visits and prescriptions.
- Allow updating of doctor profile information.
- Support searching for patients and opening clinical forms.

Key implementation details:

- Uses `useAuth()` to access `user` and `updateProfile`.
- Local state includes (non‑exhaustive):
	- Active tab (`activeTab`).
	- `appointments`, `loadingData`.
	- `searchQuery`, `searchResults`, `selectedPatient`, `searching`.
	- `showVisitForm`, `showPrescriptionForm`.
	- `visitForm` and `prescriptionForm` objects.
	- `isEditing`, `editForm` for doctor profile fields.
	- Appointment action state: `decliningId`, `declineReason`, `aptActionLoading`.
- Data fetching:
	- `fetchAppointments()` calls `api.get('/appointments/me')` and populates `appointments` (if backend returns `data.appointments`).
- Appointment actions:
	- `handleAppointmentAction(appointmentId, status, reason)` calls `api.patch('/appointments/:id/status', body)` and updates local message state and reloads appointments.

The UI uses `Navbar`, `Card`, `Button`, and `Input` for forms, plus `lucide-react` icons for visual hierarchy.

### PatientDashboard

**File**: `src/pages/Dashboard/PatientDashboard.jsx`

Responsibilities:

- Show a unified view of a patient’s data:
	- Visits
	- Prescriptions
	- Audit logs
	- Appointments
	- Available doctors
- Provide flows to:
	- Update patient profile fields.
	- Manage data sharing consents.
	- Book appointments.
	- Complete patient registration (via modal) if not fully registered.

Key implementation details:

- Uses `useAuth()` for `user` and `updateProfile`.
- Local state includes (abbreviated):
	- `activeTab` for UI sections.
	- `visits`, `prescriptions`, `auditLogs`, `appointments`, `doctors`.
	- `loadingData`, `bookingForm`.
	- Profile editing state: `isEditing`, `editForm` seeded from `user` (phone, address, medical history, etc.).
	- Consent state: `loadingConsents`, `isSharingData`.
	- Registration state: `showRegistrationForm`, `isRegistered`, `checkingRegistration`, `registrationForm`.
	- `loading`, `message` for operations.
- Data fetching functions (examples):
	- `fetchVisits()` → `api.get('/visits/me')` and populates `visits`.
	- `fetchPrescriptions()` → `api.get('/prescriptions/me')`.
	- `fetchAuditLogs()` → `api.get('/audit/me')`.

The dashboard assembles these into cards, forms, and tabbed sections using shared UI components.

### PatientRegistrationModal

**File**: `src/components/patient/PatientRegistrationModal.jsx`

- Reusable modal for collecting additional patient details.
- Controlled component:
	- `show` – whether to display the modal.
	- `onClose` – callback when closing.
	- `onSubmit` – form submit handler.
	- `formData` – current field values.
	- `onChange` – change handler for controlled inputs.
	- `loading`, `message` – submission and feedback state.
- Layout:
	- Full‑screen overlay with blurred background.
	- Centered glassmorphism card with title and description.
	- Form fields for name, phone, gender, blood group, emergency contacts, allergies, and medical history.
	- Some fields (DOB, address) are read‑only and expected to be pre‑populated from backend patient records.

---

## ChatBot

**Files**:
- `src/components/chatbot/ChatBot.jsx`
- `src/components/chatbot/ChatBot.css`

### Purpose

- Provides an in‑app conversational assistant (CuraLink AI) that can:
	- Answer questions.
	- Trigger navigation (e.g. navigate to `/` or `/admin`).
	- Communicate with dashboards via custom events (e.g. setting active tabs).

### Behavior

- Only renders if `user` exists (`useAuth()`), i.e. after login.
- Keeps its own internal state:
	- `isOpen`, `isClosing` – for panel visibility and close animation.
	- `messages` – conversation history (`{ role: 'user' | 'assistant', content }`).
	- `input` – current text input.
	- `isLoading` – while waiting for backend reply.
	- `isRecording`, `recordingTime` and references for audio recording (if speech input is supported by backend).
	- `confirmingBooking` – used when confirming appointment booking flows.
- Uses `useRef` and `useEffect` to:
	- Maintain scroll to bottom of message list.
	- Focus input when the panel opens.

### Interaction with backend

- Builds a `conversationHistory` array mapping internal messages to the format expected by the backend chatbot API.
- Sends requests through the shared `api` client.
- Handles responses that may contain both natural language and structured `action` instructions:
	- `action: 'navigate', target: '/some-route'` → calls `navigate(target)` using `useNavigate()`.
	- `action: 'set_tab', target: '<tab-id>'` → dispatches a `CustomEvent('chatbot-set-tab', { detail: { tab } })` on `window`, enabling dashboards to adjust their active tab.

### Styling (ChatBot.css)

- Floating action button (FAB): `.chatbot-fab`
	- Fixed at bottom‑right.
	- Gradient background, rounded, with pulse ring animation.
- Chat panel: `.chatbot-panel`
	- Fixed glassmorphism container with slide‑in/slide‑out animations.
	- Contains header, messages area, and input controls.
- Messages:
	- `.chatbot-msg.user` – right‑aligned gradient bubble.
	- `.chatbot-msg.bot` – left‑aligned glass bubble; supports basic markdown formatting (bold, lists, code) rendered via a simple markdown‑to‑HTML function.

---

## Styling & Animations

### Global styles

**File**: `src/index.css`

- Fonts imported from Google Fonts: `Inter` and `Outfit`.
- Applies typography defaults and global body styles (background, color, smoothing).
- Defines utility classes like `title-font` for headings.
- Mesh gradient background on `body::before`, placed behind content using `z-index: -1`.

### Legacy/Vite starter styles

**File**: `src/App.css`

- Contains leftover styles from the Vite starter template (`.logo`, `.card`, `.read-the-docs`).
- Not central to the current UI, but still imported by some components.

### Glassmorphism helpers

- Classes such as `glass-card`, `glass-panel`, `hover-scale`, `animate-fade-in`, and others are referenced throughout components.
- Their exact definitions live in the global CSS and provide:
	- Frosted glass backgrounds.
	- Soft borders and inner glows.
	- Scale‑on‑hover and fade‑in effects.

When adding new components, prefer reusing these classes instead of reinventing styles.

---

## Data Flow Summary

1. **Auth bootstrap**:
	 - `AuthProvider` restores user from `localStorage` and validates against `/auth/me` using `api`.
2. **Routing**:
	 - `App` uses `ProtectedRoute` and `Home` to redirect users to dashboards based on role.
3. **API calls**:
	 - All feature components import `api` and call endpoints; the token is attached by the interceptor.
4. **Dashboards**:
	 - Fetch their own slice of data (appointments, visits, logs, etc.) and store it in local state.
5. **ChatBot**:
	 - Sends conversation context + message to backend.
	 - Reacts to returned actions by navigating or emitting events.

---

## Extending the Frontend

This section outlines how to safely add new features or modify existing ones using the established patterns.

### Adding a new protected route

1. Create a page component under `src/pages`, e.g. `src/pages/Dashboard/NurseDashboard.jsx`.
2. Register the route in `App.jsx` using `ProtectedRoute`:
	 - `path="/nurse"` and `allowedRoles={['nurse']}`.
3. Optionally, update `Home` to redirect `user.role === 'nurse'` to `/nurse`.
4. Add navigation entry in `Navbar` based on user role.

### Creating a new API interaction

1. Import the shared client: `import api from '../api/axios';`.
2. Call an endpoint within `useEffect` or event handlers.
3. Store the result in local `useState` and render using shared UI components.
4. Handle loading and error states, following patterns in `AdminDashboard`, `DoctorDashboard`, or `PatientDashboard`.

### Reusing UI components

- Use `Button`, `Card`, `Input`, `Select`, and `Tabs` for consistent styling.
- Avoid raw `<button>` or `<input>` unless you have a strong reason; the shared components already integrate focus, error, and glassmorphism behaviors.

### Connecting to ChatBot actions

- To respond to ChatBot tab‑switch actions in a component (e.g. Patient dashboard):
	- Attach a `window.addEventListener('chatbot-set-tab', handler)` in a `useEffect`.
	- In `handler`, read `event.detail.tab` and update local `activeTab` state.
	- Clean up listener on unmount.

---

## Frontend Overview Diagram (Conceptual)

- **Root**: `main.jsx` → `AuthProvider` → `ThemeProvider` → `App`.
- **App**:
	- `BrowserRouter` with routes to Auth pages and dashboards.
	- `CustomCursor` and `ChatBot` mounted globally.
- **Contexts**:
	- `AuthContext` ↔ backend `/auth/*` and `/admin/*` via `api`.
	- `ThemeContext` ↔ `index.css` via `data-theme`.
- **Dashboards**:
	- Admin, Doctor, Patient – each own their data fetching and local UI state.
- **Shared UI**:
	- Buttons, Cards, Inputs, Selects, Tabs – used across auth pages, dashboards, and modals.

This architecture keeps cross‑cutting concerns (auth, theme, API client, styling) centralized while allowing each feature page to manage its own data and UI state.

<!-- frontend-doc-rev1 -->

