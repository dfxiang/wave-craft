from __future__ import annotations

import json
import math
import os
import re
import shutil
import subprocess
import tempfile
import threading
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from typing import Any, Literal
from urllib.parse import quote
from uuid import uuid4

import httpx
import numpy as np
from fastapi import FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from imageio_ffmpeg import get_ffmpeg_exe
from pydantic import BaseModel, Field
from starlette.background import BackgroundTask
from starlette.exceptions import HTTPException as StarletteHTTPException


BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
DATA_DIR = Path(os.getenv("AUDIO_EDITOR_DATA", BASE_DIR / "data")).resolve()
MAX_UPLOAD_BYTES = int(os.getenv("AUDIO_EDITOR_MAX_UPLOAD_MB", "250")) * 1024 * 1024
MIN_AUDIO_SECONDS = 0.08
ALLOWED_EXTENSIONS = {
    ".wav",
    ".mp3",
    ".flac",
    ".ogg",
    ".oga",
    ".opus",
    ".m4a",
    ".aac",
    ".webm",
    ".aif",
    ".aiff",
    ".wma",
}
EXPORT_FORMATS = {
    "wav": {"mime": "audio/wav", "profile": ["-acodec", "pcm_s16le"]},
    "mp3": {
        "mime": "audio/mpeg",
        "profile": ["-acodec", "libmp3lame", "-b:a", "192k"],
    },
    "flac": {"mime": "audio/flac", "profile": ["-acodec", "flac"]},
    "m4a": {
        "mime": "audio/mp4",
        "profile": ["-acodec", "aac", "-b:a", "192k"],
    },
    "ogg": {
        "mime": "audio/ogg",
        "profile": ["-acodec", "libvorbis", "-q:a", "5"],
    },
    "opus": {
        "mime": "audio/ogg",
        "profile": ["-acodec", "libopus", "-b:a", "128k"],
    },
    "aiff": {"mime": "audio/aiff", "profile": ["-acodec", "pcm_s16be"]},
    "aac": {
        "mime": "audio/aac",
        "profile": ["-acodec", "aac", "-b:a", "192k", "-f", "adts"],
    },
    "webm": {
        "mime": "audio/webm",
        "profile": ["-acodec", "libopus", "-b:a", "128k", "-f", "webm"],
        # Opus has a 6.5 ms codec delay. Offset the Matroska timeline so
        # exported files start at 0 instead of a negative timestamp.
        "output_options": ["-output_ts_offset", "0.007"],
    },
    "wma": {
        "mime": "audio/x-ms-wma",
        "profile": ["-acodec", "wmav2", "-b:a", "192k"],
    },
}

DATA_DIR.mkdir(parents=True, exist_ok=True)
app = FastAPI(title="声刻 WaveCraft", version="1.0.0")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

SUPPORTED_REQUEST_LANGUAGES = {"zh", "en", "fr", "de"}
SERVER_MESSAGES: dict[str, tuple[str, str, str]] = {
    "音频项目不存在": (
        "Audio project not found",
        "Projet audio introuvable",
        "Audioprojekt nicht gefunden",
    ),
    "音频项目不存在或已被清理": (
        "Audio project not found or already cleaned up",
        "Projet audio introuvable ou déjà supprimé",
        "Audioprojekt nicht gefunden oder bereits bereinigt",
    ),
    "音频项目元数据损坏": (
        "Audio project metadata is damaged",
        "Les métadonnées du projet audio sont endommagées",
        "Die Metadaten des Audioprojekts sind beschädigt",
    ),
    "无法读取转换后的音频": (
        "Could not read the converted audio",
        "Impossible de lire l'audio converti",
        "Konvertiertes Audio konnte nicht gelesen werden",
    ),
    "音频过短，至少需要 80 毫秒": (
        "Audio is too short; at least 80 ms is required",
        "L'audio est trop court ; 80 ms minimum sont requis",
        "Audio ist zu kurz; mindestens 80 ms sind erforderlich",
    ),
    "音频转换超时，请尝试更短的文件": (
        "Audio conversion timed out. Try a shorter file",
        "La conversion audio a expiré. Essayez un fichier plus court",
        "Zeitüberschreitung bei der Audiokonvertierung. Versuche eine kürzere Datei",
    ),
    "ASR Base URL 必须以 http:// 或 https:// 开头": (
        "The ASR Base URL must start with http:// or https://",
        "L'URL de base ASR doit commencer par http:// ou https://",
        "Die ASR-Basis-URL muss mit http:// oder https:// beginnen",
    ),
    "ASR 服务响应超时": (
        "The ASR service timed out",
        "Le service ASR a expiré",
        "Zeitüberschreitung beim ASR-Dienst",
    ),
    "上传的音频文件为空": (
        "The uploaded audio file is empty",
        "Le fichier audio envoyé est vide",
        "Die hochgeladene Audiodatei ist leer",
    ),
    "导出起点超出音频范围": (
        "The export start is outside the audio range",
        "Le début de l'export se trouve hors de la plage audio",
        "Der Exportstart liegt außerhalb des Audiobreichs",
    ),
    "导出片段至少需要 80 毫秒": (
        "An exported clip must be at least 80 ms long",
        "Un extrait exporté doit durer au moins 80 ms",
        "Ein exportierter Ausschnitt muss mindestens 80 ms lang sein",
    ),
    "选区起点超出音频范围": (
        "The selection start is outside the audio range",
        "Le début de la sélection se trouve hors de la plage audio",
        "Der Auswahlstart liegt außerhalb des Audiobreichs",
    ),
    "选区至少需要 80 毫秒": (
        "The selection must be at least 80 ms long",
        "La sélection doit durer au moins 80 ms",
        "Die Auswahl muss mindestens 80 ms lang sein",
    ),
    "删除片段至少需要 80 毫秒": (
        "The clip to delete must be at least 80 ms long",
        "L'extrait à supprimer doit durer au moins 80 ms",
        "Der zu löschende Ausschnitt muss mindestens 80 ms lang sein",
    ),
    "不能删除整段音频": (
        "The complete audio cannot be deleted",
        "L'intégralité de l'audio ne peut pas être supprimée",
        "Das vollständige Audio kann nicht gelöscht werden",
    ),
    "删除后音频过短": (
        "The audio would be too short after deletion",
        "L'audio serait trop court après la suppression",
        "Das Audio wäre nach dem Löschen zu kurz",
    ),
    "没有可撤销的删除操作": (
        "There is no deletion to undo",
        "Aucune suppression à annuler",
        "Es gibt keine Löschung zum Rückgängigmachen",
    ),
    "分段数量超过 200，请增大每段时长后再试": (
        "More than 200 segments are required. Increase the segment duration and try again",
        "Plus de 200 segments sont nécessaires. Augmentez la durée des segments et réessayez",
        "Es wären mehr als 200 Segmente erforderlich. Erhöhe die Segmentdauer und versuche es erneut",
    ),
}
SERVER_ERROR_PATTERNS: list[tuple[re.Pattern[str], tuple[str, str, str]]] = [
    (
        re.compile(r"^不支持该文件格式，请上传：(.+)$"),
        (
            "Unsupported file format. Upload one of: {value}",
            "Format de fichier non pris en charge. Envoyez l'un des formats suivants : {value}",
            "Nicht unterstütztes Dateiformat. Lade eines der folgenden Formate hoch: {value}",
        ),
    ),
    (
        re.compile(r"^音频解码失败：(.+)$"),
        (
            "Audio decoding failed: {value}",
            "Échec du décodage audio : {value}",
            "Audiodekodierung fehlgeschlagen: {value}",
        ),
    ),
    (
        re.compile(r"^无法连接 ASR 服务：(.+)$"),
        (
            "Could not connect to the ASR service: {value}",
            "Impossible de se connecter au service ASR : {value}",
            "Verbindung zum ASR-Dienst nicht möglich: {value}",
        ),
    ),
    (
        re.compile(r"^ASR 服务返回 (\d+)：(.+)$"),
        (
            "The ASR service returned {status}: {value}",
            "Le service ASR a renvoyé {status} : {value}",
            "Der ASR-Dienst hat {status} zurückgegeben: {value}",
        ),
    ),
    (
        re.compile(r"^文件超过 (\d+) MB 限制$"),
        (
            "The file exceeds the {value} MB limit",
            "Le fichier dépasse la limite de {value} Mo",
            "Die Datei überschreitet das Limit von {value} MB",
        ),
    ),
    (
        re.compile(r"^处理音频时出错：(.+)$"),
        (
            "An error occurred while processing the audio: {value}",
            "Une erreur est survenue lors du traitement de l'audio : {value}",
            "Bei der Audioverarbeitung ist ein Fehler aufgetreten: {value}",
        ),
    ),
    (
        re.compile(r"^不支持导出为 (.+)，可选：(.+)$"),
        (
            "Exporting as {value} is not supported. Available formats: {options}",
            "L'export en {value} n'est pas pris en charge. Formats disponibles : {options}",
            "Der Export als {value} wird nicht unterstützt. Verfügbare Formate: {options}",
        ),
    ),
    (
        re.compile(r"^导出为 (.+) 失败：(.+)$"),
        (
            "Exporting as {value} failed: {error}",
            "L'export en {value} a échoué : {error}",
            "Der Export als {value} ist fehlgeschlagen: {error}",
        ),
    ),
]
VALIDATION_ERROR_MESSAGES = {
    "zh": "请求参数无效，请检查输入内容和数值范围。",
    "en": "Invalid request parameters. Check the submitted values and ranges.",
    "fr": "Paramètres de requête non valides. Vérifiez les valeurs et les plages saisies.",
    "de": "Ungültige Anfrageparameter. Prüfe die eingegebenen Werte und Bereiche.",
}


def request_language(request: Request) -> str:
    for item in request.headers.get("accept-language", "").split(","):
        language = item.split(";", 1)[0].strip().lower().split("-", 1)[0]
        if language in SUPPORTED_REQUEST_LANGUAGES:
            return language
    return "zh"


def translated_server_message(message: str, language: str) -> str:
    if language == "zh":
        return message
    index = {"en": 0, "fr": 1, "de": 2}[language]
    if message in SERVER_MESSAGES:
        return SERVER_MESSAGES[message][index]
    for pattern, translations in SERVER_ERROR_PATTERNS:
        match = pattern.match(message)
        if not match:
            continue
        groups = match.groups()
        template = translations[index]
        values: dict[str, str] = {}
        if groups:
            values["value"] = groups[0]
        if "{status}" in template:
            values["status"] = groups[0]
            values["value"] = groups[1]
        elif "{options}" in template:
            values["options"] = groups[1]
        elif "{error}" in template:
            values["error"] = groups[1]
        return template.format(**values)
    return message


@app.exception_handler(StarletteHTTPException)
async def localized_http_exception(
    request: Request,
    exception: StarletteHTTPException,
) -> JSONResponse:
    detail = exception.detail
    if isinstance(detail, str):
        detail = translated_server_message(detail, request_language(request))
    return JSONResponse(
        status_code=exception.status_code,
        content={"detail": detail},
        headers=exception.headers,
    )


@app.exception_handler(RequestValidationError)
async def localized_validation_exception(
    request: Request,
    exception: RequestValidationError,
) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"detail": VALIDATION_ERROR_MESSAGES[request_language(request)]},
    )


_project_locks: dict[str, threading.Lock] = {}
_locks_guard = threading.Lock()


class RangeBody(BaseModel):
    start: float = Field(ge=0)
    end: float = Field(gt=0)


class AsrConfig(BaseModel):
    base_url: str = Field(min_length=4, max_length=500)
    api_key: str | None = Field(default=None, max_length=4096)
    model: str = Field(default="whisper-1", min_length=1, max_length=120)
    language: str | None = Field(default=None, max_length=20)
    prompt: str | None = Field(default=None, max_length=2000)
    mode: Literal["whole", "segments"] = "segments"
    chunk_seconds: float = Field(default=30, ge=5, le=120)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def project_lock(project_id: str) -> threading.Lock:
    with _locks_guard:
        return _project_locks.setdefault(project_id, threading.Lock())


def safe_stem(filename: str) -> str:
    stem = Path(filename or "audio").stem
    stem = re.sub(r"[\x00-\x1f<>:\"/\\|?*]+", "-", stem).strip(" .-")
    return stem[:90] or "audio"


def default_export_format(filename: str) -> str:
    suffix = Path(filename or "").suffix.lower().lstrip(".")
    aliases = {"oga": "ogg", "aif": "aiff"}
    candidate = aliases.get(suffix, suffix)
    return candidate if candidate in EXPORT_FORMATS else "wav"


def validate_ext(filename: str) -> str:
    suffix = Path(filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        supported = ", ".join(sorted(ext.lstrip(".") for ext in ALLOWED_EXTENSIONS))
        raise HTTPException(
            status_code=415,
            detail=f"不支持该文件格式，请上传：{supported}",
        )
    return suffix


def get_project_dir(project_id: str) -> Path:
    if not re.fullmatch(r"[a-f0-9]{32}", project_id):
        raise HTTPException(status_code=404, detail="音频项目不存在")
    project_dir = DATA_DIR / project_id
    if not project_dir.is_dir():
        raise HTTPException(status_code=404, detail="音频项目不存在或已被清理")
    return project_dir


def read_meta(project_dir: Path) -> dict[str, Any]:
    try:
        return json.loads((project_dir / "meta.json").read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=500, detail="音频项目元数据损坏") from exc


def write_meta(project_dir: Path, meta: dict[str, Any]) -> None:
    temporary = project_dir / "meta.json.tmp"
    temporary.write_text(
        json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    temporary.replace(project_dir / "meta.json")


def wav_info(path: Path) -> dict[str, Any]:
    import wave

    try:
        with wave.open(str(path), "rb") as source:
            if source.getcomptype() != "NONE" or source.getsampwidth() != 2:
                raise ValueError("音频必须转换为 16-bit PCM WAV")
            frames = source.getnframes()
            sample_rate = source.getframerate()
            channels = source.getnchannels()
    except (OSError, EOFError, ValueError, wave.Error) as exc:
        raise HTTPException(status_code=422, detail="无法读取转换后的音频") from exc

    duration = frames / sample_rate if sample_rate else 0
    if duration < MIN_AUDIO_SECONDS:
        raise HTTPException(status_code=422, detail="音频过短，至少需要 80 毫秒")
    return {
        "duration": round(duration, 6),
        "sample_rate": sample_rate,
        "channels": channels,
        "frames": frames,
    }


def transcode_to_wav(source: Path, destination: Path) -> None:
    command = [
        get_ffmpeg_exe(),
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        str(source),
        "-vn",
        "-acodec",
        "pcm_s16le",
        str(destination),
    ]
    try:
        result = subprocess.run(
            command,
            check=False,
            capture_output=True,
            text=True,
            timeout=180,
        )
    except subprocess.TimeoutExpired as exc:
        raise HTTPException(status_code=422, detail="音频转换超时，请尝试更短的文件") from exc
    if result.returncode != 0:
        message = (result.stderr or "").strip().splitlines()
        hint = message[-1][:240] if message else "无法识别的音频流"
        raise HTTPException(status_code=422, detail=f"音频解码失败：{hint}")


def read_samples(path: Path) -> tuple[np.ndarray, dict[str, int]]:
    import wave

    with wave.open(str(path), "rb") as source:
        channels = source.getnchannels()
        sample_rate = source.getframerate()
        frames = source.getnframes()
        raw = source.readframes(frames)
    audio = np.frombuffer(raw, dtype="<i2").reshape(-1, channels)
    return audio, {
        "sample_rate": sample_rate,
        "channels": channels,
        "frames": frames,
    }


def analysis_payload(project_dir: Path, resolution_ms: int) -> dict[str, Any]:
    meta = read_meta(project_dir)
    audio, info = read_samples(project_dir / "current.wav")
    mono = audio.astype(np.float32).mean(axis=1) / 32768.0
    window = max(1, round(info["sample_rate"] * resolution_ms / 1000))
    window_count = max(1, math.ceil(len(mono) / window))

    rms_values = np.zeros(window_count, dtype=np.float32)
    peak_values = np.zeros(window_count, dtype=np.float32)
    for index in range(window_count):
        block = mono[index * window : (index + 1) * window]
        if block.size:
            rms_values[index] = np.sqrt(np.mean(np.square(block)))
            peak_values[index] = np.max(np.abs(block))

    db = 20.0 * np.log10(np.maximum(rms_values, 1e-7))
    db = np.clip(db, -100.0, 0.0)
    peak_db = 20.0 * np.log10(np.maximum(peak_values, 1e-7))
    peak_db = np.clip(peak_db, -100.0, 0.0)

    media_version = int(meta.get("revision", 1))
    return {
        "id": meta["id"],
        "name": meta["name"],
        "duration": meta["duration"],
        "sample_rate": meta["sample_rate"],
        "channels": meta["channels"],
        "revision": media_version,
        "updated_at": meta["updated_at"],
        "previous_available": bool(meta.get("has_previous", False)),
        "resolution_ms": resolution_ms,
        "rms_db": np.round(db, 1).tolist(),
        "peak_db": np.round(peak_db, 1).tolist(),
        "source_format": Path(meta["name"]).suffix.lower().lstrip("."),
        "default_export_format": default_export_format(meta["name"]),
        "export_formats": list(EXPORT_FORMATS),
        "media_url": (
            f"/api/audio/{meta['id']}/media?v={media_version}&t="
            f"{quote(meta['updated_at'])}"
        ),
    }


def write_range(
    source_path: Path,
    destination_path: Path,
    start: float,
    end: float,
) -> None:
    import wave

    with wave.open(str(source_path), "rb") as source:
        sample_rate = source.getframerate()
        total_frames = source.getnframes()
        start_frame = min(total_frames, max(0, round(start * sample_rate)))
        end_frame = min(total_frames, max(start_frame, round(end * sample_rate)))
        params = source.getparams()
        source.setpos(start_frame)
        frames = source.readframes(end_frame - start_frame)

    with wave.open(str(destination_path), "wb") as destination:
        destination.setparams(params)
        destination.writeframes(frames)


def delete_audio_range(
    source_path: Path,
    destination_path: Path,
    start: float,
    end: float,
) -> None:
    import wave

    with wave.open(str(source_path), "rb") as source:
        sample_rate = source.getframerate()
        total_frames = source.getnframes()
        start_frame = min(total_frames, max(0, round(start * sample_rate)))
        end_frame = min(total_frames, max(start_frame, round(end * sample_rate)))
        params = source.getparams()
        source.setpos(0)
        before = source.readframes(start_frame)
        source.setpos(end_frame)
        after = source.readframes(total_frames - end_frame)

    with wave.open(str(destination_path), "wb") as destination:
        destination.setparams(params)
        destination.writeframes(before)
        destination.writeframes(after)


def clean_filename(name: str) -> str:
    return re.sub(r"[\x00-\x1f\x7f]", "", Path(name).name)[:180] or "audio.wav"


def wav_range_bytes(source_path: Path, start: float, end: float) -> bytes:
    import wave

    output = BytesIO()
    with wave.open(str(source_path), "rb") as source:
        sample_rate = source.getframerate()
        total_frames = source.getnframes()
        start_frame = min(total_frames, max(0, round(start * sample_rate)))
        end_frame = min(total_frames, max(start_frame, round(end * sample_rate)))
        source.setpos(start_frame)
        frames = source.readframes(end_frame - start_frame)
        params = source.getparams()
    with wave.open(output, "wb") as destination:
        destination.setparams(params)
        destination.writeframes(frames)
    return output.getvalue()


def fade_wav_edges_bytes(data: bytes, fade_seconds: float = 0.005) -> bytes:
    import wave

    with wave.open(BytesIO(data), "rb") as source:
        params = source.getparams()
        channels = source.getnchannels()
        sample_rate = source.getframerate()
        frames = source.getnframes()
        raw = source.readframes(frames)

    if frames < 2:
        return data
    samples = np.frombuffer(raw, dtype="<i2").reshape(-1, channels).copy()
    fade_frames = min(round(sample_rate * fade_seconds), frames // 2)
    if fade_frames:
        ramp = np.linspace(0.0, 1.0, fade_frames, dtype=np.float32)[:, None]
        samples[:fade_frames] = np.rint(
            samples[:fade_frames].astype(np.float32) * ramp
        ).astype(np.int16)
        samples[-fade_frames:] = np.rint(
            samples[-fade_frames:].astype(np.float32) * ramp[::-1]
        ).astype(np.int16)

    output = BytesIO()
    with wave.open(output, "wb") as destination:
        destination.setparams(params)
        destination.writeframes(samples.tobytes())
    return output.getvalue()


def build_transcription_url(base_url: str) -> str:
    url = base_url.strip().rstrip("/")
    if not re.match(r"^https?://", url, flags=re.IGNORECASE):
        raise HTTPException(status_code=422, detail="ASR Base URL 必须以 http:// 或 https:// 开头")
    if url.lower().endswith("/audio/transcriptions"):
        return url
    if url.lower().endswith("/v1"):
        return f"{url}/audio/transcriptions"
    return f"{url}/v1/audio/transcriptions"


async def request_transcription(
    *,
    client: httpx.AsyncClient,
    endpoint: str,
    api_key: str | None,
    model: str,
    language: str | None,
    prompt: str | None,
    filename: str,
    audio_bytes: bytes,
) -> str:
    data: dict[str, str] = {"model": model, "response_format": "json"}
    if language:
        data["language"] = language
    if prompt:
        data["prompt"] = prompt
    headers = {"Accept": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    try:
        response = await client.post(
            endpoint,
            headers=headers,
            data=data,
            files={"file": (filename, audio_bytes, "audio/wav")},
        )
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail="ASR 服务响应超时") from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"无法连接 ASR 服务：{exc}") from exc

    if response.status_code >= 400:
        message = response.text.strip()
        try:
            payload = response.json()
            if isinstance(payload, dict):
                message = (
                    payload.get("error", {}).get("message")
                    if isinstance(payload.get("error"), dict)
                    else payload.get("detail")
                ) or message
        except (ValueError, TypeError):
            pass
        message = re.sub(r"\s+", " ", str(message))[:500] or "未知错误"
        raise HTTPException(
            status_code=502,
            detail=f"ASR 服务返回 {response.status_code}：{message}",
        )

    try:
        payload = response.json()
    except ValueError:
        return response.text.strip()
    if isinstance(payload, dict):
        text = payload.get("text") or payload.get("transcription") or ""
        return str(text).strip()
    if isinstance(payload, str):
        return payload.strip()
    return ""


@app.get("/", include_in_schema=False)
def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/audio")
async def upload_audio(
    file: UploadFile = File(...),
    resolution_ms: int = Query(100, ge=50, le=200),
) -> dict[str, Any]:
    original_name = clean_filename(file.filename or "audio")
    validate_ext(original_name)

    project_id = uuid4().hex
    project_dir = DATA_DIR / project_id
    project_dir.mkdir(parents=True, exist_ok=False)
    upload_path = project_dir / f"upload{Path(original_name).suffix.lower()}"
    wav_path = project_dir / "current.wav"
    written = 0

    try:
        with upload_path.open("wb") as destination:
            while chunk := await file.read(1024 * 1024):
                written += len(chunk)
                if written > MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail=f"文件超过 {MAX_UPLOAD_BYTES // (1024 * 1024)} MB 限制",
                    )
                destination.write(chunk)
        if written == 0:
            raise HTTPException(status_code=422, detail="上传的音频文件为空")

        transcode_to_wav(upload_path, wav_path)
        info = wav_info(wav_path)
        now = utc_now()
        meta = {
            "id": project_id,
            "name": original_name,
            "duration": info["duration"],
            "sample_rate": info["sample_rate"],
            "channels": info["channels"],
            "revision": 1,
            "created_at": now,
            "updated_at": now,
            "has_previous": False,
        }
        write_meta(project_dir, meta)
        return analysis_payload(project_dir, resolution_ms)
    except HTTPException:
        shutil.rmtree(project_dir, ignore_errors=True)
        raise
    except Exception as exc:
        shutil.rmtree(project_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"处理音频时出错：{exc}") from exc
    finally:
        upload_path.unlink(missing_ok=True)
        await file.close()


@app.get("/api/audio/{project_id}/analysis")
def get_analysis(
    project_id: str,
    resolution_ms: int = Query(100, ge=50, le=200),
) -> dict[str, Any]:
    return analysis_payload(get_project_dir(project_id), resolution_ms)


@app.get("/api/audio/{project_id}/media")
def get_media(project_id: str) -> FileResponse:
    project_dir = get_project_dir(project_id)
    return FileResponse(
        project_dir / "current.wav",
        media_type="audio/wav",
        headers={"Cache-Control": "private, max-age=31536000, immutable"},
    )


@app.get("/api/audio/{project_id}/export")
def export_audio(
    project_id: str,
    start: float = Query(0, ge=0),
    end: float | None = Query(None, gt=0),
    output_format: str | None = Query(None, alias="format"),
) -> FileResponse:
    project_dir = get_project_dir(project_id)
    with project_lock(project_id):
        meta = read_meta(project_dir)
        duration = float(meta["duration"])
        if start >= duration or start < 0:
            raise HTTPException(status_code=422, detail="导出起点超出音频范围")
        stop = duration if end is None else min(end, duration)
        if stop - start < MIN_AUDIO_SECONDS:
            raise HTTPException(status_code=422, detail="导出片段至少需要 80 毫秒")

        chosen_format = (output_format or default_export_format(meta["name"])).lower()
        if chosen_format not in EXPORT_FORMATS:
            raise HTTPException(
                status_code=422,
                detail=f"不支持导出为 {chosen_format}，可选：{', '.join(EXPORT_FORMATS)}",
            )

        handle, output_name = tempfile.mkstemp(
            prefix="export-", suffix=f".{chosen_format}", dir=project_dir
        )
        os.close(handle)
        output_file = Path(output_name)
        intermediate: Path | None = None
        try:
            if chosen_format == "wav":
                write_range(project_dir / "current.wav", output_file, start, stop)
                output_file.write_bytes(fade_wav_edges_bytes(output_file.read_bytes()))
            else:
                handle, source_name = tempfile.mkstemp(
                    prefix="range-", suffix=".wav", dir=project_dir
                )
                os.close(handle)
                intermediate = Path(source_name)
                write_range(
                    project_dir / "current.wav", intermediate, start, stop
                )
                intermediate.write_bytes(
                    fade_wav_edges_bytes(intermediate.read_bytes())
                )
                command = [
                    get_ffmpeg_exe(),
                    "-hide_banner",
                    "-loglevel",
                    "error",
                    "-y",
                    "-i",
                    str(intermediate),
                    "-vn",
                    "-map_metadata",
                    "-1",
                    *EXPORT_FORMATS[chosen_format]["profile"],
                    *EXPORT_FORMATS[chosen_format].get("output_options", []),
                    str(output_file),
                ]
                result = subprocess.run(
                    command, check=False, capture_output=True, text=True, timeout=180
                )
                if result.returncode != 0:
                    message = (result.stderr or "").strip()[-500:]
                    raise HTTPException(
                        status_code=422,
                        detail=f"导出为 {chosen_format} 失败：{message or '编码器不可用'}",
                    )
        except Exception:
            output_file.unlink(missing_ok=True)
            raise
        finally:
            if intermediate:
                intermediate.unlink(missing_ok=True)

    filename = (
        f"{safe_stem(meta['name'])}-{start:.2f}-{stop:.2f}s.{chosen_format}"
    )
    return FileResponse(
        output_file,
        media_type=EXPORT_FORMATS[chosen_format]["mime"],
        filename=filename,
        background=BackgroundTask(output_file.unlink, missing_ok=True),
        headers={
            "Cache-Control": "no-store",
            "X-Audio-Format": chosen_format,
        },
    )


@app.get("/api/audio/{project_id}/selection-preview")
def selection_preview(
    project_id: str,
    start: float = Query(0, ge=0),
    end: float | None = Query(None, gt=0),
) -> Response:
    project_dir = get_project_dir(project_id)
    with project_lock(project_id):
        meta = read_meta(project_dir)
        duration = float(meta["duration"])
        if start >= duration or start < 0:
            raise HTTPException(status_code=422, detail="选区起点超出音频范围")
        stop = duration if end is None else min(end, duration)
        if stop - start < MIN_AUDIO_SECONDS:
            raise HTTPException(status_code=422, detail="选区至少需要 80 毫秒")
        data = wav_range_bytes(project_dir / "current.wav", start, stop)
        data = fade_wav_edges_bytes(data)

    return Response(
        content=data,
        media_type="audio/wav",
        headers={
            "Cache-Control": "no-store",
            "Content-Length": str(len(data)),
        },
    )


@app.post("/api/audio/{project_id}/delete")
def delete_range(
    project_id: str,
    body: RangeBody,
    resolution_ms: int = Query(100, ge=50, le=200),
) -> dict[str, Any]:
    project_dir = get_project_dir(project_id)
    with project_lock(project_id):
        meta = read_meta(project_dir)
        duration = float(meta["duration"])
        start = max(0.0, min(body.start, duration))
        end = max(0.0, min(body.end, duration))
        if end - start < MIN_AUDIO_SECONDS:
            raise HTTPException(status_code=422, detail="删除片段至少需要 80 毫秒")
        if end - start >= duration - 0.001:
            raise HTTPException(status_code=422, detail="不能删除整段音频")

        previous = project_dir / "previous.wav"
        shutil.copy2(project_dir / "current.wav", previous)
        handle, temporary_name = tempfile.mkstemp(
            prefix="edit-", suffix=".wav", dir=project_dir
        )
        os.close(handle)
        temporary = Path(temporary_name)
        try:
            delete_audio_range(
                project_dir / "current.wav", temporary, start, end
            )
            info = wav_info(temporary)
            if info["duration"] < MIN_AUDIO_SECONDS:
                raise HTTPException(status_code=422, detail="删除后音频过短")
            temporary.replace(project_dir / "current.wav")
        except Exception:
            temporary.unlink(missing_ok=True)
            previous.unlink(missing_ok=True)
            raise

        meta.update(
            {
                "duration": info["duration"],
                "revision": int(meta.get("revision", 1)) + 1,
                "updated_at": utc_now(),
                "has_previous": True,
            }
        )
        write_meta(project_dir, meta)
        return analysis_payload(project_dir, resolution_ms)


@app.post("/api/audio/{project_id}/undo")
def undo_delete(
    project_id: str,
    resolution_ms: int = Query(100, ge=50, le=200),
) -> dict[str, Any]:
    project_dir = get_project_dir(project_id)
    with project_lock(project_id):
        meta = read_meta(project_dir)
        previous = project_dir / "previous.wav"
        if not previous.is_file():
            raise HTTPException(status_code=409, detail="没有可撤销的删除操作")
        info = wav_info(previous)
        temporary = project_dir / "undo.wav"
        shutil.copy2(previous, temporary)
        temporary.replace(project_dir / "current.wav")
        previous.unlink(missing_ok=True)
        meta.update(
            {
                "duration": info["duration"],
                "revision": int(meta.get("revision", 1)) + 1,
                "updated_at": utc_now(),
                "has_previous": False,
            }
        )
        write_meta(project_dir, meta)
        return analysis_payload(project_dir, resolution_ms)


@app.post("/api/audio/{project_id}/transcribe")
async def transcribe_audio(
    project_id: str,
    config: AsrConfig,
) -> dict[str, Any]:
    project_dir = get_project_dir(project_id)
    endpoint = build_transcription_url(config.base_url)

    with project_lock(project_id):
        meta = read_meta(project_dir)
        duration = float(meta["duration"])
        handle, snapshot_name = tempfile.mkstemp(
            prefix="asr-source-", suffix=".wav", dir=project_dir
        )
        os.close(handle)
        snapshot = Path(snapshot_name)
        shutil.copy2(project_dir / "current.wav", snapshot)

    try:
        timeout = httpx.Timeout(120.0, connect=20.0)
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            if config.mode == "whole":
                text = await request_transcription(
                    client=client,
                    endpoint=endpoint,
                    api_key=config.api_key,
                    model=config.model,
                    language=config.language,
                    prompt=config.prompt,
                    filename=f"{safe_stem(meta['name'])}.wav",
                    audio_bytes=snapshot.read_bytes(),
                )
                segments = [
                    {
                        "index": 0,
                        "start": 0.0,
                        "end": round(duration, 3),
                        "text": text,
                    }
                ]
            else:
                chunk_count = max(1, math.ceil(duration / config.chunk_seconds))
                if chunk_count > 200:
                    raise HTTPException(
                        status_code=422,
                        detail="分段数量超过 200，请增大每段时长后再试",
                    )
                segments = []
                for index in range(chunk_count):
                    chunk_start = index * config.chunk_seconds
                    chunk_end = min(duration, chunk_start + config.chunk_seconds)
                    if duration - chunk_start < 0.08:
                        break
                    chunk = wav_range_bytes(snapshot, chunk_start, chunk_end)
                    text = await request_transcription(
                        client=client,
                        endpoint=endpoint,
                        api_key=config.api_key,
                        model=config.model,
                        language=config.language,
                        prompt=config.prompt,
                        filename=f"segment-{index + 1:03d}.wav",
                        audio_bytes=chunk,
                    )
                    segments.append(
                        {
                            "index": index,
                            "start": round(chunk_start, 3),
                            "end": round(chunk_end, 3),
                            "text": text,
                        }
                    )
    finally:
        snapshot.unlink(missing_ok=True)

    return {
        "mode": config.mode,
        "model": config.model,
        "language": config.language,
        "duration": duration,
        "segments": segments,
        "text": "\n".join(
            segment["text"] for segment in segments if segment["text"]
        ).strip(),
    }
