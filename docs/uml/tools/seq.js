// 14 Sequence Diagram – lifeline có stereotype, activation, synchronous/reply, alt/opt
module.exports = function (L, P, M, log) {
  const C = (from, to, label, inner, reply) => ["call", from, to, label, inner || [], reply === undefined ? null : reply];
  const R = (from, to, label) => ["reply", from, to, label];
  const SELF = (on, label, inner) => ["self", on, label, inner || []];
  const ALT = (...ops) => ["alt", ops];
  const OPT = (guard, steps) => ["opt", guard, steps];

  const LL = {
    user: { k: "u", name: "Người dùng", st: "actor" },
    hr: { k: "u", name: "hr", type: M.HR, st: "actor" },
    admin: { k: "u", name: "admin", type: M.ADMIN, st: "actor" },
    page: (n, t) => ({ k: "page", name: n, type: M[t], st: "boundary" }),
    ctl: (k, n, t) => ({ k, name: n, type: M[t], st: "control" }),
    svc: (k, n, t) => ({ k, name: n, type: M[t], st: "service" }),
    db: { k: "db", name: "db", type: M.Database, st: "database" },
    gem: { k: "gem", name: "gemini", type: M.GEMINI, st: "external" },
  };

  function seq(code, title, lifelines, steps, notes) {
    log('seq ' + code);
    const pk = L.pkg(P.seq, code);
    const d = L.sequence(pk, { name: `${code} Sequence – ${title}`, interactionName: `${code} ${title}`, collabName: code, lifelines, steps });
    (notes || []).forEach(([text, x, y, w, h]) => L.note(pk, d, text, x, y, w, h));
    return d;
  }

  // ---------------------------------------------------------------- UC001
  seq("UC001", "Đăng nhập, đăng xuất", [LL.user, LL.page("loginPage", "LoginPage"), { k: "nav", name: "navbar", type: M.Navbar, st: "boundary" },
    LL.ctl("auth", "auth", "AuthController"), LL.db], [
    C("u", "page", "nhập email, mật khẩu; nhấn Đăng nhập", [
      C("page", "auth", "POST /api/auth/login {email, password}", [
        ALT(["email hoặc mật khẩu trống", [R("auth", "page", "400 thông báo lỗi nhập liệu")]],
          ["else", [
            C("auth", "db", "get_user_by_email(email)", [], "user"),
            SELF("auth", "check_password_hash(hash, password)"),
            ALT(["thông tin xác thực đúng", [SELF("auth", "session.clear(); lưu user_id, role"), R("auth", "page", "200 {user} + Set-Cookie HttpOnly")]],
              ["else", [R("auth", "page", "401 Email hoặc mật khẩu không đúng")]]),
          ]]),
      ]),
    ], "điều hướng /dashboard hoặc hiển thị lỗi"),
    C("u", "nav", "chọn Đăng xuất", [
      C("nav", "auth", "POST /api/auth/logout", [SELF("auth", "session.clear()")], "200"),
    ], "điều hướng /login"),
  ]);

  // ---------------------------------------------------------------- UC002
  seq("UC002", "Quản lý vị trí tuyển dụng", [LL.hr, { k: "list", name: "jobsPage", type: M.JobsPage, st: "boundary" }, LL.page("jobFormPage", "JobFormPage"),
    LL.ctl("ctl", "jobCtl", "JobController"), LL.db], [
    C("u", "list", "nhập từ khóa / lọc trạng thái", [
      C("list", "ctl", "GET /api/jobs?keyword&status", [C("ctl", "db", "get_jobs(keyword, status)", [], "jobs")], "200 [jobs]"),
    ], "hiển thị danh sách"),
    C("u", "page", "nhập thông tin vị trí; nhấn Lưu", [
      C("page", "ctl", "POST /api/jobs (JSON)", [
        SELF("ctl", "api_role_required(ADMIN, HR)"),
        ALT(["vai trò MANAGER", [R("ctl", "page", "403")]],
          ["else", [
            SELF("ctl", "validate_job(values)"),
            ALT(["dữ liệu hợp lệ", [C("ctl", "db", "create_job(...)", [], "job_id"), R("ctl", "page", "201 {job}")]],
              ["không hợp lệ", [R("ctl", "page", "400 {errors}")]]),
          ]]),
      ]),
    ], "hiển thị chi tiết vị trí hoặc lỗi"),
    C("u", "list", "nhấn Xóa, xác nhận", [
      C("list", "ctl", "DELETE /api/jobs/{id}", [
        SELF("ctl", "api_role_required(ADMIN, HR)"),
        C("ctl", "db", "delete_job(job_id)", [SELF("db", "COUNT applications WHERE job_id")], "bool"),
        ALT(["False – có hồ sơ liên kết", [R("ctl", "list", "409 Không thể xóa")]], ["True", [R("ctl", "list", "200 Đã xóa")]]),
      ]),
    ], "cập nhật danh sách"),
  ]);

  // ---------------------------------------------------------------- UC003
  seq("UC003", "Quản lý ứng viên và CV", [LL.hr, LL.page("candidateForm", "CandidateFormPage"), LL.ctl("ctl", "candidateCtl", "CandidateController"),
    { k: "fs", name: "cvStorage", type: M.CVStorage, st: "file storage" }, LL.db], [
    C("u", "page", "nhập thông tin, chọn file CV; nhấn Lưu", [
      C("page", "ctl", "POST /api/candidates (multipart)", [
        SELF("ctl", "validate_candidate(values, upload)"),
        ALT(["không hợp lệ", [R("ctl", "page", "400 {errors}")]],
          ["else", [
            OPT("có file CV", [
              SELF("ctl", "save_cv_file(upload)", [C("ctl", "fs", "save(uuid_tênfile)", [], "ok")]),
              SELF("ctl", "extract_cv_text(path, ext)", [C("ctl", "fs", "đọc PDF (pypdf) / DOCX (python-docx)", [], "văn bản")]),
            ]),
            C("ctl", "db", "create_candidate(..., cv_file, cv_text)", [], "candidate_id"),
            R("ctl", "page", "201 {candidate}"),
          ]]),
      ]),
    ], "hiển thị chi tiết ứng viên hoặc lỗi"),
  ], []);

  // ---------------------------------------------------------------- UC004
  seq("UC004", "Tạo hồ sơ ứng tuyển", [LL.hr, LL.page("createPage", "ApplicationCreatePage"), LL.ctl("ctl", "applicationCtl", "ApplicationController"), LL.db], [
    C("u", "page", "chọn ứng viên, vị trí; nhấn Tạo", [
      C("page", "ctl", "POST /api/applications {candidate_id, job_id, note}", [
        C("ctl", "db", "get_candidate_by_id(), get_job_by_id()", [], "candidate, job"),
        ALT(["ứng viên hoặc vị trí không tồn tại", [R("ctl", "page", "404")]],
          ["else", [
            C("ctl", "db", "application_exists(candidate_id, job_id)", [], "bool"),
            ALT(["đã tồn tại", [R("ctl", "page", "409 Ứng viên đã có hồ sơ cho vị trí này")]],
              ["else", [C("ctl", "db", "create_application(candidate_id, job_id, note)", [], "application_id"), R("ctl", "page", "201 {application: NEW}")]]),
          ]]),
      ]),
    ], "điều hướng /applications/{id} hoặc hiển thị lỗi"),
  ]);

  // ---------------------------------------------------------------- UC005
  seq("UC005", "Cập nhật trạng thái hồ sơ", [LL.hr, LL.page("detailPage", "ApplicationDetailPage"), LL.ctl("ctl", "applicationCtl", "ApplicationController"), LL.db], [
    C("u", "page", "chọn trạng thái mới; Xác nhận chuyển", [
      C("page", "ctl", "PUT /api/applications/{id}/status {status}", [
        SELF("ctl", "api_role_required(ADMIN, HR)"),
        ALT(["không phải ADMIN / HR", [R("ctl", "page", "403")]],
          ["else", [
            C("ctl", "db", "get_application_by_id(id)", [], "application (status)"),
            ALT(["không tìm thấy", [R("ctl", "page", "404")]],
              ["status mới ∉ ALLOWED_TRANSITIONS[status]", [R("ctl", "page", "400 Không thể chuyển trạng thái")]],
              ["hợp lệ", [C("ctl", "db", "update_application_status(id, status)"), C("ctl", "db", "get_application_by_id(id)", [], "application"), R("ctl", "page", "200 {application}")]]),
          ]]),
      ]),
    ], "cập nhật thanh tiến trình"),
  ]);

  // ---------------------------------------------------------------- UC006
  seq("UC006", "Quản lý lịch phỏng vấn", [LL.user, LL.page("formPage", "InterviewFormPage"), { k: "detail", name: "detailPage", type: M.InterviewDetailPage, st: "boundary" },
    LL.ctl("ctl", "interviewCtl", "InterviewController"), LL.db], [
    OPT("Tạo lịch – ADMIN / HR", [
      C("u", "page", "chọn hồ sơ, người phỏng vấn, thời gian; Lưu", [
        C("page", "ctl", "POST /api/interviews", [
          C("ctl", "db", "get_application_by_id(), get_user_by_id()", [], "application, interviewer"),
          ALT(["không tồn tại", [R("ctl", "page", "404")]],
            ["else", [C("ctl", "db", "create_interview(...)", [], "interview_id"), R("ctl", "page", "201 {interview: SCHEDULED}")]]),
        ]),
      ], "hiển thị kết quả"),
    ]),
    OPT("Sửa lịch – ADMIN / HR", [
      C("u", "page", "sửa thời gian, địa điểm; Lưu", [
        C("page", "ctl", "PUT /api/interviews/{id}", [
          C("ctl", "db", "get_interview_by_id(id)", [], "interview"),
          ALT(["COMPLETED hoặc CANCELLED", [R("ctl", "page", "400 Không thể chỉnh sửa")]],
            ["SCHEDULED", [C("ctl", "db", "update_interview(...)"), R("ctl", "page", "200 {interview}")]]),
        ]),
      ], "hiển thị kết quả"),
    ]),
    OPT("Hoàn thành / Hủy", [
      C("u", "detail", "nhấn Hoàn thành hoặc Hủy", [
        C("detail", "ctl", "PUT /api/interviews/{id}/status {status}", [
          C("ctl", "db", "get_interview_by_id(id)", [], "interview"),
          ALT(["MANAGER hủy, hoặc không phải interviewer được giao", [R("ctl", "detail", "403")]],
            ["trạng thái hiện tại ≠ SCHEDULED", [R("ctl", "detail", "400 Không thể chuyển trạng thái")]],
            ["else", [C("ctl", "db", "update_interview_status(id, status)"), R("ctl", "detail", "200 {interview}")]]),
        ]),
      ], "cập nhật trạng thái buổi phỏng vấn"),
    ]),
  ]);

  // ---------------------------------------------------------------- UC007
  seq("UC007", "Đánh giá ứng viên", [LL.user, LL.page("evalForm", "EvaluationFormPage"), LL.ctl("ctl", "evaluationCtl", "EvaluationController"), LL.db], [
    C("u", "page", "nhập 3 điểm, nhận xét; Lưu", [
      C("page", "ctl", "POST /api/evaluations", [
        SELF("ctl", "validate_score() cho 3 tiêu chí"),
        ALT(["có điểm ngoài 1..5", [R("ctl", "page", "400")]],
          ["else", [
            C("ctl", "db", "get_application_by_id(application_id)", [], "application"),
            ALT(["không tìm thấy", [R("ctl", "page", "404")]],
              ["else", [C("ctl", "db", "create_evaluation(application_id, evaluator_id = session.user_id, ...)", [], "evaluation_id"), R("ctl", "page", "201 {evaluation, average_score}")]]),
          ]]),
      ]),
    ], "hiển thị điểm TB = (t+c+e)/3"),
    C("u", "page", "sửa đánh giá; Lưu", [
      C("page", "ctl", "PUT /api/evaluations/{id}", [
        C("ctl", "db", "get_evaluation_by_id(id)", [], "evaluation"),
        ALT(["không phải người tạo và không phải ADMIN", [R("ctl", "page", "403")]],
          ["else", [SELF("ctl", "validate_score() cho 3 tiêu chí"), C("ctl", "db", "update_evaluation(...)"), R("ctl", "page", "200 {evaluation}")]]),
      ]),
    ], "hiển thị đánh giá đã cập nhật"),
  ]);

  // ---------------------------------------------------------------- UC008 / UC009 / UC010
  const aiLL = [LL.user, LL.page("detailPage", "ApplicationDetailPage"), LL.ctl("ai", "aiCtl", "AIController"), LL.svc("svc", "aiService", "AIService"),
    LL.svc("gs", "geminiService", "GeminiService"), LL.gem, LL.db];
  const geminiBlock = (typ, ok) => [
    SELF("svc", `_read_prompt_template(); format prompt`),
    C("svc", "gs", "generate_content(prompt)", [C("gs", "gem", "models.generate_content(model, prompt)", [], "response")], "text | GeminiServiceError"),
    ALT(["Gemini thành công", [C("svc", "db", `create_ai_result(application_id, '${typ}', content)`, [], "id"), R("svc", "ai", ok)]],
      ["Gemini lỗi", [R("svc", "ai", "raise GeminiServiceError")]]),
  ];
  const aiReplies = ALT(["thành công", [R("ai", "page", "200 {data}")]], ["ValueError", [R("ai", "page", "404 / 400")]], ["GeminiServiceError", [R("ai", "page", "500 thông báo thân thiện")]]);

  seq("UC008", "AI tóm tắt CV", aiLL, [
    C("u", "page", "nhấn Tóm tắt CV", [
      C("page", "ai", "POST /api/ai/cv-summary {application_id}", [
        SELF("ai", "require_auth()"),
        C("ai", "svc", "summarize_cv(application_id)", [
          C("svc", "db", "get_application_by_id(application_id)", [], "application (job, candidate.cv_text)"),
          ALT(["không có hồ sơ hoặc cv_text rỗng", [R("svc", "ai", "raise ValueError")]], ["else", geminiBlock("CV_SUMMARY", "{type: CV_SUMMARY, content}")]),
        ]),
        aiReplies,
      ]),
    ], "hiển thị tóm tắt (nhãn tham khảo)"),
  ], [["Không có message nào cập nhật applications.status.", 30, -46, 300, 30]]);

  seq("UC009", "AI gợi ý câu hỏi phỏng vấn", aiLL, [
    C("u", "page", "nhấn Gợi ý câu hỏi phỏng vấn", [
      C("page", "ai", "POST /api/ai/interview-questions {application_id}", [
        SELF("ai", "require_auth()"),
        C("ai", "svc", "generate_interview_questions(application_id)", [
          C("svc", "db", "get_application_by_id(application_id)", [], "application (job, candidate.cv_text)"),
          ALT(["không có hồ sơ hoặc cv_text rỗng", [R("svc", "ai", "raise ValueError")]], ["else", geminiBlock("INTERVIEW_QUESTION", "{type: INTERVIEW_QUESTION, content (5 câu hỏi)}")]),
        ]),
        aiReplies,
      ]),
    ], "hiển thị 5 câu hỏi"),
  ], [["Không có message nào cập nhật applications.status.", 30, -46, 300, 30]]);

  seq("UC010", "AI soạn email", [LL.hr, ...aiLL.slice(1)], [
    C("u", "page", "chọn loại email; nhấn Tạo email", [
      C("page", "ai", "POST /api/ai/email {application_id, email_type}", [
        SELF("ai", "require_auth(); kiểm tra role ∈ {ADMIN, HR}"),
        ALT(["MANAGER", [R("ai", "page", "403")]],
          ["else", [
            C("ai", "svc", "generate_email(application_id, email_type)", [
              C("svc", "db", "get_application_by_id(application_id)", [], "application (status)"),
              OPT("email_type = INTERVIEW_INVITATION", [C("svc", "db", "get_interviews_by_application(application_id)", [], "interviews")]),
              ALT(["RESULT và status ∉ {PASSED, REJECTED}", [R("svc", "ai", "raise ValueError")]], ["else", geminiBlock("EMAIL", "{type: EMAIL, content}")]),
            ]),
            aiReplies,
          ]]),
      ]),
    ], "hiển thị bản nháp + nút Sao chép (không gửi email)"),
  ]);

  // ---------------------------------------------------------------- UC011
  seq("UC011", "Xem lịch sử kết quả AI", [LL.user, LL.page("detailPage", "ApplicationDetailPage"), LL.ctl("ai", "aiCtl", "AIController"), LL.db], [
    C("u", "page", "mở chi tiết hồ sơ ứng tuyển", [
      C("page", "ai", "GET /api/applications/{id}/ai-results", [
        SELF("ai", "require_auth()"),
        C("ai", "db", "get_ai_results_by_application(id)", [SELF("db", "ORDER BY created_at DESC")], "results"),
      ], "200 [results]"),
    ], "hiển thị danh sách lịch sử AI"),
    C("u", "page", "nhấn Xem một kết quả", [], "hiển thị nội dung đã lưu"),
  ]);

  // ---------------------------------------------------------------- UC012
  seq("UC012", "Xem Dashboard thống kê", [LL.user, LL.page("dashboardPage", "DashboardPage"), LL.ctl("app", "flaskApp", "FlaskApp"), LL.db], [
    C("u", "page", "mở /dashboard", [
      C("page", "app", "GET /api/dashboard", [
        SELF("app", "api_login_required"),
        C("app", "db", "get_dashboard_counts()", [
          SELF("db", "COUNT jobs (OPEN), candidates"),
          SELF("db", "GROUP BY applications.status, candidates.source"),
          SELF("db", "interviews SCHEDULED ≥ NOW() LIMIT 5"),
          SELF("db", "pass_rate = PASSED / (PASSED + REJECTED); hiring_time.available = false"),
        ], "stats"),
        ALT(["lỗi CSDL", [R("app", "page", "500")]], ["else", [R("app", "page", "200 {summary, application_status, candidate_sources, pass_rate, upcoming_interviews}")]]),
      ]),
    ], "hiển thị thẻ chỉ số, phân bố, 5 lịch sắp tới"),
  ]);

  // ---------------------------------------------------------------- UC013
  seq("UC013", "Hỏi đáp Chatbot tuyển dụng", [LL.user, LL.page("chatPage", "AIChatPage"), LL.ctl("chat", "chatCtl", "ChatController"),
    LL.svc("rag", "rag", "RAGService"), LL.svc("scope", "scope", "ScopeGuard"), LL.svc("router", "router", "IntentRouter"), LL.db,
    LL.svc("ret", "retriever", "Retriever"), LL.svc("emb", "embedding", "EmbeddingService"), LL.svc("vs", "vectorStore", "VectorStore"),
    LL.svc("gs", "geminiService", "GeminiService"), LL.gem], [
    C("u", "page", "nhập câu hỏi", [
      C("page", "chat", "POST /api/chat {message, history}", [
        ALT(["message rỗng hoặc > 1000 ký tự", [R("chat", "page", "400")]],
          ["else", [
            C("chat", "rag", "answer_question(question, user, history)", [
              C("rag", "scope", "check_scope(question)", [], "{in_scope, response}"),
              ALT(["in_scope = false", [SELF("rag", "trả lời từ chối (OUT_OF_SCOPE)")]],
                ["else", [
                  C("rag", "router", "route_intent(question)", [SELF("router", "Decision Guard: DECISION_PATTERNS")], "{intent, filter_status}"),
                  ALT(["intent = DECISION_REFUSAL", [SELF("rag", "trả lời từ chối (quyết định thuộc về con người)")]],
                    ["intent = STRUCTURED", [SELF("rag", "handle_structured_intent()", [C("rag", "db", "hàm truy vấn định sẵn (tham số hóa)", [], "rows")])]],
                    ["intent = SEMANTIC hoặc HYBRID", [
                      C("rag", "vs", "is_index_available()", [], "bool"),
                      OPT("HYBRID và có filter_status", [C("rag", "db", "get_candidates_by_application_status(status)", [], "candidate_ids")]),
                      C("rag", "ret", "retrieve(question, top_k = 5, candidate_ids)", [
                        C("ret", "emb", "embed_text(question)", [], "vector (chuẩn hóa L2)"),
                        C("ret", "vs", "search_vectors(vector, top_k, filters)", [], "top-k tài liệu"),
                      ], "tài liệu (cosine ≥ 0.25)"),
                      SELF("rag", "build_context(documents, structured_info)"),
                      C("rag", "gs", "generate_content(prompt + context)", [C("gs", "gem", "models.generate_content", [], "câu trả lời")], "answer"),
                    ]]),
                ]]),
            ], "{answer, retrieval_type, sources}"),
            R("chat", "page", "200 {data}"),
          ]]),
      ]),
    ], "hiển thị câu trả lời + nguồn trích dẫn"),
  ], [["LLM không sinh SQL: truy vấn MySQL chỉ qua hàm định sẵn, tham số hóa.", 30, -46, 420, 30]]);

  // ---------------------------------------------------------------- UC014
  seq("UC014", "Đồng bộ chỉ mục tri thức", [LL.admin, LL.page("chatPage", "AIChatPage"), LL.ctl("chat", "chatCtl", "ChatController"),
    LL.svc("rb", "rebuilder", "IndexRebuilder"), LL.db, LL.svc("doc", "documentBuilder", "DocumentBuilder"), LL.svc("emb", "embedding", "EmbeddingService"),
    LL.svc("vs", "vectorStore", "VectorStore"), { k: "files", name: "indexFiles", type: M.FaissFiles, st: "file storage" }], [
    C("u", "page", "nhấn Đồng bộ dữ liệu", [
      C("page", "chat", "POST /api/chat/reindex", [
        SELF("chat", "api_role_required(ADMIN)"),
        ALT(["không phải ADMIN", [R("chat", "page", "403")]],
          ["else", [
            C("chat", "rb", "rebuild_index()", [
              C("rb", "db", "get_all_records_for_rag()", [], "records"),
              C("rb", "doc", "build_documents_from_db(data)", [SELF("doc", "bỏ qua users, ai_results; chunk_text(cv, 1000, 150)")], "documents"),
              C("rb", "emb", "embed_texts(texts)", [], "vectors (chuẩn hóa L2)"),
              SELF("rb", "faiss.IndexFlatIP(384).add(vectors)"),
              C("rb", "vs", "save_index(index, documents, index_info)", [C("vs", "files", "ghi recruitment.faiss, metadata.json, index_info.json", [], "ok")], "True"),
            ], "index_info | exception"),
            ALT(["thành công", [R("chat", "page", "200 {index_info}")]], ["exception", [R("chat", "page", "500")]]),
          ]]),
      ]),
    ], "hiển thị số tài liệu, thời điểm tạo"),
  ], [["Không có lifeline Google Gemini: dùng embedding cục bộ + FAISS.", 30, -46, 380, 30]]);
};
