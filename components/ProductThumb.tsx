'use client';

import React, { useState } from 'react';
import { Package } from 'lucide-react';

interface ProductThumbProps {
  foto?: string;
  nombre: string;
  className?: string;
  iconClassName?: string;
}

export const ProductThumb: React.FC<ProductThumbProps> = ({
  foto,
  nombre,
  className = '',
  iconClassName = 'w-4 h-4'
}) => {
  const [failedFor, setFailedFor] = useState<string | null>(null);

  if (foto && failedFor !== foto) {
    return (
      <img
        src={foto}
        alt={nombre}
        className={`${className} object-cover`}
        onError={() => setFailedFor(foto)}
      />
    );
  }

  return (
    <div
      className={`${className} flex items-center justify-center text-slate-600`}
      aria-label={`${nombre} (sin foto)`}
      title="Sin foto"
    >
      <Package className={iconClassName} />
    </div>
  );
};
