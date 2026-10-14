import React, { useState } from 'react';
import { Student } from '../../types';
import { db } from '../../services/dbService';
import { FileStudentImportModal } from '../common/FileStudentImportModal';
import { CreateDepartmentModal } from '../common/CreateDepartmentModal';
import { 
  Users, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  ShieldCheck, 
  Check, 
  X, 
  Filter, 
  Camera, 
  Upload, 
  Download,
  FileSpreadsheet,
  Zap,
  RefreshCw,
  Layers,
  Building,
  AlertTriangle,
  CheckSquare,
  Square
} from 'lucide-react';

export const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>(db.getStudents());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedDept, setSelectedDept] = useState('all');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Multi-selection states
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [deleteAllConfirmText, setDeleteAllConfirmText] = useState('');
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [bulkEditDeptId, setBulkEditDeptId] = useState<string>('keep');
  const [bulkEditClassId, setBulkEditClassId] = useState<string>('keep');
  const [bulkEditResetFace, setBulkEditResetFace] = useState<boolean>(false);

  // Quick Department Sync states
  const [syncDeptStudent, setSyncDeptStudent] = useState<Student | null>(null);
  const [isQuickDeptModalOpen, setIsQuickDeptModalOpen] = useState(false);
  const [isCreateDeptModalOpen, setIsCreateDeptModalOpen] = useState(false);
  const [syncDeptTargetId, setSyncDeptTargetId] = useState<string>('');
  const [selectedClassIdsToSync, setSelectedClassIdsToSync] = useState<string[]>([]);
  const [syncStudentsInClass, setSyncStudentsInClass] = useState<boolean>(true);
  const [classFilterSearch, setClassFilterSearch] = useState<string>('');

  const departments = db.getDepartments();
  const classes = db.getClasses();

  // Form states for new/edit
  const [fullName, setFullName] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '');

  const refresh = () => setStudents(db.getStudents());

  React.useEffect(() => {
    refresh();
    return db.subscribe(refresh);
  }, []);

  const handleOpenQuickDeptSync = (st: Student) => {
    setSyncDeptStudent(st);
    setSyncDeptTargetId(st.departmentId);
    setSelectedClassIdsToSync([st.classId]);
    setSyncStudentsInClass(true);
    setClassFilterSearch('');
    setIsQuickDeptModalOpen(true);
  };

  const handleSelectAllClasses = () => {
    setSelectedClassIdsToSync(classes.map(c => c.id));
  };

  const handleDeselectAllClasses = () => {
    setSelectedClassIdsToSync([]);
  };

  const handleToggleClassToSync = (cId: string) => {
    setSelectedClassIdsToSync(prev => 
      prev.includes(cId) ? prev.filter(id => id !== cId) : [...prev, cId]
    );
  };

  const handleConfirmQuickDeptSync = (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncDeptStudent || !syncDeptTargetId) return;

    // 1. Update the student's department
    const updatedStudent: Student = {
      ...syncDeptStudent,
      departmentId: syncDeptTargetId
    };
    db.saveStudent(updatedStudent);

    // 2. Sync to selected classes and their students if selected
    let updatedCountMessage = '';
    if (selectedClassIdsToSync.length > 0) {
      const syncResult = db.syncDepartmentToClasses(syncDeptTargetId, selectedClassIdsToSync, syncStudentsInClass);
      updatedCountMessage = ` và đồng bộ thành công sang ${syncResult.updatedClassesCount} lớp (${syncResult.updatedStudentsCount} sinh viên)`;
    }

    const targetDept = departments.find(d => d.id === syncDeptTargetId);
    setToastMessage(`Đã cập nhật ${targetDept?.name || 'Khoa'} cho sinh viên ${syncDeptStudent.fullName}${updatedCountMessage}!`);
    setTimeout(() => setToastMessage(null), 4500);

    setIsQuickDeptModalOpen(false);
    setSyncDeptStudent(null);
    refresh();
  };

  const handleExportAll = () => {
    const headers = ['STT', 'Mã Sinh Viên', 'Họ và Tên', 'Lớp Hành Chính', 'Khoa', 'Email', 'Điện Thoại', 'Đã Có Face ID'];
    const rows = students.map((s, idx) => {
      const cls = classes.find(c => c.id === s.classId);
      const dpt = departments.find(d => d.id === s.departmentId);
      return [
        idx + 1,
        s.code,
        `"${s.fullName}"`,
        cls?.code || s.classId,
        `"${dpt?.name || s.departmentId}"`,
        s.email,
        s.phone || '',
        s.faceRegistered ? 'Đã kích hoạt' : 'Chưa có'
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Danh_sach_sinh_vien_UTT_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkImportAll = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    const newItems: Student[] = [];

    for (const line of lines) {
      const parts = line.split(/[,;\t]/).map(p => p.trim());
      if (parts.length >= 2) {
        const c = parts[0];
        const n = parts[1];
        const cl = parts[2] ? `class_${parts[2].toLowerCase()}` : classes[0]?.id || 'class_72dcht21';
        newItems.push({
          id: `student_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
          code: c,
          fullName: n,
          email: `${c.toLowerCase()}@utt.edu.vn`,
          phone: parts[3] || '0988.123.456',
          role: 'student',
          classId: cl,
          departmentId: departments[0]?.id || 'dept_it',
          admissionYear: 2021,
          faceRegistered: false,
          createdAt: new Date().toISOString()
        });
      }
    }

    if (newItems.length > 0) {
      db.bulkSaveStudents(newItems);
      refresh();
      setBulkMessage(`Đã nhập thành công ${newItems.length} sinh viên vào cơ sở dữ liệu!`);
      setBulkText('');
    }
  };

  const handleOpenNew = () => {
    setEditingStudent(null);
    setFullName('');
    setCode(`72DCHT210${students.length + 1}`);
    setEmail(`student${students.length + 1}@utt.edu.vn`);
    setPhone('0988.111.222');
    setClassId(classes[0]?.id || '');
    setDepartmentId(departments[0]?.id || '');
    setIsNewModalOpen(true);
  };

  const handleOpenEdit = (st: Student) => {
    setEditingStudent(st);
    setFullName(st.fullName);
    setCode(st.code);
    setEmail(st.email);
    setPhone(st.phone || '');
    setClassId(st.classId);
    setDepartmentId(st.departmentId);
    setIsNewModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !code) return;

    if (editingStudent) {
      const updated: Student = {
        ...editingStudent,
        fullName,
        code,
        email,
        phone,
        classId,
        departmentId
      };
      db.saveStudent(updated);
    } else {
      const newSt: Student = {
        id: `student_${Date.now()}`,
        code,
        fullName,
        email,
        phone,
        role: 'student',
        classId,
        departmentId,
        admissionYear: 2021,
        faceRegistered: false,
        createdAt: new Date().toISOString()
      };
      db.saveStudent(newSt);
    }

    setIsNewModalOpen(false);
    refresh();
  };

  const handleDelete = (st: Student) => {
    setStudentToDelete(st);
  };

  const handleConfirmDelete = () => {
    if (!studentToDelete) return;
    const name = studentToDelete.fullName;
    const code = studentToDelete.code;
    db.deleteStudent(studentToDelete.id);
    setSelectedStudentIds(prev => prev.filter(id => id !== studentToDelete.id));
    setStudentToDelete(null);
    refresh();
    setToastMessage(`Đã xóa thành công sinh viên ${name} (${code}) và dữ liệu Face ID khỏi hệ thống!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filtered.map(s => s.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedStudentIds.includes(id));
    if (allSelected) {
      // Unselect all in current filter
      setSelectedStudentIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      // Select all in current filter
      const set = new Set([...selectedStudentIds, ...filteredIds]);
      setSelectedStudentIds(Array.from(set));
    }
  };

  const handleConfirmDeleteAll = () => {
    const totalCount = students.length;
    db.deleteAllStudents();
    setSelectedStudentIds([]);
    setIsDeleteAllModalOpen(false);
    setDeleteAllConfirmText('');
    refresh();
    setToastMessage(`Đã xóa toàn bộ ${totalCount} sinh viên và dữ liệu Face ID khỏi hệ thống!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleConfirmBulkDelete = () => {
    if (selectedStudentIds.length === 0) return;
    const count = selectedStudentIds.length;
    db.deleteStudents(selectedStudentIds);
    setSelectedStudentIds([]);
    setIsBulkDeleteModalOpen(false);
    refresh();
    setToastMessage(`Đã xóa thành công ${count} sinh viên đã chọn khỏi hệ thống!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleConfirmBulkEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0) return;

    const updates: { departmentId?: string; classId?: string; resetFace?: boolean } = {};
    if (bulkEditDeptId !== 'keep') updates.departmentId = bulkEditDeptId;
    if (bulkEditClassId !== 'keep') updates.classId = bulkEditClassId;
    if (bulkEditResetFace) updates.resetFace = true;

    const count = db.bulkUpdateStudents(selectedStudentIds, updates);
    setIsBulkEditModalOpen(false);
    setSelectedStudentIds([]);
    refresh();
    setToastMessage(`Đã cập nhật hàng loạt thành công cho ${count} sinh viên!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filtered = students.filter(st => {
    if (selectedClass !== 'all' && st.classId !== selectedClass) return false;
    if (selectedDept !== 'all' && st.departmentId !== selectedDept) return false;
    if (searchTerm) {
      const matchName = st.fullName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCode = st.code.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchName && !matchCode) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Quản lý Sinh viên Toàn trường ({students.length})
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Danh mục hồ sơ học viên, trạng thái khuôn mặt Face ID và phân lớp hành chính
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsFileModalOpen(true)}
            className="px-3.5 py-2 border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-xs font-semibold text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Nhập từ Word / Excel</span>
          </button>

          <button
            onClick={() => {
              setBulkMessage(null);
              setIsBulkModalOpen(true);
            }}
            className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Upload className="w-4 h-4 text-blue-500" />
            <span>Dán danh sách SV</span>
          </button>

          <button
            onClick={handleExportAll}
            className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Xuất file CSV</span>
          </button>

          <button
            onClick={() => {
              setDeleteAllConfirmText('');
              setIsDeleteAllModalOpen(true);
            }}
            disabled={students.length === 0}
            className="px-3.5 py-2 border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 text-xs font-semibold text-red-700 dark:text-red-400 rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors disabled:opacity-40"
            title="Xóa toàn bộ sinh viên trong hệ thống"
          >
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span>Xóa tất cả SV</span>
          </button>

          <button
            onClick={handleOpenNew}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm sinh viên mới</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Bar (when students are selected) */}
      {selectedStudentIds.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/60 dark:to-indigo-950/60 border border-blue-200 dark:border-blue-800 shadow-sm flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {selectedStudentIds.length}
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Đang chọn {selectedStudentIds.length} sinh viên</span>
                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  (trên tổng số {students.length} SV)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Thực hiện chỉnh sửa Khoa/Lớp hoặc xóa đồng thời các sinh viên đã chọn
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setBulkEditDeptId('keep');
                setBulkEditClassId('keep');
                setBulkEditResetFace(false);
                setIsBulkEditModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Sửa hàng loạt ({selectedStudentIds.length})</span>
            </button>

            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa ({selectedStudentIds.length}) SV đã chọn</span>
            </button>

            <button
              onClick={() => setSelectedStudentIds([])}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên hoặc mã sinh viên..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300"
          >
            <option value="all">Tất cả khoa</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300"
          >
            <option value="all">Tất cả lớp hành chính</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.code}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && filtered.every(st => selectedStudentIds.includes(st.id))}
                    onChange={handleSelectAllFiltered}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                    title="Chọn tất cả sinh viên đang lọc"
                  />
                </th>
                <th className="py-3 px-3 w-12 text-center">STT</th>
                <th className="py-3 px-4 w-28 font-mono">Mã SV</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Khoa đào tạo</th>
                <th className="py-3 px-4 font-mono">Lớp HC</th>
                <th className="py-3 px-4 text-center">Face Template</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((st, idx) => {
                const dept = departments.find(d => d.id === st.departmentId);
                const cls = classes.find(c => c.id === st.classId);
                const isSelected = selectedStudentIds.includes(st.id);

                return (
                  <tr
                    key={st.id}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100/60 dark:hover:bg-blue-900/40'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectStudent(st.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                      />
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {st.code}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {st.fullName}
                      </div>
                      <div className="text-[11px] text-slate-400">{st.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-between gap-1 group">
                        <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[150px]">
                          {dept?.name || 'Khoa CNTT'}
                        </span>
                        <button
                          onClick={() => handleOpenQuickDeptSync(st)}
                          className="px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-800/80 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-[11px] font-semibold flex items-center gap-1 transition-colors shrink-0 shadow-2xs"
                          title="Sửa nhanh Khoa đào tạo và đồng bộ sang các lớp"
                        >
                          <Zap className="w-3 h-3 text-blue-500 fill-blue-500/20" />
                          <span>Sửa & Đồng bộ</span>
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {cls?.code || '72DCHT21'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {st.faceRegistered ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Đã đăng ký (128-d)
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">
                          Chưa kích hoạt
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(st)}
                        className="p-1 hover:text-blue-600 text-slate-500"
                        title="Chỉnh sửa chi tiết"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(st)}
                        className="p-1 hover:text-red-600 text-slate-500"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal New / Edit */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingStudent ? 'Chỉnh sửa sinh viên' : 'Thêm sinh viên mới'}
              </h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mã sinh viên
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email nhà trường (@utt.edu.vn)
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      Khoa đào tạo
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsCreateDeptModalOpen(true)}
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-0.5"
                        title="Tạo Khoa đào tạo / Bộ môn mới"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Thêm Khoa mới</span>
                      </button>
                      {editingStudent && (
                        <>
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsNewModalOpen(false);
                              handleOpenQuickDeptSync({ ...editingStudent, departmentId });
                            }}
                            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-0.5"
                            title="Mở bảng đồng bộ Khoa sang các lớp"
                          >
                            <Zap className="w-3 h-3 text-blue-500" />
                            <span>Đồng bộ lớp</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <select
                    value={departmentId}
                    onChange={e => setDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lớp hành chính
                  </label>
                  <select
                    value={classId}
                    onChange={e => setClassId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.code}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Biometrics Face ID Management Section */}
              {editingStudent && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>Dữ liệu khuôn mặt Face ID</span>
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${editingStudent.faceRegistered ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                      {editingStudent.faceRegistered ? 'Đã có Face Template 128-d' : 'Chưa có Face Template'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Nếu sinh viên này bị camera nhận diện nhầm với người khác hoặc khuôn mặt thực tế không khớp, bạn có thể đặt lại (xóa) mẫu khuôn mặt để sinh viên chụp đăng ký lại.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    {editingStudent.faceRegistered && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Xác nhận xóa mẫu khuôn mặt của sinh viên ${editingStudent.fullName}? Sinh viên sẽ cần đăng ký lại.`)) {
                            db.resetStudentFace(editingStudent.id);
                            refresh();
                            setEditingStudent(db.getStudentById(editingStudent.id) || null);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa mẫu Face ID này</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        // Mark active with fresh clean embedding
                        const tmpl = {
                          id: `tmpl_${editingStudent.id}_${Date.now()}`,
                          studentId: editingStudent.id,
                          embedding: new Array(128).fill(0).map((_, i) => Number((Math.sin((i + 1) * (editingStudent.id.length * 0.73)) * 0.4).toFixed(6))),
                          registeredAt: new Date().toISOString(),
                          qualityScore: 98,
                          hashAlgorithm: 'SHA256-AES128-EMBEDDING-SECURE',
                          consentAgreed: true,
                          consentAgreedAt: new Date().toISOString()
                        };
                        db.saveFaceTemplate(tmpl);
                        refresh();
                        setEditingStudent(db.getStudentById(editingStudent.id) || null);
                        alert(`Đã cấp mới mẫu Face Template cho sinh viên ${editingStudent.fullName}!`);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-600 dark:text-blue-400 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Cấp lại mẫu khuôn mặt</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold"
                >
                  Lưu sinh viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Nhập danh sách sinh viên hàng loạt</span>
              </h3>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-xs text-blue-800 dark:text-blue-300 space-y-1">
              <div className="font-semibold">Cấu trúc mỗi dòng (cách nhau bởi dấu phẩy hoặc tab):</div>
              <div className="font-mono text-[11px]">
                Mã SV, Họ và Tên, Lớp (ví dụ: <code>72DCHT21088, Nguyễn Văn Hùng, 72DCHT21</code>)
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">
                Dán danh sách sinh viên:
              </label>
              <textarea
                rows={6}
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                placeholder={"72DCHT21060, Nguyễn Tuấn Anh, 72DCHT21\n72DCHT21061, Trần Thị Thảo, 72DCHT21"}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>

            {bulkMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{bulkMessage}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleBulkImportAll}
                disabled={!bulkText.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-semibold shadow-xs"
              >
                Nhập vào hệ thống
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Student Import Modal (Word / Excel) */}
      {isFileModalOpen && (
        <FileStudentImportModal
          isOpen={isFileModalOpen}
          onClose={() => setIsFileModalOpen(false)}
          onSuccess={(count) => {
            refresh();
            alert(`Đã nhập thành công ${count} sinh viên vào hệ thống UTT!`);
          }}
        />
      )}

      {/* Quick Department Edit & Class Sync Modal */}
      {isQuickDeptModalOpen && syncDeptStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Zap className="w-4 h-4 fill-blue-600/20" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Sửa Khoa Đào Tạo & Đồng Bộ Danh Sách Lớp
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    SV: <span className="font-semibold text-slate-900 dark:text-white">{syncDeptStudent.fullName}</span> ({syncDeptStudent.code}) · Lớp: <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{classes.find(c => c.id === syncDeptStudent.classId)?.code || syncDeptStudent.classId}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsQuickDeptModalOpen(false);
                  setSyncDeptStudent(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmQuickDeptSync} className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
              {/* Select Target Department */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-900 dark:text-white">
                    Chọn Khoa đào tạo mới:
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
                  value={syncDeptTargetId}
                  onChange={e => setSyncDeptTargetId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code}) - Trưởng khoa: {d.deanName}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Khoa này sẽ được gán cho sinh viên <strong className="text-slate-700 dark:text-slate-200">{syncDeptStudent.fullName}</strong> và các lớp được chọn dưới đây.
                </p>
              </div>

              {/* Fast Synchronization Action Buttons */}
              <div className="space-y-2">
                <label className="block font-semibold text-slate-900 dark:text-white">
                  Tùy chọn đồng bộ hóa Khoa:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllClasses}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1 shadow-2xs ${
                      selectedClassIdsToSync.length === classes.length
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-blue-600" />
                        Đồng bộ tất cả các lớp
                      </span>
                      {selectedClassIdsToSync.length === classes.length && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Đồng bộ với toàn bộ các lớp khác có trong danh sách ({classes.length} lớp)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      // Toggle select current class or keep custom list
                      if (selectedClassIdsToSync.length === classes.length) {
                        setSelectedClassIdsToSync([syncDeptStudent.classId]);
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1 shadow-2xs ${
                      selectedClassIdsToSync.length > 0 && selectedClassIdsToSync.length < classes.length
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        Đồng bộ lớp chọn lọc
                      </span>
                      {selectedClassIdsToSync.length > 0 && selectedClassIdsToSync.length < classes.length && (
                        <span className="text-[11px] font-mono font-bold bg-blue-600 text-white px-1.5 py-0.2 rounded-full">
                          {selectedClassIdsToSync.length}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Đồng bộ với 1, 2, 3... lớp được chọn trong danh sách dưới đây
                    </span>
                  </button>
                </div>
              </div>

              {/* Class Multi-Select Checklist */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                    <input
                      type="text"
                      value={classFilterSearch}
                      onChange={e => setClassFilterSearch(e.target.value)}
                      placeholder="Tìm kiếm lớp để đồng bộ (VD: 72DCHT, 72DCOT)..."
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleSelectAllClasses}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                    >
                      Chọn tất cả ({classes.length})
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllClasses}
                      className="text-[11px] text-slate-500 hover:underline"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 max-h-48 overflow-y-auto space-y-1 divide-y divide-slate-100 dark:divide-slate-800/60">
                  {classes
                    .filter(c => 
                      !classFilterSearch || 
                      c.code.toLowerCase().includes(classFilterSearch.toLowerCase()) || 
                      c.name.toLowerCase().includes(classFilterSearch.toLowerCase())
                    )
                    .map(cls => {
                      const isChecked = selectedClassIdsToSync.includes(cls.id);
                      const isCurrentStudentClass = cls.id === syncDeptStudent.classId;
                      const deptOfClass = departments.find(d => d.id === cls.departmentId);
                      const studentsInThisClass = students.filter(s => s.classId === cls.id).length;

                      return (
                        <label
                          key={cls.id}
                          className={`flex items-center justify-between p-2 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors ${
                            isChecked ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleClassToSync(cls.id)}
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                            />
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span className="font-mono">{cls.code}</span>
                                {isCurrentStudentClass && (
                                  <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded-md font-semibold">
                                    Lớp của SV này
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {cls.name} · Hiện thuộc: {deptOfClass?.code || 'Khoa CNTT'}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 font-medium">
                              {studentsInThisClass || cls.studentCount || 0} SV
                            </span>
                          </div>
                        </label>
                      );
                    })}
                </div>

                {/* Scope option: Sync students in those classes */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                    <input
                      type="checkbox"
                      checked={syncStudentsInClass}
                      onChange={e => setSyncStudentsInClass(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        Đồng bộ Khoa cho toàn bộ sinh viên đang thuộc các lớp được chọn
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Nếu bật, tất cả sinh viên trong các lớp đã tick sẽ tự động chuyển sang Khoa mới cùng lúc.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Status summary banner */}
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900 text-blue-900 dark:text-blue-200 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-blue-600" />
                  <span>
                    Đã chọn: <strong className="font-mono">{selectedClassIdsToSync.length}</strong> lớp
                    {syncStudentsInClass && (
                      <span> (ước tính ~{students.filter(s => selectedClassIdsToSync.includes(s.classId)).length} sinh viên)</span>
                    )}
                  </span>
                </span>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                  Khoa mới: {departments.find(d => d.id === syncDeptTargetId)?.code}
                </span>
              </div>

              {/* Footer Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 shrink-0 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickDeptModalOpen(false);
                    setSyncDeptStudent(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Xác nhận & Đồng bộ Khoa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Student Delete Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Xác nhận xóa sinh viên
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Thao tác này sẽ xóa hồ sơ và dữ liệu sinh trắc học Face ID
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Họ và tên:</span>
                <span className="font-bold text-slate-900 dark:text-white">{studentToDelete.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Mã sinh viên:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{studentToDelete.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Lớp hành chính:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {classes.find(c => c.id === studentToDelete.classId)?.code || studentToDelete.classId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Khoa đào tạo:</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {departments.find(d => d.id === studentToDelete.departmentId)?.name || 'Khoa CNTT'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Trạng thái Face ID:</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                  studentToDelete.faceRegistered
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}>
                  {studentToDelete.faceRegistered ? 'Đã kích hoạt (128-d)' : 'Chưa có mẫu'}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-[11px] text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Cảnh báo: Dữ liệu khuôn mặt Face ID và các bản ghi điểm danh liên quan của sinh viên này sẽ bị xóa và không thể khôi phục.
              </span>
            </div>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Students Confirmation Modal */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-red-300 dark:border-red-900 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-600 dark:text-red-400">
                  XÓA TOÀN BỘ SINH VIÊN ({students.length})
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Thao tác nguy hiểm ảnh hưởng đến toàn bộ cơ sở dữ liệu
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-xs text-red-800 dark:text-red-200 space-y-2">
              <p className="font-semibold">
                Bạn sắp xóa vĩnh viễn toàn bộ {students.length} sinh viên khỏi hệ thống!
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-red-700 dark:text-red-300">
                <li>Tất cả hồ sơ sinh viên sẽ bị gỡ bỏ hoàn toàn.</li>
                <li>Tất cả mẫu sinh trắc học Face ID đã lưu sẽ bị xóa sạch.</li>
                <li>Hành động này KHÔNG THỂ hoàn tác sau khi xác nhận.</li>
              </ul>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                Để xác nhận, vui lòng nhập chính xác cụm từ <span className="font-mono text-red-600 dark:text-red-400 font-bold">XÓA TẤT CẢ</span> vào ô bên dưới:
              </label>
              <input
                type="text"
                value={deleteAllConfirmText}
                onChange={e => setDeleteAllConfirmText(e.target.value)}
                placeholder="Nhập: XÓA TẤT CẢ"
                className="w-full px-3 py-2 rounded-xl border border-red-300 dark:border-red-900 bg-white dark:bg-slate-950 text-red-600 font-mono font-bold text-xs focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteAllModalOpen(false);
                  setDeleteAllConfirmText('');
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={deleteAllConfirmText.trim().toUpperCase() !== 'XÓA TẤT CẢ'}
                onClick={handleConfirmDeleteAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xác nhận xóa tất cả SV</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Selected Students Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Xóa {selectedStudentIds.length} sinh viên đã chọn
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Xác nhận xóa hàng loạt hồ sơ học viên và mẫu Face ID
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 shrink-0">
              Danh sách các sinh viên sẽ bị xóa khỏi cơ sở dữ liệu ({selectedStudentIds.length} sinh viên):
            </p>

            <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-1 divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {students
                .filter(s => selectedStudentIds.includes(s.id))
                .map((st, i) => (
                  <div key={st.id} className="pt-1.5 pb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 text-[11px]">{i + 1}.</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{st.fullName}</span>
                      <span className="font-mono text-blue-600 dark:text-blue-400 text-[11px]">({st.code})</span>
                    </div>
                    <span className="font-mono text-slate-500 text-[11px]">
                      {classes.find(c => c.id === st.classId)?.code || st.classId}
                    </span>
                  </div>
                ))}
            </div>

            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-[11px] text-red-700 dark:text-red-300 flex items-center gap-2 shrink-0">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Hành động này sẽ xóa dữ liệu sinh trắc học và lịch sử điểm danh của toàn bộ sinh viên đã chọn.</span>
            </div>

            <div className="pt-2 flex justify-end gap-2 text-xs shrink-0 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xác nhận xóa {selectedStudentIds.length} SV</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Selected Students Modal */}
      {isBulkEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Chỉnh sửa hàng loạt ({selectedStudentIds.length} sinh viên)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Cập nhật đồng thời Khoa đào tạo, Lớp hành chính hoặc đặt lại Face ID
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmBulkEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Khoa đào tạo mới:
                </label>
                <select
                  value={bulkEditDeptId}
                  onChange={e => setBulkEditDeptId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  <option value="keep">-- Giữ nguyên Khoa hiện tại của từng sinh viên --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Chọn khoa mới nếu muốn chuyển tất cả {selectedStudentIds.length} sinh viên sang khoa đó.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lớp hành chính mới:
                </label>
                <select
                  value={bulkEditClassId}
                  onChange={e => setBulkEditClassId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  <option value="keep">-- Giữ nguyên Lớp hiện tại của từng sinh viên --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Chọn lớp mới nếu muốn gộp tất cả sinh viên được chọn vào cùng một lớp.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkEditResetFace}
                    onChange={e => setBulkEditResetFace(e.target.checked)}
                    className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600 mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                      Đặt lại mẫu Face ID cho các sinh viên được chọn
                    </span>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed mt-0.5">
                      Xóa mẫu khuôn mặt hiện tại để sinh viên quét nhận diện đăng ký lại từ đầu (hữu ích khi dữ liệu cũ bị quét nhầm hoặc lỗi camera).
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBulkEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={bulkEditDeptId === 'keep' && bulkEditClassId === 'keep' && !bulkEditResetFace}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Áp dụng cho {selectedStudentIds.length} SV</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300 max-w-md">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-5 h-5 stroke-[2.5]" />
          </div>
          <p className="text-xs font-semibold leading-relaxed">
            {toastMessage}
          </p>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white dark:hover:text-slate-900 ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {/* Create Department / Division Modal */}
      <CreateDepartmentModal
        isOpen={isCreateDeptModalOpen}
        onClose={() => setIsCreateDeptModalOpen(false)}
        onSuccess={(newDept) => {
          setDepartmentId(newDept.id);
          setSyncDeptTargetId(newDept.id);
          setToastMessage(`Đã thêm Khoa/Bộ môn mới: ${newDept.name} (${newDept.code})!`);
          setTimeout(() => setToastMessage(null), 4000);
          refresh();
        }}
      />
    </div>
  );
};
