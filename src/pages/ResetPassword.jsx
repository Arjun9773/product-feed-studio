import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import API from '../hooks/useApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '../components/ui/card';

import {
  Rss,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { token } = useParams();
  const navigate = useNavigate();

  const getPasswordStrength = () => {
    if (password.length < 6)
      return {
        text: 'Weak',
        color: 'text-red-500'
      };

    if (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password)
    ) {
      return {
        text: 'Strong',
        color: 'text-green-500'
      };
    }

    return {
      text: 'Medium',
      color: 'text-yellow-500'
    };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await API.post(`/auth/reset-password/${token}`, {
        password
      });

      setMessage(
        'Password reset successful. Redirecting to login...'
      );

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Reset failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
            <Rss className="w-6 h-6 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            DigitalDataFeed
          </h1>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              Reset Password
            </CardTitle>

            <CardDescription>
              Create a new secure password for your account.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  New Password
                </Label>

                <div className="relative">
                  <Input
                    id="password"
                    type={
                      showPassword ? 'text' : 'password'
                    }
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    className="pr-10"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>

                {password && (
                  <p
                    className={`text-xs font-medium ${strength.color}`}
                  >
                    Password Strength: {strength.text}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm Password
                </Label>

                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={
                      showConfirmPassword
                        ? 'text'
                        : 'password'
                    }
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    className="pr-10"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Success */}
              {message && (
                <div className="flex gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
                  <CheckCircle size={16} />
                  <span>{message}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default ResetPassword;
