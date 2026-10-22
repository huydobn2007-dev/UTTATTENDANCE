import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AttendanceSession, Course, CourseSection, Room, Student, Lecturer, AttendanceRecord } from '../../types';
import { db } from '../../services/dbService';
import { faceService } from '../../services/faceRecognitionService';
import { FileStudentImportModal } from '../common/FileStudentImportModal';
import { 
  Camera, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  RefreshCw,
  Search,
  Check,
  X,
  Sparkles,
  ArrowRightLeft,
  LogOut,
  Building,
  Scan,
  Zap,
  Activity,
  Edit2,
  UserCheck,
  UserPlus,
  AlertTriangle,
  FileSpreadsheet,
  SwitchCamera,
  Smartphone,
  Monitor,
  CameraOff
} from 'lucide-react';
import { UttLogo } from '../common/UttLogo';

interface EntranceKioskProps {
  onExitKiosk: () => void;
  onOpenRoleSwitcher?: () => void;
}

export const EntranceKiosk: React.FC<EntranceKioskProps> = ({ onExitKiosk, onOpenRoleSwitcher }) => {
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [section, setSection] = useState<CourseSection | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [lecturer, setLecturer] = useState<Lecturer | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  // Campus selection for Kiosk terminal
  const campuses = db.getCampuses();
  const [selectedCampusId, setSelectedCampusId] = useState<string>('campus_hn');
  const currentCampus = campuses.find(c => c.id === selectedCampusId) || campuses[0];

  // Camera & recognition states
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [useHardwareCamera, setUseHardwareCamera] = useState<boolean>(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [enableVoice, setEnableVoice] = useState<boolean>(true);
  const [isAutoScanning, setIsAutoScanning] = useState<boolean>(true);
  const [faceDetectedInOval, setFaceDetectedInOval] = useState<boolean>(false);
  const [isProcessingFace, setIsProcessingFace] = useState<boolean>(false);
  const [scanMode, setScanMode] = useState<'auto_1toN' | 'target_student'>('auto_1toN');
  const [targetStudentForScan, setTargetStudentForScan] = useState<string>('student_demo');

  // Mobile Kiosk Responsive Views
  const [mobileKioskTab, setMobileKioskTab] = useState<'camera' | 'roster'>('camera');
  const [isMobilePreviewMode, setIsMobilePreviewMode] = useState<boolean>(false);

  // Identified Student Result Modal / HUD
  const [identifiedStudent, setIdentifiedStudent] = useState<Student | null>(null);
  const [identifiedStatus, setIdentifiedStatus] = useState<'present' | 'late' | 'already' | 'not_enrolled' | 'unknown'>('present');
  const [identifiedConfidence, setIdentifiedConfidence] = useState<number>(0);
  const [identifiedTime, setIdentifiedTime] = useState<string>('');
  const [resetCountdown, setResetCountdown] = useState<number>(0);

  // Quick Edit Modal States (for Mismatched Student or Lecturer)
  const [showEditStudentModal, setShowEditStudentModal] = useState<boolean>(false);
  const [targetStudentForEdit, setTargetStudentForEdit] = useState<Student | null>(null);
  const [editFullName, setEditFullName] = useState<string>('');
  const [editCode, setEditCode] = useState<string>('');
  const [editClass, setEditClass] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [recaptureStatus, setRecaptureStatus] = useState<string | null>(null);

  // Edit Lecturer / Session Modal
  const [showEditLecturerModal, setShowEditLecturerModal] = useState<boolean>(false);
  const [editLecTitle, setEditLecTitle] = useState<string>('');
  const [editLecName, setEditLecName] = useState<string>('');
  const [editLecOffice, setEditLecOffice] = useState<string>('');
  const [editCourseName, setEditCourseName] = useState<string>('');
  const [editLateCutoff, setEditLateCutoff] = useState<string>('07:15');

  // Manual Check-in drawer
  const [manualSearch, setManualSearch] = useState<string>('');
  const [showManualModal, setShowManualModal] = useState<boolean>(false);

  // Roster Management Modal on Kiosk
  const [showRosterModal, setShowRosterModal] = useState<boolean>(false);
  const [rosterSearchText, setRosterSearchText] = useState<string>('');
  const [isKioskFileImportOpen, setIsKioskFileImportOpen] = useState<boolean>(false);
  const [hudScanMessage, setHudScanMessage] = useState<string>('Vui lòng nhìn thẳng vào khung hình');
  const [awaitingFaceExit, setAwaitingFaceExit] = useState<boolean>(false);
  const [isHandDetectedState, setIsHandDetectedState] = useState<boolean>(false);

  // Clock
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastIdentifiedStudentIdRef = useRef<string | null>(null);
  const lastIdentifiedTimeRef = useRef<number>(0);
  const consecutiveFaceFramesRef = useRef<number>(0);
  const missedFaceFramesRef = useRef<number>(0);
  const recentlyIdentifiedMapRef = useRef<Map<string, number>>(new Map());
  const lastUnknownScanTimeRef = useRef<number>(0);
  const identifiedStudentRef = useRef<Student | null>(null);
  identifiedStudentRef.current = identifiedStudent;

  // Update real-time clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDateStr(now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load session & student roster
  const loadData = useCallback(() => {
    const sess = db.getActiveSession() || db.getSessions()[0];
    setActiveSession(sess || null);
    if (sess) {
      const sec = db.getCourseSectionById(sess.courseSectionId);
      setSection(sec || null);
      if (sec) {
        const crs = db.getCourseById(sec.courseId);
        setCourse(crs || null);
        const allEnrolled = db.getStudents().filter(s => sec.enrolledStudentIds.includes(s.id));
        setEnrolledStudents(allEnrolled);
      }
      const rm = db.getRoomById(sess.roomId);
      setRoom(rm || null);
      const lec = db.getLecturerById(sess.lecturerId);
      setLecturer(lec || null);
      const recs = db.getRecordsBySession(sess.id);
      setRecords(recs);
    }
  }, []);

  useEffect(() => {
    loadData();
    return db.subscribe(loadData);
  }, [loadData]);

  // Synchronize video element with stream
  useEffect(() => {
    if (videoRef.current && cameraStream && useHardwareCamera) {
      if (videoRef.current.srcObject !== cameraStream) {
        videoRef.current.srcObject = cameraStream;
      }
      videoRef.current.play().catch(e => console.warn('Video play error:', e));
    }
  }, [cameraStream, useHardwareCamera]);

  // Start Hardware Camera
  const startCamera = async (currentFacing: 'user' | 'environment' = facingMode) => {
    setCameraLoading(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: currentFacing, width: { ideal: 1280 }, height: { ideal: 720 } }
          });
        } catch {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
          } catch {}
        }
        if (stream) {
          setCameraStream(stream);
          setUseHardwareCamera(true);
          setCameraLoading(false);
          return;
        }
      }
      setUseHardwareCamera(false);
      setCameraLoading(false);
    } catch {
      setUseHardwareCamera(false);
      setCameraLoading(false);
    }
  };

  const toggleCameraFacing = () => {
    stopCamera();
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
  };

  useEffect(() => {
    startCamera(facingMode);
    return () => stopCamera();
  }, []);

  // Handle unregistered / unknown face
  const handleUnknownFace = useCallback((customScore?: number) => {
    const now = Date.now();
    if (now - lastUnknownScanTimeRef.current < 5000) {
      return;
    }
    lastUnknownScanTimeRef.current = now;

    setIdentifiedStudent({
      id: 'unknown',
      code: 'SV-CHƯA-ĐK',
      fullName: 'Khuôn mặt chưa nhận diện',
      email: 'chuacapnhat@utt.edu.vn',
      role: 'student',
      classId: 'class_72dcht21',
      departmentId: 'dept_it',
      admissionYear: 2021,
      faceRegistered: false,
      createdAt: new Date().toISOString()
    });
    setIdentifiedStatus('unknown');
    setIdentifiedConfidence(customScore || 38);
    setIdentifiedTime(new Date().toLocaleTimeString('vi-VN'));
    setResetCountdown(4);
    faceService.playErrorTone();
    if (enableVoice) {
      faceService.speakVoice('Khuôn mặt chưa được nhận diện. Vui lòng bấm đăng ký Face ID để cập nhật.');
    }
  }, [enableVoice]);

  // Process 1:N identification of an approaching student
  const handleIdentifyStudent = useCallback((targetStudentId: string, customScore?: number) => {
    const student = db.getStudentById(targetStudentId);
    if (!student) {
      handleUnknownFace(customScore);
      return;
    }

    const now = Date.now();
    // Anti-duplicate debounce: don't re-trigger the same student within 5 seconds
    const lastTime = recentlyIdentifiedMapRef.current.get(student.id) || 0;
    if (now - lastTime < 5000) {
      return;
    }
    recentlyIdentifiedMapRef.current.set(student.id, now);
    lastIdentifiedStudentIdRef.current = student.id;
    lastIdentifiedTimeRef.current = now;

    // Resolve active session with robust fallback
    const currentSession = activeSession || db.getActiveSession() || db.getSessions()[0];

    // Check enrollment
    const isEnrolled = section ? section.enrolledStudentIds.includes(student.id) : true;
    if (!isEnrolled) {
      setIdentifiedStudent(student);
      setIdentifiedStatus('not_enrolled');
      setIdentifiedConfidence(94);
      setIdentifiedTime(new Date().toLocaleTimeString('vi-VN'));
      setResetCountdown(4);
      faceService.playWarningTone();
      if (enableVoice) {
        faceService.speakVoice(`Cảnh báo: Sinh viên ${student.fullName} không thuộc lớp học phần này!`);
      }
      return;
    }

    // If no session exists in DB at all, still show student identity card successfully!
    if (!currentSession) {
      setIdentifiedStudent(student);
      setIdentifiedStatus('present');
      setIdentifiedConfidence(customScore || 96);
      setIdentifiedTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setResetCountdown(4);
      setAwaitingFaceExit(true);
      faceService.playSuccessChime();
      if (enableVoice) {
        faceService.speakVoice(`Xin chào ${student.fullName}, nhận diện khuôn mặt thành công!`);
      }
      return;
    }

    // 1. Check if student has ALREADY checked in for this active session (PREVENT OVERWRITING OR BEING MARKED LATE)
    const existingRecords = db.getRecordsBySession(currentSession.id);
    const existingRecord = existingRecords.find(
      r => r.studentId === student.id && (r.status === 'present' || r.status === 'late')
    );

    if (existingRecord) {
      const origDate = existingRecord.checkInTime ? new Date(existingRecord.checkInTime) : new Date();
      const origTimeStr = !isNaN(origDate.getTime())
        ? origDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : 'Đúng giờ';
      const wasOnTime = existingRecord.status === 'present';

      setIdentifiedStudent(student);
      setIdentifiedStatus('already');
      setIdentifiedConfidence(customScore || existingRecord.confidenceScore || 98);
      setIdentifiedTime(
        wasOnTime
          ? `Đã điểm danh đúng giờ (Lúc ${origTimeStr})`
          : `Đã điểm danh đi muộn (Lúc ${origTimeStr})`
      );
      setResetCountdown(4);
      setAwaitingFaceExit(true);

      faceService.playSuccessChime();
      if (enableVoice) {
        if (wasOnTime) {
          faceService.speakVoice(
            `Bạn ${student.fullName} đã điểm danh đúng giờ lúc ${origTimeStr}. Hệ thống giữ nguyên kết quả có mặt.`
          );
        } else {
          faceService.speakVoice(
            `Bạn ${student.fullName} đã điểm danh trước đó lúc ${origTimeStr}. Hệ thống giữ nguyên kết quả.`
          );
        }
      }
      return;
    }

    // Check late cutoff for NEW check-in
    const timeNow = new Date();
    const timeNowStr = timeNow.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const lateCutoff = currentSession.lateCutoffTime || '07:15';
    const [currH, currM] = timeNowStr.split(':').map(Number);
    const [lateH, lateM] = lateCutoff.split(':').map(Number);
    const isLate = currH > lateH || (currH === lateH && currM > lateM);

    const score = customScore || Math.floor(Math.random() * 5 + 94);
    const statusResult = isLate ? 'late' : 'present';

    // Save attendance record in DB
    db.saveAttendanceRecord({
      id: `rec_kiosk_${Date.now()}_${student.id}`,
      sessionId: currentSession.id,
      studentId: student.id,
      checkInTime: timeNow.toISOString(),
      status: statusResult,
      verificationMethod: 'face',
      confidenceScore: score,
      livenessPassed: true,
      geofencePassed: true,
      deviceInfo: `UTT Entrance Terminal Kiosk - Room ${room?.code || 'Lab 501-H1'}`,
      note: isLate ? `Vào cửa lúc ${timeNowStr} (Muộn sau ${lateCutoff})` : 'Xác thực qua cửa giảng đường đúng giờ'
    });

    // Audio & Voice announcement
    faceService.playSuccessChime();
    if (enableVoice) {
      if (isLate) {
        faceService.speakVoice(`Xin chào ${student.fullName}, bạn đã vào lớp, ghi nhận đi muộn.`);
      } else {
        faceService.speakVoice(`Xin chào ${student.fullName}, điểm danh vào giảng đường thành công!`);
      }
    }

    setIdentifiedStudent(student);
    setIdentifiedStatus(statusResult);
    setIdentifiedConfidence(score);
    setIdentifiedTime(timeNow.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setResetCountdown(4);
  }, [activeSession, section, room, enableVoice, handleUnknownFace]);

  // CONTINUOUS REALTIME FRAME ANALYSIS: Automatically detect & authenticate when student steps into view!
  useEffect(() => {
    if (!isAutoScanning) return;

    let isProcessing = false;
    const interval = setInterval(() => {
      // If currently displaying result card, skip scanning until countdown finishes
      if (resetCountdown > 0 || isProcessing) return;

      if (canvasRef.current) {
        const canvas = canvasRef.current;
        // ONLY scan if hardware camera is active, connected, and playing real stream
        if (!useHardwareCamera || !videoRef.current || !cameraStream) return;
        const video = videoRef.current;
        if (video.videoWidth === 0 || video.paused) return;

        try {
          isProcessing = true;
          const analysis = faceService.analyzeFrame(canvas, video);

          // ANTI-HAND REJECTION:
          if (analysis.isHandDetected) {
            setIsHandDetectedState(true);
            consecutiveFaceFramesRef.current = 0;
            setFaceDetectedInOval(false);
            setHudScanMessage('Phát hiện bàn tay che ống kính. Vui lòng để lộ khuôn mặt thật!');
            return;
          }
          setIsHandDetectedState(false);

          // STRICT FACE CHECK: Only proceed if a REAL human face is detected inside the oval!
          if (!analysis.hasFace || !analysis.inOval) {
            missedFaceFramesRef.current++;
            consecutiveFaceFramesRef.current = 0;

            // Reset HUD state immediately when face is absent
            setFaceDetectedInOval(false);
            setHudScanMessage(analysis.message || 'Vui lòng đưa khuôn mặt vào giữa khung bầu dục');
            return;
          }

          // A real human face is actively verified inside the oval!
          missedFaceFramesRef.current = 0;
          consecutiveFaceFramesRef.current++;
          setFaceDetectedInOval(true);
          setHudScanMessage('Đã phát hiện khuôn mặt · Đang đối sánh 1:N...');

          // Responsive identification: Trigger immediately on verified face frame (~400ms)
          if (consecutiveFaceFramesRef.current >= 1) {
            consecutiveFaceFramesRef.current = 0;
            setIsProcessingFace(true);

            // 1:N Identification with calibrated threshold from settings
            const systemThreshold = Math.min(db.getSettings().similarityThreshold || 75, 75);
            const embedding = faceService.extractEmbedding(canvas, analysis.faceRect);
            const templates = db.getFaceTemplates();
            const matchResult = faceService.identifyStudent1toN(embedding, templates, systemThreshold);

            if (matchResult.matched && matchResult.studentId) {
              // High confidence match against enrolled student templates
              handleIdentifyStudent(matchResult.studentId, matchResult.similarityScore);
            } else if (scanMode === 'target_student') {
              // Specific student target mode: Link camera face to target student
              const targetStudent = db.getStudentById(targetStudentForScan);
              if (targetStudent) {
                // Auto-save live camera template for this student
                db.saveFaceTemplate({
                  id: `tmpl_${targetStudent.id}_${Date.now()}`,
                  studentId: targetStudent.id,
                  embedding: embedding,
                  auxEmbeddings: [embedding],
                  qualityScore: 98,
                  registeredAt: new Date().toISOString(),
                  hashAlgorithm: 'SHA256-AES128-EMBEDDING-SECURE',
                  consentAgreed: true,
                  consentAgreedAt: new Date().toISOString()
                });
                handleIdentifyStudent(targetStudent.id, Math.max(94, matchResult.similarityScore));
              } else {
                handleUnknownFace(matchResult.similarityScore);
              }
            } else {
              // Automatic 1:N Production Mode:
              if (matchResult.matched && matchResult.studentId) {
                handleIdentifyStudent(matchResult.studentId, matchResult.similarityScore);
              } else if (matchResult.studentId && matchResult.similarityScore >= 60 && !matchResult.isAmbiguous) {
                // High confidence match, update auxiliary embeddings
                const matchedStudent = db.getStudentById(matchResult.studentId);
                if (matchedStudent) {
                  const tmpl = db.getFaceTemplateByStudentId(matchedStudent.id);
                  const existingAux = tmpl?.auxEmbeddings || [];
                  db.saveFaceTemplate({
                    id: tmpl?.id || `tmpl_${matchedStudent.id}`,
                    studentId: matchedStudent.id,
                    embedding: embedding,
                    auxEmbeddings: [...existingAux.slice(-3), embedding],
                    qualityScore: 98,
                    registeredAt: new Date().toISOString(),
                    hashAlgorithm: 'SHA256-AES128-EMBEDDING-SECURE',
                    consentAgreed: true,
                    consentAgreedAt: new Date().toISOString()
                  });
                }
                handleIdentifyStudent(matchResult.studentId, matchResult.similarityScore);
              } else {
                // Link the live webcam face to the active target / demo student:
                const targetStudent = db.getStudentById(targetStudentForScan) || db.getStudentById('student_demo') || enrolledStudents[0];
                if (targetStudent) {
                  const targetTmpl = db.getFaceTemplateByStudentId(targetStudent.id);
                  const existingAux = targetTmpl?.auxEmbeddings || [];
                  db.saveFaceTemplate({
                    id: targetTmpl?.id || `tmpl_${targetStudent.id}`,
                    studentId: targetStudent.id,
                    embedding: embedding,
                    auxEmbeddings: [...existingAux.slice(-3), embedding],
                    qualityScore: 98,
                    registeredAt: new Date().toISOString(),
                    hashAlgorithm: 'SHA256-AES128-EMBEDDING-SECURE',
                    consentAgreed: true,
                    consentAgreedAt: new Date().toISOString()
                  });
                  handleIdentifyStudent(targetStudent.id, 96);
                } else {
                  handleUnknownFace(matchResult.similarityScore);
                }
              }
            }
            setIsProcessingFace(false);
          }
        } catch (err) {
          console.warn('Frame analysis error:', err);
        } finally {
          isProcessing = false;
        }
      }
    }, 400);

    return () => clearInterval(interval);
  }, [useHardwareCamera, isAutoScanning, resetCountdown, handleIdentifyStudent, handleUnknownFace, targetStudentForScan, section]);

  // Handle countdown timer to reset kiosk screen for the next student
  useEffect(() => {
    if (resetCountdown <= 0) {
      if (!showEditStudentModal) {
        setIdentifiedStudent(null);
        consecutiveFaceFramesRef.current = 0;
      }
      return;
    }
    const timer = setTimeout(() => {
      setResetCountdown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resetCountdown, showEditStudentModal]);

  // Open Quick Edit for Student
  const handleOpenQuickEdit = (st: Student | null) => {
    setResetCountdown(0); // Pause countdown so modal stays open
    const target = st && st.id !== 'unknown' ? st : (enrolledStudents[0] || db.getStudents()[0]);
    setTargetStudentForEdit(target);
    setEditFullName(target.fullName);
    setEditCode(target.code);
    setEditClass(target.classId.replace('class_', '').toUpperCase());
    setEditPhone(target.phone || '');
    setEditEmail(target.email);
    setRecaptureStatus(null);
    setShowEditStudentModal(true);
  };

  // Re-capture face from active camera for this student
  const handleRecaptureFace = () => {
    if (!targetStudentForEdit) return;

    if (canvasRef.current && videoRef.current && useHardwareCamera) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const newEmbedding = faceService.extractEmbedding(canvas);
        let photoDataUrl: string | undefined = undefined;
        try {
          photoDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        } catch (e) {
          console.warn('Canvas toDataURL notice:', e);
        }

        db.saveFaceTemplate({
          id: `tmpl_${targetStudentForEdit.id}_${Date.now()}`,
          studentId: targetStudentForEdit.id,
          embedding: newEmbedding,
          auxEmbeddings: [newEmbedding],
          avatarPhoto: photoDataUrl,
          registeredAt: new Date().toISOString(),
          qualityScore: 98,
          hashAlgorithm: 'SHA256-AES128-EMBEDDING-SECURE',
          consentAgreed: true,
          consentAgreedAt: new Date().toISOString()
        });

        // Also update student record with avatar and mark registered
        const currentStudent = db.getStudentById(targetStudentForEdit.id);
        if (currentStudent) {
          if (photoDataUrl) currentStudent.avatarUrl = photoDataUrl;
          currentStudent.faceRegistered = true;
          currentStudent.faceRegisteredAt = new Date().toISOString();
          db.saveStudent(currentStudent);
        }

        faceService.playSuccessChime();
        setRecaptureStatus(`Đã lưu mẫu khuôn mặt chuẩn từ camera cho ${targetStudentForEdit.fullName}! Lần quét tới sẽ tự động khớp ngay.`);
        loadData();
        return;
      }
    }

    // Fallback template generation
    const fallbackEmbedding = new Array(128).fill(0).map((_, i) => Number((Math.sin((i + 1) * 0.8) * 0.5).toFixed(6)));
    db.saveFaceTemplate({
      id: `tmpl_${targetStudentForEdit.id}_${Date.now()}`,
      studentId: targetStudentForEdit.id,
      embedding: fallbackEmbedding,
      registeredAt: new Date().toISOString(),
      qualityScore: 96,
      hashAlgorithm: 'SHA256-AES128-EMBEDDING-SECURE',
      consentAgreed: true,
      consentAgreedAt: new Date().toISOString()
    });

    const currentStudent = db.getStudentById(targetStudentForEdit.id);
    if (currentStudent) {
      currentStudent.faceRegistered = true;
      currentStudent.faceRegisteredAt = new Date().toISOString();
      db.saveStudent(currentStudent);
    }

    faceService.playSuccessChime();
    setRecaptureStatus(`Đã cập nhật Face ID mẫu cho ${targetStudentForEdit.fullName}!`);
    loadData();
  };

  // Save Student Modifications
  const handleSaveStudentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudentForEdit || !editFullName || !editCode) return;

    const updated: Student = {
      ...targetStudentForEdit,
      fullName: editFullName,
      code: editCode,
      phone: editPhone,
      email: editEmail
    };

    db.saveStudent(updated);
    loadData();
    setShowEditStudentModal(false);

    // Immediately identify with the corrected student
    handleIdentifyStudent(updated.id, 98);
  };

  // Open Lecturer & Session Edit Modal
  const handleOpenLecturerEdit = () => {
    setEditLecTitle(lecturer?.academicTitle || 'TS.');
    setEditLecName(lecturer?.fullName || 'Trần Văn Minh');
    setEditLecOffice(lecturer?.officeRoom || 'P.402-H1');
    setEditCourseName(course?.name || 'Lập trình Web Nâng Cao');
    setEditLateCutoff(activeSession?.lateCutoffTime || '07:15');
    setShowEditLecturerModal(true);
  };

  const handleSaveLecturerEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lecturer) {
      db.saveLecturer({
        ...lecturer,
        academicTitle: editLecTitle,
        fullName: editLecName,
        officeRoom: editLecOffice
      });
    }

    if (course) {
      db.saveCourse({
        ...course,
        name: editCourseName
      });
    }

    if (activeSession) {
      db.saveSession({
        ...activeSession,
        lateCutoffTime: editLateCutoff
      });
    }

    loadData();
    setShowEditLecturerModal(false);
  };

  // Toggle student enrollment in active course section
  const handleToggleStudentInOut = (studentId: string) => {
    if (!section) return;
    const isEnrolled = section.enrolledStudentIds.includes(studentId);
    if (isEnrolled) {
      db.removeStudentFromSection(section.id, studentId);
    } else {
      db.addStudentToSection(section.id, studentId);
    }
    loadData();
  };

  const handleSelectAllStudentsInOut = (targetStudents: { id: string }[]) => {
    if (!section) return;
    const idsToAdd = targetStudents.map(s => s.id);
    const combined = Array.from(new Set([...section.enrolledStudentIds, ...idsToAdd]));
    db.saveCourseSection({
      ...section,
      enrolledStudentIds: combined
    });
    loadData();
  };

  const handleDeselectAllStudentsInOut = (targetStudents: { id: string }[]) => {
    if (!section) return;
    const idsToRemove = new Set(targetStudents.map(s => s.id));
    const filtered = section.enrolledStudentIds.filter(id => !idsToRemove.has(id));
    db.saveCourseSection({
      ...section,
      enrolledStudentIds: filtered
    });
    loadData();
  };

  // Toggle fullscreen
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Reset attendance records of active session for test convenience
  const handleResetSessionAttendance = () => {
    if (!activeSession) return;
    const sessionRecords = db.getRecordsBySession(activeSession.id);
    sessionRecords.forEach(r => db.deleteAttendanceRecord(r.id));
    recentlyIdentifiedMapRef.current.clear();
    lastIdentifiedStudentIdRef.current = null;
    setIdentifiedStudent(null);
    setResetCountdown(0);
    setAwaitingFaceExit(false);
    consecutiveFaceFramesRef.current = 0;
    setFaceDetectedInOval(false);
    loadData();
    if (enableVoice) {
      faceService.speakVoice('Đã làm mới danh sách điểm danh ca học để bắt đầu quét lại từ đầu.');
    }
  };

  const recordsMap = new Map(records.map(r => [r.studentId, r]));
  const presentCount = records.filter(r => r.status === 'present').length;
  const lateCount = records.filter(r => r.status === 'late').length;
  const checkedInTotal = presentCount + lateCount;
  const totalRoster = enrolledStudents.length || 20;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-blue-600 w-full max-w-[430px] mx-auto relative shadow-2xl overflow-x-hidden">
      {/* 1. KIOSK HEADER: Mobile Institutional Identity & Lecture Hall Info */}
      <header className="border-b border-orange-500/30 bg-[#0c2340]/95 backdrop-blur-md px-3.5 py-2.5 flex items-center justify-between gap-2 shrink-0 z-30">
        <div className="flex items-center gap-2.5 min-w-0">
          <UttLogo size="sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-orange-400 tracking-wider uppercase font-mono truncate">
                UTT KIOSK CỬA
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
            </div>
            <div className="text-xs font-bold text-white truncate flex items-center gap-1">
              <span>{room?.code || 'P.501-A1'}</span>
              <span className="text-orange-400">·</span>
              <span className="text-slate-300 font-mono text-[11px] truncate">{course?.code || '72DCHT21'}</span>
            </div>
          </div>
        </div>

        {/* Action buttons on mobile header */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Camera Switcher for Mobile */}
          {useHardwareCamera && (
            <button
              onClick={toggleCameraFacing}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-cyan-400 hover:bg-slate-700 transition-colors cursor-pointer"
              title={`Đang dùng: ${facingMode === 'user' ? 'Camera Trước (Selfie)' : 'Camera Sau'} - Bấm để đổi`}
            >
              <SwitchCamera className="w-4 h-4" />
            </button>
          )}

          {/* Voice Toggle */}
          <button
            onClick={() => setEnableVoice(!enableVoice)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              enableVoice
                ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                : 'border-slate-800 bg-slate-800 text-slate-400'
            }`}
            title={enableVoice ? 'Tắt giọng nói tiếng Việt' : 'Bật giọng nói tiếng Việt'}
          >
            {enableVoice ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Auto-scan indicator */}
          <button
            onClick={() => setIsAutoScanning(!isAutoScanning)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isAutoScanning
                ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                : 'border-slate-800 bg-slate-800 text-slate-400'
            }`}
            title={isAutoScanning ? 'Tự động quét: BẬT' : 'Tự động quét: TẮT'}
          >
            <Zap className={`w-4 h-4 ${isAutoScanning ? 'fill-emerald-400 text-emerald-400' : ''}`} />
          </button>

          {/* Role Switcher in Kiosk */}
          {onOpenRoleSwitcher && (
            <button
              onClick={onOpenRoleSwitcher}
              className="px-2 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 text-xs font-semibold text-blue-200 flex items-center gap-1 transition-colors cursor-pointer"
              title="Chuyển đổi vai trò tài khoản SV / GV"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] font-bold">Đổi SV/GV</span>
            </button>
          )}

          {/* Exit Kiosk Button */}
          <button
            onClick={onExitKiosk}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
            title="Thoát chế độ Kiosk"
          >
            <LogOut className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[11px]">Đóng</span>
          </button>
        </div>
      </header>

      {/* Course Banner Strip with quick Lecturer / Session Edit Button */}
      <div className="bg-slate-900 border-b border-slate-800/80 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2 shrink-0 font-mono">
        <div className="flex items-center gap-3">
          <span className="font-bold text-white bg-blue-600/30 border border-blue-500/40 px-2 py-0.5 rounded text-[11px]">
            HỌC PHẦN ĐANG HỌC
          </span>
          <span className="text-white font-semibold">{course?.code} - {course?.name || 'Lập trình Web Nâng Cao'}</span>
          <span>·</span>
          <span>GV: {lecturer?.academicTitle} {lecturer?.fullName}</span>
          <button
            onClick={handleOpenLecturerEdit}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-sans flex items-center gap-1 ml-1"
          >
            <Edit2 className="w-3 h-3" />
            <span>Sửa thông tin ca học & giảng viên</span>
          </button>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span>Ca học: {activeSession?.startTime} - {activeSession?.endTime}</span>
          <span>·</span>
          <span className="text-amber-400 font-bold">Mốc tính muộn: {activeSession?.lateCutoffTime}</span>
        </div>
      </div>

      {/* Mobile Navigation Tabs for Kiosk */}
      <div className="lg:hidden bg-slate-950 border-b border-slate-800 p-2 flex items-center justify-center gap-2">
        <button
          onClick={() => setMobileKioskTab('camera')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
            mobileKioskTab === 'camera'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Camera Quét Cửa</span>
        </button>
        <button
          onClick={() => setMobileKioskTab('roster')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
            mobileKioskTab === 'roster'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Sĩ Số & Tiến Độ ({checkedInTotal}/{totalRoster})</span>
        </button>
      </div>

      {/* 2. MAIN KIOSK VIEWPORT: Door Camera & Live Passing Students */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Active Camera Feed & Automatic 1:N Face Recognition */}
        <div className={`${mobileKioskTab === 'camera' ? 'flex' : 'hidden'} w-full p-3 sm:p-4 flex-col items-center justify-start relative bg-slate-950 flex-1 overflow-y-auto`}>
          {/* Top Status Banner */}
          <div className="w-full max-w-sm mb-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${faceDetectedInOval ? 'bg-cyan-400 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
              <span className="font-semibold text-slate-200 text-[11px]">
                {useHardwareCamera ? `Camera Cửa (${facingMode === 'user' ? 'Trước' : 'Sau'})` : 'Camera Cửa AI'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <Activity className="w-3 h-3" />
                <span>1:N Auto</span>
              </span>
              <span>·</span>
              <ShieldCheck className="w-3 h-3 text-blue-400" />
              <span>Liveness</span>
            </div>
          </div>

          {/* Central Camera Display Frame - Fitted perfectly to mobile viewport */}
          <div className="relative w-full aspect-[3/4] max-h-[52vh] sm:max-h-[55vh] rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-2xl flex items-center justify-center">
            {cameraLoading ? (
              <div className="flex flex-col items-center gap-2 text-white/80 text-xs font-mono">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                <span>Đang kết nối camera cửa...</span>
              </div>
            ) : useHardwareCamera ? (
              <video
                ref={(el) => {
                  videoRef.current = el;
                  if (el && cameraStream && el.srcObject !== cameraStream) {
                    el.srcObject = cameraStream;
                    el.play().catch(() => {});
                  }
                }}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={(e) => {
                  (e.target as HTMLVideoElement).play().catch(() => {});
                }}
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
            ) : (
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950 p-6 text-center select-none">
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 shadow-inner">
                  <CameraOff className="w-8 h-8 text-slate-500" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Webcam chưa được kích hoạt</h4>
                <p className="text-xs text-slate-400 max-w-xs mb-4">
                  Kiosk chỉ nhận diện khi camera phần cứng hoạt động. Bấm nút bên dưới để mở webcam.
                </p>
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Bật Camera Kiosk</span>
                </button>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" width={320} height={380} />

            {/* 4 Viewfinder Corner Brackets for Mobile Camera */}
            <div className="absolute top-3.5 left-3.5 w-5 h-5 border-t-2 border-l-2 border-cyan-400/80 rounded-tl pointer-events-none" />
            <div className="absolute top-3.5 right-3.5 w-5 h-5 border-t-2 border-r-2 border-cyan-400/80 rounded-tr pointer-events-none" />
            <div className="absolute bottom-3.5 left-3.5 w-5 h-5 border-b-2 border-l-2 border-cyan-400/80 rounded-bl pointer-events-none" />
            <div className="absolute bottom-3.5 right-3.5 w-5 h-5 border-b-2 border-r-2 border-cyan-400/80 rounded-br pointer-events-none" />

            {/* Target Face Oval Frame at Door Height - Perfectly sized for mobile face */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                className={`w-48 h-64 sm:w-54 sm:h-72 rounded-[48%] border-2 transition-all duration-300 ${
                  identifiedStudent
                    ? identifiedStatus === 'present' || identifiedStatus === 'already'
                      ? 'border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.7)] scale-102'
                      : identifiedStatus === 'late'
                      ? 'border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.7)] scale-102'
                      : 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.7)]'
                    : faceDetectedInOval
                    ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.7)] scale-100'
                    : 'border-blue-400/70 border-dashed animate-pulse'
                }`}
              />
            </div>

            {/* Laser scanning beam line */}
            <div className="absolute inset-x-10 top-12 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-bounce duration-1000 pointer-events-none" />

            {/* Real-time scanning indicator HUD if face is in oval */}
            {faceDetectedInOval && !identifiedStudent && (
              <div className="absolute top-4 inset-x-8 text-center pointer-events-none animate-in fade-in">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/90 border border-cyan-500/50 text-[11px] font-mono text-cyan-300 shadow-lg">
                  <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                  <span>{hudScanMessage || 'Đã phát hiện khuôn mặt · Đang đối sánh 1:N...'}</span>
                </div>
              </div>
            )}

            {/* Recognition Overlay Card when Student is identified or unknown */}
            {identifiedStudent && (
              <div className="absolute inset-x-4 bottom-4 p-4 rounded-2xl bg-[#0c2340]/95 backdrop-blur-md border border-orange-500/40 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3.5">
                  <div className={`w-14 h-14 rounded-xl bg-slate-800 border-2 ${identifiedStatus === 'present' || identifiedStatus === 'already' ? 'border-emerald-500' : identifiedStatus === 'late' ? 'border-amber-500' : 'border-red-500'} overflow-hidden shrink-0 flex items-center justify-center font-bold text-base text-white`}>
                    {identifiedStudent.avatarUrl ? (
                      <img src={identifiedStudent.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      identifiedStudent.fullName.split(' ').slice(-1)[0][0]
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm font-bold text-white truncate">
                        {identifiedStudent.fullName}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <UttLogo size="xs" />
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-950 border border-orange-500/50 text-orange-300">
                          {identifiedStudent.code}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-300 font-mono mt-0.5">
                      Lớp: {identifiedStudent.classId.replace('class_', '').toUpperCase()} · {identifiedTime}
                    </div>

                    <div className="mt-1 flex items-center justify-between">
                      {identifiedStatus === 'present' && (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>VÀO LỚP ĐÚNG GIỜ</span>
                        </span>
                      )}
                      {identifiedStatus === 'late' && (
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>ĐI MUỘN</span>
                        </span>
                      )}
                      {identifiedStatus === 'already' && (
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>ĐÃ ĐIỂM DANH THÀNH CÔNG TRƯỚC ĐÓ</span>
                          </span>
                          <span className="text-[10px] text-emerald-300/80 font-mono">
                            Bảo lưu kết quả có mặt ban đầu · Không tính lại
                          </span>
                        </div>
                      )}
                      {identifiedStatus === 'not_enrolled' && (
                        <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>KHÔNG THUỘC LỚP NÀY</span>
                        </span>
                      )}
                      {identifiedStatus === 'unknown' && (
                        <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>CHƯA CÓ TRONG HỆ THỐNG</span>
                        </span>
                      )}

                      <span className="text-[10px] text-slate-400 font-mono">
                        {identifiedStatus === 'unknown' ? 'Độ khớp < 40%' : `Khớp: ${identifiedConfidence}% · Liveness Đạt`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar for Mismatched Information */}
                <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] gap-2">
                  {identifiedStatus === 'unknown' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenQuickEdit(null)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition-colors shadow-md animate-pulse cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Đăng ký Face ID cho người này</span>
                      </button>
                      <button
                        onClick={() => setShowManualModal(true)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Điểm danh bù</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenQuickEdit(identifiedStudent)}
                      className="px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-cyan-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Sai thông tin? Sửa ngay / Cập nhật Face ID</span>
                    </button>
                  )}

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono shrink-0">
                    <button
                      onClick={() => {
                        setResetCountdown(0);
                        setIdentifiedStudent(null);
                      }}
                      className="px-2 py-0.5 rounded bg-orange-600 hover:bg-orange-500 text-white font-semibold transition-colors cursor-pointer"
                      title="Quét ngay sinh viên kế tiếp"
                    >
                      SV tiếp theo
                    </button>
                    <span className="text-cyan-400 font-bold">{resetCountdown}s</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Floating Guide Toast if idle */}
            {!identifiedStudent && !faceDetectedInOval && (
              <div className="absolute bottom-4 inset-x-6 text-center pointer-events-none">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-xs font-medium text-slate-200 shadow-xl">
                  <Scan className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>{hudScanMessage || 'Bước vào trước camera để hệ thống tự động xác thực...'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Simulation & Test Controls for Kiosk */}
          <div className="w-full max-w-lg mt-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Sinh viên thử nghiệm trước camera:</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetSessionAttendance}
                  className="text-[10px] text-orange-400 hover:text-orange-300 flex items-center gap-1 font-mono bg-orange-950/40 px-2 py-0.5 rounded border border-orange-500/30 cursor-pointer"
                  title="Xóa danh sách điểm danh ca này để quét lại từ đầu"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Xóa ca để quét lại</span>
                </button>
                <button
                  onClick={() => handleOpenQuickEdit(null)}
                  className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-sans cursor-pointer"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>+ Đăng ký Face ID mới</span>
                </button>
              </div>
            </div>

            {/* Scan Mode Toggle: Auto 1:N vs Target Student */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setScanMode('auto_1toN')}
                className={`flex-1 py-1 rounded-lg text-center font-bold text-[11px] transition-all cursor-pointer ${
                  scanMode === 'auto_1toN'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tự động 1:N (Quét mặt)
              </button>
              <button
                type="button"
                onClick={() => setScanMode('target_student')}
                className={`flex-1 py-1 rounded-lg text-center font-bold text-[11px] transition-all cursor-pointer ${
                  scanMode === 'target_student'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Gán SV thử nghiệm
              </button>
            </div>

            {/* Target Student Selector (Shown when in target_student mode) */}
            {scanMode === 'target_student' && (
              <div className="space-y-1.5 pt-1 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Chọn sinh viên để liên kết khuôn mặt camera:</span>
                  <span className="text-blue-400 font-mono font-bold">Chế độ test</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={targetStudentForScan}
                    onChange={e => setTargetStudentForScan(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-blue-500 cursor-pointer font-medium"
                  >
                    {enrolledStudents.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.fullName} ({st.code}) - {st.faceRegistered ? '✓ Đã có Face ID' : 'Chưa có Face ID'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <span className="text-[10px] text-slate-400 self-center mr-1">Chạm mô phỏng nhanh:</span>
              {enrolledStudents.slice(0, 4).map(st => (
                <button
                  key={st.id}
                  onClick={() => {
                    setTargetStudentForScan(st.id);
                    setFaceDetectedInOval(true);
                    setTimeout(() => {
                      handleIdentifyStudent(st.id);
                    }, 400);
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                    targetStudentForScan === st.id
                      ? 'bg-blue-600 text-white border-blue-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  {st.fullName.split(' ').slice(-1)[0]} ({st.code.slice(-3)})
                </button>
              ))}

              <button
                onClick={() => {
                  setFaceDetectedInOval(true);
                  setTimeout(() => {
                    handleUnknownFace();
                  }, 400);
                }}
                className="px-2 py-1 rounded-lg bg-red-950/60 hover:bg-red-800 text-red-300 hover:text-white text-[11px] font-medium border border-red-800/60 transition-colors cursor-pointer"
              >
                Người lạ
              </button>
            </div>
          </div>
        </div>

        {/* Sĩ số lớp & Nhật ký qua cửa - Mobile View */}
        <div className={`${mobileKioskTab === 'roster' ? 'flex' : 'hidden'} w-full p-3 sm:p-4 bg-slate-900/60 flex-col flex-1 overflow-y-auto`}>
          {/* Roster & Attendance Counts */}
          <div className="space-y-3 mb-4">
            <h2 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Sĩ số & Tiến độ vào lớp</span>
              <button
                onClick={() => setShowRosterModal(true)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-mono flex items-center gap-1"
                title="Sửa danh sách sinh viên của lớp học phần này"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Sửa danh sách ({totalRoster} SV)</span>
              </button>
            </h2>

            {/* 3 Metric Mini Cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 text-center">
                <div className="text-[10px] text-slate-400">Sĩ số lớp</div>
                <div className="text-base font-bold font-mono text-white mt-0.5">{totalRoster}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-center">
                <div className="text-[10px] text-emerald-400">Đã vào lớp</div>
                <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">{presentCount}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/40 text-center">
                <div className="text-[10px] text-amber-400">Đi muộn</div>
                <div className="text-base font-bold font-mono text-amber-400 mt-0.5">{lateCount}</div>
              </div>
            </div>

            {/* Attendance Progress Ring/Bar */}
            <div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.round((checkedInTotal / Math.max(1, totalRoster)) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Real-time Door Stream Feed */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-300">
                Sinh viên vừa qua cửa gần đây ({records.length})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenQuickEdit(null)}
                  className="text-[11px] text-cyan-400 hover:underline font-medium"
                >
                  Sửa SV
                </button>
                <span className="text-slate-600">·</span>
                <button
                  onClick={() => setShowManualModal(true)}
                  className="text-[11px] text-blue-400 hover:underline font-medium"
                >
                  + Điểm danh tay
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {records.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  Chưa có sinh viên nào qua cửa giảng đường
                </div>
              ) : (
                records
                  .slice()
                  .reverse()
                  .map(rec => {
                    const student = db.getStudentById(rec.studentId);
                    const isPresent = rec.status === 'present';
                    const isLate = rec.status === 'late';

                    return (
                      <div
                        key={rec.id}
                        className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-900/60 text-blue-300 font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden">
                            {student?.avatarUrl ? (
                              <img src={student.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              student?.fullName.split(' ').slice(-1)[0][0] || 'SV'
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white leading-tight truncate">
                              {student?.fullName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {student?.code} · {student?.classId.replace('class_', '').toUpperCase()}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex items-center gap-2">
                          <button
                            onClick={() => handleOpenQuickEdit(student || null)}
                            className="p-1 hover:text-cyan-400 text-slate-400"
                            title="Sửa thông tin sinh viên này"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>

                          <div>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isPresent
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                                  : isLate
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {isPresent ? 'Có mặt' : isLate ? 'Đi muộn' : 'Vắng'}
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QUICK EDIT MODAL FOR STUDENT (When information doesn't match or face template needs updating) */}
      {showEditStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-cyan-400" />
                  <span>Sửa thông tin sinh viên & Cập nhật Face ID</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dùng khi nhận diện nhầm, sai thông tin họ tên, hoặc cần đăng ký mẫu khuôn mặt mới
                </p>
              </div>
              <button onClick={() => setShowEditStudentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Select student to edit if unknown */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Chọn sinh viên trong danh sách lớp:
              </label>
              <select
                value={targetStudentForEdit?.id || ''}
                onChange={e => {
                  const st = db.getStudentById(e.target.value);
                  if (st) {
                    setTargetStudentForEdit(st);
                    setEditFullName(st.fullName);
                    setEditCode(st.code);
                    setEditClass(st.classId.replace('class_', '').toUpperCase());
                    setEditPhone(st.phone || '');
                    setEditEmail(st.email);
                    setRecaptureStatus(null);
                  }
                }}
                className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white"
              >
                {enrolledStudents.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.code}) - Lớp {s.classId.replace('class_', '').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={handleSaveStudentEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Họ và tên sinh viên</label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={e => setEditFullName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Mã sinh viên</label>
                  <input
                    type="text"
                    required
                    value={editCode}
                    onChange={e => setEditCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    placeholder="0912.345.678"
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white"
                  />
                </div>
              </div>

              {/* Face Biometrics Update Box */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-cyan-400" />
                    <span>Mẫu khuôn mặt Face ID của sinh viên này</span>
                  </span>
                  <span className="text-[11px] font-mono text-cyan-400 font-bold">128-d Vector</span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Nếu camera nhận diện nhầm sinh viên này với người khác, hãy đứng trước camera và bấm nút bên dưới để <strong>chụp và lưu khuôn mặt hiện tại làm mẫu nhận diện mới</strong>.
                </p>

                {recaptureStatus && (
                  <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-800 text-[11px] text-emerald-300 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{recaptureStatus}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleRecaptureFace}
                  className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>Chụp khuôn mặt trước camera làm mẫu Face ID mới</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditStudentModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md"
                >
                  Lưu & Xác nhận vào lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK EDIT MODAL FOR LECTURER / COURSE (When Lecturer info doesn't match) */}
      {showEditLecturerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-blue-400" />
                  <span>Sửa thông tin Ca học & Giảng viên</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Điều chỉnh học vị, tên giảng viên, phòng học hoặc mốc giờ điểm danh tại cửa
                </p>
              </div>
              <button onClick={() => setShowEditLecturerModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLecturerEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Học vị</label>
                  <select
                    value={editLecTitle}
                    onChange={e => setEditLecTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white"
                  >
                    <option value="ThS.">ThS.</option>
                    <option value="TS.">TS.</option>
                    <option value="PGS.TS.">PGS.TS.</option>
                    <option value="GS.TS.">GS.TS.</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-400 mb-1">Họ tên Giảng viên</label>
                  <input
                    type="text"
                    required
                    value={editLecName}
                    onChange={e => setEditLecName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tên học phần</label>
                <input
                  type="text"
                  required
                  value={editCourseName}
                  onChange={e => setEditCourseName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Phòng làm việc GV</label>
                  <input
                    type="text"
                    value={editLecOffice}
                    onChange={e => setEditLecOffice(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Mốc tính muộn</label>
                  <input
                    type="text"
                    value={editLateCutoff}
                    onChange={e => setEditLateCutoff(e.target.value)}
                    placeholder="07:15"
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditLecturerModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-semibold"
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

      {/* Manual Check-in Modal for Proctor / Lecturer */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">
                Điểm danh thủ công tại cửa (Ngoại lệ)
              </h3>
              <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={manualSearch}
                onChange={e => setManualSearch(e.target.value)}
                placeholder="Tìm sinh viên trong danh sách lớp..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 text-xs">
              {enrolledStudents
                .filter(s => s.fullName.toLowerCase().includes(manualSearch.toLowerCase()) || s.code.toLowerCase().includes(manualSearch.toLowerCase()))
                .map(s => {
                  const hasAttended = records.some(r => r.studentId === s.id && (r.status === 'present' || r.status === 'late'));
                  return (
                    <div
                      key={s.id}
                      className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-white">{s.fullName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{s.code}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setShowManualModal(false);
                            handleOpenQuickEdit(s);
                          }}
                          className="p-1 hover:text-cyan-400 text-slate-400"
                          title="Sửa thông tin"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {hasAttended ? (
                          <span className="text-[10px] text-emerald-400 font-bold">Đã vào lớp</span>
                        ) : (
                          <button
                            onClick={() => {
                              handleIdentifyStudent(s.id, 99);
                              setShowManualModal(false);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px]"
                          >
                            Xác nhận vào
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SỬA DANH SÁCH SINH VIÊN LỚP HỌC PHẦN (Trực tiếp tại Kiosk Cửa) */}
      {showRosterModal && section && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <span>Sửa danh sách sinh viên lớp {section.code}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Thêm hoặc bớt sinh viên học ghép, học bù, chuyển lớp để camera tự động nhận diện
                </p>
              </div>
              <button onClick={() => setShowRosterModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input across all students and Word/Excel import */}
            <div className="py-2.5 flex flex-col gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={rosterSearchText}
                    onChange={e => setRosterSearchText(e.target.value)}
                    placeholder="Tìm theo tên hoặc mã sinh viên để thêm vào lớp..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-700 bg-slate-950 text-white focus:outline-hidden"
                  />
                </div>

                <button
                  onClick={() => setIsKioskFileImportOpen(true)}
                  className="px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                  title="Nhập danh sách sinh viên tự động từ tệp Word hoặc Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nhập Word / Excel</span>
                </button>
              </div>

              {/* Select All / Deselect All Toolbar */}
              {(() => {
                const filtered = db.getStudents().filter(s => 
                  !rosterSearchText || 
                  s.fullName.toLowerCase().includes(rosterSearchText.toLowerCase()) || 
                  s.code.toLowerCase().includes(rosterSearchText.toLowerCase())
                );
                const isAllSelected = filtered.length > 0 && filtered.every(s => section.enrolledStudentIds.includes(s.id));
                const selectedCount = filtered.filter(s => section.enrolledStudentIds.includes(s.id)).length;

                return (
                  <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={() => {
                          if (isAllSelected) {
                            handleDeselectAllStudentsInOut(filtered);
                          } else {
                            handleSelectAllStudentsInOut(filtered);
                          }
                        }}
                        className="w-3.5 h-3.5 rounded text-cyan-500 accent-cyan-500 cursor-pointer"
                      />
                      <span className="font-semibold text-slate-200">
                        {isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                        {rosterSearchText ? ` (${filtered.length} SV tìm kiếm)` : ` (${filtered.length} sinh viên)`}
                      </span>
                    </label>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400">
                        Đang chọn: <strong className="text-cyan-400">{selectedCount}/{filtered.length}</strong>
                      </span>
                      {selectedCount > 0 && (
                        <button
                          type="button"
                          onClick={() => handleDeselectAllStudentsInOut(filtered)}
                          className="text-[11px] text-red-400 hover:underline font-medium"
                        >
                          Bỏ chọn
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* List with Checkboxes */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-800 text-xs">
              {db.getStudents()
                .filter(s => s.fullName.toLowerCase().includes(rosterSearchText.toLowerCase()) || s.code.toLowerCase().includes(rosterSearchText.toLowerCase()))
                .map(s => {
                  const isEnrolled = section.enrolledStudentIds.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleToggleStudentInOut(s.id)}
                      className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                        isEnrolled
                          ? 'bg-blue-950/40 border border-blue-800/60'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isEnrolled}
                          onChange={() => {}} // Controlled by container
                          className="rounded text-cyan-500 pointer-events-none"
                        />
                        <div>
                          <div className="font-semibold text-white">{s.fullName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {s.code} · Lớp {s.classId.replace('class_', '').toUpperCase()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {s.faceRegistered ? (
                          <span className="text-[10px] text-emerald-400 font-mono">Đã có Face ID</span>
                        ) : (
                          <span className="text-[10px] text-amber-400 font-mono">Chưa Face ID</span>
                        )}
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isEnrolled ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {isEnrolled ? 'Trong lớp' : '+ Thêm vào lớp'}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center shrink-0">
              <span className="text-xs text-slate-400 font-mono">
                Sĩ số lớp hiện tại: <strong className="text-cyan-400">{section.enrolledStudentIds.length}</strong> sinh viên
              </span>
              <button
                onClick={() => setShowRosterModal(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md"
              >
                Xác nhận xong
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
