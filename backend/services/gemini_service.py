import logging
from config import Config

logger = logging.getLogger(__name__)


class GeminiServiceError(Exception):
    """Loi xu ly tu dich vu Gemini AI."""

    pass


def generate_content(prompt: str) -> str:
    """Gui prompt toi Google Gemini API va tra ve noi dung phan hoi duoi dang chuoi van ban.

    Dich vu nay doc lap voi database, khong truy cap MySQL va khong thay doi du lieu.
    """
    api_key = (Config.GEMINI_API_KEY or "").strip()
    if not api_key:
        logger.error("GEMINI_API_KEY chua duoc cau hinh trong bien moi truong.")
        raise GeminiServiceError("Không thể sử dụng trợ lý AI lúc này. Vui lòng thử lại sau.")

    model_name = (Config.GEMINI_MODEL or "gemini-2.5-flash").strip()

    try:
        from google import genai

        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
        )

        if not response or not getattr(response, "text", None):
            logger.warning("Phan hoi tu Gemini API rong hoac khong co noi dung text.")
            raise GeminiServiceError("Không thể sử dụng trợ lý AI lúc này. Vui lòng thử lại sau.")

        return response.text.strip()
    except GeminiServiceError:
        raise
    except Exception as exc:
        # Ghi log loi tong quat, khong log api_key, password hay session
        logger.error("Loi khi goi Gemini API: %s", exc.__class__.__name__)
        raise GeminiServiceError("Không thể sử dụng trợ lý AI lúc này. Vui lòng thử lại sau.") from exc
