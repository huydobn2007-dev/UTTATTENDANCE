import React, { useState, useEffect } from 'react';
import { User, NotificationItem } from '../../types';
import { db } from '../../services/dbService';
import { 
  Bell, 
  Moon, 
  Sun, 
  UserCheck, 
  GraduationCap, 
  ShieldCheck, 
  ChevronDown, 
  Sparkles,
  Camera,
  CheckCircle2,
  Smartphone,
  Building,
  MapPin,
  X
} from 'lucide-react';
import { UttLogo } from './UttLogo';

interface TopNavBarProps {
  currentUser: User;
  onOpenRoleSwitcher: () => void;
  onOpenNotifications: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickAttendance?: () => void;
  onOpenKiosk: () => void;
  onOpenMobileModal?: () => void;
  isMobilePreviewActive?: boolean;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  currentUser,
  onOpenRoleSwitcher,
  onOpenNotifications,
  isDark,
  onToggleDark,
  activeTab,
  setActiveTab,
  onOpenQuickAttendance,
  onOpenKiosk,
  onOpenMobileModal,
  isMobilePreviewActive = false
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showCampusModal, setShowCampusModal] = useState(false);
  const campuses = db.getCampuses();

  useEffect(() => {
    const update = () => {
      const notifs = db.getNotifications(currentUser.id);
      setUnreadCount(notifs.filter(n => !n.read).length);
    };
    update();
    return db.subscribe(update);
  }, [currentUser.id]);

  const navLinks = [
    { id: 'dashboard', label: 'Tổng quan' },
    ...(currentUser.role === 'student'
      ? [
          { id: 'attendance', label: 'Điểm danh' },
          { id: 'schedule', label: 'Lịch học' },
          { id: 'history', label: 'Lịch sử' },
          { id: 'profile', label: 'Hồ sơ sinh trắc' }
        ]
      : currentUser.role === 'lecturer'
      ? [
          { id: 'monitor', label: 'Giám sát trực tiếp' },
          { id: 'classes', label: 'Lớp học & SV' },
          { id: 'appeals', label: 'Duyệt khiếu nại' },
          { id: 'reports', label: 'Báo cáo' }
        ]
      : [
          { id: 'students', label: 'Sinh viên' },
          { id: 'lecturers', label: 'Giảng viên' },
          { id: 'courses', label: 'Môn học & Lớp HP' },
          { id: 'sessions', label: 'Phiên điểm danh' },
          { id: 'face_settings', label: 'Cấu hình AI' },
          { id: 'audit_logs', label: 'Audit Log' },
          { id: 'reports', label: 'Báo cáo toàn trường' }
        ])
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0c2340]/95 backdrop-blur-md transition-colors">
      <div className="w-full px-2.5 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-1.5">
        {/* Left: UTT Brand Logo & Title */}
        <button 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-1.5 text-left hover:opacity-90 transition-opacity shrink-0 cursor-pointer"
        >
          <UttLogo size="sm" showText={false} />
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-extrabold text-[#0c2340] dark:text-white leading-tight tracking-tight">
              UTT Face ID
            </span>
            <span className="text-[9px] font-mono font-bold text-orange-600 dark:text-orange-400 leading-none">
              Điểm Danh 1:N
            </span>
          </div>
        </button>

        {/* Right: Key Actions prioritized for mobile (Kiosk Cửa + Role Switcher SV/GV + Notifications + Dark mode) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* NÚT KIOSK CỬA - NỔI BẬT VÀ DỄ BẤM */}
          <button
            onClick={onOpenKiosk}
            className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer"
            title="Mở trạm Kiosk quét khuôn mặt tại cửa giảng đường"
          >
            <Camera className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] sm:text-xs">Kiosk Cửa</span>
          </button>

          {/* NÚT CHUYỂN TÀI KHOẢN SV / GV / QTV */}
          <button
            onClick={onOpenRoleSwitcher}
            className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 active:scale-95 transition-all text-left cursor-pointer"
            title="Bấm để chuyển đổi giữa tài khoản Sinh viên, Giảng viên hoặc Quản trị viên"
          >
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                currentUser.fullName.split(' ').slice(-1)[0][0]
              )}
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-200">
              {currentUser.role === 'student' ? 'SV' : currentUser.role === 'lecturer' ? 'GV' : 'QTV'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-500 dark:text-slate-400 shrink-0" />
          </button>

          {/* Nút Chuông Thông Báo */}
          <button
            onClick={onOpenNotifications}
            aria-label="Thông báo"
            className="relative p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-1 ring-white dark:ring-slate-900" />
            )}
          </button>

          {/* Nút Đổi Chế Độ Sáng/Tối */}
          <button
            onClick={onToggleDark}
            aria-label="Chuyển chế độ sáng/tối"
            className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>

      {/* Campuses & Branches Information Modal */}
      {showCampusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Hệ Thống Phân Hiệu & Cơ Sở Đào Tạo UTT
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Trường Đại học Công nghệ Giao thông Vận tải
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCampusModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {campuses.map(c => (
                <div
                  key={c.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    c.isHeadquarter
                      ? 'border-blue-300 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/30'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {c.name}
                        </h4>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${
                          c.isHeadquarter
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}>
                          {c.code}
                        </span>
                        {c.isHeadquarter && (
                          <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full">
                            Trụ sở chính
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span>{c.address}</span>
                      </p>
                    </div>

                    <div className="text-right text-xs text-slate-500 dark:text-slate-400 font-mono shrink-0">
                      <div>ĐT: {c.phone}</div>
                      <div className="text-[11px] text-slate-400">{c.email}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <span className="font-semibold text-slate-900 dark:text-white">
                ℹ️ Lưu ý về phạm vi Geofence điểm danh sinh trắc học:
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Sinh viên và giảng viên có thể thực hiện điểm danh tại bất kỳ cơ sở nào trong 3 cơ sở trên khi có lịch học phần tương ứng được mở.
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setShowCampusModal(false)}
                className="px-5 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
