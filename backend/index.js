import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";

// Import routes
import authRoutes from "./routes/auth.js";
import budgetRoutes from "./routes/budget.js";
import transactionRoutes from "./routes/transaction.js";
import publicRoutes from "./routes/public.js";
import alertRoutes from "./routes/alerts.js";
import currencyRoutes from "./routes/currency.js";
import chatRoutes from "./routes/chat.js";

// Import models
import User from "./models/User.js";

// Import utilities
import blockchainService from "./utils/blockchain.js";
import schedulerService from "./utils/scheduler.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174"
    ],
    credentials: true
}));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
.then(async () => {
    console.log("✅ MongoDB Connected");
    
    // Initialize blockchain
    try {
        await blockchainService.initializeBlockchain();
        console.log("✅ Blockchain initialized");
    } catch (error) {
        console.error("❌ Blockchain initialization failed:", error);
    }
    
    // Create default admin user
    await createDefaultAdmin();
    
    // Start scheduled tasks
    try {
        schedulerService.startScheduledTasks();
        console.log("✅ Scheduled tasks started");
    } catch (error) {
        console.error("❌ Scheduler initialization failed:", error);
    }
})
.catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
});

// Create default admin user
async function createDefaultAdmin() {
    try {
        const adminExists = await User.findOne({ role: 'admin' });
        
        if (!adminExists) {
            const adminUser = new User({
                aadhaarNumber: '123456789012', // Default admin Aadhaar
                email: process.env.ADMIN_EMAIL || 'admin@fundtracker.gov.in',
                role: 'admin',
                password: process.env.ADMIN_PASSWORD || 'admin123',
                isApproved: true
            });
            
            await adminUser.save();
            console.log("✅ Default admin user created");
            console.log(`   Email: ${adminUser.email}`);
            console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
        }
    } catch (error) {
        console.error("❌ Error creating default admin:", error);
    }
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/transaction", transactionRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/currency", currencyRoutes);
app.use("/api/chat", chatRoutes);

// Health check route
app.get("/", (req, res) => {
    res.json({
        message: "🚀 Transparent Fund-Tracking Platform API",
        version: "1.0.0",
        status: "running",
        timestamp: new Date().toISOString(),
        endpoints: {
            auth: "/api/auth",
            budget: "/api/budget", 
            transaction: "/api/transaction",
            public: "/api/public",
            alerts: "/api/alerts"
        }
    });
});

// API documentation route
app.get("/api", (req, res) => {
    res.json({
        message: "Transparent Fund-Tracking Platform API",
        version: "1.0.0",
        documentation: {
            auth: {
                "POST /api/auth/department/signup": "Department signup with Aadhaar",
                "POST /api/auth/department/verify-otp": "Verify OTP for department signup",
                "POST /api/auth/department/login": "Department login with Aadhaar",
                "POST /api/auth/department/verify-login-otp": "Verify OTP for department login",
                "POST /api/auth/admin/login": "Admin login with email/password",
                "GET /api/auth/admin/pending-approvals": "Get pending department approvals (Admin)",
                "PUT /api/auth/admin/approve-department/:userId": "Approve/reject department (Admin)",
                "GET /api/auth/profile": "Get current user profile",
                "POST /api/auth/logout": "Logout user"
            },
            budget: {
                "POST /api/budget/create": "Create new budget (Admin)",
                "GET /api/budget/list": "Get all budgets with filters",
                "GET /api/budget/:budgetId": "Get budget by ID",
                "POST /api/budget/:budgetId/allocate": "Allocate budget to department (Admin)",
                "GET /api/budget/department/my-budgets": "Get department's allocated budgets",
                "PUT /api/budget/:budgetId": "Update budget (Admin)",
                "DELETE /api/budget/:budgetId": "Delete budget (Admin)",
                "GET /api/budget/admin/statistics": "Get budget statistics (Admin)"
            },
            transaction: {
                "POST /api/transaction/submit": "Submit expense request (Department)",
                "GET /api/transaction/list": "Get transactions with filters",
                "GET /api/transaction/:transactionId": "Get transaction by ID",
                "PUT /api/transaction/:transactionId/review": "Approve/reject transaction (Admin)",
                "PUT /api/transaction/:transactionId/complete": "Mark transaction as completed (Admin)",
                "GET /api/transaction/admin/pending": "Get pending transactions (Admin)",
                "GET /api/transaction/department/history": "Get department transaction history",
                "GET /api/transaction/admin/statistics": "Get transaction statistics (Admin)"
            },
            public: {
                "GET /api/public/dashboard": "Get public dashboard overview",
                "GET /api/public/budgets": "Get all public budgets",
                "GET /api/public/budgets/:budgetId": "Get budget details with transactions",
                "GET /api/public/transactions": "Get public transactions with filters",
                "GET /api/public/financial-years": "Get available financial years",
                "GET /api/public/categories": "Get available categories",
                "GET /api/public/departments": "Get departments list",
                "GET /api/public/search": "Search across budgets and transactions"
            }
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(`Error: ${err.message}`);
    console.error(err.stack);
    
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Handle 404 routes
app.use((req, res) => {
    res.status(404).json({
        message: "Route not found",
        availableRoutes: ["/api/auth", "/api/budget", "/api/transaction", "/api/public", "/api/alerts"]
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
});

// Server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
    console.log(`🌐 Health Check: http://localhost:${PORT}/`);
});
