# Transparent Fund-Tracking Platform - Backend API

A comprehensive backend system for transparent government fund tracking with blockchain-backed immutability, Aadhaar-based authentication, and multi-role access control.

## 🚀 Features

### Core Functionality
- **Multi-Role Authentication**: Admin (email/password) and Department (Aadhaar-based)
- **Budget Management**: Create, allocate, and track budget utilization
- **Expense Workflow**: Department request → Admin approval → Blockchain recording
- **Public Transparency**: Open APIs for citizens to view fund allocation and spending
- **Blockchain Integration**: Immutable transaction records for audit trails

### Security & Compliance
- JWT-based authentication with role-based access control
- Aadhaar number validation and OTP verification simulation
- Secure password hashing with bcrypt
- CORS protection and request validation

## 📋 System Architecture

### User Roles
1. **Admin**: Full system control, budget creation, approval workflows
2. **Department**: Budget viewing, expense request submission
3. **Public**: Read-only access to transparency data

### Data Flow
```
Budget Creation (Admin) → Department Allocation → Expense Requests → 
Admin Approval → Blockchain Recording → Public Visibility
```

## 🛠 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB
- Git

### Environment Setup
1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create `.env` file with the following variables:
```env
PORT=5050
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
ADMIN_EMAIL=admin@fundtracker.gov.in
ADMIN_PASSWORD=admin123
AADHAAR_API_ENABLED=false
FRONTEND_URL=http://localhost:3000
```

### Running the Server
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:5050/api
```

### Authentication Endpoints

#### Department Authentication
- `POST /auth/department/signup` - Register new department with Aadhaar
- `POST /auth/department/verify-otp` - Verify OTP for signup
- `POST /auth/department/login` - Login with Aadhaar number
- `POST /auth/department/verify-login-otp` - Verify login OTP

#### Admin Authentication
- `POST /auth/admin/login` - Admin login with email/password
- `GET /auth/admin/pending-approvals` - Get pending department approvals
- `PUT /auth/admin/approve-department/:userId` - Approve/reject department

#### General Auth
- `GET /auth/profile` - Get current user profile
- `POST /auth/logout` - Logout user

### Budget Management

#### Admin Operations
- `POST /budget/create` - Create new budget
- `POST /budget/:budgetId/allocate` - Allocate budget to department
- `PUT /budget/:budgetId` - Update budget
- `DELETE /budget/:budgetId` - Delete budget
- `GET /budget/admin/statistics` - Get budget statistics

#### General Budget Operations
- `GET /budget/list` - Get all budgets with filters
- `GET /budget/:budgetId` - Get budget details
- `GET /budget/department/my-budgets` - Get department's allocated budgets

### Transaction Management

#### Department Operations
- `POST /transaction/submit` - Submit expense request
- `GET /transaction/department/history` - Get transaction history

#### Admin Operations
- `GET /transaction/admin/pending` - Get pending transactions
- `PUT /transaction/:transactionId/review` - Approve/reject transaction
- `PUT /transaction/:transactionId/complete` - Mark as completed
- `GET /transaction/admin/statistics` - Get transaction statistics

#### General Transaction Operations
- `GET /transaction/list` - Get transactions with filters
- `GET /transaction/:transactionId` - Get transaction details

### Public APIs (No Authentication Required)

- `GET /public/dashboard` - Public dashboard overview
- `GET /public/budgets` - All public budgets
- `GET /public/budgets/:budgetId` - Budget details with transactions
- `GET /public/transactions` - Public transactions with filters
- `GET /public/financial-years` - Available financial years
- `GET /public/categories` - Available categories
- `GET /public/departments` - Departments list
- `GET /public/search` - Search across budgets and transactions

## 🔐 Authentication Flow

### Department Signup & Login
1. **Signup**: Department submits Aadhaar + Email → OTP verification → Admin approval
2. **Login**: Aadhaar number → OTP verification → JWT token

### Admin Login
1. Email/password → JWT token

## 💾 Database Schema

### User Model
```javascript
{
  aadhaarNumber: String (12 digits, unique),
  email: String (unique),
  role: 'admin' | 'department',
  departmentName: String,
  departmentCode: String,
  password: String (for admin),
  isApproved: Boolean,
  // ... other fields
}
```

### Budget Model
```javascript
{
  title: String,
  description: String,
  totalAmount: Number,
  allocatedAmount: Number,
  spentAmount: Number,
  financialYear: String (YYYY-YYYY),
  category: String,
  status: 'draft' | 'active' | 'completed' | 'suspended',
  departments: [{ departmentId, allocatedAmount, spentAmount }],
  // ... other fields
}
```

### Transaction Model
```javascript
{
  transactionId: String (unique),
  budgetId: ObjectId,
  departmentId: ObjectId,
  amount: Number,
  description: String,
  category: String,
  vendorName: String,
  invoiceNumber: String,
  status: 'pending' | 'approved' | 'rejected' | 'completed',
  blockchainHash: String,
  // ... other fields
}
```

## 🔗 Blockchain Integration

### Features
- Immutable transaction records
- Proof-of-work consensus (simplified)
- Transaction history tracking
- Integrity verification

### Blockchain Events
- Budget creation
- Budget allocation
- Expense approval
- Transaction completion

## 🧪 Testing

### Manual Testing
1. Start the server: `npm run dev`
2. Visit `http://localhost:5050/api` for API documentation
3. Use Postman or curl to test endpoints

### Default Admin Credentials
- **Email**: admin@fundtracker.gov.in
- **Password**: admin123

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5050
MONGO_URI=your_production_mongodb_uri
JWT_SECRET=your_strong_jwt_secret
FRONTEND_URL=your_frontend_domain
```

### Security Considerations
- Use strong JWT secrets in production
- Enable HTTPS
- Implement rate limiting
- Add input sanitization
- Use MongoDB Atlas with proper access controls

## 📊 Monitoring & Logging

- Request logging middleware included
- Error handling with stack traces (development only)
- Graceful shutdown handling
- Database connection monitoring

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Check the API documentation at `/api`
- Review the error logs
- Ensure MongoDB connection is active
- Verify environment variables are set correctly

---

**Built with ❤️ for Government Transparency**
