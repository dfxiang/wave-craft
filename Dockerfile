FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    AUDIO_EDITOR_DATA=/data \
    AUDIO_EDITOR_MAX_UPLOAD_MB=250

WORKDIR /app

RUN groupadd --system wavecraft \
    && useradd --system --gid wavecraft --home-dir /app wavecraft

ARG PIP_INDEX_URL=https://pypi.org/simple

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir --index-url "${PIP_INDEX_URL}" -r requirements.txt

COPY app.py .
COPY static ./static

RUN mkdir -p /data \
    && chown -R wavecraft:wavecraft /app /data

USER wavecraft

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3)"

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
