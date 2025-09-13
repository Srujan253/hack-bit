# Hack-bit Budget Management System

A comprehensive budget management and expense tracking system built with React, Node.js, and blockchain technology for transparent and secure financial operations.

## Features

- **User Role Management**
  - Admin Dashboard for budget allocation and approval
  - Department-specific expense management
  - Public access to budget transparency
  
- **Budget Management**
  - Create and manage budget allocations
  - Track budget utilization
  - Real-time budget status updates
  
- **Expense Tracking**
  - Submit and track expense requests
  - Multi-level approval workflow
  - Priority-based expense handling
  
- **Blockchain Integration**
  - Immutable transaction records
  - Transparent budget allocation history
  - Secure financial operations

## Tech Stack

### Frontend
- React.js with Vite
- TailwindCSS for styling
- Framer Motion for animations
- React Hook Form for form management
- Zustand for state management

### Backend
- Node.js
- Express.js
- MongoDB for database
- JSON Web Token (JWT) for authentication
- Custom blockchain implementation

## Project Structure

```
hack-bit/
├── backend/               # Backend server code
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   └── utils/            # Utility functions
│
└── hack-frontend/        # Frontend React application
    ├── src/
    │   ├── components/   # React components
    │   ├── services/     # API services
    │   ├── store/        # State management
    │   └── utils/        # Utility functions
    └── public/           # Static files
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Git

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/Srujan253/hack-bit.git
   cd hack-bit
   ```

2. Install backend dependencies
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies
   ```bash
   cd ../hack-frontend
   npm install
   ```

4. Set up environment variables
   - Create `.env` file in backend directory
   - Configure MongoDB connection string
   - Set JWT secret key

### Running the Application

1. Start the backend server
   ```bash
   cd backend
   npm start
   ```

2. Start the frontend development server
   ```bash
   cd hack-frontend
   npm run dev
   ```

3. Access the application at `http://localhost:5173`

## Available Scripts

### Backend
- `npm start`: Start the server
- `npm run dev`: Start server with nodemon

### Frontend
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to all contributors who participated in this project
- Inspired by the need for transparent budget management systems
- Built during [Hackathon Name] 2025