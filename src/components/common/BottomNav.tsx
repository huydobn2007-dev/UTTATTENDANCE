import React from 'react';
import { UserRole } from '../../types';
import { 
  Home, 
  Camera, 
  Calendar, 
  History, 
  User as UserIcon, 
  Monitor, 
  Users, 
  FileText, 
  ShieldCheck,
  CheckSquare
} from 'lucide-react';

interface BottomNavProps {
  role: UserRole;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickAttendance?: () => void;
}

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isAction?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  role,
  activeTab,
  setActiveTab,
  onOpenQuickAttendance
}) => {
  const studentTabs: TabItem[] = [
    { id: 'dashboard', label: 'Tổng quan', icon: Home },
    { id: 'attendance_trigger', label: 'Điểm danh', icon: Camera, isAction: true },
    { id: 'schedule', label: 'Lịch học', icon: Calendar },
    { id: 'history', label: 'Lịch sử', icon: History },
    { id: 'profile', label: 'Hồ sơ', icon: UserIcon }
  ];

  const lecturerTabs: TabItem[] = [
    { id: 'dashboard', label: 'Tổng quan', icon: Home },
    { id: 'monitor', label: 'Giám sát', icon: Monitor },
    { id: 'classes', label: 'Lớp học', icon: Users },
    { id: 'appeals', label: 'Khiếu nại', icon: CheckSquare },
    { id: 'reports', label: 'Báo cáo', icon: FileText }
  ];

  const adminTabs: TabItem[] = [
    { id: 'dashboard', label: 'Tổng quan', icon: Home },
    { id: 'students', label: 'Sinh viên', icon: Users },
    { id: 'sessions', label: 'Phiên', icon: Calendar },
    { id: 'face_settings', label: 'Cấu hình AI', icon: ShieldCheck },
    { id: 'reports', label: 'Báo cáo', icon: FileText }
  ];

  const tabs = role === 'student' ? studentTabs : role === 'lecturer' ? lecturerTabs : adminTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none transition-colors">
      <div className="w-full max-w-[430px] mx-auto bg-white/95 dark:bg-[#0c2340]/95 backdrop-blur-md border-t border-slate-200 dark:border-orange-500/20 pointer-events-auto shadow-lg">
        <div className="grid grid-flow-col auto-cols-fr items-center h-16 px-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isAction) {
            return (
              <button
                key={tab.id}
                onClick={onOpenQuickAttendance}
                className="flex flex-col items-center justify-center min-h-[48px] py-1 -mt-3 text-white transition-transform active:scale-95"
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

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
                isActive
                  ? 'text-orange-600 dark:text-orange-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-[#0c2340] dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
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
