import React, { useState } from 'react';
import { Student, AttendanceSession } from '../../types';
import { db } from '../../services/dbService';
import { X, Send, AlertCircle, FileText } from 'lucide-react';

interface StudentAppealsModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  sessionId: string;
}

export const StudentAppealsModal: React.FC<StudentAppealsModalProps> = ({
  isOpen,
  onClose,
  student,
  sessionId
}) => {
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState('');
  const [requestedStatus, setRequestedStatus] = useState<'present' | 'excused'>('present');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const session = db.getSessionById(sessionId);
  const sec = session ? db.getCourseSectionById(session.courseSectionId) : null;
  const course = sec ? db.getCourseById(sec.courseId) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    db.saveRequest({
      id: `req_${Date.now()}_${student.id}`,
      studentId: student.id,
      sessionId,
      reason: reason.trim(),
      requestedStatus,
      evidenceDescription: evidence.trim() || undefined,
      status: 'pending',
      submittedAt: new Date().toISOString()
    });

    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Gửi khiếu nại / Giải trình điểm danh
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Học phần: {course?.name || 'Lập trình Web Nâng Cao'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <Send className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Đã gửi khiếu nại thành công
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Giảng viên phụ trách học phần sẽ xem xét và phản hồi trong thời gian sớm nhất.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Trạng thái bạn mong muốn điều chỉnh
              </label>
              <select
                value={requestedStatus}
                onChange={e => setRequestedStatus(e.target.value as 'present' | 'excused')}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                <option value="present">Đổi thành: Có mặt (Do camera nhận diện chậm hoặc lỗi mạng)</option>
                <option value="excused">Đổi thành: Có phép (Bị ốm / sự cố có lý do chính đáng)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lý do / Giải trình cụ thể <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="VD: Em đã có mặt tại phòng lúc 07:05 nhưng camera điện thoại bị mất mạng 4G, em có chụp lại ảnh làm chứng..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mô tả bằng chứng / Link tài liệu đính kèm (nếu có)
              </label>
              <input
                type="text"
                value={evidence}
                onChange={e => setEvidence(e.target.value)}
                placeholder="VD: Giấy khám sức khỏe / Đơn xin phép qua email ngày..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi khiếu nại</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
