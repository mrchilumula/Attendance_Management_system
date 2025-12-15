import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Mail, 
  ArrowLeft, 
  Send, 
  CheckCircle2,
  GraduationCap,
  Shield,
  Clock,
  AlertCircle
} from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.endsWith('@crrit.edu.in')) {
      toast.error('Please use your official @crrit.edu.in email');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setIsSubmitted(true);
      
      // For demo purposes - in production, token would be sent via email
      if (response.data.resetToken) {
        setResetToken(response.data.resetToken);
      }
      
      toast.success('Reset instructions sent!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to process request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url('https://lh3.googleusercontent.com/gps-cs-s/AG0ilSwwAcyGAESJI0dF8uvDBcery47oitCOXio8hGI2XOWkg94_Psfh0gPHi1aB_Ppa86jQZ0D_gvNBbVjVkO0BT-EwJC6gamvRR_12vjEb6kqBKRV6s-9GdiuSQl5IwHlIK0-MJ4aivg=s1360-w1360-h1020-rw')` 
        }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Animated background elements */}
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
            <h1 className="text-xl font-bold">Forgot Password?</h1>
            <p className="text-orange-100 text-sm mt-1">We'll help you recover your account</p>
          </div>

          <div className="p-8">
            {!isSubmitted ? (
              <>
                {/* Instructions */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-blue-800">
                        Enter your registered email address and we'll send you instructions to reset your password.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 
                        group-focus-within:text-orange-500 transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl 
                          focus:border-orange-500 focus:ring-4 focus:ring-orange-100 
                          transition-all outline-none text-gray-800"
                        placeholder="yourname@crrit.edu.in"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">
                      Use your official @crrit.edu.in email address
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl font-semibold text-white 
                      bg-gradient-to-r from-orange-500 to-amber-600
                      hover:shadow-lg hover:shadow-orange-500/30 
                      active:scale-[0.98] transition-all duration-200 
                      flex items-center justify-center gap-2
                      disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Send Reset Instructions</span>
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* Success State */
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Check Your Email</h2>
                <p className="text-gray-600 mb-6">
                  We've sent password reset instructions to<br />
                  <strong className="text-gray-800">{email}</strong>
                </p>

                {/* Demo Token Display - Remove in production */}
                {resetToken && (
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-left">
                    <p className="text-xs font-medium text-amber-800 mb-2">
                      🔐 Demo Mode - Reset Token:
                    </p>
                    <code className="text-xs bg-amber-100 px-2 py-1 rounded break-all block">
                      {resetToken}
                    </code>
                    <Link 
                      to={`/reset-password?token=${resetToken}`}
                      className="mt-3 inline-flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Click here to reset password →
                    </Link>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
                  <Clock className="w-4 h-4" />
                  <span>Link expires in 1 hour</span>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-500">
                    Didn't receive the email?
                  </p>
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setResetToken(null);
                    }}
                    className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                  >
                    Try again with a different email
                  </button>
                </div>
              </div>
            )}

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

export default ForgotPassword;
