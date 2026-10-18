import React, { useState } from 'react';
import { Lock, KeyRound, Check, X, ShieldAlert } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        // Check default PIN: 1234
        if (nextPin === '1234') {
          setTimeout(() => {
            onSuccess();
            setPin('');
            onClose();
          }, 200);
        } else {
          setError(true);
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div 
        className="glass-card rounded-3xl p-6 sm:p-8 max-w-xs w-full border border-white/20 shadow-2xl text-center animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7" />
        </div>

        <h3 className="text-lg font-bold text-white mb-1">
          Acceso de Gerencia
        </h3>
        <p className="text-xs text-neutral-400 mb-6">
          Ingresa el PIN de 4 dígitos para autorizar cambios de precio o eliminar artículos (Por defecto: 1234)
        </p>

        {/* PIN Dots Indicator */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  error
                    ? 'bg-rose-500 shadow-glow-rose scale-110'
                    : isFilled
                    ? 'bg-orange-500 shadow-glow-orange scale-110'
                    : 'bg-neutral-800 border border-white/20'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <div className="text-xs font-semibold text-rose-400 mb-4 animate-shake">
            PIN incorrecto. Intenta con 1234.
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[220px] mx-auto mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="w-14 h-14 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 border border-white/10 text-lg font-bold text-white transition-all active:scale-95"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={onClose}
            className="w-14 h-14 rounded-2xl text-xs font-semibold text-neutral-400 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="w-14 h-14 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 border border-white/10 text-lg font-bold text-white transition-all active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="w-14 h-14 rounded-2xl bg-neutral-900/50 hover:bg-neutral-800 border border-white/10 text-xs font-semibold text-neutral-400 hover:text-white transition-all active:scale-95"
          >
            Borrar
          </button>
        </div>

        <div className="text-[11px] text-neutral-400">
          Protección de Inventario • SAHOCO
        </div>
      </div>
    </div>
  );
};
