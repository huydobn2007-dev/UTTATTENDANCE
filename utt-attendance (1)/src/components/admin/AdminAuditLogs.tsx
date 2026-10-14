import React, { useState } from 'react';
import { AuditLog } from '../../types';
import { db } from '../../services/dbService';
import { ShieldCheck, Search, Filter, Clock, User, Globe } from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>(db.getAuditLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filtered = logs.filter(l => {
    if (roleFilter !== 'all' && l.actorRole !== roleFilter) return false;
    if (searchTerm) {
      const matchAction = l.action.toLowerCase().includes(searchTerm.toLowerCase());
      const matchActor = l.actorName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDetails = l.details.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchAction && !matchActor && !matchDetails) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Nhật ký Hoạt động Hệ thống (Audit Log)
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ghi nhận toàn bộ thao tác bảo mật, đăng ký sinh trắc học, mở phiên và thay đổi điểm danh
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tìm theo hành động, người thực hiện hoặc nội dung..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none"
          />
        </div>

        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 w-full sm:w-auto"
        >
          <option value="all">Tất cả vai trò</option>
          <option value="admin">Quản trị viên</option>
          <option value="lecturer">Giảng viên</option>
          <option value="student">Sinh viên</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4 w-40 font-mono">Thời gian</th>
                <th className="py-3 px-4">Người thực hiện</th>
                <th className="py-3 px-4">Hành động</th>
                <th className="py-3 px-4">Đối tượng</th>
                <th className="py-3 px-4">Chi tiết thao tác</th>
                <th className="py-3 px-4 font-mono text-right">Địa chỉ IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(log => {
                const roleBadge =
                  log.actorRole === 'admin'
                    ? 'text-purple-600 bg-purple-50 dark:bg-purple-950/40'
                    : log.actorRole === 'lecturer'
                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                    : 'text-blue-600 bg-blue-50 dark:bg-blue-950/40';

                return (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {log.actorName}
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${roleBadge}`}>
                        {log.actorRole === 'admin' ? 'Admin' : log.actorRole === 'lecturer' ? 'Giảng viên' : 'Sinh viên'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {log.targetEntity}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-sm">
                      {log.details}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-right">
                      {log.ipAddress}
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
