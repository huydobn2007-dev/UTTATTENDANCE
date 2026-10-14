import React, { useState } from 'react';
import { Lecturer } from '../../types';
import { db } from '../../services/dbService';
import { CreateDepartmentModal } from '../common/CreateDepartmentModal';
import { 
  GraduationCap, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  Check, 
  X,
  Building
} from 'lucide-react';

export const AdminLecturers: React.FC = () => {
  const [lecturers, setLecturers] = useState<Lecturer[]>(db.getLecturers());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [editingLecturer, setEditingLecturer] = useState<Lecturer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateDeptModalOpen, setIsCreateDeptModalOpen] = useState(false);
  const [lecturerToDelete, setLecturerToDelete] = useState<Lecturer | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const departments = db.getDepartments();

  // Form states
  const [fullName, setFullName] = useState('');
  const [code, setCode] = useState('');
  const [academicTitle, setAcademicTitle] = useState('TS.');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '');
  const [officeRoom, setOfficeRoom] = useState('P.402-H1');

  const refresh = () => setLecturers(db.getLecturers());

  React.useEffect(() => {
    refresh();
    return db.subscribe(refresh);
  }, []);

  const handleOpenNew = () => {
    setEditingLecturer(null);
    setFullName('');
    setCode(`GV00${lecturers.length + 1}`);
    setAcademicTitle('TS.');
    setEmail(`gv${lecturers.length + 1}@utt.edu.vn`);
    setPhone('0912.888.999');
    setDepartmentId(departments[0]?.id || '');
    setOfficeRoom('P.402-H1');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lec: Lecturer) => {
    setEditingLecturer(lec);
    setFullName(lec.fullName);
    setCode(lec.code);
    setAcademicTitle(lec.academicTitle);
    setEmail(lec.email);
    setPhone(lec.phone || '');
    setDepartmentId(lec.departmentId);
    setOfficeRoom(lec.officeRoom || 'P.402-H1');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !code) return;

    if (editingLecturer) {
      const updated: Lecturer = {
        ...editingLecturer,
        fullName,
        code,
        academicTitle,
        email,
        phone,
        departmentId,
        officeRoom
      };
      db.saveLecturer(updated);
      setToastMessage(`Đã cập nhật thông tin giảng viên ${fullName}!`);
    } else {
      const newLec: Lecturer = {
        id: `lec_${Date.now()}`,
        code,
        fullName,
        academicTitle,
        email,
        phone,
        role: 'lecturer',
        departmentId,
        officeRoom,
        createdAt: new Date().toISOString()
      };
      db.saveLecturer(newLec);
      setToastMessage(`Đã thêm thành công giảng viên ${fullName}!`);
    }

    setIsModalOpen(false);
    refresh();
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleConfirmDelete = () => {
    if (!lecturerToDelete) return;
    const name = lecturerToDelete.fullName;
    db.deleteLecturer(lecturerToDelete.id);
    setLecturerToDelete(null);
    refresh();
    setToastMessage(`Đã xóa thành công giảng viên ${name} khỏi hệ thống!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredLecturers = lecturers.filter(lec => {
    const matchesSearch = 
      lec.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lec.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lec.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'all' || lec.departmentId === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-600" />
            <span>Quản lý & Sửa đổi thông tin Giảng viên</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Điều chỉnh thông tin giảng viên, học hàm học vị, bộ môn và phòng làm việc khi có sai sót hoặc không khớp
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-semibold shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm giảng viên mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, mã giảng viên, email..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={selectedDept}
          onChange={e => setSelectedDept(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
        >
          <option value="all">Tất cả Khoa / Bộ môn</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Lecturers Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLecturers.map(lec => {
          const dept = departments.find(d => d.id === lec.departmentId);

          return (
            <div
              key={lec.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-blue-400 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-sm shrink-0">
                      {lec.fullName.split(' ').slice(-1)[0][0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {lec.academicTitle} {lec.fullName}
                      </h3>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                        Mã GV: {lec.code}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {dept?.code || 'CNTT'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{lec.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{lec.phone || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Văn phòng: {lec.officeRoom}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => handleOpenEdit(lec)}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Sửa thông tin</span>
                </button>

                <button
                  onClick={() => setLecturerToDelete(lec)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                  title="Xóa giảng viên"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / New Lecturer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>{editingLecturer ? 'Sửa thông tin Giảng viên' : 'Thêm giảng viên mới'}</span>
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Học vị</label>
                  <select
                    value={academicTitle}
                    onChange={e => setAcademicTitle(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    <option value="ThS.">ThS.</option>
                    <option value="TS.">TS.</option>
                    <option value="PGS.TS.">PGS.TS.</option>
                    <option value="GS.TS.">GS.TS.</option>
                    <option value="Thầy/Cô">Thầy/Cô</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Họ và tên</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Mã giảng viên</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="GV001"
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-500 dark:text-slate-400">Khoa / Bộ môn</label>
                    <button
                      type="button"
                      onClick={() => setIsCreateDeptModalOpen(true)}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-0.5"
                      title="Tạo Khoa / Bộ môn mới"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Thêm Khoa mới</span>
                    </button>
                  </div>
                  <select
                    value={departmentId}
                    onChange={e => setDepartmentId(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Email UTT</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@utt.edu.vn"
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0912.345.678"
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Phòng làm việc</label>
                  <input
                    type="text"
                    value={officeRoom}
                    onChange={e => setOfficeRoom(e.target.value)}
                    placeholder="P.402-H1"
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Safe for iframe) */}
      {lecturerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Xác nhận xóa Giảng viên</h3>
                <p className="text-xs text-slate-500">Thao tác này sẽ gỡ bỏ giảng viên khỏi hệ thống điểm danh</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Bạn có chắc chắn muốn xóa giảng viên <strong className="text-slate-900 dark:text-white">{lecturerToDelete.academicTitle} {lecturerToDelete.fullName}</strong> (Mã GV: <span className="font-mono font-semibold">{lecturerToDelete.code}</span>)?
            </p>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setLecturerToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-md transition-colors"
              >
                Xác nhận xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom border border-slate-800">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Create Department / Division Modal */}
      <CreateDepartmentModal
        isOpen={isCreateDeptModalOpen}
        onClose={() => setIsCreateDeptModalOpen(false)}
        onSuccess={(newDept) => {
          setDepartmentId(newDept.id);
          setToastMessage(`Đã thêm Khoa/Bộ môn mới: ${newDept.name} (${newDept.code})!`);
          setTimeout(() => setToastMessage(null), 4000);
          refresh();
        }}
      />
    </div>
  );
};
