import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Trash2, 
  Upload, 
  Plus, 
  Save, 
  ShieldCheck, 
  UserCheck, 
  LogOut, 
  Key, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { AppConfig, DBItem, AdminRole } from '../types';

interface AdminViewProps {
  config: AppConfig;
  backgrounds: DBItem[];
  polaroids: DBItem[];
  handleSaveConfig: (newConfig: Partial<AppConfig>) => Promise<void>;
  handleUploadBg: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleUploadPolaroid: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleUploadEnvelope: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  deleteItem: (col: string, id: string) => Promise<void>;
  handleUpdatePolaroidText: (id: string, text: string) => Promise<void>;
  authRole: 'master' | 'guest';
  onLogout: () => void;
  onViewCard: () => void;
  onSaveAndFinish: () => Promise<void>;
}

export const AdminView: React.FC<AdminViewProps> = ({
  config,
  backgrounds,
  polaroids,
  handleSaveConfig,
  handleUploadBg,
  handleUploadPolaroid,
  handleUploadEnvelope,
  deleteItem,
  handleUpdatePolaroidText,
  authRole,
  onLogout,
  onViewCard,
  onSaveAndFinish,
}) => {
  const [guestPassInput, setGuestPassInput] = useState(config.guestPassword || '');
  const [showGuestPass, setShowGuestPass] = useState(false);
  const [passSavedFeedback, setPassSavedFeedback] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Synchronize input if config changes remotely
  useEffect(() => {
    if (config.guestPassword !== undefined) {
      setGuestPassInput(config.guestPassword);
    }
  }, [config.guestPassword]);

  // Immediate security closure: If a guest has AdminView open and access is disabled, eject immediately
  useEffect(() => {
    if (authRole === 'guest' && config.guestAccessEnabled === false) {
      onLogout();
    }
  }, [authRole, config.guestAccessEnabled, onLogout]);

  // Whenever a field is typed or changed in AdminView, cardLocked is set to true
  const handleConfigChange = async (updates: Partial<AppConfig>) => {
    await handleSaveConfig({ ...updates, cardLocked: true });
  };

  // The ONLY save action: saves all changes, unlocks the card for everyone, and loses access to admin panel
  const handleSaveAndFinish = async () => {
    const msg = authRole === 'guest'
      ? '¿Deseas guardar todos los cambios y finalizar? La tarjeta quedará desbloqueada para todo el público y se cerrará tu acceso al panel admin.'
      : '¿Deseas guardar todos los cambios y finalizar? La tarjeta quedará desbloqueada para todo el público y se cerrará la sesión de administración.';

    if (window.confirm(msg)) {
      setIsFinishing(true);
      await onSaveAndFinish();
    }
  };

  const handleSaveGuestPassword = async () => {
    const trimmed = guestPassInput.trim();
    const newSessionToken = Date.now().toString();
    await handleSaveConfig({ 
      guestPassword: trimmed,
      guestSessionId: newSessionToken,
      // If setting a password and access was never enabled, we can activate it
      guestAccessEnabled: config.guestAccessEnabled ?? true,
      cardLocked: true
    });
    setPassSavedFeedback(true);
    setSaveStatus('Contraseña de invitado guardada. Se cerrará automáticamente la sesión a quien tenga el panel abierto con la clave anterior.');
    setTimeout(() => {
      setPassSavedFeedback(false);
      setSaveStatus(null);
    }, 3500);
  };

  const handleToggleGuestAccess = async (enable: boolean) => {
    const newSessionToken = Date.now().toString();
    await handleSaveConfig({ 
      guestAccessEnabled: enable,
      guestSessionId: newSessionToken,
      guestAccessUsed: enable ? false : (config.guestAccessUsed ?? false),
      cardLocked: true
    });
    setSaveStatus(
      enable 
        ? 'Acceso de invitado reactivado con éxito.' 
        : 'Acceso de invitado bloqueado: el panel se cerrará inmediatamente para cualquier invitado que lo tenga abierto.'
    );
    setTimeout(() => setSaveStatus(null), 3500);
  };

  return (
    <div className="min-h-screen w-full bg-pink-50 p-4 sm:p-8 md:p-12 font-sans overflow-y-auto">
      <div className="max-w-4xl mx-auto bg-white p-5 sm:p-8 md:p-10 rounded-3xl shadow-xl border-4 border-pink-100">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b-2 border-pink-50 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center text-pink-600 shadow-inner">
              <Star size={24} className="fill-pink-500 text-pink-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-black text-pink-600 tracking-tight">Panel /admin</h2>
                {authRole === 'master' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">
                    <ShieldCheck size={13} /> Maestro
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    <UserCheck size={13} /> Invitado
                  </span>
                )}
              </div>
              <p className="text-xs text-pink-400 font-medium">Configuración de la tarjeta de cumpleaños</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Solo 1 botón para guardar los cambios */}
            <button
              onClick={handleSaveAndFinish}
              disabled={isFinishing}
              className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-full shadow-md shadow-emerald-200 transition-all flex items-center gap-2 cursor-pointer"
              title="Guardar todos los cambios, desbloquear la tarjeta y finalizar acceso"
            >
              <Save size={16} />
              <span>{isFinishing ? 'Guardando...' : 'Guardar y Finalizar'}</span>
            </button>

            <button 
              onClick={onViewCard} 
              className="text-pink-600 hover:text-pink-700 font-bold text-xs sm:text-sm bg-pink-100 hover:bg-pink-200 px-4 py-2.5 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Ver tarjeta (solicitará contraseña por estar en modo edición)"
            >
              <Eye size={15} />
              <span>Ver Tarjeta</span>
            </button>

            <button 
              onClick={onLogout} 
              className="text-gray-500 hover:text-rose-600 font-semibold text-xs sm:text-sm bg-gray-100 hover:bg-rose-50 px-3.5 py-2.5 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>

        {/* Card Lock Status Indicator Banner */}
        <div className="mb-6 p-3.5 rounded-2xl border bg-amber-50 border-amber-200 text-amber-900 text-xs sm:text-sm flex items-center gap-2.5">
          <span className="p-1.5 bg-amber-200/70 text-amber-800 rounded-lg shrink-0">
            <Lock size={16} />
          </span>
          <div>
            <p className="font-bold">
              Modo Edición Activo: Tarjeta protegida con contraseña
            </p>
            <p className="text-xs opacity-85">
              Al abrir la web sin <strong>/admin</strong> o presionar <strong>"Ver Tarjeta"</strong> se solicitará la contraseña. Solo al presionar el botón <strong>"Guardar y Finalizar"</strong> se desbloqueará la tarjeta para todo el público y se cerrará el acceso al panel.
            </p>
          </div>
        </div>

        {/* Feedback alert if any */}
        {saveStatus && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium flex items-center gap-2 animate-fade-in">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span>{saveStatus}</span>
          </div>
        )}

        {/* Guest Banner Instruction */}
        {authRole === 'guest' && (
          <div className="mb-8 p-4 bg-gradient-to-r from-amber-50 to-pink-50 border-2 border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 shadow-sm">
            <UserCheck className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div className="text-xs sm:text-sm leading-relaxed">
              <p className="font-bold text-amber-950 mb-1">¡Bienvenido al modo de edición de invitado!</p>
              <p className="text-amber-800">
                Puedes personalizar los textos, fotos del sobre y los recuerdos Polaroid. Cuando termines todos tus cambios, presiona el botón <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Guardar y Finalizar</span> arriba para cerrar tu sesión y asegurar que la sorpresa quede guardada.
              </p>
            </div>
          </div>
        )}

        {/* Master Admin: Guest Access Control Panel */}
        {authRole === 'master' && (
          <section className="mb-10 bg-gradient-to-br from-purple-50 via-pink-50/50 to-white p-6 rounded-2xl border-2 border-purple-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <Key size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-purple-900">Control de Contraseña para Invitado</h3>
                  <p className="text-xs text-purple-600 font-medium">
                    Permite que otra persona ingrese a editar y restringe su acceso cuando termine
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {config.guestAccessEnabled ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <Unlock size={14} className="text-emerald-600" /> Acceso Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                    <Lock size={14} className="text-rose-600" /> Acceso Bloqueado / Agotado
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end mt-4">
              <div className="md:col-span-7">
                <label className="block text-xs font-bold text-purple-800 mb-1.5 uppercase tracking-wide">
                  Contraseña para el Invitado
                </label>
                <div className="relative">
                  <input
                    type={showGuestPass ? 'text' : 'password'}
                    value={guestPassInput}
                    onChange={(e) => setGuestPassInput(e.target.value)}
                    placeholder="Escribe una contraseña (ej: Amiga2026)..."
                    className="w-full pl-3.5 pr-10 py-2.5 border-2 border-purple-200 rounded-xl font-medium text-purple-950 focus:outline-none focus:border-purple-400 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGuestPass(!showGuestPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-400 hover:text-purple-600"
                  >
                    {showGuestPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="md:col-span-5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveGuestPassword}
                  className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save size={15} />
                  <span>{passSavedFeedback ? '¡Guardada!' : 'Guardar Clave'}</span>
                </button>

                {config.guestAccessEnabled ? (
                  <button
                    type="button"
                    onClick={() => handleToggleGuestAccess(false)}
                    className="py-2.5 px-3 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs rounded-xl border border-rose-300 transition-colors cursor-pointer"
                    title="Deshabilitar para que el invitado no pueda entrar"
                  >
                    Bloquear Acceso
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleToggleGuestAccess(true)}
                    className="py-2.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                    title="Permitir que el invitado vuelva a ingresar con su contraseña"
                  >
                    <Unlock size={14} />
                    <span>Reactivar Acceso</span>
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 p-2.5 bg-purple-100/50 rounded-xl text-[11px] sm:text-xs text-purple-800 leading-relaxed">
              💡 <strong>¿Cómo funciona?</strong> Dale la URL <code className="font-bold bg-white px-1.5 py-0.5 rounded text-purple-900 border border-purple-200">https://tu-dominio/admin</code> y esta contraseña a la otra persona. Cuando guarde sus cambios, el sistema <strong>bloqueará automáticamente su acceso</strong> para que ya no pueda volver a entrar, pero tú con tu contraseña maestra (<strong>Ebooster.14</strong>) siempre podrás volver a ingresar y pulsar <strong>Reactivar Acceso</strong> cuando quieras.
            </div>
          </section>
        )}

        {/* Main Text Content */}
        <section className="mb-10 bg-pink-50/50 p-6 rounded-2xl border border-pink-100">
          <h3 className="text-xl font-bold text-pink-600 mb-4">Textos Principales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-pink-500 mb-2">Título (Ej: ¡FELIZ CUMPLE!)</label>
              <input 
                type="text" 
                value={config.title} 
                onChange={(e) => handleConfigChange({ title: e.target.value })} 
                className="w-full p-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-400 font-medium text-pink-700 bg-white" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-pink-500 mb-2">Nombre</label>
              <input 
                type="text" 
                value={config.name} 
                onChange={(e) => handleConfigChange({ name: e.target.value })} 
                className="w-full p-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-400 font-medium text-pink-700 bg-white" 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-pink-500 mb-2">Dedicatoria (justo debajo del título/nombre)</label>
              <textarea 
                rows={3}
                value={config.dedication || ''} 
                onChange={(e) => handleConfigChange({ dedication: e.target.value })} 
                placeholder="Escribe aquí unas palabras bonitas de dedicatoria..."
                className="w-full p-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-400 font-medium text-pink-700 bg-white" 
              />
            </div>
          </div>
        </section>

        {/* Background Images Section */}
        <section className="mb-10 bg-pink-50/50 p-6 rounded-2xl border border-pink-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-pink-600">Fondos (Pre-carga 5 clicks)</h3>
            <label className="cursor-pointer bg-pink-500 hover:bg-pink-600 text-white text-sm font-bold py-2 px-4 rounded-full transition-colors flex items-center gap-2 shadow-sm">
              <Plus size={16}/> Añadir Fotos
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleUploadBg} />
            </label>
          </div>
          <p className="text-sm text-pink-400 mb-4">Sube las imágenes que se mostrarán difuminadas de fondo durante los clics.</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {backgrounds.map((bg: DBItem) => (
              <div key={bg.id} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-pink-200 group shadow-sm">
                <img src={bg.base64Data} className="w-full h-full object-cover" alt="Fondo" />
                <button 
                  onClick={() => deleteItem('backgrounds', bg.id)} 
                  className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  title="Eliminar foto"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {backgrounds.length === 0 && <p className="text-sm text-pink-400 col-span-5 italic">No hay fondos subidos.</p>}
          </div>
        </section>

        {/* Envelope Surprise Section */}
        <section className="mb-10 bg-pink-50/50 p-6 rounded-2xl border border-pink-100">
          <div className="flex items-center gap-4 mb-6">
            <h3 className="text-xl font-bold text-pink-600">Sección: Sobre Sorpresa</h3>
            <label className="flex items-center gap-2 cursor-pointer text-pink-500 font-bold bg-white px-3 py-1.5 rounded-full border border-pink-200 shadow-sm">
              <input 
                type="checkbox" 
                checked={config.envelopeEnabled} 
                onChange={(e) => handleConfigChange({ envelopeEnabled: e.target.checked })} 
                className="w-4 h-4 accent-pink-500" 
              />
              Activar
            </label>
          </div>
          {config.envelopeEnabled && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-pink-500 mb-2">Mensaje dentro de la carta</label>
                <textarea 
                  rows={4} 
                  value={config.envelopeText} 
                  onChange={(e) => handleConfigChange({ envelopeText: e.target.value })} 
                  className="w-full p-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-400 font-medium text-pink-700 bg-white" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-pink-500 mb-2">Fotografía interior</label>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {config.envelopePhoto && (
                    <div className="w-full sm:w-32 aspect-square rounded-xl overflow-hidden border-2 border-pink-200 shadow-sm relative group bg-white flex items-center justify-center p-1">
                      <img src={config.envelopePhoto} className="max-w-full max-h-full object-contain" alt="Interior sobre" />
                    </div>
                  )}
                  <label className="cursor-pointer bg-white border-2 border-dashed border-pink-300 hover:bg-pink-50 text-pink-500 font-bold py-2 px-4 rounded-xl transition-colors h-32 flex items-center justify-center flex-1 w-full sm:w-auto shadow-sm">
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={24} />
                      <span>{config.envelopePhoto ? 'Cambiar Fotografía' : 'Subir Fotografía'}</span>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadEnvelope} />
                  </label>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Polaroids Album Section */}
        <section className="mb-4 bg-pink-50/50 p-6 rounded-2xl border border-pink-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-bold text-pink-600">Sección: Álbum Polaroids</h3>
              <label className="flex items-center gap-2 cursor-pointer text-pink-500 font-bold bg-white px-3 py-1.5 rounded-full border border-pink-200 shadow-sm">
                <input 
                  type="checkbox" 
                  checked={config.polaroidEnabled} 
                  onChange={(e) => handleConfigChange({ polaroidEnabled: e.target.checked })} 
                  className="w-4 h-4 accent-pink-500" 
                />
                Activar
              </label>
            </div>
            {config.polaroidEnabled && (
              <label className="cursor-pointer bg-pink-500 hover:bg-pink-600 text-white text-sm font-bold py-2 px-4 rounded-full transition-colors flex items-center justify-center gap-2 shadow-sm">
                <Plus size={16}/> Subir Fotos Polaroid
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleUploadPolaroid} />
              </label>
            )}
          </div>
          {config.polaroidEnabled && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              {polaroids.map((pol: DBItem) => (
                <div key={pol.id} className="relative bg-white p-2 pb-3 shadow-md border border-pink-100 rounded-xl group flex flex-col gap-2">
                  <div className="relative">
                    <img src={pol.base64Data} className="w-full aspect-square object-cover rounded-lg bg-gray-100" alt="Recuerdo" />
                    <button 
                      onClick={() => deleteItem('polaroids', pol.id)} 
                      className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      title="Eliminar foto"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Añadir dedicatoria..." 
                    defaultValue={pol.text || ''} 
                    onBlur={(e) => handleUpdatePolaroidText(pol.id, e.target.value)}
                    className="w-full text-xs sm:text-sm p-1.5 text-center text-pink-700 bg-pink-50/50 rounded border border-transparent focus:border-pink-300 focus:bg-white focus:outline-none placeholder-pink-300"
                  />
                </div>
              ))}
              {polaroids.length === 0 && <p className="text-sm text-pink-400 col-span-4 italic">No hay fotos subidas todavía.</p>}
            </div>
          )}
        </section>

        {/* Bottom Save Bar for convenient access */}
        {/* Bottom Helper Note */}
        <div className="mt-8 pt-4 border-t-2 border-pink-50 text-center text-xs text-pink-400">
          Para guardar definitivamente todos los cambios y desbloquear la tarjeta para el público, utiliza el botón <strong>Guardar y Finalizar</strong> en la barra superior.
        </div>

      </div>
    </div>
  );
};
