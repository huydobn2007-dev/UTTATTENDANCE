import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
// @ts-ignore
import mammoth from 'mammoth';
import { Student } from '../../types';
import { db } from '../../services/dbService';
import { 
  FileSpreadsheet, 
  Upload, 
  Check, 
  X, 
  AlertCircle, 
  RefreshCw,
  FileCheck,
  Building,
  GraduationCap
} from 'lucide-react';

interface ParsedStudentRow {
  code: string;
  fullName: string;
  classCode: string;
  email: string;
  phone: string;
  selected: boolean;
}

interface FileStudentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSectionId?: string; // If provided, adds to this course section
  onSuccess: (count: number) => void;
}

export const FileStudentImportModal: React.FC<FileStudentImportModalProps> = ({
  isOpen,
  onClose,
  targetSectionId,
  onSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [addToUniversity, setAddToUniversity] = useState<boolean>(true);
  const [addToSection, setAddToSection] = useState<boolean>(!!targetSectionId);
  const [batchClassOverride, setBatchClassOverride] = useState<string>('auto');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const existingClasses = db.getClasses();

  if (!isOpen) return null;

  // Extract administrative class from student code (e.g. 72DCHT21028 -> 72DCHT21)
  const extractClassFromStudentCode = (code: string): string | null => {
    const clean = code.trim().toUpperCase();
    const match = clean.match(/^([0-9]{2}[A-Z]{3,5}[0-9]{1,2})/);
    return match ? match[1] : null;
  };

  // Intelligent column detection
  const detectColumns = (headers: string[]): {
    codeIdx: number;
    nameIdx: number;
    lastNameIdx: number;
    firstNameIdx: number;
    classIdx: number;
    emailIdx: number;
    phoneIdx: number;
  } => {
    let codeIdx = -1;
    let nameIdx = -1;
    let lastNameIdx = -1;
    let firstNameIdx = -1;
    let classIdx = -1;
    let emailIdx = -1;
    let phoneIdx = -1;

    headers.forEach((h, idx) => {
      const clean = (h || '').toLowerCase().trim().replace(/[_\-\.]/g, ' ');

      // Student Code
      if (clean.includes('mã') || clean.includes('mssv') || clean.includes('masv') || clean.includes('code') || clean.includes('student id')) {
        if (codeIdx === -1) codeIdx = idx;
      }
      // Separate last and first name
      else if (clean === 'họ đệm' || clean === 'họ và tên đệm' || clean === 'họ lót' || clean === 'họ') {
        lastNameIdx = idx;
      } else if (clean === 'tên' || clean === 'tên sinh viên') {
        firstNameIdx = idx;
      }
      // Combined full name
      else if (clean.includes('họ') || clean.includes('tên') || clean.includes('name') || clean.includes('sinh viên')) {
        if (nameIdx === -1) nameIdx = idx;
      }
      // Administrative class priority
      else if (clean.includes('lớp hc') || clean.includes('lớp hành chính') || clean.includes('lớp sh') || clean.includes('lớp ql')) {
        classIdx = idx;
      } else if (classIdx === -1 && (clean.includes('lớp') || clean.includes('lop') || clean.includes('class')) && !clean.includes('học phần') && !clean.includes('lhp')) {
        classIdx = idx;
      }
      // Email
      else if (clean.includes('email') || clean.includes('mail')) {
        if (emailIdx === -1) emailIdx = idx;
      }
      // Phone
      else if (clean.includes('điện thoại') || clean.includes('sđt') || clean.includes('phone') || clean.includes('tel')) {
        if (phoneIdx === -1) phoneIdx = idx;
      }
    });

    return { codeIdx, nameIdx, lastNameIdx, firstNameIdx, classIdx, emailIdx, phoneIdx };
  };

  // Extract class name from document title or metadata rows
  const extractClassFromText = (text: string): string | null => {
    // Looks for: Lớp: 72DCHT21 or Lớp HC: 72DCHT22 or Lớp hành chính: 72DCOT21
    const match = text.match(/(?:lớp(?:\s+hành\s+chính|\s+hc|\s+quản\s+lý)?|class)[\s:]+([0-9]{2}[A-Za-z]{3,5}[0-9]{1,2})/i);
    if (match) return match[1].toUpperCase();

    // Look for isolated class code in line
    const match2 = text.match(/\b([0-9]{2}[A-Za-z]{3,5}[0-9]{1,2})\b/);
    if (match2) return match2[1].toUpperCase();

    return null;
  };

  // Heuristic token row parser if headers were not present
  const parseRowByTokens = (tokens: string[], defaultClass: string): ParsedStudentRow | null => {
    const cleanTokens = tokens.map(t => String(t || '').trim()).filter(Boolean);
    if (cleanTokens.length < 2) return null;

    let code = '';
    let fullName = '';
    let classCode = '';
    let email = '';
    let phone = '';

    for (const token of cleanTokens) {
      // Student Code pattern (e.g. 72DCHT21028 or alphanumeric 8-12 chars)
      if (!code && /[0-9]{2}[A-Za-z]{3,5}[0-9]+/i.test(token)) {
        code = token.toUpperCase();
      }
      // Class pattern (e.g. 72DCHT21)
      else if (!classCode && /^[0-9]{2}[A-Za-z]{3,5}[0-9]{1,2}$/i.test(token)) {
        classCode = token.toUpperCase();
      }
      // Email
      else if (!email && token.includes('@')) {
        email = token;
      }
      // Phone
      else if (!phone && /(0|\+84)[0-9]{8,10}/.test(token.replace(/[\.\s]/g, ''))) {
        phone = token;
      }
      // Name
      else if (!fullName && token.length > 3 && !/^[0-9]+$/.test(token) && !token.includes('@')) {
        fullName = token;
      }
    }

    if (!code && cleanTokens.length >= 2) {
      if (/^[0-9A-Za-z]{6,12}$/.test(cleanTokens[0])) {
        code = cleanTokens[0].toUpperCase();
        fullName = cleanTokens[1];
      }
    }

    if (code) {
      if (!classCode) {
        classCode = extractClassFromStudentCode(code) || defaultClass || '72DCHT21';
      }
      if (!fullName) {
        fullName = cleanTokens.find(t => t !== code && t !== classCode && !t.includes('@') && isNaN(Number(t))) || 'Sinh viên UTT';
      }

      return {
        code,
        fullName,
        classCode,
        email: email || `${code.toLowerCase()}@utt.edu.vn`,
        phone: phone || '0988.111.222',
        selected: true
      };
    }

    return null;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setFileName(uploadedFile.name);
    setIsLoading(true);
    setErrorMessage(null);

    const ext = uploadedFile.name.split('.').pop()?.toLowerCase();

    try {
      if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        const buffer = await uploadedFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rawJson || rawJson.length === 0) {
          throw new Error('Tệp Excel/CSV không có dữ liệu');
        }

        // Check document header rows (first 10 rows) for class name
        let detectedHeaderClass = '';
        for (let i = 0; i < Math.min(10, rawJson.length); i++) {
          const rowText = (rawJson[i] || []).join(' ');
          const cls = extractClassFromText(rowText);
          if (cls) {
            detectedHeaderClass = cls;
            break;
          }
        }

        // Locate real column header row
        const headerRowIdx = rawJson.findIndex(row => 
          row && row.some(cell => {
            const str = String(cell || '').toLowerCase().trim();
            return str.includes('mã sv') || str.includes('mssv') || str.includes('masv') || (str.includes('họ') && str.includes('tên')) || str.includes('stt');
          })
        );

        let rowsToProcess: any[][] = [];
        let colMap = { codeIdx: -1, nameIdx: -1, lastNameIdx: -1, firstNameIdx: -1, classIdx: -1, emailIdx: -1, phoneIdx: -1 };

        if (headerRowIdx !== -1) {
          const headerStrings = rawJson[headerRowIdx].map(c => String(c || ''));
          colMap = detectColumns(headerStrings);
          rowsToProcess = rawJson.slice(headerRowIdx + 1);
        } else {
          rowsToProcess = rawJson;
        }

        const results: ParsedStudentRow[] = [];

        for (const row of rowsToProcess) {
          if (!row || row.length === 0) continue;

          // Try structured column extraction
          if (colMap.codeIdx !== -1 && row[colMap.codeIdx]) {
            const rawCode = String(row[colMap.codeIdx]).trim().toUpperCase();
            if (!rawCode || rawCode.toLowerCase().includes('mã') || rawCode === 'CODE') continue;

            // Full name extraction (handling separated Họ đệm + Tên)
            let fullName = '';
            if (colMap.lastNameIdx !== -1 && colMap.firstNameIdx !== -1) {
              const last = String(row[colMap.lastNameIdx] || '').trim();
              const first = String(row[colMap.firstNameIdx] || '').trim();
              fullName = `${last} ${first}`.trim();
            } else if (colMap.nameIdx !== -1 && row[colMap.nameIdx]) {
              fullName = String(row[colMap.nameIdx]).trim();
            }

            // Administrative class extraction
            let classCode = '';
            if (colMap.classIdx !== -1 && row[colMap.classIdx]) {
              classCode = String(row[colMap.classIdx]).trim().toUpperCase();
            }
            if (!classCode) {
              classCode = extractClassFromStudentCode(rawCode) || detectedHeaderClass || '72DCHT21';
            }

            const email = colMap.emailIdx !== -1 && row[colMap.emailIdx] 
              ? String(row[colMap.emailIdx]).trim() 
              : `${rawCode.toLowerCase()}@utt.edu.vn`;
            const phone = colMap.phoneIdx !== -1 && row[colMap.phoneIdx] 
              ? String(row[colMap.phoneIdx]).trim() 
              : '0988.111.222';

            if (rawCode && fullName) {
              results.push({
                code: rawCode,
                fullName,
                classCode,
                email,
                phone,
                selected: true
              });
              continue;
            }
          }

          // Heuristic parse fallback for non-standard rows
          const parsed = parseRowByTokens(row.map(c => String(c || '')), detectedHeaderClass || '72DCHT21');
          if (parsed) {
            results.push(parsed);
          }
        }

        if (results.length === 0) {
          throw new Error('Không tự động lọc được bản ghi sinh viên hợp lệ từ tệp Excel. Vui lòng kiểm tra cột Mã SV và Họ tên.');
        }

        setParsedRows(results);
      } else if (ext === 'docx') {
        const buffer = await uploadedFile.arrayBuffer();
        
        // 1. Try HTML conversion to read Word <table> structure directly
        const htmlResult = await mammoth.convertToHtml({ arrayBuffer: buffer });
        const html = htmlResult.value;

        const results: ParsedStudentRow[] = [];
        let detectedHeaderClass = '';

        if (html.includes('<table')) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');

          // Look for title text before table
          const textContent = doc.body.textContent || '';
          const foundCls = extractClassFromText(textContent);
          if (foundCls) detectedHeaderClass = foundCls;

          const tables = doc.querySelectorAll('table');
          for (const table of Array.from(tables)) {
            const trs = Array.from(table.querySelectorAll('tr'));
            if (trs.length < 2) continue;

            // Detect headers in first 1-2 rows
            let headerIdx = -1;
            let colMap = { codeIdx: -1, nameIdx: -1, lastNameIdx: -1, firstNameIdx: -1, classIdx: -1, emailIdx: -1, phoneIdx: -1 };

            for (let i = 0; i < Math.min(3, trs.length); i++) {
              const cells = Array.from(trs[i].querySelectorAll('th, td')).map(c => c.textContent?.trim() || '');
              const detected = detectColumns(cells);
              if (detected.codeIdx !== -1 || (detected.nameIdx !== -1 || detected.lastNameIdx !== -1)) {
                colMap = detected;
                headerIdx = i;
                break;
              }
            }

            const dataRows = headerIdx !== -1 ? trs.slice(headerIdx + 1) : trs;

            for (const tr of dataRows) {
              const cells = Array.from(tr.querySelectorAll('td, th')).map(c => c.textContent?.trim() || '');
              if (cells.length < 2) continue;

              if (colMap.codeIdx !== -1 && cells[colMap.codeIdx]) {
                const code = cells[colMap.codeIdx].toUpperCase();
                let fullName = '';
                if (colMap.lastNameIdx !== -1 && colMap.firstNameIdx !== -1) {
                  fullName = `${cells[colMap.lastNameIdx] || ''} ${cells[colMap.firstNameIdx] || ''}`.trim();
                } else if (colMap.nameIdx !== -1) {
                  fullName = cells[colMap.nameIdx] || '';
                }

                let classCode = colMap.classIdx !== -1 && cells[colMap.classIdx] ? cells[colMap.classIdx].toUpperCase() : '';
                if (!classCode) {
                  classCode = extractClassFromStudentCode(code) || detectedHeaderClass || '72DCHT21';
                }

                if (code && fullName && !code.includes('MÃ')) {
                  results.push({
                    code,
                    fullName,
                    classCode,
                    email: `${code.toLowerCase()}@utt.edu.vn`,
                    phone: '0988.111.222',
                    selected: true
                  });
                  continue;
                }
              }

              // Heuristic
              const parsed = parseRowByTokens(cells, detectedHeaderClass || '72DCHT21');
              if (parsed) results.push(parsed);
            }
          }
        }

        // 2. If no table parsed from HTML, fall back to raw text extraction
        if (results.length === 0) {
          const docResult = await mammoth.extractRawText({ arrayBuffer: buffer });
          const text = docResult.value;
          const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);

          const foundCls = extractClassFromText(text);
          if (foundCls) detectedHeaderClass = foundCls;

          for (const line of lines) {
            const tokens = line.split(/[\t,;]+|\s{2,}/).map(t => t.trim());
            const parsed = parseRowByTokens(tokens, detectedHeaderClass || '72DCHT21');
            if (parsed) results.push(parsed);
          }
        }

        if (results.length === 0) {
          throw new Error('Không lọc được sinh viên nào từ tệp Word. Vui lòng đảm bảo tệp chứa bảng biểu có Mã SV và Họ tên.');
        }

        setParsedRows(results);
      } else if (ext === 'txt') {
        const text = await uploadedFile.text();
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const results: ParsedStudentRow[] = [];
        const detectedHeaderClass = extractClassFromText(text) || '72DCHT21';

        for (const line of lines) {
          const tokens = line.split(/[\t,;]+|\s{2,}/).map(t => t.trim());
          const parsed = parseRowByTokens(tokens, detectedHeaderClass);
          if (parsed) results.push(parsed);
        }

        if (results.length === 0) {
          throw new Error('Tệp văn bản không có cấu trúc sinh viên hợp lệ');
        }
        setParsedRows(results);
      } else {
        throw new Error('Định dạng tệp không được hỗ trợ. Vui lòng chọn tệp .xlsx, .xls, .docx hoặc .csv');
      }
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMessage(e.message || 'Lỗi khi đọc tệp');
      setParsedRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyBatchClass = (clsCode: string) => {
    setBatchClassOverride(clsCode);
    if (clsCode === 'auto') return;

    setParsedRows(prev => prev.map(r => ({
      ...r,
      classCode: clsCode
    })));
  };

  const handleConfirmImport = () => {
    const selectedStudents = parsedRows.filter(r => r.selected);
    if (selectedStudents.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất 1 sinh viên để nhập');
      return;
    }

    const currentStudents = db.getStudents();
    const studentsToSave: Student[] = [];
    const studentIdsForSection: string[] = [];

    for (const row of selectedStudents) {
      // Find or create class in database so it is guaranteed to exist and link correctly
      const administrativeClass = db.findOrCreateClass(row.classCode);
      const existing = currentStudents.find(s => s.code.toLowerCase().trim() === row.code.toLowerCase().trim());

      if (existing) {
        const updated: Student = {
          ...existing,
          fullName: row.fullName || existing.fullName,
          phone: row.phone || existing.phone,
          email: row.email || existing.email,
          classId: administrativeClass.id,
          departmentId: administrativeClass.departmentId
        };
        studentsToSave.push(updated);
        studentIdsForSection.push(updated.id);
      } else {
        const newSt: Student = {
          id: `student_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
          code: row.code,
          fullName: row.fullName,
          email: row.email || `${row.code.toLowerCase()}@utt.edu.vn`,
          phone: row.phone || '0988.111.222',
          role: 'student',
          classId: administrativeClass.id,
          departmentId: administrativeClass.departmentId,
          admissionYear: 2021,
          faceRegistered: false,
          createdAt: new Date().toISOString()
        };
        studentsToSave.push(newSt);
        studentIdsForSection.push(newSt.id);
      }
    }

    // 1. Save to university database
    if (addToUniversity) {
      db.bulkSaveStudents(studentsToSave);
    }

    // 2. Add to active course section if requested
    if (addToSection && targetSectionId) {
      for (const id of studentIdsForSection) {
        db.addStudentToSection(targetSectionId, id);
      }
    }

    onSuccess(selectedStudents.length);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Nhập Danh Sách Sinh Viên Tự Động từ Word / Excel</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hỗ trợ tệp <strong>.xlsx, .xls, .docx, .csv</strong>. Tự động nhận diện chính xác Họ tên, Mã SV và Lớp HC
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Zone */}
        <div className="py-3 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls,.docx,.doc,.csv,.txt"
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl p-5 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 transition-all group"
          >
            <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5" />
            </div>

            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {fileName ? fileName : 'Bấm vào đây để chọn tệp Word (.docx) hoặc Excel (.xlsx)'}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Hệ thống tự động phát hiện cột Họ tên (ghép họ đệm + tên), trích xuất mã sinh viên và lớp hành chính
            </p>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span>Đang giải mã bảng dữ liệu và tự động lọc danh sách sinh viên...</span>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 mb-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Parsed Preview Table & Class Options */}
        {parsedRows.length > 0 && !isLoading && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Quick Batch Class Selector */}
            <div className="mb-2 p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                <Building className="w-4 h-4 text-blue-600" />
                <span>Lớp Hành chính áp dụng:</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={batchClassOverride}
                  onChange={e => handleApplyBatchClass(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                >
                  <option value="auto">Tự động nhận diện theo từng dòng (Khuyên dùng)</option>
                  {existingClasses.map(c => (
                    <option key={c.id} value={c.code}>
                      Áp dụng chung: {c.code} ({c.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between py-1.5 text-xs">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Đã tự động trích lọc ({parsedRows.length} sinh viên)</span>
              </span>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setParsedRows(prev => prev.map(r => ({ ...r, selected: true })))}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Chọn tất cả
                </button>
                <span className="text-slate-300">·</span>
                <button
                  onClick={() => setParsedRows(prev => prev.map(r => ({ ...r, selected: false })))}
                  className="text-slate-500 hover:underline"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 font-semibold z-10">
                  <tr>
                    <th className="p-2.5 w-10 text-center">Chọn</th>
                    <th className="p-2.5 w-12 text-center font-mono">STT</th>
                    <th className="p-2.5 w-32 font-mono">Mã SV</th>
                    <th className="p-2.5">Họ và tên</th>
                    <th className="p-2.5 w-32 font-mono">Lớp HC</th>
                    <th className="p-2.5">Email</th>
                    <th className="p-2.5 w-28">Số điện thoại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {parsedRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={row.selected ? 'bg-blue-50/40 dark:bg-blue-950/20' : 'opacity-60'}
                    >
                      <td className="p-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={row.selected}
                          onChange={e => {
                            const val = e.target.checked;
                            setParsedRows(prev => prev.map((r, i) => i === idx ? { ...r, selected: val } : r));
                          }}
                          className="rounded text-blue-600 cursor-pointer"
                        />
                      </td>
                      <td className="p-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-slate-100">{row.code}</td>
                      <td className="p-2.5 font-semibold text-slate-900 dark:text-white">{row.fullName}</td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={row.classCode}
                          onChange={e => {
                            const val = e.target.value.toUpperCase();
                            setParsedRows(prev => prev.map((r, i) => i === idx ? { ...r, classCode: val } : r));
                          }}
                          className="w-full px-2 py-1 text-xs font-mono font-semibold rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400"
                        />
                      </td>
                      <td className="p-2.5 text-slate-500 font-mono">{row.email}</td>
                      <td className="p-2.5 text-slate-500 font-mono">{row.phone || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Destination Options */}
            <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={addToUniversity}
                    onChange={e => setAddToUniversity(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Lưu vào CSDL Sinh viên toàn trường UTT</span>
                </label>

                {targetSectionId && (
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-blue-600 dark:text-blue-400">
                    <input
                      type="checkbox"
                      checked={addToSection}
                      onChange={e => setAddToSection(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Thêm ngay vào Lớp học phần</span>
                  </label>
                )}
              </div>

              <div className="font-mono text-xs text-slate-500">
                Đã chọn: <strong>{parsedRows.filter(r => r.selected).length}</strong> / {parsedRows.length} SV
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={parsedRows.filter(r => r.selected).length === 0}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Xác nhận nạp vào hệ thống</span>
          </button>
        </div>
      </div>
    </div>
  );
};
