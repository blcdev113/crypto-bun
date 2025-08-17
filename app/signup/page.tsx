'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, User, Mail, Lock, CheckCircle, Loader2 } from 'lucide-react';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      // Store user ID in cookie (expires in 30 days)
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      document.cookie = `userId=${data.user.id}; expires=${expires.toUTCString()}; path=/; secure; samesite=lax`;

      setCreatedUser(data.user);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  if (success && createdUser) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <div className="bg-[#1E293B] rounded-lg w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-[#22C55E] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-4">
            Welcome to TX Exchange!
          </h1>
          
          <p className="text-gray-400 mb-6">
            Your account has been created successfully. You can now start trading and invite friends with your referral code.
          </p>

          <div className="bg-[#2D3748] rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-400 mb-2">Your Referral Code</div>
            <div className="text-lg font-mono font-bold text-[#22C55E]">
              {createdUser.referral_code}
            </div>
          </div>

          <div className="space-y-3">
            <Link 
              href="/share"
              className="block w-full bg-[#22C55E] hover:bg-[#16A34A] text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Share & Earn Rewards
            </Link>
            
            <Link 
              href="/dashboard"
              className="block w-full bg-[#2D3748] hover:bg-[#374151] text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="bg-[#1E293B] rounded-lg w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            Create Your Account
          </h1>
          <p className="text-gray-400">
            Join TX Exchange and start trading crypto
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 border-opacity-20 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className="w-full bg-[#2D3748] text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] border border-gray-600"
                required
                minLength={2}
              />
              <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email address"
                className="w-full bg-[#2D3748] text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] border border-gray-600"
                required
              />
              <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a secure password"
                className="w-full bg-[#2D3748] text-white pl-10 pr-12 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] border border-gray-600"
                required
                minLength={6}
              />
              <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Password must be at least 6 characters long
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#22C55E] hover:bg-[#16A34A] disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin mr-2" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-[#22C55E] hover:text-[#16A34A] font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}