# Security Policy

**English** | [简体中文](SECURITY.md)

## Reporting a vulnerability

Do not report security issues through public issues. Prefer GitHub's private vulnerability
reporting flow (**Security → Report a vulnerability**) or email
[4198166@qq.com](mailto:4198166@qq.com). The WeChat ID is also `4198166`.

Include as much of the following as possible: affected commit, reproduction steps or proof of
concept, impact, and exploitation prerequisites. After confirmation, the issue will be documented
in the release notes and credited if you wish to be named.

## Supported scope

Only the latest code on the `main` branch receives security fixes. This project is provided
**as-is** and does not promise a fixed response time, remediation deadline, or SLA.

## Self-hosting security checklist

- Do not expose an unauthenticated instance directly to the internet. Add authentication, HTTPS,
  and rate limiting at the reverse proxy.
- Use self-hosted OpenAI-compatible ASR services only on trusted networks. The deployer is
  responsible for reviewing the privacy policy of any third-party service.
- Set reasonable limits for upload size, disk usage, and automatic segmentation, and regularly
  remove data that is no longer needed.
- Back up the `audio-editor-data` volume regularly. Confirm that backups are complete before
  running `docker compose down -v`.
- API keys are not written to server-side disk or logs, but they still exist in browser memory
  and the request path. Do not retain them on shared devices, and rotate them upstream
  immediately if exposure is suspected.
- In production, restrict access to `/docs` and protect the host's Docker socket.
- Follow security updates for FastAPI, Uvicorn, FFmpeg, and `imageio-ffmpeg`, and rebuild the
  image promptly.

## Known design boundaries

- There is no multi-user or fine-grained permission system. Anyone who can access the page can
  operate the audio projects stored by the server.
- Deletion supports only undoing the most recent edit. It is not a complete version-control
  system.
- Importing third-party LLM clients or adding another ASR-compatible gateway sends audio and
  transcription text through those services.
