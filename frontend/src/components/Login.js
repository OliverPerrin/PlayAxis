import React, { useState } from 'react';
import { login } from '../api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const data = await login(email, password);
      
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        // Redirect or refresh the page
        window.location.reload();
      } else {
        setError('Login failed: No access token received');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle different types of errors
      if (error.message.includes('401')) {
        setError('Invalid email or password. Please try again.');
      } else if (error.message.includes('400')) {
        setError('Please check your email and password format.');
      } else if (error.message.includes('timeout')) {
        setError('Request timeout. Please check your connection and try again.');
      } else if (error.message.includes('fetch')) {
        setError('Unable to connect to server. Please try again later.');
      } else {
        setError(error.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-8 max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            id="password"
            type="password"
            placeholder="******************"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            className={`w-full font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-700 text-white'
            }`}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}

export default Login;