'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, LogOut, X, UserCircle2 } from 'lucide-react';
import { UserName, AUTHORIZED_USERS, USER_ROLES } from '../lib/types';

interface ProfileModalProps {
  isOpen: boolean;
  currentUser: UserName;
  onClose: () => void;
  onChangeUser: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onChangeUser
}) => {
  const userInfo = AUTHORIZED_USERS.find(u => u.name === currentUser);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 14 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 14 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#1a1a1a] border border-white/[0.08] rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h3 className="text-sm font-bold text-white">Perfil de Usuario</h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#242424] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Avatar + nombre + rol */}
            <div className="px-5 pb-4 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-orange-500/15 border-2 border-orange-500/40 flex items-center justify-center text-4xl shadow-[0_0_25px_rgba(249,115,22,0.25)]">
                {userInfo?.avatar || '👤'}
              </div>
              <h2 className="text-lg font-bold text-white mt-3">{currentUser}</h2>
              <span className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#242424] border border-white/[0.08] text-[11px] font-bold text-orange-400">
                <ChefHat className="w-3.5 h-3.5" />
                {USER_ROLES[currentUser]}
              </span>
            </div>

            {/* Info básica */}
            <div className="mx-5 mb-4 rounded-2xl bg-[#1f1f1f] border border-white/[0.06] divide-y divide-white/[0.06]">
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                  <UserCircle2 className="w-3.5 h-3.5 text-orange-400" />
                  Nombre completo
                </span>
                <span className="text-xs font-bold text-slate-200">{currentUser}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                  <ChefHat className="w-3.5 h-3.5 text-orange-400" />
                  Puesto en cocina
                </span>
                <span className="text-xs font-bold text-slate-200">{USER_ROLES[currentUser]}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[11px] font-semibold text-slate-400">Estado de sesión</span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  Activa en este dispositivo
                </span>
              </div>
            </div>

            {/* Acciones */}
            <div className="px-5 pb-5 space-y-2">
              <button
                onClick={onChangeUser}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-[0_0_18px_rgba(249,115,22,0.35)] active:scale-[0.98] transition-all"
              >
                <LogOut className="w-4 h-4" />
                Cambiar de perfil / usuario
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-2xl bg-[#242424] hover:bg-[#2c2c2c] border border-white/[0.08] text-slate-300 text-xs font-bold transition-colors"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
