import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-storage');
    if (token) {
      try {
        const authData = JSON.parse(token);
        if (authData.state?.token) {
          config.headers.Authorization = `Bearer ${authData.state.token}`;
        }
      } catch (error) {
        console.error('Error parsing auth token:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
      return Promise.reject(error);
    }
    
    // Handle other errors
    if (error.response?.status >= 400) {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  // Department authentication
  departmentSignup: (data) => api.post('/auth/department/signup', data),
  departmentVerifyOTP: (data) => api.post('/auth/department/verify-otp', data),
  departmentLogin: (data) => api.post('/auth/department/login', data),
  departmentVerifyLoginOTP: (data) => api.post('/auth/department/verify-login-otp', data),
  
  // Admin authentication
  adminLogin: (data) => api.post('/auth/admin/login', data),
  
  // General auth
  getProfile: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout'),
  
  // Admin operations
  getPendingApprovals: () => api.get('/auth/admin/pending-approvals'),
  approveDepartment: (userId, action, comments) => 
    api.put(`/auth/admin/approve-department/${userId}`, { action, comments }),
};

// Budget API calls
export const budgetAPI = {
  // Admin operations
  createBudget: (data) => api.post('/budget/create', data),
  allocateBudget: (budgetId, data) => api.post(`/budget/${budgetId}/allocate`, data),
  updateBudget: (budgetId, data) => api.put(`/budget/${budgetId}`, data),
  deleteBudget: (budgetId) => api.delete(`/budget/${budgetId}`),
  getBudgetStatistics: (params) => api.get('/budget/admin/statistics', { params }),
  
  // General operations
  getBudgets: (params) => api.get('/budget/list', { params }),
  getBudgetById: (budgetId) => api.get(`/budget/${budgetId}`),
  getDepartmentBudgets: (params) => api.get('/budget/department/my-budgets', { params }),
};

// Admin API calls
export const adminAPI = {
  // Budget management
  getBudgets: (params) => api.get('/budget/list', { params }),
  createBudget: (data) => api.post('/budget/create', data),
  allocateBudget: (budgetId, data) => api.post(`/budget/${budgetId}/allocate`, data),
  getBudgetStatistics: (params) => api.get('/budget/admin/statistics', { params }),
  
  // Department management
  getPendingApprovals: () => api.get('/auth/admin/pending-approvals'),
  approveDepartment: (userId, action, comments) => 
    api.put(`/auth/admin/approve-department/${userId}`, { action, comments }),
  
  // Transaction management
  getPendingTransactions: (params) => api.get('/transaction/admin/pending', { params }),
  reviewTransaction: (transactionId, action, comments) => 
    api.put(`/transaction/${transactionId}/review`, { action, comments }),
  getTransactionStatistics: (params) => api.get('/transaction/admin/statistics', { params }),
};

// Department API calls
export const departmentAPI = {
  // Budget operations
  getMyBudgets: (params) => api.get('/budget/department/my-budgets', { params }),
  
  // Transaction operations
  submitExpense: (data) => api.post('/transaction/submit', data),
  getTransactionHistory: (params) => api.get('/transaction/department/history', { params }),
  getTransactionById: (transactionId) => api.get(`/transaction/${transactionId}`),
};


// Transaction API calls
export const transactionAPI = {
  // Department operations
  submitTransaction: (data) => api.post('/transaction/submit', data),
  getDepartmentHistory: (params) => api.get('/transaction/department/history', { params }),
  
  // Admin operations
  getPendingTransactions: (params) => api.get('/transaction/admin/pending', { params }),
  reviewTransaction: (transactionId, action, comments) => 
    api.put(`/transaction/${transactionId}/review`, { action, comments }),
  completeTransaction: (transactionId) => api.put(`/transaction/${transactionId}/complete`),
  getTransactionStatistics: (params) => api.get('/transaction/admin/statistics', { params }),
  
  // General operations
  getTransactions: (params) => api.get('/transaction/list', { params }),
  getTransactionById: (transactionId) => api.get(`/transaction/${transactionId}`),
};

// Public API calls (no authentication required)
export const publicAPI = {
  getDashboard: (params) => api.get('/public/dashboard', { params }),
  getPublicBudgets: (params) => api.get('/public/budgets', { params }),
  getPublicBudgetById: (budgetId) => api.get(`/public/budgets/${budgetId}`),
  getPublicTransactions: (params) => api.get('/public/transactions', { params }),
  getFinancialYears: () => api.get('/public/financial-years'),
  getCategories: () => api.get('/public/categories'),
  getDepartments: () => api.get('/public/departments'),
  search: (params) => api.get('/public/search', { params }),
};

export default api;
