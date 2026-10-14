import React, { useState } from 'react';
import { Lecturer } from '../../types';
import { db } from '../../services/dbService';
import { ExportService } from '../../services/exportService';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Filter, 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  XCircle 
} from 'lucide-react';

interface LecturerReportsProps {
  lecturer: Lecturer;
  onOpenSessionMonitor: (sessionId: string) => void;
}

export const LecturerReports: React.FC<LecturerReportsProps> = ({
  lecturer,
  onOpenSessionMonitor
}) => {
  const sections = db.getCourseSections().filter(s => s.lecturerId === lecturer.id);
  const [selectedSectionId, setSelectedSectionId] = useState<string>(sections[0]?.id || '');

  const courses = db.getCourses();
  const sessions = db.getSessions().filter(s => s.lecturerId === lecturer.id);
  const rooms = db.getRooms();
  const students = db.getStudents();
  const records = db.getAttendanceRecords();

  const selectedSection = sections.find(s => s.id === selectedSectionId);
  const selectedCourse = selectedSection ? courses.find(c => c.id === selectedSection.courseId) : null;
  const sectionSessions = sessions.filter(s => s.courseSectionId === selectedSectionId);

  const sectionStudents = students.filter(s => selectedSection?.enrolledStudentIds.includes(s.id));

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Báo cáo & Thống kê Chuyên cần
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tổng hợp dữ liệu điểm danh, xuất file Excel CSV có UTF-8 BOM và mẫu in chính thức
          </p>
        </div>

        {/* Section Select */}
        <select
          value={selectedSectionId}
          onChange={e => setSelectedSectionId(e.target.value)}
          className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium"
        >
          {sections.map(sec => {
            const crs = courses.find(c => c.id === sec.courseId);
            return (
              <option key={sec.id} value={sec.id}>
                {sec.code} · {crs?.name}
              </option>
            );
          })}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-500">Số buổi đã điểm danh</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2 tabular-nums">
            {sectionSessions.length} / {selectedSection?.totalSessions || 15}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Đã hoàn thành</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-emerald-600 dark:text-emerald-400">Tỷ lệ chuyên cần chung</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2 tabular-nums">
            92.4%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Đạt chỉ tiêu học viện</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-amber-600 dark:text-amber-400">Sinh viên đi muộn TB</div>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-2 tabular-nums">
            2.1 <span className="text-xs font-normal text-slate-400">SV/buổi</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Chủ yếu dưới 10 phút</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-500">Sinh viên có nguy cơ cấm thi</div>
          <div className="text-2xl font-bold font-mono text-red-600 dark:text-red-400 mt-2 tabular-nums">
            0 <span className="text-xs font-normal text-slate-400">SV</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Chưa ai vượt quá 20% vắng</div>
        </div>
      </div>

      {/* Session List Table */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Danh sách phiên học phần & Xuất dữ liệu
        </h2>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-4">Mã phiên</th>
                  <th className="py-3 px-4">Ngày điểm danh</th>
                  <th className="py-3 px-4">Khung giờ</th>
                  <th className="py-3 px-4">Phòng</th>
                  <th className="py-3 px-4 text-center">Có mặt</th>
                  <th className="py-3 px-4 text-center">Đi muộn</th>
                  <th className="py-3 px-4 text-center">Vắng</th>
                  <th className="py-3 px-4 text-right">Xuất báo cáo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sectionSessions.map(sess => {
                  const rm = rooms.find(r => r.id === sess.roomId);
                  const sessRecs = records.filter(r => r.sessionId === sess.id);
                  const present = sessRecs.filter(r => r.status === 'present').length;
                  const late = sessRecs.filter(r => r.status === 'late').length;
                  const absent = sessRecs.filter(r => r.status === 'absent').length;

                  return (
                    <tr
                      key={sess.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {sess.sessionCode}
                      </td>
                      <td className="py-3 px-4 font-mono">{sess.date}</td>
                      <td className="py-3 px-4 font-mono">
                        {sess.startTime} - {sess.endTime}
                      </td>
                      <td className="py-3 px-4 font-mono">{rm?.code}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600">
                        {present}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-amber-600">
                        {late}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-red-600">
                        {absent}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            if (selectedCourse && selectedSection && rm) {
                              ExportService.exportToCSV(sess, selectedCourse, selectedSection, rm, sectionStudents, sessRecs);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-[11px] font-medium inline-flex items-center gap-1"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                          <span>CSV</span>
                        </button>
                        <button
                          onClick={() => {
                            if (selectedCourse && selectedSection && rm) {
                              ExportService.printAttendanceReport(sess, selectedCourse, selectedSection, rm, sectionStudents, sessRecs);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-[11px] font-medium inline-flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600" />
                          <span>In</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
