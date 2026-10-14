import React, { useState } from 'react';
import { Lecturer, AttendanceSession, VerificationMethod } from '../../types';
import { db } from '../../services/dbService';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  Plus 
} from 'lucide-react';

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lecturer: Lecturer;
  onSessionCreated: (sessionId: string) => void;
}

export const CreateSessionModal: React.FC<CreateSessionModalProps> = ({
  isOpen,
  onClose,
  lecturer,
  onSessionCreated
}) => {
  const sections = db.getCourseSections().filter(s => s.lecturerId === lecturer.id);
  const rooms = db.getRooms();
  const courses = db.getCourses();

  const todayStr = new Date().toISOString().split('T')[0];

  const [courseSectionId, setCourseSectionId] = useState(sections[0]?.id || '');
  const [roomId, setRoomId] = useState(rooms[0]?.id || '');
  const [date, setDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('09:25');
  const [earlyCheckinMinutes, setEarlyCheckinMinutes] = useState(15);
  const [lateCutoffTime, setLateCutoffTime] = useState('07:15');
  const [requireLiveness, setRequireLiveness] = useState(true);
  const [requireGeofence, setRequireGeofence] = useState(true);
  const [authMethod, setAuthMethod] = useState<VerificationMethod>('face');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseSectionId || !roomId) return;

    const selectedSec = sections.find(s => s.id === courseSectionId);
    const crs = selectedSec ? courses.find(c => c.id === selectedSec.courseId) : null;
    const sessionCode = `SES-${date.replace(/-/g, '')}-${crs ? crs.code : 'ATT'}-${Math.floor(Math.random() * 899 + 100)}`;
    const sessionId = `session_${Date.now()}`;

    const newSession: AttendanceSession = {
      id: sessionId,
      sessionCode,
      courseSectionId,
      lecturerId: lecturer.id,
      roomId,
      date,
      startTime,
      endTime,
      earlyCheckinMinutes,
      lateCutoffTime,
      requireLiveness,
      requireGeofence,
      authMethod,
      status: 'active', // Open immediately so students can check in right now
      createdAt: new Date().toISOString()
    };

    db.saveSession(newSession);

    // Notify enrolled students
    if (selectedSec) {
      selectedSec.enrolledStudentIds.forEach(stId => {
        db.addNotification({
          id: `notif_${Date.now()}_${stId}`,
          userId: stId,
          title: 'Phiên điểm danh mới được mở',
          message: `Giảng viên ${lecturer.fullName} vừa mở phiên điểm danh môn ${crs ? crs.name : 'học phần'} tại phòng ${rooms.find(r => r.id === roomId)?.code}. Hãy mở camera điểm danh!`,
          type: 'upcoming_class',
          read: false,
          createdAt: new Date().toISOString()
        });
      });
    }

    onSessionCreated(sessionId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Tạo phiên điểm danh học phần
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Thiết lập ca học, mốc tính muộn, nhận dạng khuôn mặt và định vị GPS
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Lớp học phần phụ trách <span className="text-red-500">*</span>
            </label>
            <select
              value={courseSectionId}
              onChange={e => setCourseSectionId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            >
              {sections.map(sec => {
                const c = courses.find(crs => crs.id === sec.courseId);
                return (
                  <option key={sec.id} value={sec.id}>
                    {sec.code} · {c?.name} ({sec.enrolledStudentIds.length} sinh viên)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phòng học <span className="text-red-500">*</span>
              </label>
              <select
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                {rooms.map(rm => (
                  <option key={rm.id} value={rm.id}>
                    {rm.code} - {rm.building} (Sức chứa {rm.capacity})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ngày điểm danh
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Giờ bắt đầu
              </label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Giờ kết thúc
              </label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mốc tính muộn
              </label>
              <input
                type="time"
                value={lateCutoffTime}
                onChange={e => setLateCutoffTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-amber-700 dark:text-amber-400 font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phương thức xác thực chính
            </label>
            <select
              value={authMethod}
              onChange={e => setAuthMethod(e.target.value as VerificationMethod)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            >
              <option value="face">Nhận dạng khuôn mặt AI (Face Recognition + Liveness)</option>
              <option value="qr_fallback">Mã QR Session động (Phương án dự phòng)</option>
              <option value="manual">Điểm danh thủ công (Giảng viên tích tay danh sách)</option>
            </select>
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  Bật Face Liveness Detection (Chống gian lận ảnh chụp)
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Yêu cầu chớp mắt / cử động sống để tránh dùng ảnh màn hình hoặc ảnh in
                </div>
              </div>
              <input
                type="checkbox"
                checked={requireLiveness}
                onChange={e => setRequireLiveness(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  Bật Geofencing GPS (Tọa độ phòng học tại UTT)
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Giới hạn bán kính vị trí trong khuôn viên trường (bán kính 60m)
                </div>
              </div>
              <input
                type="checkbox"
                checked={requireGeofence}
                onChange={e => setRequireGeofence(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Khởi tạo & Mở phiên</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
