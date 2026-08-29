import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, ArrowRight } from 'lucide-react';
import Input from '../components/common/Input.jsx';
import Button from '../components/common/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Login() {
  const [email, setEmail] = useState('admin@outreachflow.com');
  const [password, setPassword] = useState('Password123!');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      success('Welcome back to OutreachFlow!');
      navigate('/dashboard');
    } catch (err) {
      error(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Subtle light background glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-100/60 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 mb-4">
            <Zap className="w-6 h-6 fill-white text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">OutreachFlow</h1>
          <p className="text-xs text-slate-500 mt-1">
            Intelligent B2B Outbound & Campaign Management SaaS
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200/80">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Sign in to your account</h2>
          <p className="text-xs text-slate-500 mb-6">Enter your credentials to access your outreach workspace.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              icon={ArrowRight}
            >
              Sign In to Workspace
            </Button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-2.5 text-center">
              Quick Demo Accounts (Pre-seeded in MySQL):
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@outreachflow.com')}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-200 text-left transition-colors"
              >
                <p className="text-[11px] font-bold text-indigo-700">Admin User</p>
                <p className="text-[10px] text-slate-500 truncate">admin@outreachflow.com</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('sarah.sales@outreachflow.com')}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-200 text-left transition-colors"
              >
                <p className="text-[11px] font-bold text-emerald-700">Sales Rep</p>
                <p className="text-[10px] text-slate-500 truncate">sarah.sales@outreachflow.com</p>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Create one now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
