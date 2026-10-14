import {
  Department,
  AdministrativeClass,
  Course,
  CourseSection,
  Room,
  Schedule,
  Lecturer,
  Student,
  User,
  AttendanceSession,
  AttendanceRecord,
  FaceTemplate,
  NotificationItem,
  AttendanceRequest,
  AuditLog,
  SystemSettings,
  Campus
} from '../types';

export const initialCampuses: Campus[] = [
  {
    id: 'campus_pt',
    code: 'TS-PT',
    name: 'Trụ sở chính Phú Thọ',
    address: '278 Lam Sơn, Vĩnh Yên, Phú Thọ',
    type: 'headquarter',
    isHeadquarter: true,
    latitude: 21.4167,
    longitude: 105.2167,
    phone: '0210.384.6293',
    email: 'dhcngtvt@utt.edu.vn'
  },
  {
    id: 'campus_hn',
    code: 'PH-HN',
    name: 'Phân hiệu Hà Nội',
    address: '54 Triều Khúc, Thanh Liệt, TP Hà Nội',
    type: 'branch',
    isHeadquarter: false,
    latitude: 20.9852,
    longitude: 105.7984,
    phone: '024.3854.4264',
    email: 'dhcngtvt@utt.edu.vn'
  },
  {
    id: 'campus_tn',
    code: 'CS-TN',
    name: 'Trung tâm đào tạo Thái Nguyên',
    address: '999 Phú Thái, Phan Đình Phùng, Thái Nguyên',
    type: 'training_center',
    isHeadquarter: false,
    latitude: 21.5928,
    longitude: 105.8442,
    phone: '0208.385.5564',
    email: 'ttdttainguyen@utt.edu.vn'
  }
];

export const initialAdmin: User = {
  id: 'admin_1',
  code: 'AD001',
  fullName: 'ThS. Nguyễn Quốc Tuấn',
  email: 'admin@utt.edu.vn',
  role: 'admin',
  phone: '0912.345.678',
  departmentId: 'dept_it',
  createdAt: '2024-01-15T08:00:00Z',
  avatarUrl: '/src/assets/images/avatar_student_utt_1791203537106.jpg'
};

export const initialDepartments: Department[] = [
  {
    id: 'dept_it',
    code: 'CNTT',
    name: 'Khoa Công nghệ Thông tin',
    deanName: 'PGS.TS. Trần Quốc Hùng',
    totalStudents: 1450,
    totalLecturers: 48
  },
  {
    id: 'dept_ce',
    code: 'CT',
    name: 'Khoa Công trình',
    deanName: 'TS. Nguyễn Văn Tuấn',
    totalStudents: 1120,
    totalLecturers: 36
  },
  {
    id: 'dept_te',
    code: 'KTVT',
    name: 'Khoa Kinh tế Vận tải',
    deanName: 'PGS.TS. Lê Thu Hương',
    totalStudents: 980,
    totalLecturers: 32
  }
];

export const initialLecturers: Lecturer[] = [
  {
    id: 'lec_1',
    code: 'GV001',
    fullName: 'TS. Trần Văn Minh',
    email: 'minhtv@utt.edu.vn',
    role: 'lecturer',
    academicTitle: 'TS. Giảng viên chính',
    phone: '0983.112.233',
    departmentId: 'dept_it',
    officeRoom: 'P308-A1',
    createdAt: '2023-08-01T08:00:00Z'
  },
  {
    id: 'lec_2',
    code: 'GV002',
    fullName: 'ThS. Lê Thị Thu Hà',
    email: 'halt@utt.edu.vn',
    role: 'lecturer',
    academicTitle: 'ThS. Giảng viên',
    phone: '0977.223.344',
    departmentId: 'dept_it',
    officeRoom: 'P308-A1',
    createdAt: '2023-09-01T08:00:00Z'
  },
  {
    id: 'lec_3',
    code: 'GV003',
    fullName: 'PGS.TS. Hoàng Minh Đức',
    email: 'duchm@utt.edu.vn',
    role: 'lecturer',
    academicTitle: 'PGS.TS. Trưởng bộ môn',
    phone: '0904.334.455',
    departmentId: 'dept_ce',
    officeRoom: 'P202-A2',
    createdAt: '2022-05-15T08:00:00Z'
  },
  {
    id: 'lec_4',
    code: 'GV004',
    fullName: 'ThS. Phạm Quang Huy',
    email: 'huypt@utt.edu.vn',
    role: 'lecturer',
    academicTitle: 'ThS. Giảng viên',
    phone: '0915.445.566',
    departmentId: 'dept_te',
    officeRoom: 'P105-H1',
    createdAt: '2023-11-20T08:00:00Z'
  },
  {
    id: 'lec_5',
    code: 'GV005',
    fullName: 'TS. Đỗ Bích Ngọc',
    email: 'ngocdb@utt.edu.vn',
    role: 'lecturer',
    academicTitle: 'TS. Giảng viên',
    phone: '0966.556.677',
    departmentId: 'dept_it',
    officeRoom: 'P306-A1',
    createdAt: '2024-02-10T08:00:00Z'
  }
];

export const initialClasses: AdministrativeClass[] = [
  {
    id: 'class_72dcht21',
    code: '72DCHT21',
    name: 'Đại học Công nghệ Thông tin K72 - Lớp 1',
    departmentId: 'dept_it',
    academicYear: '2021-2025',
    studentCount: 15,
    advisorLecturerId: 'lec_1'
  },
  {
    id: 'class_72dcht22',
    code: '72DCHT22',
    name: 'Đại học Công nghệ Thông tin K72 - Lớp 2',
    departmentId: 'dept_it',
    academicYear: '2021-2025',
    studentCount: 12,
    advisorLecturerId: 'lec_2'
  },
  {
    id: 'class_72dcot21',
    code: '72DCOT21',
    name: 'Đại học Công trình Giao thông K72 - Lớp 1',
    departmentId: 'dept_ce',
    academicYear: '2021-2025',
    studentCount: 10,
    advisorLecturerId: 'lec_3'
  },
  {
    id: 'class_72dckt21',
    code: '72DCKT21',
    name: 'Đại học Kinh tế Vận tải K72 - Lớp 1',
    departmentId: 'dept_te',
    academicYear: '2021-2025',
    studentCount: 8,
    advisorLecturerId: 'lec_4'
  },
  {
    id: 'class_72dccb21',
    code: '72DCCB21',
    name: 'Đại học Cầu đường & Cảng K72',
    departmentId: 'dept_ce',
    academicYear: '2021-2025',
    studentCount: 5,
    advisorLecturerId: 'lec_3'
  }
];

export const initialRooms: Room[] = [
  { id: 'room_p301_a1', code: 'P301-A1', building: 'Tòa nhà A1', capacity: 60, latitude: 20.98522, longitude: 105.79845, radiusMeters: 60 },
  { id: 'room_p302_a1', code: 'P302-A1', building: 'Tòa nhà A1', capacity: 60, latitude: 20.98525, longitude: 105.79848, radiusMeters: 60 },
  { id: 'room_p402_a2', code: 'P402-A2', building: 'Tòa nhà A2', capacity: 75, latitude: 20.98540, longitude: 105.79880, radiusMeters: 70 },
  { id: 'room_lab501_h1', code: 'Lab 501-H1', building: 'Tòa thực hành H1', capacity: 45, latitude: 20.98490, longitude: 105.79790, radiusMeters: 50 },
  { id: 'room_lab502_h1', code: 'Lab 502-H1', building: 'Tòa thực hành H1', capacity: 45, latitude: 20.98492, longitude: 105.79792, radiusMeters: 50 },
  { id: 'room_p201_h2', code: 'P201-H2', building: 'Tòa nhà H2', capacity: 80, latitude: 20.98460, longitude: 105.79810, radiusMeters: 65 },
  { id: 'room_p205_h2', code: 'P205-H2', building: 'Tòa nhà H2', capacity: 80, latitude: 20.98465, longitude: 105.79815, radiusMeters: 65 },
  { id: 'room_p101_b1', code: 'P101-B1', building: 'Tòa nhà B1', capacity: 50, latitude: 20.98580, longitude: 105.79900, radiusMeters: 60 },
  { id: 'room_p102_b1', code: 'P102-B1', building: 'Tòa nhà B1', capacity: 50, latitude: 20.98585, longitude: 105.79905, radiusMeters: 60 },
  { id: 'room_hoi_truong_a1', code: 'Hội trường A1', building: 'Tòa nhà A1', capacity: 250, latitude: 20.98530, longitude: 105.79830, radiusMeters: 100 }
];

export const initialCourses: Course[] = [
  { id: 'course_it302', code: 'IT302', name: 'Lập trình Web Nâng Cao', credits: 3, departmentId: 'dept_it' },
  { id: 'course_it201', code: 'IT201', name: 'Cấu trúc Dữ liệu & Giải thuật', credits: 4, departmentId: 'dept_it' },
  { id: 'course_it405', code: 'IT405', name: 'Trí tuệ Nhân tạo & Thị giác Máy tính', credits: 3, departmentId: 'dept_it' },
  { id: 'course_it311', code: 'IT311', name: 'Mạng Máy tính & Viễn thông', credits: 3, departmentId: 'dept_it' },
  { id: 'course_it320', code: 'IT320', name: 'Cơ sở Dữ liệu Phân tán', credits: 3, departmentId: 'dept_it' },
  { id: 'course_ce204', code: 'CE204', name: 'Cơ học Kết cấu Công trình', credits: 3, departmentId: 'dept_ce' },
  { id: 'course_ce310', code: 'CE310', name: 'Thiết kế Cầu Đường Bộ', credits: 4, departmentId: 'dept_ce' },
  { id: 'course_te102', code: 'TE102', name: 'Kinh tế Vận tải Đại cương', credits: 3, departmentId: 'dept_te' },
  { id: 'course_te305', code: 'TE305', name: 'Quản trị Chuỗi Cung ứng & Logistics', credits: 3, departmentId: 'dept_te' },
  { id: 'course_it490', code: 'IT490', name: 'Đồ án Chuyên ngành CNTT', credits: 3, departmentId: 'dept_it' }
];

// Helper to generate 50 realistic Vietnamese students
const vietnameseNames = [
  { last: 'Nguyễn', middle: 'Văn', first: 'An', gender: 'm' },
  { last: 'Trần', middle: 'Thị', first: 'Bích', gender: 'f' },
  { last: 'Lê', middle: 'Hoàng', first: 'Cường', gender: 'm' },
  { last: 'Phạm', middle: 'Đức', first: 'Dũng', gender: 'm' },
  { last: 'Hoàng', middle: 'Thị', first: 'Duyên', gender: 'f' },
  { last: 'Vũ', middle: 'Minh', first: 'Hải', gender: 'm' },
  { last: 'Đặng', middle: 'Thanh', first: 'Hằng', gender: 'f' },
  { last: 'Bùi', middle: 'Quốc', first: 'Huy', gender: 'm' },
  { last: 'Đỗ', middle: 'Gia', first: 'Huy', gender: 'm' }, // Main Demo Student
  { last: 'Hồ', middle: 'Xuân', first: 'Khánh', gender: 'm' },
  { last: 'Ngô', middle: 'Bảo', first: 'Lâm', gender: 'm' },
  { last: 'Dương', middle: 'Thị', first: 'Linh', gender: 'f' },
  { last: 'Lý', middle: 'Văn', first: 'Long', gender: 'm' },
  { last: 'Mai', middle: 'Phương', first: 'Nga', gender: 'f' },
  { last: 'Trịnh', middle: 'Quang', first: 'Nam', gender: 'm' },
  { last: 'Đinh', middle: 'Thị', first: 'Như', gender: 'f' },
  { last: 'Lâm', middle: 'Hữu', first: 'Phúc', gender: 'm' },
  { last: 'Phan', middle: 'Thái', first: 'Quân', gender: 'm' },
  { last: 'Võ', middle: 'Hồng', first: 'Sơn', gender: 'm' },
  { last: 'Đoàn', middle: 'Ngọc', first: 'Thảo', gender: 'f' },
  { last: 'Lương', middle: 'Văn', first: 'Thắng', gender: 'm' },
  { last: 'Tô', middle: 'Đình', first: 'Tiến', gender: 'm' },
  { last: 'Cao', middle: 'Thị', first: 'Trang', gender: 'f' },
  { last: 'Hà', middle: 'Việt', first: 'Trung', gender: 'm' },
  { last: 'Chu', middle: 'Tuấn', first: 'Tú', gender: 'm' },
  { last: 'Tạ', middle: 'Quỳnh', first: 'Uyên', gender: 'f' },
  { last: 'Nghiêm', middle: 'Đức', first: 'Vinh', gender: 'm' },
  { last: 'Thái', middle: 'Hải', first: 'Yến', gender: 'f' },
  { last: 'Nguyễn', middle: 'Hải', first: 'Đăng', gender: 'm' },
  { last: 'Trần', middle: 'Quốc', first: 'Bảo', gender: 'm' },
  { last: 'Lê', middle: 'Thu', first: 'Cúc', gender: 'f' },
  { last: 'Phạm', middle: 'Minh', first: 'Hiếu', gender: 'm' },
  { last: 'Hoàng', middle: 'Đức', first: 'Kiên', gender: 'm' },
  { last: 'Vũ', middle: 'Mỹ', first: 'Lệ', gender: 'f' },
  { last: 'Đặng', middle: 'Xuân', first: 'Mai', gender: 'f' },
  { last: 'Bùi', middle: 'Đình', first: 'Nghĩa', gender: 'm' },
  { last: 'Đỗ', middle: 'Thị', first: 'Oanh', gender: 'f' },
  { last: 'Hồ', middle: 'Chí', first: 'Phong', gender: 'm' },
  { last: 'Ngô', middle: 'Văn', first: 'Quyết', gender: 'm' },
  { last: 'Dương', middle: 'Công', first: 'Thành', gender: 'm' },
  { last: 'Lý', middle: 'Thị', first: 'Tuyết', gender: 'f' },
  { last: 'Mai', middle: 'Đức', first: 'Vũ', gender: 'm' },
  { last: 'Trịnh', middle: 'Thị', first: 'Xuân', gender: 'f' },
  { last: 'Đinh', middle: 'Trọng', first: 'Hòa', gender: 'm' },
  { last: 'Lâm', middle: 'Thành', first: 'Công', gender: 'm' },
  { last: 'Phan', middle: 'Bảo', first: 'Châu', gender: 'f' },
  { last: 'Võ', middle: 'Thị', first: 'Hà', gender: 'f' },
  { last: 'Đoàn', middle: 'Văn', first: 'Khải', gender: 'm' },
  { last: 'Lương', middle: 'Gia', first: 'Bách', gender: 'm' },
  { last: 'Tô', middle: 'Minh', first: 'Triết', gender: 'm' }
];

export const initialStudents: Student[] = vietnameseNames.map((nameObj, idx) => {
  const codeNum = (idx + 1).toString().padStart(3, '0');
  const studentCode = `72DCHT21${codeNum}`;
  const studentId = `student_${idx + 1}`;
  
  // Distribute across classes and departments
  let classId = 'class_72dcht21';
  let deptId = 'dept_it';
  if (idx >= 15 && idx < 27) {
    classId = 'class_72dcht22';
    deptId = 'dept_it';
  } else if (idx >= 27 && idx < 37) {
    classId = 'class_72dcot21';
    deptId = 'dept_ce';
  } else if (idx >= 37 && idx < 45) {
    classId = 'class_72dckt21';
    deptId = 'dept_te';
  } else if (idx >= 45) {
    classId = 'class_72dccb21';
    deptId = 'dept_ce';
  }

  // 90% have face registered
  const isFaceRegistered = idx < 45;
  const isMainDemo = idx === 8; // Đỗ Gia Huy
  
  return {
    id: isMainDemo ? 'student_demo' : studentId,
    code: isMainDemo ? '72DCHT21028' : studentCode,
    fullName: `${nameObj.last} ${nameObj.middle} ${nameObj.first}`,
    email: `${nameObj.first.toLowerCase()}.${nameObj.last.toLowerCase()}${codeNum}@utt.edu.vn`,
    role: 'student',
    classId,
    departmentId: deptId,
    admissionYear: 2021,
    faceRegistered: isFaceRegistered,
    faceRegisteredAt: isFaceRegistered ? '2024-09-05T09:12:00Z' : undefined,
    faceTemplateId: isFaceRegistered ? `tmpl_${studentId}` : undefined,
    phone: `098${idx.toString().padStart(2, '0')}.456.789`,
    createdAt: '2024-09-01T08:00:00Z',
    avatarUrl: isMainDemo ? '/src/assets/images/avatar_student_utt_1791203537106.jpg' : undefined
  };
});

// Deterministic 128-d mock embedding vector generator with high orthogonality across identities
export const generateDeterministicEmbedding = (seed: string): number[] => {
  const vector: number[] = [];
  // Hash seed string to get 32-bit state
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }

  // Linear Congruential Generator for reproducible, orthogonal pseudo-random vectors
  let state = (h >>> 0);
  for (let i = 0; i < 128; i++) {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    const randNorm = (state / 4294967296) * 2 - 1;
    // Add positional harmonic term modulated by unique seed value
    const harmonic = Math.sin((seed.charCodeAt(i % seed.length) || 42) * (i + 1) * 0.43);
    vector.push(randNorm * 0.7 + harmonic * 0.3);
  }

  // Mean center
  const mean = vector.reduce((a, b) => a + b, 0) / 128;
  const centered = vector.map(v => v - mean);

  // L2-Hys normalization
  let sumSq = 0;
  for (let i = 0; i < 128; i++) {
    sumSq += centered[i] * centered[i];
  }
  const norm = Math.sqrt(sumSq) || 1;
  const clipped = centered.map(v => Math.max(-0.18, Math.min(0.18, v / norm)));
  let sumSqClipped = 0;
  for (let i = 0; i < 128; i++) {
    sumSqClipped += clipped[i] * clipped[i];
  }
  const normClipped = Math.sqrt(sumSqClipped) || 1;
  return clipped.map(v => Number((v / normClipped).toFixed(6)));
};

export const initialFaceTemplates: FaceTemplate[] = initialStudents
  .filter(s => s.faceRegistered)
  .map(s => ({
    id: `tmpl_${s.id}`,
    studentId: s.id,
    embedding: generateDeterministicEmbedding(s.id),
    registeredAt: s.faceRegisteredAt || '2024-09-05T09:12:00Z',
    qualityScore: 94,
    hashAlgorithm: 'SHA256-AES128-EMBEDDING-SECURE',
    consentAgreed: true,
    consentAgreedAt: s.faceRegisteredAt || '2024-09-05T09:10:00Z'
  }));

// Course Sections
export const initialCourseSections: CourseSection[] = [
  {
    id: 'sec_web_01',
    code: '72DCHT21-IT302-01',
    courseId: 'course_it302',
    lecturerId: 'lec_1', // TS. Trần Văn Minh
    semester: 'HK1',
    academicYear: '2025-2026',
    totalSessions: 15,
    enrolledStudentIds: initialStudents.slice(0, 20).map(s => s.id) // Includes demo student
  },
  {
    id: 'sec_ai_01',
    code: '72DCHT21-IT405-01',
    courseId: 'course_it405',
    lecturerId: 'lec_2', // ThS. Lê Thị Thu Hà
    semester: 'HK1',
    academicYear: '2025-2026',
    totalSessions: 15,
    enrolledStudentIds: initialStudents.slice(0, 18).map(s => s.id)
  },
  {
    id: 'sec_algo_01',
    code: '72DCHT22-IT201-01',
    courseId: 'course_it201',
    lecturerId: 'lec_5', // TS. Đỗ Bích Ngọc
    semester: 'HK1',
    academicYear: '2025-2026',
    totalSessions: 15,
    enrolledStudentIds: initialStudents.slice(15, 30).map(s => s.id)
  },
  {
    id: 'sec_bridge_01',
    code: '72DCOT21-CE310-01',
    courseId: 'course_ce310',
    lecturerId: 'lec_3', // PGS.TS. Hoàng Minh Đức
    semester: 'HK1',
    academicYear: '2025-2026',
    totalSessions: 15,
    enrolledStudentIds: initialStudents.slice(27, 40).map(s => s.id)
  },
  {
    id: 'sec_logistics_01',
    code: '72DCKT21-TE305-01',
    courseId: 'course_te305',
    lecturerId: 'lec_4', // ThS. Phạm Quang Huy
    semester: 'HK1',
    academicYear: '2025-2026',
    totalSessions: 15,
    enrolledStudentIds: initialStudents.slice(37, 50).map(s => s.id)
  }
];

export const initialSchedules: Schedule[] = [
  { id: 'sch_1', courseSectionId: 'sec_web_01', roomId: 'room_lab501_h1', dayOfWeek: 2, startTime: '07:00', endTime: '09:25' },
  { id: 'sch_2', courseSectionId: 'sec_ai_01', roomId: 'room_p301_a1', dayOfWeek: 3, startTime: '09:35', endTime: '12:00' },
  { id: 'sch_3', courseSectionId: 'sec_algo_01', roomId: 'room_lab502_h1', dayOfWeek: 4, startTime: '13:00', endTime: '15:25' },
  { id: 'sch_4', courseSectionId: 'sec_bridge_01', roomId: 'room_p205_h2', dayOfWeek: 5, startTime: '07:00', endTime: '10:25' },
  { id: 'sch_5', courseSectionId: 'sec_logistics_01', roomId: 'room_p102_b1', dayOfWeek: 6, startTime: '09:35', endTime: '12:00' }
];

const todayStr = new Date().toISOString().split('T')[0];

export const initialAttendanceSessions: AttendanceSession[] = [
  {
    id: 'session_active_now',
    sessionCode: `SES-${todayStr.replace(/-/g, '')}-IT302`,
    courseSectionId: 'sec_web_01',
    lecturerId: 'lec_1',
    roomId: 'room_lab501_h1',
    date: todayStr,
    startTime: '07:00',
    endTime: '11:30', // Currently active!
    earlyCheckinMinutes: 15,
    lateCutoffTime: '07:15',
    requireLiveness: true,
    requireGeofence: true,
    authMethod: 'face',
    status: 'active',
    createdAt: `${todayStr}T06:45:00Z`
  },
  {
    id: 'session_prev_1',
    sessionCode: `SES-20260928-IT302`,
    courseSectionId: 'sec_web_01',
    lecturerId: 'lec_1',
    roomId: 'room_lab501_h1',
    date: '2026-09-28',
    startTime: '07:00',
    endTime: '09:25',
    earlyCheckinMinutes: 15,
    lateCutoffTime: '07:15',
    requireLiveness: true,
    requireGeofence: true,
    authMethod: 'face',
    status: 'closed',
    createdAt: '2026-09-28T06:45:00Z'
  },
  {
    id: 'session_prev_2',
    sessionCode: `SES-20260921-IT302`,
    courseSectionId: 'sec_web_01',
    lecturerId: 'lec_1',
    roomId: 'room_lab501_h1',
    date: '2026-09-21',
    startTime: '07:00',
    endTime: '09:25',
    earlyCheckinMinutes: 15,
    lateCutoffTime: '07:15',
    requireLiveness: true,
    requireGeofence: false,
    authMethod: 'face',
    status: 'closed',
    createdAt: '2026-09-21T06:45:00Z'
  }
];

// Pre-filled attendance records
export const initialAttendanceRecords: AttendanceRecord[] = [
  // Session previous 1
  {
    id: 'rec_prev1_demo',
    sessionId: 'session_prev_1',
    studentId: 'student_demo',
    checkInTime: '2026-09-28T07:04:12Z',
    status: 'present',
    verificationMethod: 'face',
    confidenceScore: 97,
    livenessPassed: true,
    geofencePassed: true,
    deviceInfo: 'Safari iOS 18 / iPhone 15 Pro',
    ipAddress: '14.161.42.108'
  },
  {
    id: 'rec_prev1_s1',
    sessionId: 'session_prev_1',
    studentId: 'student_1',
    checkInTime: '2026-09-28T07:02:18Z',
    status: 'present',
    verificationMethod: 'face',
    confidenceScore: 95,
    livenessPassed: true,
    geofencePassed: true
  },
  {
    id: 'rec_prev1_s2',
    sessionId: 'session_prev_1',
    studentId: 'student_2',
    checkInTime: '2026-09-28T07:18:45Z',
    status: 'late',
    verificationMethod: 'face',
    confidenceScore: 92,
    livenessPassed: true,
    geofencePassed: true,
    note: 'Đi muộn 3 phút so với mốc'
  },
  {
    id: 'rec_prev1_s3',
    sessionId: 'session_prev_1',
    studentId: 'student_3',
    status: 'absent',
    verificationMethod: 'manual',
    livenessPassed: false,
    note: 'Vắng không phép'
  },
  // Session active today - some already checked in to demonstrate live monitor
  {
    id: 'rec_active_s1',
    sessionId: 'session_active_now',
    studentId: 'student_1',
    checkInTime: `${todayStr}T07:03:22Z`,
    status: 'present',
    verificationMethod: 'face',
    confidenceScore: 96,
    livenessPassed: true,
    geofencePassed: true,
    deviceInfo: 'Chrome 129 / Windows 11',
    ipAddress: '118.70.182.50'
  },
  {
    id: 'rec_active_s2',
    sessionId: 'session_active_now',
    studentId: 'student_2',
    checkInTime: `${todayStr}T07:18:10Z`,
    status: 'late',
    verificationMethod: 'face',
    confidenceScore: 91,
    livenessPassed: true,
    geofencePassed: true,
    deviceInfo: 'Mobile Safari / iPhone 14',
    ipAddress: '118.70.182.51',
    note: 'Check-in sau mốc 07:15'
  }
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif_1',
    userId: 'student_demo',
    title: 'Buổi học sắp bắt đầu',
    message: 'Học phần Lập trình Web Nâng Cao đang diễn ra tại Lab 501-H1. Phiên điểm danh đang mở!',
    type: 'upcoming_class',
    read: false,
    createdAt: `${todayStr}T06:50:00Z`
  },
  {
    id: 'notif_2',
    userId: 'student_demo',
    title: 'Điểm danh thành công',
    message: 'Bạn đã điểm danh thành công môn Lập trình Web ngày 28/09 lúc 07:04 (Có mặt).',
    type: 'attendance_success',
    read: true,
    createdAt: '2026-09-28T07:04:15Z'
  },
  {
    id: 'notif_3',
    userId: 'student_demo',
    title: 'Hồ sơ khuôn mặt an toàn',
    message: 'Face Template của bạn đã được mã hóa bảo mật theo tiêu chuẩn trường ĐH Giao thông Vận tải.',
    type: 'attendance_success',
    read: true,
    createdAt: '2026-09-05T09:15:00Z'
  }
];

export const initialRequests: AttendanceRequest[] = [
  {
    id: 'req_1',
    studentId: 'student_3',
    sessionId: 'session_prev_1',
    reason: 'Em bị hỏng xe trên đường đến trường, em đã xin phép thầy qua Zalo trước 7h.',
    requestedStatus: 'excused',
    evidenceDescription: 'Biên lai sửa xe tại phố Triều Khúc lúc 07:10',
    status: 'pending',
    submittedAt: '2026-09-28T09:30:00Z'
  }
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'log_1',
    actorId: 'admin_1',
    actorName: 'Nguyễn Quốc Tuấn',
    actorRole: 'admin',
    action: 'CẬP NHẬT THIẾT LẬP',
    targetEntity: 'SystemSettings',
    details: 'Điều chỉnh ngưỡng Face Similarity tối thiểu 82% và bật Liveness Detection cấp độ Cao.',
    ipAddress: '118.70.182.1',
    timestamp: '2026-10-01T08:30:00Z'
  },
  {
    id: 'log_2',
    actorId: 'lec_1',
    actorName: 'TS. Trần Văn Minh',
    actorRole: 'lecturer',
    action: 'TẠO PHIÊN ĐIỂM DANH',
    targetEntity: 'AttendanceSession',
    targetId: 'session_active_now',
    details: 'Mở phiên điểm danh lớp 72DCHT21 môn Lập trình Web Nâng Cao tại phòng Lab 501-H1.',
    ipAddress: '118.70.182.20',
    timestamp: `${todayStr}T06:45:00Z`
  },
  {
    id: 'log_3',
    actorId: 'student_demo',
    actorName: 'Đỗ Gia Huy',
    actorRole: 'student',
    action: 'ĐĂNG KÝ SINH TRẮC HỌC',
    targetEntity: 'FaceTemplate',
    targetId: 'tmpl_student_demo',
    details: 'Đồng ý điều khoản quyền riêng tư NĐ 13/2023/NĐ-CP và trích xuất Face Template thành công.',
    ipAddress: '14.161.42.108',
    timestamp: '2026-09-05T09:12:00Z'
  }
];

export const initialSystemSettings: SystemSettings = {
  similarityThreshold: 82,
  livenessStrictness: 'high',
  maxRetries: 3,
  enableGeofencingByDefault: true,
  dataRetentionMonths: 12,
  universityName: 'Trường Đại học Công nghệ Giao thông Vận tải (UTT)',
  universityAddress: 'Trụ sở chính Phú Thọ: 278 Lam Sơn, Vĩnh Yên, Phú Thọ · Phân hiệu Hà Nội: 54 Triều Khúc, Thanh Liệt, TP Hà Nội · TTĐT Thái Nguyên: 999 Phú Thái, Phan Đình Phùng, Thái Nguyên',
  campusCenterLatitude: 21.4167,
  campusCenterLongitude: 105.2167,
  campusDefaultRadiusMeters: 75,
  syncWithUttPortal: true,
  uttPortalEndpoint: 'https://daotao.utt.edu.vn/api/v2/attendance-sync',
  lastSyncTime: `${todayStr}T06:00:00Z`
};
