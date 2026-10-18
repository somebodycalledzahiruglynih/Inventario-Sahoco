'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { AUTHORIZED_USERS, AUTH_PASSWORD, UserName } from '../lib/types';

interface LoginScreenProps {
  onLoginSuccess: (user: UserName) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [selectedUser, setSelectedUser] = useState<UserName>('Zahir');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === AUTH_PASSWORD) {
      setIsSubmitting(true);
      setError(false);
      setTimeout(() => {
        onLoginSuccess(selectedUser);
      }, 300);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col justify-center items-center px-4 py-8 sm:px-6 relative overflow-hidden">

      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md bg-[#1a1a1a] rounded-3xl p-6 sm:p-8 border border-white/[0.07] shadow-[0_24px_60px_rgba(0,0,0,0.6)] relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <img
              src="/Logo.png"
              alt="SAHOCO"
              className="h-16 sm:h-20 w-auto max-w-[240px] object-contain block drop-shadow-md select-none"
            />
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl tracking-wide text-white">
            SAHOCO
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Control de Insumos & Inventario Operativo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* User Selection */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Perfil Autorizado
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AUTHORIZED_USERS.map((user) => {
                const isSelected = selectedUser === user.name;
                return (
                  <button
                    key={user.name}
                    type="button"
                    onClick={() => setSelectedUser(user.name as UserName)}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-orange-500/15 border-orange-500/50 text-white shadow-[0_0_12px_rgba(249,115,22,0.2)] ring-1 ring-orange-500/30'
                        : 'bg-[#242424] border-white/[0.08] text-slate-400 hover:bg-[#2a2a2a] hover:border-white/[0.12]'
                    }`}
                  >
                    <span className="text-lg">{user.avatar}</span>
                    <span className="font-bold text-xs sm:text-sm truncate">{user.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className={`w-full pl-10 pr-10 py-3.5 bg-[#242424] border rounded-2xl text-sm font-medium text-white placeholder-slate-600 focus:outline-none transition-all ${
                  error
                    ? 'border-red-500 ring-2 ring-red-500/25'
                    : 'border-white/[0.08] focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20'
                }`}
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-400 font-semibold mt-1.5">
                Contraseña incorrecta.
              </p>
            )}
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-2xl text-sm font-bold shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_28px_rgba(249,115,22,0.45)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 btn-thumb"
          >
            {isSubmitting ? (
              <span>Verificando...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Ingresar como {selectedUser}</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/[0.06] text-center">
          <p className="text-[11px] text-slate-500">
            🔒 Acceso restringido al personal autorizado de SAHOCO
          </p>
        </div>
      </motion.div>
    </div>
  );
};
