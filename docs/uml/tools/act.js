// 14 Activity Diagram – UML 2.x (partition, initial, action, decision/merge, guard, activity final)
module.exports = function (L, P, M, log) {
  const U = 0, S = 1, G = 2;
  const MAIN = -135, ERR0 = 25, RIGHT = 300, CW = 7.9;
  const LANES2 = (u) => [{ name: u, w: 270 }, { name: "Hệ thống", w: 620 }];
  const LANES3 = (u) => [{ name: u, w: 270 }, { name: "Hệ thống", w: 620 }, { name: "Google Gemini", w: 240 }];

  // node helpers: [id, type, lane, row, col(dx), label]
  function build(code, title, lanes, list, flows, notes) {
    log('act ' + code);
    const nodes = {};
    for (const [id, t, lane, row, dx, label] of list) {
      const n = { t, lane, row, dx: typeof dx === "number" ? dx : 0, label };
      if (t === "a") {
        n.w = Math.max(110, Math.ceil(L.textW(label, CW)) + 30); n.h = 38;
        const lim = lane === S ? (dx === "E" ? 230 : 282) : 262;
        if (n.w > lim) log(`WARN ${code} label too long: ${label}`);
      }
      if (dx === "M") n.dx = MAIN;
      if (dx === "E") n.dx = ERR0 + (n.w || 30) / 2;
      n._col = dx;
      nodes[id] = n;
    }
    for (const n of Object.values(nodes)) {
      if (n._col !== "F") continue;
      const e = Object.values(nodes).find((m) => m._col === "E" && m.lane === n.lane && m.row === n.row);
      n.dx = e ? e.dx + e.w / 2 + 30 : 250;
    }
    const pk = L.pkg(P.act, code);
    const d = L.activity(pk, { name: `${code} Activity – ${title}`, activityName: `${code} ${title}`, lanes, nodes, flows, rowH: 58 });
    (notes || []).forEach(([text, x, y, w, h]) => L.note(pk, d, text, x, y, w, h));
    return d;
  }
  const a = (id, lane, row, dx, label, w) => [id, "a", lane, row, dx, label, w];
  const dec = (id, lane, row, dx) => [id, "dec", lane, row, dx];
  const mer = (id, lane, row, dx) => [id, "merge", lane, row, dx];
  const ini = (id, lane, row, dx) => [id, "init", lane, row, dx];
  const fin = (id, lane, row, dx) => [id, "final", lane, row, dx];
  const X = 20 + 270 + 620 + 20; // vị trí ghi chú bên phải (2 lane)

  // ---------------------------------------------------------------- UC001
  build("UC001", "Đăng nhập, đăng xuất", LANES2("Người dùng"), [
    ini("i", U, 0), a("a1", U, 1, 0, "Mở trang đăng nhập"), mer("m1", U, 2), a("a2", U, 3, 0, "Nhập email, mật khẩu"), a("a3", U, 4, 0, "Nhấn Đăng nhập"),
    a("s1", S, 4, "M", "Kiểm tra dữ liệu đầu vào"), dec("d1", S, 5, "M"), a("e1", S, 5, "E", "Hiển thị lỗi nhập liệu"), mer("mE", S, 2, "E"),
    a("s2", S, 6, "M", "Tra cứu tài khoản theo email"), a("s3", S, 7, "M", "Kiểm tra mật khẩu (hash)"), dec("d2", S, 8, "M"),
    a("e2", S, 8, "E", "Báo đăng nhập thất bại"), a("s4", S, 9, "M", "Tạo session (user_id, role)"), a("s5", S, 10, "M", "Điều hướng tới Dashboard"),
    a("a4", U, 11, 0, "Chọn Đăng xuất"), a("s6", S, 12, "M", "Xóa session"), a("s7", S, 13, "M", "Hiển thị trang đăng nhập"), fin("f", S, 14, "M"),
  ], [
    ["i", "a1"], ["a1", "m1"], ["m1", "a2"], ["a2", "a3"], ["a3", "s1"], ["s1", "d1"],
    ["d1", "e1", "Dữ liệu trống"], ["d1", "s2", "Dữ liệu hợp lệ"], ["e1", "mE"], ["mE", "m1"],
    ["s2", "s3"], ["s3", "d2"], ["d2", "e2", "Sai thông tin xác thực"], ["d2", "s4", "Thông tin xác thực đúng"],
    ["e2", "mE", null, { sx: RIGHT }], ["s4", "s5"], ["s5", "a4"], ["a4", "s6"], ["s6", "s7"], ["s7", "f"],
  ]);

  // ---------------------------------------------------------------- UC002
  build("UC002", "Quản lý vị trí tuyển dụng", LANES2("HR / ADMIN / MANAGER"), [
    ini("i", U, 0), a("a1", U, 1, 0, "Mở danh sách vị trí"), dec("d0", U, 2),
    a("a2", U, 3, 0, "Nhập từ khóa / lọc trạng thái"), a("s2", S, 3, "M", "Truy vấn vị trí theo bộ lọc"), a("s3", S, 4, "M", "Hiển thị danh sách kết quả"), fin("f3", S, 5, "M"),
    a("a4", U, 7, 0, "Chọn Thêm hoặc Sửa"), a("s4", S, 7, "M", "Kiểm tra quyền (ADMIN/HR)"), dec("d4", S, 8, "M"), a("e4", S, 8, "E", "Từ chối truy cập (403)"), fin("f4", S, 8, "F"),
    mer("m5", U, 9), a("a5", U, 10, 0, "Nhập / chỉnh dữ liệu vị trí"), a("s5", S, 10, "M", "Kiểm tra dữ liệu"), dec("d5", S, 11, "M"), a("e5", S, 11, "E", "Hiển thị lỗi (400)"),
    a("s6", S, 12, "M", "Lưu vị trí"), a("s7", S, 13, "M", "Hiển thị chi tiết vị trí"), fin("f7", S, 14, "M"),
    a("a8", U, 16, 0, "Chọn Xóa vị trí"), a("s8", S, 16, "M", "Kiểm tra quyền (ADMIN/HR)"), dec("d8", S, 17, "M"), a("e8", S, 17, "E", "Từ chối truy cập (403)"), fin("f8", S, 17, "F"),
    a("s9", S, 18, "M", "Kiểm tra hồ sơ liên kết"), dec("d9", S, 19, "M"), a("e9", S, 19, "E", "Không cho xóa (409)"), fin("f9", S, 19, "F"),
    a("s10", S, 20, "M", "Xóa vị trí"), fin("f10", S, 21, "M"),
  ], [
    ["i", "a1"], ["a1", "d0"], ["d0", "a2", "Xem / Tìm kiếm"], ["a2", "s2"], ["s2", "s3"], ["s3", "f3"],
    ["d0", "a4", "Thêm / Sửa", { sx: -112, lane: U }], ["a4", "s4"], ["s4", "d4"], ["d4", "e4", "Không có quyền"], ["e4", "f4"], ["d4", "m5", "Có quyền", "hv"],
    ["m5", "a5"], ["a5", "s5"], ["s5", "d5"], ["d5", "e5", "Không hợp lệ"], ["e5", "m5", null, "vh"], ["d5", "s6", "Hợp lệ"], ["s6", "s7"], ["s7", "f7"],
    ["d0", "a8", "Xóa", { sx: -120, lane: U }], ["a8", "s8"], ["s8", "d8"], ["d8", "e8", "Không có quyền"], ["e8", "f8"], ["d8", "s9", "Có quyền"],
    ["s9", "d9"], ["d9", "e9", "Có hồ sơ liên kết"], ["e9", "f9"], ["d9", "s10", "Không có hồ sơ liên kết"], ["s10", "f10"],
  ], [["MANAGER chỉ thực hiện nhánh\n[Xem / Tìm kiếm]; nhánh Thêm/Sửa\nvà Xóa bị từ chối (403).", X, 60, 230, 58]]);

  // ---------------------------------------------------------------- UC003
  build("UC003", "Quản lý ứng viên và CV", LANES2("HR / ADMIN"), [
    ini("i", U, 0), a("a1", U, 1, 0, "Mở danh sách ứng viên"), dec("d0", U, 2),
    mer("m1", U, 3), a("a2", U, 4, 0, "Nhập thông tin ứng viên"), a("a3", U, 5, 0, "Chọn file CV (tùy chọn)"), a("a4", U, 6, 0, "Nhấn Lưu"),
    a("s1", S, 6, "M", "Kiểm tra dữ liệu ứng viên"), dec("d1", S, 7, "M"), a("e1", S, 7, "E", "Hiển thị lỗi dữ liệu"), mer("mE", S, 3, "E"),
    dec("d2", S, 8, "M"), a("s2", S, 9, "M", "Kiểm tra định dạng, dung lượng"), dec("d3", S, 10, "M"), a("e3", S, 10, "E", "Báo lỗi file CV"),
    a("s3", S, 11, "M", "Lưu file tên uuid_tênfile"), a("s4", S, 12, "M", "Trích xuất văn bản PDF/DOCX"), mer("m2", S, 13, "M"),
    a("s5", S, 14, "M", "Lưu / cập nhật ứng viên"), a("s6", S, 15, "M", "Hiển thị chi tiết ứng viên"), fin("f6", S, 16, "M"),
    a("a7", U, 18, 0, "Chọn Xóa ứng viên"), a("s7", S, 18, "M", "Kiểm tra hồ sơ liên kết"), dec("d7", S, 19, "M"),
    a("e7", S, 19, "E", "Không cho xóa (409)"), fin("f7", S, 19, "F"), a("s8", S, 20, "M", "Xóa ứng viên"), fin("f8", S, 21, "M"),
  ], [
    ["i", "a1"], ["a1", "d0"], ["d0", "m1", "Thêm / Sửa"], ["m1", "a2"], ["a2", "a3"], ["a3", "a4"], ["a4", "s1"], ["s1", "d1"],
    ["d1", "e1", "Không hợp lệ"], ["e1", "mE"], ["mE", "m1"], ["d1", "d2", "Hợp lệ"],
    ["d2", "s2", "Có file CV"], ["d2", "m2", "Không có file CV", { sx: -245 }], ["s2", "d3"], ["d3", "e3", "Sai định dạng / quá 10 MB"],
    ["e3", "mE", null, { sx: RIGHT }], ["d3", "s3", "Hợp lệ"], ["s3", "s4"], ["s4", "m2"], ["m2", "s5"], ["s5", "s6"], ["s6", "f6"],
    ["d0", "a7", "Xóa", { sx: -112, lane: U }], ["a7", "s7"], ["s7", "d7"], ["d7", "e7", "Có hồ sơ liên kết"], ["e7", "f7"],
    ["d7", "s8", "Không có hồ sơ liên kết"], ["s8", "f8"],
  ], [["MANAGER chỉ được xem danh sách,\nchi tiết ứng viên và file CV.", X, 60, 220, 44]]);

  // ---------------------------------------------------------------- UC004
  build("UC004", "Tạo hồ sơ ứng tuyển", LANES2("HR / ADMIN"), [
    ini("i", U, 0), a("a1", U, 1, 0, "Mở Tạo hồ sơ ứng tuyển"), mer("m1", U, 2), a("a2", U, 3, 0, "Chọn ứng viên, vị trí"), a("a3", U, 4, 0, "Nhấn Tạo"),
    a("s1", S, 4, "M", "Kiểm tra ứng viên, vị trí"), dec("d1", S, 5, "M"), a("e1", S, 5, "E", "Báo không tìm thấy"), mer("mE", S, 2, "E"),
    a("s2", S, 6, "M", "Kiểm tra trùng candidate + job"), dec("d2", S, 7, "M"), a("e2", S, 7, "E", "Báo hồ sơ trùng (409)"),
    a("s3", S, 8, "M", "Tạo Application trạng thái NEW"), a("s4", S, 9, "M", "Hiển thị chi tiết hồ sơ"), fin("f", S, 10, "M"),
  ], [
    ["i", "a1"], ["a1", "m1"], ["m1", "a2"], ["a2", "a3"], ["a3", "s1"], ["s1", "d1"], ["d1", "e1", "Không tồn tại"], ["e1", "mE"], ["mE", "m1"],
    ["d1", "s2", "Tồn tại"], ["s2", "d2"], ["d2", "e2", "Đã tồn tại"], ["e2", "mE", null, { sx: RIGHT }], ["d2", "s3", "Chưa tồn tại"], ["s3", "s4"], ["s4", "f"],
  ]);

  // ---------------------------------------------------------------- UC005
  build("UC005", "Cập nhật trạng thái hồ sơ", LANES2("HR / ADMIN"), [
    ini("i", U, 0), a("a1", U, 1, 0, "Mở chi tiết hồ sơ"), a("a2", U, 2, 0, "Chọn trạng thái tiếp theo"), a("a3", U, 3, 0, "Nhấn Xác nhận chuyển"),
    a("s1", S, 3, "M", "Kiểm tra quyền"), dec("d1", S, 4, "M"), a("e1", S, 4, "E", "Từ chối (403)"), fin("f1", S, 4, "F"),
    a("s2", S, 5, "M", "Đọc trạng thái hiện tại"), dec("d2", S, 6, "M"), a("e2", S, 6, "E", "Báo không tìm thấy"), fin("f2", S, 6, "F"),
    a("s3", S, 7, "M", "Đối chiếu ALLOWED_TRANSITIONS"), dec("d3", S, 8, "M"), a("e3", S, 8, "E", "Báo chuyển không hợp lệ"), fin("f3", S, 8, "F"),
    a("s4", S, 9, "M", "Cập nhật applications.status"), a("s5", S, 10, "M", "Hiển thị trạng thái mới"), fin("f", S, 11, "M"),
  ], [
    ["i", "a1"], ["a1", "a2"], ["a2", "a3"], ["a3", "s1"], ["s1", "d1"], ["d1", "e1", "Không có quyền"], ["e1", "f1"], ["d1", "s2", "Có quyền"],
    ["s2", "d2"], ["d2", "e2", "Không tìm thấy"], ["e2", "f2"], ["d2", "s3", "Tìm thấy"], ["s3", "d3"], ["d3", "e3", "Không hợp lệ"], ["e3", "f3"],
    ["d3", "s4", "Hợp lệ"], ["s4", "s5"], ["s5", "f"],
  ], [["Chuyển hợp lệ: NEW → SCREENING | REJECTED;\nSCREENING → INTERVIEW | REJECTED;\nINTERVIEW → PASSED | REJECTED.\nPASSED, REJECTED là trạng thái cuối.\nAI, phỏng vấn, đánh giá không tự\nchuyển trạng thái hồ sơ.", X, 60, 250, 100]]);

  // ---------------------------------------------------------------- UC006
  build("UC006", "Quản lý lịch phỏng vấn", LANES2("HR / ADMIN / MANAGER"), [
    ini("i", U, 0), a("a1", U, 1, 0, "Mở Lịch phỏng vấn"), dec("d0", U, 2),
    a("a2", U, 3, 0, "Nhập thông tin lịch phỏng vấn"), a("s1", S, 3, "M", "Kiểm tra quyền (ADMIN/HR)"), dec("d1", S, 4, "M"), a("e1", S, 4, "E", "Từ chối (403)"), fin("f1", S, 4, "F"),
    a("s2", S, 5, "M", "Kiểm tra dữ liệu lịch phỏng vấn"), dec("d2", S, 6, "M"), a("e2", S, 6, "E", "Báo lỗi (400 / 404)"), fin("f2", S, 6, "F"),
    a("s3", S, 7, "M", "Tạo Interview (SCHEDULED)"), fin("f3", S, 8, "M"),
    a("a4", U, 10, 0, "Chọn Sửa lịch"), a("s4", S, 10, "M", "Kiểm tra quyền (ADMIN/HR)"), dec("d4", S, 11, "M"), a("e4", S, 11, "E", "Từ chối (403)"), fin("f4", S, 11, "F"),
    dec("d5", S, 12, "M"), a("e5", S, 12, "E", "Báo không sửa được"), fin("f5", S, 12, "F"),
    a("s6", S, 13, "M", "Cập nhật thời gian, địa điểm"), fin("f6", S, 14, "M"),
    a("a7", U, 16, 0, "Chọn Hoàn thành hoặc Hủy"), a("s7", S, 16, "M", "Kiểm tra quyền theo vai trò"), dec("d7", S, 17, "M"), a("e7", S, 17, "E", "Từ chối (403)"), fin("f7", S, 17, "F"),
    dec("d8", S, 18, "M"), a("e8", S, 18, "E", "Báo không thể chuyển"), fin("f8", S, 18, "F"),
    a("s9", S, 19, "M", "Cập nhật COMPLETED / CANCELLED"), fin("f9", S, 20, "M"),
  ], [
    ["i", "a1"], ["a1", "d0"], ["d0", "a2", "Tạo lịch"], ["a2", "s1"], ["s1", "d1"], ["d1", "e1", "MANAGER"], ["e1", "f1"], ["d1", "s2", "ADMIN / HR"],
    ["s2", "d2"], ["d2", "e2", "Không hợp lệ"], ["e2", "f2"], ["d2", "s3", "Hợp lệ"], ["s3", "f3"],
    ["d0", "a4", "Sửa lịch", { sx: -112, lane: U }], ["a4", "s4"], ["s4", "d4"], ["d4", "e4", "MANAGER"], ["e4", "f4"], ["d4", "d5", "ADMIN / HR"],
    ["d5", "e5", "Đã kết thúc"], ["e5", "f5"], ["d5", "s6", "SCHEDULED"], ["s6", "f6"],
    ["d0", "a7", "Hoàn thành / Hủy", { sx: -120, lane: U }], ["a7", "s7"], ["s7", "d7"],
    ["d7", "e7", "Không có quyền"], ["e7", "f7"], ["d7", "d8", "Có quyền"],
    ["d8", "e8", "Không từ SCHEDULED"], ["e8", "f8"], ["d8", "s9", "Từ SCHEDULED"], ["s9", "f9"],
  ], [["Chỉ cho phép SCHEDULED → COMPLETED\nhoặc SCHEDULED → CANCELLED;\nkhông có chuyển ngược. Hoàn thành\nphỏng vấn không đổi trạng thái hồ sơ.\nQuyền Hoàn thành: ADMIN, HR, MANAGER\nđược giao; quyền Hủy: ADMIN, HR.", X, 60, 240, 72]]);

  // ---------------------------------------------------------------- UC007
  build("UC007", "Đánh giá ứng viên", LANES2("ADMIN / HR / MANAGER"), [
    ini("i", U, 0), a("a1", U, 1, 0, "Mở đánh giá của hồ sơ"), dec("d0", U, 2),
    mer("m1", U, 3), a("a2", U, 4, 0, "Nhập 3 điểm và nhận xét"), a("a3", U, 5, 0, "Nhấn Lưu"),
    a("s1", S, 5, "M", "Kiểm tra điểm nguyên 1..5"), dec("d1", S, 6, "M"), a("e1", S, 6, "E", "Hiển thị lỗi điểm (400)"),
    a("s2", S, 7, "M", "Kiểm tra hồ sơ tồn tại"), dec("d2", S, 8, "M"), a("e2", S, 8, "E", "Báo không tìm thấy"), fin("f2", S, 8, "F"),
    a("s3", S, 9, "M", "Lưu Evaluation (evaluator)"), a("s4", S, 10, "M", "Hiển thị điểm trung bình"), fin("f4", S, 11, "M"),
    a("a5", U, 13, 0, "Chọn Sửa đánh giá"), a("s5", S, 13, "M", "Kiểm tra người tạo / ADMIN"), dec("d5", S, 14, "M"), a("e5", S, 14, "E", "Từ chối (403)"), fin("f5", S, 14, "F"),
    a("s6", S, 15, "M", "Kiểm tra điểm 1..5"), dec("d6", S, 16, "M"), a("e6", S, 16, "E", "Báo lỗi điểm (400)"), fin("f6", S, 16, "F"),
    a("s7", S, 17, "M", "Cập nhật Evaluation"), fin("f7", S, 18, "M"),
  ], [
    ["i", "a1"], ["a1", "d0"], ["d0", "m1", "Thêm đánh giá"], ["m1", "a2"], ["a2", "a3"], ["a3", "s1"], ["s1", "d1"],
    ["d1", "e1", "Có điểm không hợp lệ"], ["e1", "m1", null, "vh"], ["d1", "s2", "Hợp lệ"], ["s2", "d2"], ["d2", "e2", "Không tồn tại"], ["e2", "f2"],
    ["d2", "s3", "Tồn tại"], ["s3", "s4"], ["s4", "f4"],
    ["d0", "a5", "Sửa đánh giá", { sx: -112, lane: U }], ["a5", "s5"], ["s5", "d5"], ["d5", "e5", "Không phải người tạo / ADMIN"], ["e5", "f5"],
    ["d5", "s6", "Có quyền"], ["s6", "d6"], ["d6", "e6", "Không hợp lệ"], ["e6", "f6"], ["d6", "s7", "Hợp lệ"], ["s7", "f7"],
  ], [["Điểm trung bình tính khi hiển thị,\nkhông lưu trong CSDL.", X, 60, 220, 44]]);

  // ---------------------------------------------------------------- AI (UC008, UC009)
  function aiSimple(code, title, btn, prompt, output, typ) {
    build(code, title, LANES3("Người dùng"), [
      ini("i", U, 0), a("a1", U, 1, 0, btn), a("s1", S, 1, "M", "Đọc hồ sơ, CV, mô tả công việc"), dec("d1", S, 2, "M"),
      a("e1", S, 2, "E", "Báo lỗi (404 / 400)"), fin("f1", S, 2, "F"),
      a("s2", S, 3, "M", prompt), a("s3", S, 4, "M", "Gửi yêu cầu tới Gemini"), a("g1", G, 4, 0, output),
      dec("d2", S, 5, "M"), a("e2", S, 5, "E", "Báo lỗi thân thiện (500)"), fin("f2", S, 5, "F"),
      a("s4", S, 6, "M", `Lưu AIResult (${typ})`), a("s5", S, 7, "M", "Hiển thị kết quả tham khảo"), a("a2", U, 8, 0, "Xem / sao chép kết quả"), fin("f", U, 9, 0),
    ], [
      ["i", "a1"], ["a1", "s1"], ["s1", "d1"], ["d1", "e1", "Thiếu hồ sơ hoặc CV"], ["e1", "f1"], ["d1", "s2", "Ngữ cảnh đầy đủ"], ["s2", "s3"],
      ["s3", "g1"], ["g1", "d2", null, { midRow: 4.55 }], ["d2", "e2", "Gemini lỗi"], ["e2", "f2"], ["d2", "s4", "Gemini thành công"],
      ["s4", "s5"], ["s5", "a2"], ["a2", "f"],
    ], [["Không cập nhật applications.status;\nAI chỉ hỗ trợ tham khảo.", 20 + 270 + 620 + 240 + 20, 60, 220, 44]]);
  }
  aiSimple("UC008", "AI tóm tắt CV", "Nhấn Tóm tắt CV", "Tạo prompt an toàn", "Sinh bản tóm tắt 4 phần", "CV_SUMMARY");
  aiSimple("UC009", "AI gợi ý câu hỏi phỏng vấn", "Nhấn Gợi ý câu hỏi", "Tạo prompt: đúng 5 câu hỏi", "Sinh 5 câu hỏi phỏng vấn", "INTERVIEW_QUESTION");

  // ---------------------------------------------------------------- UC010
  build("UC010", "AI soạn email", LANES3("HR / ADMIN"), [
    ini("i", U, 0), a("a1", U, 1, 0, "Chọn loại email"), a("a2", U, 2, 0, "Nhấn Tạo email"),
    a("s1", S, 2, "M", "Kiểm tra quyền (ADMIN/HR)"), dec("d1", S, 3, "M"), a("e1", S, 3, "E", "Từ chối (403)"), fin("f1", S, 3, "F"),
    a("s2", S, 4, "M", "Đọc hồ sơ ứng tuyển"), dec("d2", S, 5, "M"),
    a("s3", S, 6, "M", "Lấy lịch phỏng vấn gần nhất"), dec("d3", S, 6, "E"), a("e3", S, 7, "E", "Báo lỗi (400)"), fin("f3", S, 7, "F"),
    mer("m2", S, 8, "M"), a("s5", S, 9, "M", "Tạo prompt email tiếng Việt"), a("s6", S, 10, "M", "Gửi yêu cầu tới Gemini"),
    a("g1", G, 10, 0, "Sinh tiêu đề + nội dung"), dec("d4", S, 11, "M"), a("e4", S, 11, "E", "Báo lỗi (500)"), fin("f4", S, 11, "F"),
    a("s7", S, 12, "M", "Lưu AIResult (EMAIL)"), a("s8", S, 13, "M", "Hiển thị bản nháp email"), a("a3", U, 14, 0, "Sao chép bản nháp"), fin("f", U, 15, 0),
  ], [
    ["i", "a1"], ["a1", "a2"], ["a2", "s1"], ["s1", "d1"], ["d1", "e1", "MANAGER"], ["e1", "f1"], ["d1", "s2", "ADMIN / HR"], ["s2", "d2"],
    ["d2", "s3", "INTERVIEW_INVITATION"], ["d2", "d3", "RESULT", "hv"], ["d3", "e3", "Chưa PASSED / REJECTED"], ["e3", "f3"],
    ["d3", "m2", "PASSED / REJECTED", { sx: RIGHT }], ["s3", "m2"], ["m2", "s5"], ["s5", "s6"], ["s6", "g1"], ["g1", "d4", null, { midRow: 10.55 }],
    ["d4", "e4", "Gemini lỗi"], ["e4", "f4"], ["d4", "s7", "Gemini thành công"], ["s7", "s8"], ["s8", "a3"], ["a3", "f"],
  ], [["Hệ thống chỉ tạo bản nháp,\nkhông gửi email qua SMTP.", 20 + 270 + 620 + 240 + 20, 60, 200, 44]]);

  // ---------------------------------------------------------------- UC011
  build("UC011", "Xem lịch sử kết quả AI", LANES2("Người dùng"), [
    ini("i", U, 0), a("a1", U, 1, 0, "Mở chi tiết hồ sơ ứng tuyển"), a("s1", S, 1, "M", "Truy vấn ai_results của hồ sơ"),
    a("s2", S, 2, "M", "Sắp xếp mới nhất trước"), dec("d1", S, 3, "M"), a("e1", S, 3, "E", "Hiển thị danh sách trống"), fin("f1", S, 3, "F"),
    a("s3", S, 4, "M", "Hiển thị lịch sử AI"), a("a2", U, 5, 0, "Chọn Xem một kết quả"), a("s4", S, 6, "M", "Hiển thị nội dung đã lưu"), fin("f", S, 7, "M"),
  ], [
    ["i", "a1"], ["a1", "s1"], ["s1", "s2"], ["s2", "d1"], ["d1", "e1", "Chưa có kết quả"], ["e1", "f1"], ["d1", "s3", "Có kết quả"],
    ["s3", "a2"], ["a2", "s4"], ["s4", "f"],
  ], [["Chỉ đọc dữ liệu đã lưu,\nkhông gọi Google Gemini.", X, 60, 200, 44]]);

  // ---------------------------------------------------------------- UC012
  build("UC012", "Xem Dashboard thống kê", LANES2("Người dùng"), [
    ini("i", U, 0), a("a1", U, 1, 0, "Mở Bảng điều khiển"), a("s1", S, 1, "M", "Kiểm tra phiên đăng nhập"), dec("d0", S, 2, "M"),
    a("e0", S, 2, "E", "Về trang đăng nhập (401)"), fin("f0", S, 2, "F"),
    a("s2", S, 3, "M", "Truy vấn số liệu tổng hợp"), dec("d1", S, 4, "M"), a("e1", S, 4, "E", "Báo lỗi tải dữ liệu"), fin("f1", S, 4, "F"),
    a("s3", S, 5, "M", "Đếm các chỉ số tổng hợp"), a("s4", S, 6, "M", "Phân bố trạng thái, nguồn"),
    a("s5", S, 7, "M", "Tính tỷ lệ trúng tuyển"), a("s6", S, 8, "M", "Đánh dấu time-to-hire chưa đủ"),
    a("s7", S, 9, "M", "Hiển thị Dashboard"), a("a2", U, 10, 0, "Xem Dashboard"), fin("f", U, 11, 0),
  ], [
    ["i", "a1"], ["a1", "s1"], ["s1", "d0"], ["d0", "e0", "Chưa đăng nhập"], ["e0", "f0"], ["d0", "s2", "Đã đăng nhập"], ["s2", "d1"],
    ["d1", "e1", "Lỗi CSDL"], ["e1", "f1"], ["d1", "s3", "Thành công"], ["s3", "s4"], ["s4", "s5"], ["s5", "s6"], ["s6", "s7"], ["s7", "a2"], ["a2", "f"],
  ], [["Tỷ lệ = PASSED / (PASSED + REJECTED),\n= 0% khi chưa có hồ sơ kết thúc.\nTime-to-hire không được tính vì schema\nchỉ lưu applied_at (không tạo số liệu giả).", X, 60, 260, 58]]);

  // ---------------------------------------------------------------- UC013
  build("UC013", "Hỏi đáp Chatbot tuyển dụng", LANES3("Người dùng"), [
    ini("i", U, 0), a("a1", U, 1, 0, "Nhập câu hỏi và gửi"), a("s1", S, 1, "M", "Kiểm tra câu hỏi (1..1000 ký tự)"), dec("d1", S, 2, "M"),
    a("e1", S, 2, "E", "Báo lỗi (400)"), fin("f1", S, 2, "F"),
    a("s2", S, 3, "M", "Scope Guard: kiểm tra phạm vi"), dec("d2", S, 4, "M"), a("e2", S, 4, "E", "Từ chối: ngoài phạm vi"), fin("f2", S, 4, "F"),
    a("s3", S, 5, "M", "Intent Router + Decision Guard"), dec("d3", S, 6, "M"), a("e3", S, 6, "E", "Từ chối quyết định tuyển"), fin("f3", S, 6, "F"),
    dec("d4", S, 7, "M"), a("t1", S, 8, "E", "Truy vấn SQL định sẵn"), a("t2", S, 9, "E", "Định dạng kết quả"),
    a("h1", S, 8, "M", "Lọc ứng viên theo trạng thái"), mer("mR", S, 9, "M"),
    a("s5", S, 10, "M", "Kiểm tra chỉ mục FAISS"), dec("d5", S, 11, "M"), a("e5", S, 11, "E", "Báo chưa có chỉ mục"), fin("f5", S, 11, "F"),
    a("s6", S, 12, "M", "Nhúng câu hỏi (chuẩn hóa L2)"), a("s7", S, 13, "M", "Tìm FAISS, lọc cosine ≥ 0.25"), dec("d6", S, 14, "M"),
    a("e6", S, 14, "E", "Đề nghị làm rõ câu hỏi"), fin("f6", S, 14, "F"),
    a("s8", S, 15, "M", "Xây dựng ngữ cảnh + nguồn"), a("s9", S, 16, "M", "Gửi prompt kèm ngữ cảnh"),
    a("g1", G, 16, 0, "Sinh câu trả lời"), a("s10", S, 17, "M", "Trả câu trả lời + nguồn"), mer("mA", S, 18, "M"),
    a("a2", U, 19, 0, "Xem câu trả lời và nguồn"), fin("f", U, 20, 0),
  ], [
    ["i", "a1"], ["a1", "s1"], ["s1", "d1"], ["d1", "e1", "Rỗng hoặc quá dài"], ["e1", "f1"], ["d1", "s2", "Hợp lệ"], ["s2", "d2"],
    ["d2", "e2", "Ngoài phạm vi"], ["e2", "f2"], ["d2", "s3", "Trong phạm vi"], ["s3", "d3"], ["d3", "e3", "Yêu cầu xếp hạng / quyết định"], ["e3", "f3"],
    ["d3", "d4", "Câu hỏi tra cứu"], ["d4", "t1", "STRUCTURED", "hv"], ["t1", "t2"], ["d4", "h1", "HYBRID"], ["h1", "mR"], ["d4", "mR", "SEMANTIC", { sx: -295 }],
    ["mR", "s5"], ["s5", "d5"], ["d5", "e5", "Chưa có chỉ mục"], ["e5", "f5"], ["d5", "s6", "Có chỉ mục"], ["s6", "s7"], ["s7", "d6"],
    ["d6", "e6", "Không có ngữ cảnh"], ["e6", "f6"], ["d6", "s8", "Có ngữ cảnh"], ["s8", "s9"], ["s9", "g1"], ["g1", "s10", null, { midRow: 16.55 }],
    ["s10", "mA"], ["t2", "mA", null, { sx: RIGHT }], ["mA", "a2", null, "hv"], ["a2", "f"],
  ], [["LLM không sinh câu SQL; chỉ gọi hàm\ntruy vấn định sẵn, tham số hóa.\nSTRUCTURED trả lời không cần Gemini.\nNgưỡng cosine ≥ 0.25, top_k = 5.", 20 + 270 + 620 + 240 + 20, 60, 240, 72]]);

  // ---------------------------------------------------------------- UC014
  build("UC014", "Đồng bộ chỉ mục tri thức", LANES2("ADMIN"), [
    ini("i", U, 0), a("a1", U, 1, 0, "Mở Trợ lý AI"), a("a2", U, 2, 0, "Chọn Đồng bộ dữ liệu"), a("s1", S, 2, "M", "Kiểm tra vai trò"), dec("d1", S, 3, "M"),
    a("e1", S, 3, "E", "Từ chối (403)"), fin("f1", S, 3, "F"),
    a("s2", S, 4, "M", "Đọc bản ghi nguồn từ MySQL"), a("s3", S, 5, "M", "Xây dựng tài liệu tri thức"),
    a("s4", S, 6, "M", "Chia đoạn CV (1000 / 150)"), a("s5", S, 7, "M", "Sinh embedding chuẩn hóa L2"),
    a("s6", S, 8, "M", "Tạo FAISS IndexFlatIP"), a("s7", S, 9, "M", "Lưu tệp chỉ mục và metadata"), dec("d2", S, 10, "M"),
    a("e2", S, 10, "E", "Báo lỗi tái tạo (500)"), fin("f2", S, 10, "F"),
    a("s8", S, 11, "M", "Trả số tài liệu, thời điểm"), a("a3", U, 12, 0, "Xem thông tin chỉ mục"), fin("f", U, 13, 0),
  ], [
    ["i", "a1"], ["a1", "a2"], ["a2", "s1"], ["s1", "d1"], ["d1", "e1", "Không phải ADMIN"], ["e1", "f1"], ["d1", "s2", "ADMIN"],
    ["s2", "s3"], ["s3", "s4"], ["s4", "s5"], ["s5", "s6"], ["s6", "s7"], ["s7", "d2"], ["d2", "e2", "Có lỗi"], ["e2", "f2"], ["d2", "s8", "Thành công"],
    ["s8", "a3"], ["a3", "f"],
  ], [["Không gọi Google Gemini: dùng mô hình\nembedding cục bộ và FAISS.", X, 60, 240, 44]]);
};
