import React, { useState } from 'react';
import { Student, AttendanceSession } from '../../types';
import { db } from '../../services/dbService';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  Camera, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface StudentScheduleProps {
  student: Student;
  onOpenAttendance: () => void;
}

export const StudentSchedule: React.FC<StudentScheduleProps> = ({
  student,
  onOpenAttendance
}) => {
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'month'>('week');
  const [selectedDay, setSelectedDay] = useState<number>(2); // Thứ 2 (2) to Chủ nhật (8)

  const schedules = db.getSchedules();
  const courseSections = db.getCourseSections();
  const courses = db.getCourses();
  const rooms = db.getRooms();
  const lecturers = db.getLecturers();
  const activeSession = db.getActiveSession();
  const records = db.getRecordsByStudent(student.id);

  // Student enrolled sections
  const enrolledSections = courseSections.filter(sec => sec.enrolledStudentIds.includes(student.id));
  const enrolledSectionIds = enrolledSections.map(s => s.id);

  const mySchedules = schedules.filter(sch => enrolledSectionIds.includes(sch.courseSectionId));

  const daysOfWeek = [
    { num: 2, label: 'Thứ Hai', short: 'T2' },
    { num: 3, label: 'Thứ Ba', short: 'T3' },
    { num: 4, label: 'Thứ Tư', short: 'T4' },
    { num: 5, label: 'Thứ Năm', short: 'T5' },
    { num: 6, label: 'Thứ Sáu', short: 'T6' },
    { num: 7, label: 'Thứ Bảy', short: 'T7' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Lịch học & Thời khóa biểu
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Học kỳ 1 · Năm học 2025-2026 · Trường Đại học Công nghệ GTVT
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              viewMode === 'day'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Theo ngày
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              viewMode === 'week'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Theo tuần
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              viewMode === 'month'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Theo tháng
          </button>
        </div>
      </div>

      {/* Day Selector Buttons */}
      <div className="grid grid-cols-6 gap-2">
        {daysOfWeek.map(d => {
          const isSelected = selectedDay === d.num;
          const daySchedules = mySchedules.filter(s => s.dayOfWeek === d.num);
          return (
            <button
              key={d.num}
              onClick={() => setSelectedDay(d.num)}
              className={`p-3 rounded-2xl border text-center transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="text-xs font-bold">{d.label}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                {daySchedules.length} ca học
              </div>
            </button>
          );
        })}
      </div>

      {/* Schedule Content Cards */}
      <div className="space-y-3">
        {mySchedules
          .filter(sch => (viewMode === 'day' ? sch.dayOfWeek === selectedDay : true))
          .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
          .map(sch => {
            const sec = enrolledSections.find(s => s.id === sch.courseSectionId);
            const crs = sec ? courses.find(c => c.id === sec.courseId) : null;
            const rm = rooms.find(r => r.id === sch.roomId);
            const lec = sec ? lecturers.find(l => l.id === sec.lecturerId) : null;

            // Check if this schedule is currently ongoing in active session
            const isLive = activeSession && activeSession.courseSectionId === sec?.id;
            const hasAttended = records.some(
              r => r.sessionId === activeSession?.id && (r.status === 'present' || r.status === 'late')
            );

            return (
              <div
                key={sch.id}
                className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all ${
                  isLive
                    ? 'border-blue-500 shadow-md ring-1 ring-blue-500/30'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {daysOfWeek.find(d => d.num === sch.dayOfWeek)?.label}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        {sch.startTime} - {sch.endTime}
                      </span>
                      {isLive && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold animate-pulse">
                            ● ĐANG DIỄN RA
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {crs?.code} - {crs?.name}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        Phòng {rm?.code} ({rm?.building})
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {lec?.academicTitle} {lec?.fullName}
                      </span>
                      <span>·</span>
                      <span className="font-mono">Số tín chỉ: {crs?.credits}</span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    {isLive ? (
                      <button
                        onClick={onOpenAttendance}
                        className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-sm transition-all ${
                          hasAttended
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        <Camera className="w-4 h-4" />
                        <span>{hasAttended ? 'Đã điểm danh' : 'Điểm danh ngay'}</span>
                      </button>
                    ) : (
                      <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                        Chưa đến giờ
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
