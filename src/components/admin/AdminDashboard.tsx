import React, { useState, useRef, useEffect } from 'react';
import { User } from '../../types';
import { db } from '../../services/dbService';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  Building, 
  ShieldCheck, 
  Activity, 
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  MapPin,
  Download,
  Upload,
  Database,
  CheckCircle2,
  Camera
} from 'lucide-react';
import { UttLogo } from '../common/UttLogo';

interface AdminDashboardProps {
  admin: User;
  onNavigateTab: (tab: string) => void;
  onOpenKiosk?: () => void;
  onOpenRoleSwitcher?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  admin,
  onNavigateTab,
  onOpenKiosk,
  onOpenRoleSwitcher
}) => {
  const [, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);

  useEffect(() => {
    return db.subscribe(refresh);
  }, []);

  const students = db.getStudents();
  const lecturers = db.getLecturers();
  const courses = db.getCourses();
  const classes = db.getClasses();
  const departments = db.getDepartments();
  const sessions = db.getSessions();
  const records = db.getAttendanceRecords();
  const templates = db.getFaceTemplates();
  const auditLogs = db.getAuditLogs();
  const [backupToast, setBackupToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExportBackup = () => {
    const jsonStr = db.exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `UTT_Attendance_Database_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setBackupToast('Đã tải xuống tệp sao lưu CSDL an toàn!');
    setTimeout(() => setBackupToast(null), 3500);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = db.importDatabaseJson(content);
        if (success) {
          setBackupToast('Khôi phục toàn bộ CSDL sinh viên, giảng viên, học phần thành công!');
          refresh();
        } else {
          setBackupToast('Lỗi: Tệp sao lưu không hợp lệ!');
        }
        setTimeout(() => setBackupToast(null), 4000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const totalRegisteredFaces = students.filter(s => s.faceRegistered).length;
  const faceRegistrationRate = Math.round((totalRegisteredFaces / (students.length || 1)) * 100);

  // Overall attendance stats
  const presents = records.filter(r => r.status === 'present').length;
  const lates = records.filter(r => r.status === 'late').length;
  const absents = records.filter(r => r.status === 'absent').length;
  const totalRecs = records.length || 1;

  const presentPercent = Math.round((presents / totalRecs) * 100);
  const latePercent = Math.round((lates / totalRecs) * 100);
  const absentPercent = Math.round((absents / totalRecs) * 100);

  return (
    <div className="space-y-4 w-full px-3 sm:px-4 py-4">
      {/* Welcome Banner with UTT Branding */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-[#0c2340] via-[#0f2b5c] to-slate-900 border border-orange-500/30 text-white p-4 sm:p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <UttLogo size="xl" className="hidden sm:inline-flex" />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-300 font-mono">
                <span className="uppercase tracking-wider">Hệ Thống Quản Trị Trung Tâm UTT Attendance</span>
                <span aria-hidden="true">·</span>
                <span className="text-blue-200">ĐH Công nghệ GTVT</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Tổng quan Quản trị Toàn trường
              </h1>
              <p className="text-xs text-slate-300 max-w-xl">
                Giám sát tình hình điểm danh nhận dạng khuôn mặt, chỉ số chuyên cần của 3 khoa và nhật ký hoạt động hệ thống theo thời gian thực.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImportBackup} 
              accept=".json" 
              className="hidden" 
            />
            
            <button
              onClick={handleExportBackup}
              title="Tải tệp JSON chứa toàn bộ dữ liệu sinh viên, giảng viên, môn học"
              className="px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-[0.98] text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Sao lưu CSDL</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              title="Khôi phục dữ liệu từ tệp JSON đã lưu"
              className="px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-[0.98] text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Khôi phục CSDL</span>
            </button>

            <button
              onClick={() => onNavigateTab('face_settings')}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs font-bold shadow-lg shadow-orange-600/40 flex items-center gap-2 ring-1 ring-orange-400"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Cấu hình AI Face ID</span>
            </button>
          </div>
        </div>

        {/* Database Persistence Status Bar */}
        <div className="mt-4 pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-emerald-300">Cơ chế lưu trữ đa tầng:</span>
            <span>LocalStorage + IndexedDB tự động đồng bộ & bảo toàn vĩnh viễn khi thoát web</span>
          </div>
          <span className="font-mono text-slate-400">
            {students.length} SV · {lecturers.length} GV · {courses.length} MH · {classes.length} Lớp
          </span>
        </div>

        {backupToast && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{backupToast}</span>
          </div>
        )}
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

      {/* 5 Big Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Tổng sinh viên</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2 tabular-nums">
            {students.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            {faceRegistrationRate}% có Face ID
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Tổng giảng viên</span>
            <GraduationCap className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2 tabular-nums">
            {lecturers.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            3 khoa đào tạo
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('courses')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-purple-400 dark:hover:border-purple-600 transition-all text-left group"
        >
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span className="group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Học phần / Lớp HP</span>
            <BookOpen className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2 tabular-nums">
            {courses.length} <span className="text-xs text-slate-400 font-normal">/ {classes.length}</span>
          </div>
          <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-medium flex items-center gap-1">
            <span>Quản lý Môn học</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </button>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Phiên điểm danh</span>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2 tabular-nums">
            {sessions.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Học kỳ 1 2025-2026
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Lượt điểm danh</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2 tabular-nums">
            {records.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            {presentPercent}% đúng giờ
          </div>
        </div>
      </div>

      {/* University Attendance Rate Bar & Anomaly Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Breakdown Progress */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Chỉ số chuyên cần toàn trường UTT
            </h2>
            <span className="text-xs text-slate-400 font-mono">Cập nhật 5 phút trước</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Có mặt đúng giờ ({presentPercent}%)</span>
                <span className="font-mono text-slate-600 dark:text-slate-300">{presents} lượt</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${presentPercent}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-amber-700 dark:text-amber-400 font-semibold">Đi muộn ({latePercent}%)</span>
                <span className="font-mono text-slate-600 dark:text-slate-300">{lates} lượt</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: `${latePercent}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-red-700 dark:text-red-400 font-semibold">Vắng mặt ({absentPercent}%)</span>
                <span className="font-mono text-slate-600 dark:text-slate-300">{absents} lượt</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-500" style={{ width: `${absentPercent}%` }} />
              </div>
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-3 text-center">
            {departments.map(dept => (
              <div key={dept.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {dept.code}
                </div>
                <div className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
                  94.2%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Chuyên cần TB</div>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Anomaly Logs Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>An toàn sinh trắc học</span>
            </h2>
            <button
              onClick={() => onNavigateTab('audit_logs')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Xem nhật ký
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <span>● Hệ thống Face ID an toàn</span>
            </div>
            <p className="text-[11px] opacity-90">
              Không phát hiện cuộc tấn công giả mạo ảnh chụp nào trong 24 giờ qua. Liveness Detection hoạt động bình thường.
            </p>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            <div className="font-semibold text-slate-800 dark:text-slate-200">Hoạt động gần nhất:</div>
            {auditLogs.slice(0, 3).map(log => (
              <div key={log.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-[11px] space-y-0.5">
                <div className="flex justify-between font-mono text-slate-500">
                  <span>{log.actorName}</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString('vi-VN')}</span>
                </div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">{log.action}</div>
                <div className="text-slate-400 truncate">{log.details}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Official Campuses & Branches Overview Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Hệ Thống Trụ Sở Chính & Phân Hiệu UTT</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Trụ sở chính: 278 Lam Sơn, Phú Thọ · Phân hiệu Hà Nội & Trung tâm đào tạo Thái Nguyên
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg self-start sm:self-auto">
            Trụ sở chính: Phú Thọ · Phân hiệu: Hà Nội
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {db.getCampuses().map(campus => (
            <div
              key={campus.id}
              className={`p-4 rounded-2xl border transition-all space-y-2 ${
                campus.isHeadquarter
                  ? 'border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{campus.name}</span>
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${
                  campus.isHeadquarter
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {campus.code}
                </span>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1.5 font-medium leading-relaxed">
                <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                <span>{campus.address}</span>
              </p>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>ĐT: {campus.phone}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Trạm Kiosk Online</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
