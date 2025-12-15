import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle,
  GraduationCap,
  Shield,
  ArrowRight,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
  met: boolean;
}

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [userInfo, setUserInfo] = useState<{ email: string; firstName: string } | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const passwordRequirements: PasswordRequirement[] = [
    { label: 'At least 8 characters', test: (p: string) => p.length >= 8, met: false },
    { label: 'One uppercase letter (A-Z)', test: (p: string) => /[A-Z]/.test(p), met: false },
    { label: 'One lowercase letter (a-z)', test: (p: string) => /[a-z]/.test(p), met: false },
    { label: 'One number (0-9)', test: (p: string) => /[0-9]/.test(p), met: false },
    { label: 'One special character (!@#$%^&*)', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p), met: false },
  ].map(req => ({ ...req, met: req.test(newPassword) }));

  const allRequirementsMet = passwordRequirements.every(r => r.met);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenError('No reset token provided. Please request a new password reset.');
        setIsVerifying(false);
        return;
      }

      try {
        const response = await api.post('/auth/verify-reset-token', { token });
        setUserInfo(response.data.data);
        setIsVerifying(false);
      } catch (error: any) {
        setTokenError(error.response?.data?.error || 'Invalid or expired token');
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

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
      await api.post('/auth/reset-password', { token, newPassword });
      setIsSuccess(true);
      toast.success('Password reset successfully! 🎉');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reset password');
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

  // Loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url('https://lh3.googleusercontent.com/gps-cs-s/AG0ilSwwAcyGAESJI0dF8uvDBcery47oitCOXio8hGI2XOWkg94_Psfh0gPHi1aB_Ppa86jQZ0D_gvNBbVjVkO0BT-EwJC6gamvRR_12vjEb6kqBKRV6s-9GdiuSQl5IwHlIK0-MJ4aivg=s1360-w1360-h1020-rw')` 
          }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Verifying reset token...</p>
        </div>
      </div>
    );
  }

  // Token error state
  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url('https://lh3.googleusercontent.com/gps-cs-s/AG0ilSwwAcyGAESJI0dF8uvDBcery47oitCOXio8hGI2XOWkg94_Psfh0gPHi1aB_Ppa86jQZ0D_gvNBbVjVkO0BT-EwJC6gamvRR_12vjEb6kqBKRV6s-9GdiuSQl5IwHlIK0-MJ4aivg=s1360-w1360-h1020-rw')` 
          }}
        />
        <div className="absolute inset-0 bg-black/40" />
        
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Invalid Reset Link</h2>
            <p className="text-gray-600 mb-6">{tokenError}</p>

            <div className="space-y-3">
              <Link 
                to="/forgot-password"
                className="block w-full py-3 rounded-xl font-semibold text-white 
                  bg-gradient-to-r from-orange-500 to-amber-600
                  hover:shadow-lg transition-all"
              >
                Request New Reset Link
              </Link>
              
              <Link 
                to="/login"
                className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 transition-colors py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to Login</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url('https://lh3.googleusercontent.com/gps-cs-s/AG0ilSwwAcyGAESJI0dF8uvDBcery47oitCOXio8hGI2XOWkg94_Psfh0gPHi1aB_Ppa86jQZ0D_gvNBbVjVkO0BT-EwJC6gamvRR_12vjEb6kqBKRV6s-9GdiuSQl5IwHlIK0-MJ4aivg=s1360-w1360-h1020-rw')` 
          }}
        />
        <div className="absolute inset-0 bg-black/40" />
        
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Password Reset Complete!</h2>
            <p className="text-gray-600 mb-6">
              Your password has been successfully reset. You can now log in with your new password.
            </p>

            <Link 
              to="/login"
              className="block w-full py-3.5 rounded-xl font-semibold text-white 
                bg-gradient-to-r from-orange-500 to-amber-600
                hover:shadow-lg hover:shadow-orange-500/30 transition-all
                flex items-center justify-center gap-2"
            >
              <span>Continue to Login</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          
          <div className="flex items-center justify-center gap-2 mt-6 text-white/60">
            <GraduationCap className="w-4 h-4" />
            <p className="text-sm">CR Rao Institute of Technology</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url('https://lh3.googleusercontent.com/gps-cs-s/AG0ilSwwAcyGAESJI0dF8uvDBcery47oitCOXio8hGI2XOWkg94_Psfh0gPHi1aB_Ppa86jQZ0D_gvNBbVjVkO0BT-EwJC6gamvRR_12vjEb6kqBKRV6s-9GdiuSQl5IwHlIK0-MJ4aivg=s1360-w1360-h1020-rw')` 
        }}
      />
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-8 py-6 text-white text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur rounded-2xl mb-4 shadow-lg">
              <Shield className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-xl font-bold">Reset Your Password</h1>
            <p className="text-orange-100 text-sm mt-1">Create a new secure password</p>
          </div>

          <div className="p-8">
            {/* User info */}
            {userInfo && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Resetting password for {userInfo.firstName}
                    </p>
                    <p className="text-xs text-green-600">{userInfo.email}</p>
                  </div>
                </div>
              </div>
            )}

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
                  bg-gradient-to-r from-orange-500 to-amber-600
                  hover:shadow-lg hover:shadow-orange-500/30 
                  active:scale-[0.98] transition-all duration-200 
                  flex items-center justify-center gap-2
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Resetting Password...</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <Link 
                to="/login"
                className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to Login</span>
              </Link>
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

export default ResetPassword;
