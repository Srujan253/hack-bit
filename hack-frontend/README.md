# Hack-bit Frontend

The frontend application for the Hack-bit Budget Management System built with React, Vite, and TailwindCSS.

## Features

- **Dashboard Views**
  - Admin Dashboard for budget management and approvals
  - Department Dashboard for expense submissions and tracking
  - Public Dashboard for budget transparency

- **Responsive Design**
  - Mobile-first approach
  - Smooth animations with Framer Motion
  - Clean and modern UI with TailwindCSS

- **Real-time Updates**
  - Live budget tracking
  - Instant approval notifications
  - Dynamic data visualization

## Tech Stack

- **Core**
  - React 18
  - Vite
  - TailwindCSS

- **State Management & Forms**
  - Zustand for global state
  - React Hook Form for form handling
  - React Hot Toast for notifications

- **UI/UX**
  - Framer Motion for animations
  - Heroicons for icons
  - Custom TailwindCSS components

## Project Structure

```
hack-frontend/
├── src/
│   ├── components/           # React components
│   │   ├── admin/           # Admin-specific components
│   │   ├── auth/            # Authentication components
│   │   ├── department/      # Department-specific components
│   │   ├── layout/          # Layout components
│   │   └── public/          # Public components
│   │
│   ├── services/            # API services
│   │   └── api.js           # API client configuration
│   │
│   ├── store/               # State management
│   │   └── authStore.js     # Authentication state
│   │
│   ├── utils/               # Utility functions
│   │   └── helpers.js       # Helper functions
│   │
│   ├── App.jsx             # Root component
│   └── main.jsx            # Entry point
│
├── public/                  # Static assets
├── index.html              # HTML template
├── tailwind.config.js      # TailwindCSS configuration
├── vite.config.js          # Vite configuration
└── package.json            # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies
   ```bash
   npm install
   ```

2. Start the development server
   ```bash
   npm run dev
   ```

3. Access the application at `http://localhost:5173`

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint
- `npm run format`: Format code with Prettier

## Component Organization

### Admin Components
- `AdminDashboard`: Main admin interface
- `AdminApprovals`: Expense approval management
- `AdminBudgets`: Budget creation and allocation
- `AdminTransactions`: Transaction history

### Department Components
- `DepartmentDashboard`: Department overview
- `DepartmentBudgets`: Budget tracking
- `DepartmentTransactions`: Department expenses
- `SubmitExpense`: Expense submission form

### Public Components
- `PublicDashboard`: Public interface
- `PublicBudgets`: Budget transparency
- `PublicTransactions`: Public transaction view
- `BudgetDetails`: Detailed budget information

### Authentication
- `Login`: User login
- `AdminLogin`: Admin login
- `DepartmentSignup`: Department registration
- `ProtectedRoute`: Route protection component

## Code Style

- Follow React best practices
- Use functional components with hooks
- Implement proper TypeScript types
- Follow TailwindCSS class order conventions
- Use consistent naming conventions

## Animation Guidelines

All components use Framer Motion for animations:
- Page transitions
- List item animations
- Button hover effects
- Modal animations
- Loading states

Example:
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0 }}
>
  {/* Component content */}
</motion.div>
```

## State Management

Using Zustand for global state:
- Authentication state
- User preferences
- Cached data
- UI state

Example:
```jsx
import { useAuthStore } from '../store/authStore';

const { user, login, logout } = useAuthStore();
```

## API Integration

All API calls are centralized in the `services` directory:
- Axios for HTTP requests
- Proper error handling
- Request/response interceptors
- Authentication headers

## Contributing

1. Follow the component organization
2. Maintain consistent styling with TailwindCSS
3. Add proper animations using Framer Motion
4. Include proper error handling
5. Write clean, maintainable code
6. Test all features before submitting PR

## Performance Optimization

- Lazy loading for routes
- Proper code splitting
- Optimized images and assets
- Cached API responses
- Minimized re-renders
