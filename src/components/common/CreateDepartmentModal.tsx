import React, { useState } from 'react';
import { Department } from '../../types';
import { db } from '../../services/dbService';
import { Building, X, Check, Plus, AlertCircle } from 'lucide-react';

interface CreateDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newDepartment: Department) => void;
}

export const CreateDepartmentModal: React.FC<CreateDepartmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [deanName, setDeanName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();
    const trimmedDean = deanName.trim();

    if (!trimmedName || !trimmedCode) {
      setErrorMessage('Vui lòng nhập đầy đủ tên và mã viết tắt của Khoa / Bộ môn!');
      return;
    }

    // Check duplicate code
    const existing = db.getDepartments().find(
      d => d.code.toUpperCase() === trimmedCode || d.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      setErrorMessage(`Khoa hoặc mã viết tắt "${trimmedCode}" đã tồn tại trong hệ thống!`);
      return;
    }

    const cleanId = `dept_${trimmedCode.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now().toString(36)}`;
    const newDept: Department = {
      id: cleanId,
      code: trimmedCode,
      name: trimmedName,
      deanName: trimmedDean || 'Ban chủ nhiệm Khoa',
      totalStudents: 0,
      totalLecturers: 1
    };

    db.saveDepartment(newDept);
    onSuccess(newDept);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Thêm Khoa đào tạo / Bộ môn mới
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tạo mới đơn vị quản lý chuyên môn trong trường UTT
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tên Khoa / Bộ môn đào tạo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="VD: Khoa Cơ khí Giao thông, Bộ môn An toàn Mạng..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mã viết tắt <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="VD: CKGT, ATTT"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Trưởng khoa / Phụ trách
              </label>
              <input
                type="text"
                value={deanName}
                onChange={e => setDeanName(e.target.value)}
                placeholder="VD: TS. Nguyễn Văn Tuấn"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <span className="font-semibold text-slate-700 dark:text-slate-200">ℹ️ Thông tin:</span>
            <p>
              Khoa/Bộ môn mới tạo sẽ lập tức xuất hiện trong danh mục và tự động chọn cho sinh viên / giảng viên đang thêm.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Thêm Khoa / Bộ môn</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
