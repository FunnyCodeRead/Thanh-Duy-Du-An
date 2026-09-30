// Bố cục + định tuyến kênh cho sơ đồ 32 (Controller/Service)
module.exports = function (V, L, P, d, place) {
  const { relation } = L;
  const col = (names, x, y0, gap) => { let y = y0, w = 0; names.forEach((n) => { place(V[n], x, y); y += V[n].height + gap; w = Math.max(w, V[n].width); }); return { left: x, right: x + w, bottom: y - gap }; };
  const A = col(["AuthController", "JobController", "CandidateController", "ApplicationController"], 20, 20, 28);
  const B = col(["InterviewController", "EvaluationController", "FlaskApp"], A.right + 110, 20, 28);
  const C = col(["AIController", "ChatController", "IndexRebuilder"], B.right + 150, 20, 60);
  const D = col(["AIService", "RAGService", "Retriever", "DocumentBuilder"], C.right + 130, 20, 50);
  // căn hàng ngang
  V.ChatController.top = V.RAGService.top;
  V.IndexRebuilder.top = V.DocumentBuilder.top;
  const E = col(["GeminiService", "GeminiAPI", "ScopeGuard", "IntentRouter", "ContextBuilder", "EmbeddingService", "VectorStore", "FAISS"], D.right + 140, 20, 26);
  const bottomAll = Math.max(A.bottom, B.bottom, V.IndexRebuilder.top + V.IndexRebuilder.height, D.bottom) + 70;
  const chanAB = A.right + 55;
  place(V.Database, chanAB - 60, bottomAll);
  const db = V.Database;
  const cx = (v) => v.left + v.width / 2, cy = (v) => v.top + v.height / 2;
  const R = (v) => v.left + v.width, Bt = (v) => v.top + v.height;
  const dep = (a, b, pts) => {
    const v = relation("UMLDependency", P.svc, d, V[a], V[b], null, pts ? { via: pts } : "oblique");
    return v;
  };
  // helper: points list excluding the automatic first/last centers -> use explicit full path via setPoints
  const path = (a, b, pts) => {
    const v = relation("UMLDependency", P.svc, d, V[a], V[b], null, null);
    L.setPoints(v, pts);
    return v;
  };
  // --- recruitment controllers -> Database (kênh AB, đi xuống vào cạnh trên Database)
  let k = 0;
  ["AuthController", "JobController", "CandidateController", "ApplicationController"].forEach((n) => {
    const x = A.right + 18 + k * 10; k++;
    path(n, "Database", [[cx(V[n]), cy(V[n])], [x, cy(V[n])], [x, db.top + 10]]);
  });
  ["InterviewController", "EvaluationController", "FlaskApp"].forEach((n, i) => {
    const x = B.left - 18 - i * 10;
    path(n, "Database", [[cx(V[n]), cy(V[n])], [x, cy(V[n])], [x, db.top + 10]]);
  });
  // --- AI
  path("AIController", "AIService", [[cx(V.AIController), cy(V.AIController)], [cx(V.AIService), cy(V.AIController)]]);
  path("AIService", "GeminiService", [[cx(V.AIService), V.AIService.top + 22], [cx(V.GeminiService), V.AIService.top + 22]]);
  path("GeminiService", "GeminiAPI", [[cx(V.GeminiService), cy(V.GeminiService)], [cx(V.GeminiService), cy(V.GeminiAPI)]]);
  // --- xuống Database theo kênh CD rồi chạy ngang ở đáy
  const chanCD = C.right + 30;
  const yDb = (i) => db.top + 14 + i * 10;
  path("AIService", "Database", [[cx(V.AIService), Bt(V.AIService) - 10], [chanCD + 40, Bt(V.AIService) - 10], [chanCD + 40, yDb(0)], [db.left + 30, yDb(0)]]);
  path("RAGService", "Database", [[cx(V.RAGService), Bt(V.RAGService) - 10], [chanCD + 25, Bt(V.RAGService) - 10], [chanCD + 25, yDb(1)], [db.left + 30, yDb(1)]]);
  path("IndexRebuilder", "Database", [[cx(V.IndexRebuilder), cy(V.IndexRebuilder)], [cx(V.IndexRebuilder), yDb(2)], [db.left + 30, yDb(2)]]);
  // --- Chat
  path("ChatController", "RAGService", [[cx(V.ChatController), V.RAGService.top + 20], [cx(V.RAGService), V.RAGService.top + 20]]);
  path("ChatController", "IndexRebuilder", [[cx(V.ChatController), cy(V.ChatController)], [cx(V.ChatController), cy(V.IndexRebuilder)]]);
  // --- kênh DE cho các phụ thuộc sang cột E
  const chanDE = D.right + 18;
  let lane = 0;
  const nextX = () => chanDE + (lane++) * 11;
  const into = (tgt, off) => V[tgt].top + off;
  const toE = (src, tgt, sy, ty) => { const x = nextX(); path(src, tgt, [[cx(V[src]), sy], [x, sy], [x, ty], [cx(V[tgt]), ty]]); };
  const rg = V.RAGService;
  toE("RAGService", "ScopeGuard", rg.top + 34, cy(V.ScopeGuard));
  toE("RAGService", "IntentRouter", rg.top + 46, cy(V.IntentRouter));
  toE("RAGService", "ContextBuilder", rg.top + 58, cy(V.ContextBuilder));
  // RAG -> Gemini: vào cạnh dưới GeminiService
  { const x = nextX(); path("RAGService", "GeminiService", [[cx(rg), rg.top + 12], [x, rg.top + 12], [x, Bt(V.GeminiService) - 8], [cx(V.GeminiService), Bt(V.GeminiService) - 8]]); }
  toE("RAGService", "VectorStore", rg.top + 70, into("VectorStore", 16));
  path("RAGService", "Retriever", [[cx(rg), cy(rg)], [cx(rg), cy(V.Retriever)]]);
  toE("Retriever", "EmbeddingService", cy(V.Retriever) - 6, into("EmbeddingService", 18));
  toE("Retriever", "VectorStore", cy(V.Retriever) + 6, into("VectorStore", 32));
  path("IndexRebuilder", "DocumentBuilder", [[cx(V.IndexRebuilder), V.IndexRebuilder.top + 16], [cx(V.DocumentBuilder), V.IndexRebuilder.top + 16]]);
  // IndexRebuilder -> Embedding / VectorStore: đi dưới DocumentBuilder
  const yUnder = Bt(V.DocumentBuilder) + 18;
  { const x = nextX(); path("IndexRebuilder", "EmbeddingService", [[cx(V.IndexRebuilder), Bt(V.IndexRebuilder) - 8], [C.right - 12, Bt(V.IndexRebuilder) - 8], [C.right - 12, yUnder], [x, yUnder], [x, into("EmbeddingService", 36)], [cx(V.EmbeddingService), into("EmbeddingService", 36)]]); }
  { const x = nextX(); path("IndexRebuilder", "VectorStore", [[cx(V.IndexRebuilder), Bt(V.IndexRebuilder) - 18], [C.right - 22, Bt(V.IndexRebuilder) - 18], [C.right - 22, yUnder + 10], [x, yUnder + 10], [x, into("VectorStore", 48)], [cx(V.VectorStore), into("VectorStore", 48)]]); }
  // Chat -> VectorStore (get_index_info): kênh CD xuống dưới rồi sang kênh DE
  { const x = nextX(); path("ChatController", "VectorStore", [[cx(V.ChatController), Bt(V.ChatController) - 8], [chanCD + 10, Bt(V.ChatController) - 8], [chanCD + 10, yUnder + 20], [x, yUnder + 20], [x, into("VectorStore", 64)], [cx(V.VectorStore), into("VectorStore", 64)]]); }
  path("VectorStore", "FAISS", [[cx(V.VectorStore), cy(V.VectorStore)], [cx(V.VectorStore), cy(V.FAISS)]]);
  return { noteY: Bt(db) + 30 };
};
