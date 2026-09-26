"""Context Builder for Recruitment RAG Knowledge Base.

Formats retrieved documents and structured database results into a compact,
clean context string for grounding Gemini responses.
Enforces hard limits on context length to prevent prompt bloat.
"""

MAX_CONTEXT_CHARACTERS = 4000


def build_context(
    retrieved_docs: list[dict],
    structured_info: str | None = None,
) -> tuple[str, list[dict]]:
    """Xây dựng chuỗi CONTEXT có cấu trúc và danh sách metadata nguồn (sources).
    
    Returns:
        tuple (context_text: str, sources: list[dict])
    """
    context_blocks = []
    sources = []
    seen_sources = set()

    # 1. Include structured facts first if present
    if structured_info and structured_info.strip():
        context_blocks.append(f"[DỮ LIỆU CƠ SỞ DỮ LIỆU MYSQL]\n{structured_info.strip()}\n")

    # 2. Include retrieved document chunks
    for idx, doc in enumerate(retrieved_docs, start=1):
        meta = doc.get("metadata", {})
        entity_type = meta.get("entity_type", "unknown")
        entity_id = meta.get("entity_id") or meta.get("candidate_id") or meta.get("job_id") or idx
        display_name = meta.get("display_name") or f"{entity_type.capitalize()} #{entity_id}"

        # Deduplicate sources
        source_key = (entity_type, entity_id)
        if source_key not in seen_sources:
            seen_sources.add(source_key)
            sources.append({
                "entity_type": entity_type,
                "entity_id": entity_id,
                "display_name": display_name,
            })

        block = (
            f"[NGUỒN {idx}]\n"
            f"Loại: {entity_type.upper()}\n"
            f"Tên/Mô tả: {display_name}\n"
            f"Nội dung:\n{doc.get('text', '').strip()}\n"
        )
        context_blocks.append(block)

    full_context = "\n----------------------------------------\n".join(context_blocks)

    # Safe truncate if exceeding MAX_CONTEXT_CHARACTERS
    if len(full_context) > MAX_CONTEXT_CHARACTERS:
        full_context = full_context[:MAX_CONTEXT_CHARACTERS] + "\n...[Nội dung còn lại đã được rút gọn để đảm bảo hiệu năng]..."

    return full_context, sources
