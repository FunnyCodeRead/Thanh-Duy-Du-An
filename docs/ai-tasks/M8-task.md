# M8 Task — Recruitment Knowledge Chatbot (Hybrid RAG)

- **Ngày thực hiện:** 26/09/2026
- **Mục tiêu:** Bổ sung Trợ lý hỏi đáp tuyển dụng (Recruitment Knowledge Chatbot) dạng Hybrid RAG, kết hợp truy vấn có cấu trúc MySQL và tìm kiếm ngữ nghĩa vector FAISS với mô hình Google Gemini 2.5 Flash.

---

## 1. Yêu cầu & Nguyên tắc Thiết kế Cốt lõi

1. **Ranh giới tri thức hệ thống (Knowledge Boundary):**
   - Chatbot chỉ được phép trả lời dựa trên dữ liệu tuyển dụng hiện có trong 7 bảng MySQL.
   - Không trở thành trợ lý đa năng hay chatbot kiến thức chung.
2. **Kiểm soát phạm vi (Scope Guard):**
   - Từ chối ngay lập tức các câu hỏi ngoài lề (thời tiết, thể thao, tin tức, công thức nấu ăn, hướng dẫn lập trình, quản trị hệ điều hành).
   - Câu trả lời từ chối chuẩn mực: *"Tôi chỉ hỗ trợ hỏi đáp dựa trên dữ liệu tuyển dụng hiện có trong hệ thống."*
   - Ngăn chặn và bảo vệ tuyệt đối các truy vấn trích xuất mật khẩu, băm mật khẩu hoặc trích xuất toàn bộ cơ sở dữ liệu.
3. **Kiểm soát quyết định (Decision Guard):**
   - Từ chối xếp hạng ứng viên ("ai tốt nhất", "ai nên trúng tuyển") hoặc đưa ra quyết định tuyển dụng thay thế con người.
   - Câu trả lời từ chối chuẩn mực: *"Tôi có thể cung cấp thông tin hồ sơ, kỹ năng, kinh nghiệm và các đánh giá đã được lưu trong hệ thống, nhưng quyết định tuyển dụng cần do người phụ trách thực hiện."*
4. **Không phát sinh SQL tùy biến (Zero LLM Dynamic SQL):**
   - LLM không bao giờ được phép sinh câu lệnh SQL tùy ý.
   - Toàn bộ câu hỏi về số liệu, đếm ứng viên, lọc theo trạng thái đều được chuyển hướng qua các hàm tham số hóa cố định trong `backend/database/db.py`.
5. **Bảo toàn nguyên tắc 7 bảng MySQL:**
   - Không tạo bảng thứ 8 trong cơ sở dữ liệu.
   - Chỉ mục vector được lưu trữ cục bộ dưới dạng tệp nhị phân FAISS tại `backend/rag/index/` (`recruitment.faiss`, `metadata.json`, `index_info.json`).
6. **Bảo mật và phân quyền (RBAC):**
   - Mọi người dùng có phiên hợp lệ (`ADMIN`, `HR`, `MANAGER`) đều có thể hỏi đáp và tra cứu thông tin tuyển dụng.
   - Endpoint tái lập chỉ mục `POST /api/chat/reindex` chỉ cho phép vai trò `ADMIN`; `HR` và `MANAGER` bị từ chối với HTTP 403 Forbidden.

---

## 2. Các Thành phần Đã Triển khai

### 2.1 Backend & RAG Pipeline
- `backend/prompts/recruitment_chat.txt`: Prompt hệ thống quy định chặt chẽ phong cách trả lời tiếng Việt, tuân thủ ngữ cảnh tham chiếu, chống Prompt Injection và yêu cầu trích dẫn nguồn.
- `backend/rag/scope_guard.py`: Bộ lọc tiền xử lý phát hiện câu hỏi ngoài phạm vi nghiệp vụ và câu hỏi tấn công rò rỉ bí mật hệ thống.
- `backend/rag/intent_router.py`: Bộ định tuyến phân loại câu hỏi người dùng thành `DECISION_REFUSAL`, `STRUCTURED`, `HYBRID`, hoặc `SEMANTIC`.
- `backend/rag/document_builder.py`: Trích xuất và chuẩn hóa tài liệu từ 7 bảng (Việc làm, Ứng viên với phân đoạn CV 1,000 ký tự / gối đầu 150 ký tự, Hồ sơ ứng tuyển, Phỏng vấn, Đánh giá, Kết quả AI). Loại trừ 100% thông tin bảng `users`.
- `backend/rag/embedding_service.py`: Dịch vụ tạo vector embedding cục bộ trên CPU bằng mô hình `sentence-transformers/all-MiniLM-L6-v2` (vector 384 chiều, chuẩn hóa L2).
- `backend/rag/vector_store.py`: Lưu trữ và tìm kiếm vector trên FAISS (`IndexFlatIP`), hỗ trợ lọc metadata và lưu đĩa.
- `backend/rag/retriever.py`: Lấy tài liệu phù hợp với ngưỡng tương đồng cosine `>= 0.25` và `top_k <= 8`.
- `backend/rag/context_builder.py`: Xây dựng ngữ cảnh cô đọng, giới hạn 8,000 ký tự và khử trùng lặp nguồn trích dẫn.
- `backend/rag/rag_service.py`: Bộ điều phối tích hợp toàn bộ chu trình xử lý Hybrid RAG.
- `backend/routes/chat_routes.py`: Cung cấp 3 API RESTful: `POST /api/chat`, `POST /api/chat/reindex`, `GET /api/chat/index-info`.
- `backend/scripts/rebuild_rag_index.py`: Script độc lập và hàm phụ trợ phục vụ việc tái lập chỉ mục dữ liệu.

### 2.2 Frontend React
- `frontend/src/services/api.js`: Tích hợp các hàm gọi API chat (`chatApi.ask`, `chatApi.reindex`, `chatApi.indexInfo`).
- `frontend/src/pages/AIChatPage.jsx`: Giao diện trò chuyện chuyên nghiệp, thanh trạng thái chỉ mục vector, gợi ý câu hỏi nhanh, nhãn phân loại loại tìm kiếm (`STRUCTURED`, `HYBRID`, `SEMANTIC`), và danh sách thẻ nguồn trích dẫn có thể nhấp trực tiếp.
- `frontend/src/components/Sidebar.jsx`: Bổ sung mục điều hướng `✨ Trợ lý AI` dẫn tới `/ai-chat`.
- `frontend/src/App.jsx`: Khai báo route bảo vệ `/ai-chat`.

---

## 3. Kết quả Kiểm thử & Nghiệm thu

1. **Bộ kiểm thử tự động (Pytest):**
   - Tạo mới 22 bài kiểm thử trong `backend/tests/test_chat.py`.
   - Kết quả: **158 passed in 3.73s** (0 failed), bảo toàn tuyệt đối 136 bài kiểm thử từ M1 đến M7.
2. **Kiểm tra tĩnh & Đóng gói Frontend:**
   - `npm run lint`: 0 errors, 0 warnings trên 25 tệp.
   - `npm run build`: Thành công trong 571ms (47 modules).
3. **Kiểm tra trực tiếp (Live Verification):**
   - Đếm ứng viên theo trạng thái: Trả lời chính xác số liệu từ MySQL (`retrieval_type: STRUCTURED`).
   - Tìm kiếm kỹ năng (ví dụ: Python/Flask): Trích xuất đúng CV ứng viên và nguồn trích dẫn (`retrieval_type: SEMANTIC`).
   - Hỏi ngoài lề (thời tiết Hà Nội): Từ chối an toàn theo quy định.
   - Phân quyền Re-index: `ADMIN` thành công (HTTP 200), `HR` bị từ chối (HTTP 403).
4. **Kiểm tra toàn vẹn Cơ sở dữ liệu:**
   - Lệnh `SHOW TABLES;` xác nhận cơ sở dữ liệu `ai_recruitment` duy trì **chính xác 7 bảng**.

---

## 4. Kết luận

Milestone M8 — Recruitment Knowledge Chatbot đã hoàn thành xuất sắc toàn bộ các yêu cầu kỹ thuật và ranh giới an toàn. Hệ thống vận hành ổn định và sẵn sàng bàn giao.
