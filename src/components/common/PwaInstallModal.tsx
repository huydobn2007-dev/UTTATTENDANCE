import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Download, 
  X, 
  QrCode, 
  Check, 
  Share2, 
  PlusSquare, 
  ShieldCheck,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { UttLogo } from './UttLogo';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleMobilePreview?: () => void;
  isMobilePreviewActive?: boolean;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({
  isOpen,
  onClose,
  onToggleMobilePreview,
  isMobilePreviewActive = false
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [currentUrl, setCurrentUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);

      // Check if already in standalone PWA mode
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      if (isStandalone) {
        setIsInstalled(true);
      }

      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };

      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } catch (e) {
      console.warn('Install prompt error:', e);
    }
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Modal Header with UTT Branding */}
        <div className="p-4 bg-[#0c2340] border-b border-orange-500/30 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <UttLogo size="sm" />
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Cài Đặt UTT Mobile App</span>
                <span className="text-[10px] bg-orange-600 text-white font-mono font-bold px-1.5 py-0.5 rounded">
                  PWA
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                Trường Đại học Công nghệ GTVT · Điểm danh trên iPhone / Android
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Quick Action: Desktop Simulated Preview Switch */}
          {onToggleMobilePreview && (
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                  <Laptop className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Xem trước giao diện Điện thoại trên máy tính</span>
                </div>
                <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 mt-0.5">
                  Mô phỏng khung hình điện thoại iPhone 15 / Android với đầy đủ tính năng cảm ứng và quét camera
                </p>
              </div>
              <button
                onClick={() => {
                  onToggleMobilePreview();
                  onClose();
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                  isMobilePreviewActive
                    ? 'bg-slate-800 text-white hover:bg-slate-700'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                }`}
              >
                {isMobilePreviewActive ? 'Về bản Desktop' : 'Bật bản Mobile'}
              </button>
            </div>
          )}

          {/* 1-Click Install Button if supported by browser */}
          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Cài đặt ngay ứng dụng vào màn hình chính (Android / PC)</span>
            </button>
          )}

          {/* QR Code to scan with Phone Camera */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-32 h-32 bg-white rounded-xl p-2 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-inner shrink-0">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(currentUrl)}`}
                alt="QR Code to open on Mobile"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-1.5">
                <QrCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Quét mã QR bằng Camera điện thoại</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Mở ứng dụng Camera trên iPhone hoặc Android, hướng vào mã QR bên cạnh để mở ứng dụng trực tiếp trên điện thoại của bạn.
              </p>
              <div className="pt-1 flex flex-wrap gap-2 justify-center sm:justify-start">
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Đã sao chép link!' : 'Sao chép link web'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* OS-specific Guides */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* iOS Safari Guide */}
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-2">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Hướng dẫn iPhone (Safari)</span>
              </div>
              <ol className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>Mở liên kết bằng trình duyệt <strong>Safari</strong>.</li>
                <li>Bấm vào biểu tượng <strong>Chia sẻ (Share 📤)</strong> ở thanh dưới.</li>
                <li>Cuộn xuống chọn <strong>"Thêm vào MH chính" (Add to Home Screen ➕)</strong>.</li>
                <li>Bấm <strong>Thêm</strong> ở góc trên bên phải để hoàn tất.</li>
              </ol>
            </div>

            {/* Android Chrome Guide */}
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-2">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Hướng dẫn Android (Chrome)</span>
              </div>
              <ol className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>Mở liên kết bằng trình duyệt <strong>Google Chrome</strong>.</li>
                <li>Bấm vào nút <strong>Menu 3 chấm (⋮)</strong> ở góc trên cùng bên phải.</li>
                <li>Chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào Màn hình chính"</strong>.</li>
                <li>Xác nhận cài đặt để tạo icon ứng dụng như app gốc.</li>
              </ol>
            </div>
          </div>

          {/* Privacy & Hardware reassurance */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Hỗ trợ đầy đủ camera trước/sau, định vị GPS giảng đường UTT và nhận dạng Face ID thời gian thực.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold text-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
