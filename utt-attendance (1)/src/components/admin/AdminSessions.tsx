import React, { useState } from 'react';
import { AttendanceSession, CourseSection } from '../../types';
import { db } from '../../services/dbService';
import { 
  Calendar, 
  Search, 
  MapPin, 
  Clock, 
  Users, 
  Play, 
  Lock, 
  Eye, 
  Plus, 
  BookOpen, 
  X, 
  Check, 
  ShieldCheck,
  Building
} from 'lucide-react';

interface AdminSessionsProps {
  onSelectSession: (sessionId: string) => void;
}

export const AdminSessions: React.FC<AdminSessionsProps> = ({ onSelectSession }) => {
  const [sessions, setSessions] = useState<AttendanceSession[]>(db.getSessions());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');

  // Modals
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [isNewClassModalOpen, setIsNewClassModalOpen] = useState(false);

  const courses = db.getCourses();
  const sections = db.getCourseSections();
  const rooms = db.getRooms();
  const lecturers = db.getLecturers();
  const records = db.getAttendanceRecords();
  const students = db.getStudents();

  // Form states for New Session
  const [sessionSectionId, setSessionSectionId] = useState(sections[0]?.id || '');
  const [sessionRoomId, setSessionRoomId] = useState(rooms[0]?.id || '');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [sessionStartTime, setSessionStartTime] = useState('07:00');
  const [sessionEndTime, setSessionEndTime] = useState('09:15');
  const [sessionLateCutoff, setSessionLateCutoff] = useState('07:15');
  const [sessionActivateNow, setSessionActivateNow] = useState(true);

  // Form states for New Class (CourseSection)
  const [newClassCode, setNewClassCode] = useState('');
  const [newClassCourseId, setNewClassCourseId] = useState(courses[0]?.id || '');
  const [newClassLecturerId, setNewClassLecturerId] = useState(lecturers[0]?.id || '');
  const [newClassSemester, setNewClassSemester] = useState('HK1');
  const [newClassYear, setNewClassYear] = useState('2025-2026');
  const [newClassTotalSessions, setNewClassTotalSessions] = useState(15);

  const refresh = () => setSessions(db.getSessions());

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const sec = sections.find(s => s.id === sessionSectionId);
    if (!sec) return;

    // If activating this session now, close any existing active session
    if (sessionActivateNow) {
      const allSessions = db.getSessions();
      allSessions.forEach(s => {
        if (s.status === 'active') {
          db.saveSession({ ...s, status: 'closed' });
        }
      });
    }

    const todayStr = sessionDate.replace(/-/g, '');
    const newSession: AttendanceSession = {
      id: `session_${Date.now()}`,
      courseSectionId: sessionSectionId,
      roomId: sessionRoomId,
      lecturerId: sec.lecturerId,
      date: sessionDate,
      startTime: sessionStartTime,
      endTime: sessionEndTime,
      earlyCheckinMinutes: 15,
      lateCutoffTime: sessionLateCutoff,
      requireLiveness: true,
      requireGeofence: true,
      authMethod: 'face',
      status: sessionActivateNow ? 'active' : 'upcoming',
      sessionCode: `SES-${todayStr}-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString()
    };

    db.saveSession(newSession);
    refresh();
    setIsNewSessionModalOpen(false);
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassCode) return;

    // Default 15 enrolled students from general student pool
    const defaultStudentIds = students.slice(0, 15).map(s => s.id);

    const newSection: CourseSection = {
      id: `sec_${Date.now()}`,
      code: newClassCode,
      courseId: newClassCourseId,
      lecturerId: newClassLecturerId,
      semester: newClassSemester,
      academicYear: newClassYear,
      totalSessions: Number(newClassTotalSessions) || 15,
      enrolledStudentIds: defaultStudentIds
    };

    db.saveCourseSection(newSection);
    setIsNewClassModalOpen(false);
    refresh();
  };

  const handleToggleSessionStatus = (session: AttendanceSession) => {
    const newStatus = session.status === 'active' ? 'closed' : 'active';
    if (newStatus === 'active') {
      // Close other active sessions
      const all = db.getSessions();
      all.forEach(s => {
        if (s.id !== session.id && s.status === 'active') {
          db.saveSession({ ...s, status: 'closed' });
        }
      });
    }
    db.saveSession({ ...session, status: newStatus });
    refresh();
  };

  const filtered = sessions.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (searchTerm) {
      const matchCode = s.sessionCode.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchCode) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header bar with Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            <span>Quản lý Các Phiên Điểm Danh & Lớp Học Phần</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Mở phiên điểm danh mới cho trạm cửa giảng đường, tạo lớp học phần và theo dõi ca học
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setNewClassCode(`72DCHT21-IT302-0${sections.length + 1}`);
              setIsNewClassModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>+ Thêm lớp học phần</span>
          </button>

          <button
            onClick={() => setIsNewSessionModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tạo phiên điểm danh mới</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã phiên (VD: SES-202610...)"
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-medium ${
              statusFilter === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-xl font-medium ${
              statusFilter === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            Đang hoạt động (Kiosk)
          </button>
          <button
            onClick={() => setStatusFilter('closed')}
            className={`px-3 py-1.5 rounded-xl font-medium ${
              statusFilter === 'closed' ? 'bg-slate-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            Đã kết thúc
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4">Mã phiên</th>
                <th className="py-3 px-4">Học phần / Lớp</th>
                <th className="py-3 px-4">Giảng viên</th>
                <th className="py-3 px-4">Phòng</th>
                <th className="py-3 px-4 font-mono">Thời gian</th>
                <th className="py-3 px-4 text-center">Đã điểm danh</th>
                <th className="py-3 px-4 text-center">Trạng thái Kiosk</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(s => {
                const sec = sections.find(sc => sc.id === s.courseSectionId);
                const crs = sec ? courses.find(c => c.id === sec.courseId) : null;
                const rm = rooms.find(r => r.id === s.roomId);
                const lec = lecturers.find(l => l.id === s.lecturerId);
                const sessRecs = records.filter(r => r.sessionId === s.id);
                const attendedCount = sessRecs.filter(r => r.status === 'present' || r.status === 'late').length;
                const totalInClass = sec?.enrolledStudentIds.length || 0;
                const isActive = s.status === 'active';

                return (
                  <tr
                    key={s.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                      isActive ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {s.sessionCode}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {crs?.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {sec?.code}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {lec?.academicTitle} {lec?.fullName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {rm?.code}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      <div>{s.date}</div>
                      <div className="text-[11px] text-slate-400">{s.startTime} - {s.endTime} (Mốc muộn: {s.lateCutoffTime})</div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold">
                      <span className="text-emerald-600 dark:text-emerald-400">{attendedCount}</span>
                      <span className="text-slate-400 font-normal"> / {totalInClass}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleSessionStatus(s)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                          isActive 
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-200' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                        title="Bấm để bật/tắt làm phiên hoạt động chính cho Kiosk cửa"
                      >
                        {isActive ? <Play className="w-3 h-3 fill-emerald-600" /> : <Lock className="w-3 h-3" />}
                        <span>{isActive ? 'Đang mở tại Cửa' : 'Đã đóng'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => onSelectSession(s.id)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 font-medium inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Giám sát</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: TẠO PHIÊN ĐIỂM DANH MỚI */}
      {isNewSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <span>Tạo phiên điểm danh mới</span>
              </h3>
              <button onClick={() => setIsNewSessionModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chọn Lớp học phần
                </label>
                <select
                  value={sessionSectionId}
                  onChange={e => setSessionSectionId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  {sections.map(sec => {
                    const crs = courses.find(c => c.id === sec.courseId);
                    return (
                      <option key={sec.id} value={sec.id}>
                        {sec.code} - {crs?.name} ({sec.enrolledStudentIds.length} SV)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phòng học / Giảng đường
                  </label>
                  <select
                    value={sessionRoomId}
                    onChange={e => setSessionRoomId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    {rooms.map(rm => (
                      <option key={rm.id} value={rm.id}>
                        {rm.code} - {rm.building} (Sức chứa: {rm.capacity} SV)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ngày diễn ra
                  </label>
                  <input
                    type="date"
                    required
                    value={sessionDate}
                    onChange={e => setSessionDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bắt đầu
                  </label>
                  <input
                    type="time"
                    required
                    value={sessionStartTime}
                    onChange={e => setSessionStartTime(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kết thúc
                  </label>
                  <input
                    type="time"
                    required
                    value={sessionEndTime}
                    onChange={e => setSessionEndTime(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mốc tính muộn
                  </label>
                  <input
                    type="time"
                    required
                    value={sessionLateCutoff}
                    onChange={e => setSessionLateCutoff(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono"
                  />
                </div>
              </div>

              {/* Set as active Kiosk session */}
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-blue-900 dark:text-blue-100">
                    Kích hoạt làm phiên cửa Kiosk ngay
                  </div>
                  <div className="text-[11px] text-blue-700 dark:text-blue-300">
                    Trạm cửa giảng đường sẽ tự động chuyển sang điểm danh lớp này
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={sessionActivateNow}
                  onChange={e => setSessionActivateNow(e.target.checked)}
                  className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewSessionModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Tạo phiên điểm danh</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TẠO LỚP HỌC PHẦN MỚI */}
      {isNewClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <span>Thêm lớp học phần mới</span>
              </h3>
              <button onClick={() => setIsNewClassModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mã lớp học phần
                </label>
                <input
                  type="text"
                  required
                  value={newClassCode}
                  onChange={e => setNewClassCode(e.target.value)}
                  placeholder="72DCHT21-IT302-02"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Môn học / Học phần
                </label>
                <select
                  value={newClassCourseId}
                  onChange={e => setNewClassCourseId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name} ({c.credits} tín chỉ)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Giảng viên phụ trách
                </label>
                <select
                  value={newClassLecturerId}
                  onChange={e => setNewClassLecturerId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  {lecturers.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.academicTitle} {l.fullName} ({l.code} - {l.officeRoom})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Học kỳ
                  </label>
                  <select
                    value={newClassSemester}
                    onChange={e => setNewClassSemester(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                  >
                    <option value="HK1">HK1</option>
                    <option value="HK2">HK2</option>
                    <option value="Hè">Hè</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Năm học
                  </label>
                  <input
                    type="text"
                    value={newClassYear}
                    onChange={e => setNewClassYear(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số buổi học
                  </label>
                  <input
                    type="number"
                    value={newClassTotalSessions}
                    onChange={e => setNewClassTotalSessions(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewClassModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Lưu lớp học phần</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
