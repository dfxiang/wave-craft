# Contributing

**English** | [简体中文](CONTRIBUTING.md)

Thank you for contributing to WaveCraft. Before submitting code, search existing issues and make
sure the scope is clear, reproducible, and verifiable.

## Requirements

| Component | Version | Purpose |
| --- | --- | --- |
| Python | 3.12+ | Backend, audio processing, and tests |
| Docker + Compose v2 | Latest stable | Containerized deployment |
| Modern browser | Latest stable | Frontend interaction testing |

FFmpeg is installed with the Python dependency `imageio-ffmpeg`; no separate host-level FFmpeg
configuration is required.

## Local development

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Open [http://localhost:8000](http://localhost:8000) in a browser. To verify deployment in a clean
environment, run `docker compose up -d --build`.

## Pre-submit checks

```bash
pytest -q
python -m compileall -q app.py
docker compose config
```

Changes involving audio editing or export should cover at least the following scenarios:

- Upload and export both WAV and one compressed format;
- Selection boundaries, extremely short selections, and empty selections;
- State consistency after deletion, undo, and reanalysis;
- Successful ASR requests, upstream errors, and verification that API keys are not written to disk.

## Code conventions

- Follow PEP 8 for Python and prefer type annotations and reproducible tests.
- Keep the frontend in vanilla JavaScript without introducing a build step. Interactions should
  support keyboard operation and narrow-screen layouts.
- Update the API list in both `README.md` and `README.en.md` when changing an API.
- Do not commit uploaded audio, generated files, API keys, access tokens, or real user data.
- Prefer commit messages in the form `type(scope): summary`, using types such as `feat`, `fix`,
  `docs`, `test`, and `chore`.

## Security

Do not report security vulnerabilities through public issues. Use the private channel described
in [SECURITY.en.md](SECURITY.en.md).

## License

This project uses Apache-2.0 + Commons Clause; see [LICENSE](LICENSE). Contributions are
distributed under the same license. Confirm that you have the right to submit the relevant code
and assets.
