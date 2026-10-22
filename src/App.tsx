import React, { useState, useEffect } from 'react';
import { User, Student, Lecturer } from './types';
import { db } from './services/dbService';
import { TopNavBar } from './components/common/TopNavBar';
import { BottomNav } from './components/common/BottomNav';
import { RoleSwitcherModal } from './components/common/RoleSwitcherModal';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { PwaInstallModal } from './components/common/PwaInstallModal';
import { UttLogo } from './components/common/UttLogo';
import { Smartphone, Laptop, Building, MapPin } from 'lucide-react';

// Student Views
import { StudentDashboard } from './components/student/StudentDashboard';
import { FaceAttendanceModal } from './components/student/FaceAttendanceModal';
import { FaceRegistrationModal } from './components/student/FaceRegistrationModal';
import { StudentSchedule } from './components/student/StudentSchedule';
import { StudentHistory } from './components/student/StudentHistory';
import { StudentProfile } from './components/student/StudentProfile';
import { StudentAppealsModal } from './components/student/StudentAppealsModal';

// Lecturer Views
import { LecturerDashboard } from './components/lecturer/LecturerDashboard';
import { CreateSessionModal } from './components/lecturer/CreateSessionModal';
import { LiveAttendanceMonitor } from './components/lecturer/LiveAttendanceMonitor';
import { LecturerClasses } from './components/lecturer/LecturerClasses';
import { LecturerReports } from './components/lecturer/LecturerReports';
import { LecturerAppeals } from './components/lecturer/LecturerAppeals';

// Admin Views
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminStudents } from './components/admin/AdminStudents';
import { AdminLecturers } from './components/admin/AdminLecturers';
import { AdminCourses } from './components/admin/AdminCourses';
import { AdminSessions } from './components/admin/AdminSessions';
import { AdminFaceSettings } from './components/admin/AdminFaceSettings';
import { AdminAuditLogs } from './components/admin/AdminAuditLogs';
import { AdminReports } from './components/admin/AdminReports';

// Entrance Door Kiosk Terminal
import { initialAdmin } from './data/mockData';
import { EntranceKiosk } from './components/kiosk/EntranceKiosk';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const u = db.getCurrentUser();
      if (u && u.id && u.role) return u;
    } catch {}
    return initialAdmin;
  });
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isDark, setIsDark] = useState<boolean>(false);
  const [isKioskMode, setIsKioskMode] = useState<boolean>(false);

  // Modals
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isCreateSessionModalOpen, setIsCreateSessionModalOpen] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [isMobilePreview, setIsMobilePreview] = useState(true);
  const [appealsSessionId, setAppealsSessionId] = useState<string | null>(null);

  // Selected live monitor session
  const [liveMonitorSessionId, setLiveMonitorSessionId] = useState<string | null>(null);

  // Subscribe to DB updates
  useEffect(() => {
    const update = () => {
      try {
        const u = db.getCurrentUser();
        if (u && u.id && u.role) {
          setCurrentUser(u);
        }
      } catch (e) {
        console.warn('Sync user error:', e);
      }
    };
    return db.subscribe(update);
  }, []);

  // Sync dark mode class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleSelectUser = (user: User) => {
    db.setCurrentUser(user);
    setCurrentUser(user);
    setActiveTab('dashboard');
    setLiveMonitorSessionId(null);
    if (user.id === 'kiosk_lab501') {
      setIsKioskMode(true);
    }
  };

  const activeSession = db.getActiveSession();

  // If in Entrance Door Terminal Kiosk Mode, render the specialized full-screen door station
  if (isKioskMode) {
    return (
      <>
        <EntranceKiosk 
          onExitKiosk={() => setIsKioskMode(false)} 
          onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
        />
        <RoleSwitcherModal
          isOpen={isRoleSwitcherOpen}
          onClose={() => setIsRoleSwitcherOpen(false)}
          currentUser={currentUser}
          onSelectUser={handleSelectUser}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex justify-center font-sans">
      <div className="w-full max-w-[430px] bg-slate-50 dark:bg-[#071324] min-h-screen flex flex-col relative shadow-2xl border-x border-slate-200 dark:border-slate-800/60 pb-20 overflow-x-hidden">
        {/* Banner Dòng Chữ Thử Nghiệm & Lối Tắt Kiosk / Đổi Tài Khoản */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white text-[11px] font-medium py-1 px-3 sm:px-4 flex items-center justify-between shadow-xs select-none z-30 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
            <span className="font-extrabold uppercase tracking-wider text-amber-100 text-[10px] sm:text-[11px]">BẢN MOBILE UTT</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsKioskMode(true)}
              className="px-2 py-0.5 rounded-full bg-black/25 hover:bg-black/40 text-[10px] font-bold text-white transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              title="Mở ngay Kiosk cửa giảng đường"
            >
              <span>🚪 Kiosk Cửa</span>
            </button>
            <button
              onClick={() => setIsRoleSwitcherOpen(true)}
              className="px-2 py-0.5 rounded-full bg-black/25 hover:bg-black/40 text-[10px] font-bold text-white transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              title="Chuyển đổi tài khoản SV / GV"
            >
              <span>🔄 Đổi vai trò</span>
            </button>
          </div>
        </div>

        {/* Top Bar */}
        <TopNavBar
          currentUser={currentUser}
          onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          isDark={isDark}
          onToggleDark={() => setIsDark(!isDark)}
          activeTab={activeTab}
          setActiveTab={tab => {
            setActiveTab(tab);
            setLiveMonitorSessionId(null);
          }}
          onOpenQuickAttendance={() => setIsAttendanceModalOpen(true)}
          onOpenKiosk={() => setIsKioskMode(true)}
          onOpenMobileModal={() => setIsMobileModalOpen(true)}
          isMobilePreviewActive={true}
        />

      {/* Main Content Viewport */}
      <main className="flex-1 w-full">
        {/* STUDENT VIEWS */}
        {currentUser.role === 'student' && (
          <>
            {activeTab === 'dashboard' && (
              <StudentDashboard
                student={currentUser as Student}
                onOpenAttendanceModal={() => setIsAttendanceModalOpen(true)}
                onOpenRegistrationModal={() => setIsRegisterModalOpen(true)}
                onNavigateTab={tab => setActiveTab(tab)}
                onOpenKiosk={() => setIsKioskMode(true)}
                onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
              />
            )}
            {activeTab === 'attendance' && (
              <StudentDashboard
                student={currentUser as Student}
                onOpenAttendanceModal={() => setIsAttendanceModalOpen(true)}
                onOpenRegistrationModal={() => setIsRegisterModalOpen(true)}
                onNavigateTab={tab => setActiveTab(tab)}
                onOpenKiosk={() => setIsKioskMode(true)}
                onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
              />
            )}
            {activeTab === 'schedule' && (
              <StudentSchedule
                student={currentUser as Student}
                onOpenAttendance={() => setIsAttendanceModalOpen(true)}
              />
            )}
            {activeTab === 'history' && (
              <StudentHistory
                student={currentUser as Student}
                onOpenAppealsModal={sessId => setAppealsSessionId(sessId)}
              />
            )}
            {activeTab === 'profile' && (
              <StudentProfile
                student={currentUser as Student}
                onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
              />
            )}
          </>
        )}

        {/* LECTURER VIEWS */}
        {currentUser.role === 'lecturer' && (
          <>
            {liveMonitorSessionId ? (
              <LiveAttendanceMonitor
                sessionId={liveMonitorSessionId}
                onBack={() => setLiveMonitorSessionId(null)}
              />
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <LecturerDashboard
                    lecturer={currentUser as Lecturer}
                    onOpenCreateSession={() => setIsCreateSessionModalOpen(true)}
                    onNavigateTab={tab => setActiveTab(tab)}
                    onOpenLiveMonitor={sessId => setLiveMonitorSessionId(sessId)}
                    onOpenKiosk={() => setIsKioskMode(true)}
                    onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
                  />
                )}
                {activeTab === 'monitor' && (
                  <LiveAttendanceMonitor
                    sessionId={activeSession ? activeSession.id : db.getSessions()[0]?.id}
                    onBack={() => setActiveTab('dashboard')}
                  />
                )}
                {activeTab === 'classes' && (
                  <LecturerClasses lecturer={currentUser as Lecturer} />
                )}
                {activeTab === 'appeals' && (
                  <LecturerAppeals lecturer={currentUser as Lecturer} />
                )}
                {activeTab === 'reports' && (
                  <LecturerReports
                    lecturer={currentUser as Lecturer}
                    onOpenSessionMonitor={sessId => setLiveMonitorSessionId(sessId)}
                  />
                )}
              </>
            )}
          </>
        )}

        {/* ADMIN VIEWS */}
        {currentUser.role === 'admin' && (
          <>
            {liveMonitorSessionId ? (
              <LiveAttendanceMonitor
                sessionId={liveMonitorSessionId}
                onBack={() => setLiveMonitorSessionId(null)}
              />
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <AdminDashboard
                    admin={currentUser}
                    onNavigateTab={tab => setActiveTab(tab)}
                    onOpenKiosk={() => setIsKioskMode(true)}
                    onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
                  />
                )}
                {activeTab === 'students' && <AdminStudents />}
                {activeTab === 'lecturers' && <AdminLecturers />}
                {activeTab === 'courses' && <AdminCourses />}
                {activeTab === 'sessions' && (
                  <AdminSessions
                    onSelectSession={sessId => setLiveMonitorSessionId(sessId)}
                  />
                )}
                {activeTab === 'face_settings' && <AdminFaceSettings />}
                {activeTab === 'audit_logs' && <AdminAuditLogs />}
                {activeTab === 'reports' && <AdminReports />}
              </>
            )}
          </>
        )}
      </main>

      {/* University Footer with UTT Logo */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c2340]/90 py-6 px-4 transition-colors">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <UttLogo size="sm" showText={true} />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Trụ sở chính Phú Thọ: 278 Lam Sơn, Vĩnh Yên, Phú Thọ · Phân hiệu Hà Nội: 54 Triều Khúc, Thanh Liệt, TP Hà Nội
              </span>
              <span aria-hidden="true" className="text-orange-500">·</span>
              <span className="text-orange-600 dark:text-orange-400 font-bold">Nghị định 13/2023/NĐ-CP (Bảo vệ dữ liệu cá nhân)</span>
            </div>
          </div>

          {/* 3 Campuses Directory */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Building className="w-3.5 h-3.5" />
                  <span>Trụ sở chính Phú Thọ</span>
                </span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded font-mono font-semibold">
                  TS-PT (Trụ sở chính)
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                <span>278 Lam Sơn, Vĩnh Yên, Phú Thọ</span>
              </p>
              <div className="text-[10px] text-slate-400 pt-0.5 font-mono">ĐT: 0210.384.6293</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <Building className="w-3.5 h-3.5" />
                  <span>Phân hiệu Hà Nội</span>
                </span>
                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded font-mono font-semibold">
                  PH-HN (Phân hiệu)
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                <span>54 Triều Khúc, Thanh Liệt, TP Hà Nội</span>
              </p>
              <div className="text-[10px] text-slate-400 pt-0.5 font-mono">ĐT: 024.3854.4264</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                  <Building className="w-3.5 h-3.5" />
                  <span>Trung tâm đào tạo Thái Nguyên</span>
                </span>
                <span className="text-[10px] bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 rounded font-mono font-semibold">
                  CS-TN
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                <span>999 Phú Thái, Phan Đình Phùng, Thái Nguyên</span>
              </p>
              <div className="text-[10px] text-slate-400 pt-0.5 font-mono">ĐT: 0208.385.5564</div>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Ergonomic Bottom Bar */}
      <BottomNav
        role={currentUser.role}
        activeTab={activeTab}
        setActiveTab={tab => {
          setActiveTab(tab);
          setLiveMonitorSessionId(null);
        }}
        onOpenQuickAttendance={() => setIsAttendanceModalOpen(true)}
        onOpenKiosk={() => setIsKioskMode(true)}
        onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
      />

      {/* Modals */}
      <RoleSwitcherModal
        isOpen={isRoleSwitcherOpen}
        onClose={() => setIsRoleSwitcherOpen(false)}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        userId={currentUser.id}
      />

      {currentUser.role === 'student' && (
        <>
          <FaceAttendanceModal
            isOpen={isAttendanceModalOpen}
            onClose={() => setIsAttendanceModalOpen(false)}
            student={currentUser as Student}
            onSuccessCheckIn={() => {
              // Trigger state refresh
              setCurrentUser({ ...currentUser });
            }}
          />

          <FaceRegistrationModal
            isOpen={isRegisterModalOpen}
            onClose={() => setIsRegisterModalOpen(false)}
            student={currentUser as Student}
            onRegisteredSuccess={() => {
              const updatedStudent: Student = { ...(currentUser as Student), faceRegistered: true };
              setCurrentUser(updatedStudent);
            }}
          />

          {appealsSessionId && (
            <StudentAppealsModal
              isOpen={Boolean(appealsSessionId)}
              onClose={() => setAppealsSessionId(null)}
              student={currentUser as Student}
              sessionId={appealsSessionId}
            />
          )}
        </>
      )}

      {currentUser.role === 'lecturer' && (
        <CreateSessionModal
          isOpen={isCreateSessionModalOpen}
          onClose={() => setIsCreateSessionModalOpen(false)}
          lecturer={currentUser as Lecturer}
          onSessionCreated={sessId => {
            setLiveMonitorSessionId(sessId);
          }}
        />
      )}

      {/* PWA & Mobile Installation / QR Modal */}
      <PwaInstallModal
        isOpen={isMobileModalOpen}
        onClose={() => setIsMobileModalOpen(false)}
        onToggleMobilePreview={() => setIsMobilePreview(!isMobilePreview)}
        isMobilePreviewActive={isMobilePreview}
      />
      </div>
    </div>
  );
}
