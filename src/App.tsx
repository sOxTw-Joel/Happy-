import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { Heart, Star, Trash2, Upload, Plus, Save } from 'lucide-react';
import { doc, setDoc, deleteDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase';
import { compressImage } from './utils';

// Types
interface AppConfig {
  title: string;
  name: string;
  envelopeEnabled: boolean;
  envelopeText: string;
  envelopePhoto: string;
  polaroidEnabled: boolean;
}

const DEFAULT_CONFIG: AppConfig = {
  title: "¡FELIZ CUMPLE!",
  name: "Jesica",
  envelopeEnabled: false,
  envelopeText: "Un pequeño mensaje para ti...",
  envelopePhoto: "",
  polaroidEnabled: false,
};

interface DBItem {
  id: string;
  base64Data: string;
  order: number;
  text?: string;
}

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
  const [view, setView] = useState<'main' | 'admin'>('main');

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


  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-pink-50">
        <Heart size={48} className="text-pink-300 animate-pulse" />
      </div>
    );
  }

  if (view === 'admin') {
    return <AdminView config={config} backgrounds={backgrounds} polaroids={polaroids} handleSaveConfig={handleSaveConfig} handleUploadBg={handleUploadBg} handleUploadPolaroid={handleUploadPolaroid} handleUploadEnvelope={handleUploadEnvelope} deleteItem={deleteItem} handleUpdatePolaroidText={handleUpdatePolaroidText} onClose={() => setView('main')} />;
  }

  const progress = (clicks / 5) * 100;
  const showExtraSections = clicks >= 5;

  return (
    <div className={`relative w-full ${showExtraSections ? 'min-h-screen h-auto pb-24' : 'h-screen overflow-hidden'} bg-pink-50 font-quicksand`}>
      
      <button 
        onClick={() => setView('admin')}
        className="fixed bottom-4 left-4 z-50 p-4 opacity-5 hover:opacity-100 transition-opacity focus:outline-none"
      >
        <Star size={24} className="text-pink-600" />
      </button>

      {/* Main Experience Hero Section */}
      <div className="relative h-screen min-h-[600px] w-full flex flex-col items-center justify-center overflow-hidden">
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

        <div className="relative z-20 flex flex-col items-center text-center px-10 w-full max-w-2xl">
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
                className="group relative focus:outline-none transition-transform cursor-pointer mb-12"
              >
                <Heart size={192} className="text-pink-600 fill-pink-500 stroke-1 drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-black text-xl pointer-events-none drop-shadow-md">CLICK</span>
                </div>
              </motion.button>

              <div className="w-full max-w-md mb-8">
                <div className="flex justify-between mb-2 px-2">
                  <span className="text-pink-600 font-bold text-sm tracking-widest uppercase">Progreso de Regalo</span>
                  <span className="text-pink-600 font-bold text-sm">{Math.round(progress)}%</span>
                </div>
                <div className="h-6 w-full bg-white border-4 border-pink-200 rounded-full overflow-hidden p-1 shadow-inner">
                  <motion.div 
                    className="h-full bg-pink-500 rounded-full shadow-sm"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
              </div>

              <div className="h-16">
                <AnimatePresence mode="wait">
                  {clicks > 0 && (
                    <motion.p
                      key={clicks}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-2xl font-bold text-pink-400 bg-white/80 px-6 py-2 rounded-full shadow-sm border-2 border-pink-100 inline-block"
                    >
                      {currentMessage}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3, type: 'spring', bounce: 0.4 }}
              className="flex flex-col items-center text-center px-4 sm:px-10 w-full"
            >
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="font-caveat text-6xl sm:text-7xl font-bold text-pink-600 mb-2 drop-shadow-sm tracking-tight"
              >
                {config.title}
              </motion.h1>
              
              <motion.h2 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                className="font-caveat text-7xl sm:text-8xl font-bold text-pink-500 mb-8 drop-shadow-md tracking-wide break-all sm:break-normal"
              >
                {config.name}
              </motion.h2>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="bg-white/90 backdrop-blur-md p-6 sm:p-8 rounded-3xl border-4 border-pink-100 shadow-xl max-w-lg w-full"
              >
                <Heart size={48} fill="#ec4899" className="text-pink-500 mx-auto mb-4 drop-shadow-md" />
                <p className="text-pink-600 text-lg sm:text-xl font-bold leading-relaxed">
                  Que este día esté lleno de mucha alegría, amor y momentos inolvidables. 
                  <br/><br/>
                  ¡Te deseo lo mejor hoy y siempre!
                </p>
              </motion.div>
              
              {(config.envelopeEnabled || config.polaroidEnabled) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.5 }}
                  className="absolute bottom-[-100px] text-pink-500 font-bold text-lg animate-bounce flex flex-col items-center gap-2"
                >
                  Sigue bajando
                  <span className="text-2xl">👇</span>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Extra Sections */}
      {showExtraSections && (
        <div className="relative z-20 w-full flex flex-col items-center">
          
          {config.envelopeEnabled && (
            <div className="min-h-screen flex items-center justify-center w-full py-20 px-4 mt-20">
              <EnvelopeReveal config={config} />
            </div>
          )}

          {config.polaroidEnabled && polaroids.length > 0 && (
            <div className="min-h-screen flex flex-col items-center justify-center w-full py-20 px-4 overflow-hidden">
              <h3 className="font-caveat text-5xl font-bold text-pink-500 mb-16 drop-shadow-sm text-center">Nuestros Recuerdos</h3>
              <div className="flex flex-wrap justify-center max-w-4xl gap-8">
                {polaroids.map((pol, i) => (
                  <PolaroidCard key={pol.id} item={pol} index={i} />
                ))}
              </div>
            </div>
          )}
          
        </div>
      )}

    </div>
  );
}

function EnvelopeReveal({ config }: { config: AppConfig }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-150px" });

  return (
    <div ref={ref} className="relative w-full max-w-md h-[450px] flex items-center justify-center mt-10" style={{ perspective: '1000px' }}>
      {/* Back of envelope */}
      <div className="absolute bottom-0 w-full h-[300px] bg-pink-300 rounded-lg shadow-xl" />
      
      {/* Top Flap (opens) */}
      <motion.div
        className="absolute top-[150px] w-full h-[150px] bg-pink-400 origin-top drop-shadow-md"
        style={{ clipPath: 'polygon(0 0, 50% 100%, 100% 0)' }}
        initial={{ rotateX: 0, zIndex: 30 }}
        animate={isInView ? { 
          rotateX: 180,
          zIndex: [30, 5, 5]
        } : {
          rotateX: 0,
          zIndex: 30
        }}
        transition={{ 
          duration: 0.8, 
          ease: "easeInOut",
          zIndex: { delay: 0.4 }
        }}
      />

      {/* Letter inside */}
      <motion.div 
        initial={{ y: 0, scale: 0.95, zIndex: 10 }}
        animate={isInView ? { 
          y: [0, -320, -120],
          scale: [0.95, 1, 1.05],
          zIndex: [10, 10, 40]
        } : {
          y: 0, scale: 0.95, zIndex: 10
        }}
        transition={{ 
          duration: 1.8, 
          delay: 0.5,
          times: [0, 0.5, 1],
          ease: "easeInOut"
        }}
        className="absolute bottom-4 w-[90%] h-[420px] bg-white rounded-xl shadow-2xl flex flex-col items-center p-6 border border-pink-100"
      >
        {config.envelopePhoto ? (
          <div className="w-full h-52 bg-pink-50/50 rounded-md overflow-hidden mb-4 border border-pink-100 flex-shrink-0 shadow-inner flex items-center justify-center p-2">
            <img src={config.envelopePhoto} className="max-w-full max-h-full object-contain drop-shadow-sm" alt="Sorpresa" />
          </div>
        ) : (
          <div className="w-full h-52 bg-pink-50 rounded-md mb-4 flex items-center justify-center text-pink-200 flex-shrink-0 shadow-inner">
            <Heart size={40} />
          </div>
        )}
        <p className="font-caveat text-pink-600 font-bold text-center text-2xl leading-relaxed overflow-y-auto w-full px-2 custom-scrollbar">
          {config.envelopeText}
        </p>
      </motion.div>

      {/* Front flaps of envelope */}
      <div className="absolute bottom-0 w-full h-[300px] pointer-events-none overflow-hidden rounded-lg z-20">
        <div className="absolute top-0 left-0 w-1/2 h-full bg-pink-400 origin-bottom-left" style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }} />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-pink-400 origin-bottom-right" style={{ clipPath: 'polygon(100% 0, 0 50%, 100% 100%)' }} />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-pink-500" style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }} />
      </div>
    </div>
  );
}

const PolaroidCard: React.FC<{ item: DBItem; index: number }> = ({ item, index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  const rotation = useRef((Math.random() - 0.5) * 16).current;
  const yOffset = useRef((Math.random() * 30)).current;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 100, rotate: 0 }}
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
}

function AdminView({ config, backgrounds, polaroids, handleSaveConfig, handleUploadBg, handleUploadPolaroid, handleUploadEnvelope, deleteItem, handleUpdatePolaroidText, onClose }: any) {
  return (
    <div className="min-h-screen w-full bg-pink-50 p-4 sm:p-12 font-sans overflow-y-auto">
      <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-3xl shadow-xl border-4 border-pink-100">
        <div className="flex justify-between items-center mb-8 border-b-2 border-pink-50 pb-4">
          <h2 className="text-2xl sm:text-3xl font-black text-pink-600">Configuración</h2>
          <button onClick={onClose} className="text-pink-400 hover:text-pink-600 font-bold underline bg-pink-50 px-4 py-2 rounded-full">
            Ver Tarjeta
          </button>
        </div>
        
        <section className="mb-10 bg-pink-50/50 p-6 rounded-2xl border border-pink-100">
          <h3 className="text-xl font-bold text-pink-600 mb-4">Textos Principales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-pink-500 mb-2">Título (Ej: ¡FELIZ CUMPLE!)</label>
              <input type="text" value={config.title} onChange={(e) => handleSaveConfig({title: e.target.value})} className="w-full p-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-400 font-medium text-pink-700" />
            </div>
            <div>
              <label className="block text-sm font-bold text-pink-500 mb-2">Nombre</label>
              <input type="text" value={config.name} onChange={(e) => handleSaveConfig({name: e.target.value})} className="w-full p-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-400 font-medium text-pink-700" />
            </div>
          </div>
        </section>

        <section className="mb-10 bg-pink-50/50 p-6 rounded-2xl border border-pink-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-pink-600">Fondos (Pre-carga 5 clicks)</h3>
            <label className="cursor-pointer bg-pink-500 hover:bg-pink-600 text-white text-sm font-bold py-2 px-4 rounded-full transition-colors flex items-center gap-2">
              <Plus size={16}/> Añadir
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleUploadBg} />
            </label>
          </div>
          <p className="text-sm text-pink-400 mb-4">Sube las imágenes sin importar el nombre. Se mostrarán aleatoriamente o en orden.</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {backgrounds.map((bg: any) => (
              <div key={bg.id} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-pink-200 group shadow-sm">
                <img src={bg.base64Data} className="w-full h-full object-cover" />
                <button onClick={() => deleteItem('backgrounds', bg.id)} className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {backgrounds.length === 0 && <p className="text-sm text-pink-400 col-span-5 italic">No hay fondos subidos.</p>}
          </div>
        </section>

        <section className="mb-10 bg-pink-50/50 p-6 rounded-2xl border border-pink-100">
          <div className="flex items-center gap-4 mb-6">
            <h3 className="text-xl font-bold text-pink-600">Sección: Sobre Sorpresa</h3>
            <label className="flex items-center gap-2 cursor-pointer text-pink-500 font-bold bg-white px-3 py-1.5 rounded-full border border-pink-200">
              <input type="checkbox" checked={config.envelopeEnabled} onChange={(e) => handleSaveConfig({envelopeEnabled: e.target.checked})} className="w-4 h-4 accent-pink-500" />
              Activar
            </label>
          </div>
          {config.envelopeEnabled && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-pink-500 mb-2">Mensaje del sobre</label>
                <textarea rows={4} value={config.envelopeText} onChange={(e) => handleSaveConfig({envelopeText: e.target.value})} className="w-full p-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-400 font-medium text-pink-700" />
              </div>
              <div>
                <label className="block text-sm font-bold text-pink-500 mb-2">Fotografía interior</label>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {config.envelopePhoto && (
                    <div className="w-full sm:w-32 aspect-square rounded-xl overflow-hidden border-2 border-pink-200 shadow-sm relative group">
                      <img src={config.envelopePhoto} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <label className="cursor-pointer bg-white border-2 border-dashed border-pink-300 hover:bg-pink-50 text-pink-500 font-bold py-2 px-4 rounded-xl transition-colors h-32 flex items-center justify-center flex-1 w-full sm:w-auto">
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={24} />
                      <span>Cambiar Fotografía</span>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadEnvelope} />
                  </label>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="mb-4 bg-pink-50/50 p-6 rounded-2xl border border-pink-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-bold text-pink-600">Sección: Álbum Polaroids</h3>
              <label className="flex items-center gap-2 cursor-pointer text-pink-500 font-bold bg-white px-3 py-1.5 rounded-full border border-pink-200">
                <input type="checkbox" checked={config.polaroidEnabled} onChange={(e) => handleSaveConfig({polaroidEnabled: e.target.checked})} className="w-4 h-4 accent-pink-500" />
                Activar
              </label>
            </div>
            {config.polaroidEnabled && (
              <label className="cursor-pointer bg-pink-500 hover:bg-pink-600 text-white text-sm font-bold py-2 px-4 rounded-full transition-colors flex items-center justify-center gap-2">
                <Plus size={16}/> Subir Fotos
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleUploadPolaroid} />
              </label>
            )}
          </div>
          {config.polaroidEnabled && (
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
             {polaroids.map((pol: any) => (
               <div key={pol.id} className="relative bg-white p-2 pb-3 shadow-md border border-gray-100 rounded-sm group flex flex-col gap-2">
                 <div className="relative">
                   <img src={pol.base64Data} className="w-full aspect-square object-cover bg-gray-100" />
                   <button onClick={() => deleteItem('polaroids', pol.id)} className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                     <Trash2 size={14} />
                   </button>
                 </div>
                 <input 
                   type="text" 
                   placeholder="Añadir texto..." 
                   defaultValue={pol.text || ''} 
                   onBlur={(e) => handleUpdatePolaroidText(pol.id, e.target.value)}
                   className="w-full text-sm p-1 text-center text-pink-700 bg-transparent border-b border-transparent focus:border-pink-300 focus:outline-none placeholder-pink-200"
                 />
               </div>
             ))}
             {polaroids.length === 0 && <p className="text-sm text-pink-400 col-span-4 italic">No hay fotos subidas. Añade algunas para que aparezcan al final.</p>}
           </div>
          )}
        </section>

      </div>
    </div>
  );
}
