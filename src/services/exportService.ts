import { AttendanceRecord, AttendanceSession, Course, CourseSection, Student, Room } from '../types';

export class ExportService {
  /**
   * Export attendance data as CSV with UTF-8 BOM for Microsoft Excel compatibility
   */
  public static exportToCSV(
    session: AttendanceSession,
    course: Course,
    section: CourseSection,
    room: Room,
    students: Student[],
    records: AttendanceRecord[]
  ) {
    const recordsMap = new Map(records.map(r => [r.studentId, r]));

    const rows: string[][] = [
      ['TRƯỜNG ĐẠI HỌC CÔNG NGHỆ GIAO THÔNG VẬN TẢI - UTT'],
      ['BÁO CÁO KẾT QUẢ ĐIỂM DANH SINH VIÊN BẰNG KHUÔN MẶT'],
      [''],
      ['Mã phiên:', session.sessionCode],
      ['Học phần:', `${course.code} - ${course.name}`],
      ['Lớp học phần:', section.code],
      ['Phòng học:', room.code],
      ['Ngày điểm danh:', session.date],
      ['Khung giờ:', `${session.startTime} - ${session.endTime}`],
      ['Thời điểm tính muộn:', session.lateCutoffTime],
      [''],
      [
        'STT',
        'Mã sinh viên',
        'Họ và tên',
        'Lớp',
        'Thời gian điểm danh',
        'Trạng thái',
        'Phương thức',
        'Độ khớp Face (%)',
        'Liveness',
        'Ghi chú'
      ]
    ];

    students.forEach((s, idx) => {
      const rec = recordsMap.get(s.id);
      const timeStr = rec?.checkInTime
        ? new Date(rec.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : '-';

      let statusStr = 'Chưa điểm danh';
      if (rec?.status === 'present') statusStr = 'Có mặt';
      else if (rec?.status === 'late') statusStr = 'Đi muộn';
      else if (rec?.status === 'absent') statusStr = 'Vắng mặt';
      else if (rec?.status === 'excused') statusStr = 'Được miễn';

      let methodStr = '-';
      if (rec?.verificationMethod === 'face') methodStr = 'Nhận diện khuôn mặt';
      else if (rec?.verificationMethod === 'qr_fallback') methodStr = 'Mã QR dự phòng';
      else if (rec?.verificationMethod === 'manual') methodStr = 'Giảng viên duyệt tay';

      rows.push([
        (idx + 1).toString(),
        s.code,
        s.fullName,
        s.classId.replace('class_', '').toUpperCase(),
        timeStr,
        statusStr,
        methodStr,
        rec?.confidenceScore ? `${rec.confidenceScore}%` : '-',
        rec?.livenessPassed ? 'Đạt' : '-',
        rec?.note || ''
      ]);
    });

    const csvContent = '\uFEFF' + rows.map(r => r.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `UTT_Attendance_${session.sessionCode}_${session.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Generates a printable formatted PDF view
   */
  public static printAttendanceReport(
    session: AttendanceSession,
    course: Course,
    section: CourseSection,
    room: Room,
    students: Student[],
    records: AttendanceRecord[]
  ) {
    const recordsMap = new Map(records.map(r => [r.studentId, r]));

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;

    students.forEach(s => {
      const r = recordsMap.get(s.id);
      if (r?.status === 'present') presentCount++;
      else if (r?.status === 'late') lateCount++;
      else absentCount++;
    });

    const rowsHtml = students
      .map((s, idx) => {
        const rec = recordsMap.get(s.id);
        const timeStr = rec?.checkInTime
          ? new Date(rec.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          : '-';
        let statusBadge = '<span style="color:#64748b">Chưa điểm danh</span>';
        if (rec?.status === 'present') statusBadge = '<span style="color:#16a34a;font-weight:600">Có mặt</span>';
        else if (rec?.status === 'late') statusBadge = '<span style="color:#d97706;font-weight:600">Đi muộn</span>';
        else if (rec?.status === 'absent') statusBadge = '<span style="color:#dc2626;font-weight:600">Vắng</span>';

        return `
          <tr>
            <td style="text-align:center;padding:8px;border:1px solid #cbd5e1;">${idx + 1}</td>
            <td style="padding:8px;border:1px solid #cbd5e1;font-family:monospace;font-weight:600;">${s.code}</td>
            <td style="padding:8px;border:1px solid #cbd5e1;">${s.fullName}</td>
            <td style="text-align:center;padding:8px;border:1px solid #cbd5e1;">${timeStr}</td>
            <td style="text-align:center;padding:8px;border:1px solid #cbd5e1;">${statusBadge}</td>
            <td style="text-align:center;padding:8px;border:1px solid #cbd5e1;">${rec?.confidenceScore ? `${rec.confidenceScore}%` : '-'}</td>
            <td style="padding:8px;border:1px solid #cbd5e1;font-size:12px;color:#64748b;">${rec?.note || ''}</td>
          </tr>
        `;
      })
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Báo cáo điểm danh - ${session.sessionCode}</title>
          <style>
            body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; margin: 30px; color: #0f172a; line-height: 1.4; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
            .title { text-align: center; margin: 15px 0 25px 0; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px; font-size: 14px; background: #f8fafc; padding: 12px; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th { background: #f1f5f9; padding: 10px; border: 1px solid #cbd5e1; text-align: left; }
            .summary { margin-top: 20px; display: flex; gap: 30px; font-weight: 500; }
            .signatures { display: flex; justify-content: space-between; margin-top: 50px; text-align: center; }
            @media print {
              button { display: none; }
              body { margin: 10mm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <strong>BỘ GIAO THÔNG VẬN TẢI</strong><br>
              <strong>TRƯỜNG ĐH CÔNG NGHỆ GIAO THÔNG VẬN TẢI (UTT)</strong>
            </div>
            <div style="text-align: right;">
              <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br>
              <span style="font-size: 13px;">Độc lập - Tự do - Hạnh phúc</span>
            </div>
          </div>

          <div class="title">
            <h2 style="margin: 0; text-transform: uppercase;">BẢNG TỔNG HỢP ĐIỂM DANH SINH VIÊN</h2>
            <div style="color: #64748b; font-size: 13px; margin-top: 4px;">Hệ thống nhận dạng khuôn mặt & Liveness UTT Attendance</div>
          </div>

          <div class="meta-grid">
            <div><strong>Học phần:</strong> ${course.code} - ${course.name}</div>
            <div><strong>Phòng học:</strong> ${room.code} (${room.building})</div>
            <div><strong>Mã lớp HP:</strong> ${section.code}</div>
            <div><strong>Ngày học:</strong> ${session.date} (${session.startTime} - ${session.endTime})</div>
            <div><strong>Mã phiên:</strong> ${session.sessionCode}</div>
            <div><strong>Mốc tính muộn:</strong> ${session.lateCutoffTime}</div>
          </div>

          <div class="summary">
            <div>Tổng số SV: <strong>${students.length}</strong></div>
            <div style="color: #16a34a;">Có mặt: <strong>${presentCount}</strong> (${Math.round((presentCount / (students.length || 1)) * 100)}%)</div>
            <div style="color: #d97706;">Đi muộn: <strong>${lateCount}</strong></div>
            <div style="color: #dc2626;">Vắng: <strong>${absentCount}</strong></div>
          </div>

          <table style="margin-top: 15px;">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">STT</th>
                <th style="width: 110px;">Mã SV</th>
                <th>Họ và tên</th>
                <th style="width: 80px; text-align: center;">Giờ điểm danh</th>
                <th style="width: 100px; text-align: center;">Trạng thái</th>
                <th style="width: 70px; text-align: center;">Độ khớp</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="signatures">
            <div>
              <strong>BAN QUẢN LÝ ĐÀO TẠO</strong><br><br><br><br>
              <em>(Ký, ghi rõ họ tên)</em>
            </div>
            <div>
              <em>Hà Nội, ngày ${new Date().toLocaleDateString('vi-VN')}</em><br>
              <strong>GIẢNG VIÊN PHỤ TRÁCH</strong><br><br><br><br>
              <em>(Ký, ghi rõ họ tên)</em>
            </div>
          </div>

          <div style="margin-top: 40px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; font-weight: 600; background: #0284c7; color: white; border: none; border-radius: 6px; cursor: pointer;">
              In Báo Cáo / Xuất PDF
            </button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
}
