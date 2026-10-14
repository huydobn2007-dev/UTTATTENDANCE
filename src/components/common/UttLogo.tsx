import React, { useState } from 'react';
import uttLogoImg from '../../assets/images/utt_official_logo_1791623145089.jpg';

interface UttLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  textClassName?: string;
  subtitle?: string;
  invertText?: boolean;
}

export const UttLogo: React.FC<UttLogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
  textClassName = '',
  subtitle,
  invertText = false
}) => {
  const [imgSrc, setImgSrc] = useState<string>('/utt_official_logo.svg');

  const sizeMap = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    '2xl': 'w-24 h-24'
  };

  const textScaleMap = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl'
  };

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className={`relative ${sizeMap[size]} shrink-0 flex items-center justify-center overflow-hidden rounded-xl shadow-xs border border-blue-950/20 bg-[#24285b]`}
      >
        <img
          src={imgSrc}
          alt="Trường Đại học Công nghệ Giao thông Vận tải - University of Transport Technology"
          className="w-full h-full object-contain select-none"
          onError={() => {
            if (imgSrc !== '/utt_official_logo.png' && imgSrc !== uttLogoImg) {
              setImgSrc('/utt_official_logo.png');
            } else if (imgSrc !== uttLogoImg) {
              setImgSrc(uttLogoImg);
            }
          }}
          loading="eager"
          decoding="async"
        />
      </div>

      {showText && (
        <div className="flex flex-col text-left leading-tight">
          <span
            className={`font-black tracking-tight ${textScaleMap[size]} ${
              invertText ? 'text-white' : 'text-slate-900 dark:text-white'
            } ${textClassName}`}
          >
            <span className="text-[#24285b] dark:text-orange-400">UTT</span>{' '}
            <span className="text-[#f58220] dark:text-orange-300">ATTENDANCE</span>
          </span>
          {subtitle ? (
            <span
              className={`text-[10px] font-medium tracking-wide ${
                invertText ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {subtitle}
            </span>
          ) : (
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider ${
                invertText ? 'text-orange-200' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              ĐH CÔNG NGHỆ GIAO THÔNG VẬN TẢI
            </span>
          )}
        </div>
      )}
    </div>
  );
};

