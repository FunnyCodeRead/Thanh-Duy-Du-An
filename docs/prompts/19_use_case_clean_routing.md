# USE CASE DIAGRAM CLEAN ROUTING RULES

Vẽ lại Use Case Diagram tổng quát.

## QUY TẮC TUYỆT ĐỐI
Không một association line nào được:
- đi xuyên qua ellipse của Use Case khác
- cắt chữ Use Case
- đi xuyên actor
- chồng lên system boundary title
- cắt qua relationship khác nếu có thể tránh
- nối vào giữa một use case không liên quan

Layout phải được tối ưu để connector đi vào cạnh gần nhất của ellipse.

## Actors
- ADMIN
- HR
- MANAGER
- Google Gemini

System boundary ở giữa.

HR bên trái.  
MANAGER bên phải phía trên.  
Google Gemini bên phải phía dưới.  
ADMIN phía trên HR.

Generalization:
`ADMIN --|> HR`

## Use Case layout
UC014 đặt gần ADMIN để connector ngắn.

### Upper
- UC001
- UC012
- UC002
- UC003
- UC006
- UC007

### Middle
- UC004
- UC005
- UC011

### Lower AI
- UC008
- UC009
- UC010
- UC013

### UC014
top/admin area.

Google Gemini chỉ nối:
- UC008
- UC009
- UC010
- UC013

Không nối Gemini vào UC014.

MANAGER chỉ nối đúng các use case có quyền.

HR không được có connector đi xuyên qua ellipse.

Dùng routing:
- orthogonal
hoặc
- direct shortest path

Kéo anchor point vào left/right side ellipse.

Nếu cần, chia use cases thành hai cột thay vì một cột dài.

Ưu tiên readability hơn symmetry.

## PASS condition
Không connector nào chạy xuyên qua use case khác.
