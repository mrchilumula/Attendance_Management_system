import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  Users, 
  BookOpen,
  Shield,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

type UserRole = 'admin' | 'faculty' | 'student' | null;

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [showForm, setShowForm] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Remember email if checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      await login(email, password);
      toast.success('Welcome back! 🎉', {
        icon: '👋',
        duration: 3000,
      });
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setShowForm(true);
    
    // Auto-fill demo credentials based on role
    switch (role) {
      case 'admin':
        setEmail('admin@crrit.edu.in');
        setPassword('password123');
        break;
      case 'faculty':
        setEmail('rajesh.kumar@crrit.edu.in');
        setPassword('password123');
        break;
      case 'student':
        setEmail('21cs1a01@crrit.edu.in');
        setPassword('password123');
        break;
    }
  };

  const handleBackToRoles = () => {
    setShowForm(false);
    setSelectedRole(null);
    setEmail('');
    setPassword('');
  };

  const roles = [
    { 
      id: 'admin', 
      label: 'Administrator', 
      icon: Shield, 
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-600',
      description: 'Manage students, faculty & system'
    },
    { 
      id: 'faculty', 
      label: 'Faculty', 
      icon: BookOpen, 
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-600',
      description: 'Take attendance & view reports'
    },
    { 
      id: 'student', 
      label: 'Student', 
      icon: User, 
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-600',
      description: 'View attendance & courses'
    },
  ];

  const selectedRoleData = roles.find(r => r.id === selectedRole);

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
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {/* Floating icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <GraduationCap className="absolute top-20 left-20 w-12 h-12 text-white/10 animate-bounce" style={{ animationDuration: '3s' }} />
        <BookOpen className="absolute top-40 right-32 w-10 h-10 text-white/10 animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
        <Users className="absolute bottom-32 left-32 w-14 h-14 text-white/10 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1s' }} />
        <Shield className="absolute bottom-20 right-20 w-8 h-8 text-white/10 animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-8 py-6 text-white text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur rounded-2xl mb-4 shadow-lg">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-xl font-bold">CR Rao Institute of Technology</h1>
            <p className="text-orange-100 text-sm mt-1">Attendance Management System</p>
          </div>

          <div className="p-8">
            {!showForm ? (
              /* Role Selection */
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Welcome Back!</h2>
                  <p className="text-gray-500 text-sm mt-1">Select your role to continue</p>
                </div>

                <div className="space-y-3">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    return (
                      <button
                        key={role.id}
                        onClick={() => handleRoleSelect(role.id as UserRole)}
                        className={`w-full p-4 rounded-xl border-2 ${role.borderColor} ${role.bgColor} 
                          hover:shadow-lg hover:scale-[1.02] transition-all duration-300 
                          flex items-center gap-4 group`}
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.color} 
                          flex items-center justify-center shadow-lg 
                          group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`font-semibold ${role.textColor}`}>{role.label}</p>
                          <p className="text-xs text-gray-500">{role.description}</p>
                        </div>
                        <ArrowRight className={`w-5 h-5 ${role.textColor} opacity-0 group-hover:opacity-100 
                          group-hover:translate-x-1 transition-all`} />
                      </button>
                    );
                  })}
                </div>

                {/* Quick tip */}
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs text-amber-700">
                    <strong>💡 Demo Mode:</strong> Click any role to auto-fill demo credentials
                  </p>
                </div>
              </div>
            ) : (
              /* Login Form */
              <div className="space-y-5">
                {/* Selected role indicator */}
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={handleBackToRoles}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Back to role selection"
                  >
                    <ArrowRight className="w-5 h-5 text-gray-400 rotate-180" />
                  </button>
                  <div className={`flex items-center gap-3 flex-1 p-3 rounded-xl ${selectedRoleData?.bgColor} ${selectedRoleData?.borderColor} border`}>
                    {selectedRoleData && (
                      <>
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${selectedRoleData.color} flex items-center justify-center`}>
                          <selectedRoleData.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className={`font-medium text-sm ${selectedRoleData.textColor}`}>
                            Logging in as {selectedRoleData.label}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                        placeholder="Enter your email"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 
                        group-focus-within:text-orange-500 transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-xl 
                          focus:border-orange-500 focus:ring-4 focus:ring-orange-100 
                          transition-all outline-none text-gray-800"
                        placeholder="Enter your password"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 transform -translate-y-1/2 
                          text-gray-400 hover:text-gray-600 transition-colors p-1"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember me & Forgot password */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-5 h-5 border-2 border-gray-300 rounded 
                          peer-checked:border-orange-500 peer-checked:bg-orange-500 
                          transition-all flex items-center justify-center">
                          {rememberMe && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                      <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                        Remember me
                      </span>
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3.5 rounded-xl font-semibold text-white 
                      bg-gradient-to-r ${selectedRoleData?.color || 'from-orange-500 to-amber-600'} 
                      hover:shadow-lg hover:shadow-orange-500/30 
                      active:scale-[0.98] transition-all duration-200 
                      flex items-center justify-center gap-2
                      disabled:opacity-70 disabled:cursor-not-allowed`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                {/* Demo credentials hint */}
                <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 text-center">
                    <strong>Demo credentials auto-filled.</strong> Just click Sign In!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-sm mt-6">
          © 2025 CR Rao Institute of Technology. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
