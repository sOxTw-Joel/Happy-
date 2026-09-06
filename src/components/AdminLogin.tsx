import React, { useState } from 'react';
import { Star, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { AppConfig, AdminRole } from '../types';

interface AdminLoginProps {
  config: AppConfig;
  onLogin: (role: 'master' | 'guest') => void;
  onBackToCard: () => void;
}

const MASTER_PASSWORD = "Ebooster.14";

export const AdminLogin: React.FC<AdminLoginProps> = ({ config, onLogin, onBackToCard }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = password.trim();
    if (!trimmed) {
      setError('Por favor ingresa una contraseña.');
      return;
    }

    if (trimmed === MASTER_PASSWORD) {
      onLogin('master');
      return;
    }

    const currentGuestPass = config.guestPassword?.trim();
    if (currentGuestPass && trimmed === currentGuestPass) {
      if (config.guestAccessEnabled === false) {
        setError(
          'Esta contraseña de invitado ya fue utilizada o el acceso está deshabilitado. Solicita al administrador maestro que vuelva a habilitar tu acceso.'
        );
        return;
      }
      onLogin('guest');
      return;
    }

    setError('Contraseña incorrecta. Por favor, inténtalo de nuevo.');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-4 border-pink-100 p-8 relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500" />

        {/* Header Icon with Star and Lock */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center border-4 border-white shadow-md">
              <Star className="text-pink-500 fill-pink-400" size={36} />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-pink-600 text-white p-2 rounded-full border-2 border-white shadow-sm">
              <Lock size={16} />
            </div>
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-pink-600 tracking-tight">Panel de Administración</h1>
          <p className="text-sm text-pink-400 mt-1 font-medium">
            Acceso seguro a la configuración de la tarjeta
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-700 text-xs sm:text-sm font-medium">
            <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-pink-600 uppercase tracking-wider mb-2">
              Contraseña de Acceso
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pink-400">
                <KeyRound size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ingresa la contraseña..."
                autoFocus
                className="w-full pl-10 pr-11 py-3 border-2 border-pink-200 rounded-xl font-medium text-pink-800 placeholder-pink-300 focus:outline-none focus:border-pink-500 transition-colors bg-pink-50/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-pink-400 hover:text-pink-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-pink-500 hover:bg-pink-600 active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-pink-200 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Lock size={16} />
            <span>Ingresar al Panel</span>
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-pink-100 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onBackToCard}
            className="text-xs sm:text-sm font-bold text-pink-500 hover:text-pink-700 transition-colors flex items-center gap-1.5 cursor-pointer py-1 px-3 rounded-lg hover:bg-pink-50"
          >
            <ArrowLeft size={16} />
            <span>Volver a la Tarjeta de Cumpleaños</span>
          </button>

          <p className="text-[11px] text-pink-300 text-center leading-relaxed">
            Ruta protegida para administración. Las modificaciones se sincronizan en tiempo real.
          </p>
        </div>
      </div>
    </div>
  );
};
