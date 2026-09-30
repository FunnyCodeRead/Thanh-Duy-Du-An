# Công cụ dựng lại mô hình UML

Model `../AI_Recruitment_System.mdj` được sinh bằng API của chính StarUML (`app.factory`), không vẽ tay.

## Chỉ xuất lại ảnh (ví dụ sau khi nhập license để bỏ watermark)

Mở `AI_Recruitment_System.mdj` trong StarUML → **File › Export Diagram As › SVG/PNG** (All diagrams), hoặc chạy lệnh:

```powershell
powershell -File export.ps1 -Mdj ..\AI_Recruitment_System.mdj -OutDir .\svg -Format svg
python finalize.py .\svg ..\export ..\AI_Recruitment_System.mdj ..\AI_Recruitment_System.mdj
node svg2png.mjs ..\export 2     # cần puppeteer + Chrome
```

Trong terminal của VS Code phải bỏ biến `ELECTRON_RUN_AS_NODE` trước khi gọi `StarUML.exe` (các script `.ps1` đã tự làm việc này).

## Dựng lại toàn bộ model

1. Chép `staruml-extension-main.js` thành `%APPDATA%\StarUML\extensions\user\aigen\main.js` (kèm `package.json` có `"name": "aigen"`).
2. `powershell -File run.ps1 -Script <đường dẫn tuyệt đối>\build.js -Out <đường dẫn>\AI_Recruitment_System.mdj -Base <đường dẫn>\base.mdj -TimeoutSec 580` (mất khoảng 3 phút).
3. `python validate.py AI_Recruitment_System.mdj` — kiểm định ngữ nghĩa (49 mục).
