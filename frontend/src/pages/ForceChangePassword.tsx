import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  Shield, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  ArrowRight,
  GraduationCap
} from 'lucide-react';

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
  met: boolean;
}

const ForceChangePassword: React.FC = () => {
  const { user, completePasswordChange, logout } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordRequirements: PasswordRequirement[] = [
    { label: 'At least 8 characters', test: (p: string) => p.length >= 8, met: false },
    { label: 'One uppercase letter (A-Z)', test: (p: string) => /[A-Z]/.test(p), met: false },
    { label: 'One lowercase letter (a-z)', test: (p: string) => /[a-z]/.test(p), met: false },
    { label: 'One number (0-9)', test: (p: string) => /[0-9]/.test(p), met: false },
    { label: 'One special character (!@#$%^&*)', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p), met: false },
  ].map(req => ({ ...req, met: req.test(newPassword) }));

  const allRequirementsMet = passwordRequirements.every(r => r.met);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allRequirementsMet) {
      toast.error('Please meet all password requirements');
      return;
    }

    if (!passwordsMatch) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/force-change-password', { newPassword });
      toast.success('Password changed successfully! 🎉');
      completePasswordChange();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to change password';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const metCount = passwordRequirements.filter(r => r.met).length;
    if (metCount === 0) return { label: '', color: '', width: '0%' };
    if (metCount <= 2) return { label: 'Weak', color: 'bg-red-500', width: '33%' };
    if (metCount <= 4) return { label: 'Medium', color: 'bg-yellow-500', width: '66%' };
    return { label: 'Strong', color: 'bg-green-500', width: '100%' };
  };

  const strength = getPasswordStrength();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url('https://lh3.googleusercontent.com/gps-cs-s/AG0ilSwwAcyGAESJI0dF8uvDBcery47oitCOXio8hGI2XOWkg94_Psfh0gPHi1aB_Ppa86jQZ0D_gvNBbVjVkO0BT-EwJC6gamvRR_12vjEb6kqBKRV6s-9GdiuSQl5IwHlIK0-MJ4aivg=s1360-w1360-h1020-rw')` 
        }}
      />
      {/* Dark overlay - subtle for readability */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-6 text-white text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur rounded-2xl mb-4 shadow-lg">
              <Shield className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-xl font-bold">Security Update Required</h1>
            <p className="text-amber-100 text-sm mt-1">Create a strong password to continue</p>
          </div>

          <div className="p-8">
            {/* Welcome message */}
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Welcome, {user?.firstName}!
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    For your security, you must change your password before accessing the system.
                    This is a one-time requirement.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  New Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 
                    group-focus-within:text-orange-500 transition-colors" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-xl 
                      focus:border-orange-500 focus:ring-4 focus:ring-orange-100 
                      transition-all outline-none text-gray-800"
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 transform -translate-y-1/2 
                      text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password strength meter */}
                {newPassword.length > 0 && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${strength.color} transition-all duration-300`}
                        style={{ width: strength.width }}
                      />
                    </div>
                    <p className={`text-xs mt-1 ${
                      strength.label === 'Weak' ? 'text-red-600' : 
                      strength.label === 'Medium' ? 'text-yellow-600' : 
                      strength.label === 'Strong' ? 'text-green-600' : ''
                    }`}>
                      {strength.label && `Password strength: ${strength.label}`}
                    </p>
                  </div>
                )}
              </div>

              {/* Password requirements */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-600 mb-3">Password Requirements:</p>
                <div className="space-y-2">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {req.met ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-300" />
                      )}
                      <span className={`text-xs ${req.met ? 'text-green-700' : 'text-gray-500'}`}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 
                    group-focus-within:text-orange-500 transition-colors" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-11 pr-12 py-3 border-2 rounded-xl 
                      focus:ring-4 transition-all outline-none text-gray-800 ${
                        confirmPassword.length > 0
                          ? passwordsMatch
                            ? 'border-green-500 focus:border-green-500 focus:ring-green-100'
                            : 'border-red-300 focus:border-red-500 focus:ring-red-100'
                          : 'border-gray-200 focus:border-orange-500 focus:ring-orange-100'
                      }`}
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 transform -translate-y-1/2 
                      text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Passwords do not match
                  </p>
                )}
                {passwordsMatch && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Passwords match
                  </p>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading || !allRequirementsMet || !passwordsMatch}
                className="w-full py-3.5 rounded-xl font-semibold text-white 
                  bg-gradient-to-r from-orange-500 to-red-500
                  hover:shadow-lg hover:shadow-orange-500/30 
                  active:scale-[0.98] transition-all duration-200 
                  flex items-center justify-center gap-2
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Set New Password</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Logout option */}
            <div className="mt-6 text-center">
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Sign out and use a different account
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 mt-6 text-white/60">
          <GraduationCap className="w-4 h-4" />
          <p className="text-sm">CR Rao Institute of Technology</p>
        </div>
      </div>
    </div>
  );
};

export default ForceChangePassword;
