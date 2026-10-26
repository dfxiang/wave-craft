from __future__ import annotations

import math
import os
import re
import struct
import subprocess
import sys
import tempfile
import threading
import wave
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from imageio_ffmpeg import get_ffmpeg_exe


TEST_DATA = Path(tempfile.mkdtemp(prefix="wavecraft-tests-"))
os.environ["AUDIO_EDITOR_DATA"] = str(TEST_DATA)
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import app  # noqa: E402


client = TestClient(app)
BASE_DIR = Path(__file__).resolve().parents[1]


def make_wav(duration: float = 1.5, sample_rate: int = 16000) -> bytes:
    output = BytesIO()
    with wave.open(output, "wb") as destination:
        destination.setnchannels(2)
        destination.setsampwidth(2)
        destination.setframerate(sample_rate)
        frames = bytearray()
        for index in range(round(duration * sample_rate)):
            time = index / sample_rate
            amplitude = 0.0 if 0.55 < time < 0.85 else 0.32
            sample = int(amplitude * 32767 * math.sin(2 * math.pi * 220 * time))
            frames.extend(struct.pack("<hh", sample, sample))
        destination.writeframes(frames)
    return output.getvalue()


def upload_wav() -> dict:
    response = client.post(
        "/api/audio?resolution_ms=100",
        files={"file": ("demo.wav", make_wav(), "audio/wav")},
    )
    assert response.status_code == 200, response.text
    return response.json()


class AsrHandler(BaseHTTPRequestHandler):
    calls = 0

    def do_POST(self) -> None:
        type(self).calls += 1
        length = int(self.headers.get("Content-Length", "0"))
        self.rfile.read(length)
        body = b'{"text":"compatible transcript"}'
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args: object) -> None:
        return


@pytest.fixture()
def asr_server():
    server = ThreadingHTTPServer(("127.0.0.1", 0), AsrHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{server.server_port}"
    finally:
        server.shutdown()
        thread.join(timeout=3)


def test_upload_analysis_and_default_export() -> None:
    data = upload_wav()
    assert data["sample_rate"] == 16000
    assert data["channels"] == 2
    assert data["default_export_format"] == "wav"
    assert len(data["rms_db"]) >= 10
    assert len(data["peak_db"]) == len(data["rms_db"])
    assert all(peak >= rms for peak, rms in zip(data["peak_db"], data["rms_db"]))

    response = client.get(f"/api/audio/{data['id']}/export")
    assert response.status_code == 200
    assert response.content.startswith(b"RIFF")
    assert response.headers["x-audio-format"] == "wav"


def test_interface_declares_four_languages() -> None:
    html = (BASE_DIR / "static" / "index.html").read_text(encoding="utf-8")
    assert '<script src="/static/i18n.js"></script>' in html
    assert 'id="languageSelect"' in html
    for language in ("zh", "en", "fr", "de"):
        assert f'<option value="{language}">' in html


@pytest.mark.parametrize(
    ("language", "expected"),
    [
        ("zh-CN", "音频项目不存在"),
        ("en-US", "Audio project not found"),
        ("fr-FR", "Projet audio introuvable"),
        ("de-DE", "Audioprojekt nicht gefunden"),
    ],
)
def test_api_errors_follow_accept_language(language: str, expected: str) -> None:
    response = client.get(
        "/api/audio/not-found/media",
        headers={"Accept-Language": language},
    )
    assert response.status_code == 404
    assert expected in response.json()["detail"]


def test_validation_errors_follow_accept_language() -> None:
    response = client.post(
        "/api/audio/not-found/delete?resolution_ms=999",
        headers={"Accept-Language": "de-DE"},
        json={"start": 0, "end": 1},
    )
    assert response.status_code == 422
    assert "Ungültige Anfrageparameter" in response.json()["detail"]


def test_selection_preview_is_exact_and_faded() -> None:
    data = upload_wav()
    response = client.get(
        f"/api/audio/{data['id']}/selection-preview?start=0.4&end=1.1"
    )
    assert response.status_code == 200, response.text
    with wave.open(BytesIO(response.content), "rb") as preview:
        sample_rate = preview.getframerate()
        frames = preview.getnframes()
        channels = preview.getnchannels()
        samples = struct.unpack(
            f"<{frames * channels}h", preview.readframes(frames)
        )
    assert frames == round((1.1 - 0.4) * sample_rate)
    assert samples[0] == 0
    assert samples[-1] == 0
    assert max(abs(sample) for sample in samples) > 1000


@pytest.mark.parametrize(
    "output_format",
    ["mp3", "flac", "m4a", "ogg", "opus", "aiff", "aac", "webm", "wma"],
)
def test_common_export_formats(output_format: str) -> None:
    data = upload_wav()
    response = client.get(
        f"/api/audio/{data['id']}/export?start=0&end=0.8&format={output_format}"
    )
    assert response.status_code == 200, response.text
    assert len(response.content) > 200
    assert response.headers["x-audio-format"] == output_format


def test_mp3_upload_defaults_to_mp3_export() -> None:
    source = TEST_DATA / "source-default.wav"
    encoded = TEST_DATA / "source-default.mp3"
    source.write_bytes(make_wav())
    result = subprocess.run(
        [
            get_ffmpeg_exe(),
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(source),
            "-acodec",
            "libmp3lame",
            str(encoded),
        ],
        capture_output=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr.decode(errors="replace")

    response = client.post(
        "/api/audio?resolution_ms=100",
        files={"file": ("default-format.mp3", encoded.read_bytes(), "audio/mpeg")},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["source_format"] == "mp3"
    assert data["default_export_format"] == "mp3"


def test_webm_export_starts_at_zero_timestamp() -> None:
    data = upload_wav()
    response = client.get(
        f"/api/audio/{data['id']}/export?start=0.2&end=1.1&format=webm"
    )
    assert response.status_code == 200, response.text
    webm_path = TEST_DATA / "timestamp-check.webm"
    webm_path.write_bytes(response.content)
    result = subprocess.run(
        [
            get_ffmpeg_exe(),
            "-hide_banner",
            "-i",
            str(webm_path),
            "-f",
            "null",
            "-",
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    metadata = result.stderr
    start_match = re.search(r"Duration: [^,]+, start: ([0-9.-]+)", metadata)
    assert start_match is not None, metadata[-1000:]
    assert float(start_match.group(1)) == pytest.approx(0.0, abs=0.0001)


def test_delete_and_undo() -> None:
    data = upload_wav()
    original_duration = data["duration"]
    response = client.post(
        f"/api/audio/{data['id']}/delete?resolution_ms=100",
        json={"start": 0.5, "end": 0.9},
    )
    assert response.status_code == 200, response.text
    edited = response.json()
    assert edited["duration"] < original_duration - 0.3
    assert edited["previous_available"] is True

    response = client.post(
        f"/api/audio/{data['id']}/undo?resolution_ms=100"
    )
    assert response.status_code == 200, response.text
    restored = response.json()
    assert restored["duration"] == pytest.approx(original_duration, abs=0.002)
    assert restored["previous_available"] is False


def test_openai_compatible_whole_transcription(asr_server: str) -> None:
    data = upload_wav()
    response = client.post(
        f"/api/audio/{data['id']}/transcribe",
        json={
            "base_url": asr_server,
            "api_key": "test-key",
            "model": "whisper-1",
            "language": "en",
            "mode": "whole",
            "chunk_seconds": 30,
        },
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["text"] == "compatible transcript"
    assert result["segments"][0]["start"] == 0
    assert result["segments"][0]["end"] == pytest.approx(data["duration"], abs=0.002)


def test_openai_compatible_segmented_transcription(asr_server: str) -> None:
    response = client.post(
        "/api/audio?resolution_ms=100",
        files={"file": ("segment-demo.wav", make_wav(duration=11.2), "audio/wav")},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    before = AsrHandler.calls
    response = client.post(
        f"/api/audio/{data['id']}/transcribe",
        json={
            "base_url": asr_server,
            "model": "whisper-1",
            "mode": "segments",
            "chunk_seconds": 5,
        },
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert len(result["segments"]) == 3
    assert AsrHandler.calls - before == 3
    assert result["segments"][0]["start"] == 0
    assert result["segments"][-1]["end"] == pytest.approx(data["duration"])
