# Kiểm định ngữ nghĩa UML trực tiếp trên file .mdj
import json, sys, collections
fn = sys.argv[1]
d = json.load(open(fn, encoding="utf8"))
idx, parent = {}, {}
def walk(o, p=None):
    if isinstance(o, dict):
        if "_id" in o:
            idx[o["_id"]] = o
            parent[o["_id"]] = p
            p = o
        for v in o.values(): walk(v, p)
    elif isinstance(o, list):
        for v in o: walk(v, p)
walk(d)
R = lambda r: idx[r["$ref"]] if isinstance(r, dict) and "$ref" in r else r
by = collections.defaultdict(list)
for o in idx.values(): by[o["_type"]].append(o)
res = []
def check(name, ok, detail=""):
    res.append((name, "PASS" if ok else "FAIL", detail))

diagrams = [o for o in idx.values() if o["_type"].endswith("Diagram")]
check("Tổng số diagram = 33", len(diagrams) == 33, str(collections.Counter(x["_type"] for x in diagrams)))
check("Không có view ảnh nhúng", not any("Image" in t for t in by), "")

# ---- package
root = [m for m in by["UMLModel"] if m["name"] == "AI Recruitment System"]
names = sorted(p["name"] for p in root[0]["ownedElements"]) if root else []
check("Có đủ 7 package 01–07", names[:7] == ["01 Use Case Model", "02 Activity Diagrams", "03 Sequence Diagrams", "04 State Machine", "05 Domain Model", "06 Service Model", "07 Component Model"], ", ".join(names))

# ---- use case
actors = {a["name"]: a for a in by["UMLActor"]}
check("4 actor", set(actors) == {"ADMIN", "HR", "MANAGER", "Google Gemini"}, ", ".join(actors))
ucs = by["UMLUseCase"]
check("14 use case, mã UC001–UC014", len(ucs) == 14 and sorted(u["name"][:5] for u in ucs) == [f"UC{i:03d}" for i in range(1, 15)])
subj = by["UMLUseCaseSubject"][0]
check("Use case nằm trong system boundary", all(parent[u["_id"]] is subj for u in ucs), subj["name"])
check("Actor nằm ngoài boundary", all(parent[a["_id"]] is not subj for a in actors.values()))
gens = [g for g in by["UMLGeneralization"] if R(g["source"])["_type"] == "UMLActor"]
check("Generalization ADMIN → HR (tam giác phía HR)", len(gens) == 1 and R(gens[0]["source"])["name"] == "ADMIN" and R(gens[0]["target"])["name"] == "HR")
check("Không có include/extend", not by["UMLInclude"] and not by["UMLExtend"])
assoc = collections.defaultdict(set)
for a in by["UMLAssociation"]:
    e1, e2 = R(a["end1"]["reference"]), R(a["end2"]["reference"])
    for x, y in ((e1, e2), (e2, e1)):
        if x["_type"] == "UMLActor" and y["_type"] == "UMLUseCase": assoc[x["name"]].add(y["name"][:5])
exp = {"HR": {f"UC{i:03d}" for i in range(1, 14)}, "ADMIN": {"UC014"},
       "MANAGER": {"UC001", "UC002", "UC003", "UC006", "UC007", "UC008", "UC009", "UC011", "UC012", "UC013"},
       "Google Gemini": {"UC008", "UC009", "UC010", "UC013"}}
for k, v in exp.items():
    check(f"Association {k}", assoc[k] == v, ",".join(sorted(assoc[k])))

# ---- activity
for dg in sorted([x for x in diagrams if x["_type"] == "UMLActivityDiagram"], key=lambda x: x["name"]):
    act = parent[dg["_id"]]
    nodes = [n for n in act.get("nodes", [])]
    t = collections.Counter(n["_type"] for n in nodes)
    edges = act.get("edges", [])
    parts = act.get("groups", [])
    dec = [n for n in nodes if n["_type"] == "UMLDecisionNode"]
    unguarded = 0
    for dn in dec:
        outs = [e for e in edges if R(e["source"]) is dn]
        unguarded += sum(1 for e in outs if not e.get("guard"))
        if len(outs) < 2: unguarded += 1
    dangling = [e for e in edges if not e.get("source") or not e.get("target")]
    ok = t["UMLInitialNode"] == 1 and t["UMLActivityFinalNode"] >= 1 and t["UMLAction"] > 0 and len(parts) >= 2 and unguarded == 0 and not dangling
    check(f"{dg['name'][:5]} Activity", ok, f"init={t['UMLInitialNode']} final={t['UMLActivityFinalNode']} action={t['UMLAction']} decision={t['UMLDecisionNode']} merge={t['UMLMergeNode']} partition={len(parts)} flow={len(edges)} guard_thiếu={unguarded}")

# ---- sequence
for dg in sorted([x for x in diagrams if x["_type"] == "UMLSequenceDiagram"], key=lambda x: x["name"]):
    inter = parent[dg["_id"]]
    lls = inter.get("participants", [])
    msgs = inter.get("messages", [])
    frags = inter.get("fragments", [])
    sorts = collections.Counter(m.get("messageSort", "synchCall") for m in msgs)
    st = [l.get("stereotype") for l in lls]
    has_gem = any((R(l.get("represent")) or {}).get("type") and R(R(l["represent"])["type"]).get("name") == "Google Gemini" for l in lls if l.get("represent"))
    code = dg["name"][:5]
    gem_ok = has_gem == (code in ("UC008", "UC009", "UC010", "UC013"))
    ops = collections.Counter(f.get("interactionOperator") for f in frags)
    guards_ok = all(all(o.get("guard") for o in f.get("operands", [])) for f in frags)
    ok = len(lls) >= 3 and all(st) and sorts["reply"] > 0 and gem_ok and guards_ok and all(m.get("source") and m.get("target") for m in msgs)
    check(f"{code} Sequence", ok, f"lifeline={len(lls)} message={len(msgs)} reply={sorts['reply']} fragment={dict(ops)} gemini={'có' if has_gem else 'không'}")

# ---- state machine
sm = by["UMLStateMachine"][0]
reg = sm["regions"][0]
verts = {v["_id"]: v for v in reg["vertices"]}
states = sorted(v["name"] for v in verts.values() if v["_type"] == "UMLState")
trs = [(R(t["source"]), R(t["target"]), [e["name"] for e in t.get("triggers", [])]) for t in reg["transitions"]]
term_ok = all(tg["_type"] == "UMLFinalState" for s, tg, _ in trs if s.get("name") in ("PASSED", "REJECTED"))
init_ok = any(s["_type"] == "UMLPseudostate" and s.get("kind", "initial") == "initial" and tg.get("name") == "NEW" for s, tg, _ in trs)
pairs = sorted(f"{s.get('name','●')}→{tg.get('name','◉')}:{','.join(e)}" for s, tg, e in trs)
check("State machine", states == ["INTERVIEW", "NEW", "PASSED", "REJECTED", "SCREENING"] and term_ok and init_ok and len(trs) == 9, "; ".join(pairs))

# ---- class diagrams
dom = [c for c in by["UMLClass"] if parent[c["_id"]]["name"] == "05 Domain Model"]
enums = [e for e in by["UMLEnumeration"]]
check("7 lớp thực thể", sorted(c["name"] for c in dom) == ["AIResult", "Application", "Candidate", "Evaluation", "Interview", "Job", "User"])
check("6 Enumeration", len(enums) == 6, ", ".join(e["name"] for e in enums))
attr_typed = all(a.get("type") for c in dom for a in c.get("attributes", []))
check("Mọi thuộc tính có kiểu (name: Type)", attr_typed)
enum_ref = [a["name"] for c in dom for a in c.get("attributes", []) if isinstance(a.get("type"), dict)]
check("Thuộc tính trạng thái/vai trò tham chiếu Enumeration", set(enum_ref) >= {"role", "status", "source", "type"}, ", ".join(enum_ref))
dom_ids = {c["_id"] for c in dom}
dom_assoc = [a for a in by["UMLAssociation"] if R(a["end1"]["reference"])["_id"] in dom_ids and R(a["end2"]["reference"])["_id"] in dom_ids]
mult_ok = all(a["end1"].get("multiplicity") and a["end2"].get("multiplicity") for a in dom_assoc)
cj = any({R(a["end1"]["reference"])["name"], R(a["end2"]["reference"])["name"]} == {"Candidate", "Job"} for a in dom_assoc)
agg = any(a["end1"].get("aggregation", "none") != "none" or a["end2"].get("aggregation", "none") != "none" for a in dom_assoc)
check("7 association, multiplicity 2 đầu, không Candidate–Job trực tiếp, không aggregation/composition", len(dom_assoc) == 7 and mult_ok and not cj and not agg,
      "; ".join(f"{R(a['end1']['reference'])['name']}[{a['end1']['multiplicity']}]–{R(a['end2']['reference'])['name']}[{a['end2']['multiplicity']}]" for a in dom_assoc))
svc_cls = [c for c in by["UMLClass"] if parent[c["_id"]]["name"] == "06 Service Model"]
svc_ids = {c["_id"] for c in svc_cls}
svc_gen = [g for g in by["UMLGeneralization"] if R(g["source"])["_id"] in svc_ids]
svc_assoc = [a for a in by["UMLAssociation"] if R(a["end1"]["reference"])["_id"] in svc_ids]
deps = [x for x in by["UMLDependency"] if R(x["source"])["_id"] in svc_ids]
st = collections.Counter(c.get("stereotype") for c in svc_cls)
check("Service model: chỉ Dependency, không Generalization/Association", not svc_gen and not svc_assoc and len(deps) > 20, f"dependency={len(deps)} stereotype={dict(st)}")
comps = by["UMLComponent"]
react = [c for c in comps if c["name"] == "React SPA"][0]
react_to_gem = any(R(x["source"]) is react and R(x["target"])["name"] == "Google Gemini API" for x in by["UMLDependency"])
check("Component: React không phụ thuộc trực tiếp Gemini", not react_to_gem, f"component={len(comps)} artifact={len(by['UMLArtifact'])}")

w = max(len(r[0]) for r in res)
for n, s, dt in res: print(f"{s}\t{n}\t{dt}")
print("TOTAL", sum(1 for r in res if r[1] == "PASS"), "/", len(res))
