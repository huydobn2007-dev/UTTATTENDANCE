export type UserRole = 'student' | 'lecturer' | 'admin';

export interface User {
  id: string;
  code: string; // Mã SV / Mã GV / Mã Admin
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  phone?: string;
  departmentId: string;
  createdAt: string;
}

export interface Student extends User {
  role: 'student';
  classId: string; // Lớp hành chính
  admissionYear: number;
  faceRegistered: boolean;
  faceRegisteredAt?: string;
  faceTemplateId?: string;
}

export interface Lecturer extends User {
  role: 'lecturer';
  academicTitle: string; // ThS, TS, PGS.TS
  officeRoom?: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  deanName: string;
  totalStudents?: number;
  totalLecturers?: number;
}

export interface AdministrativeClass {
  id: string;
  code: string; // e.g. 72DCHT21
  name: string;
  departmentId: string;
  academicYear: string;
  studentCount: number;
  advisorLecturerId: string;
}

export interface Course {
  id: string;
  code: string; // e.g. IT302
  name: string; // Lập trình Web Nâng Cao
  credits: number;
  departmentId: string;
}

export interface CourseSection {
  id: string;
  code: string; // e.g. 72DCHT21-IT302-01
  courseId: string;
  lecturerId: string;
  semester: string; // HK1 2025-2026
  academicYear: string;
  totalSessions: number;
  enrolledStudentIds: string[];
}

export interface Room {
  id: string;
  code: string; // e.g. P301-A1
  building: string; // A1, A2, H1, H2
  capacity: number;
  latitude: number;
  longitude: number;
  radiusMeters: number; // Geofence radius
}

export interface Schedule {
  id: string;
  courseSectionId: string;
  roomId: string;
  dayOfWeek: number; // 2 to 7, 8 for Sunday
  startTime: string; // '07:00'
  endTime: string; // '09:25'
  date?: string; // Optional exact date
}

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused' | 'pending';
export type VerificationMethod = 'face' | 'qr_fallback' | 'manual';

export interface AttendanceSession {
  id: string;
  sessionCode: string; // e.g. SES-202610-001
  courseSectionId: string;
  lecturerId: string;
  roomId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  earlyCheckinMinutes: number; // e.g. 15 mins
  lateCutoffTime: string; // HH:mm e.g. 07:15
  requireLiveness: boolean;
  requireGeofence: boolean;
  authMethod: VerificationMethod;
  status: 'upcoming' | 'active' | 'closed';
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  checkInTime?: string; // ISO string
  status: AttendanceStatus;
  verificationMethod: VerificationMethod;
  confidenceScore?: number; // 0-100%
  livenessPassed: boolean;
  geofencePassed?: boolean;
  deviceInfo?: string;
  ipAddress?: string;
  note?: string;
  verifiedByLecturerId?: string;
}

export interface FaceTemplate {
  id: string;
  studentId: string;
  embedding: number[]; // 128-dimensional normalized vector
  auxEmbeddings?: number[][]; // Multi-angle embeddings (straight, left, right)
  avatarPhoto?: string;
  registeredAt: string;
  qualityScore: number; // 0-100%
  hashAlgorithm: string;
  consentAgreed: boolean;
  consentAgreedAt: string;
}

export interface FaceAnalysisResult {
  hasFace: boolean;
  multipleFaces: boolean;
  inOval: boolean;
  brightness: number;
  contrast: number;
  score: number;
  message: string;
  isHandDetected?: boolean;
  faceRect?: {
    x: number;
    y: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  };
}

export interface LivenessChallenge {
  id: string;
  type: 'blink' | 'turn_left' | 'turn_right' | 'nod' | 'smile' | 'mouth_open';
  prompt: string;
  status: 'pending' | 'passed' | 'failed';
  timeoutSeconds: number;
}

export interface AttendanceVerificationResult {
  success: boolean;
  confidenceScore: number;
  livenessPassed: boolean;
  studentId?: string;
  message: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'attendance_success' | 'attendance_late' | 'face_error' | 'upcoming_class' | 'warning' | 'appeal_resolved';
  read: boolean;
  createdAt: string;
}

export interface AttendanceRequest {
  id: string;
  studentId: string;
  sessionId: string;
  reason: string;
  requestedStatus: 'present' | 'excused';
  evidenceDescription?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedByLecturerId?: string;
  reviewerNotes?: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetEntity: string;
  targetId?: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface Campus {
  id: string;
  code: string;
  name: string;
  address: string;
  type: 'headquarter' | 'branch' | 'training_center';
  phone?: string;
  email?: string;
  latitude: number;
  longitude: number;
  isHeadquarter?: boolean;
}

export interface SystemSettings {
  similarityThreshold: number; // e.g. 82%
  livenessStrictness: 'low' | 'medium' | 'high';
  maxRetries: number;
  enableGeofencingByDefault: boolean;
  dataRetentionMonths: number;
  universityName: string;
  universityAddress?: string;
  campusCenterLatitude: number;
  campusCenterLongitude: number;
  campusDefaultRadiusMeters: number;
  syncWithUttPortal: boolean;
  uttPortalEndpoint: string;
  lastSyncTime?: string;
}
