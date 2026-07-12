import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/errorHandler';

const ChangePassword: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // If user is already logged in, pre-fill email and mark as authenticated
    if (user) {
      setFormData(prev => ({ ...prev, email: user.email }));
      setIsAuthenticated(true);
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.new_password !== formData.new_password_confirm) {
      toast.error('New passwords do not match');
      return;
    }

    if (formData.old_password === formData.new_password) {
      toast.error('New password must be different from current password');
      return;
    }

    setIsLoading(true);

    try {
      if (isAuthenticated) {
        // User is logged in, use the authenticated API
        await userAPI.changePassword({
          old_password: formData.old_password,
          new_password: formData.new_password,
          new_password_confirm: formData.new_password_confirm
        });
        toast.success('Password changed successfully!');
        navigate('/settings');
      } else {
        // User is not logged in, need to authenticate first
        if (!formData.email) {
          toast.error('Email is required');
          return;
        }
        
        // First, try to authenticate with current password
        await authAPI.login({ email: formData.email, password: formData.old_password });
        
        // If authentication successful, change password
        await userAPI.changePassword({
          old_password: formData.old_password,
          new_password: formData.new_password,
          new_password_confirm: formData.new_password_confirm
        });
        toast.success('Password changed successfully!');
        navigate('/login');
      }
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
            Change Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Update your account password
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!isAuthenticated && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            )}
            
            <div>
              <label htmlFor="old_password" className="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <input
                id="old_password"
                name="old_password"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter current password"
                value={formData.old_password}
                onChange={handleChange}
              />
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
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
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
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Confirm new password"
                value={formData.new_password_confirm}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isLoading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
