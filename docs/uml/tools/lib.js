// Thư viện dựng sơ đồ UML trong StarUML qua app.factory
const path = require("path");
const { Point } = require(path.join(process.resourcesPath, "app.asar", "src", "core", "graphics.js"));

module.exports = function makeLib(app, type, log) {
  const F = app.factory;
  const LS_RECT = 0;
  const canvas = () => (app.diagrams.getEditor() || app.diagrams.getHiddenEditor()).canvas;

  const textW = (s, px = 7.2) => Math.ceil(String(s).length * px);

  function pkg(parent, name, kind = "UMLPackage") {
    return F.createModel({ id: kind, parent, modelInitializer: (m) => { m.name = name; } });
  }

  function setPoints(view, pts) {
    view.lineStyle = LS_RECT;
    view.points.clear();
    pts.forEach(([x, y]) => view.points.add(new Point(Math.round(x), Math.round(y))));
  }

  const center = (v) => [v.left + v.width / 2, v.top + v.height / 2];

  // ------------------------------------------------------------ ACTIVITY
  // spec: { name, lanes:[{name,w}], nodes:{id:{t,lane,row,dx,label,w}}, flows:[[a,b,guard,route]], rowH }
  function activity(parentPkg, spec) {
    const d = F.createDiagram({ id: "UMLActivityDiagram", parent: parentPkg, diagramInitializer: (x) => { x.name = spec.name; } });
    const act = d._parent;
    act.name = spec.activityName || spec.name;
    const rowH = spec.rowH || 62;
    const top = 20, headerH = 34;
    const maxRow = Math.max(...Object.values(spec.nodes).map((n) => n.row));
    const laneH = headerH + (maxRow + 1) * rowH + 30;
    let x = 20;
    const lanes = spec.lanes.map((l) => {
      const v = F.createModelAndView({ id: "UMLActivityPartition", parent: act, diagram: d, x1: x, y1: top, x2: x + l.w, y2: top + laneH, modelInitializer: (m) => { m.name = l.name; } });
      const r = { v, left: x, w: l.w, cx: x + l.w / 2 };
      x += l.w;
      return r;
    });
    const views = {};
    for (const [id, n] of Object.entries(spec.nodes)) {
      const L = lanes[n.lane];
      const cx = L.cx + (n.dx || 0);
      const cy = top + headerH + 20 + n.row * rowH;
      let w, h, kind;
      switch (n.t) {
        case "init": kind = "UMLInitialNode"; w = h = 22; break;
        case "final": kind = "UMLActivityFinalNode"; w = h = 26; break;
        case "dec": kind = "UMLDecisionNode"; w = h = 30; break;
        case "merge": kind = "UMLMergeNode"; w = h = 30; break;
        default: kind = "UMLAction"; w = n.w || Math.min(L.w - 24, Math.max(130, textW(n.label, 7.4) + 30)); h = n.h || 40;
      }
      const v = F.createModelAndView({ id: kind, parent: act, diagram: d, x1: cx - w / 2, y1: cy - h / 2, x2: cx + w / 2, y2: cy + h / 2,
        modelInitializer: (m) => { m.name = n.label || ""; } });
      if (kind === "UMLAction") { v.width = w; v.height = h; }
      views[id] = v;
    }
    for (const f of spec.flows) {
      const [a, b, guard, route] = f;
      const ta = views[a], hb = views[b];
      if (!ta || !hb) throw new Error(`flow ${a}->${b} missing in ${spec.name}`);
      const fv = F.createModelAndView({ id: "UMLControlFlow", parent: act, diagram: d, tailView: ta, headView: hb, tailModel: ta.model, headModel: hb.model,
        modelInitializer: (m) => { if (guard) m.guard = guard; } });
      fv.lineStyle = LS_RECT;
      const [ax, ay] = center(ta), [bx, by] = center(hb);
      const rowY = (r) => top + headerH + 20 + r * rowH;
      if (route && route.sx !== undefined) {
        const X = lanes[route.lane === undefined ? 1 : route.lane].cx + route.sx;
        setPoints(fv, [[ax, ay], [X, ay], [X, by], [bx, by]]);
      } else if (route && route.midRow !== undefined) {
        const Y = rowY(route.midRow);
        setPoints(fv, [[ax, ay], [ax, Y], [bx, Y], [bx, by]]);
      } else if (route && route.side) {
        // vòng quay lại: đi ra cạnh trái/phải, lên/xuống rồi vào đích
        const off = route.off || 30;
        const X = route.side === "L" ? Math.min(ta.left, hb.left) - off : Math.max(ta.left + ta.width, hb.left + hb.width) + off;
        setPoints(fv, [[ax, ay], [X, ay], [X, by], [bx, by]]);
      } else if (route && route.via) {
        setPoints(fv, [[ax, ay], ...route.via, [bx, by]]);
      } else if (route === "hv") { // ngang trước rồi dọc
        setPoints(fv, [[ax, ay], [bx, ay], [bx, by]]);
      } else if (route === "vh") { // dọc trước rồi ngang
        setPoints(fv, [[ax, ay], [ax, by], [bx, by]]);
      } else if (Math.abs(ax - bx) < 2 || Math.abs(ay - by) < 2) {
        setPoints(fv, [[ax, ay], [bx, by]]);
      } else {
        setPoints(fv, [[ax, ay], [bx, ay], [bx, by]]);
      }
    }
    return d;
  }

  // ------------------------------------------------------------ SEQUENCE
  // lifelines: [{k, name, type (model), st, w}]
  // steps: ["call", from, to, label, inner[], replyLabel] | ["self", on, label, inner[]] | ["reply", from, to, label]
  //        ["alt", [[guard, steps], ...]] | ["opt", guard, steps] | ["loop", guard, steps] | ["gap", dy]
  function sequence(parentPkg, spec) {
    const d = F.createDiagram({ id: "UMLSequenceDiagram", parent: parentPkg, diagramInitializer: (x) => { x.name = spec.name; } });
    const inter = d._parent;
    inter.name = spec.interactionName || spec.name;
    const collab = inter._parent;
    if (collab && collab instanceof type.UMLCollaboration) collab.name = (spec.collabName || spec.name) + " – Collaboration";
    d.showSequenceNumber = true;
    const LL = {};
    let x = 30;
    const llTop = 50;
    const lvs = [];
    for (const l of spec.lifelines) {
      const label = l.name + (l.type ? " : " + l.type.name : "");
      const w = l.w || Math.max(110, textW(label, 7.6) + 28, l.st ? textW("«" + l.st + "»", 7) + 24 : 0);
      const v = F.createModelAndView({ id: "UMLLifeline", parent: inter, diagram: d, x1: x, y1: llTop, x2: x + w, y2: llTop + 5000,
        modelInitializer: (m) => { m.name = l.name; if (l.st) m.stereotype = l.st; } });
      if (l.type && v.model.represent) v.model.represent.type = l.type;
      LL[l.k] = { v, cx: x + w / 2, left: x, right: x + w };
      lvs.push(v);
      x += w + (l.gap || 26);
    }
    const width = x;
    let y = llTop + 90;
    let maxRight = 0;
    const lastK = spec.lifelines[spec.lifelines.length - 1].k;
    const DY = 34;
    const fragments = [];
    const activations = [];

    function message(from, to, label, sort, yy) {
      if (process.env.AIGEN_DEBUG) log('msg ' + label.slice(0, 30) + ' req=' + yy);
      const A = LL[from], B = LL[to];
      if (!A || !B) throw new Error(`lifeline ${from}/${to} missing in ${spec.name}`);
      const v = F.createModelAndView({ id: "UMLMessage", parent: inter, diagram: d, tailView: A.v, headView: B.v, tailModel: A.v.model, headModel: B.v.model,
        x1: A.cx, y1: yy, x2: B.cx, y2: yy, modelInitializer: (m) => { m.name = label; if (sort) m.messageSort = sort; } });
      if (from === to) { setPoints(v, [[A.cx, yy], [A.cx + 30, yy], [A.cx + 30, yy + 16], [A.cx, yy + 16]]); maxRight = Math.max(maxRight, A.cx + 40 + textW(label, 7.2)); }
      else if (to === lastK) maxRight = Math.max(maxRight, B.cx + 20);
      else setPoints(v, [[A.cx, yy], [B.cx, yy]]);
      return v;
    }

    function run(steps) {
      let minX = Infinity, maxX = -Infinity;
      const touch = (...ks) => ks.forEach((k) => { minX = Math.min(minX, LL[k].left); maxX = Math.max(maxX, LL[k].right); });
      for (const s of steps) {
        const kind = s[0];
        if (kind === "call") {
          const [, from, to, label, inner, reply] = s;
          touch(from, to);
          const y0 = y;
          const mv = message(from, to, label, null, y0);
          y += DY;
          if (inner && inner.length) { const r = run(inner); minX = Math.min(minX, r.minX); maxX = Math.max(maxX, r.maxX); }
          if (reply !== undefined && reply !== null) {
            message(to, from, reply, "reply", y);
            activations.push([mv, y - y0]);
            y += DY;
          } else {
            activations.push([mv, Math.max(24, y - y0 - 8)]);
          }
        } else if (kind === "self") {
          const [, on, label, inner] = s;
          touch(on);
          const y0 = y;
          const mv = message(on, on, label, null, y0);
          y += DY + 10;
          if (inner && inner.length) { const r = run(inner); minX = Math.min(minX, r.minX); maxX = Math.max(maxX, r.maxX); }
          activations.push([mv, Math.max(20, y - y0 - 18)]);
        } else if (kind === "reply") {
          const [, from, to, label] = s;
          touch(from, to);
          message(from, to, label, "reply", y);
          y += DY;
        } else if (kind === "gap") {
          y += s[1];
        } else if (kind === "alt" || kind === "opt" || kind === "loop" || kind === "break") {
          const operands = kind === "alt" ? s[1] : [[s[1], s[2]]];
          const fy0 = y; y += 30;
          const opSpans = [];
          let fx0 = Infinity, fx1 = -Infinity;
          operands.forEach(([guard, st], i) => {
            const oy0 = i === 0 ? fy0 + 22 : y;
            y += i > 0 ? 30 : 12;
            const r = run(st);
            fx0 = Math.min(fx0, r.minX); fx1 = Math.max(fx1, r.maxX);
            y += 6;
            opSpans.push([guard, oy0, y]);
          });
          y += 8;
          fragments.push({ kind, fy0, fy1: y, opSpans, fx0, fx1 });
          minX = Math.min(minX, fx0); maxX = Math.max(maxX, fx1);
          y += 14;
        }
      }
      return { minX, maxX };
    }
    run(spec.steps);
    log('  steps done ' + spec.name);
    const bottom = y + 30;

    // lifeline length
    lvs.forEach((v) => { v.height = bottom - llTop; });
    // activation heights
    activations.forEach(([mv, h]) => { if (mv.activation) mv.activation.height = h; });
    log('  activations set');
    // fragments
    const nestDepth = (f) => fragments.filter((g) => g !== f && g.fy0 <= f.fy0 && g.fy1 >= f.fy1).length;
    fragments.forEach((f) => {
      const pad = 18 - nestDepth(f) * 6;
      const x1 = f.fx0 - pad - 10, x2 = f.fx1 + pad + 10;
      const v = F.createModelAndView({ id: "UMLCombinedFragment", parent: inter, diagram: d, x1, y1: f.fy0, x2, y2: f.fy1,
        modelInitializer: (m) => { m.name = ""; m.interactionOperator = f.kind; } });
      const cf = v.model;
      cf.operands[0].guard = f.opSpans[0][0];
      for (let i = 1; i < f.opSpans.length; i++) {
        F.createModel({ id: "UMLInteractionOperand", parent: cf, field: "operands", modelInitializer: (m) => { m.guard = f.opSpans[i][0]; } });
      }
      f.view = v;
    });
    // frame
    const frame = d.ownedViews.find((v) => v instanceof type.UMLFrameView);
    const fw = Math.max(width, maxRight + 20);
    if (frame) { frame.left = 10; frame.top = 10; frame.width = fw - 10; frame.height = bottom; }
    log('  fragments created');
    // arrange to materialise operand views, then set operand heights
    try { d.arrangeDiagram(canvas()); lvs.forEach((v) => { v.height = bottom - llTop; }); d.arrangeDiagram(canvas()); } catch (e) { log("arrange " + spec.name + " " + e); }
    log('  arranged');
    fragments.forEach((f) => {
      const comp = f.view.operandCompartment;
      const ops = comp ? comp.subViews.filter((s) => s instanceof type.UMLInteractionOperandView) : [];
      ops.forEach((ov, i) => { if (f.opSpans[i]) ov.height = f.opSpans[i][2] - f.opSpans[i][1]; });
    });
    return d;
  }

  // ------------------------------------------------------------ CLASS helpers
  function klass(parent, diagram, name, x, y, opts = {}) {
    const kind = opts.kind || "UMLClass";
    const v = F.createModelAndView({ id: kind, parent, diagram, x1: x, y1: y, x2: x + (opts.w || 200), y2: y + (opts.h || 60),
      modelInitializer: (m) => { m.name = name; if (opts.st) m.stereotype = opts.st; } });
    const m = v.model;
    (opts.attrs || []).forEach((a) => attr(m, ...a));
    (opts.ops || []).forEach((o) => op(m, ...o));
    (opts.literals || []).forEach((l) => F.createModel({ id: "UMLEnumerationLiteral", parent: m, field: "literals", modelInitializer: (e) => { e.name = l; } }));
    if (opts.suppressOps) v.suppressOperations = true;
    if (opts.suppressAttrs) v.suppressAttributes = true;
    return v;
  }
  // attr(model, name, type, visibility, extra)
  function attr(m, name, t, vis = "private", extra = {}) {
    return F.createModel({ id: "UMLAttribute", parent: m, field: "attributes", modelInitializer: (a) => {
      a.name = name; a.type = t; a.visibility = vis; Object.assign(a, extra); } });
  }
  // op(model, name, params[[n,t,mult]], returnType, vis, extra)
  function op(m, name, params = [], ret = null, vis = "public", extra = {}) {
    const o = F.createModel({ id: "UMLOperation", parent: m, field: "operations", modelInitializer: (x) => { x.name = name; x.visibility = vis; Object.assign(x, extra); } });
    params.forEach(([n, t, mult]) => F.createModel({ id: "UMLParameter", parent: o, field: "parameters", modelInitializer: (p) => { p.name = n; p.type = t; if (mult) p.multiplicity = mult; } }));
    if (ret) F.createModel({ id: "UMLParameter", parent: o, field: "parameters", modelInitializer: (p) => { p.name = ""; p.type = ret; p.direction = "return"; } });
    return o;
  }
  function relation(kind, parent, diagram, a, b, init, route) {
    const v = F.createModelAndView({ id: kind, parent, diagram, tailView: a, headView: b, tailModel: a.model, headModel: b.model, modelInitializer: init || (() => {}) });
    if (v && "showVisibility" in v) v.showVisibility = false;
    if (v && route === "oblique") { v.lineStyle = 1; return v; }
    if (v) {
      v.lineStyle = LS_RECT;
      if (route) {
        const [ax, ay] = center(a), [bx, by] = center(b);
        if (route === "hv") setPoints(v, [[ax, ay], [bx, ay], [bx, by]]);
        else if (route === "vh") setPoints(v, [[ax, ay], [ax, by], [bx, by]]);
        else if (route.via) setPoints(v, [[ax, ay], ...route.via, [bx, by]]);
        else if (route.midY !== undefined) setPoints(v, [[ax, ay], [ax, route.midY], [bx, route.midY], [bx, by]]);
        else if (route.midX !== undefined) setPoints(v, [[ax, ay], [route.midX, ay], [route.midX, by], [bx, by]]);
      }
    }
    return v;
  }
  function note(parent, diagram, text, x, y, w, h) {
    if (!process.env.AIGEN_NOTES) return null;
    const lines = String(text).split("\n");
    w = Math.max(w, Math.max(...lines.map((l) => l.length)) * 7.6 + 30);
    h = Math.max(h, lines.length * 15 + 16);
    return F.createModelAndView({ id: "Note", parent, diagram, x1: x, y1: y, x2: x + w, y2: y + h, viewInitializer: (v) => { v.text = text; } }) ||
      null;
  }

  return { F, pkg, activity, sequence, klass, attr, op, relation, note, setPoints, center, textW, canvas, LS_RECT };
};
