import React, { useState } from 'react';
import { Course, CourseSection, Department, Lecturer, Student } from '../../types';
import { db } from '../../services/dbService';
import { CreateDepartmentModal } from '../common/CreateDepartmentModal';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Users, 
  GraduationCap, 
  Building, 
  Check, 
  X, 
  Layers, 
  Calendar, 
  Clock, 
  Filter,
  Download,
  AlertCircle,
  Sparkles,
  UserPlus,
  UserMinus
} from 'lucide-react';

export const AdminCourses: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'courses' | 'sections'>('courses');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState('all');

  // Database states
  const [courses, setCourses] = useState<Course[]>(db.getCourses());
  const [sections, setSections] = useState<CourseSection[]>(db.getCourseSections());
  const [departments, setDepartments] = useState<Department[]>(db.getDepartments());
  const lecturers = db.getLecturers();
  const students = db.getStudents();
  const administrativeClasses = db.getClasses();

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals for Courses
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [courseCredits, setCourseCredits] = useState<number>(3);
  const [courseDeptId, setCourseDeptId] = useState(departments[0]?.id || '');
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  // Modals for Course Sections
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<CourseSection | null>(null);
  const [sectionCode, setSectionCode] = useState('');
  const [sectionCourseId, setSectionCourseId] = useState(courses[0]?.id || '');
  const [sectionLecturerId, setSectionLecturerId] = useState(lecturers[0]?.id || '');
  const [sectionSemester, setSectionSemester] = useState('HK1');
  const [sectionAcademicYear, setSectionAcademicYear] = useState('2025-2026');
  const [sectionTotalSessions, setSectionTotalSessions] = useState(15);
  const [sectionEnrolledIds, setSectionEnrolledIds] = useState<string[]>([]);
  const [sectionToDelete, setSectionToDelete] = useState<CourseSection | null>(null);

  // Roster enrollment selection modal inside section
  const [showRosterPicker, setShowRosterPicker] = useState(false);
  const [rosterSearch, setRosterSearch] = useState('');

  // Department creation modal
  const [isCreateDeptModalOpen, setIsCreateDeptModalOpen] = useState(false);

  const refreshAll = () => {
    setCourses(db.getCourses());
    setSections(db.getCourseSections());
    setDepartments(db.getDepartments());
  };

  React.useEffect(() => {
    refreshAll();
    return db.subscribe(refreshAll);
  }, []);

  // --- COURSE HANDLERS ---
  const handleOpenNewCourse = () => {
    setEditingCourse(null);
    setCourseCode(`IT${Math.floor(Math.random() * 200 + 300)}`);
    setCourseName('');
    setCourseCredits(3);
    setCourseDeptId(departments[0]?.id || 'dept_it');
    setIsCourseModalOpen(true);
  };

  const handleOpenEditCourse = (c: Course) => {
    setEditingCourse(c);
    setCourseCode(c.code);
    setCourseName(c.name);
    setCourseCredits(c.credits);
    setCourseDeptId(c.departmentId);
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode.trim() || !courseName.trim()) return;

    if (editingCourse) {
      const updated: Course = {
        ...editingCourse,
        code: courseCode.trim().toUpperCase(),
        name: courseName.trim(),
        credits: Number(courseCredits) || 3,
        departmentId: courseDeptId
      };
      db.saveCourse(updated);
      setToastMessage(`Đã cập nhật môn học ${updated.code} - ${updated.name}!`);
    } else {
      const newC: Course = {
        id: `course_${Date.now()}`,
        code: courseCode.trim().toUpperCase(),
        name: courseName.trim(),
        credits: Number(courseCredits) || 3,
        departmentId: courseDeptId
      };
      db.saveCourse(newC);
      setToastMessage(`Đã thêm môn học mới ${newC.code} - ${newC.name}!`);
    }

    setIsCourseModalOpen(false);
    refreshAll();
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleConfirmDeleteCourse = () => {
    if (!courseToDelete) return;
    const name = courseToDelete.name;
    db.deleteCourse(courseToDelete.id);
    setCourseToDelete(null);
    refreshAll();
    setToastMessage(`Đã xóa môn học ${name}!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --- SECTION HANDLERS ---
  const handleOpenNewSection = () => {
    setEditingSection(null);
    const targetCourse = courses[0];
    const targetLec = lecturers[0];
    const generatedCode = targetCourse 
      ? `72DCHT21-${targetCourse.code}-0${sections.filter(s => s.courseId === targetCourse.id).length + 1}`
      : `HP-${Date.now().toString().slice(-4)}`;

    setSectionCode(generatedCode);
    setSectionCourseId(targetCourse?.id || '');
    setSectionLecturerId(targetLec?.id || '');
    setSectionSemester('HK1');
    setSectionAcademicYear('2025-2026');
    setSectionTotalSessions(15);
    // Default enroll first administrative class students
    const defaultStudents = students.slice(0, 15).map(s => s.id);
    setSectionEnrolledIds(defaultStudents);
    setIsSectionModalOpen(true);
  };

  const handleOpenEditSection = (sec: CourseSection) => {
    setEditingSection(sec);
    setSectionCode(sec.code);
    setSectionCourseId(sec.courseId);
    setSectionLecturerId(sec.lecturerId);
    setSectionSemester(sec.semester || 'HK1');
    setSectionAcademicYear(sec.academicYear || '2025-2026');
    setSectionTotalSessions(sec.totalSessions || 15);
    setSectionEnrolledIds([...sec.enrolledStudentIds]);
    setIsSectionModalOpen(true);
  };

  const handleSaveSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionCode.trim() || !sectionCourseId || !sectionLecturerId) return;

    if (editingSection) {
      const updated: CourseSection = {
        ...editingSection,
        code: sectionCode.trim().toUpperCase(),
        courseId: sectionCourseId,
        lecturerId: sectionLecturerId,
        semester: sectionSemester,
        academicYear: sectionAcademicYear,
        totalSessions: Number(sectionTotalSessions) || 15,
        enrolledStudentIds: sectionEnrolledIds
      };
      db.saveCourseSection(updated);
      setToastMessage(`Đã cập nhật lớp học phần ${updated.code}!`);
    } else {
      const newSec: CourseSection = {
        id: `sec_${Date.now()}`,
        code: sectionCode.trim().toUpperCase(),
        courseId: sectionCourseId,
        lecturerId: sectionLecturerId,
        semester: sectionSemester,
        academicYear: sectionAcademicYear,
        totalSessions: Number(sectionTotalSessions) || 15,
        enrolledStudentIds: sectionEnrolledIds
      };
      db.saveCourseSection(newSec);
      setToastMessage(`Đã tạo mới lớp học phần ${newSec.code}!`);
    }

    setIsSectionModalOpen(false);
    refreshAll();
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleConfirmDeleteSection = () => {
    if (!sectionToDelete) return;
    const code = sectionToDelete.code;
    db.deleteCourseSection(sectionToDelete.id);
    setSectionToDelete(null);
    refreshAll();
    setToastMessage(`Đã xóa lớp học phần ${code}!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Quick enroll all students of an administrative class into this section
  const handleEnrollWholeClass = (classId: string) => {
    const classStudentIds = students.filter(s => s.classId === classId).map(s => s.id);
    const combined = Array.from(new Set([...sectionEnrolledIds, ...classStudentIds]));
    setSectionEnrolledIds(combined);
  };

  // Toggle individual student in roster
  const handleToggleStudentInRoster = (studentId: string) => {
    if (sectionEnrolledIds.includes(studentId)) {
      setSectionEnrolledIds(sectionEnrolledIds.filter(id => id !== studentId));
    } else {
      setSectionEnrolledIds([...sectionEnrolledIds, studentId]);
    }
  };

  // Select all students (or filtered students if searching)
  const handleSelectAllStudentsInRoster = (targetStudents: Student[]) => {
    const idsToAdd = targetStudents.map(s => s.id);
    const combined = Array.from(new Set([...sectionEnrolledIds, ...idsToAdd]));
    setSectionEnrolledIds(combined);
  };

  // Deselect all students (or filtered students if searching)
  const handleDeselectAllStudentsInRoster = (targetStudents: Student[]) => {
    const idsToRemove = new Set(targetStudents.map(s => s.id));
    setSectionEnrolledIds(sectionEnrolledIds.filter(id => !idsToRemove.has(id)));
  };

  // Filtered Courses
  const filteredCourses = courses.filter(c => {
    const matchSearch = c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = selectedDeptFilter === 'all' || c.departmentId === selectedDeptFilter;
    return matchSearch && matchDept;
  });

  // Filtered Sections
  const filteredSections = sections.filter(sec => {
    const matchSearch = sec.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSem = selectedSemesterFilter === 'all' || sec.semester === selectedSemesterFilter;
    return matchSearch && matchSem;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <span>Quản lý Môn học / Học phần & Lớp học phần</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Thêm mới, sửa đổi thông tin chương trình đào tạo, học phần và phân công lớp học phần thủ công
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'courses' ? (
            <button
              onClick={handleOpenNewCourse}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Môn học thủ công</span>
            </button>
          ) : (
            <button
              onClick={handleOpenNewSection}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Lớp học phần thủ công</span>
            </button>
          )}
        </div>
      </div>

      {/* Segmented SubTabs (Môn học / Lớp học phần) */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-6">
          <button
            onClick={() => {
              setActiveSubTab('courses');
              setSearchTerm('');
            }}
            className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 relative transition-colors ${
              activeSubTab === 'courses'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Danh mục Môn học / Học phần ({courses.length})</span>
            {activeSubTab === 'courses' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => {
              setActiveSubTab('sections');
              setSearchTerm('');
            }}
            className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 relative transition-colors ${
              activeSubTab === 'sections'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Danh sách Lớp học phần ({sections.length})</span>
            {activeSubTab === 'sections' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={activeSubTab === 'courses' ? "Tìm theo mã môn (IT302) hoặc tên môn..." : "Tìm theo mã lớp học phần (72DCHT21-IT302-01)..."}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {activeSubTab === 'courses' ? (
            <select
              value={selectedDeptFilter}
              onChange={e => setSelectedDeptFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300"
            >
              <option value="all">Tất cả khoa phụ trách</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          ) : (
            <select
              value={selectedSemesterFilter}
              onChange={e => setSelectedSemesterFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300"
            >
              <option value="all">Tất cả học kỳ</option>
              <option value="HK1">Học kỳ 1</option>
              <option value="HK2">Học kỳ 2</option>
              <option value="HK3">Học kỳ Hè</option>
            </select>
          )}
        </div>
      </div>

      {/* 1. COURSES TABLE */}
      {activeSubTab === 'courses' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4 w-32 font-mono">Mã môn học</th>
                  <th className="py-3 px-4">Tên môn học / Học phần</th>
                  <th className="py-3 px-4 text-center w-24">Số tín chỉ</th>
                  <th className="py-3 px-4">Khoa phụ trách</th>
                  <th className="py-3 px-4 text-center w-32">Lớp HP đang mở</th>
                  <th className="py-3 px-4 text-right w-24">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Không tìm thấy môn học nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredCourses.map((c, idx) => {
                    const dept = departments.find(d => d.id === c.departmentId);
                    const openSections = sections.filter(s => s.courseId === c.id);

                    return (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 text-center font-mono text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {c.code}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          {c.name}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                            {c.credits} TC
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {dept?.name || 'Khoa CNTT'}
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            openSections.length > 0
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}>
                            {openSections.length} lớp HP
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditCourse(c)}
                            className="p-1 hover:text-blue-600 text-slate-500 transition-colors"
                            title="Sửa môn học thủ công"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setCourseToDelete(c)}
                            className="p-1 hover:text-red-600 text-slate-500 transition-colors"
                            title="Xóa môn học"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* 2. COURSE SECTIONS TABLE */}
      {activeSubTab === 'sections' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4 font-mono">Mã lớp học phần</th>
                  <th className="py-3 px-4">Môn học tương ứng</th>
                  <th className="py-3 px-4">Giảng viên giảng dạy</th>
                  <th className="py-3 px-4 text-center w-28">Học kỳ / Năm</th>
                  <th className="py-3 px-4 text-center w-28">Sinh viên</th>
                  <th className="py-3 px-4 text-right w-24">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSections.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Không tìm thấy lớp học phần nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredSections.map((sec, idx) => {
                    const targetCourse = courses.find(c => c.id === sec.courseId);
                    const targetLecturer = lecturers.find(l => l.id === sec.lecturerId);

                    return (
                      <tr key={sec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 text-center font-mono text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {sec.code}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {targetCourse?.name || 'Môn học chưa xác định'}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">
                            {targetCourse?.code} · {targetCourse?.credits || 3} tín chỉ
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {targetLecturer?.fullName || 'Chưa phân công'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {targetLecturer?.academicTitle || 'Giảng viên'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-600 dark:text-slate-300">
                          <span className="font-semibold">{sec.semester}</span>
                          <span className="block text-[10px] text-slate-400">{sec.academicYear}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold text-[11px]">
                            {sec.enrolledStudentIds?.length || 0} SV
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditSection(sec)}
                            className="p-1 hover:text-blue-600 text-slate-500 transition-colors"
                            title="Chỉnh sửa lớp học phần & danh sách SV"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSectionToDelete(sec)}
                            className="p-1 hover:text-red-600 text-slate-500 transition-colors"
                            title="Xóa lớp học phần"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* --- MODAL 1: ADD / EDIT COURSE --- */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingCourse ? 'Sửa đổi Môn học / Học phần' : 'Thêm Môn học / Học phần mới thủ công'}
                </h3>
              </div>
              <button onClick={() => setIsCourseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mã môn học / Học phần <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={courseCode}
                    onChange={e => setCourseCode(e.target.value.toUpperCase())}
                    placeholder="VD: IT302, CE204..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số tín chỉ
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    required
                    value={courseCredits}
                    onChange={e => setCourseCredits(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên Môn học / Học phần <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={courseName}
                  onChange={e => setCourseName(e.target.value)}
                  placeholder="VD: Lập trình Web Nâng Cao, Trí tuệ Nhân tạo..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Khoa / Bộ môn phụ trách
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreateDeptModalOpen(true)}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Thêm Khoa mới</span>
                  </button>
                </div>
                <select
                  value={courseDeptId}
                  onChange={e => setCourseDeptId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Lưu môn học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ADD / EDIT COURSE SECTION --- */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingSection ? 'Sửa đổi Lớp học phần thủ công' : 'Thêm Lớp học phần mới thủ công'}
                </h3>
              </div>
              <button onClick={() => setIsSectionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSection} className="space-y-3.5 overflow-y-auto pr-1 flex-1 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mã Lớp học phần <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={sectionCode}
                  onChange={e => setSectionCode(e.target.value.toUpperCase())}
                  placeholder="VD: 72DCHT21-IT302-01"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Môn học / Học phần <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={sectionCourseId}
                    onChange={e => setSectionCourseId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Giảng viên giảng dạy <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={sectionLecturerId}
                    onChange={e => setSectionLecturerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    {lecturers.map(l => (
                      <option key={l.id} value={l.id}>{l.fullName} ({l.academicTitle})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Học kỳ
                  </label>
                  <select
                    value={sectionSemester}
                    onChange={e => setSectionSemester(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    <option value="HK1">Học kỳ 1</option>
                    <option value="HK2">Học kỳ 2</option>
                    <option value="HK3">Học kỳ Hè</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Năm học
                  </label>
                  <select
                    value={sectionAcademicYear}
                    onChange={e => setSectionAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    <option value="2025-2026">2025-2026</option>
                    <option value="2026-2027">2026-2027</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số buổi học
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={sectionTotalSessions}
                    onChange={e => setSectionTotalSessions(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Enrolled Students Management Section */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Danh sách sinh viên ghi danh ({sectionEnrolledIds.length} sinh viên)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowRosterPicker(!showRosterPicker)}
                    className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    {showRosterPicker ? 'Ẩn bảng chọn SV' : '+ Thêm / Bớt sinh viên'}
                  </button>
                </div>

                {/* Quick Add Whole Administrative Class */}
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Ghi danh nhanh toàn bộ SV theo lớp hành chính:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {administrativeClasses.map(cls => (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => handleEnrollWholeClass(cls.id)}
                        className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-500 text-[10px] font-mono font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1"
                      >
                        <span>+ Lớp {cls.code}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Roster Picker Checklist */}
                {showRosterPicker && (() => {
                  const filteredRosterStudents = students.filter(s => 
                    !rosterSearch || 
                    s.fullName.toLowerCase().includes(rosterSearch.toLowerCase()) || 
                    s.code.toLowerCase().includes(rosterSearch.toLowerCase())
                  );
                  const isAllFilteredSelected = filteredRosterStudents.length > 0 && 
                    filteredRosterStudents.every(s => sectionEnrolledIds.includes(s.id));
                  const selectedFilteredCount = filteredRosterStudents.filter(s => 
                    sectionEnrolledIds.includes(s.id)
                  ).length;

                  return (
                    <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                        <input
                          type="text"
                          value={rosterSearch}
                          onChange={e => setRosterSearch(e.target.value)}
                          placeholder="Tìm sinh viên theo tên hoặc mã để ghi danh..."
                          className="w-full pl-8 pr-2.5 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                        />
                      </div>

                      {/* Select All / Deselect All Controls */}
                      <div className="flex items-center justify-between px-2 py-1.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 rounded-xl text-xs">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isAllFilteredSelected}
                            onChange={() => {
                              if (isAllFilteredSelected) {
                                handleDeselectAllStudentsInRoster(filteredRosterStudents);
                              } else {
                                handleSelectAllStudentsInRoster(filteredRosterStudents);
                              }
                            }}
                            className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer"
                          />
                          <span className="font-semibold text-blue-900 dark:text-blue-200">
                            {isAllFilteredSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                            {rosterSearch ? ` (${filteredRosterStudents.length} SV tìm kiếm)` : ` (${filteredRosterStudents.length} sinh viên)`}
                          </span>
                        </label>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                            Đã chọn: <strong className="text-blue-600 dark:text-blue-400">{selectedFilteredCount}/{filteredRosterStudents.length}</strong>
                          </span>
                          {selectedFilteredCount > 0 && (
                            <button
                              type="button"
                              onClick={() => handleDeselectAllStudentsInRoster(filteredRosterStudents)}
                              className="text-[10px] text-red-600 dark:text-red-400 hover:underline font-medium"
                            >
                              Bỏ chọn
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-1.5">
                        {filteredRosterStudents.length === 0 ? (
                          <div className="py-4 text-center text-xs text-slate-400">
                            Không tìm thấy sinh viên phù hợp
                          </div>
                        ) : (
                          filteredRosterStudents.map(st => {
                            const isEnrolled = sectionEnrolledIds.includes(st.id);
                            return (
                              <label key={st.id} className="flex items-center justify-between p-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer rounded-lg text-xs">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isEnrolled}
                                    onChange={() => handleToggleStudentInRoster(st.id)}
                                    className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer"
                                  />
                                  <div>
                                    <span className="font-semibold text-slate-900 dark:text-white">{st.fullName}</span>
                                    <span className="font-mono text-[10px] text-slate-400 ml-1">({st.code})</span>
                                  </div>
                                </div>
                                <span className="font-mono text-[10px] text-slate-500">{st.classId.replace('class_', '').toUpperCase()}</span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="pt-2 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Lưu lớp học phần
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CONFIRM DELETE MODALS --- */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">Xóa môn học này?</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Bạn có chắc chắn muốn xóa môn học <strong>{courseToDelete.code} - {courseToDelete.name}</strong>?
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2 text-xs">
              <button
                onClick={() => setCourseToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDeleteCourse}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {sectionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">Xóa lớp học phần?</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Bạn có chắc muốn xóa lớp học phần <strong>{sectionToDelete.code}</strong> khỏi hệ thống?
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2 text-xs">
              <button
                onClick={() => setSectionToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDeleteSection}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CREATE DEPARTMENT MODAL --- */}
      <CreateDepartmentModal
        isOpen={isCreateDeptModalOpen}
        onClose={() => setIsCreateDeptModalOpen(false)}
        onSuccess={(newDept) => {
          setCourseDeptId(newDept.id);
          refreshAll();
          setToastMessage(`Đã thêm Khoa/Bộ môn mới: ${newDept.name}!`);
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom border border-slate-800">
          <Check className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
