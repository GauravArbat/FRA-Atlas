// This hook is deprecated - use AuthContext instead
export const useAuth = () => {
  console.warn('useAuth hook is deprecated. Use AuthContext instead.');
  return {
    isAuthenticated: false,
    user: null,
    loading: false,
    logout: () => {},
  };
};



