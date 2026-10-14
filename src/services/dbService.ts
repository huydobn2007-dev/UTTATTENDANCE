import {
  User,
  Student,
  Lecturer,
  Department,
  AdministrativeClass,
  Course,
  CourseSection,
  Room,
  Schedule,
  AttendanceSession,
  AttendanceRecord,
  FaceTemplate,
  NotificationItem,
  AttendanceRequest,
  AuditLog,
  SystemSettings,
  AttendanceStatus,
  Campus
} from '../types';
import {
  initialAdmin,
  initialDepartments,
  initialLecturers,
  initialClasses,
  initialRooms,
  initialCourses,
  initialStudents,
  initialCourseSections,
  initialSchedules,
  initialAttendanceSessions,
  initialAttendanceRecords,
  initialFaceTemplates,
  initialNotifications,
  initialRequests,
  initialAuditLogs,
  initialSystemSettings,
  initialCampuses
} from '../data/mockData';

const STORAGE_KEYS = {
  CURRENT_USER: 'utt_current_user',
  DEPARTMENTS: 'utt_departments',
  LECTURERS: 'utt_lecturers',
  CLASSES: 'utt_classes',
  ROOMS: 'utt_rooms',
  COURSES: 'utt_courses',
  STUDENTS: 'utt_students',
  COURSE_SECTIONS: 'utt_course_sections',
  SCHEDULES: 'utt_schedules',
  SESSIONS: 'utt_sessions',
  RECORDS: 'utt_records',
  TEMPLATES: 'utt_templates',
  NOTIFICATIONS: 'utt_notifications',
  REQUESTS: 'utt_requests',
  AUDIT_LOGS: 'utt_audit_logs',
  SETTINGS: 'utt_settings',
  CAMPUSES: 'utt_campuses',
  INITIALIZED: 'utt_app_initialized_v3'
};

const IDB_NAME = 'UTT_Attendance_DB';
const IDB_STORE = 'app_state';
const IDB_VERSION = 1;

class DBService {
  private listeners: Set<() => void> = new Set();
  private memoryCache: Map<string, unknown> = new Map();
  private idbReady: Promise<IDBDatabase | null>;

  constructor() {
    this.idbReady = this.openIndexedDB();
    this.initStorage();
    this.hydrateFromIndexedDB();
  }

  private openIndexedDB(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      try {
        const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(IDB_STORE)) {
            db.createObjectStore(IDB_STORE);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          console.warn('IndexedDB open error:', req.error);
          resolve(null);
        };
      } catch {
        resolve(null);
      }
    });
  }

  private async saveToIndexedDB(key: string, val: unknown) {
    try {
      const db = await this.idbReady;
      if (!db) return;
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(val, key);
    } catch (e) {
      console.warn('IDB write failed for key:', key, e);
    }
  }

  private async hydrateFromIndexedDB() {
    try {
      const db = await this.idbReady;
      if (!db) return;
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      
      const keysToHydrate = [
        STORAGE_KEYS.STUDENTS,
        STORAGE_KEYS.LECTURERS,
        STORAGE_KEYS.COURSES,
        STORAGE_KEYS.COURSE_SECTIONS,
        STORAGE_KEYS.DEPARTMENTS,
        STORAGE_KEYS.CLASSES,
        STORAGE_KEYS.ROOMS,
        STORAGE_KEYS.SESSIONS,
        STORAGE_KEYS.RECORDS,
        STORAGE_KEYS.TEMPLATES
      ];

      let hasHydratedAny = false;

      for (const key of keysToHydrate) {
        const req = store.get(key);
        req.onsuccess = () => {
          if (req.result && Array.isArray(req.result) && req.result.length > 0) {
            const currentMem = this.memoryCache.get(key);
            // If localStorage was cleared or had fewer items than IndexedDB, restore from IndexedDB
            if (!currentMem || (Array.isArray(currentMem) && currentMem.length < req.result.length)) {
              this.memoryCache.set(key, req.result);
              try {
                localStorage.setItem(key, JSON.stringify(req.result));
              } catch {}
              hasHydratedAny = true;
            }
          }
        };
      }

      if (hasHydratedAny) {
        this.notify();
      }
    } catch (e) {
      console.warn('Hydration from IDB error:', e);
    }
  }

  /**
   * Safe non-destructive initialization.
   * NEVER overwrites existing data for any collection that already has records!
   */
  private initStorage() {
    if (typeof window === 'undefined') return;

    // Helper to initialize a key only if it doesn't exist or is empty
    const ensureCollection = (key: string, defaultData: unknown) => {
      try {
        const existing = localStorage.getItem(key);
        if (!existing) {
          localStorage.setItem(key, JSON.stringify(defaultData));
          this.memoryCache.set(key, defaultData);
          this.saveToIndexedDB(key, defaultData);
        } else {
          try {
            const parsed = JSON.parse(existing);
            this.memoryCache.set(key, parsed);
            this.saveToIndexedDB(key, parsed);
          } catch {
            localStorage.setItem(key, JSON.stringify(defaultData));
            this.memoryCache.set(key, defaultData);
            this.saveToIndexedDB(key, defaultData);
          }
        }
      } catch (e) {
        console.warn(`Init storage warning for ${key}:`, e);
        this.memoryCache.set(key, defaultData);
      }
    };

    ensureCollection(STORAGE_KEYS.CURRENT_USER, initialStudents[8]);
    ensureCollection(STORAGE_KEYS.DEPARTMENTS, initialDepartments);
    ensureCollection(STORAGE_KEYS.LECTURERS, initialLecturers);
    ensureCollection(STORAGE_KEYS.CLASSES, initialClasses);
    ensureCollection(STORAGE_KEYS.ROOMS, initialRooms);
    ensureCollection(STORAGE_KEYS.COURSES, initialCourses);
    ensureCollection(STORAGE_KEYS.STUDENTS, initialStudents);
    ensureCollection(STORAGE_KEYS.COURSE_SECTIONS, initialCourseSections);
    ensureCollection(STORAGE_KEYS.SCHEDULES, initialSchedules);
    ensureCollection(STORAGE_KEYS.SESSIONS, initialAttendanceSessions);
    ensureCollection(STORAGE_KEYS.RECORDS, initialAttendanceRecords);
    ensureCollection(STORAGE_KEYS.TEMPLATES, initialFaceTemplates);
    ensureCollection(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    ensureCollection(STORAGE_KEYS.REQUESTS, initialRequests);
    ensureCollection(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
    ensureCollection(STORAGE_KEYS.SETTINGS, initialSystemSettings);
    ensureCollection(STORAGE_KEYS.CAMPUSES, initialCampuses);
    try {
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    } catch {}
  }

  public resetDatabase() {
    localStorage.clear();
    this.initStorage();
    this.notify();
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  private get<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key) as T;
    }
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item) as T;
        this.memoryCache.set(key, parsed);
        return parsed;
      }
    } catch (e) {
      console.warn(`Error reading key ${key} from storage:`, e);
    }
    return fallback;
  }

  private set<T>(key: string, val: T) {
    if (typeof window === 'undefined') return;
    this.memoryCache.set(key, val);
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn(`LocalStorage write error for ${key} (Quota or Security):`, e);
      // If quota exceeded, try pruning audit logs to free up space
      try {
        const logs = this.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
        if (logs.length > 50) {
          const trimmed = logs.slice(0, 30);
          localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(trimmed));
          localStorage.setItem(key, JSON.stringify(val));
        }
      } catch {}
    }
    this.saveToIndexedDB(key, val);
    this.notify();
  }

  /**
   * Export all user added/edited database data to a downloadable JSON backup
   */
  public exportDatabaseJson(): string {
    const backup: Record<string, unknown> = {};
    for (const [name, key] of Object.entries(STORAGE_KEYS)) {
      backup[name] = this.get(key, null);
    }
    return JSON.stringify(backup, null, 2);
  }

  /**
   * Restore database from a JSON backup file
   */
  public importDatabaseJson(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
      for (const [name, key] of Object.entries(STORAGE_KEYS)) {
        if (parsed[name] !== undefined) {
          this.set(key, parsed[name]);
        }
      }
      return true;
    } catch (e) {
      console.error('Import database JSON error:', e);
      return false;
    }
  }

  // Current User
  public getCurrentUser(): User {
    try {
      const user = this.get<User>(STORAGE_KEYS.CURRENT_USER, initialStudents[8]);
      if (user && user.id && user.role) {
        return user;
      }
    } catch {}
    return initialStudents[8];
  }

  public setCurrentUser(user: User) {
    if (user && user.id) {
      this.set(STORAGE_KEYS.CURRENT_USER, user);
    }
  }

  // Students
  public getStudents(): Student[] {
    return this.get<Student[]>(STORAGE_KEYS.STUDENTS, initialStudents);
  }

  public getStudentById(id: string): Student | undefined {
    return this.getStudents().find(s => s.id === id);
  }

  public getStudentByCode(code: string): Student | undefined {
    return this.getStudents().find(s => s.code.toLowerCase() === code.toLowerCase().trim());
  }

  public saveStudent(student: Student) {
    const list = this.getStudents();
    const idx = list.findIndex(s => s.id === student.id);
    if (idx >= 0) {
      list[idx] = student;
    } else {
      list.unshift(student);
    }
    this.set(STORAGE_KEYS.STUDENTS, list);
    this.logAudit(this.getCurrentUser(), 'LƯU SINH VIÊN', 'Student', student.id, `Cập nhật thông tin SV: ${student.fullName} (${student.code})`);
  }

  public deleteStudent(id: string) {
    const list = this.getStudents().filter(s => s.id !== id);
    this.set(STORAGE_KEYS.STUDENTS, list);
    const templates = this.getFaceTemplates().filter(t => t.studentId !== id);
    this.set(STORAGE_KEYS.TEMPLATES, templates);
    try {
      const user = this.getCurrentUser() || initialAdmin;
      this.logAudit(user, 'XÓA SINH VIÊN', 'Student', id, `Xóa sinh viên mã ${id} khỏi hệ thống`);
    } catch (e) {
      console.warn('Audit error', e);
    }
  }

  public deleteStudents(ids: string[]) {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);
    const list = this.getStudents().filter(s => !idSet.has(s.id));
    this.set(STORAGE_KEYS.STUDENTS, list);
    const templates = this.getFaceTemplates().filter(t => !idSet.has(t.studentId));
    this.set(STORAGE_KEYS.TEMPLATES, templates);
    try {
      const user = this.getCurrentUser() || initialAdmin;
      this.logAudit(user, 'XÓA NHIỀU SINH VIÊN', 'Student', ids.join(','), `Xóa hàng loạt ${ids.length} sinh viên khỏi hệ thống`);
    } catch (e) {
      console.warn('Audit error', e);
    }
  }

  public deleteAllStudents() {
    const count = this.getStudents().length;
    this.set(STORAGE_KEYS.STUDENTS, []);
    this.set(STORAGE_KEYS.TEMPLATES, []);
    try {
      const user = this.getCurrentUser() || initialAdmin;
      this.logAudit(user, 'XÓA TẤT CẢ SINH VIÊN', 'Student', 'ALL', `Xóa toàn bộ ${count} sinh viên và dữ liệu Face ID`);
    } catch (e) {
      console.warn('Audit error', e);
    }
  }

  public bulkUpdateStudents(ids: string[], updates: { departmentId?: string; classId?: string; resetFace?: boolean }) {
    if (!ids || ids.length === 0) return 0;
    const idSet = new Set(ids);
    const students = this.getStudents();
    let updatedCount = 0;

    const updatedStudents = students.map(st => {
      if (!idSet.has(st.id)) return st;
      updatedCount++;
      const updated = { ...st };
      if (updates.departmentId) updated.departmentId = updates.departmentId;
      if (updates.classId) updated.classId = updates.classId;
      if (updates.resetFace) {
        updated.faceRegistered = false;
        updated.faceRegisteredAt = undefined;
        updated.avatarUrl = undefined;
      }
      return updated;
    });

    this.set(STORAGE_KEYS.STUDENTS, updatedStudents);

    if (updates.resetFace) {
      const templates = this.getFaceTemplates().filter(t => !idSet.has(t.studentId));
      this.set(STORAGE_KEYS.TEMPLATES, templates);
    }

    try {
      const user = this.getCurrentUser() || initialAdmin;
      this.logAudit(user, 'CẬP NHẬT HÀNG LOẠT', 'Student', ids.join(','), `Cập nhật thông tin hàng loạt cho ${updatedCount} sinh viên`);
    } catch (e) {
      console.warn('Audit error', e);
    }

    return updatedCount;
  }

  // Lecturers
  public getLecturers(): Lecturer[] {
    return this.get<Lecturer[]>(STORAGE_KEYS.LECTURERS, initialLecturers);
  }

  public getLecturerById(id: string): Lecturer | undefined {
    return this.getLecturers().find(l => l.id === id);
  }

  public saveLecturer(lecturer: Lecturer) {
    const list = this.getLecturers();
    const idx = list.findIndex(l => l.id === lecturer.id);
    if (idx >= 0) list[idx] = lecturer;
    else list.unshift(lecturer);
    this.set(STORAGE_KEYS.LECTURERS, list);
    try {
      const user = this.getCurrentUser() || initialAdmin;
      this.logAudit(user, 'LƯU GIẢNG VIÊN', 'Lecturer', lecturer.id, `Cập nhật thông tin giảng viên ${lecturer.fullName}`);
    } catch (e) {
      console.warn('Audit error', e);
    }
  }

  public deleteLecturer(id: string) {
    const list = this.getLecturers().filter(l => l.id !== id);
    this.set(STORAGE_KEYS.LECTURERS, list);
    try {
      const user = this.getCurrentUser() || initialAdmin;
      this.logAudit(user, 'XÓA GIẢNG VIÊN', 'Lecturer', id, `Xóa giảng viên mã ${id}`);
    } catch (e) {
      console.warn('Audit error', e);
    }
  }

  // Reset or delete face template for student when mismatched
  public resetStudentFace(studentId: string) {
    const students = this.getStudents();
    const st = students.find(s => s.id === studentId);
    if (st) {
      st.faceRegistered = false;
      st.faceRegisteredAt = undefined;
      this.saveStudent(st);
    }
    const templates = this.getFaceTemplates().filter(t => t.studentId !== studentId);
    this.set(STORAGE_KEYS.TEMPLATES, templates);
    try {
      const user = this.getCurrentUser() || initialAdmin;
      this.logAudit(user, 'RESET FACE ID', 'FaceTemplate', studentId, `Đặt lại dữ liệu khuôn mặt cho sinh viên ${studentId}`);
    } catch (e) {
      console.warn('Audit error', e);
    }
  }

  // Admin / Users
  public getAdmin(): User {
    return initialAdmin;
  }

  // Departments (Khoa / Bộ môn)
  public getDepartments(): Department[] {
    return this.get<Department[]>(STORAGE_KEYS.DEPARTMENTS, initialDepartments);
  }

  public getDepartmentById(id: string): Department | undefined {
    return this.getDepartments().find(d => d.id === id);
  }

  public saveDepartment(dept: Department) {
    const list = this.getDepartments();
    const idx = list.findIndex(d => d.id === dept.id);
    if (idx >= 0) list[idx] = dept;
    else list.push(dept);
    this.set(STORAGE_KEYS.DEPARTMENTS, list);
    try {
      const user = this.getCurrentUser() || initialAdmin;
      this.logAudit(user, 'LƯU KHOA/BỘ MÔN', 'Department', dept.id, `Cập nhật Khoa/Bộ môn: ${dept.name}`);
    } catch (e) {
      console.warn('Audit error', e);
    }
  }

  public deleteDepartment(id: string) {
    const list = this.getDepartments().filter(d => d.id !== id);
    this.set(STORAGE_KEYS.DEPARTMENTS, list);
    try {
      const user = this.getCurrentUser() || initialAdmin;
      this.logAudit(user, 'XÓA KHOA/BỘ MÔN', 'Department', id, `Xóa Khoa/Bộ môn mã ${id}`);
    } catch (e) {
      console.warn('Audit error', e);
    }
  }

  // Classes (Lớp Hành chính)
  public getClasses(): AdministrativeClass[] {
    return this.get<AdministrativeClass[]>(STORAGE_KEYS.CLASSES, initialClasses);
  }

  public getClassById(id: string): AdministrativeClass | undefined {
    return this.getClasses().find(c => c.id === id);
  }

  public saveClass(cls: AdministrativeClass) {
    const list = this.getClasses();
    const idx = list.findIndex(c => c.id === cls.id);
    if (idx >= 0) list[idx] = cls;
    else list.push(cls);
    this.set(STORAGE_KEYS.CLASSES, list);
    try {
      const user = this.getCurrentUser() || initialAdmin;
      this.logAudit(user, 'LƯU LỚP HÀNH CHÍNH', 'AdministrativeClass', cls.id, `Cập nhật Lớp HC: ${cls.code} (${cls.name})`);
    } catch (e) {
      console.warn('Audit error', e);
    }
  }

  public deleteClass(id: string) {
    const list = this.getClasses().filter(c => c.id !== id);
    this.set(STORAGE_KEYS.CLASSES, list);
    try {
      const user = this.getCurrentUser() || initialAdmin;
      this.logAudit(user, 'XÓA LỚP HÀNH CHÍNH', 'AdministrativeClass', id, `Xóa Lớp HC mã ${id}`);
    } catch (e) {
      console.warn('Audit error', e);
    }
  }

  /**
   * Helper to find or automatically create an AdministrativeClass when importing students from Word/Excel
   */
  public findOrCreateClass(rawCode: string, departmentId?: string): AdministrativeClass {
    const cleanCode = rawCode.trim().toUpperCase().replace(/[\s\-_]/g, '');
    const classes = this.getClasses();
    const existing = classes.find(c => 
      c.code.toUpperCase().replace(/[\s\-_]/g, '') === cleanCode ||
      c.id.toLowerCase() === `class_${cleanCode.toLowerCase()}`
    );
    if (existing) return existing;

    let dept = departmentId;
    if (!dept) {
      if (/HT|TT|IT|CNTT/i.test(cleanCode)) dept = 'dept_it';
      else if (/OT|CB|CE|CT/i.test(cleanCode)) dept = 'dept_ce';
      else if (/KT|VT|TE/i.test(cleanCode)) dept = 'dept_te';
      else dept = classes[0]?.departmentId || 'dept_it';
    }

    const newCls: AdministrativeClass = {
      id: `class_${cleanCode.toLowerCase()}`,
      code: cleanCode,
      name: `Lớp ${cleanCode} - ĐH Công nghệ GTVT`,
      departmentId: dept,
      academicYear: '2021-2025',
      studentCount: 1,
      advisorLecturerId: 'lec_1'
    };
    this.saveClass(newCls);
    return newCls;
  }

  // Rooms
  public getRooms(): Room[] {
    return this.get<Room[]>(STORAGE_KEYS.ROOMS, initialRooms);
  }

  public getRoomById(id: string): Room | undefined {
    return this.getRooms().find(r => r.id === id);
  }

  public saveRoom(room: Room) {
    const list = this.getRooms();
    const idx = list.findIndex(r => r.id === room.id);
    if (idx >= 0) list[idx] = room;
    else list.push(room);
    this.set(STORAGE_KEYS.ROOMS, list);
  }

  // Courses (Môn học / Học phần)
  public getCourses(): Course[] {
    return this.get<Course[]>(STORAGE_KEYS.COURSES, initialCourses);
  }

  public getCourseById(id: string): Course | undefined {
    return this.getCourses().find(c => c.id === id);
  }

  public saveCourse(course: Course) {
    const list = this.getCourses();
    const idx = list.findIndex(c => c.id === course.id);
    if (idx >= 0) list[idx] = course;
    else list.push(course);
    this.set(STORAGE_KEYS.COURSES, list);
    try {
      const user = this.getCurrentUser() || initialAdmin;
      this.logAudit(user, 'LƯU MÔN HỌC', 'Course', course.id, `Cập nhật Môn học: ${course.code} - ${course.name}`);
    } catch (e) {
      console.warn('Audit error', e);
    }
  }

  public deleteCourse(id: string) {
    const list = this.getCourses().filter(c => c.id !== id);
    this.set(STORAGE_KEYS.COURSES, list);
    try {
      const user = this.getCurrentUser() || initialAdmin;
      this.logAudit(user, 'XÓA MÔN HỌC', 'Course', id, `Xóa Môn học mã ${id}`);
    } catch (e) {
      console.warn('Audit error', e);
    }
  }

  // Course Sections (Lớp học phần)
  public getCourseSections(): CourseSection[] {
    return this.get<CourseSection[]>(STORAGE_KEYS.COURSE_SECTIONS, initialCourseSections);
  }

  public getCourseSectionById(id: string): CourseSection | undefined {
    return this.getCourseSections().find(cs => cs.id === id);
  }

  public saveCourseSection(section: CourseSection) {
    const list = this.getCourseSections();
    const idx = list.findIndex(s => s.id === section.id);
    if (idx >= 0) list[idx] = section;
    else list.push(section);
    this.set(STORAGE_KEYS.COURSE_SECTIONS, list);
    try {
      const user = this.getCurrentUser() || initialAdmin;
      this.logAudit(user, 'LƯU LỚP HỌC PHẦN', 'CourseSection', section.id, `Cập nhật danh sách lớp HP ${section.code}`);
    } catch (e) {
      console.warn('Audit error', e);
    }
  }

  public deleteCourseSection(id: string) {
    const list = this.getCourseSections().filter(cs => cs.id !== id);
    this.set(STORAGE_KEYS.COURSE_SECTIONS, list);
    try {
      const user = this.getCurrentUser() || initialAdmin;
      this.logAudit(user, 'XÓA LỚP HỌC PHẦN', 'CourseSection', id, `Xóa lớp học phần mã ${id}`);
    } catch (e) {
      console.warn('Audit error', e);
    }
  }

  public addStudentToSection(sectionId: string, studentId: string) {
    const sections = this.getCourseSections();
    const sec = sections.find(s => s.id === sectionId);
    if (sec && !sec.enrolledStudentIds.includes(studentId)) {
      sec.enrolledStudentIds.push(studentId);
      this.saveCourseSection(sec);
    }
  }

  public removeStudentFromSection(sectionId: string, studentId: string) {
    const sections = this.getCourseSections();
    const sec = sections.find(s => s.id === sectionId);
    if (sec) {
      sec.enrolledStudentIds = sec.enrolledStudentIds.filter(id => id !== studentId);
      this.saveCourseSection(sec);
    }
  }

  public updateSectionRoster(sectionId: string, studentIds: string[]) {
    const sections = this.getCourseSections();
    const sec = sections.find(s => s.id === sectionId);
    if (sec) {
      sec.enrolledStudentIds = studentIds;
      this.saveCourseSection(sec);
    }
  }

  // Campuses (Phân hiệu & Cơ sở Đào tạo UTT)
  public getCampuses(): Campus[] {
    return this.get<Campus[]>(STORAGE_KEYS.CAMPUSES, initialCampuses);
  }

  public getCampusById(id: string): Campus | undefined {
    return this.getCampuses().find(c => c.id === id);
  }

  public saveCampus(campus: Campus) {
    const list = this.getCampuses();
    const idx = list.findIndex(c => c.id === campus.id);
    if (idx >= 0) list[idx] = campus;
    else list.push(campus);
    this.set(STORAGE_KEYS.CAMPUSES, list);
  }

  public deleteCampus(id: string) {
    const list = this.getCampuses().filter(c => c.id !== id);
    this.set(STORAGE_KEYS.CAMPUSES, list);
  }

  /**
   * Đồng bộ Khoa đào tạo sang các lớp được chỉ định hoặc toàn bộ sinh viên thuộc lớp
   */
  public syncDepartmentToClasses(
    departmentId: string,
    targetClassIds: string[],
    syncStudentsInClass: boolean = true
  ): { updatedClassesCount: number; updatedStudentsCount: number; classCodes: string[] } {
    const classes = this.getClasses();
    const classCodes: string[] = [];
    let updatedClassesCount = 0;

    classes.forEach(c => {
      if (targetClassIds.includes(c.id)) {
        c.departmentId = departmentId;
        classCodes.push(c.code);
        updatedClassesCount++;
      }
    });
    this.set(STORAGE_KEYS.CLASSES, classes);

    let updatedStudentsCount = 0;
    if (syncStudentsInClass) {
      const students = this.getStudents();
      students.forEach(st => {
        if (targetClassIds.includes(st.classId)) {
          st.departmentId = departmentId;
          updatedStudentsCount++;
        }
      });
      this.set(STORAGE_KEYS.STUDENTS, students);
    }

    const dept = this.getDepartmentById(departmentId);
    try {
      const user = this.getCurrentUser() || initialAdmin;
      this.logAudit(
        user,
        'ĐỒNG BỘ KHOA ĐÀO TẠO',
        'Department',
        departmentId,
        `Đồng bộ Khoa "${dept?.name || departmentId}" sang ${updatedClassesCount} lớp (${classCodes.join(', ')}) và ${updatedStudentsCount} sinh viên`
      );
    } catch (e) {
      console.warn('Audit error', e);
    }

    return { updatedClassesCount, updatedStudentsCount, classCodes };
  }

  public bulkSaveStudents(newStudents: Student[]) {
    const current = this.getStudents();
    const merged = [...current];
    for (const st of newStudents) {
      const cleanCode = st.code.trim().toUpperCase();
      const idx = merged.findIndex(s => s.id === st.id || s.code.trim().toUpperCase() === cleanCode);
      if (idx >= 0) {
        merged[idx] = { ...merged[idx], ...st, code: cleanCode };
      } else {
        merged.push({ ...st, code: cleanCode });
      }
    }
    this.set(STORAGE_KEYS.STUDENTS, merged);
    try {
      const user = this.getCurrentUser() || initialAdmin;
      this.logAudit(user, 'NHẬP DANH SÁCH SINH VIÊN', 'Student', `${newStudents.length}`, `Nhập danh sách hàng loạt ${newStudents.length} sinh viên`);
    } catch (e) {
      console.warn('Audit error', e);
    }
  }

  // Schedules
  public getSchedules(): Schedule[] {
    return this.get<Schedule[]>(STORAGE_KEYS.SCHEDULES, initialSchedules);
  }

  // Sessions
  public getSessions(): AttendanceSession[] {
    return this.get<AttendanceSession[]>(STORAGE_KEYS.SESSIONS, initialAttendanceSessions);
  }

  public getSessionById(id: string): AttendanceSession | undefined {
    return this.getSessions().find(s => s.id === id);
  }

  public getActiveSession(): AttendanceSession | undefined {
    return this.getSessions().find(s => s.status === 'active');
  }

  public saveSession(session: AttendanceSession) {
    const list = this.getSessions();
    const idx = list.findIndex(s => s.id === session.id);
    if (idx >= 0) list[idx] = session;
    else list.unshift(session);
    this.set(STORAGE_KEYS.SESSIONS, list);
    this.logAudit(this.getCurrentUser(), 'CẬP NHẬT PHIÊN', 'AttendanceSession', session.id, `Phiên ${session.sessionCode} - Trạng thái: ${session.status}`);
  }

  // Records
  public getAttendanceRecords(): AttendanceRecord[] {
    return this.get<AttendanceRecord[]>(STORAGE_KEYS.RECORDS, initialAttendanceRecords);
  }

  public getRecordsBySession(sessionId: string): AttendanceRecord[] {
    return this.getAttendanceRecords().filter(r => r.sessionId === sessionId);
  }

  public getRecordsByStudent(studentId: string): AttendanceRecord[] {
    return this.getAttendanceRecords().filter(r => r.studentId === studentId);
  }

  public getAttendanceRecord(sessionId: string, studentId: string): AttendanceRecord | undefined {
    return this.getAttendanceRecords().find(r => r.sessionId === sessionId && r.studentId === studentId);
  }

  public saveAttendanceRecord(record: AttendanceRecord) {
    const list = this.getAttendanceRecords();
    const idx = list.findIndex(r => r.sessionId === record.sessionId && r.studentId === record.studentId);
    let isStatusDowngrade = false;

    if (idx >= 0) {
      const existing = list[idx];
      // CRITICAL BIOMETRIC INTEGRITY RULE:
      // Once a student has successfully checked in on time ('present'), an automated face scan
      // (e.g. accidental rescan at kiosk or modal after late cutoff) must NEVER downgrade them to 'late',
      // nor overwrite their original check-in timestamp with a later one.
      if (record.verificationMethod === 'face' && existing.status === 'present' && record.status === 'late') {
        isStatusDowngrade = true;
        // Retain original 'present' status and check-in time!
        return;
      }

      // Preserve earliest check-in time for biometric scans
      if (existing.checkInTime && record.verificationMethod === 'face') {
        record.checkInTime = existing.checkInTime;
      }

      // If existing was already 'present', never change status to 'late' via automated face scan
      if (existing.status === 'present' && record.verificationMethod === 'face') {
        record.status = 'present';
      }

      list[idx] = record;
    } else {
      list.push(record);
    }
    this.set(STORAGE_KEYS.RECORDS, list);
    
    // Also notify student (only on new attendance or actual valid change, avoid duplicate late notifications)
    if (!isStatusDowngrade) {
      const student = this.getStudentById(record.studentId);
      const session = this.getSessionById(record.sessionId);
      const courseSection = session ? this.getCourseSectionById(session.courseSectionId) : null;
      const course = courseSection ? this.getCourseById(courseSection.courseId) : null;
      
      if (student) {
        const statusText = record.status === 'present' ? 'Có mặt' : record.status === 'late' ? 'Đi muộn' : 'Vắng';
        this.addNotification({
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: student.id,
          title: record.status === 'late' ? 'Điểm danh: Đi muộn' : 'Điểm danh thành công',
          message: `Môn ${course ? course.name : 'học phần'} lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}. Trạng thái: ${statusText}.`,
          type: record.status === 'late' ? 'attendance_late' : 'attendance_success',
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    }
  }

  public deleteAttendanceRecord(recordId: string) {
    const list = this.getAttendanceRecords().filter(r => r.id !== recordId);
    this.set(STORAGE_KEYS.RECORDS, list);
    this.notify();
  }

  public deleteRecordsBySession(sessionId: string) {
    const list = this.getAttendanceRecords().filter(r => r.sessionId !== sessionId);
    this.set(STORAGE_KEYS.RECORDS, list);
    this.notify();
  }

  // Face Templates
  public getFaceTemplates(): FaceTemplate[] {
    return this.get<FaceTemplate[]>(STORAGE_KEYS.TEMPLATES, initialFaceTemplates);
  }

  public getFaceTemplateByStudentId(studentId: string): FaceTemplate | undefined {
    return this.getFaceTemplates().find(t => t.studentId === studentId);
  }

  public saveFaceTemplate(template: FaceTemplate) {
    const list = this.getFaceTemplates();
    const idx = list.findIndex(t => t.studentId === template.studentId);
    if (idx >= 0) list[idx] = template;
    else list.push(template);
    this.set(STORAGE_KEYS.TEMPLATES, list);

    // Update student face registration status
    const student = this.getStudentById(template.studentId);
    if (student) {
      student.faceRegistered = true;
      student.faceRegisteredAt = template.registeredAt;
      student.faceTemplateId = template.id;
      this.saveStudent(student);
    }

    this.logAudit(
      this.getCurrentUser(),
      'ĐĂNG KÝ KHUÔN MẶT',
      'FaceTemplate',
      template.id,
      `Đã đăng ký Face Template (Chất lượng ${template.qualityScore}%) cho SV ${student ? student.fullName : template.studentId}`
    );
  }

  public deleteFaceTemplate(studentId: string) {
    const list = this.getFaceTemplates().filter(t => t.studentId !== studentId);
    this.set(STORAGE_KEYS.TEMPLATES, list);

    const student = this.getStudentById(studentId);
    if (student) {
      student.faceRegistered = false;
      student.faceRegisteredAt = undefined;
      student.faceTemplateId = undefined;
      this.saveStudent(student);
    }

    this.logAudit(
      this.getCurrentUser(),
      'THU HỒI DỮ LIỆU SINH TRẮC HỌC',
      'FaceTemplate',
      studentId,
      `Đã xóa Face Template theo yêu cầu quyền riêng tư của sinh viên`
    );
  }

  // Notifications
  public getNotifications(userId: string): NotificationItem[] {
    return this.get<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications)
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addNotification(item: NotificationItem) {
    const list = this.get<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    list.unshift(item);
    this.set(STORAGE_KEYS.NOTIFICATIONS, list);
  }

  public markNotificationAsRead(id: string) {
    const list = this.get<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    const item = list.find(n => n.id === id);
    if (item) {
      item.read = true;
      this.set(STORAGE_KEYS.NOTIFICATIONS, list);
    }
  }

  public markAllNotificationsAsRead(userId: string) {
    const list = this.get<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    list.forEach(n => {
      if (n.userId === userId) n.read = true;
    });
    this.set(STORAGE_KEYS.NOTIFICATIONS, list);
  }

  // Attendance Requests (Appeals)
  public getRequests(): AttendanceRequest[] {
    return this.get<AttendanceRequest[]>(STORAGE_KEYS.REQUESTS, initialRequests);
  }

  public getRequestsByStudent(studentId: string): AttendanceRequest[] {
    return this.getRequests().filter(r => r.studentId === studentId);
  }

  public saveRequest(request: AttendanceRequest) {
    const list = this.getRequests();
    const idx = list.findIndex(r => r.id === request.id);
    if (idx >= 0) list[idx] = request;
    else list.unshift(request);
    this.set(STORAGE_KEYS.REQUESTS, list);
    this.logAudit(this.getCurrentUser(), 'GỬI KHIẾU NẠI ĐIỂM DANH', 'AttendanceRequest', request.id, `Sinh viên gửi khiếu nại phiên ${request.sessionId}`);
  }

  public updateRequestStatus(id: string, status: 'approved' | 'rejected', reviewerId: string, notes?: string) {
    const list = this.getRequests();
    const req = list.find(r => r.id === id);
    if (req) {
      req.status = status;
      req.reviewedAt = new Date().toISOString();
      req.reviewedByLecturerId = reviewerId;
      req.reviewerNotes = notes;
      this.set(STORAGE_KEYS.REQUESTS, list);

      // If approved, update attendance record
      if (status === 'approved') {
        const targetStatus: AttendanceStatus = req.requestedStatus === 'present' ? 'present' : 'excused';
        const record = this.getAttendanceRecords().find(r => r.sessionId === req.sessionId && r.studentId === req.studentId);
        if (record) {
          record.status = targetStatus;
          record.note = `Đã duyệt khiếu nại: ${notes || 'Chấp nhận lý do'}`;
          this.saveAttendanceRecord(record);
        } else {
          this.saveAttendanceRecord({
            id: `rec_appeal_${Date.now()}`,
            sessionId: req.sessionId,
            studentId: req.studentId,
            status: targetStatus,
            verificationMethod: 'manual',
            livenessPassed: true,
            checkInTime: new Date().toISOString(),
            note: `Duyệt khiếu nại: ${notes || 'Được giảng viên xác nhận'}`
          });
        }
      }

      // Send notification to student
      this.addNotification({
        id: `notif_appeal_${Date.now()}`,
        userId: req.studentId,
        title: status === 'approved' ? 'Khiếu nại điểm danh được chấp nhận' : 'Khiếu nại điểm danh bị từ chối',
        message: `Yêu cầu cho phiên ${req.sessionId} đã được giảng viên xử lý: ${notes || status}`,
        type: 'appeal_resolved',
        read: false,
        createdAt: new Date().toISOString()
      });
    }
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    return this.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public logAudit(actor: User | undefined, action: string, targetEntity: string, targetId?: string, details: string = '') {
    const user = actor || this.getCurrentUser() || initialAdmin;
    const logs = this.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      actorId: user?.id || 'system',
      actorName: user?.fullName || 'Hệ thống UTT',
      actorRole: user?.role || 'admin',
      action,
      targetEntity,
      targetId,
      details,
      ipAddress: '118.70.182.' + Math.floor(Math.random() * 100 + 10),
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    if (logs.length > 500) logs.pop();
    this.set(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  // System Settings
  public getSettings(): SystemSettings {
    return this.get<SystemSettings>(STORAGE_KEYS.SETTINGS, initialSystemSettings);
  }

  public saveSettings(settings: SystemSettings) {
    this.set(STORAGE_KEYS.SETTINGS, settings);
    this.logAudit(this.getCurrentUser(), 'CẬP NHẬT CẤU HÌNH HỆ THỐNG', 'SystemSettings', undefined, `Ngưỡng: ${settings.similarityThreshold}%, Liveness: ${settings.livenessStrictness}`);
  }
}

type LecturersList = Lecturer[];

export const db = new DBService();
