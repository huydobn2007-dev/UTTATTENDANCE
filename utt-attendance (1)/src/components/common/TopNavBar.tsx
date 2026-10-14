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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element Brand Wordmark with UTT Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 text-left hover:opacity-90 transition-opacity"
          >
            <UttLogo size="md" showText={true} />
          </button>
          <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Thử Nghiệm</span>
          </span>
        </div>

        {/* Zone 2: Clean text nav links (anti-slop, no pill enclosures) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map(link => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`relative py-1 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-orange-600 dark:text-orange-400 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#0c2340] dark:hover:text-white'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 dark:bg-orange-500 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions (Kiosk CTA, Quick attendance CTA, Notifications, Dark mode, User Role switcher) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile Preview & PWA Install Button */}
          {onOpenMobileModal && (
            <button
              onClick={onOpenMobileModal}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                isMobilePreviewActive
                  ? 'bg-[#0c2340] text-white border-orange-500 shadow-sm'
                  : 'text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
              }`}
              title="Xuất bản PWA, quét mã QR và giả lập màn hình Mobile"
            >
              <Smartphone className={`w-3.5 h-3.5 ${isMobilePreviewActive ? 'text-orange-400' : 'text-orange-600 dark:text-orange-400'}`} />
              <span className="hidden sm:inline">{isMobilePreviewActive ? 'Đang bật Mobile' : 'Bản Mobile'}</span>
              <span className="sm:hidden">App</span>
            </button>
          )}

          {/* Campuses information button */}
          <button
            onClick={() => setShowCampusModal(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-all"
            title="Xem địa chỉ trụ sở chính và các phân hiệu trường"
          >
            <Building className="w-3.5 h-3.5 text-[#0c2340] dark:text-blue-400" />
            <span className="hidden md:inline">3 Cơ sở đào tạo</span>
            <span className="md:hidden">Cơ sở</span>
          </button>

          <button
            onClick={onOpenKiosk}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0c2340] dark:text-blue-200 bg-blue-50 dark:bg-[#0c2340]/60 hover:bg-orange-50 dark:hover:bg-[#0c2340] border border-blue-200 dark:border-blue-900 rounded-lg shadow-2xs transition-all"
            title="Mở chế độ Kiosk màn hình đặt tại cửa phòng học"
          >
            <Camera className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            <span className="hidden sm:inline">Trạm Cửa Giảng Đường</span>
            <span className="sm:hidden">Kiosk Cửa</span>
          </button>

          {currentUser.role === 'student' && onOpenQuickAttendance && (
            <button
              onClick={onOpenQuickAttendance}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 active:scale-[0.98] rounded-lg shadow-sm transition-all"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Điểm danh ngay</span>
            </button>
          )}

          <button
            onClick={onToggleDark}
            aria-label="Chuyển chế độ sáng/tối"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenNotifications}
            aria-label="Thông báo"
            className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {/* User & Role Switcher */}
          <button
            onClick={onOpenRoleSwitcher}
            className="flex items-center gap-2 p-1 pl-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 text-xs font-bold overflow-hidden">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.fullName} className="w-full h-full object-cover" />
              ) : (
                currentUser.fullName.split(' ').slice(-1)[0][0]
              )}
            </div>
            <div className="hidden lg:block text-xs leading-tight pr-1">
              <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">
                {currentUser.fullName}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                {currentUser.role === 'student' ? 'Sinh viên' : currentUser.role === 'lecturer' ? 'Giảng viên' : 'Quản trị viên'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
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
