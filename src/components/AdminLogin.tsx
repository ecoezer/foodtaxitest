import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';

interface AdminLoginProps {
  onLogin: () => void;
}

const LOCKOUT_DURATIONS = [
  5 * 60 * 1000,      // 5 minutes
  30 * 60 * 1000,     // 30 minutes
  6 * 60 * 60 * 1000  // 6 hours
];
const MAX_ATTEMPTS = 3;

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    const lockoutData = localStorage.getItem('adminLockout');
    if (lockoutData) {
      const { lockedUntil, attempts, lockoutLevel } = JSON.parse(lockoutData);
      const now = Date.now();

      if (lockedUntil > now) {
        setIsLocked(true);
        setRemainingTime(Math.ceil((lockedUntil - now) / 1000));
      } else if (attempts >= MAX_ATTEMPTS) {
        const updatedData = {
          attempts: 0,
          lockedUntil: 0,
          lockoutLevel: lockoutLevel || 0
        };
        localStorage.setItem('adminLockout', JSON.stringify(updatedData));
      }
    }
  }, []);

  useEffect(() => {
    if (isLocked && remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            const lockoutData = localStorage.getItem('adminLockout');
            if (lockoutData) {
              const data = JSON.parse(lockoutData);
              localStorage.setItem('adminLockout', JSON.stringify({
                attempts: 0,
                lockedUntil: 0,
                lockoutLevel: data.lockoutLevel || 0
              }));
            }
            setError('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isLocked, remainingTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) {
      return;
    }

    setError('');
    setIsLoading(true);

    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

    if (password === adminPassword) {
      localStorage.removeItem('adminLockout');
      localStorage.setItem('adminAuth', 'true');
      onLogin();
    } else {
      const lockoutData = localStorage.getItem('adminLockout');
      let attempts = 1;
      let currentLockoutLevel = 0;

      if (lockoutData) {
        const data = JSON.parse(lockoutData);
        attempts = data.attempts + 1;
        currentLockoutLevel = data.lockoutLevel || 0;
      }

      if (attempts >= MAX_ATTEMPTS) {
        const nextLockoutLevel = Math.min(currentLockoutLevel, LOCKOUT_DURATIONS.length - 1);
        const lockoutDuration = LOCKOUT_DURATIONS[nextLockoutLevel];
        const lockedUntil = Date.now() + lockoutDuration;

        localStorage.setItem('adminLockout', JSON.stringify({
          attempts,
          lockedUntil,
          lockoutLevel: nextLockoutLevel + 1
        }));

        setIsLocked(true);
        setRemainingTime(lockoutDuration / 1000);

        const lockoutMessages = [
          'Zu viele Fehlversuche. Login gesperrt für 5 Minuten.',
          'Zu viele Fehlversuche. Login gesperrt für 30 Minuten.',
          'Zu viele Fehlversuche. Login gesperrt für 6 Stunden.'
        ];
        setError(lockoutMessages[nextLockoutLevel]);
      } else {
        localStorage.setItem('adminLockout', JSON.stringify({
          attempts,
          lockedUntil: 0,
          lockoutLevel: currentLockoutLevel
        }));
        setError(`Falsches Passwort. ${MAX_ATTEMPTS - attempts} Versuche übrig.`);
      }

      setPassword('');
    }

    setIsLoading(false);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 px-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-orange-100 p-4 rounded-full">
            <Lock className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Admin Panel
        </h2>
        <p className="text-gray-600 text-center mb-6">
          Bestellverlauf anzeigen
        </p>

        {isLocked && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-semibold">Login gesperrt</p>
              <p className="text-red-700 text-sm mt-1">
                Verbleibende Zeit: {formatTime(remainingTime)}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passwort
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLocked}
                className={`w-full px-4 py-3 pr-12 rounded-lg border ${
                  error ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed`}
                placeholder="Admin-Passwort eingeben"
                autoFocus={!isLocked}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLocked}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {error && !isLocked && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!password || isLoading || isLocked}
            className={`w-full py-3 rounded-lg font-semibold transition-all ${
              password && !isLoading && !isLocked
                ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Wird geprüft...' : isLocked ? 'Gesperrt' : 'Anmelden'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
