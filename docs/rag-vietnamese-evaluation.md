# Vietnamese Retrieval Evaluation

- **Mục tiêu:** Thẩm định thực nghiệm chất lượng truy xuất ngữ nghĩa tiếng Việt của mô hình nhúng hiện tại (`sentence-transformers/all-MiniLM-L6-v2`) trên tập dữ liệu tuyển dụng chuẩn hóa, đo lường độ chính xác Top-1 và độ bao phủ Top-3.
- **Phạm vi thẩm định:** Các câu hỏi tuyển dụng bằng tiếng Việt thuần ngữ nghĩa, câu hỏi đa ngữ kết hợp thuật ngữ công nghệ tiếng Anh, diễn đạt đồng nghĩa (paraphrase), và câu hỏi không có ngữ cảnh (no-context / out-of-domain).

---

## 1. Thông số Kỹ thuật & Cấu hình Đánh giá

- **Embedding Model:** `sentence-transformers/all-MiniLM-L6-v2`
- **Embedding Dimension:** `384`
- **Vector Index Type:** `faiss.IndexFlatIP` (Cosine similarity trên vector L2-normalized)
- **Cosine Threshold:** `0.25`
- **Number of Benchmark Evaluation Queries:** 6 câu hỏi ngữ nghĩa chuẩn hóa + 2 câu hỏi diễn đạt đồng nghĩa (paraphrase) + 3 câu hỏi hỗn hợp Anh-Việt + 1 câu hỏi ngoài miền (no-context)

---

## 2. Bảng Kết quả Thực nghiệm (Benchmark Evaluation Matrix)

| STT | Query (Câu hỏi truy vấn) | Expected Entity | Top-1 Match | In Top-3 | Cosine Score | Đánh giá |
|:---:|---|:---:|:---:|:---:|:---:|:---:|
| **Q1** | *"Ai có kinh nghiệm xây dựng ứng dụng web phía máy chủ?"* | `CANDIDATE_A` | `CANDIDATE_A` | YES | `0.6772` | CHUẨN XÁC |
| **Q2** | *"Ứng viên nào từng làm việc với cơ sở dữ liệu quan hệ?"* | `CANDIDATE_D` | `CANDIDATE_D` | YES | `0.6734` | CHUẨN XÁC |
| **Q3** | *"Ai có kinh nghiệm tìm kiếm và giao tiếp với ứng viên?"* | `CANDIDATE_B` | `CANDIDATE_B` | YES | `0.7782` | CHUẨN XÁC |
| **Q4** | *"Tìm người có kinh nghiệm xử lý lỗi trong dự án web."* | `CANDIDATE_A` | `CANDIDATE_A` | YES | `0.5987` | CHUẨN XÁC |
| **Q5** | *"Ứng viên nào có kinh nghiệm tuyển dụng nhân sự?"* | `CANDIDATE_B` | `CANDIDATE_B` | YES | `0.7860` | CHUẨN XÁC |
| **Q6** | *"Ai có kỹ năng thiết kế hình ảnh truyền thông?"* | `CANDIDATE_C` | `CANDIDATE_C` | YES | `0.6395` | CHUẨN XÁC |

---

## 3. Đánh giá Diễn đạt Đồng nghĩa (Paraphrase) & Đa ngữ (Mixed-language)

### 3.1. Diễn đạt đồng nghĩa (Paraphrase):
- Câu 1: *"Ứng viên nào từng xây dựng ứng dụng phía máy chủ?"* ➔ Top-1: `CANDIDATE_A` (Score: `0.5507`).
- Câu 2: *"Ai có kinh nghiệm lập trình backend?"* ➔ Top-3: Chứa `CANDIDATE_A` (Score: `0.5160`).
- **Kết luận:** Cả hai cách diễn đạt khác nhau đều định vị đúng ứng viên kỹ sư phần mềm `CANDIDATE_A` trong top kết quả.

### 3.2. Thuật ngữ công nghệ hỗn hợp Anh - Việt:
- *"Tìm ứng viên có kỹ năng Python và Flask."* ➔ Top-1: `Phạm Gia Dũng` (Score: `0.8122`), Top-2: `Nguyễn Văn An` (Score: `0.7788`).
- *"Ứng viên nào biết SQL và cơ sở dữ liệu quan hệ?"* ➔ Định vị chuẩn xác ứng viên cơ sở dữ liệu.
- *"Tìm CV có REST API experience."* ➔ Trích xuất chuẩn xác hồ sơ backend.

### 3.3. Câu hỏi ngoài miền / không có dữ liệu (No-Context Handling):
- Query: *"Ứng viên nào có 20 năm kinh nghiệm vận hành nhà máy điện hạt nhân?"*
- Kết quả: Không có ứng viên nào đạt yêu cầu này. Hệ thống thông qua prompt grounded của Gemini phản hồi trung thực:
  > *"Tôi không tìm thấy đủ thông tin trong dữ liệu tuyển dụng hiện có để trả lời câu hỏi này."*
  (Tuyệt đối không bịa đặt thông tin / No Hallucination).

---

## 4. Tổng hợp Chỉ số (Evaluation Metrics)

- **Tổng số câu hỏi chuẩn (Benchmark Queries):** 6 câu
- **Top-1 Accuracy:** `6/6 (100.0%)`
- **Top-3 Recall:** `6/6 (100.0%)`
- **Khoảng điểm tương đồng hợp lệ (Relevant Scores):** `[0.5987 – 0.7860]`
- **Điểm tương đồng tối thiểu của tài liệu liên quan:** `0.5987`
- **Ngưỡng tương đồng (Threshold):** `0.25`
  - *Nhận xét về ngưỡng 0.25:* Ngưỡng `0.25` phân tách rất rõ ràng giữa khoảng tương quan thấp và các tài liệu nghiệp vụ thực tế. Hệ thống kết hợp bộ lọc tiền xử lý `ScopeGuard` để triệt tiêu các câu hỏi ngoài lề (thời tiết, công thức nấu ăn) trước khi vào vector search, và sử dụng prompt grounded của Gemini để xử lý trường hợp no-context. Do đó ngưỡng `0.25` hoạt động hoàn toàn ổn định và an toàn.

---

## 5. Quyết định Mô hình (Model Decision)

### **KEEP CURRENT MODEL (`all-MiniLM-L6-v2`)**

**Lý do:**
1. Mô hình hiện tại đạt `100% Top-1 Accuracy` và `100% Top-3 Recall` trên bộ truy vấn ngữ nghĩa tiếng Việt chuẩn của bài toán tuyển dụng.
2. Tốc độ sinh vector cực nhanh trên CPU (~20ms), dung lượng nhẹ (~90MB), hoàn toàn tương thích và không tạo thêm gánh nặng tài nguyên cho môi trường đồ án môn học.
3. Việc giữ nguyên mô hình giúp tránh xung đột thư viện hay phụ thuộc không cần thiết khi hệ thống đã đáp ứng vượt mức kỳ vọng.
