import React, { useState, useEffect } from 'react';
import { Student, AttendanceSession, Course, CourseSection, Room, AttendanceRecord } from '../../types';
import { db } from '../../services/dbService';
import { 
  Camera, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  TrendingUp, 
  ArrowUpRight,
  ShieldCheck,
  UserCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { UttLogo } from '../common/UttLogo';

interface StudentDashboardProps {
  student: Student;
  onOpenAttendanceModal: () => void;
  onOpenRegistrationModal: () => void;
  onNavigateTab: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  onOpenAttendanceModal,
  onOpenRegistrationModal,
  onNavigateTab
}) => {
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const update = () => {
      const sess = db.getActiveSession();
      setActiveSession(sess || null);
      if (sess) {
        const sec = db.getCourseSectionById(sess.courseSectionId);
        if (sec) {
          const crs = db.getCourseById(sec.courseId);
          setActiveCourse(crs || null);
        }
        const rm = db.getRoomById(sess.roomId);
        setActiveRoom(rm || null);
      }
      const recs = db.getRecordsByStudent(student.id);
      setRecords(recs);
    };
    update();
    return db.subscribe(update);
  }, [student.id]);

  // Attendance metrics calculation
  const totalRecords = records.length;
  const presentCount = records.filter(r => r.status === 'present').length;
  const lateCount = records.filter(r => r.status === 'late').length;
  const absentCount = records.filter(r => r.status === 'absent').length;

  // Rate calculation (weight present=100%, late=70%)
  const attendanceRate = totalRecords > 0 
    ? Math.round(((presentCount + lateCount * 0.7) / Math.max(1, totalRecords)) * 100) 
    : 100;

  const dept = db.getDepartments().find(d => d.id === student.departmentId);
  const studentClass = db.getClasses().find(c => c.id === student.classId);

  // Check if today active session is already attended
  const isAttendedToday = activeSession
    ? records.some(r => r.sessionId === activeSession.id && (r.status === 'present' || r.status === 'late'))
    : false;

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
                Xin chào, {student.fullName}!
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-200 font-mono">
                <span className="bg-white/10 px-2 py-0.5 rounded text-orange-300 font-bold">Mã SV: {student.code}</span>
                <span aria-hidden="true">·</span>
                <span>Lớp: {studentClass?.code || '72DCHT21'}</span>
                <span aria-hidden="true">·</span>
                <span className="text-blue-200">{dept?.name || 'Khoa CNTT'}</span>
              </div>
            </div>
          </div>

          {/* Quick CTA button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {!student.faceRegistered ? (
              <button
                onClick={onOpenRegistrationModal}
                className="px-5 py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white font-bold text-xs shadow-lg shadow-orange-600/40 flex items-center justify-center gap-2 transition-all"
              >
                <Camera className="w-4 h-4" />
                <span>Đăng ký Face ID ngay</span>
              </button>
            ) : activeSession ? (
              <button
                onClick={onOpenAttendanceModal}
                className={`px-6 py-3.5 rounded-2xl text-xs font-bold shadow-xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] ${
                  isAttendedToday
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/30'
                    : 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-600/40 ring-2 ring-orange-400'
                }`}
              >
                {isAttendedToday ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ĐÃ ĐIỂM DANH HÔM NAY</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span className="tracking-wide">ĐIỂM DANH SINH TRẮC HỌC</span>
                  </>
                )}
              </button>
            ) : (
              <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md text-xs text-blue-100 text-center font-mono">
                Không có phiên mở lúc này
              </div>
            )}
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-orange-500/15 blur-3xl pointer-events-none" />
      </div>

      {/* Metric Cards - 4 Columns */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Tỷ lệ chuyên cần</span>
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {attendanceRate}%
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Đạt chuẩn</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                attendanceRate >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
        </div>

        {/* Present Count */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Có mặt đúng giờ</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {presentCount}
            </span>
            <span className="text-xs text-slate-400">buổi</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Ghi nhận nhận diện khuôn mặt
          </p>
        </div>

        {/* Late Count */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Đi muộn</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {lateCount}
            </span>
            <span className="text-xs text-slate-400">buổi</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Sau mốc thời gian quy định
          </p>
        </div>

        {/* Absent Count */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Vắng mặt</span>
            <span className="w-2 h-2 rounded-full bg-red-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {absentCount}
            </span>
            <span className="text-xs text-slate-400">buổi</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Tối đa 20% tổng số tiết
          </p>
        </div>
      </div>

      {/* Main Grid: Today's Class & Recent Attendance Records */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's active / upcoming sessions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Buổi học hôm nay
            </h2>
            <button
              onClick={() => onNavigateTab('schedule')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium"
            >
              <span>Xem toàn bộ lịch tuần</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeSession && activeCourse ? (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 shadow-xs relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono text-blue-600 dark:text-blue-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>ĐANG DIỄN RA PHIÊN ĐIỂM DANH</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {activeCourse.name} ({activeCourse.code})
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {activeSession.startTime} - {activeSession.endTime}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {activeRoom?.code} ({activeRoom?.building})
                    </span>
                    <span>·</span>
                    <span>Mốc tính muộn: {activeSession.lateCutoffTime}</span>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={onOpenAttendanceModal}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{isAttendedToday ? 'Xem xác nhận' : 'Quét khuôn mặt'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Hôm nay bạn không còn ca học nào cần điểm danh
              </p>
              <p className="text-xs text-slate-400">
                Hãy chuẩn bị cho ca học tiếp theo vào ngày mai tại phòng Lab 501-H1.
              </p>
            </div>
          )}

          {/* Biometric Status & Security Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                student.faceRegistered 
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
              }`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Dữ liệu khuôn mặt sinh trắc học</span>
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                    {student.faceRegistered ? 'Đã kích hoạt' : 'Chưa đăng ký'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Mã hóa vector 128-d an toàn theo quy chuẩn UTT. Bảo vệ chống giả mạo ảnh chụp.
                </p>
              </div>
            </div>
            {!student.faceRegistered && (
              <button
                onClick={onOpenRegistrationModal}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shrink-0"
              >
                Đăng ký ngay
              </button>
            )}
          </div>
        </div>

        {/* Right Col: Recent Attendance History Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Lịch sử gần đây
            </h2>
            <button
              onClick={() => onNavigateTab('history')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Xem tất cả
            </button>
          </div>

          <div className="space-y-2.5">
            {records.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                Chưa có dữ liệu điểm danh
              </div>
            ) : (
              records.slice(0, 4).map(rec => {
                const session = db.getSessionById(rec.sessionId);
                const sec = session ? db.getCourseSectionById(session.courseSectionId) : null;
                const crs = sec ? db.getCourseById(sec.courseId) : null;

                const statusColor =
                  rec.status === 'present'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : rec.status === 'late'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-600 dark:text-red-400';

                const statusLabel =
                  rec.status === 'present' ? 'Có mặt' : rec.status === 'late' ? 'Đi muộn' : 'Vắng';

                return (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {crs?.name || 'Lập trình Web Nâng Cao'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          {session?.date || '2026-09-28'} · {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-xs font-bold ${statusColor}`}>
                          {statusLabel}
                        </div>
                        {rec.confidenceScore && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Khớp {rec.confidenceScore}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
