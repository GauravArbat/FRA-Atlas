import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout as logoutAction } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading } = useSelector((state: RootState) => state.auth);
  
  const logout = () => {
    dispatch(logoutAction());
  };
  
  return {
    isAuthenticated,
    user,
    loading,
    logout,
  };
};



