# Nhật ký prompt gốc của nhóm

Ghi nguyên văn các prompt nhóm đã gửi cho trợ lý AI (Claude Code) trong quá trình làm báo cáo môn học, theo đúng thứ tự thời gian. Phần "Trả lời lựa chọn" là các câu hỏi làm rõ do AI hỏi và đáp án nhóm đã chọn. Phần "Kết quả" tóm tắt những gì AI đã làm sau mỗi prompt.

- Dự án: Hệ thống quản lý tuyển dụng có tích hợp AI (thư mục `c:\Thanh Duy Du An`)
- Thành viên: Triệu Thanh Duy (Trưởng nhóm), La Công Tuấn, Nguyễn Đức Ngọc Minh
- Thời gian: 29/09/2026 – 30/09/2026

---

## Prompt 1 — 29/09/2026: Đọc tài liệu mẫu và làm báo cáo

```text
https://drive.google.com/drive/folders/1pHFaxiQnkmqVniqsSaubFd1j_FPKIJbo đọc docs và chuẩn bị làm file báo cáo môn học sử dụng skill
```

**Trả lời lựa chọn:**

| Câu hỏi của AI | Lựa chọn của nhóm |
|---|---|
| Số thứ tự nhóm và họ tên thành viên (trưởng nhóm trước) là gì? | Để placeholder |
| Xuất báo cáo theo dạng nào? | Chỉ 1 file gộp |
| Các sơ đồ (Use case, Activity/Sequence, Class, Screen flow, ERD, sơ đồ phân cấp chức năng) xử lý thế nào? | Vẽ và chèn ảnh (Recommended) |

**Kết quả:** AI đọc 7 file mẫu trong thư mục Drive `CacGiaiDoanThucHien` (01 kế hoạch, 02 thu thập yêu cầu, 03 SRS, 04 thiết kế hướng đối tượng, 05 kiểm thử chức năng, 06 screen flow & CSDL, 07 hướng dẫn sử dụng), đọc tài liệu trong `docs/` và mã nguồn, chụp màn hình ứng dụng đang chạy, vẽ sơ đồ và tạo một file Word gộp 7 phần (skill `docx`).

## Prompt 2 — 29/09/2026

```text
continue
```

**Kết quả:** AI tiếp tục hoàn thiện sơ đồ, dựng file Word, cập nhật mục lục bằng Word, xuất PDF, lưu vào `docs/bao-cao/`.

## Prompt 3 — 29/09/2026: Vẽ lại toàn bộ UML bằng StarUML

```text
STARUML UML REDESIGN – AI RECRUITMENT MANAGEMENT SYSTEM

PROJECT:
Hệ thống quản lý tuyển dụng có tích hợp AI

INPUT DOCUMENTS:
- BaoCao_MonHoc_Nhom_XX.docx
- BaoCao_MonHoc_Nhom_XX.pdf

IMPORTANT GOAL:

Rà soát và VẼ LẠI TOÀN BỘ CÁC SƠ ĐỒ UML trong báo cáo
theo đúng ký pháp UML 2.x được StarUML hỗ trợ.

Không chỉ làm đẹp ảnh hiện tại.

Phải sửa:
- sai ký pháp
- sai loại relationship
- sai multiplicity
- sai actor generalization
- sai activity node
- sai decision/merge
- sequence thiếu activation/combined fragment
- class attribute/operation notation
- dependency/controller/service notation
- state machine notation

FINAL diagrams phải được tạo trong STARUML
và lưu thành file .mdj có thể mở/sửa lại bằng StarUML.

KHÔNG được lấy Mermaid/draw.io/Graphviz làm sản phẩm cuối.

PlantUML chỉ được dùng tạm để suy luận nếu cần.
Final source of truth phải là StarUML .mdj.

==================================================
A. PRECHECK – KHÔNG VẼ NGAY
==================================================

Trước tiên đọc toàn bộ:

BaoCao_MonHoc_Nhom_XX.docx

đặc biệt:

PHẦN 2 – Yêu cầu
PHẦN 3 – SRS
PHẦN 4 – Thiết kế hướng đối tượng
PHẦN 6 – Database/Screen Flow

Sau đó kiểm tra source code hiện tại:

frontend/src/

backend/routes/
backend/services/
backend/database/
backend/rag/

Không được tin tuyệt đối sơ đồ cũ.

Phải đối chiếu:

REPORT
+
SOURCE CODE
+
DATABASE SCHEMA

để vẽ mô hình đúng với hệ thống hiện tại.

Không tự invent class/API/relationship không tồn tại.

==================================================
B. INVENTORY SƠ ĐỒ UML PHẢI VẼ LẠI
==================================================

Tạo lại các sơ đồ sau:

01. Use Case Diagram tổng quát

02. UC001 Activity Diagram
03. UC001 Sequence Diagram

04. UC002 Activity Diagram
05. UC002 Sequence Diagram

06. UC003 Activity Diagram
07. UC003 Sequence Diagram

08. UC004 Activity Diagram
09. UC004 Sequence Diagram

10. UC005 Activity Diagram
11. UC005 Sequence Diagram

12. UC006 Activity Diagram
13. UC006 Sequence Diagram

14. UC007 Activity Diagram
15. UC007 Sequence Diagram

16. UC008 Activity Diagram
17. UC008 Sequence Diagram

18. UC009 Activity Diagram
19. UC009 Sequence Diagram

20. UC010 Activity Diagram
21. UC010 Sequence Diagram

22. UC011 Activity Diagram
23. UC011 Sequence Diagram

24. UC012 Activity Diagram
25. UC012 Sequence Diagram

26. UC013 Activity Diagram
27. UC013 Sequence Diagram

28. UC014 Activity Diagram
29. UC014 Sequence Diagram

30. Application State Machine Diagram

31. Entity Class Diagram

32. Controller / Service Class Diagram

33. Component Diagram – kiến trúc tổng thể

Tổng:
33 UML diagrams.

==================================================
C. NHỮNG SƠ ĐỒ KHÔNG PHẢI UML
==================================================

Không ép các sơ đồ sau thành UML sai chuẩn:

- Sơ đồ phân cấp chức năng
- Screen Flow
- ERD

Hình phân cấp chức năng:
giữ là functional decomposition diagram.

Screen Flow:
giữ là navigation/screen-flow diagram.

ERD:
giữ đúng notation ERD/Crow's Foot.

Nếu StarUML có ERD extension đang dùng được,
có thể dựng ERD trong StarUML.

Nếu không:
không gọi ERD đó là UML Class Diagram.

==================================================
D. CẤU TRÚC STARUML PROJECT
==================================================

Tạo:

docs/uml/AI_Recruitment_System.mdj

Trong Model Explorer tạo package:

AI Recruitment System
│
├── 01 Use Case Model
│
├── 02 Activity Diagrams
│   ├── UC001
│   ├── UC002
│   ...
│   └── UC014
│
├── 03 Sequence Diagrams
│   ├── UC001
│   ├── UC002
│   ...
│   └── UC014
│
├── 04 State Machine
│
├── 05 Domain Model
│
├── 06 Service Model
│
└── 07 Component Model

Không tạo một đống model element trùng tên ngoài package.

Tái sử dụng Actor / Class model element khi phù hợp.

==================================================
E. QUY TẮC HÌNH THỨC CHUNG
==================================================

Tất cả UML diagram:

- nền trắng
- không gradient
- không shadow kiểu infographic
- không icon trang trí
- không màu ngẫu nhiên
- ưu tiên StarUML default style

Có thể dùng:
đen
xám
xanh nhạt

nhưng notation quan trọng hơn màu.

Font phải đọc được khi đưa vào Word/PDF.

Không shrink chữ xuống cực nhỏ.

Nếu diagram quá rộng:
dùng trang landscape trong báo cáo,
KHÔNG ép toàn bộ vào một hình bé.

==================================================
F. USE CASE DIAGRAM – UML CHUẨN
==================================================

Use Case Diagram phải sử dụng:

Actor:
stick-man UML Actor

System Boundary:
Rectangle

Use Case:
Ellipse

Association:
solid line, không cần arrow

Generalization:
solid line + hollow triangle

<<include>> / <<extend>>:
dashed dependency + stereotype

KHÔNG sử dụng include/extend nếu không thực sự có semantics.

==================================================
G. ACTORS
==================================================

Có 4 actor:

HR
ADMIN
MANAGER
Google Gemini

Google Gemini là external system actor.

Không đặt Google Gemini bên trong system boundary.

==================================================
H. ACTOR GENERALIZATION
==================================================

Requirement hiện tại:

ADMIN có toàn bộ quyền của HR
và thêm quyền quản trị.

Vì vậy:

ADMIN là specialized Actor.

Vẽ:

ADMIN
  |
  | generalization
  ▼
 HR

Hollow triangle phải nằm phía HR.

Tức:

ADMIN ─────▷ HR

KHÔNG vẽ ngược:

HR ─────▷ ADMIN

Không dùng mũi tên association thường để biểu diễn inheritance.

==================================================
I. SYSTEM BOUNDARY
==================================================

Tên boundary:

HỆ THỐNG QUẢN LÝ TUYỂN DỤNG CÓ TÍCH HỢP AI

Tất cả use case nằm trong boundary.

Actor nằm ngoài.

==================================================
J. 14 USE CASE
==================================================

Giữ đúng mã và tên:

UC001
Đăng nhập, đăng xuất

UC002
Quản lý vị trí tuyển dụng

UC003
Quản lý ứng viên và CV

UC004
Tạo hồ sơ ứng tuyển

UC005
Cập nhật trạng thái hồ sơ

UC006
Quản lý lịch phỏng vấn

UC007
Đánh giá ứng viên

UC008
AI tóm tắt CV

UC009
AI gợi ý câu hỏi phỏng vấn

UC010
AI soạn email

UC011
Xem lịch sử kết quả AI

UC012
Xem Dashboard thống kê

UC013
Hỏi đáp Chatbot tuyển dụng

UC014
Đồng bộ chỉ mục tri thức

Không đổi mã UC.

==================================================
K. ACTOR – USE CASE ASSOCIATION
==================================================

HR:

UC001
UC002
UC003
UC004
UC005
UC006
UC007
UC008
UC009
UC010
UC011
UC012
UC013

ADMIN:

kế thừa các UC của HR thông qua Generalization.

Ngoài ra ADMIN:

UC014

Không nối lặp ADMIN vào tất cả UC của HR
nếu Generalization đã thể hiện kế thừa.

MANAGER:

UC001
UC002
UC003
UC006
UC007
UC008
UC009
UC011
UC012
UC013

Lưu ý:
UC002/UC003 với MANAGER là quyền xem,
không phải thêm/sửa/xóa.

Không nối MANAGER tới UC004/UC005/UC010/UC014
nếu source code hiện tại không cho phép.

Google Gemini:

UC008
UC009
UC010
UC013

Không nối Google Gemini tới:

UC001–UC007
UC011
UC012
UC014

UC014 reindex dùng local embedding/FAISS,
không phải Gemini.

==================================================
L. KHÔNG LẠM DỤNG INCLUDE / EXTEND
==================================================

Không tự thêm:

UC008 <<include>> UC011

hay:

UC013 <<include>> UC014

vì chúng là use case độc lập.

History AI là chức năng đọc riêng.

Reindex là chức năng quản trị riêng.

Nếu không có mandatory reusable behavior trong SRS,
không dùng include/extend.

==================================================
M. ACTIVITY DIAGRAM – UML 2.x
==================================================

Mỗi UC phải sử dụng:

Initial Node:
solid black circle

Action:
rounded Activity Action

Decision Node:
diamond

Merge Node:
diamond

Activity Final:
bullseye
black dot bên trong vòng tròn

Control Flow:
solid arrow

Guard condition:
[Điều kiện]

Ví dụ:

[Hợp lệ]
[Không hợp lệ]
[Có quyền]
[Không có quyền]

KHÔNG viết:

Có
Không

lơ lửng cạnh đường nối nếu có thể dùng guard.

==================================================
N. ACTIVITY PARTITIONS / SWIMLANES
==================================================

Ưu tiên dùng Activity Partition.

Với UC nghiệp vụ thường:

Người dùng
Hệ thống

Với AI:

Người dùng
Hệ thống
Google Gemini

Không biến Activity Diagram thành sơ đồ source-code.

Chi tiết API, route, MySQL
để dành cho Sequence Diagram.

==================================================
O. ACTIVITY DIAGRAM ERROR FLOW
==================================================

Luồng lỗi phải:

decision
→ guard
→ error action
→ merge / quay lại bước thích hợp

Ví dụ:

Nhập thông tin
        ↓
◇ Dữ liệu hợp lệ?
   ├─ [Không] → Hiển thị lỗi → quay lại form
   └─ [Có] → Lưu dữ liệu

Không nối flow rối,
không để nhiều arrow chọc ngang action.

==================================================
P. ACTIVITY FOR UC001
==================================================

Partitions:

Người dùng
Hệ thống

Flow:

Initial

Người dùng:
Mở trang đăng nhập
Nhập email, mật khẩu
Nhấn Đăng nhập

Hệ thống:
Kiểm tra dữ liệu đầu vào

Decision:
[Dữ liệu hợp lệ?]

[Không]
→ Hiển thị lỗi nhập liệu
→ quay về form

[Có]
→ Tra cứu tài khoản
→ Kiểm tra mật khẩu

Decision:
[Thông tin xác thực đúng?]

[Không]
→ Hiển thị thông báo đăng nhập thất bại
→ quay lại form

[Có]
→ Tạo session
→ Điều hướng Dashboard

Sau đó có thể model hành động logout:

Người dùng:
Chọn Đăng xuất

Hệ thống:
Xóa session
Hiển thị trang login

Final.

Không đưa câu SQL vào Activity Diagram.

==================================================
Q. ACTIVITY UC002 – JOB
==================================================

Partitions:

HR/ADMIN/MANAGER
Hệ thống

Flow:

Mở danh sách vị trí

Decision:
[Thao tác?]

branches:

[Xem/Tìm kiếm]
→ nhập từ khóa/filter
→ hệ thống truy vấn
→ hiển thị danh sách

[Thêm/Sửa]
→ kiểm tra quyền
→ nhập/chỉnh dữ liệu
→ validate
→ lưu
→ hiển thị kết quả

[Xóa]
→ kiểm tra quyền
→ kiểm tra vị trí có Application không
→ [Có] báo không được xóa
→ [Không] xóa

MANAGER:
view only.

Không ghi MANAGER có create/delete.

==================================================
R. ACTIVITY UC003 – CANDIDATE/CV
==================================================

Partitions:

HR/ADMIN
Hệ thống

Flow:

Mở Candidate Form
Nhập thông tin
Chọn CV optional

Decision:
[Có file CV?]

Nếu có:
validate extension/size
save safe filename
extract text

Sau đó:
validate candidate
save/update candidate
show detail

Error flow:
file invalid
data invalid
candidate linked application cannot delete.

==================================================
S. ACTIVITY UC004 – CREATE APPLICATION
==================================================

HR/ADMIN:
chọn candidate
chọn job
nhập note
nhấn tạo

System:
check candidate/job exist

Decision:
[Tồn tại?]

No:
404 action

Yes:
check duplicate candidate_id + job_id

Decision:
[Đã tồn tại?]

Yes:
409 duplicate

No:
create Application status NEW
show application detail
final.

==================================================
T. ACTIVITY UC005 – APPLICATION STATUS
==================================================

HR/ADMIN:
mở Application
chọn trạng thái tiếp theo
xác nhận

System:
check authorization

Decision:
[Có quyền?]

No:
403

Yes:
validate transition

Allowed:

NEW → SCREENING
NEW → REJECTED

SCREENING → INTERVIEW
SCREENING → REJECTED

INTERVIEW → PASSED
INTERVIEW → REJECTED

PASSED/REJECTED:
terminal

Invalid:
400

AI / evaluation / interview completion:
KHÔNG tự chuyển status.

==================================================
U. ACTIVITY UC006 – INTERVIEW
==================================================

Partitions:

HR/ADMIN/MANAGER
Hệ thống

Create branch:
HR/ADMIN tạo lịch

Edit branch:
chỉ SCHEDULED

Complete branch:
HR/ADMIN
hoặc assigned MANAGER

Cancel:
HR/ADMIN

State transitions:

SCHEDULED
→ COMPLETED
or
→ CANCELLED

No reverse transition.

==================================================
V. ACTIVITY UC007 – EVALUATION
==================================================

Partitions:

ADMIN/HR/MANAGER
Hệ thống

Enter:
technical_score
communication_score
experience_score
comment

Validate each score:
integer 1..5

No:
400

Yes:
save evaluation
evaluator_id = current user

Display:
average = (t+c+e)/3

Average:
runtime only
not stored.

Edit:
creator or ADMIN only.

==================================================
W. ACTIVITY UC008 – CV SUMMARY
==================================================

Partitions:

User
System
Google Gemini

User:
nhấn Tóm tắt CV

System:
load Application
load Candidate.cv_text
load Job/JD

Decision:
[Context đầy đủ?]

No:
display error

Yes:
build safe prompt
send to Gemini

Gemini:
generate summary

Decision:
[Gemini success?]

No:
friendly error

Yes:
System save AIResult type CV_SUMMARY
display result

Do NOT update application.status.

==================================================
X. ACTIVITY UC009
==================================================

Tương tự UC008.

Output:
exactly 5 interview questions.

Save:
AIResult type INTERVIEW_QUESTION.

No status change.

==================================================
Y. ACTIVITY UC010
==================================================

User:
select email type

INTERVIEW_INVITATION
or
RESULT

Nếu RESULT:

Decision:
[Application status PASSED/REJECTED?]

No:
error

Yes:
continue

System:
build prompt
call Gemini
save AIResult EMAIL
show draft

Không gửi SMTP.

==================================================
Z. ACTIVITY UC011
==================================================

User:
open application detail
select/view AI history

System:
query ai_results by application_id
sort result
display history

No Gemini API call.

==================================================
AA. ACTIVITY UC012
==================================================

User:
open Dashboard

System:
query aggregates

- open jobs
- candidates
- applications
- upcoming interviews
- status distribution
- source distribution
- final pass rate

Time-to-hire:

Decision:
[Đủ dữ liệu kết thúc?]

No:
show unavailable message

Do not fabricate metric.

==================================================
AB. ACTIVITY UC013 – RAG CHATBOT
==================================================

Partitions:

User
System
Google Gemini

User:
submit question

System:
Scope Guard

Decision:
[Outside scope?]

Yes:
return refusal
Final/loop chat

No:
Decision Guard

Decision:
[Hiring decision/ranking request?]

Yes:
return human-decision refusal

No:
Intent Router

Decision:
[Retrieval type]

[STRUCTURED]
→ safe predefined SQL
→ format answer

[SEMANTIC]
→ embed query
→ FAISS retrieval
→ context builder
→ Gemini
→ grounded answer + sources

[HYBRID]
→ SQL pre-filter
→ FAISS retrieval
→ context builder
→ Gemini
→ answer + sources

No arbitrary LLM SQL.

==================================================
AC. ACTIVITY UC014 – REINDEX
==================================================

Actor:
ADMIN only

Flow:

Open AI assistant
Select Đồng bộ dữ liệu AI
System check role

Decision:
[ADMIN?]

No:
403

Yes:
read trusted DB data:

jobs
candidates
applications
interviews
evaluations

Do NOT index:
users
ai_results

Build documents
chunk CV
generate normalized embeddings
build FAISS IndexFlatIP
save:
recruitment.faiss
metadata.json
index_info.json

Return document count/build time

Final.

Google Gemini does NOT participate.

==================================================
AD. SEQUENCE DIAGRAM – UML RULES
==================================================

Sequence Diagram phải có:

Actor Lifeline

Object Lifeline

Activation bar

Synchronous Message:
solid line + filled arrowhead

Return Message:
dashed line

Self Message:
chỉ khi có actual self-call

Combined Fragment:
alt
opt
loop

Guard:
[condition]

Destroy message:
chỉ dùng nếu object thực sự bị destroy.

Không nối đường tùy ý.

Time flows:
TOP → BOTTOM.

==================================================
AE. SEQUENCE LIFELINE STEREOTYPES
==================================================

Dùng stereotype logic:

<<actor>>
User

<<boundary>>
React Page

<<control>>
Flask Route / Controller

<<service>>
Service

<<database>>
MySQL

<<external>>
Google Gemini

Có thể dùng StarUML stereotype display.

==================================================
AF. KHÔNG DÙNG MYSQL.TABLE LÀM LIFELINE TÙY TIỆN
==================================================

Không tạo:

MySQL.users
MySQL.jobs
MySQL.candidates

như các hệ thống riêng biệt.

Ưu tiên một lifeline:

db : MySQL

Message thể hiện repository action:

get_user_by_email()
create_job()
create_candidate()
get_application_by_id()

Nếu cần rõ hơn có thể dùng:

UserRepository
JobRepository

nhưng chỉ khi source architecture thực sự có concept đó.

==================================================
AG. UC001 SEQUENCE
==================================================

Lifelines:

Người dùng
loginPage : LoginPage
auth : AuthRoutes
db : MySQL

Flow:

Người dùng -> LoginPage:
nhập email/password

LoginPage -> AuthRoutes:
POST /api/auth/login

activate AuthRoutes

AuthRoutes -> DB:
get_user_by_email(email)

DB --> AuthRoutes:
user

AuthRoutes -> AuthRoutes:
check_password_hash()

alt [credentials valid]

AuthRoutes -> AuthRoutes:
create session

AuthRoutes --> LoginPage:
200 user + Set-Cookie

LoginPage --> User:
navigate Dashboard

else [invalid]

AuthRoutes --> LoginPage:
401 error

LoginPage --> User:
show error

end

Logout:

User -> LoginPage
LoginPage -> AuthRoutes:
POST /api/auth/logout

AuthRoutes -> AuthRoutes:
session.clear()

AuthRoutes --> LoginPage:
200

LoginPage --> User:
navigate login

==================================================
AH. UC002 SEQUENCE
==================================================

Lifelines:

HR/ADMIN
jobPage : JobPage/JobFormPage
jobController : JobRoutes
db : MySQL

Create flow:

POST /api/jobs
check role
validate job
create_job()
return 201

Use alt:
[valid]
[invalid]

Delete:

DELETE /api/jobs/{id}

controller -> db:
has_applications(job_id)

alt
[linked]
→ 409

[not linked]
→ delete_job()
→ 200

==================================================
AI. UC003 SEQUENCE
==================================================

Lifelines:

HR/ADMIN
candidatePage
candidateController
cvStorage
cvExtractor
db

POST multipart

controller:
validate candidate
validate file

opt [file uploaded]

save safe filename
extract_cv_text

end

create/update candidate
return candidate.

==================================================
AJ. UC004 SEQUENCE
==================================================

Lifelines:

HR/ADMIN
ApplicationCreatePage
ApplicationRoutes
MySQL

POST /api/applications

get candidate/job
check duplicate

alt
[duplicate]
409

else
create application status NEW
201
navigate detail

==================================================
AK. UC005 SEQUENCE
==================================================

Lifelines:

HR/ADMIN
ApplicationDetailPage
ApplicationRoutes
MySQL

PUT /api/applications/{id}/status

load current application
check role
validate ALLOWED_TRANSITIONS

alt:
[allowed]
update status
200

[invalid]
400

[unauthorized]
403

==================================================
AL. UC006 SEQUENCE
==================================================

Lifelines:

HR/ADMIN/MANAGER
InterviewPage
InterviewRoutes
MySQL

Use separate combined fragments for:

create
edit
complete
cancel

Role guards must reflect actual permissions.

==================================================
AM. UC007 SEQUENCE
==================================================

Lifelines:

User
EvaluationFormPage
EvaluationRoutes
MySQL

POST evaluation

validate score 1..5

alt valid/invalid

For update:

check owner OR ADMIN.

==================================================
AN. UC008/009/010 SEQUENCE
==================================================

Use common structure:

Actor
ApplicationDetailPage
AIRoutes
AIService
GeminiService
Google Gemini
MySQL

Backend first loads source data from DB.

AIService builds prompt.

GeminiService sends external request.

Google Gemini returns text.

AIService / route saves AIResult.

Return generated content.

Use alt fragment:

[Gemini success]
[Gemini error]

No automatic application status update.

==================================================
AO. UC011 SEQUENCE
==================================================

Actor
ApplicationDetailPage
AI/API route
MySQL

GET /api/applications/{id}/ai-results

No Gemini lifeline.

==================================================
AP. UC012 SEQUENCE
==================================================

Actor
DashboardPage
DashboardRoutes
MySQL

GET dashboard

Controller issues aggregate queries.

DB returns metrics.

Controller returns JSON.

Dashboard renders cards/charts.

No Gemini.

==================================================
AQ. UC013 SEQUENCE – QUAN TRỌNG
==================================================

Lifelines:

User
AIChatPage
ChatRoutes
ScopeGuard
DecisionGuard
IntentRouter
RAGService
MySQL
Retriever
FAISS
GeminiService
Google Gemini

Flow:

User -> UI:
ask question

UI -> ChatRoutes:
POST /api/chat

ChatRoutes -> ScopeGuard:
check_scope()

alt [out of scope]
return refusal

else

ChatRoutes -> DecisionGuard:
check_decision_request()

alt [ranking/decision]
return refusal

else

ChatRoutes -> IntentRouter:
route_intent()

alt [STRUCTURED]

ChatRoutes/RAGService -> MySQL:
safe predefined SELECT

MySQL --> service:
rows

service --> UI:
grounded structured answer

else [SEMANTIC]

RAGService -> Retriever
Retriever -> FAISS
FAISS --> Retriever:
top-k docs

RAGService -> GeminiService
GeminiService -> Google Gemini
Google Gemini --> GeminiService:
answer

return sources + answer

else [HYBRID]

RAGService -> MySQL:
filter candidate IDs

RAGService -> Retriever:
retrieve with filters

Retriever -> FAISS

then Gemini call

end

end

end

Must show:
NO dynamic SQL from Gemini.

==================================================
AR. UC014 SEQUENCE
==================================================

Lifelines:

ADMIN
AIChatPage
ChatRoutes
RAGService
DocumentBuilder
MySQL
EmbeddingService
VectorStore
FAISS files

POST /api/chat/reindex

check ADMIN

alt [not admin]
403

else

RAGService -> DocumentBuilder

DocumentBuilder -> MySQL:
read trusted tables

MySQL --> DocumentBuilder:
records

DocumentBuilder:
build/chunk documents

RAGService -> EmbeddingService:
embed documents

EmbeddingService --> RAGService:
normalized vectors

RAGService -> VectorStore:
build/save index

VectorStore -> FAISS files:
write index + metadata

return index info

end

No Google Gemini lifeline.

==================================================
AS. STATE MACHINE DIAGRAM
==================================================

Create real UML State Machine Diagram.

Pseudostate Initial
→ NEW

States:

NEW
SCREENING
INTERVIEW
PASSED
REJECTED

Transitions:

NEW
→ SCREENING
event: startScreening

NEW
→ REJECTED
event: reject

SCREENING
→ INTERVIEW
event: moveToInterview

SCREENING
→ REJECTED
event: reject

INTERVIEW
→ PASSED
event: pass

INTERVIEW
→ REJECTED
event: reject

PASSED:
terminal

REJECTED:
terminal

PASSED and REJECTED connect to Final State.

No outgoing transitions from terminal states.

Do not add:
AI result
Interview completed
Evaluation added

as automatic status transitions.

==================================================
AT. ENTITY CLASS DIAGRAM – UML SYNTAX
==================================================

StarUML Class notation:

ClassName

----------------

-attributeName: Type

----------------

+operation(param: Type): ReturnType

Current style such as:

+int id
+string name

is NOT acceptable.

Use:

+id: int
+name: string

or if modeling encapsulation:

-id: int
-name: string

Be consistent.

==================================================
AU. ENTITY CLASSES
==================================================

Classes:

User

Job

Candidate

Application

Interview

Evaluation

AIResult

Attributes must reflect actual 7-table database schema.

==================================================
AV. ENUMERATIONS
==================================================

Prefer UML Enumeration elements:

Role
- ADMIN
- HR
- MANAGER

JobStatus
- OPEN
- CLOSED

CandidateSource
- FACEBOOK
- LINKEDIN
- WEBSITE
- REFERRAL
- JOB_SITE
- OTHER

ApplicationStatus
- NEW
- SCREENING
- INTERVIEW
- PASSED
- REJECTED

InterviewStatus
- SCHEDULED
- COMPLETED
- CANCELLED

AIResultType
- CV_SUMMARY
- INTERVIEW_QUESTION
- EMAIL

Associate attribute type to corresponding Enumeration.

==================================================
AW. ENTITY RELATIONSHIPS
==================================================

Use standard Association.

Candidate:
1

Application:
0..*

Meaning:
one Candidate can have many Applications.

Job:
1

Application:
0..*

Application:
1

Interview:
0..*

Application:
1

Evaluation:
0..*

Application:
1

AIResult:
0..*

User:
1

Interview:
0..*

role:
interviewer

User:
1

Evaluation:
0..*

role:
evaluator

Do NOT invent:

Candidate composition Application

Job aggregation Application

unless lifecycle semantics truly justify it.

Standard association is sufficient.

==================================================
AX. ASSOCIATION ROLE NAMES
==================================================

Where helpful show:

Candidate
applications

Job
applications

Application
interviews

Application
evaluations

Application
aiResults

User
conductedInterviews

User
evaluations

Avoid Vietnamese relationship verbs floating on the line
if role/multiplicity provides cleaner UML.

==================================================
AY. ASSOCIATION CLASS / MANY-TO-MANY
==================================================

Do not draw direct:

Candidate * ---- * Job

without explanation.

Application is effectively the association entity
linking Candidate and Job.

Therefore use:

Candidate 1 ---- 0..* Application

Job 1 ---- 0..* Application

==================================================
AZ. OPERATIONS
==================================================

Operations must use UML syntax.

Example:

+getJobs(keyword: string, status: JobStatus): List<Job>

+createJob(data: JobData): Job

+deleteJob(id: int): bool

NOT:

+get_jobs(keyword, status): List

unless source naming intentionally snake_case.

Use actual source method names where possible,
but keep correct UML parameter/type syntax.

==================================================
BA. CONTROLLER/SERVICE CLASS DIAGRAM
==================================================

Do NOT represent every dependency as solid Association.

Use stereotypes:

<<controller>>
AuthController
JobController
CandidateController
ApplicationController
InterviewController
EvaluationController
AIController
ChatController

<<service>>
AIService
GeminiService
RAGService
EmbeddingService
Retriever
VectorStore
ScopeGuard
IntentRouter

<<repository>> or <<database>>
Database

==================================================
BB. DEPENDENCY TYPE
==================================================

Controller uses Database:

Dependency
dashed arrow

Controller uses Service:

Dependency
dashed arrow

AIService uses GeminiService:

Dependency
dashed arrow

RAGService uses:

ScopeGuard
IntentRouter
Retriever
GeminiService
Database

Dependency.

Retriever uses:

EmbeddingService
VectorStore

Dependency.

VectorStore uses FAISS:
dependency.

Do NOT use aggregation/composition
between Controller and Database.

==================================================
BC. CLASS GENERALIZATION
==================================================

Do not add inheritance
unless actual source code has inheritance.

Do NOT draw:

AIService extends GeminiService

because AIService USES GeminiService.

That is Dependency,
not Generalization.

==================================================
BD. COMPONENT DIAGRAM – HÌNH KIẾN TRÚC
==================================================

Replace generic architecture drawing with UML Component Diagram.

Components:

<<component>>
React SPA

<<component>>
Flask REST API

<<component>>
Authentication Module

<<component>>
Recruitment Module

<<component>>
AI Module

<<component>>
RAG Chatbot Module

<<database>>
MySQL 8.4

<<component>>
Local Vector Store / FAISS

<<component>>
Local Embedding Model

<<external>>
Google Gemini API

<<artifact/storage>>
CV Upload Storage

Relations:

React SPA
→ Flask REST API
HTTP/JSON

Flask API
→ MySQL

Flask API / Recruitment
→ CV Storage

AI Module
→ Google Gemini API
HTTPS

RAG Module
→ MySQL

RAG Module
→ Embedding Model

RAG Module
→ FAISS

RAG Module
→ Google Gemini
only for semantic/hybrid generation.

Do not expose Gemini directly to React.

==================================================
BE. COMPONENT INTERFACE PRINCIPLE
==================================================

React never calls Gemini directly.

Only Flask backend does.

Show this clearly.

Do NOT draw:

React → Google Gemini.

==================================================
BF. STARUML PAGE LAYOUT
==================================================

Use layout readable in A4 report.

Use Case:
prefer landscape.

Large Class diagrams:
prefer landscape.

Complex Sequence UC013/UC014:
landscape.

Activity:
portrait or landscape depending complexity.

Do not reduce font below readable size.

==================================================
BG. EXPORT FORMAT
==================================================

For every diagram export:

SVG preferred.

Also export PNG fallback.

Folder:

docs/uml/export/

Naming:

01_use_case_overview.svg

02_uc001_activity.svg
03_uc001_sequence.svg

04_uc002_activity.svg
05_uc002_sequence.svg

...

29_uc014_sequence.svg

30_application_state_machine.svg

31_entity_class_diagram.svg

32_service_class_diagram.svg

33_component_diagram.svg

Also PNG versions:

same names .png

Use high resolution.

No screenshot of StarUML UI.

Only exported diagram canvas.

==================================================
BH. IMAGE QUALITY
==================================================

Final image requirements:

- no blur
- no pixelated text
- no cropped labels
- no overlapping relations
- no unreadable multiplicity
- no arrow crossing class text
- no arrows under lifeline text
- no tiny captions

Use orthogonal routing where supported.

==================================================
BI. UPDATE WORD REPORT
==================================================

After diagrams are approved:

replace current images in:

BaoCao_MonHoc_Nhom_XX.docx

Keep current figure numbers:

Hình 2
...
Hình 34

unless diagram inventory forces explicit renumbering.

Do not break Table of Contents.

Do not randomly change captions.

==================================================
BJ. FIGURE MAPPING
==================================================

Maintain:

Hình 2
Use Case tổng quát

Hình 3/4
UC001 Activity/Sequence

Hình 5/6
UC002

Hình 7/8
UC003

Hình 9/10
UC004

Hình 11/12
UC005

Hình 13/14
UC006

Hình 15/16
UC007

Hình 17/18
UC008

Hình 19/20
UC009

Hình 21/22
UC010

Hình 23/24
UC011

Hình 25/26
UC012

Hình 27/28
UC013

Hình 29/30
UC014

Hình 31
Component/Architecture Diagram

Hình 32
Application State Machine

Hình 33
Entity Class Diagram

Hình 34
Controller/Service Class Diagram

==================================================
BK. DO NOT MODIFY FUNCTIONAL REQUIREMENTS
==================================================

Do NOT change business logic just to make diagrams easier.

Keep:

7 MySQL tables.

Keep role rules.

Keep application transitions.

Keep interview transitions.

Keep AI decision-support rule.

Keep Gemini functions.

Keep RAG architecture.

Diagrams must describe the implemented system,
not redesign the backend.

==================================================
BL. UML VALIDATION CHECKLIST – USE CASE
==================================================

For Use Case diagram verify:

[ ] Actors outside boundary
[ ] Use cases inside boundary
[ ] Association solid lines
[ ] ADMIN → HR actor generalization correct
[ ] Gemini only external AI actor
[ ] No fake include/extend
[ ] No arrowheads on plain actor-use-case associations
[ ] UC IDs/names exact

==================================================
BM. UML VALIDATION CHECKLIST – ACTIVITY
==================================================

For each Activity Diagram verify:

[ ] Initial Node
[ ] Activity Final
[ ] Action nodes
[ ] Decision nodes
[ ] Merge nodes where required
[ ] Guards in [ ]
[ ] Partitions/swimlanes
[ ] No flowchart-only notation
[ ] Error paths rejoin logically
[ ] No hanging arrows

==================================================
BN. UML VALIDATION CHECKLIST – SEQUENCE
==================================================

For each Sequence Diagram verify:

[ ] Actor lifeline
[ ] Boundary UI lifeline
[ ] Controller/service lifeline
[ ] Database/external lifelines
[ ] Activation bars
[ ] Synchronous messages
[ ] Dashed returns
[ ] alt/opt/loop used correctly
[ ] Guards in [ ]
[ ] Time top-to-bottom
[ ] No messages without sender/receiver
[ ] No fake external calls

==================================================
BO. UML VALIDATION CHECKLIST – CLASS
==================================================

Verify:

[ ] attributeName: Type
[ ] operation(param: Type): ReturnType
[ ] visibility consistent
[ ] multiplicity on both ends
[ ] correct associations
[ ] correct dependencies
[ ] no fake inheritance
[ ] enums modeled as Enumeration
[ ] no Candidate ↔ Job direct M:N duplicate
[ ] controllers/services separated from domain model

==================================================
BP. UML VALIDATION CHECKLIST – STATE MACHINE
==================================================

Verify:

[ ] Initial Pseudostate
[ ] State elements
[ ] valid transitions only
[ ] transition labels
[ ] no invalid reverse transitions
[ ] PASSED terminal
[ ] REJECTED terminal
[ ] Final State
[ ] AI does not trigger automatic state changes

==================================================
BQ. SOURCE CODE CROSS-CHECK
==================================================

Before final PASS, compare every Sequence/Class/Component diagram with:

backend/routes
backend/services
backend/database
backend/rag
frontend/src

If report and implementation differ:

DO NOT silently invent.

Create:

UML_REPORT_CODE_MISMATCH.md

with:

Diagram
Report says
Code says
Chosen representation
Reason

Prefer implemented behavior
unless course document explicitly defines intended design.

==================================================
BR. STARUML SOURCE VALIDATION
==================================================

Final .mdj must:

- open in StarUML without error
- contain all packages
- contain all diagrams
- preserve editable model elements
- not only contain imported PNGs

This is critical.

Do not create an .mdj that merely embeds images.

==================================================
BS. FINAL DELIVERABLES
==================================================

Produce:

docs/uml/AI_Recruitment_System.mdj

docs/uml/export/*.svg

docs/uml/export/*.png

updated:
BaoCao_MonHoc_Nhom_XX.docx

optional:
BaoCao_MonHoc_Nhom_XX_UML_FIXED.pdf

and:

docs/uml/UML_VALIDATION_REPORT.md

==================================================
BT. UML VALIDATION REPORT FORMAT
==================================================

Return:

STARUML UML REDESIGN REPORT

1. Source Documents Reviewed

2. Source Code Reviewed

3. Diagram Inventory

4. UML Issues Found in Existing Report

5. Use Case Diagram
PASS / NEEDS FIX

6. Activity Diagrams

UC001 PASS/FAIL
UC002 PASS/FAIL
...
UC014 PASS/FAIL

7. Sequence Diagrams

UC001 PASS/FAIL
...
UC014 PASS/FAIL

8. State Machine
PASS/FAIL

9. Entity Class Diagram
PASS/FAIL

10. Controller / Service Class Diagram
PASS/FAIL

11. Component Diagram
PASS/FAIL

12. Non-UML Diagrams

Functional Decomposition:
...

Screen Flow:
...

ERD:
...

13. StarUML Source File

Path:
...

Openable:
YES / NO

Editable elements:
YES / NO

14. Export Verification

SVG:
...

PNG:
...

15. Report Replacement

Updated DOCX:
YES / NO

Figure captions preserved:
YES / NO

16. Report-Code Mismatches

...

17. Remaining Limitations

...

18. FINAL STATUS

STARUML UML REDESIGN:
PASS / PARTIAL / BLOCKED

==================================================
BU. ABSOLUTE RULE
==================================================

Do not say:

"đúng chuẩn StarUML"

only because the diagrams visually resemble StarUML.

PASS requires:

1. UML 2.x semantics are correct.
2. Model is actually editable in StarUML.
3. Relationship types are correct.
4. Activity/Sequence notation is correct.
5. Multiplicity and guards are correct.
6. Source code/report were cross-checked.
7. Final .mdj opens successfully.
```

**Trả lời lựa chọn:**

| Câu hỏi của AI | Lựa chọn của nhóm |
|---|---|
| Máy chưa có StarUML. Mình xử lý thế nào? | Cài qua winget (Recommended) |

**Kết quả:** AI cài StarUML 7.0.0, dựng 33 sơ đồ UML bằng API của StarUML thành `docs/uml/AI_Recruitment_System.mdj`, xuất SVG/PNG vào `docs/uml/export/`, viết `UML_REPORT_CODE_MISMATCH.md` và `UML_VALIDATION_REPORT.md`, thay hình trong báo cáo Word. Trạng thái PARTIAL do ảnh có watermark "UNREGISTERED" của bản StarUML chưa đăng ký.

## Prompt 4 — 29/09/2026

```text
continue
```

**Kết quả:** AI chờ tiến trình dựng model chạy nền, sửa bố cục các class diagram và component diagram, hoàn tất xuất ảnh và báo cáo.

## Prompt 5 — 30/09/2026: Tên thành viên, bỏ trang ngang, bỏ ô giải thích

Kèm 2 ảnh chụp: hộp thoại Page Setup của Word (lề Top 2 cm, Left 3 cm, Bottom 2 cm, Right 2 cm, hướng dọc) và sơ đồ hoạt động UC006 có ô ghi chú ở góc phải.

```text
TRIỆU THANH DUY
LA CÔNG TUẤN
NGUYỄN ĐỨC NGỌC MINH đây là tên của các thành viên trong nhóm và TRiệu thanh duy làm trưởng nhóm và word để dạng như này ko đc để trang nào ngang và các sơ đồ bỏ giải thích đi ko cần ô giải thích nhỏ kia
```

**Kết quả:** đổi thành viên thành Triệu Thanh Duy (Trưởng nhóm), La Công Tuấn, Nguyễn Đức Ngọc Minh; toàn bộ báo cáo để trang dọc; xoá mọi ô ghi chú (Note) trong 33 sơ đồ và dựng lại model.

## Prompt 6 — 30/09/2026: Vẽ lại sơ đồ use case không cắt nhau

Kèm ảnh chụp sơ đồ use case tổng quát cũ, trong đó các đường nối từ HR và MANAGER cắt qua các ellipse use case khác.

```text
vẽ lại sơ đồ này cho tôi ko để nối cắt như thế quy tắc ko đc cắt vào usecase khác
```

**Kết quả:** mọi đường association đi xiên tới điểm sát mép ngoài của use case đích rồi mới đi ngang vào (HR, ADMIN vào mép trái; MANAGER, Google Gemini vào mép phải); nới rộng ellipse để chữ không tràn. Không còn đường nào đi qua use case khác.

## Prompt 7 — 30/09/2026: Giãn dòng và bảng tràn lề

Kèm 2 ảnh chụp: hộp thoại Paragraph (Before 6 pt, After 6 pt, Line spacing Multiple 1,3) và trang có Bảng 64 tràn ra ngoài lề phải.

```text
BaoCao_MonHoc_Nhom_XX.docx chỉnh lại file word dãn dòng như trong ảnh và bảng 63 64 đang bị tràn ra ngoài rà soát lại không để tràn ra ngoài viền
```

**Kết quả:** sửa trực tiếp trên file nhóm đã tự chỉnh (giữ nguyên trang bìa nhóm làm): 649 đoạn ngoài bảng đặt Before 6 pt / After 6 pt / Multiple 1,3; Bảng 64 đưa tổng độ rộng cột về 16 cm; khoá độ rộng cố định cho cả 81 bảng. Báo cáo 101 trang, không còn nội dung vượt lề.

## Prompt 8 — 30/09/2026: Lưu nhật ký prompt

```text
ghi hết prompt tôi gửi vào docs và những prompt tạo lại word thì bạn cũng ghi vào chi tiết
```

**Kết quả:** tạo file này và `02_prompt_tao_lai_word.md`.
