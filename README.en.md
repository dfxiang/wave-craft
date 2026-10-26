# WaveCraft

**English** | [简体中文](README.md)

A browser-based audio editor built with FastAPI and vanilla HTML/CSS/JavaScript. The server
decodes uploads to PCM and calculates RMS waveforms, while the browser provides a horizontally
scrollable timeline for podcast editing, recording cleanup, silence detection, and speech
transcription.

## Screenshots

![WaveCraft interface 1](wavecraft1.png)

![WaveCraft interface 2](wavecraft2.png)

[![License](https://img.shields.io/badge/License-Apache--2.0%20%2B%20Commons%20Clause-3b6ea5.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-F7DF1E.svg?logo=javascript&logoColor=black)](static/app.js)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg?logo=docker&logoColor=white)](docker-compose.yml)

> WaveCraft is licensed under **Apache License 2.0 + Commons Clause**. You may use it in
> commercial projects, modify it, and redistribute it, but you may not sell the software or
> its substantially similar functionality as a paid product or paid hosting service. See
> [LICENSE](LICENSE) for the complete terms and
> [License and commercial use](docs/license-and-commercial-use.md) for practical guidance.

## Features

- RMS waveform analysis at 50 ms, 100 ms, and 200 ms resolution.
- Horizontally scrollable long-audio timelines. Only the visible canvas area is rendered to
  avoid extremely wide canvases.
- Automatic low-level detection with an adjustable threshold from `-60 dBFS` to `-20 dBFS`.
- Timeline markers that can be generated for low-level regions or added and removed manually
  at the current playhead.
- Clip selection by dragging across the waveform, with adjustable selection boundaries.
- Accurate selection previews generated as independent server-side clips from exact sample
  frames, without seeking through the complete audio file.
- Automatic 5 ms fade-in and fade-out on clip exports to reduce boundary clicks.
- Selection preview, deletion, and export to WAV, MP3, FLAC, M4A, OGG, OPUS, AIFF, AAC, WEBM,
  WMA, and other supported formats.
- Export defaults to the uploaded format, so an MP3 upload exports as MP3 by default.
- Undo support for the most recent audio deletion.
- OpenAI-compatible speech recognition with full-file transcription or automatic 15–60 second
  segmentation. Results are aligned beneath the correct timeline ranges.
- API keys are sent only from the browser to this application's backend for immediate
  forwarding. They are not written to server-side disk or logs.

## Project structure

```text
wave-craft/
├── app.py                  # FastAPI backend, audio analysis/editing/export, and ASR proxy
├── static/                 # Vanilla frontend: pages, styles, and interactions
├── tests/                  # API and audio-processing tests
├── Dockerfile              # Application image running as a non-root user
├── docker-compose.yml      # One-command startup and persistent data volume
├── README.md / README.en.md                    # Chinese and English project guides
├── CONTRIBUTING.md / CONTRIBUTING.en.md        # Chinese and English contributor guides
├── SECURITY.md / SECURITY.en.md                # Chinese and English security policies
├── LICENSE                 # Apache-2.0 + Commons Clause
└── docs/                   # Chinese and English license and commercial-use guidance
```

## Run with Docker

Docker 24+ and Docker Compose v2+ are required.

```bash
docker compose up -d --build
```

Open [http://localhost:8000](http://localhost:8000) in a browser. To inspect container status and
logs:

```bash
docker compose ps
docker compose logs -f audio-editor
```

If port `8000` is already in use on the host, choose another mapped port:

```bash
WAVECRAFT_PORT=8765 docker compose up -d --build
```

Then open `http://localhost:8765`.

Stop the service:

```bash
docker compose down
```

Audio projects are stored in the `audio-editor-data` named volume. Running
`docker compose down -v` also deletes uploaded and edited project files from the server. This
operation cannot be undone.

## Run locally

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

The default data directory is `./data`. Override it with `AUDIO_EDITOR_DATA`:

```bash
AUDIO_EDITOR_DATA=/tmp/wavecraft-data uvicorn app:app --host 0.0.0.0 --port 8000
```

## ASR configuration

Complete the **Speech recognition** section in the right-hand panel:

- Base URL: for example, `https://api.openai.com/v1`.
- API key: leave empty to connect to a local compatible service that does not require
  authentication.
- Model: for example, `whisper-1`. The connected service determines the available model names.
- Language: automatic detection or an explicitly selected language.
- Processing mode:
  - Automatic segmentation: split the file into fixed-duration WAV clips and transcribe each
    clip separately. Each result is aligned with its corresponding time range.
  - Full-file recognition: send the complete current audio in a single request. This mode is
    suitable for short files or upstream services that support long audio.

The backend sends the request to the following OpenAI-compatible transcription endpoint with the
multipart fields `file`, `model`, `response_format=json`, and optionally `language` and `prompt`:

```text
POST {base_url}/audio/transcriptions
Authorization: Bearer {api_key}
```

If the Base URL does not include `/v1`, the application appends
`/v1/audio/transcriptions`. If the value already ends with `/audio/transcriptions`, it is used
as-is.

## Operational limits

- The default single-file upload limit is 250 MB and can be changed with
  `AUDIO_EDITOR_MAX_UPLOAD_MB`.
- FFmpeg is installed with the Python dependency `imageio-ffmpeg`; no separate host-level FFmpeg
  installation is required.
- Automatic segmentation creates at most 200 clips. Increase the segment duration for very long
  audio files.
- Multi-user authentication is not implemented. If exposing the service to the internet, add
  reverse-proxy authentication, HTTPS, rate limiting, and a regular data-cleanup policy.

## API

- `POST /api/audio?resolution_ms=100`: upload and analyze audio.
- `GET /api/audio/{id}/analysis?resolution_ms=100`: rerun analysis.
- `GET /api/audio/{id}/media`: play the current audio.
- `GET /api/audio/{id}/selection-preview?start=0&end=10`: preview an exact selection.
- `GET /api/audio/{id}/export?start=0&end=10&format=mp3`: export a selection or the complete
  audio.
- `POST /api/audio/{id}/delete`: delete an audio range.
- `POST /api/audio/{id}/undo`: undo the most recent deletion.
- `POST /api/audio/{id}/transcribe`: call an OpenAI-compatible ASR service.

FastAPI-generated API documentation is available at `http://localhost:8000/docs`.

## Testing

```bash
pytest -q
```

## Contributing

Bug reports, feature requests, and pull requests are welcome. Read
[CONTRIBUTING.md](CONTRIBUTING.en.md) before starting development. Report security issues
privately through [SECURITY.md](SECURITY.en.md) instead of opening a public issue.

## License and commercial use

WaveCraft uses the **Apache License 2.0 + Commons Clause License Condition v1.0**. See
[LICENSE](LICENSE) for the complete terms.

| You may | You may not |
| --- | --- |
| Use it commercially, deploy it in your own business, modify it, and build on it | Sell the software or its substantially similar functionality as a paid product to third parties |
| Copy and redistribute it for free while preserving copyright and license notices | Offer paid hosting services whose primary value is this software without authorization |
| Use it for learning, research, internal teaching, and self-hosting | Remove or alter copyright and license notices |

> The Commons Clause adds a condition that prohibits selling the software itself. WaveCraft is
> therefore **source-available**, not an OSI-approved open-source license. See
> [License and commercial use](docs/license-and-commercial-use.md) for details.

Commercial licensing, custom development, and technical support may be available directly from
the copyright holder:
`4198166@qq.com` · WeChat `4198166` · Phone `+86 185 7281 7101`.

## Disclaimer

- Users are responsible for supplying audio they are legally allowed to process. ASR requests
  send audio to the third-party service you configure, so verify its compliance and privacy
  requirements first.
- The project is provided **as-is**, without express or implied warranties. Before exposing it
  to the internet, add authentication, HTTPS, rate limiting, logging, and backups.
- No guarantee is made regarding the accuracy of audio processing or third-party transcription.
  Keep original recordings and review important results manually.

## Connect and support

If WaveCraft helps you, you can buy the author a coffee or connect on WeChat to discuss audio,
products, and engineering. Support is entirely voluntary and does not affect your rights to use
the project.

<table>
  <tr>
    <td align="center">
      <img src="weixin.jpg" alt="Author's WeChat QR code" width="260"><br>
      <sub>Scan to connect on WeChat</sub>
    </td>
    <td align="center">
      <img src="donation.jpg" alt="Project donation QR code" width="260"><br>
      <sub>Buy the author a coffee and support ongoing maintenance</sub>
    </td>
  </tr>
</table>
