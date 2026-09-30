# RAG THRESHOLD EVIDENCE

Current threshold: `0.25`

Measure:
- MIN_RELEVANT_SIMILARITY
- MAX_IRRELEVANT_SIMILARITY

Use clearly unrelated queries:
- vận hành lò phản ứng hạt nhân
- chăn nuôi thủy sản
- thiết kế động cơ máy bay

Determine:

`MAX_IRRELEVANT < 0.25 < MIN_RELEVANT`

If YES: keep 0.25.

If NO: report score distribution.

Do not blindly tune threshold.
