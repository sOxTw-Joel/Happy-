import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { Heart, ChevronDown } from 'lucide-react';
import { doc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase';
import { compressImage } from './utils';
import { AppConfig, DBItem, AdminRole } from './types';
import { AdminLogin } from './components/AdminLogin';
import { AdminView } from './components/AdminView';

const DEFAULT_CONFIG: AppConfig = {
  title: "¡FELIZ CUMPLE!",
  name: "Jesica",
  dedication: "Que hoy y siempre la vida te sonría, que cumplas todos tus sueños y que este año esté lleno de momentos mágicos e inolvidables. ¡Te quiero mucho!",
  envelopeEnabled: false,
  envelopeText: "Un pequeño mensaje para ti...",
  envelopePhoto: "",
  polaroidEnabled: false,
  guestPassword: "",
  guestAccessEnabled: true,
  guestAccessUsed: false,
};

const MESSAGES = [
  "¡Ya casi está listo!",
  "¡Sigue clickeando!",
  "¡Un poco más!",
  "¡No te rindas, falta poquito!",
  "¡Dale un click más!",
  "¡Casi, casi...!",
  "¡Una sorpresa te espera!",
];

export default function App() {
  const [clicks, setClicks] = useState(0);
  const [currentMessage, setCurrentMessage] = useState("");
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [backgrounds, setBackgrounds] = useState<DBItem[]>([]);
  const [polaroids, setPolaroids] = useState<DBItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Path routing: detect /admin or hash #admin
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path.startsWith('/admin') || hash === '#admin') {
        return '/admin';
      }
    }
    return '/';
  });

  // Admin authentication state
  const [authRole, setAuthRole] = useState<AdminRole>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('admin_role');
      if (saved === 'master' || saved === 'guest') {
        return saved as AdminRole;
      }
    }
    return null;
  });

  const [guestAuthPass, setGuestAuthPass] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('guest_auth_pass') || '';
    }
    return '';
  });

  const [guestAuthSessionId, setGuestAuthSessionId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('guest_auth_session_id') || '';
    }
    return '';
  });

  const [revocationNotice, setRevocationNotice] = useState<string | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path.startsWith('/admin') || hash === '#admin') {
        setCurrentPath('/admin');
      } else {
        setCurrentPath('/');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
    }
  };

  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, 'config', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data() as AppConfig);
      }
    });

    const unsubBg = onSnapshot(collection(db, 'backgrounds'), (snapshot) => {
      const bgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DBItem));
      bgs.sort((a, b) => a.order - b.order);
      setBackgrounds(bgs);
    });

    const unsubPol = onSnapshot(collection(db, 'polaroids'), (snapshot) => {
      const pols = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DBItem));
      pols.sort((a, b) => a.order - b.order);
      setPolaroids(pols);
      setLoading(false);
    });

    return () => {
      unsubConfig();
      unsubBg();
      unsubPol();
    };
  }, []);

  // Real-time security enforcement for Guest users:
  // If master revokes/blocks access, changes the password, or invalidates the session:
  useEffect(() => {
    if (authRole === 'guest' && !loading) {
      const isAccessDisabled = config.guestAccessEnabled === false;
      const currentConfigPass = config.guestPassword?.trim();
      const isPasswordChanged = Boolean(currentConfigPass && guestAuthPass && guestAuthPass !== currentConfigPass);
      const isSessionInvalidated = Boolean(config.guestSessionId && guestAuthSessionId && config.guestSessionId !== guestAuthSessionId);
      const isPasswordMissing = !currentConfigPass;

      if (isAccessDisabled || isPasswordChanged || isSessionInvalidated || isPasswordMissing) {
        // Immediately kick out the guest and clear their credentials
        sessionStorage.removeItem('admin_role');
        sessionStorage.removeItem('guest_auth_pass');
        sessionStorage.removeItem('guest_auth_session_id');
        setAuthRole(null);
        setGuestAuthPass('');
        setGuestAuthSessionId('');

        let reason = 'Tu sesión de invitado ha sido cerrada.';
        if (isAccessDisabled) {
          reason = 'El administrador maestro ha bloqueado el acceso al panel para invitados.';
        } else if (isPasswordChanged) {
          reason = 'El administrador maestro ha modificado la contraseña de acceso.';
        } else if (isSessionInvalidated) {
          reason = 'Tu sesión fue revocada por el administrador maestro.';
        }

        setRevocationNotice(reason);
      }
    }
  }, [
    authRole, 
    loading, 
    config.guestAccessEnabled, 
    config.guestPassword, 
    config.guestSessionId, 
    guestAuthPass, 
    guestAuthSessionId
  ]);

  const handleClick = () => {
    if (clicks < 5) {
      setClicks((prev) => prev + 1);
      let nextMessage = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
      while (nextMessage === currentMessage && MESSAGES.length > 1) {
        nextMessage = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
      }
      setCurrentMessage(nextMessage);
    }
  };

  const handleSaveConfig = async (newConfig: Partial<AppConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    await setDoc(doc(db, 'config', 'general'), updated);
  };

  const handleUploadBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const base64 = await compressImage(file, 1200);
        const newId = Date.now().toString() + i;
        await setDoc(doc(db, 'backgrounds', newId), {
          base64Data: base64,
          order: backgrounds.length + i,
        });
      }
    }
  };

  const handleUploadPolaroid = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const base64 = await compressImage(file, 800);
        const newId = Date.now().toString() + i;
        await setDoc(doc(db, 'polaroids', newId), {
          base64Data: base64,
          order: polaroids.length + i,
        });
      }
    }
  };

  const handleUploadEnvelope = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const base64 = await compressImage(file, 800);
      handleSaveConfig({ envelopePhoto: base64 });
    }
  };

  const deleteItem = async (col: string, id: string) => {
    await deleteDoc(doc(db, col, id));
  };

  const handleUpdatePolaroidText = async (id: string, text: string) => {
    await setDoc(doc(db, 'polaroids', id), { text }, { merge: true });
  };

  const handleLogin = (role: 'master' | 'guest', enteredPassword?: string) => {
    setAuthRole(role);
    sessionStorage.setItem('admin_role', role);
    if (role === 'guest') {
      const pass = enteredPassword || '';
      const sessId = config.guestSessionId || '';
      sessionStorage.setItem('guest_auth_pass', pass);
      sessionStorage.setItem('guest_auth_session_id', sessId);
      setGuestAuthPass(pass);
      setGuestAuthSessionId(sessId);
    }
    setRevocationNotice(null);
  };

  const handleLogout = () => {
    setAuthRole(null);
    setGuestAuthPass('');
    setGuestAuthSessionId('');
    sessionStorage.removeItem('admin_role');
    sessionStorage.removeItem('guest_auth_pass');
    sessionStorage.removeItem('guest_auth_session_id');
    setRevocationNotice(null);
  };

  const handleGuestFinish = async () => {
    const newSessionToken = Date.now().toString();
    await handleSaveConfig({
      guestAccessEnabled: false,
      guestAccessUsed: true,
      guestSessionId: newSessionToken,
    });
    setAuthRole(null);
    setGuestAuthPass('');
    setGuestAuthSessionId('');
    sessionStorage.removeItem('admin_role');
    sessionStorage.removeItem('guest_auth_pass');
    sessionStorage.removeItem('guest_auth_session_id');
    setRevocationNotice('¡Tus cambios han sido guardados con éxito! Tu acceso temporal ha finalizado.');
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-pink-50">
        <Heart size={48} className="text-pink-300 animate-pulse" />
      </div>
    );
  }

  // Admin Route handling (/admin)
  if (currentPath === '/admin') {
    if (!authRole) {
      return (
        <AdminLogin
          config={config}
          onLogin={handleLogin}
          onBackToCard={() => navigate('/')}
          revocationMessage={revocationNotice}
        />
      );
    }

    return (
      <AdminView
        config={config}
        backgrounds={backgrounds}
        polaroids={polaroids}
        handleSaveConfig={handleSaveConfig}
        handleUploadBg={handleUploadBg}
        handleUploadPolaroid={handleUploadPolaroid}
        handleUploadEnvelope={handleUploadEnvelope}
        deleteItem={deleteItem}
        handleUpdatePolaroidText={handleUpdatePolaroidText}
        authRole={authRole}
        onLogout={handleLogout}
        onViewCard={() => navigate('/')}
        onGuestFinish={handleGuestFinish}
      />
    );
  }

  const progress = (clicks / 5) * 100;
  const showExtraSections = clicks >= 5;

  return (
    <div className={`relative w-full ${showExtraSections ? 'min-h-screen h-auto pb-16' : 'h-screen overflow-hidden'} bg-pink-50 font-quicksand`}>
      {/* Main Experience Hero Section */}
      <div className={`relative ${showExtraSections ? 'min-h-[70vh] sm:min-h-[75vh] py-8' : 'h-screen min-h-[500px]'} w-full flex flex-col items-center justify-center overflow-hidden transition-all duration-700`}>
        {/* Background Blobs */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
          <div className="absolute top-10 left-10 w-24 h-24 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
          <div className="absolute top-1/2 right-20 w-16 h-16 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
        </div>

        {/* Dynamic Background Images */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)' }}>
          {backgrounds.map((bg, index) => {
            const isVisible = clicks > 0 && ((clicks - 1) % Math.max(backgrounds.length, 1) === index);
            return (
              <div
                key={bg.id}
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out"
                style={{ 
                  backgroundImage: `url(${bg.base64Data})`,
                  opacity: isVisible ? 0.4 : 0
                }}
              />
            );
          })}
        </div>

        <div className="relative z-20 flex flex-col items-center text-center px-6 w-full max-w-2xl">
          {clicks < 5 ? (
            <motion.div 
              className="flex flex-col items-center w-full"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.button
                onClick={handleClick}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="group relative focus:outline-none transition-transform cursor-pointer mb-10"
              >
                <Heart size={180} className="text-pink-600 fill-pink-500 stroke-1 drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-black text-xl pointer-events-none drop-shadow-md">CLICK</span>
                </div>
              </motion.button>

              {/* Progress Bar Container */}
              <div className="w-full max-w-md bg-white p-2 rounded-full shadow-inner border border-pink-200">
                <motion.div 
                  className="h-4 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut", duration: 0.3 }}
                />
              </div>

              {/* Message Display Area */}
              <div className="h-10 mt-6 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {currentMessage && (
                    <motion.p
                      key={currentMessage}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="text-pink-500 font-bold text-lg"
                    >
                      {currentMessage}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              className="flex flex-col items-center w-full"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 100 }}
            >
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="font-caveat text-5xl sm:text-7xl font-bold text-pink-600 mb-2 drop-shadow-sm tracking-tight"
              >
                {config.title}
              </motion.h1>
              <motion.h2 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
                className="font-caveat text-6xl sm:text-8xl font-bold text-pink-500 mb-3 drop-shadow-md tracking-wide break-all sm:break-normal"
              >
                {config.name}
              </motion.h2>

              {/* Dedicatoria justo debajo del título y nombre */}
              {config.dedication && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="font-caveat text-2xl sm:text-3xl text-pink-700 font-bold max-w-xl mx-auto leading-relaxed mb-6 px-4"
                >
                  {config.dedication}
                </motion.p>
              )}

              {(config.envelopeEnabled || (config.polaroidEnabled && polaroids.length > 0)) && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1, duration: 0.8 }}
                  className="flex flex-col items-center text-pink-400 animate-bounce cursor-pointer mt-2"
                  onClick={() => {
                    const extraSec = document.getElementById('extra-sections');
                    if (extraSec) {
                      extraSec.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase mb-1">Desliza hacia abajo</span>
                  <ChevronDown size={22} />
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Extra Interactive Sections with tight viewport-aware spacing */}
      {showExtraSections && (
        <div id="extra-sections" className="flex flex-col items-center w-full space-y-12 sm:space-y-16 pb-12">
          {config.envelopeEnabled && (
            <section className="w-full flex flex-col items-center justify-center px-4 pt-2">
              <div className="text-center mb-3">
                <h3 className="font-caveat text-4xl sm:text-5xl font-bold text-pink-500 mb-1 drop-shadow-sm">Una Carta Para Ti</h3>
                <p className="text-pink-400 text-xs sm:text-sm font-medium">Toca el sobre para descubrir su interior</p>
              </div>
              <Envelope config={config} />
            </section>
          )}

          {config.polaroidEnabled && polaroids.length > 0 && (
            <section className="w-full flex flex-col items-center justify-center px-4 pt-2 overflow-hidden">
              <h3 className="font-caveat text-4xl sm:text-5xl font-bold text-pink-500 mb-6 drop-shadow-sm text-center">Nuestros Recuerdos</h3>
              <div className="flex flex-wrap justify-center max-w-4xl gap-6 sm:gap-8">
                {polaroids.map((pol, i) => (
                  <PolaroidCard key={pol.id} item={pol} index={i} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function Envelope({ config }: { config: AppConfig }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center select-none w-full">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-[320px] h-[220px] sm:w-[380px] sm:h-[250px] cursor-pointer group flex items-center justify-center perspective-1000 mt-28 mb-4"
      >
        {/* ENVELOPE BACK */}
        <div className="absolute inset-0 bg-pink-700 rounded-b-xl rounded-t-sm shadow-xl z-0" />

        {/* LETTER (INSIDE/OUTSIDE) - Fully hidden when closed, rises when open */}
        <motion.div
          animate={isOpen ? { y: -160, opacity: 1, scale: 1 } : { y: 40, opacity: 0, scale: 0.85 }}
          transition={{ 
            y: { duration: 0.6, delay: isOpen ? 0.25 : 0 },
            opacity: { duration: 0.35, delay: isOpen ? 0.2 : 0.05 },
            scale: { duration: 0.5 }
          }}
          className={`absolute bottom-4 w-[90%] h-[380px] sm:h-[400px] bg-white rounded-xl shadow-2xl flex flex-col items-center p-5 border border-pink-100 ${isOpen ? 'z-40 pointer-events-auto' : 'z-10 pointer-events-none'}`}
        >
          {config.envelopePhoto ? (
            <div className="w-full h-48 sm:h-52 bg-pink-50/50 rounded-lg overflow-hidden mb-3 border border-pink-100 flex-shrink-0 shadow-inner flex items-center justify-center p-2">
              <img 
                src={config.envelopePhoto} 
                className="max-w-full max-h-full object-contain rounded drop-shadow-sm" 
                alt="Sorpresa" 
              />
            </div>
          ) : (
            <div className="w-full h-44 bg-pink-50 rounded-lg mb-3 flex items-center justify-center text-pink-200 flex-shrink-0 shadow-inner">
              <Heart size={40} />
            </div>
          )}
          <p className="font-caveat text-pink-600 font-bold text-center text-xl sm:text-2xl leading-relaxed overflow-y-auto w-full px-2 custom-scrollbar flex-1 flex items-center justify-center">
            {config.envelopeText}
          </p>
        </motion.div>

        {/* ENVELOPE FRONT BOTTOM/SIDES */}
        <div 
          className="absolute inset-0 z-20 pointer-events-none rounded-b-xl shadow-md"
          style={{
            background: 'linear-gradient(to top, #ec4899 0%, #f472b6 100%)',
            clipPath: 'polygon(0% 100%, 100% 100%, 100% 35%, 50% 65%, 0% 35%)'
          }}
        />

        {/* ENVELOPE FLAP (TOP) */}
        <motion.div
          animate={isOpen ? { rotateX: 180, zIndex: 5 } : { rotateX: 0, zIndex: 35 }}
          transition={{ duration: 0.5, delay: isOpen ? 0 : 0.25 }}
          style={{
            transformOrigin: 'top',
            clipPath: 'polygon(0% 0%, 100% 0%, 50% 65%)',
            background: '#db2777'
          }}
          className="absolute inset-0 pointer-events-none rounded-t-sm shadow-md"
        />

        {/* SEAL (HEART) */}
        {!isOpen && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-[42%] z-40 flex items-center justify-center w-12 h-12 bg-pink-100 rounded-full border-2 border-pink-300 shadow-md group-hover:scale-110 transition-transform"
          >
            <Heart size={20} className="text-pink-500 fill-pink-400" />
          </motion.div>
        )}
      </div>

      <p className="mt-4 text-pink-500 font-semibold tracking-wide text-xs sm:text-sm bg-pink-100/60 px-4 py-1.5 rounded-full border border-pink-200/50 shadow-sm">
        {isOpen ? "Toca el sobre para cerrarlo" : "Toca el sobre para abrirlo"}
      </p>
    </div>
  );
}

const PolaroidCard: React.FC<{ item: DBItem; index: number }> = ({ item, index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  const rotation = index % 2 === 0 ? (index % 3 + 1) * 2 : -(index % 3 + 1) * 2;
  const yOffset = (index % 2 === 0 ? 1 : -1) * 10;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, rotate: 0 }}
      animate={isInView ? { opacity: 1, y: yOffset, rotate: rotation } : {}}
      transition={{ duration: 0.8, delay: (index % 5) * 0.15, type: 'spring' }}
      whileHover={{ scale: 1.05, rotate: 0, zIndex: 50 }}
      className="bg-white p-4 pb-6 rounded-sm shadow-xl border border-gray-200 w-[260px] sm:w-[280px] h-[340px] sm:h-[360px] flex-shrink-0 cursor-pointer flex flex-col"
    >
      <div className="w-full aspect-square bg-gray-100 overflow-hidden mb-3 flex-shrink-0">
        <img src={item.base64Data} alt="Recuerdo" className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 flex items-center justify-center overflow-hidden w-full">
        {item.text ? (
          <p className="font-caveat text-center text-pink-700 font-bold text-2xl leading-tight px-1 break-words w-full line-clamp-3">{item.text}</p>
        ) : (
          <Heart size={20} className="text-pink-300 fill-pink-300" />
        )}
      </div>
    </motion.div>
  );
};
