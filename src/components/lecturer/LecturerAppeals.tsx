import React, { useState, useEffect } from 'react';
import { Lecturer, AttendanceRequest } from '../../types';
import { db } from '../../services/dbService';
import { Check, X, Clock, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

interface LecturerAppealsProps {
  lecturer: Lecturer;
}

export const LecturerAppeals: React.FC<LecturerAppealsProps> = ({ lecturer }) => {
  const [requests, setRequests] = useState<AttendanceRequest[]>([]);
  const [selectedReq, setSelectedReq] = useState<AttendanceRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    const update = () => {
      setRequests(db.getRequests());
    };
    update();
    return db.subscribe(update);
  }, []);

  const students = db.getStudents();
  const sessions = db.getSessions();
  const courses = db.getCourses();
  const sections = db.getCourseSections();

  const handleResolve = (status: 'approved' | 'rejected') => {
    if (!selectedReq) return;
    db.updateRequestStatus(selectedReq.id, status, lecturer.id, reviewNotes || (status === 'approved' ? 'Chấp nhận giải trình' : 'Không đủ bằng chứng'));
    setSelectedReq(null);
    setReviewNotes('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Duyệt khiếu nại & Giải trình điểm danh
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Xem xét các trường hợp sinh viên gặp sự cố mạng, hỏng xe hoặc có lý do đột xuất
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4">Sinh viên</th>
                <th className="py-3 px-4">Phiên / Môn học</th>
                <th className="py-3 px-4">Lý do giải trình</th>
                <th className="py-3 px-4">Yêu cầu đổi sang</th>
                <th className="py-3 px-4">Bằng chứng</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Không có khiếu nại nào cần xử lý
                  </td>
                </tr>
              ) : (
                requests.map(req => {
                  const student = students.find(s => s.id === req.studentId);
                  const sess = sessions.find(s => s.id === req.sessionId);
                  const sec = sess ? sections.find(s => s.id === sess.courseSectionId) : null;
                  const crs = sec ? courses.find(c => c.id === sec.courseId) : null;

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {student?.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {student?.code}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {crs?.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Ngày {sess?.date}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs text-slate-700 dark:text-slate-300">
                        {req.reason}
                      </td>
                      <td className="py-3 px-4 font-semibold text-blue-600 dark:text-blue-400">
                        {req.requestedStatus === 'present' ? 'Có mặt' : 'Được miễn'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {req.evidenceDescription || 'Không đính kèm'}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold">
                        {req.status === 'pending' ? (
                          <span className="text-amber-600 dark:text-amber-400">Chờ duyệt</span>
                        ) : req.status === 'approved' ? (
                          <span className="text-emerald-600 dark:text-emerald-400">Đã chấp nhận</span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400">Từ chối</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {req.status === 'pending' ? (
                          <button
                            onClick={() => setSelectedReq(req)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-[11px]"
                          >
                            Xử lý
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Đã xong</span>
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

      {/* Review Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Phê duyệt giải trình điểm danh
              </h3>
              <button onClick={() => setSelectedReq(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
              <div><strong>Lý do sinh viên:</strong> {selectedReq.reason}</div>
              {selectedReq.evidenceDescription && (
                <div><strong>Minh chứng:</strong> {selectedReq.evidenceDescription}</div>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ghi chú của giảng viên
              </label>
              <input
                type="text"
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                placeholder="VD: Đã xác nhận lý do chính đáng..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleResolve('rejected')}
                className="px-4 py-2 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 font-semibold"
              >
                Từ chối
              </button>
              <button
                type="button"
                onClick={() => handleResolve('approved')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                Chấp nhận khiếu nại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
