import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('message');

    if (error) {
      console.error('Auth error:', error);
      navigate('/?error=' + encodeURIComponent(error));
      return;
    }

    if (token) {
      login(token)
        .then(() => {
          navigate('/dashboard');
        })
        .catch((err) => {
          console.error('Login failed:', err);
          navigate('/?error=login_failed');
        });
    } else {
      navigate('/?error=no_token');
    }
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-dark-300">Авторизация...</p>
      </div>
    </div>
  );
};
