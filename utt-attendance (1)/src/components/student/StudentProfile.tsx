import React, { useState } from 'react';
import { Student } from '../../types';
import { db } from '../../services/dbService';
import { 
  User, 
  ShieldCheck, 
  Camera, 
  Trash2, 
  Lock, 
  FileText, 
  CheckCircle2, 
  Mail, 
  Phone, 
  Building,
  GraduationCap
} from 'lucide-react';
import { UttLogo } from '../common/UttLogo';

interface StudentProfileProps {
  student: Student;
  onOpenRegisterModal: () => void;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({
  student,
  onOpenRegisterModal
}) => {
  const [revokedMessage, setRevokedMessage] = useState(false);

  const dept = db.getDepartments().find(d => d.id === student.departmentId);
  const cls = db.getClasses().find(c => c.id === student.classId);
  const template = db.getFaceTemplateByStudentId(student.id);

  const handleRevokeBiometrics = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa mẫu khuôn mặt sinh trắc học? Bạn sẽ cần đăng ký lại trước khi có thể điểm danh bằng camera.')) {
      db.deleteFaceTemplate(student.id);
      setRevokedMessage(true);
      setTimeout(() => setRevokedMessage(false), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Hồ sơ cá nhân & Sinh trắc học
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Quản lý tài khoản sinh viên và quyền riêng tư dữ liệu khuôn mặt theo pháp luật Việt Nam
        </p>
      </div>

      {revokedMessage && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs">
          Đã thu hồi và xóa dữ liệu Face Template thành công.
        </div>
      )}

      {/* Profile Card / Digital Student Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        {/* Card Header Strip */}
        <div className="bg-[#0c2340] px-6 py-3.5 flex items-center justify-between text-white border-b border-orange-500/40">
          <UttLogo size="sm" showText={true} invertText={true} subtitle="Thẻ Sinh Viên Điện Tử" />
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-orange-600 text-white font-bold">
            UTT STUDENT CARD
          </span>
        </div>

        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-orange-500/30 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-2xl overflow-hidden shrink-0 shadow-md">
            {student.avatarUrl ? (
              <img src={student.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              student.fullName.split(' ').slice(-1)[0][0]
            )}
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {student.fullName}
              </h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-800">
                {student.code}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                <span>Lớp: {cls?.code || '72DCHT21'} · Khóa {student.admissionYear}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#0c2340] dark:text-blue-400" />
                <span>{dept?.name || 'Khoa Công nghệ Thông tin'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{student.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{student.phone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Biometric Privacy & Security Panel */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Dữ liệu nhận dạng khuôn mặt (Biometrics)
            </h3>
          </div>

          {student.faceRegistered ? (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Đã đăng ký
            </span>
          ) : (
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              Chưa đăng ký
            </span>
          )}
        </div>

        {template ? (
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200/60 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Mã Template định danh:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{template.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Ngày đăng ký:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {new Date(template.registeredAt).toLocaleString('vi-VN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Độ tin cậy trích xuất:</span>
              <span className="font-semibold text-emerald-600">{template.qualityScore}% (Chất lượng cao)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Quyền riêng tư:</span>
              <span className="text-slate-700 dark:text-slate-300">Đã đồng ý Nghị định 13/2023/NĐ-CP</span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
            Bạn chưa đăng ký Face ID. Hãy thực hiện quét khuôn mặt để có thể tự động điểm danh bằng camera khi vào lớp.
          </div>
        )}

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Mã hóa AES-128 và không lưu ảnh mặt thô</span>
          </div>

          <div className="flex items-center gap-2">
            {student.faceRegistered && (
              <button
                onClick={handleRevokeBiometrics}
                className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/60 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Thu hồi dữ liệu khuôn mặt</span>
              </button>
            )}

            <button
              onClick={onOpenRegisterModal}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{student.faceRegistered ? 'Cập nhật lại khuôn mặt' : 'Đăng ký ngay'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
