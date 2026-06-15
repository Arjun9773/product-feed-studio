import { useState } from 'react';
import { Link } from 'react-router-dom';
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
  Mail,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await API.post('/auth/forgot-password', { email });

      setMessage(
        'Password reset link has been sent to your email address.'
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to send reset link. Please try again.'
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

          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              DigitalDataFeed
            </h1>
          </div>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold">
              Forgot Password?
            </CardTitle>

            <CardDescription className="text-sm leading-relaxed">
              No worries. Enter the email address associated with your
              account and we'll send you a secure password reset link.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />

                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-3">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Success */}
              {message && (
                <div className="flex items-start gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-3">
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending Reset Link...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>

              {/* Back */}
              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
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

export default ForgotPassword;
