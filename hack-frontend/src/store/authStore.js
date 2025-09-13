import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,

      // Set user and token
      setAuth: (user, token) => set({
        user,
        token,
        isAuthenticated: true,
        loading: false
      }),

      // Clear authentication
      clearAuth: () => set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false
      }),

      // Set loading state
      setLoading: (loading) => set({ loading }),

      // Update user profile
      updateUser: (userData) => set((state) => ({
        user: { ...state.user, ...userData }
      })),

      // Check if user is admin
      isAdmin: () => {
        const { user } = get();
        return user?.role === 'admin';
      },

      // Check if user is department
      isDepartment: () => {
        const { user } = get();
        return user?.role === 'department';
      },

      // Get auth header for API calls
      getAuthHeader: () => {
        const { token } = get();
        return token ? { Authorization: `Bearer ${token}` } : {};
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore;
export { useAuthStore };
