# Đổi tên SVG xuất từ StarUML theo quy ước docs/uml/export và sao chép .mdj
import os, re, shutil, sys, unicodedata

src = sys.argv[1]          # thư mục SVG vừa xuất
dst = sys.argv[2]          # docs/uml/export
mdj = sys.argv[3]
mdj_dst = sys.argv[4]

os.makedirs(dst, exist_ok=True)
for f in os.listdir(dst):
    os.remove(os.path.join(dst, f))

fixed = {
    "01 Use Case tổng quát": "01_use_case_overview",
    "30 Application State Machine": "30_application_state_machine",
    "31 Entity Class Diagram": "31_entity_class_diagram",
    "32 Controller - Service Class Diagram": "32_service_class_diagram",
    "33 Component Diagram": "33_component_diagram",
}
done = []
for f in os.listdir(src):
    if not f.endswith(".svg"):
        continue
    name = unicodedata.normalize("NFC", f[:-4])
    out = None
    for k, v in fixed.items():
        if name == unicodedata.normalize("NFC", k):
            out = v
    m = re.match(r"UC0(\d\d) (Activity|Sequence)", name)
    if m:
        k = int(m.group(1))
        idx = 2 * k if m.group(2) == "Activity" else 2 * k + 1
        out = f"{idx:02d}_uc{k:03d}_{m.group(2).lower()}"
    if not out:
        print("UNMAPPED", name)
        continue
    shutil.copy(os.path.join(src, f), os.path.join(dst, out + ".svg"))
    done.append(out)
shutil.copy(mdj, mdj_dst)
print(len(done), "svg")
