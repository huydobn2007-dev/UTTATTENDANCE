import React, { useState } from 'react';
import { Lecturer, CourseSection, Student } from '../../types';
import { db } from '../../services/dbService';
import { FileStudentImportModal } from '../common/FileStudentImportModal';
import { 
  Users, 
  BookOpen, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Search, 
  ChevronRight,
  UserPlus,
  UserMinus,
  Edit2,
  FileSpreadsheet,
  Download,
  Upload,
  Check,
  X,
  AlertCircle,
  Plus
} from 'lucide-react';

interface LecturerClassesProps {
  lecturer: Lecturer;
}

export const LecturerClasses: React.FC<LecturerClassesProps> = ({ lecturer }) => {
  const [sections, setSections] = useState<CourseSection[]>(
    db.getCourseSections().filter(s => s.lecturerId === lecturer.id)
  );
  const [selectedSectionId, setSelectedSectionId] = useState(sections[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isEditRosterModalOpen, setIsEditRosterModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [isFileImportModalOpen, setIsFileImportModalOpen] = useState(false);
  const [isNewClassModalOpen, setIsNewClassModalOpen] = useState(false);
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Bulk text import state
  const [bulkInputText, setBulkInputText] = useState('');
  const [importSummary, setImportSummary] = useState<string | null>(null);

  // New Class Form states
  const [newClassCode, setNewClassCode] = useState('');
  const [newClassCourseId, setNewClassCourseId] = useState('');
  const [newClassSemester, setNewClassSemester] = useState('HK1');
  const [newClassYear, setNewClassYear] = useState('2025-2026');
  const [newClassTotalSessions, setNewClassTotalSessions] = useState(15);

  // Edit single student form
  const [editFullName, setEditFullName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Add student search inside Roster modal
  const [rosterSearch, setRosterSearch] = useState('');

  const courses = db.getCourses();
  const students = db.getStudents();
  const records = db.getAttendanceRecords();

  const refresh = () => {
    setSections(db.getCourseSections().filter(s => s.lecturerId === lecturer.id));
  };

  const selectedSection = sections.find(s => s.id === selectedSectionId);
  const selectedCourse = selectedSection ? courses.find(c => c.id === selectedSection.courseId) : null;

  const enrolledStudents = students.filter(s => selectedSection?.enrolledStudentIds.includes(s.id));

  const filtered = enrolledStudents.filter(s =>
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add / Remove student from current course section
  const handleToggleStudent = (studentId: string) => {
    if (!selectedSection) return;
    const isEnrolled = selectedSection.enrolledStudentIds.includes(studentId);
    if (isEnrolled) {
      db.removeStudentFromSection(selectedSection.id, studentId);
    } else {
      db.addStudentToSection(selectedSection.id, studentId);
    }
    refresh();
  };

  // Select all target students into current course section
  const handleSelectAllStudents = (targetStudents: Student[]) => {
    if (!selectedSection) return;
    const idsToAdd = targetStudents.map(s => s.id);
    const combined = Array.from(new Set([...selectedSection.enrolledStudentIds, ...idsToAdd]));
    db.saveCourseSection({
      ...selectedSection,
      enrolledStudentIds: combined
    });
    refresh();
  };

  // Deselect all target students from current course section
  const handleDeselectAllStudents = (targetStudents: Student[]) => {
    if (!selectedSection) return;
    const idsToRemove = new Set(targetStudents.map(s => s.id));
    const filtered = selectedSection.enrolledStudentIds.filter(id => !idsToRemove.has(id));
    db.saveCourseSection({
      ...selectedSection,
      enrolledStudentIds: filtered
    });
    refresh();
  };

  // Bulk paste import
  const handleBulkImport = () => {
    if (!selectedSection || !bulkInputText.trim()) return;

    const lines = bulkInputText.split('\n').map(l => l.trim()).filter(Boolean);
    const updatedIds = new Set(selectedSection.enrolledStudentIds);
    let addedCount = 0;

    for (const line of lines) {
      const parts = line.split(/[,;\t]/).map(p => p.trim());
      const codeOrId = parts[0];
      const foundStudent = students.find(s => s.code.toLowerCase() === codeOrId.toLowerCase() || s.id === codeOrId);

      if (foundStudent) {
        if (!updatedIds.has(foundStudent.id)) {
          updatedIds.add(foundStudent.id);
          addedCount++;
        }
      } else if (parts.length >= 2) {
        const newSt: Student = {
          id: `student_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          code: codeOrId,
          fullName: parts[1],
          email: `${codeOrId.toLowerCase()}@utt.edu.vn`,
          phone: parts[2] || '',
          role: 'student',
          classId: 'class_72dcht21',
          departmentId: 'dept_it',
          admissionYear: 2021,
          faceRegistered: false,
          createdAt: new Date().toISOString()
        };
        db.saveStudent(newSt);
        updatedIds.add(newSt.id);
        addedCount++;
      }
    }

    db.updateSectionRoster(selectedSection.id, Array.from(updatedIds));
    refresh();
    setImportSummary(`Đã thêm thành công ${addedCount} sinh viên vào lớp học phần ${selectedSection.code}!`);
    setBulkInputText('');
  };

  // Create New Class Section
  const handleCreateNewClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassCode) return;

    const newSec: CourseSection = {
      id: `sec_${Date.now()}`,
      code: newClassCode,
      courseId: newClassCourseId || courses[0]?.id || 'course_it302',
      lecturerId: lecturer.id,
      semester: newClassSemester,
      academicYear: newClassYear,
      totalSessions: Number(newClassTotalSessions) || 15,
      enrolledStudentIds: students.slice(0, 15).map(s => s.id)
    };

    db.saveCourseSection(newSec);
    refresh();
    setSelectedSectionId(newSec.id);
    setIsNewClassModalOpen(false);
  };

  // Export Roster to CSV
  const handleExportCSV = () => {
    if (!selectedSection || !selectedCourse) return;
    const headers = ['STT', 'Mã Sinh Viên', 'Họ và Tên', 'Lớp Hành Chính', 'Email', 'Số Điện Thoại', 'Đã Có Face ID'];
    const rows = enrolledStudents.map((s, idx) => [
      idx + 1,
      s.code,
      `"${s.fullName}"`,
      s.classId.replace('class_', '').toUpperCase(),
      s.email,
      s.phone || '',
      s.faceRegistered ? 'Đã đăng ký' : 'Chưa có'
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Danh_sach_lop_${selectedSection.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenEditStudent = (st: Student) => {
    setEditingStudent(st);
    setEditFullName(st.fullName);
    setEditCode(st.code);
    setEditEmail(st.email);
    setEditPhone(st.phone || '');
    setIsEditStudentModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editFullName || !editCode) return;

    db.saveStudent({
      ...editingStudent,
      fullName: editFullName,
      code: editCode,
      email: editEmail,
      phone: editPhone
    });

    setIsEditStudentModalOpen(false);
    refresh();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>Quản lý Lớp học phần & Danh sách Sinh viên</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Thêm bớt sinh viên, tạo lớp mới, nhập tự động từ tệp Word/Excel và xuất báo cáo
          </p>
        </div>

        {/* Global actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setNewClassCode(`72DCHT21-IT302-0${sections.length + 1}`);
              setNewClassCourseId(courses[0]?.id || '');
              setIsNewClassModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm lớp học phần</span>
          </button>

          <button
            onClick={() => setIsFileImportModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Nhập từ Word / Excel</span>
          </button>

          <button
            onClick={() => setIsEditRosterModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <UserPlus className="w-4 h-4 text-blue-600" />
            <span>Sửa danh sách lớp</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* Course Sections Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2">
        {sections.map(sec => {
          const c = courses.find(crs => crs.id === sec.courseId);
          const isSelected = sec.id === selectedSectionId;
          return (
            <button
              key={sec.id}
              onClick={() => setSelectedSectionId(sec.id)}
              className={`p-3.5 rounded-2xl border text-left whitespace-nowrap shrink-0 transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-bold">{c?.name}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                {sec.code} · {sec.enrolledStudentIds.length} sinh viên
              </div>
            </button>
          );
        })}
      </div>

      {/* Search and Action Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên hoặc mã sinh viên trong lớp này..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden"
          />
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
          <span>Lớp: <strong>{selectedSection?.code}</strong></span>
          <span>·</span>
          <span>Sĩ số: <strong>{filtered.length}</strong> / {enrolledStudents.length} sinh viên</span>
        </div>
      </div>

      {/* Student List Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4 w-28 font-mono">Mã SV</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Lớp hành chính</th>
                <th className="py-3 px-4 text-center">Trạng thái Face ID</th>
                <th className="py-3 px-4 text-center">Tỷ lệ chuyên cần</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Không tìm thấy sinh viên nào trong danh sách lớp này
                  </td>
                </tr>
              ) : (
                filtered.map((s, idx) => {
                  const studentRecords = records.filter(r => r.studentId === s.id);
                  const presents = studentRecords.filter(r => r.status === 'present').length;
                  const lates = studentRecords.filter(r => r.status === 'late').length;
                  const total = studentRecords.length || 1;
                  const rate = Math.round(((presents + lates * 0.7) / total) * 100);

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
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
                        <div className="text-[11px] text-slate-400">{s.email}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {s.classId.replace('class_', '').toUpperCase()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {s.faceRegistered ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Đã có Face ID
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                            Chưa đăng ký
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span className={`font-bold ${rate >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {rate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditStudent(s)}
                            className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                            title="Sửa thông tin sinh viên"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Sửa</span>
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`Xóa sinh viên ${s.fullName} (${s.code}) khỏi lớp học phần này?`)) {
                                handleToggleStudent(s.id);
                              }
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            title="Xóa khỏi lớp học phần"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Sửa Danh Sách Sinh Viên Lớp (Add/Remove from University Roster) */}
      {isEditRosterModalOpen && selectedSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  <span>Sửa danh sách sinh viên lớp {selectedSection.code}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tích chọn để thêm/bớt sinh viên vào lớp học phần này
                </p>
              </div>
              <button onClick={() => setIsEditRosterModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search across all university students */}
            <div className="py-2.5 shrink-0 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={rosterSearch}
                  onChange={e => setRosterSearch(e.target.value)}
                  placeholder="Tìm sinh viên toàn trường để thêm vào lớp..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              {/* Select All / Deselect All toolbar */}
              {(() => {
                const filteredRosterStudents = students.filter(s => 
                  !rosterSearch || 
                  s.fullName.toLowerCase().includes(rosterSearch.toLowerCase()) || 
                  s.code.toLowerCase().includes(rosterSearch.toLowerCase())
                );
                const isAllSelected = filteredRosterStudents.length > 0 && 
                  filteredRosterStudents.every(s => selectedSection.enrolledStudentIds.includes(s.id));
                const selectedInFilterCount = filteredRosterStudents.filter(s => 
                  selectedSection.enrolledStudentIds.includes(s.id)
                ).length;

                return (
                  <div className="flex items-center justify-between px-3 py-2 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 rounded-xl text-xs">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={() => {
                          if (isAllSelected) {
                            handleDeselectAllStudents(filteredRosterStudents);
                          } else {
                            handleSelectAllStudents(filteredRosterStudents);
                          }
                        }}
                        className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                      />
                      <span className="font-semibold text-blue-900 dark:text-blue-200">
                        {isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                        {rosterSearch ? ` (${filteredRosterStudents.length} SV tìm thấy)` : ` (${filteredRosterStudents.length} sinh viên toàn trường)`}
                      </span>
                    </label>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                        Đang chọn: <strong className="text-blue-600 dark:text-blue-400">{selectedInFilterCount}/{filteredRosterStudents.length}</strong>
                      </span>
                      {selectedInFilterCount > 0 && (
                        <button
                          type="button"
                          onClick={() => handleDeselectAllStudents(filteredRosterStudents)}
                          className="text-[11px] text-red-600 dark:text-red-400 hover:underline font-medium"
                        >
                          Bỏ chọn
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* List of all students with checkboxes */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {students
                .filter(s => s.fullName.toLowerCase().includes(rosterSearch.toLowerCase()) || s.code.toLowerCase().includes(rosterSearch.toLowerCase()))
                .map(s => {
                  const isEnrolled = selectedSection.enrolledStudentIds.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleToggleStudent(s.id)}
                      className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                        isEnrolled
                          ? 'bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isEnrolled}
                          onChange={() => {}}
                          className="rounded text-blue-600 pointer-events-none"
                        />
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{s.fullName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {s.code} · Lớp {s.classId.replace('class_', '').toUpperCase()}
                          </div>
                        </div>
                      </div>

                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isEnrolled ? 'bg-blue-600 text-white' : 'text-slate-400'
                      }`}>
                        {isEnrolled ? 'Đang trong lớp' : '+ Thêm'}
                      </span>
                    </div>
                  );
                })}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
              <span className="text-xs text-slate-500 font-mono">
                Đã chọn: <strong>{selectedSection.enrolledStudentIds.length}</strong> sinh viên
              </span>
              <button
                onClick={() => setIsEditRosterModalOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: THÊM LỚP HỌC PHẦN MỚI */}
      {isNewClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span>Thêm lớp học phần mới</span>
              </h3>
              <button onClick={() => setIsNewClassModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewClass} className="space-y-3.5 text-xs">
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
                  Môn học
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Lưu lớp học phần</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: NHẬP DANH SÁCH BẰNG FILE WORD / EXCEL TỰ ĐỘNG CHỌN LỌC */}
      {isFileImportModalOpen && selectedSection && (
        <FileStudentImportModal
          isOpen={isFileImportModalOpen}
          onClose={() => setIsFileImportModalOpen(false)}
          targetSectionId={selectedSection.id}
          onSuccess={(count) => {
            refresh();
            alert(`Đã nhập thành công ${count} sinh viên vào lớp học phần ${selectedSection.code}!`);
          }}
        />
      )}

      {/* MODAL 4: SỬA THÔNG TIN 1 SINH VIÊN */}
      {isEditStudentModalOpen && editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>Sửa thông tin sinh viên</span>
              </h3>
              <button onClick={() => setIsEditStudentModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 mb-1">Mã sinh viên</label>
                  <input
                    type="text"
                    required
                    value={editCode}
                    onChange={e => setEditCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditStudentModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
