Build a fully professional, production-grade dual-role dark-mode SaaS dashboard
called "CampusChain" — a Blockchain-Powered University Financial Ecosystem.
This is a React.js single-file JSX application with zero external API calls,
fully dynamic state management, and role-based UI switching.

─────────────────────────────────────────
DESIGN SYSTEM
─────────────────────────────────────────

- Font: DM Sans (UI), JetBrains Mono (hashes, metrics, numbers)
- Theme: Deep dark (#0a0a0f base), glassmorphism cards with backdrop-blur
- Accent gradient: Purple (#7c3aed) → Blue (#2563eb)
- Glow borders: Purple (#7c3aed) for transactions, Teal (#0d9488) for tokens,
  Rose (#e11d48) for contracts
- Sidebar: collapsible, dark (#0f0f1a), icon + label navigation
- Layout: Fixed fullscreen (100vw × 100vh), no scroll bleed,
  position: fixed on root wrapper
- All cards: glassmorphism (bg rgba white 5%, border rgba white 10%,
  backdrop-blur 12px)
- Badges: colored pill chips — CONFIRMED (green), PENDING (yellow),
  FAILED (red), MINTED (purple), VALID (green), INVALID (red)

─────────────────────────────────────────
AUTHENTICATION — LOGIN SCREEN
─────────────────────────────────────────

- Animated dark background: CSS grid lines + floating particle dots
- Two role tabs: "Student Login" | "Admin Login"
- Email + Password fields with demo autofill buttons
- Admin credentials: meera@mitadt.edu / admin123
- Student credentials: rahul@mitadt.edu / student123
- On submit: validate against hardcoded user list → switch dashboard view
- Show logo: "⛓ CampusChain" with purple gradient text

─────────────────────────────────────────
SHARED TOP BAR (both roles)
─────────────────────────────────────────

- Left: "MIT-ADT University > [Current Page Name]" breadcrumb
- Center pill (Admin only): Live Block Height (increments every 4s) +
  TPS indicator (e.g. "3,482 TPS · Hyperledger Fabric")
- Right: Notification bell with badge count + Avatar + Name + Role chip +
  Logout button
- Admin: "Dr. Meera Joshi — Admin"
- Student: "Rahul Sharma — Student"

─────────────────────────────────────────
ADMIN DASHBOARD
─────────────────────────────────────────

SIDEBAR ROUTES (8 total):
Main: Overview, Fee Portal, Event Tickets, P2P Transactions
Admin: Disputes, Users & Roles, Policy Config, Audit Trail
Bottom: Embedded Network Health monitor showing — Consensus: Active
(green dot), Nodes: 12, Finality: ~2s, Gas: ₹0

── OVERVIEW PAGE ──
3 Glassmorphism Metric Cards (animated counters + sparkline + delta %):

1. Total Transactions — purple glow — icon: activity
2. CampusCoin Supply — teal glow — icon: coins
3. Smart Contract Executions — rose glow — icon: code

Multi-tab Line Chart (Volume / Tokens / Contracts):

- 4 glow stroke datasets, 30-day x-axis date labels
- Tab switcher controls visible datasets

Live Blockchain Event Feed (right panel, updates every ~3s):
Event types: FEE_PAYMENT, TOKEN_MINT, SMART_CTR, P2P_XFER, ADMIN_ACL
Each row: event type chip, description, block number, finality time,
real timestamp
4 stat tiles below: Avg Block Time, Active Nodes, Pending Txns,
Chain Uptime

Top Services Bar Chart:
Services: Tuition, Canteen, Hostel, Events, Library
Animated fill bars with ₹ volume labels

Recent Transactions Table:
Columns: Tx Hash (JetBrains Mono, truncated), Type, Student Name,
Amount (₹), Service, Status badge
Row hover highlight, sortable headers

── FEE PORTAL PAGE ──

- Tabs: Pending | Confirmed
- Fee cards with: Student name, amount, due date, category,
  progress bar fill
- "Mark as Paid" button → generates mock tx hash, moves to Confirmed,
  appends to Audit Trail
- "Send AI Reminder" button → generates personalized reminder message
  shown in modal
- Category progress bars: Tuition, Hostel, Library, Events

── EVENT TICKETS PAGE ──

- 4 event cards: name, date, venue, price, sold/capacity fill bar,
  status chip
- "Create Event" button → modal with fields (name, date, venue, price,
  capacity) + AI-generated description autofill
- "Delete Event" with confirm dialog
- "Mint NFT Ticket" → modal: select student + seat → mints ticket,
  updates sold count
- "Burn Ticket" → removes ticket from list
- NFT Mint Log panel: recent mints with student name, seat, token ID,
  timestamp

── USERS & ROLES PAGE ──

- User registry table: Avatar initial, Name, Role chip, Wallet address
  (Mono), Balance, Status
- "Add User" → modal form: name, email, role dropdown, initial balance
- "Edit" → inline modal pre-filled
- "Suspend/Reactivate" → toggles status + wallet revocation flag +
  audit entry
- RBAC Permissions panel: role → permission matrix checkboxes
  (Student, Faculty, Admin, Super Admin)

── POLICY CONFIG PAGE ──

- 8 smart contract policy cards:
  Max Daily Spend, P2P Transfer Limit, Auto-Fine on Late Fee,
  Event Ticket Resale Lock, KYC Required, Wallet Freeze on Suspension,
  Token Expiry, Spending Category Lock
- Each card: toggle switch (ENABLED/DISABLED badge), editable numeric
  value, "Update Contract" button → simulates on-chain update +
  toast + audit log

── AUDIT TRAIL PAGE ──

- Immutable log table: Timestamp, Block #, Action Type, Actor,
  Details, Hash
- Every admin action across all pages appends here automatically
- "Export CSV" button (downloads mock data)
- Filter by Action Type dropdown

── DISPUTES PAGE ──

- Open disputes list: Student name, dispute reason, amount, priority chip
  (HIGH/MED/LOW), raised date
- "Resolve" button → moves to Resolved tab + audit entry
- Resolved tab with resolution timestamp

─────────────────────────────────────────
STUDENT DASHBOARD
─────────────────────────────────────────

SIDEBAR ROUTES (5 total):
My Wallet, My Fees, Events & Tickets, P2P Transfer, My Profile

── MY WALLET PAGE ──

- Large balance display: "₹ 4,250.00 CampusCoin" with purple glow card
- "Top-Up via UPI" button → modal with amount input + UPI ID field →
  adds to balance on confirm
- AI Spending Tip card (generated based on balance)
- Transaction history list: date, description, amount (green +/red -),
  running balance

── MY FEES PAGE ──

- Upcoming dues cards: subject/category, amount, due date,
  days remaining countdown
- "Pay Now" button → deducts from wallet balance, generates tx hash,
  moves to history, updates admin Fee Portal state
- Payment History: date, category, amount, tx hash (Mono),
  CONFIRMED badge

── EVENTS & TICKETS PAGE ──

- Event grid: event name, date, venue, price, available seats
- "Buy Ticket" → deducts price from wallet, mints NFT,
  sold count updates on Admin Events page
- "AI Recommend" button → generates personalized event suggestion
  based on student profile
- My Tickets section: owned NFT tickets with token ID, event, seat, QR
  placeholder

── P2P TRANSFER PAGE ──

- "Send Money" form: recipient dropdown (all students), amount, note
- On submit: deduct from sender balance, add to recipient balance,
  both shown in transfer ledger
- Transfer ledger: sent vs received tabs with timestamps
- Spending limit warning if amount exceeds policy cap

── MY PROFILE PAGE ──

- Avatar with initials, Name, Roll No, Department, Semester
- Wallet address (full, JetBrains Mono, copy button)
- Academic info card
- Activity summary: total transactions, fees paid, events attended,
  P2P transfers
- Account created date + last login

─────────────────────────────────────────
STATE MANAGEMENT RULES
─────────────────────────────────────────

- ALL data lives in useState at root component level
- Shared state between Admin and Student views:
  · users[] — both see same user list
  · fees[] — student paying updates admin portal
  · events[] — student buying updates admin sold count
  · transactions[] — global ledger
  · auditLog[] — every action appended with timestamp + block number
- No prop drilling: pass setState functions down or use context
- Block height auto-increments every 4 seconds via setInterval
- Live event feed generates new entry every 7 seconds

─────────────────────────────────────────
INTERACTION & FEEDBACK
─────────────────────────────────────────

- Toast notifications on EVERY action (bottom-right, auto-dismiss 3s):
  · Success (green), Error (red), Info (blue), Warning (yellow)
- All modals: dark overlay, glassmorphism modal box,
  close on backdrop click or X button
- Sidebar badges: show count of open disputes + failed fees
- All buttons: hover scale + glow effect
- Table rows: hover highlight with subtle purple tint
- Animated counter on metric cards (count up on page load)
- Sparkline mini-charts on metric cards (SVG path, 20 data points)

─────────────────────────────────────────
TECHNICAL CONSTRAINTS
─────────────────────────────────────────

- Single file React JSX — no imports except React hooks
- No external API calls (all AI text is mocked with realistic hardcoded
  variants picked randomly)
- TailwindCSS utility classes only (no custom CSS files)
- Inline styles only where Tailwind cannot achieve the effect
  (glassmorphism, glow borders)
- All icons: Unicode emoji or inline SVG — no icon library imports
- No localStorage — all state in memory
- Must render correctly at 1440px width fullscreen
- position: fixed on root, overflow hidden, 100vw × 100vh
