import React, { useState } from 'react';
import { User, UserRole, Student, Lecturer } from '../../types';
import { db } from '../../services/dbService';
import { 
  X, 
  GraduationCap, 
  Briefcase, 
  ShieldCheck, 
  Check, 
  Search, 
  RotateCcw,
  Sparkles,
  User as UserIcon
} from 'lucide-react';
import { UttLogo } from './UttLogo';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSelectUser: (user: User) => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser
}) => {
  const [activeTab, setActiveTab] = useState<UserRole>(currentUser.role);
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const students = db.getStudents();
  const lecturers = db.getLecturers();
  const admin = db.getAdmin();

  const filteredStudents = students.filter(s => 
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLecturers = lecturers.filter(l => 
    l.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with UTT Branding */}
        <div className="p-4 sm:p-5 bg-[#0c2340] border-b border-orange-500/30 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <UttLogo size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Cổng Sinh Trắc Học & Chọn Vai Trò
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-600 text-white font-mono">
                  UTT
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Trường Đại học Công nghệ Giao thông Vận tải · 3 Vai trò: Sinh viên, Giảng viên, Quản trị viên
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 pt-3 gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveTab('student')}
            className={`flex items-center gap-2 py-2.5 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'student'
                ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Sinh viên ({students.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('lecturer')}
            className={`flex items-center gap-2 py-2.5 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'lecturer'
                ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Giảng viên ({lecturers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 py-2.5 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'admin'
                ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Quản trị viên (1)</span>
          </button>
        </div>

        {/* Quick Search */}
        {activeTab !== 'admin' && (
          <div className="p-3 border-b border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={activeTab === 'student' ? 'Tìm theo tên hoặc mã sinh viên (VD: 72DCHT21028)...' : 'Tìm giảng viên...'}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {activeTab === 'student' && (
            <div className="space-y-1.5">
              {filteredStudents.map(student => {
                const isSelected = currentUser.id === student.id;
                const isMainDemo = student.id === 'student_demo';
                return (
                  <button
                    key={student.id}
                    onClick={() => {
                      onSelectUser(student);
                      onClose();
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                        {student.avatarUrl ? (
                          <img src={student.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          student.fullName.split(' ').slice(-1)[0][0]
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {student.fullName}
                          </span>
                          {isMainDemo && (
                            <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-1.5 py-0.5 rounded">
                              Demo chính
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {student.code} · {student.classId.replace('class_', '').toUpperCase()} · {student.faceRegistered ? 'Đã đăng ký Face ID' : 'Chưa có Face ID'}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'lecturer' && (
            <div className="space-y-1.5">
              {filteredLecturers.map(lecturer => {
                const isSelected = currentUser.id === lecturer.id;
                return (
                  <button
                    key={lecturer.id}
                    onClick={() => {
                      onSelectUser(lecturer);
                      onClose();
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                        {lecturer.fullName.split(' ').slice(-1)[0][0]}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">
                          {lecturer.fullName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {lecturer.code} · {lecturer.academicTitle} · Phòng {lecturer.officeRoom}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="space-y-3 p-2">
              <button
                onClick={() => {
                  onSelectUser({
                    id: 'kiosk_lab501',
                    code: 'KIOSK-501',
                    fullName: 'Trạm Cửa Giảng Đường - Lab 501-H1',
                    email: 'kiosk.lab501@utt.edu.vn',
                    role: 'admin',
                    departmentId: 'dept_it',
                    createdAt: '2024-01-01T08:00:00Z',
                    avatarUrl: '/utt_official_logo.png'
                  });
                  onClose();
                }}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  currentUser.id === 'kiosk_lab501'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Trạm Cửa Giảng Đường (Thiết bị Kiosk UTT)</span>
                      <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-mono px-1.5 py-0.5 rounded">
                        Phòng Lab 501-H1
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Tài khoản Nhà trường · Nhận diện tự động 1:N từng sinh viên bước qua cửa
                    </div>
                  </div>
                </div>
                {currentUser.id === 'kiosk_lab501' && <Check className="w-5 h-5 text-blue-600 shrink-0" />}
              </button>

              <button
                onClick={() => {
                  onSelectUser(admin);
                  onClose();
                }}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  currentUser.id === admin.id
                    ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-sm shrink-0">
                    AD
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {admin.fullName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Mã: {admin.code} · {admin.email} · Quyền Quản trị viên Toàn trường
                    </div>
                  </div>
                </div>
                {currentUser.id === admin.id && <Check className="w-5 h-5 text-purple-600 shrink-0" />}
              </button>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <div className="font-semibold text-slate-900 dark:text-slate-200">Quyền hạn Quản trị viên:</div>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Quản lý danh mục 50 sinh viên, 5 giảng viên, khoa, lớp, phòng học</li>
                  <li>Thiết lập tham số nhận diện khuôn mặt và ngưỡng độ tin cậy AI</li>
                  <li>Tra cứu toàn bộ Audit Log nhật ký hoạt động hệ thống</li>
                  <li>Báo cáo thống kê chuyên cần toàn trường UTT</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm('Khôi phục toàn bộ cơ sở dữ liệu mẫu ban đầu?')) {
                db.resetDatabase();
                window.location.reload();
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục dữ liệu gốc</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg hover:opacity-90 transition-opacity"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
