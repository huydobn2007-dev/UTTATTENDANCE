import React, { useState, useEffect } from 'react';
import { AttendanceSession, AttendanceRecord, Course, CourseSection, Room, Student, AttendanceStatus } from '../../types';
import { db } from '../../services/dbService';
import { ExportService } from '../../services/exportService';
import { 
  Users, 
  Clock, 
  MapPin, 
  FileSpreadsheet, 
  Printer, 
  QrCode, 
  Camera, 
  ShieldCheck, 
  Check, 
  X, 
  Search, 
  AlertCircle,
  MoreVertical,
  Edit2,
  Lock,
  Play,
  RotateCcw
} from 'lucide-react';

interface LiveAttendanceMonitorProps {
  sessionId: string;
  onBack: () => void;
}

export const LiveAttendanceMonitor: React.FC<LiveAttendanceMonitorProps> = ({
  sessionId,
  onBack
}) => {
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'late' | 'pending' | 'absent'>('all');
  const [showQRModal, setShowQRModal] = useState(false);
  const [manualStudent, setManualStudent] = useState<Student | null>(null);
  const [manualStatus, setManualStatus] = useState<AttendanceStatus>('present');
  const [manualNote, setManualNote] = useState('');

  useEffect(() => {
    const update = () => {
      const sess = db.getSessionById(sessionId);
      setSession(sess || null);
      if (sess) {
        const sec = db.getCourseSectionById(sess.courseSectionId);
        if (sec) {
          const allStudents = db.getStudents().filter(s => sec.enrolledStudentIds.includes(s.id));
          setStudents(allStudents);
        }
        const recs = db.getRecordsBySession(sessionId);
        setRecords(recs);
      }
    };
    update();
    return db.subscribe(update);
  }, [sessionId]);

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center space-y-3">
        <p className="text-slate-500">Phiên điểm danh không tồn tại hoặc đã bị xóa.</p>
        <button onClick={onBack} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const section = db.getCourseSectionById(session.courseSectionId);
  const course = section ? db.getCourseById(section.courseId) : null;
  const room = db.getRoomById(session.roomId);

  const recordsMap = new Map(records.map(r => [r.studentId, r]));

  // Stats calculation
  let presentCount = 0;
  let lateCount = 0;
  let absentCount = 0;
  let pendingCount = 0;

  students.forEach(s => {
    const r = recordsMap.get(s.id);
    if (!r || r.status === 'pending') pendingCount++;
    else if (r.status === 'present') presentCount++;
    else if (r.status === 'late') lateCount++;
    else if (r.status === 'absent') absentCount++;
  });

  const handleToggleSessionStatus = () => {
    const nextStatus: 'active' | 'closed' = session.status === 'active' ? 'closed' : 'active';
    const updated: AttendanceSession = { ...session, status: nextStatus };
    db.saveSession(updated);
    setSession(updated);
  };

  const handleSaveManualAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStudent) return;

    db.saveAttendanceRecord({
      id: `rec_manual_${Date.now()}_${manualStudent.id}`,
      sessionId: session.id,
      studentId: manualStudent.id,
      checkInTime: new Date().toISOString(),
      status: manualStatus,
      verificationMethod: 'manual',
      livenessPassed: true,
      note: manualNote || 'Giảng viên duyệt thủ công tại lớp'
    });

    setManualStudent(null);
    setManualNote('');
  };

  const handleExportCSV = () => {
    if (!course || !section || !room) return;
    ExportService.exportToCSV(session, course, section, room, students, records);
  };

  const handlePrintPDF = () => {
    if (!course || !section || !room) return;
    ExportService.printAttendanceReport(session, course, section, room, students, records);
  };

  // Filter table rows
  const filteredStudents = students.filter(s => {
    const rec = recordsMap.get(s.id);
    const currStatus = rec ? rec.status : 'pending';

    if (statusFilter !== 'all' && currStatus !== statusFilter) return false;
    if (searchTerm) {
      const matchName = s.fullName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCode = s.code.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchName && !matchCode) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline mb-1 inline-flex items-center gap-1"
          >
            ← Quay lại trang Giảng viên
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {course?.code} - {course?.name}
            </h1>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                session.status === 'active'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {session.status === 'active' ? '● Đang mở điểm danh' : 'Đã đóng phiên'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
            <span>Mã phiên: {session.sessionCode}</span>
            <span>·</span>
            <span>Phòng: {room?.code}</span>
            <span>·</span>
            <span>Khung giờ: {session.startTime} - {session.endTime}</span>
            <span>·</span>
            <span>Mốc tính muộn: {session.lateCutoffTime}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowQRModal(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs"
          >
            <QrCode className="w-4 h-4 text-blue-600" />
            <span>Chiếu mã QR</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>In / PDF</span>
          </button>

          <button
            onClick={handleToggleSessionStatus}
            className={`px-4 py-2 text-xs font-semibold rounded-xl text-white shadow-xs flex items-center gap-1.5 ${
              session.status === 'active'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {session.status === 'active' ? (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Đóng phiên</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Mở lại phiên</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Realtime 4-Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter('present')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'present'
              ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400">
            <span>Có mặt (Đúng giờ)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2 tabular-nums">
            {presentCount} <span className="text-xs font-normal text-slate-400">/ {students.length}</span>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('late')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'late'
              ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400">
            <span>Đi muộn (Sau mốc {session.lateCutoffTime})</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-2 tabular-nums">
            {lateCount} <span className="text-xs font-normal text-slate-400">sinh viên</span>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'pending'
              ? 'border-slate-500 bg-slate-100 dark:bg-slate-800/60'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Chưa điểm danh</span>
            <span className="w-2 h-2 rounded-full bg-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-700 dark:text-slate-300 mt-2 tabular-nums">
            {pendingCount} <span className="text-xs font-normal text-slate-400">chưa quét</span>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'all'
              ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-400">
            <span>Tỷ lệ có mặt tại lớp</span>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-2 tabular-nums">
            {students.length > 0 ? Math.round(((presentCount + lateCount) / students.length) * 100) : 0}%
          </div>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên hoặc mã SV..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              statusFilter === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            Tất cả ({students.length})
          </button>
          <button
            onClick={() => setStatusFilter('present')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              statusFilter === 'present' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            Có mặt ({presentCount})
          </button>
          <button
            onClick={() => setStatusFilter('late')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              statusFilter === 'late' ? 'bg-amber-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            Đi muộn ({lateCount})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              statusFilter === 'pending' ? 'bg-slate-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            Chưa điểm danh ({pendingCount})
          </button>
        </div>
      </div>

      {/* Realtime Attendance Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4 w-32 font-mono">Mã SV</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4 w-28 text-center font-mono">Thời gian</th>
                <th className="py-3 px-4 w-32 text-center">Trạng thái</th>
                <th className="py-3 px-4 w-28 text-center font-mono">Độ khớp AI</th>
                <th className="py-3 px-4">Xác thực sinh trắc</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Không có sinh viên nào trong danh sách lọc
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => {
                  const rec = recordsMap.get(s.id);
                  const isPresent = rec?.status === 'present';
                  const isLate = rec?.status === 'late';
                  const isAbsent = rec?.status === 'absent';
                  const isPending = !rec || rec.status === 'pending';

                  let statusText = 'Chưa điểm danh';
                  let statusClass = 'text-slate-400 dark:text-slate-500 font-normal';
                  let rowBg = '';

                  if (isPresent) {
                    statusText = 'Có mặt';
                    statusClass = 'text-emerald-600 dark:text-emerald-400 font-bold';
                    rowBg = 'bg-emerald-50/20 dark:bg-emerald-950/10';
                  } else if (isLate) {
                    statusText = 'Đi muộn';
                    statusClass = 'text-amber-600 dark:text-amber-400 font-bold';
                    rowBg = 'bg-amber-50/20 dark:bg-amber-950/10';
                  } else if (isAbsent) {
                    statusText = 'Vắng';
                    statusClass = 'text-red-600 dark:text-red-400 font-bold';
                  }

                  const timeStr = rec?.checkInTime
                    ? new Date(rec.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : '-';

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${rowBg}`}
                    >
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {s.code}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {s.fullName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {s.classId.replace('class_', '').toUpperCase()}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-medium text-slate-700 dark:text-slate-300">
                        {timeStr}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={statusClass}>{statusText}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold">
                        {rec?.confidenceScore ? (
                          <span className="text-slate-700 dark:text-slate-300">
                            {rec.confidenceScore}%
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {rec?.verificationMethod === 'face' ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Face Match + Liveness</span>
                          </div>
                        ) : rec?.verificationMethod === 'manual' ? (
                          <span className="text-[11px] text-slate-500">Giảng viên duyệt tay</span>
                        ) : (
                          <span className="text-[11px] text-slate-400">-</span>
                        )}
                        {rec?.note && (
                          <div className="text-[10px] text-slate-400 italic truncate max-w-[160px]">
                            {rec.note}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setManualStudent(s);
                            setManualStatus(rec?.status || 'present');
                            setManualNote(rec?.note || '');
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          Sửa trạng thái
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Attendance Edit Modal */}
      {manualStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Điểm danh thủ công / Chỉnh sửa
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {manualStudent.fullName} ({manualStudent.code})
                </p>
              </div>
              <button onClick={() => setManualStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualAttendance} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chọn trạng thái
                </label>
                <select
                  value={manualStatus}
                  onChange={e => setManualStatus(e.target.value as AttendanceStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium"
                >
                  <option value="present">Có mặt (Đúng giờ)</option>
                  <option value="late">Đi muộn</option>
                  <option value="excused">Được miễn (Có phép)</option>
                  <option value="absent">Vắng mặt (Không phép)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lý do ghi nhận
                </label>
                <input
                  type="text"
                  value={manualNote}
                  onChange={e => setManualNote(e.target.value)}
                  placeholder="VD: Quên điện thoại, giảng viên xác nhận tại bàn số 4..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setManualStudent(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Projection QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Mã QR Phiên Điểm Danh
              </h3>
              <button onClick={() => setShowQRModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Chiếu lên màn hình máy chiếu lớp học để sinh viên quét dự phòng nếu camera gặp vấn đề
            </p>

            <div className="w-64 h-64 mx-auto p-4 bg-white rounded-2xl border-2 border-slate-900 shadow-inner flex flex-col items-center justify-center space-y-3">
              {/* Simulated high resolution QR matrix */}
              <div className="w-48 h-48 bg-slate-950 p-2 rounded-xl flex items-center justify-center">
                <QrCode className="w-40 h-40 text-white" />
              </div>
            </div>

            <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
              Mã phiên: {session.sessionCode}
            </div>

            <button
              onClick={() => setShowQRModal(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
            >
              Đóng trình chiếu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
