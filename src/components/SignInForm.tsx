
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Button from './Button';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SignInFormProps {
  mode: 'signin' | 'signup';
  onToggleMode: () => void;
  onClose?: () => void;
}

const SignInForm: React.FC<SignInFormProps> = ({ mode, onToggleMode, onClose }) => {
  const { toast } = useToast();
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (mode === 'signin') {
        await signIn(formData.email, formData.password);
        if (onClose) onClose();
        
        // After signing in, let the auth state change handler in AuthContext handle the redirect
        // The router protection will automatically redirect to the appropriate page
      } else {
        await signUp(formData.email, formData.password);
        toast({
          title: "Account created!",
          description: "Please check your email to confirm your account.",
        });
        if (onClose) onClose();
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-medium text-pi mb-2">
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </h2>
        <p className="text-pi-muted">
          {mode === 'signin' 
            ? 'Welcome back. Enter your credentials to continue.' 
            : 'Join Private Investigation Enterprises today.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-pi">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-pi placeholder-pi-muted/50 focus:outline-none focus:ring-2 focus:ring-pi-focus/50 transition-all"
            placeholder="Enter your email"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-pi">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-pi placeholder-pi-muted/50 focus:outline-none focus:ring-2 focus:ring-pi-focus/50 transition-all pr-12"
              placeholder="Enter your password"
            />
            <button 
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-pi-muted hover:text-pi transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {mode === 'signin' && (
          <div className="text-right">
            <button type="button" className="text-sm text-pi-focus hover:underline">
              Forgot password?
            </button>
          </div>
        )}

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full flex items-center justify-center gap-2 group"
            size="lg"
            isLoading={isLoading}
          >
            {mode === 'signin' ? (
              <>
                <LogIn size={18} className="group-hover:translate-x-0.5 transition-transform" />
                Sign In
              </>
            ) : (
              <>
                <UserPlus size={18} className="group-hover:translate-y-[-2px] transition-transform" />
                Create Account
              </>
            )}
          </Button>
        </div>

        <div className="text-center mt-6">
          <p className="text-pi-muted">
            {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              onClick={onToggleMode}
              className="ml-2 text-pi-focus hover:underline"
            >
              {mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default SignInForm;
