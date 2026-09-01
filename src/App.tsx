/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Star, Trash2, Upload } from 'lucide-react';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './lib/firebase';

const MESSAGES = [
  "¡Ya casi está listo!",
  "¡Sigue clickeando!",
  "¡Un poco más!",
  "¡No te rindas, falta poquito!",
  "¡Dale un click más!",
  "¡Casi, casi...!",
  "¡Una sorpresa te espera!",
];

const REQUIRED_IMAGES = ['001', '002', '003', '004', '005'];

export default function App() {
  const [clicks, setClicks] = useState(0);
  const [currentMessage, setCurrentMessage] = useState("");
  const [images, setImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'main' | 'admin'>('main');

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'backgrounds'));
      const fetchedImages: Record<string, string> = {};
      querySnapshot.forEach((doc) => {
        fetchedImages[doc.id] = doc.data().base64Data;
      });
      setImages(fetchedImages);
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminUpload = (e: React.ChangeEvent<HTMLInputElement>, imageId: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          await setDoc(doc(db, 'backgrounds', imageId), {
            base64Data: base64String
          });
          setImages(prev => ({ ...prev, [imageId]: base64String }));
        } catch (error) {
          console.error("Error saving image:", error);
          alert("Hubo un error al guardar la imagen. Tal vez es demasiado grande.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdminDelete = async (imageId: string) => {
    try {
      await deleteDoc(doc(db, 'backgrounds', imageId));
      setImages(prev => {
        const newImages = { ...prev };
        delete newImages[imageId];
        return newImages;
      });
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-pink-50">
        <Heart size={48} className="text-pink-300 animate-pulse" />
      </div>
    );
  }

  if (view === 'admin') {
    return (
      <div className="min-h-screen w-full bg-pink-50 p-6 sm:p-12 font-sans overflow-y-auto">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-xl border-4 border-pink-100">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black text-pink-600">Panel Administrativo</h2>
            <button 
              onClick={() => setView('main')}
              className="text-pink-400 hover:text-pink-600 font-bold underline"
            >
              Volver a la Tarjeta
            </button>
          </div>
          
          <p className="text-pink-500 mb-6 font-medium">Sube las 5 imágenes (.webp) para el fondo. El progreso usará estas imágenes en orden.</p>
          
          <div className="space-y-4">
            {REQUIRED_IMAGES.map((imgId) => (
              <div key={imgId} className="flex items-center justify-between p-4 bg-pink-50 rounded-2xl border-2 border-pink-100">
                <span className="font-bold text-pink-700 text-lg">{imgId}.webp</span>
                
                {images[imgId] ? (
                  <div className="flex items-center gap-4">
                    <img src={images[imgId]} alt={imgId} className="w-16 h-16 object-cover rounded-lg border border-pink-200 shadow-sm" />
                    <button 
                      onClick={() => handleAdminDelete(imgId)}
                      className="p-3 bg-red-100 text-red-500 hover:bg-red-200 rounded-full transition-colors"
                      title="Eliminar imagen"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-6 rounded-full transition-colors shadow-sm">
                    <Upload size={18} />
                    Subir
                    <input 
                      type="file" 
                      accept="image/webp, image/*" 
                      className="hidden" 
                      onChange={(e) => handleAdminUpload(e, imgId)} 
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const progress = (clicks / 5) * 100;
  
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-pink-50 font-sans">
      
      {/* Hidden Admin Trigger */}
      <button 
        onClick={() => setView('admin')}
        className="absolute bottom-4 left-4 z-50 p-4 opacity-10 hover:opacity-100 transition-opacity"
      >
        <Star size={24} className="text-pink-400" />
      </button>

      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-10 left-10 w-24 h-24 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
        <div className="absolute top-1/2 right-20 w-16 h-16 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
      </div>

      {/* Background Images */}
      {REQUIRED_IMAGES.map((imgId, index) => {
        const isVisible = clicks > 0 && ((clicks - 1) % 5 === index);
        const imgSrc = images[imgId];
        
        if (!imgSrc) return null;
        
        return (
          <div
            key={imgId}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out z-0"
            style={{ 
              backgroundImage: `url(${imgSrc})`,
              opacity: isVisible ? 0.4 : 0
            }}
          />
        );
      })}

      {/* Main Content */}
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

            {/* Progress Bar */}
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

            {/* Random Text */}
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
          /* Final Birthday Card */
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, type: 'spring', bounce: 0.4 }}
            className="flex flex-col items-center text-center px-10 w-full"
          >
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-6xl sm:text-7xl font-black text-pink-600 mb-2 drop-shadow-sm tracking-tight"
            >
              ¡FELIZ CUMPLE!
            </motion.h1>
            
            <motion.h2 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="text-7xl sm:text-8xl font-black text-pink-500 mb-8 drop-shadow-md tracking-tighter uppercase"
            >
              Jesica
            </motion.h2>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="bg-white/90 backdrop-blur-md p-8 rounded-3xl border-4 border-pink-100 shadow-xl max-w-lg w-full"
            >
              <Heart size={48} fill="#ec4899" className="text-pink-500 mx-auto mb-4 drop-shadow-md" />
              <p className="text-pink-600 text-xl font-bold leading-relaxed">
                Que este día esté lleno de mucha alegría, amor y momentos inolvidables. 
                <br/><br/>
                ¡Te deseo lo mejor hoy y siempre!
              </p>
            </motion.div>
          </motion.div>
        )}
        
        <p className="mt-16 text-pink-300 text-sm font-medium italic tracking-wide uppercase opacity-70">
          Hecho con amor especialmente para ti
        </p>
      </div>
    </div>
  );
}
