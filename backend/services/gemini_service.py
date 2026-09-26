import logging
import time
from config import Config

logger = logging.getLogger(__name__)


class GeminiServiceError(Exception):
    """Loi xu ly tu dich vu Gemini AI."""

    pass


def generate_content(prompt: str) -> str:
    """Gui prompt toi Google Gemini API va tra ve noi dung phan hoi duoi dang chuoi van ban.

    Dich vu nay doc lap voi database, khong truy cap MySQL va khong thay doi du lieu.
    Co co che retry tu dong khi gap loi tam thoi (503/429) tu may chu Google.
    """
    api_key = (Config.GEMINI_API_KEY or "").strip()
    if not api_key:
        logger.error("GEMINI_API_KEY chua duoc cau hinh trong bien moi truong.")
        raise GeminiServiceError("Không thể sử dụng trợ lý AI lúc này. Vui lòng thử lại sau.")

    model_name = (Config.GEMINI_MODEL or "gemini-flash-latest").strip()
    candidate_models = [model_name]
    if "gemini-3.1-flash-lite" not in candidate_models:
        candidate_models.append("gemini-3.1-flash-lite")

    try:
        from google import genai

        client = genai.Client(api_key=api_key)
        last_error = None

        for current_model in candidate_models:
            for attempt in range(3):
                try:
                    response = client.models.generate_content(
                        model=current_model,
                        contents=prompt,
                    )

                    if response and getattr(response, "text", None):
                        return response.text.strip()
                except Exception as exc:
                    last_error = exc
                    logger.warning("Thu goi Gemini API model %s (lan %d) gap loi: %s", current_model, attempt + 1, exc.__class__.__name__)
                    time.sleep(2)

        logger.error("Tat ca lan thu goi Gemini API deu that bai: %s", last_error.__class__.__name__ if last_error else "Unknown")
        raise GeminiServiceError("Không thể sử dụng trợ lý AI lúc này. Vui lòng thử lại sau.") from last_error
    except GeminiServiceError:
        raise
    except Exception as exc:
        logger.error("Loi khi goi Gemini API: %s", exc.__class__.__name__)
        raise GeminiServiceError("Không thể sử dụng trợ lý AI lúc này. Vui lòng thử lại sau.") from exc

