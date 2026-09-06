import React, { useState } from 'react';
import { Lock, Eye, EyeOff, KeyRound, ArrowLeft, Sparkles, Heart } from 'lucide-react';
import { AppConfig } from '../types';

interface CardLockGateProps {
  config: AppConfig;
  onUnlock: () => void;
  onGoToAdmin: () => void;
}

const MASTER_PASSWORD = "Ebooster.14";

export const CardLockGate: React.FC<CardLockGateProps> = ({
  config,
  onUnlock,
  onGoToAdmin,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = password.trim();
    if (!trimmed) {
      setError('Por favor ingresa la contraseña para visualizar la tarjeta.');
      return;
    }

    const currentGuestPass = config.guestPassword?.trim();

    // Check if entered password matches Master password or current Guest password
    const isMaster = trimmed === MASTER_PASSWORD;
    const isGuest = Boolean(currentGuestPass && trimmed === currentGuestPass);

    if (isMaster || isGuest) {
      onUnlock();
    } else {
      setError('Contraseña incorrecta. Usa la misma contraseña de /admin para poder visualizar la tarjeta.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center p-4 font-quicksand">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-4 border-pink-100 p-6 sm:p-8 relative overflow-hidden">
        {/* Decorative Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500" />

        {/* Center Badge Icon */}
        <div className="flex justify-center mb-5">
          <div className="relative">
            <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center border-4 border-white shadow-md">
              <Heart className="text-pink-500 fill-pink-400 animate-pulse" size={36} />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-pink-600 text-white p-2 rounded-full border-2 border-white shadow-sm">
              <Lock size={16} />
            </div>
          </div>
        </div>

        {/* Title and Description */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-700 mb-2">
            <Sparkles size={13} />
            <span>Tarjeta en Edición</span>
          </div>
          <h2 className="text-2xl font-black text-pink-600 tracking-tight mb-2">
            Tarjeta Protegida
          </h2>
          <p className="text-xs sm:text-sm text-pink-800/80 leading-relaxed font-medium">
            Hay cambios en edición o sin guardar en el panel de administración. Para visualizar la tarjeta, ingresa la contraseña de acceso (la misma que usas para <strong>/admin</strong>):
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs sm:text-sm font-medium">
            {error}
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-pink-700 mb-1.5 uppercase tracking-wider">
              Contraseña de Acceso
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pink-400">
                <KeyRound size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa la contraseña..."
                className="w-full pl-10 pr-10 py-3 border-2 border-pink-200 rounded-2xl font-medium text-pink-900 focus:outline-none focus:border-pink-400 transition-colors bg-pink-50/30"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-pink-400 hover:text-pink-600 cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-98 text-white font-bold rounded-2xl shadow-lg shadow-pink-200 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
          >
            <Lock size={18} />
            <span>Desbloquear y Ver Tarjeta</span>
          </button>
        </form>

        {/* Back to Admin Panel */}
        <div className="mt-5 pt-4 border-t border-pink-100 text-center">
          <button
            onClick={onGoToAdmin}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-pink-600 hover:text-pink-800 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Ir al panel /admin para guardar cambios</span>
          </button>
        </div>
      </div>
    </div>
  );
};
