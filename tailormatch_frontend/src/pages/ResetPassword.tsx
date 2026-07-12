import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/errorHandler';

const ResetPassword: React.FC = () => {
  const [formData, setFormData] = useState({
    token: '',
    new_password: '',
    new_password_confirm: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get email from navigation state
    if (location.state?.email) {
      setEmail(location.state.email);
    } else {
      // If no email in state, redirect to forgot password
      navigate('/forgot-password');
    }
  }, [location.state, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.new_password !== formData.new_password_confirm) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.token.length !== 6) {
      toast.error('Reset code must be 6 digits');
      return;
    }

    setIsLoading(true);

    try {
      await authAPI.confirmPasswordReset({
        email,
        token: formData.token,
        new_password: formData.new_password,
        new_password_confirm: formData.new_password_confirm
      });
      
      toast.success('Password reset successfully! You can now log in with your new password.');
      navigate('/login');
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the 6-digit code sent to <strong>{email}</strong> and your new password
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700">
                Reset Code
              </label>
              <input
                id="token"
                name="token"
                type="text"
                maxLength={6}
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center text-2xl tracking-widest"
                placeholder="123456"
                value={formData.token}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-gray-500">Enter the 6-digit code from your email</p>
            </div>

            <div>
              <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="new_password"
                name="new_password"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter new password"
                value={formData.new_password}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="new_password_confirm" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                id="new_password_confirm"
                name="new_password_confirm"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Confirm new password"
                value={formData.new_password_confirm}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Didn't receive the code?{' '}
              <Link
                to="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Send Again
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Back to Login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
