import React, { useState } from 'react';
import { Student, AttendanceRecord, Course } from '../../types';
import { db } from '../../services/dbService';
import { 
  Filter, 
  Search, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  AlertCircle, 
  FileText, 
  CheckCircle2,
  XCircle,
  HelpCircle,
  Calendar
} from 'lucide-react';

interface StudentHistoryProps {
  student: Student;
  onOpenAppealsModal: (sessionId: string) => void;
}

export const StudentHistory: React.FC<StudentHistoryProps> = ({
  student,
  onOpenAppealsModal
}) => {
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const records = db.getRecordsByStudent(student.id);
  const courses = db.getCourses();
  const sessions = db.getSessions();
  const requests = db.getRequestsByStudent(student.id);

  // Filter records
  const filteredRecords = records.filter(rec => {
    const session = db.getSessionById(rec.sessionId);
    const sec = session ? db.getCourseSectionById(session.courseSectionId) : null;
    const crs = sec ? db.getCourseById(sec.courseId) : null;

    if (selectedCourse !== 'all' && crs?.id !== selectedCourse) return false;
    if (selectedStatus !== 'all' && rec.status !== selectedStatus) return false;
    if (searchTerm) {
      const matchCourse = crs?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCode = crs?.code.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchCourse && !matchCode) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Lịch sử điểm danh sinh viên
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Xem nhật ký xác thực khuôn mặt và gửi khiếu nại nếu có sai sót
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm môn học..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Course select */}
          <select
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">Tất cả học phần</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>

          {/* Status select */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="present">Có mặt</option>
            <option value="late">Đi muộn</option>
            <option value="absent">Vắng mặt</option>
            <option value="excused">Được miễn</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4">Ngày học</th>
                <th className="py-3 px-4">Học phần</th>
                <th className="py-3 px-4">Phòng</th>
                <th className="py-3 px-4 text-center">Giờ quét</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-center">Độ khớp AI</th>
                <th className="py-3 px-4">Bằng chứng xác thực</th>
                <th className="py-3 px-4 text-right">Khiếu nại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Không tìm thấy dữ liệu điểm danh phù hợp
                  </td>
                </tr>
              ) : (
                filteredRecords.map(rec => {
                  const session = db.getSessionById(rec.sessionId);
                  const sec = session ? db.getCourseSectionById(session.courseSectionId) : null;
                  const crs = sec ? db.getCourseById(sec.courseId) : null;
                  const rm = session ? db.getRoomById(session.roomId) : null;

                  const existingAppeal = requests.find(r => r.sessionId === rec.sessionId);

                  const statusColor =
                    rec.status === 'present'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : rec.status === 'late'
                      ? 'text-amber-600 dark:text-amber-400'
                      : rec.status === 'excused'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-red-600 dark:text-red-400';

                  const statusLabel =
                    rec.status === 'present'
                      ? 'Có mặt'
                      : rec.status === 'late'
                      ? 'Đi muộn'
                      : rec.status === 'excused'
                      ? 'Được miễn'
                      : 'Vắng';

                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-slate-100">
                        {session?.date || '2026-09-28'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {crs?.name || 'Lập trình Web Nâng Cao'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {crs?.code}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {rm?.code}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {rec.checkInTime ? (
                          new Date(rec.checkInTime).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-bold ${statusColor}`}>{statusLabel}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold">
                        {rec.confidenceScore ? (
                          <span className="text-slate-700 dark:text-slate-300">
                            {rec.confidenceScore}%
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          {rec.verificationMethod === 'face' && (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Face + Liveness
                            </span>
                          )}
                          {rec.verificationMethod === 'manual' && (
                            <span className="text-slate-500">Giảng viên duyệt tay</span>
                          )}
                        </div>
                        {rec.note && (
                          <div className="text-[10px] text-slate-400 italic mt-0.5">
                            {rec.note}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {existingAppeal ? (
                          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                            {existingAppeal.status === 'pending'
                              ? 'Chờ duyệt khiếu nại'
                              : existingAppeal.status === 'approved'
                              ? 'Đã duyệt khiếu nại'
                              : 'Bị từ chối khiếu nại'}
                          </span>
                        ) : (
                          <button
                            onClick={() => onOpenAppealsModal(rec.sessionId)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            Khiếu nại
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
