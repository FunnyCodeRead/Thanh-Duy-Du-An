// Dựng toàn bộ model UML "AI Recruitment System" trong StarUML
const path = require("path");
const DIR = __dirname;

module.exports = function (app, type, log) {
  for (const f of ["lib.js", "act.js", "seq.js", "classes.js"]) delete require.cache[require.resolve(path.join(DIR, f))];
  const L = require(path.join(DIR, "lib.js"))(app, type, log);
  const { F, pkg, klass, attr, op, relation, note } = L;

  try { app.diagrams.suspendRepaint(); } catch (e) {}
  const t0 = Date.now();
  const project = app.project.getProject();
  project.name = "AI Recruitment System";
  const root = pkg(project, "AI Recruitment System", "UMLModel");
  const P = {
    uc: pkg(root, "01 Use Case Model"),
    act: pkg(root, "02 Activity Diagrams"),
    seq: pkg(root, "03 Sequence Diagrams"),
    st: pkg(root, "04 State Machine"),
    dom: pkg(root, "05 Domain Model"),
    svc: pkg(root, "06 Service Model"),
    comp: pkg(root, "07 Component Model"),
  };
  const M = {}; // model elements dùng lại

  // =============================================================== 01 USE CASE
  log('01 USE CASE');
  {
    const d = F.createDiagram({ id: "UMLUseCaseDiagram", parent: P.uc, diagramInitializer: (x) => { x.name = "01 Use Case tổng quát"; } });
    const actor = (name, x, y) => F.createModelAndView({ id: "UMLActor", parent: P.uc, diagram: d, x1: x, y1: y, x2: x + 40, y2: y + 80, modelInitializer: (m) => { m.name = name; } });
    const bx = 250, bw = 520, top = 40, step = 60;
    const subj = F.createModelAndView({ id: "UMLUseCaseSubject", parent: P.uc, diagram: d, x1: bx, y1: top, x2: bx + bw, y2: top + 60 + 14 * step,
      modelInitializer: (m) => { m.name = "HỆ THỐNG QUẢN LÝ TUYỂN DỤNG CÓ TÍCH HỢP AI"; } });
    const order = [
      ["UC014", "Đồng bộ chỉ mục tri thức"], ["UC001", "Đăng nhập, đăng xuất"], ["UC012", "Xem Dashboard thống kê"],
      ["UC002", "Quản lý vị trí tuyển dụng"], ["UC003", "Quản lý ứng viên và CV"], ["UC006", "Quản lý lịch phỏng vấn"],
      ["UC007", "Đánh giá ứng viên"], ["UC004", "Tạo hồ sơ ứng tuyển"], ["UC005", "Cập nhật trạng thái hồ sơ"],
      ["UC011", "Xem lịch sử kết quả AI"], ["UC008", "AI tóm tắt CV"], ["UC009", "AI gợi ý câu hỏi phỏng vấn"],
      ["UC013", "Hỏi đáp Chatbot tuyển dụng"], ["UC010", "AI soạn email"],
    ];
    const UC = {};
    order.forEach(([code, name], i) => {
      const y = top + 50 + i * step;
      UC[code] = F.createModelAndView({ id: "UMLUseCase", parent: subj.model, diagram: d, x1: bx + 55, y1: y, x2: bx + bw - 55, y2: y + 42,
        modelInitializer: (m) => { m.name = `${code} ${name}`; } });
    });
    M.UC = UC;
    const ADMIN = actor("ADMIN", 70, top + 30);
    const HR = actor("HR", 70, top + 420);
    const MANAGER = actor("MANAGER", bx + bw + 150, top + 300);
    const GEMINI = actor("Google Gemini", bx + bw + 150, top + 700);
    GEMINI.model.stereotype = "external system";
    Object.assign(M, { ADMIN: ADMIN.model, HR: HR.model, MANAGER: MANAGER.model, GEMINI: GEMINI.model });
    // Đường xiên tới điểm sát mép trái/phải của use case đích rồi đi ngang vào -> không cắt use case khác
    const tipPath = (tail, head, uc, side, dy) => {
      const v = relation("UMLAssociation", P.uc, d, tail, head, null, null);
      const cy = uc.top + uc.height / 2 + dy;
      const tip = side === "L" ? [uc.left - 16, cy] : [uc.left + uc.width + 16, cy];
      const inner = side === "L" ? [uc.left + 40, cy] : [uc.left + uc.width - 40, cy];
      const other = tail === uc ? head : tail;
      const oc = [other.left + other.width / 2, other.top + other.height / 2];
      L.setPoints(v, tail === uc ? [inner, tip, oc] : [oc, tip, inner]);
      v.lineStyle = 1;
      return v;
    };
    const assoc = (a, u, side, dy) => tipPath(a, UC[u], UC[u], side || "L", dy || 0);
    relation("UMLGeneralization", ADMIN.model, d, ADMIN, HR, null, "oblique");
    assoc(ADMIN, "UC014");
    ["UC001", "UC002", "UC003", "UC004", "UC005", "UC006", "UC007", "UC008", "UC009", "UC010", "UC011", "UC012", "UC013"].forEach((u) => assoc(HR, u));
    ["UC001", "UC002", "UC003", "UC006", "UC007", "UC008", "UC009", "UC011", "UC012", "UC013"].forEach((u) => assoc(MANAGER, u, "R", ["UC008", "UC009", "UC013"].includes(u) ? -6 : 0));
    ["UC008", "UC009", "UC010", "UC013"].forEach((u) => tipPath(UC[u], GEMINI, UC[u], "R", u === "UC010" ? 0 : 6));
    note(P.uc, d, "MANAGER: UC002, UC003 chỉ xem;\nUC006 chỉ xem và hoàn thành\nbuổi phỏng vấn được giao.", bx + bw + 40, top + 110, 250, 60);
    note(P.uc, d, "ADMIN kế thừa toàn bộ use case\ncủa HR (generalization) và có\nthêm UC014.", 10, top + 640, 205, 60);
  }

  require(path.join(DIR, "classes.js"))(L, P, M, log, type);

  // =============================================================== Boundary classes (React pages) – dùng làm type cho lifeline
  {
    const b = pkg(P.svc, "Boundary (React pages)");
    ["LoginPage", "Navbar", "JobsPage", "JobFormPage", "CandidateFormPage", "CandidateDetailPage", "ApplicationCreatePage", "ApplicationDetailPage",
      "InterviewFormPage", "InterviewDetailPage", "EvaluationFormPage", "DashboardPage", "AIChatPage"].forEach((n) => {
      M[n] = F.createModel({ id: "UMLClass", parent: b, modelInitializer: (m) => { m.name = n; m.stereotype = "boundary"; } });
    });
    M.CVStorage = F.createModel({ id: "UMLArtifact", parent: b, modelInitializer: (m) => { m.name = "uploads"; m.stereotype = "file storage"; m.documentation = "backend/uploads – file CV đặt tên uuid_tênfile"; } });
    M.FaissFiles = F.createModel({ id: "UMLArtifact", parent: b, modelInitializer: (m) => { m.name = "rag/index"; m.stereotype = "file storage"; m.documentation = "recruitment.faiss, metadata.json, index_info.json"; } });
  }

  // =============================================================== 04 STATE MACHINE
  log('04 STATE MACHINE');
  {
    const d = F.createDiagram({ id: "UMLStatechartDiagram", parent: P.st, diagramInitializer: (x) => { x.name = "30 Application State Machine"; } });
    const sm = d._parent; sm.name = "ApplicationStatus";
    const st = (name, x, y) => F.createModelAndView({ id: "UMLState", parent: sm, diagram: d, x1: x, y1: y, x2: x + 130, y2: y + 50, modelInitializer: (m) => { m.name = name; } });
    const init = F.createModelAndView({ id: "UMLPseudostate", parent: sm, diagram: d, x1: 40, y1: 75, x2: 40, y2: 75 });
    const NEW = st("NEW", 110, 50), SCR = st("SCREENING", 340, 50), INT = st("INTERVIEW", 570, 50), PAS = st("PASSED", 800, 50), REJ = st("REJECTED", 455, 250);
    const fin = F.createModelAndView({ id: "UMLFinalState", parent: sm, diagram: d, x1: 1000, y1: 262, x2: 1026, y2: 288 });
    const tr = (a, b, ev, route) => {
      const v = relation("UMLTransition", sm, d, a, b, null, route);
      if (ev) F.createModel({ id: "UMLEvent", parent: v.model, field: "triggers", modelInitializer: (m) => { m.name = ev; } });
      return v;
    };
    tr(init, NEW, null, "hv");
    const tNewCreate = null;
    tr(NEW, SCR, "startScreening", "hv");
    tr(SCR, INT, "moveToInterview", "hv");
    tr(INT, PAS, "pass", "hv");
    tr(NEW, REJ, "reject", { via: [[175, 275]] });
    tr(SCR, REJ, "reject", { via: [[405, 180], [490, 180]] });
    tr(INT, REJ, "reject", { via: [[635, 180], [555, 180]] });
    tr(PAS, fin, null, { via: [[865, 275]] });
    tr(REJ, fin, null, "hv");
    note(sm, d, "Chuyển trạng thái chỉ do người dùng ADMIN/HR thực hiện\n(PUT /api/applications/{id}/status). Kết quả AI, hoàn thành\nphỏng vấn hay thêm đánh giá KHÔNG tự động chuyển trạng thái.\nPASSED và REJECTED là trạng thái kết thúc.", 40, 340, 440, 72);
  }

  // =============================================================== 07 COMPONENT MODEL
  log('07 COMPONENT MODEL');
  {
    const d = F.createDiagram({ id: "UMLComponentDiagram", parent: P.comp, diagramInitializer: (x) => { x.name = "33 Component Diagram"; } });
    d.showVisibility = false;
    const comp = (name, x, y, w, h, st, parent, kind) => F.createModelAndView({ id: kind || "UMLComponent", parent: parent || P.comp, diagram: d, x1: x, y1: y, x2: x + w, y2: y + h,
      modelInitializer: (m) => { m.name = name; if (st) m.stereotype = st; } });
    const react = comp("React SPA", 20, 110, 170, 64, null);
    react.model.documentation = "React 19 + Vite, React Router, Bootstrap, Fetch API";
    const fx = 260, fy = 30, mw = 190, gap = 26;
    const flask = comp("Flask REST API", fx, fy, gap + 4 * (mw + gap), 190, null);
    const mod = (name, i) => comp(name, fx + gap + i * (mw + gap), fy + 80, mw, 64, null, flask.model);
    const auth = mod("Authentication Module", 0), rec = mod("Recruitment Module", 1), ai = mod("AI Module", 2), rag = mod("RAG Chatbot Module", 3);
    const by = 340;
    const cv = comp("CV Upload Storage", 180, by, 190, 56, null, null, "UMLArtifact");
    const mysql = comp("MySQL 8.4 (ai_recruitment)", 420, by, 240, 64, "database");
    const gem = comp("Google Gemini API", 710, by, 190, 64, "external");
    const emb = comp("Local Embedding Model", 950, by, 200, 64, null);
    emb.model.documentation = "sentence-transformers all-MiniLM-L6-v2 (384 chiều, CPU)";
    const faiss = comp("Local Vector Store / FAISS", 1190, by, 210, 64, null);
    const cx = (v) => v.left + v.width / 2;
    const bot = (v) => v.top + v.height;
    const link = (a, b2, label, xa, xb, Y) => {
      const v = relation("UMLDependency", P.comp, d, a, b2, (m) => { if (label) m.name = label; }, null);
      L.setPoints(v, [[cx(a) + xa, bot(a) - 5], [cx(a) + xa, Y], [cx(b2) + xb, Y], [cx(b2) + xb, b2.top + 5]]);
    };
    { const v = relation("UMLDependency", P.comp, d, react, flask, (m) => { m.name = "HTTP/JSON"; }, null); L.setPoints(v, [[cx(react), react.top + 32], [flask.left + 5, react.top + 32]]); }
    link(auth, mysql, "", 0, -70, 244);
    link(rec, cv, "đọc/ghi file", -40, 0, 252);
    link(rec, mysql, "", 20, -35, 260);
    link(ai, mysql, "", -30, 0, 268);
    link(ai, gem, "HTTPS", 20, -30, 276);
    link(rag, mysql, "", -60, 40, 284);
    link(rag, gem, "HTTPS", -30, 30, 292);
    link(rag, emb, "", 0, 0, 300);
    link(rag, faiss, "", 40, 0, 308);
    note(P.comp, d, "React SPA chỉ gọi Flask REST API\n(cookie phiên HttpOnly). GEMINI_API_KEY\nchỉ ở backend; React không gọi trực\ntiếp Google Gemini. Đường không nhãn\ntới MySQL: SQL tham số hóa. RAG chỉ\ngọi Gemini ở nhánh SEMANTIC/HYBRID.", 20, 420, 230, 100);
  }

  // =============================================================== 02/03 ACTIVITY & SEQUENCE
  require(path.join(DIR, "act.js"))(L, P, M, log);
  require(path.join(DIR, "seq.js"))(L, P, M, log);

  app.project.save(process.env.AIGEN_OUT);
  log("saved " + process.env.AIGEN_OUT + " in " + Math.round((Date.now() - t0) / 1000) + "s");
};
