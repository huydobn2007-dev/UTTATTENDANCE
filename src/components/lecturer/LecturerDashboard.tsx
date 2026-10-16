import React, { useState, useEffect } from 'react';
import { Lecturer, AttendanceSession, Course, CourseSection, Room, AttendanceRecord, Student } from '../../types';
import { db } from '../../services/dbService';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Clock, 
  Plus, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  ChevronRight,
  Sparkles,
  Camera
} from 'lucide-react';
import { UttLogo } from '../common/UttLogo';

interface LecturerDashboardProps {
  lecturer: Lecturer;
  onOpenCreateSession: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenLiveMonitor: (sessionId: string) => void;
  onOpenKiosk?: () => void;
  onOpenRoleSwitcher?: () => void;
}

export const LecturerDashboard: React.FC<LecturerDashboardProps> = ({
  lecturer,
  onOpenCreateSession,
  onNavigateTab,
  onOpenLiveMonitor,
  onOpenKiosk,
  onOpenRoleSwitcher
}) => {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);

  useEffect(() => {
    const update = () => {
      const allSessions = db.getSessions().filter(s => s.lecturerId === lecturer.id);
      setSessions(allSessions);
      const active = allSessions.find(s => s.status === 'active');
      setActiveSession(active || null);
    };
    update();
    return db.subscribe(update);
  }, [lecturer.id]);

  const courseSections = db.getCourseSections().filter(s => s.lecturerId === lecturer.id);
  const totalStudents = courseSections.reduce((acc, curr) => acc + curr.enrolledStudentIds.length, 0);

  // Active session stats
  let presentCount = 0;
  let lateCount = 0;
  let totalInActive = 0;
  let activeCourse: Course | undefined;
  let activeRoom: Room | undefined;

  if (activeSession) {
    const sec = db.getCourseSectionById(activeSession.courseSectionId);
    activeCourse = sec ? db.getCourseById(sec.courseId) : undefined;
    activeRoom = db.getRoomById(activeSession.roomId);
    totalInActive = sec ? sec.enrolledStudentIds.length : 0;
    const records = db.getRecordsBySession(activeSession.id);
    presentCount = records.filter(r => r.status === 'present').length;
    lateCount = records.filter(r => r.status === 'late').length;
  }
  const pendingCount = Math.max(0, totalInActive - presentCount - lateCount);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Welcome Banner with UTT Branding */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-[#0c2340] via-[#0f2b5c] to-slate-900 border border-orange-500/30 text-white p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <UttLogo size="xl" className="inline-flex shrink-0" />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-300 font-mono">
                <span className="uppercase tracking-wider">Trường ĐH Công nghệ Giao thông Vận tải · UTT</span>
                <span aria-hidden="true">·</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  Bản Thử Nghiệm
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Xin chào, {lecturer.academicTitle} {lecturer.fullName}!
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200 font-mono">
                <span className="bg-white/10 px-2 py-0.5 rounded text-orange-300 font-bold">Mã GV: {lecturer.code}</span>
                <span aria-hidden="true">·</span>
                <span>Văn phòng: {lecturer.officeRoom}</span>
                <span aria-hidden="true">·</span>
                <span>Email: {lecturer.email}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenCreateSession}
              className="px-5 py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white font-bold text-xs shadow-lg shadow-orange-600/40 flex items-center gap-2 transition-all ring-2 ring-orange-400"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo phiên điểm danh mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts: Kiosk Cửa & Chuyển Đổi Tài Khoản */}
      <div className="grid grid-cols-2 gap-2.5">
        {onOpenKiosk && (
          <button
            onClick={onOpenKiosk}
            className="p-3 rounded-2xl bg-orange-600/10 hover:bg-orange-600/20 border border-orange-500/30 text-orange-600 dark:text-orange-400 flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer"
          >
            <Camera className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>Mở Kiosk Quét Cửa</span>
          </button>
        )}
        {onOpenRoleSwitcher && (
          <button
            onClick={onOpenRoleSwitcher}
            className="p-3 rounded-2xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-700 dark:text-blue-300 flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer"
          >
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Đổi tài khoản SV/GV</span>
          </button>
        )}
      </div>

      {/* 4 Metric Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Lớp học phần phụ trách</span>
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {courseSections.length}
            </span>
            <span className="text-xs text-slate-400">lớp</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Học kỳ 1 / 2025-2026
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Tổng số sinh viên</span>
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {totalStudents}
            </span>
            <span className="text-xs text-slate-400">sinh viên</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Đã đăng ký danh sách lớp
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Phiên đang hoạt động</span>
            <span className={`w-2.5 h-2.5 rounded-full ${activeSession ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`} />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {activeSession ? '1' : '0'}
            </span>
            <span className="text-xs text-slate-400">phiên mở</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            {activeSession ? 'Sinh viên đang điểm danh' : 'Không có phiên mở'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Tổng phiên đã tổ chức</span>
            <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {sessions.length}
            </span>
            <span className="text-xs text-slate-400">phiên</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Lưu vết đầy đủ trong hệ thống
          </p>
        </div>
      </div>

      {/* Active Live Attendance Section Banner (if running) */}
      {activeSession && (
        <div className="p-6 rounded-3xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-700 dark:text-blue-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>PHIÊN ĐIỂM DANH ĐANG HOẠT ĐỘNG REALTIME</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {activeCourse?.code} - {activeCourse?.name}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 font-mono">
                <span>Mã phiên: {activeSession.sessionCode}</span>
                <span>·</span>
                <span>Phòng: {activeRoom?.code}</span>
                <span>·</span>
                <span>Thời gian: {activeSession.startTime} - {activeSession.endTime}</span>
                <span>·</span>
                <span>Mốc tính muộn: {activeSession.lateCutoffTime}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => onOpenLiveMonitor(activeSession.id)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Mở màn hình giám sát trực tiếp</span>
              </button>
            </div>
          </div>

          {/* Quick counts bar */}
          <div className="grid grid-cols-4 gap-3 mt-6 pt-5 border-t border-blue-200/60 dark:border-blue-900/60">
            <div className="text-center">
              <div className="text-xs text-slate-500 dark:text-slate-400">Sĩ số lớp</div>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {totalInActive}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-emerald-600 dark:text-emerald-400">Có mặt đúng giờ</div>
              <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                {presentCount}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-amber-600 dark:text-amber-400">Đi muộn</div>
              <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                {lateCount}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-400">Chưa điểm danh</div>
              <div className="text-lg font-bold font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                {pendingCount}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History of sessions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Các phiên điểm danh gần đây
          </h2>
          <button
            onClick={() => onNavigateTab('reports')}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Xuất báo cáo tổng hợp
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-4">Mã phiên</th>
                  <th className="py-3 px-4">Học phần</th>
                  <th className="py-3 px-4">Phòng</th>
                  <th className="py-3 px-4">Ngày</th>
                  <th className="py-3 px-4">Khung giờ</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sessions.map(s => {
                  const sec = db.getCourseSectionById(s.courseSectionId);
                  const crs = sec ? db.getCourseById(sec.courseId) : null;
                  const rm = db.getRoomById(s.roomId);

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {s.sessionCode}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {crs?.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {crs?.code} · {sec?.code}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {rm?.code}
                      </td>
                      <td className="py-3 px-4 font-mono">{s.date}</td>
                      <td className="py-3 px-4 font-mono">
                        {s.startTime} - {s.endTime}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {s.status === 'active' ? (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            Đang mở
                          </span>
                        ) : (
                          <span className="text-slate-500">Đã đóng</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onOpenLiveMonitor(s.id)}
                          className="px-3 py-1 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                        >
                          Giám sát
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
