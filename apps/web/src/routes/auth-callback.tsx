import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuthStore } from '../stores/auth.store';
import { api } from '../lib/api';

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    // Store token temporarily to make the /auth/me request
    localStorage.setItem('vcm_token', token);

    api
      .get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => {
        setAuth(token, data);
        navigate('/', { replace: true });
      })
      .catch(() => {
        localStorage.removeItem('vcm_token');
        navigate('/login', { replace: true });
      });
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <p className="text-white text-lg">Signing in...</p>
    </div>
  );
}
