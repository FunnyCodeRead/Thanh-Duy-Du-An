// 05 Domain Model + 06 Service Model – bố cục 2 bước theo kích thước thật
module.exports = function (L, P, M, log, type) {
  const { F, klass, relation, note } = L;
  const arrange = (d) => { try { d.arrangeDiagram(L.canvas()); } catch (e) { log("arrange " + e); } };
  const place = (v, x, y) => { v.left = Math.round(x); v.top = Math.round(y); };
  const S = { isStatic: true };

  // =============================================================== 05 DOMAIN MODEL
  log("05 DOMAIN MODEL");
  {
    const d = F.createDiagram({ id: "UMLClassDiagram", parent: P.dom, diagramInitializer: (x) => { x.name = "31 Entity Class Diagram"; } });
    const E = {};
    const en = (name, lits) => (E[name] = klass(P.dom, d, name, 0, 0, { kind: "UMLEnumeration", literals: lits, w: 150 }));
    en("Role", ["ADMIN", "HR", "MANAGER"]);
    en("JobStatus", ["OPEN", "CLOSED"]);
    en("CandidateSource", ["FACEBOOK", "LINKEDIN", "WEBSITE", "REFERRAL", "JOB_SITE", "OTHER"]);
    en("ApplicationStatus", ["NEW", "SCREENING", "INTERVIEW", "PASSED", "REJECTED"]);
    en("InterviewStatus", ["SCHEDULED", "COMPLETED", "CANCELLED"]);
    en("AIResultType", ["CV_SUMMARY", "INTERVIEW_QUESTION", "EMAIL"]);
    const T = (n) => E[n].model;
    const C = {};
    const cls = (name, attrs, ops) => (C[name] = klass(P.dom, d, name, 0, 0, { w: 160, attrs, ops }));
    cls("Candidate", [["id", "int"], ["full_name", "str"], ["email", "str"], ["phone", "str"], ["skills", "str"], ["experience", "str"],
      ["education", "str"], ["source", T("CandidateSource")], ["cv_file", "str"], ["cv_text", "str"], ["created_at", "datetime"]],
    [["get_candidates", [["keyword", "str"], ["source", T("CandidateSource")]], "Candidate[*]", "public", S],
      ["create_candidate", [["data", "Candidate"]], "int", "public", S],
      ["update_candidate", [["candidate_id", "int"], ["data", "Candidate"]], null, "public", S],
      ["delete_candidate", [["candidate_id", "int"]], "bool", "public", S]]);
    cls("Application", [["id", "int"], ["candidate_id", "int"], ["job_id", "int"], ["status", T("ApplicationStatus")], ["applied_at", "datetime"], ["note", "str"]],
      [["get_applications", [["keyword", "str"], ["status", T("ApplicationStatus")], ["job_id", "int"]], "Application[*]", "public", S],
        ["application_exists", [["candidate_id", "int"], ["job_id", "int"]], "bool", "public", S],
        ["create_application", [["candidate_id", "int"], ["job_id", "int"], ["note", "str"]], "int", "public", S],
        ["update_application_status", [["application_id", "int"], ["status", T("ApplicationStatus")]], null, "public", S]]);
    cls("Job", [["id", "int"], ["title", "str"], ["department", "str"], ["description", "str"], ["requirements", "str"], ["skills", "str"],
      ["quantity", "int"], ["status", T("JobStatus")], ["created_at", "datetime"]],
    [["get_jobs", [["keyword", "str"], ["status", T("JobStatus")]], "Job[*]", "public", S],
      ["create_job", [["data", "Job"]], "int", "public", S],
      ["update_job", [["job_id", "int"], ["data", "Job"]], null, "public", S],
      ["delete_job", [["job_id", "int"]], "bool", "public", S]]);
    cls("Interview", [["id", "int"], ["application_id", "int"], ["interviewer_id", "int"], ["interview_date", "datetime"], ["location", "str"],
      ["status", T("InterviewStatus")], ["note", "str"], ["created_at", "datetime"]],
    [["create_interview", [["data", "Interview"]], "int", "public", S],
      ["update_interview", [["interview_id", "int"], ["data", "Interview"]], null, "public", S],
      ["update_interview_status", [["interview_id", "int"], ["status", T("InterviewStatus")]], null, "public", S]]);
    cls("Evaluation", [["id", "int"], ["application_id", "int"], ["evaluator_id", "int"], ["technical_score", "int"], ["communication_score", "int"],
      ["experience_score", "int"], ["comment", "str"], ["created_at", "datetime"]],
    [["create_evaluation", [["data", "Evaluation"]], "int", "public", S],
      ["update_evaluation", [["evaluation_id", "int"], ["data", "Evaluation"]], null, "public", S],
      ["average_score", [], "decimal", "public", { isQuery: true }]]);
    cls("AIResult", [["id", "int"], ["application_id", "int"], ["type", T("AIResultType")], ["content", "str"], ["created_at", "datetime"]],
      [["create_ai_result", [["application_id", "int"], ["result_type", T("AIResultType")], ["content", "str"]], "int", "public", S],
        ["get_ai_results_by_application", [["application_id", "int"]], "AIResult[*]", "public", S]]);
    cls("User", [["id", "int"], ["full_name", "str"], ["email", "str"], ["password_hash", "str"], ["role", T("Role")], ["created_at", "datetime"]],
      [["get_user_by_email", [["email", "str"]], "User", "public", S], ["get_user_by_id", [["user_id", "int"]], "User", "public", S],
        ["get_interviewers", [], "User[*]", "public", S]]);
    Object.keys(C).forEach((k) => { M[k] = C[k].model; });
    M.Role = E.Role.model;
    arrange(d);
    const GX = 150, GY = 110;
    const c = (n) => C[n];
    const r1 = 20;
    place(c("Candidate"), 20, r1);
    place(c("Application"), c("Candidate").left + c("Candidate").width + GX, r1);
    place(c("Job"), c("Application").left + c("Application").width + GX, r1);
    const r2 = r1 + Math.max(c("Candidate").height, c("Application").height, c("Job").height) + GY;
    place(c("Interview"), 20, r2);
    place(c("Evaluation"), c("Application").left, r2);
    place(c("AIResult"), c("Job").left, r2);
    const r3 = r2 + Math.max(c("Interview").height, c("Evaluation").height, c("AIResult").height) + GY;
    place(c("User"), (c("Interview").left + c("Interview").width + c("Evaluation").left) / 2 - c("User").width / 2, r3);
    let ex = Math.max(c("Job").left + c("Job").width, c("AIResult").left + c("AIResult").width) + 80, ey = r1;
    ["Role", "JobStatus", "CandidateSource", "ApplicationStatus", "InterviewStatus", "AIResultType"].forEach((n) => { place(E[n], ex, ey); ey += E[n].height + 24; });
    const asc = (a, b, am, an, bm, bn) => relation("UMLAssociation", P.dom, d, C[a], C[b], (m) => {
      m.end1.multiplicity = am; m.end1.name = an; m.end2.multiplicity = bm; m.end2.name = bn; }, "oblique");
    asc("Candidate", "Application", "1", "candidate", "0..*", "applications");
    asc("Job", "Application", "1", "job", "0..*", "applications");
    asc("Application", "Interview", "1", "application", "0..*", "interviews");
    asc("Application", "Evaluation", "1", "application", "0..*", "evaluations");
    asc("Application", "AIResult", "1", "application", "0..*", "aiResults");
    asc("User", "Interview", "1", "interviewer", "0..*", "conductedInterviews");
    asc("User", "Evaluation", "1", "evaluator", "0..*", "evaluations");
    note(P.dom, d, "Operation gạch chân = operation mức lớp (static), ánh xạ hàm\ntruy vấn tham số hóa trong database/db.py.\naverage_score() = (technical + communication + experience) / 3,\ntính khi trả dữ liệu, không lưu trong CSDL.",
      c("AIResult").left, r3, 400, 70);
  }

  // =============================================================== 06 SERVICE MODEL
  log("06 SERVICE MODEL");
  {
    const d = F.createDiagram({ id: "UMLClassDiagram", parent: P.svc, diagramInitializer: (x) => { x.name = "32 Controller - Service Class Diagram"; } });
    const V = {};
    const k = (name, st, ops, attrs) => (V[name] = klass(P.svc, d, name, 0, 0, { st, ops, attrs, w: 150 }));
    const h = (name, params) => [name, params || [], null];
    k("AuthController", "controller", [h("login"), h("logout"), h("me"), ["api_login_required", [["view", "Callable"]], "Callable"], ["api_role_required", [["roles", "str", "*"]], "Callable"]]);
    k("JobController", "controller", [h("list_jobs"), h("get_job", [["job_id", "int"]]), h("add_job"), h("edit_job", [["job_id", "int"]]), h("remove_job", [["job_id", "int"]]), ["validate_job", [["values", "dict"]], "str[*]", "private"]]);
    k("CandidateController", "controller", [h("list_candidates"), h("get_candidate", [["candidate_id", "int"]]), h("add_candidate"), h("edit_candidate", [["candidate_id", "int"]]), h("remove_candidate", [["candidate_id", "int"]]), h("uploaded_cv", [["filename", "str"]]),
      ["save_cv_file", [["upload", "FileStorage"]], "tuple", "private"], ["extract_cv_text", [["file_path", "str"], ["extension", "str"]], "str", "private"]]);
    k("ApplicationController", "controller", [h("list_applications"), h("get_application", [["application_id", "int"]]), h("add_application"), h("edit_application_status", [["application_id", "int"]])],
      [["ALLOWED_TRANSITIONS", "dict", "public", { isStatic: true, isReadOnly: true }]]);
    k("InterviewController", "controller", [h("list_interviews"), h("list_interviewers"), h("get_interview", [["interview_id", "int"]]), h("add_interview"), h("edit_interview", [["interview_id", "int"]]), h("edit_interview_status", [["interview_id", "int"]]), ["parse_datetime", [["dt_str", "str"]], "datetime", "private"]]);
    k("EvaluationController", "controller", [h("list_evaluations"), h("get_evaluation", [["evaluation_id", "int"]]), h("add_evaluation"), h("edit_evaluation", [["evaluation_id", "int"]]), ["validate_score", [["score_val", "any"], ["field_name", "str"]], "tuple", "private"]]);
    k("FlaskApp", "controller", [h("health"), h("dashboard")]);
    V.FlaskApp.model.documentation = "backend/app.py – khởi tạo Flask, đăng ký blueprint, /api/health và /api/dashboard";
    k("Database", "database", [["get_connection", [], "MySQLConnection"]]);
    V.Database.model.documentation = "backend/database/db.py – các hàm truy vấn tham số hóa trên 7 bảng MySQL";
    k("AIController", "controller", [h("api_cv_summary"), h("api_interview_questions"), h("api_email"), h("api_list_ai_results", [["application_id", "int"]]), ["require_auth", [], null, "private"]]);
    k("ChatController", "controller", [h("ask_chat"), h("reindex_chat"), h("get_chat_index_info")]);
    k("AIService", "service", [["summarize_cv", [["application_id", "int"]], "dict"], ["generate_interview_questions", [["application_id", "int"]], "dict"], ["generate_email", [["application_id", "int"], ["email_type", "str"]], "dict"], ["_read_prompt_template", [["filename", "str"]], "str", "private"]]);
    k("RAGService", "service", [["answer_question", [["question", "str"], ["user", "dict"], ["history", "list"]], "dict"], ["handle_structured_intent", [["router_info", "dict"], ["question", "str"]], "dict"], ["_load_prompt_template", [], "str", "private"]]);
    k("IndexRebuilder", "service", [["rebuild_index", [], "dict"]]);
    V.IndexRebuilder.model.documentation = "backend/scripts/rebuild_rag_index.py";
    k("GeminiService", "service", [["generate_content", [["prompt", "str"]], "str"]]);
    V.GeminiAPI = klass(P.svc, d, "Google Gemini API", 0, 0, { st: "external", w: 170, h: 40 });
    k("ScopeGuard", "service", [["check_scope", [["question", "str"]], "dict"]]);
    k("IntentRouter", "service", [["route_intent", [["question", "str"]], "dict"]]);
    V.IntentRouter.model.documentation = "rag/intent_router.py – gồm Decision Guard (DECISION_PATTERNS) và phân loại STRUCTURED / SEMANTIC / HYBRID";
    k("ContextBuilder", "service", [["build_context", [["documents", "list"], ["structured_info", "str"]], "tuple"]]);
    k("Retriever", "service", [["retrieve", [["question", "str"], ["top_k", "int"], ["candidate_ids", "int", "*"]], "list"], ["detect_candidate_entity", [["question", "str"], ["documents", "list"]], "int"]]);
    k("DocumentBuilder", "service", [["chunk_text", [["text", "str"], ["chunk_size", "int"], ["overlap", "int"]], "str[*]"], ["build_documents_from_db", [["data", "dict"]], "list"]]);
    k("EmbeddingService", "service", [["get_embedding_model", [], "SentenceTransformer"], ["embed_text", [["text", "str"], ["normalize", "bool"]], "ndarray"], ["embed_texts", [["texts", "str", "*"], ["normalize", "bool"]], "ndarray"]]);
    k("VectorStore", "service", [["is_index_available", [], "bool"], ["get_index_info", [], "dict"], ["save_index", [["index", "Index"], ["documents", "list"], ["index_info", "dict"]], "bool"], ["load_index", [], "tuple"], ["search_vectors", [["query_vector", "ndarray"], ["top_k", "int"]], "list"]]);
    V.FAISS = klass(P.svc, d, "FAISS IndexFlatIP", 0, 0, { st: "library", w: 160, h: 40 });
    Object.keys(V).forEach((n) => { M[n] = V[n].model; });
    arrange(d);
    const pth = require("path");
    delete require.cache[require.resolve(pth.join(__dirname, "svclayout.js"))];
    const lay = require(pth.join(__dirname, "svclayout.js"))(V, L, P, d, place);
    note(P.svc, d, "Mọi controller dùng decorator api_login_required /\napi_role_required của AuthController để kiểm tra phiên\nvà vai trò. Handler route trả về Flask Response.\nChỉ backend gọi Google Gemini; React không gọi trực tiếp.",
      20, lay.noteY, 380, 70);
  }
};
