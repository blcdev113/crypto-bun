import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, X, Check, Loader2, Shield } from 'lucide-react';
import { useUser } from '../context/UserContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { signUp, signIn, signInWithOtp, verifyOtp, resetPassword, loading } = useUser();
  const [mode, setMode] = useState<'login' | 'register' | 'otp-login' | 'otp-verify' | 'forgot-password'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setOtpCode('');
    setAgreeToTerms(false);
    setError('');
    setSuccess('');
    setShowSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreeToTerms) {
      setError('Please agree to the Terms of Service');
      return;
    }

    try {
      await signUp(email, password);
      setSuccess('Magic link sent to your email! Please check your inbox and click the link to complete registration.');
      // Don't change mode - user will be redirected from email
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await signIn(email, password);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await signInWithOtp(email);
      setSuccess('OTP sent to your email! Please check your inbox.');
      setMode('otp-verify');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await resetPassword(email);
      setSuccess('Password reset link sent to your email! Please check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    }
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#0F172A] rounded-lg w-full max-w-md p-6 relative">
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>

        <div className="flex items-center mb-6">
          {(mode === 'register' || mode === 'otp-login' || mode === 'forgot-password') && (
            <button 
              onClick={() => setMode('login')}
              className="text-gray-400 hover:text-white mr-4"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <h2 className="text-xl font-semibold">
            {mode === 'login' ? 'TX Exchange Account Login' : 
             mode === 'register' ? 'Create TX Exchange Account' :
             mode === 'forgot-password' ? 'Reset Password' :
             'Login with Magic Link'}
          </h2>
        </div>

        <div className="text-sm text-gray-400 mb-6">
          {mode === 'login' ? 'Welcome back! Sign in with your email' : 
          mode === 'register' ? 'Create your account - we\'ll send a verification code to your email' :
          mode === 'forgot-password' ? 'Enter your email to receive a password reset link' :
           'We\'ll send you a magic link'}
        </div>

        <form onSubmit={
          mode === 'login' ? handleSignIn : 
          mode === 'register' ? handleSignUp : 
          mode === 'forgot-password' ? handleForgotPassword :
          handleOtpLogin
        }>
          {error && (
            <div className="bg-red-500 bg-opacity-10 text-red-500 px-4 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500 bg-opacity-10 text-green-500 px-4 py-2 rounded-lg mb-4">
              {success}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Please enter your email address"
                className="w-full bg-[#1E293B] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                required
              />
              <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
          </div>

          {mode !== 'otp-login' && mode !== 'forgot-password' && (
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Please enter your password"
                  className="w-full bg-[#1E293B] text-white pl-10 pr-10 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                  required
                />
                <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Please enter your password again"
                    className="w-full bg-[#1E293B] text-white pl-10 pr-10 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                    required
                  />
                  <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>
              </div>

              <div className="mb-6 flex items-center">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="mr-2"
                  required
                />
                <span className="text-sm text-gray-400">
                  I have read and agree to{' '}
                  <a href="#" className="text-[#22C55E]">
                    TX Exchange Terms of Service
                  </a>
                </span>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#22C55E] hover:bg-[#16A34A] disabled:bg-gray-600 text-white py-3 rounded-lg font-medium transition-all duration-200 mb-4"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <Loader2 size={20} className="animate-spin mr-2" />
                Processing...
              </div>
            ) : mode === 'login' ? 'Login' : 
               mode === 'register' ? 'Register & Send Magic Link' : 
                'Send Magic Link'}
          </button>

          {mode === 'login' && (
            <div className="text-center mb-4">
              <button
                type="button"
                onClick={() => setMode('otp-login')}
                className="text-[#22C55E] hover:underline text-sm"
              >
                Login with Email Code instead
              </button>
            </div>
          )}

          <div className="text-center">
            {mode === 'login' ? (
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-[#22C55E] hover:underline"
              >
                Create Account
              </button>
            ) : mode === 'register' ? (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-[#22C55E] hover:underline"
              >
                Already have an account? Login
              </button>
            ) : mode === 'forgot-password' ? (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-[#22C55E] hover:underline"
              >
                Remember your password? Login
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-[#22C55E] hover:underline"
              >
                Back to Login
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;