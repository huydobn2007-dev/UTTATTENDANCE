import React from 'react';
import { UserRole } from '../../types';
import { 
  Home, 
  Camera, 
  DoorOpen,
  ArrowRightLeft,
  User as UserIcon, 
  Monitor, 
  Users, 
  ShieldCheck,
  Calendar
} from 'lucide-react';

interface BottomNavProps {
  role: UserRole;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickAttendance?: () => void;
  onOpenKiosk?: () => void;
  onOpenRoleSwitcher?: () => void;
}

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isCenterAction?: boolean;
  actionType?: 'kiosk' | 'role' | 'attendance';
}

export const BottomNav: React.FC<BottomNavProps> = ({
  role,
  activeTab,
  setActiveTab,
  onOpenQuickAttendance,
  onOpenKiosk,
  onOpenRoleSwitcher
}) => {
  // Balanced 5-tab ergonomic mobile layout for all roles:
  // 1. Tổng quan (Dashboard)
  // 2. Kiosk Cửa (Trạm quét cửa giảng đường)
  // 3. Điểm danh (Quét Face ID nhanh - nút tròn nổi bật ở giữa)
  // 4. Đổi SV/GV (Chuyển đổi vai trò tài khoản)
  // 5. Hồ sơ / Giám sát (Theo từng vai trò)
  const tabs: TabItem[] = [
    { id: 'dashboard', label: 'Tổng quan', icon: Home },
    { id: 'kiosk_trigger', label: 'Kiosk Cửa', icon: DoorOpen, actionType: 'kiosk' },
    { 
      id: 'attendance_trigger', 
      label: role === 'student' ? 'Điểm danh' : 'Quét Face', 
      icon: Camera, 
      isCenterAction: true,
      actionType: 'attendance'
    },
    { id: 'role_trigger', label: 'Đổi SV/GV', icon: ArrowRightLeft, actionType: 'role' },
    ...(role === 'student'
      ? [{ id: 'profile', label: 'Hồ sơ', icon: UserIcon }]
      : role === 'lecturer'
      ? [{ id: 'monitor', label: 'Giám sát', icon: Monitor }]
      : [{ id: 'students', label: 'Quản trị', icon: ShieldCheck }])
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none transition-colors">
      <div className="w-full max-w-[430px] mx-auto bg-white/95 dark:bg-[#0c2340]/95 backdrop-blur-md border-t border-slate-200 dark:border-orange-500/20 pointer-events-auto shadow-xl">
        <div className="grid grid-flow-col auto-cols-fr items-center h-16 px-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            if (tab.isCenterAction) {
              const handleCenterAction = () => {
                if (role === 'student' && onOpenQuickAttendance) {
                  onOpenQuickAttendance();
                } else if (onOpenKiosk) {
                  onOpenKiosk();
                }
              };

              return (
                <button
                  key={tab.id}
                  onClick={handleCenterAction}
                  className="flex flex-col items-center justify-center min-h-[48px] py-1 -mt-3 text-white transition-transform active:scale-95 cursor-pointer"
                  title="Điểm danh Face ID 1:N nhanh"
                >
                  <div className="w-11 h-11 rounded-full bg-orange-600 shadow-lg shadow-orange-600/40 ring-2 ring-orange-400 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 mt-0.5">
                    {tab.label}
                  </span>
                </button>
              );
            }

            const handleClick = () => {
              if (tab.actionType === 'kiosk') {
                if (onOpenKiosk) onOpenKiosk();
              } else if (tab.actionType === 'role') {
                if (onOpenRoleSwitcher) onOpenRoleSwitcher();
              } else {
                setActiveTab(tab.id);
              }
            };

            const isHighlighted = tab.actionType === 'kiosk' || tab.actionType === 'role';

            return (
              <button
                key={tab.id}
                onClick={handleClick}
                className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors cursor-pointer ${
                  isActive
                    ? 'text-orange-600 dark:text-orange-400 font-bold'
                    : isHighlighted
                    ? 'text-slate-700 dark:text-slate-200 hover:text-orange-600'
                    : 'text-slate-500 dark:text-slate-400 hover:text-[#0c2340] dark:hover:text-slate-200'
                }`}
                title={tab.label}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {tab.actionType === 'kiosk' && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-500" />
                  )}
                  {tab.actionType === 'role' && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </div>
                <span className="text-[10px] mt-1 font-medium tracking-tight truncate max-w-[64px]">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
