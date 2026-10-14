import React from 'react';
import { NotificationItem } from '../../types';
import { db } from '../../services/dbService';
import { X, CheckCircle2, Clock, AlertTriangle, Info, CheckCheck } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  userId
}) => {
  if (!isOpen) return null;

  const notifs = db.getNotifications(userId);

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'attendance_success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'attendance_late':
        return <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'warning':
      case 'face_error':
        return <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Thông báo của bạn
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {notifs.filter(n => !n.read).length} thông báo chưa đọc
              </p>
            </div>
            <div className="flex items-center gap-2">
              {notifs.some(n => !n.read) && (
                <button
                  onClick={() => db.markAllNotificationsAsRead(userId)}
                  title="Đánh dấu tất cả đã đọc"
                  className="p-1 text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Đã đọc</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {notifs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Không có thông báo mới nào
              </div>
            ) : (
              notifs.map(item => (
                <div
                  key={item.id}
                  onClick={() => db.markNotificationAsRead(item.id)}
                  className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                    item.read
                      ? 'border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400'
                      : 'border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20 text-slate-900 dark:text-slate-100'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">{getIcon(item.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold truncate">{item.title}</span>
                        {!item.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs mt-1 text-slate-500 dark:text-slate-400 line-clamp-3">
                        {item.message}
                      </p>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-mono">
                        {new Date(item.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
