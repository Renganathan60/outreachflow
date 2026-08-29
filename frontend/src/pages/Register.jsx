import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, User, Shield, ArrowRight } from 'lucide-react';
import Input from '../components/common/Input.jsx';
import Select from '../components/common/Select.jsx';
import Button from '../components/common/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('SALES_USER');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register(name, email, password, role);
      success('Account created successfully! Welcome to OutreachFlow.');
      navigate('/dashboard');
    } catch (err) {
      error(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-100/60 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 mb-4">
            <Zap className="w-6 h-6 fill-white text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">OutreachFlow</h1>
          <p className="text-xs text-slate-500 mt-1">
            Register for outbound sales campaign workspace
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200/80">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Create your workspace account</h2>
          <p className="text-xs text-slate-500 mb-6">Start discovering and prioritizing high-intent leads.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="e.g. Sarah Connor"
              icon={User}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Work Email Address"
              type="email"
              placeholder="sarah@outreachflow.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Select
              label="Account Role (RBAC)"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={[
                { value: 'SALES_USER', label: 'Sales User (Manage Leads & Outreach)' },
                { value: 'ADMIN', label: 'Admin (Full System & User Control)' },
              ]}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              icon={ArrowRight}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
