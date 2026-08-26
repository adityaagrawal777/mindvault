import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, Lock, Mail, ArrowRight, Shield, Zap, FileText, ChevronLeft, Loader2, AlertCircle } from 'lucide-react';

const AuthPage = ({ initialMode = 'login', onBack }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [taglineIndex, setTaglineIndex] = useState(0);
  
  const { login, register } = useAuth();
  
  const taglines = [
    'Chat with any PDF in seconds.',
    'AI-powered document intelligence.',
    'Generate quizzes & flashcards instantly.'
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % taglines.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Reset state when switching modes
    setError(null);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  }, [isLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(username, password);
      } else {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        await register(username, password);
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        @keyframes gradient-shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .btn-shimmer {
          background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899, #6366f1);
          background-size: 300% auto;
        }
        .btn-shimmer:hover {
          animation: gradient-shimmer 3s linear infinite;
        }
      `}</style>

      {/* Left Panel - Visual/Decorative */}
      <div className="hidden lg:flex w-1/2 relative bg-slate-950 flex-col justify-between p-12 overflow-hidden border-r border-white/10">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob" />
          <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000" />
          <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-blue-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-4000" />
          
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div>
            <div className="flex items-center gap-3 mb-16">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                MindVault
              </span>
            </div>

            <div className="h-24">
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-white transition-all duration-500">
                {taglines[taglineIndex]}
              </h1>
            </div>
          </div>

          <div className="grid gap-6 mt-12">
            <div className="flex items-start gap-4 bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl hover:bg-white/10 transition-colors">
              <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Bank-grade Security</h3>
                <p className="text-slate-400 text-sm">Your documents are encrypted and fully private.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl hover:bg-white/10 transition-colors ml-8">
              <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Lightning Fast AI</h3>
                <p className="text-slate-400 text-sm">Get instant answers, summaries, and insights.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md">
          {onBack && (
            <button 
              onClick={onBack}
              className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to home</span>
            </button>
          )}

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-slate-400">
              {isLogin 
                ? 'Enter your credentials to access your account.' 
                : 'Sign up to start chatting with your documents.'}
            </p>
          </div>

          {/* Custom Tab Switcher */}
          <div className="relative flex rounded-xl bg-slate-900/50 p-1 mb-8 border border-white/5">
            <div 
              className={`absolute inset-y-1 w-[calc(50%-4px)] bg-slate-800 rounded-lg shadow-md transition-transform duration-300 ease-out border border-white/10 ${isLogin ? 'translate-x-0' : 'translate-x-[calc(100%+8px)]'}`}
            />
            <button 
              onClick={() => setIsLogin(true)} 
              className={`relative flex-1 py-2.5 text-sm font-medium z-10 transition-colors ${isLogin ? 'text-white' : 'text-slate-400 hover:text-slate-300'}`}
              type="button"
            >
              Sign In
            </button>
            <button 
              onClick={() => setIsLogin(false)} 
              className={`relative flex-1 py-2.5 text-sm font-medium z-10 transition-colors ${!isLogin ? 'text-white' : 'text-slate-400 hover:text-slate-300'}`}
              type="button"
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2 relative group">
              <div className="absolute top-[34px] left-4 flex items-center pointer-events-none z-10">
                <User className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              </div>
              <label className="block text-sm font-medium text-slate-300 ml-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="block w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300"
                placeholder="johndoe"
              />
            </div>

            <div className="space-y-2 relative group">
              <div className="absolute top-[34px] left-4 flex items-center pointer-events-none z-10">
                <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              </div>
              <label className="block text-sm font-medium text-slate-300 ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300"
                placeholder="••••••••"
              />
            </div>

            {!isLogin && (
              <div className="space-y-2 relative group animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="absolute top-[34px] left-4 flex items-center pointer-events-none z-10">
                  <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                </div>
                <label className="block text-sm font-medium text-slate-300 ml-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="block w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300"
                  placeholder="••••••••"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative group mt-8"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500 group-active:scale-95"></div>
              <div className={`relative w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium text-white transition-all duration-200 active:scale-[0.98] ${isLoading ? 'bg-indigo-600' : 'btn-shimmer'}`}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default AuthPage;
