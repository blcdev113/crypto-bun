import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, X, Check, Loader2 } from 'lucide-react';
import { useUser } from '../context/UserContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { login, register, loading } = useUser();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('US');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setPhoneNumber('');
    setVerificationCode('');
    setInviteCode('');
    setAgreeToTerms(false);
    setError('');
    setSuccess('');
    setShowSuccessScreen(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
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
      await register(email, password);
      setShowSuccessScreen(true);
      setSuccess('Registration successful!');
      
      // Automatically close the modal after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setSuccess('Password reset instructions sent to your email');
  };

  if (!isOpen) return null;

  if (showSuccessScreen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#0F172A] rounded-lg w-full max-w-md p-8 relative">
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-[#22C55E] rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-white" />
            </div>
            <h2 className="text-xl font-semibold mb-4">Registration Successful!</h2>
            <p className="text-gray-400 mb-6">
              Welcome to TX Exchange! You can now start trading.
            </p>
            <button
              onClick={() => {
                setMode('login');
                setShowSuccessScreen(false);
              }}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          {mode === 'register' && (
            <button 
              onClick={() => setMode('login')}
              className="text-gray-400 hover:text-white mr-4"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <h2 className="text-xl font-semibold">
            {mode === 'login' ? 'TX Exchange Account Login' : 'Create TX Exchange Account'}
          </h2>
        </div>

        <div className="text-sm text-gray-400 mb-6">
          {mode === 'login' 
            ? 'Welcome back! Sign in with your email'
            : 'Register with your email'
          }
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
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
                className="w-full bg-[#1E293B] text-white pl-10 pr-4 py-2 rounded-lg"
                required
              />
              <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
          </div>

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
                className="w-full bg-[#1E293B] text-white pl-10 pr-10 py-2 rounded-lg"
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
                    className="w-full bg-[#1E293B] text-white pl-10 pr-10 py-2 rounded-lg"
                    required
                  />
                  <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Invite code (optional)"
                  className="w-full bg-[#1E293B] text-white px-3 py-2 rounded-lg"
                />
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

          {mode === 'login' && (
            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-400">Remember my password</span>
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-[#22C55E] hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#22C55E] hover:bg-[#16A34A] disabled:bg-gray-600 text-white py-3 rounded-lg font-medium transition-all duration-200"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <Loader2 size={20} className="animate-spin mr-2" />
                Processing...
              </div>
            ) : mode === 'login' ? 'Login' : 'Register'}
          </button>

          {mode === 'login' ? (
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-[#22C55E] hover:underline"
              >
                Register
              </button>
            </div>
          ) : (
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-[#22C55E] hover:underline"
              >
                Login
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AuthModal;