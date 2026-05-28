#!/usr/bin/env python3
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict

OCR_CAPABLE_EXTENSIONS = {"pdf", "docx", "pptx"}


def _write_json(payload: Dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(payload, ensure_ascii=False))
    sys.stdout.flush()


def _error_payload(code: str, message: str, details: str | None = None, retryable: bool = False, metadata: Dict[str, Any] | None = None) -> Dict[str, Any]:
    payload: Dict[str, Any] = {
        "success": False,
        "error": {
            "code": code,
            "message": message,
            "retryable": retryable,
        },
    }
    if details:
        payload["error"]["details"] = details
    if metadata:
        payload["metadata"] = metadata
    return payload


def _health_check() -> int:
    health = {
        "available": False,
        "pythonOk": True,
        "markitdownOk": False,
        "ocrPluginOk": False,
        "details": None,
    }

    try:
        import markitdown  # noqa: F401
        health["markitdownOk"] = True
    except Exception as exc:  # pragma: no cover
        health["details"] = f"markitdown import failed: {exc}"

    try:
        import markitdown_ocr  # noqa: F401
        health["ocrPluginOk"] = True
    except Exception as exc:  # pragma: no cover
        details = health.get("details")
        suffix = f"markitdown-ocr import failed: {exc}"
        health["details"] = f"{details}; {suffix}" if details else suffix

    health["available"] = health["pythonOk"] and health["markitdownOk"]

    if health["available"]:
        _write_json({"success": True, "health": health})
        return 0

    _write_json({
        "success": False,
        "health": health,
        "error": {"message": health.get("details") or "Health check failed"},
    })
    return 1


def _build_markitdown() -> tuple[Any, bool]:
    from markitdown import MarkItDown

    enable_plugins = os.getenv("DOC_PARSER_ENABLE_PLUGINS", "true").lower() != "false"
    llm_model = os.getenv("DOC_PARSER_LLM_MODEL") or os.getenv("OPENAI_MODEL") or "gpt-4o"
    llm_client = None

    if os.getenv("OPENAI_API_KEY"):
        try:
            from openai import OpenAI

            base_url = os.getenv("OPENAI_BASE_URL") or None
            llm_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"), base_url=base_url)
        except Exception:
            llm_client = None

    if enable_plugins and llm_client:
        return (
            MarkItDown(
                enable_plugins=True,
                llm_client=llm_client,
                llm_model=llm_model,
            ),
            True,
        )

    return (MarkItDown(enable_plugins=enable_plugins), False)


def _convert_file(file_path: Path) -> Dict[str, Any]:
    extension = file_path.suffix.lower().replace(".", "")
    file_type = extension or "unknown"

    try:
        md, ocr_enabled = _build_markitdown()
    except Exception as exc:
        return _error_payload(
            "MISSING_DEPENDENCY",
            "Failed to initialize MarkItDown",
            details=str(exc),
            retryable=False,
            metadata={"fileType": file_type, "hasOCR": False},
        )

    try:
        if hasattr(md, "convert_local"):
            result = md.convert_local(str(file_path))
        else:
            result = md.convert(str(file_path))

        text = (
            getattr(result, "text_content", None)
            or getattr(result, "markdown", None)
            or getattr(result, "text", None)
            or ""
        )

        has_ocr = bool(ocr_enabled and extension in OCR_CAPABLE_EXTENSIONS)

        return {
            "success": True,
            "text": text,
            "metadata": {
                "fileType": file_type,
                "hasOCR": has_ocr,
            },
        }
    except Exception as exc:
        return _error_payload(
            "PARSE_FAILED",
            "Failed to parse document",
            details=str(exc),
            retryable=True,
            metadata={"fileType": file_type, "hasOCR": False},
        )


def main() -> int:
    if "--health-check" in sys.argv:
        return _health_check()

    if len(sys.argv) < 2:
        _write_json(_error_payload("INVALID_INPUT", "File path is required"))
        return 1

    raw_path = sys.argv[1]
    if "://" in raw_path:
        _write_json(_error_payload("INVALID_INPUT", "Only local files are supported"))
        return 1

    file_path = Path(raw_path).expanduser().resolve()
    if not file_path.exists() or not file_path.is_file():
        _write_json(_error_payload("INVALID_INPUT", "File does not exist"))
        return 1

    try:
        payload = _convert_file(file_path)
        _write_json(payload)
        return 0 if payload.get("success") else 1
    except Exception as exc:
        _write_json(_error_payload("PARSE_FAILED", "Unhandled parser error", details=str(exc)))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
