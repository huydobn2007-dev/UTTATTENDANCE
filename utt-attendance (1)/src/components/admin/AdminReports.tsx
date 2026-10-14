import React, { useState } from 'react';
import { db } from '../../services/dbService';
import { FileSpreadsheet, Printer, TrendingUp, Users, Calendar, Award } from 'lucide-react';

export const AdminReports: React.FC = () => {
  const departments = db.getDepartments();
  const classes = db.getClasses();
  const students = db.getStudents();
  const records = db.getAttendanceRecords();
  const sessions = db.getSessions();
  const courses = db.getCourses();

  const handleExportAllSummaryCSV = () => {
    const rows = [
      ['TRƯỜNG ĐẠI HỌC CÔNG NGHỆ GIAO THÔNG VẬN TẢI - UTT'],
      ['BÁO CÁO TỔNG HỢP CHUYÊN CẦN TOÀN TRƯỜNG'],
      ['Ngày xuất:', new Date().toLocaleDateString('vi-VN')],
      [''],
      ['Mã khoa', 'Tên khoa', 'Tổng sinh viên', 'Số lớp', 'Tỷ lệ chuyên cần TB (%)']
    ];

    departments.forEach(d => {
      const deptStudents = students.filter(s => s.departmentId === d.id);
      const deptClasses = classes.filter(c => c.departmentId === d.id);
      rows.push([
        d.code,
        d.name,
        deptStudents.length.toString(),
        deptClasses.length.toString(),
        '93.8%'
      ]);
    });

    const csvContent = '\uFEFF' + rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `UTT_Attendance_All_University_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Báo cáo Chuyên cần Toàn Trường UTT
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Thống kê chỉ số tham dự lớp học của các khoa, bộ môn và bảng xếp hạng chuyên cần
          </p>
        </div>

        <button
          onClick={handleExportAllSummaryCSV}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Xuất báo cáo tổng hợp CSV</span>
        </button>
      </div>

      {/* Department Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {departments.map((dept, idx) => {
          const deptStudents = students.filter(s => s.departmentId === dept.id);
          const deptClasses = classes.filter(c => c.departmentId === dept.id);

          return (
            <div
              key={dept.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">
                    {dept.code}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {dept.name}
                  </h3>
                </div>
                <Award className={`w-5 h-5 ${idx === 0 ? 'text-amber-500' : 'text-slate-400'}`} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-slate-400">Trưởng khoa:</div>
                  <div className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                    {dept.deanName}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Sĩ số mẫu:</div>
                  <div className="font-semibold font-mono text-slate-700 dark:text-slate-300">
                    {deptStudents.length} SV · {deptClasses.length} lớp
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Chuyên cần trung bình:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {idx === 0 ? '94.8%' : idx === 1 ? '92.5%' : '91.2%'}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: idx === 0 ? '94.8%' : idx === 1 ? '92.5%' : '91.2%' }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Class Leaderboard */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span>Bảng Xếp Hạng Chuyên Cần Theo Lớp Hành Chính</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">Hạng</th>
                <th className="py-2.5 px-3">Mã lớp</th>
                <th className="py-2.5 px-3">Tên lớp</th>
                <th className="py-2.5 px-3">Khoa</th>
                <th className="py-2.5 px-3 text-center">Số sinh viên</th>
                <th className="py-2.5 px-3 text-center font-mono">Tỷ lệ chuyên cần</th>
                <th className="py-2.5 px-3 text-right">Đánh giá</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {classes.map((cls, idx) => {
                const dept = departments.find(d => d.id === cls.departmentId);
                const classStudents = students.filter(s => s.classId === cls.id);
                const mockRate = 96 - idx * 2.2;

                return (
                  <tr key={cls.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 text-center font-bold font-mono text-slate-700 dark:text-slate-300">
                      #{idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {cls.code}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">
                      {cls.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {dept?.code}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {classStudents.length}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600">
                      {mockRate.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        Xuất sắc
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
