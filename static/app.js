(() => {
  "use strict";

  const i18n = window.WaveCraftI18n;
  const t = (key, values) => i18n.t(key, values);
  const $ = (id) => document.getElementById(id);
  const dom = {
    uploadStage: $("uploadStage"),
    editor: $("editor"),
    dropZone: $("dropZone"),
    fileInput: $("fileInput"),
    uploadError: $("uploadError"),
    headerFileName: $("headerFileName"),
    headerFileMeta: $("headerFileMeta"),
    fileIdentity: $("fileIdentity"),
    undoBtn: $("undoBtn"),
    exportBtn: $("exportBtn"),
    exportBtnLabel: $("exportBtnLabel"),
    exportFormat: $("exportFormat"),
    factDuration: $("factDuration"),
    factRate: $("factRate"),
    factChannels: $("factChannels"),
    resolutionSelect: $("resolutionSelect"),
    timelineScroller: $("timelineScroller"),
    timelineTrack: $("timelineTrack"),
    waveCanvas: $("waveCanvas"),
    currentTime: $("currentTime"),
    totalTime: $("totalTime"),
    playBtn: $("playBtn"),
    playIcon: $("playIcon"),
    toStartBtn: $("toStartBtn"),
    zoomOutBtn: $("zoomOutBtn"),
    zoomInBtn: $("zoomInBtn"),
    fitBtn: $("fitBtn"),
    zoomValue: $("zoomValue"),
    autoLabelToggle: $("autoLabelToggle"),
    thresholdSlider: $("thresholdSlider"),
    thresholdValue: $("thresholdValue"),
    selectionEmpty: $("selectionEmpty"),
    selectionDetails: $("selectionDetails"),
    selectionStart: $("selectionStart"),
    selectionEnd: $("selectionEnd"),
    selectionDuration: $("selectionDuration"),
    clearSelectionBtn: $("clearSelectionBtn"),
    playSelectionBtn: $("playSelectionBtn"),
    deleteSelectionBtn: $("deleteSelectionBtn"),
    addLabelBtn: $("addLabelBtn"),
    labelCount: $("labelCount"),
    labelList: $("labelList"),
    transcriptSection: $("transcriptSection"),
    transcriptCount: $("transcriptCount"),
    transcriptList: $("transcriptList"),
    clearTranscriptBtn: $("clearTranscriptBtn"),
    asrConfig: $("asrConfig"),
    asrBaseUrl: $("asrBaseUrl"),
    asrApiKey: $("asrApiKey"),
    asrKeyToggle: $("asrKeyToggle"),
    asrModel: $("asrModel"),
    asrLanguage: $("asrLanguage"),
    asrMode: $("asrMode"),
    asrChunkSeconds: $("asrChunkSeconds"),
    chunkSecondsField: $("chunkSecondsField"),
    asrStartBtn: $("asrStartBtn"),
    asrStartLabel: $("asrStartLabel"),
    asrStatus: $("asrStatus"),
    deleteDialog: $("deleteDialog"),
    deleteRangeLabel: $("deleteRangeLabel"),
    confirmDeleteBtn: $("confirmDeleteBtn"),
    audioPlayer: $("audioPlayer"),
    selectionPlayer: $("selectionPlayer"),
    toastRegion: $("toastRegion"),
    busyOverlay: $("busyOverlay"),
    busyTitle: $("busyTitle"),
    busyMessage: $("busyMessage"),
    languageSelect: $("languageSelect"),
  };

  const canvas = dom.waveCanvas;
  const ctx = canvas.getContext("2d");
  const PLOT_LEFT = 46;
  const MIN_SELECTION_SECONDS = 0.02;
  const ASR_STORAGE_KEY = "wavecraft.asr.settings";
  const FORMAT_NAMES = {
    wav: "WAV",
    mp3: "MP3",
    flac: "FLAC",
    m4a: "M4A",
    ogg: "OGG",
    opus: "OPUS",
    aiff: "AIFF",
    aac: "AAC",
    webm: "WEBM",
    wma: "WMA",
  };
  const COLORS = {
    background: "#0b1118",
    panel: "#0e151d",
    grid: "rgba(122, 156, 172, 0.12)",
    gridStrong: "rgba(145, 177, 190, 0.24)",
    text: "#edf7f4",
    muted: "#8195a1",
    faint: "#5e7480",
    accent: "#57e3bd",
    accentSoft: "rgba(87, 227, 189, 0.16)",
    amber: "#ffc56f",
    amberFill: "rgba(255, 197, 111, 0.08)",
    amberBorder: "rgba(255, 197, 111, 0.65)",
    danger: "#ff7884",
    selection: "rgba(255, 197, 111, 0.16)",
    selectionEdge: "#ffc56f",
    playhead: "#f4fbf9",
  };

  const state = {
    data: null,
    busy: false,
    asrBusy: false,
    resolutionMs: 100,
    zoom: 1,
    threshold: -43,
    autoLabels: [],
    manualLabels: [],
    transcripts: [],
    dismissedAutoKeys: new Set(),
    selection: null,
    playhead: 0,
    playbackBoundary: null,
    playbackMode: "full",
    playbackSelection: null,
    drag: null,
    hover: null,
    labelSerial: 1,
    transcriptSerial: 1,
    undoSnapshot: null,
    drawQueued: false,
    playbackFrame: 0,
    uploadBusy: false,
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatTime(seconds, showMs = true) {
    if (!Number.isFinite(seconds)) return "00:00.000";
    const safe = Math.max(0, seconds);
    const totalMs = Math.round(safe * 1000);
    const hours = Math.floor(totalMs / 3_600_000);
    const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
    const secs = Math.floor((totalMs % 60_000) / 1000);
    const millis = totalMs % 1000;
    const base = `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0",
    )}`;
    const withMs = showMs ? `${base}.${String(millis).padStart(3, "0")}` : base;
    return hours
      ? `${String(hours).padStart(2, "0")}:${withMs}`
      : withMs;
  }

  function formatRulerTime(seconds, step) {
    if (step < 1) return `${i18n.formatNumber(Math.round(seconds * 1000))} ms`;
    if (seconds < 60) {
      return `${i18n.formatNumber(seconds, {
        minimumFractionDigits: seconds % 1 ? 1 : 0,
        maximumFractionDigits: 1,
      })} s`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}:${String(secs).padStart(2, "0")}`;
  }

  function formatSeconds(seconds) {
    if (seconds < 1) {
      return t("units.milliseconds", {
        value: i18n.formatNumber(Math.round(seconds * 1000)),
      });
    }
    const digits = seconds < 10 ? 2 : 1;
    return t("units.seconds", {
      value: i18n.formatNumber(seconds, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }),
    });
  }

  function setIcon(element, iconId) {
    element.innerHTML = `<use href="#${iconId}"></use>`;
  }

  function toast(message, type = "") {
    const node = document.createElement("div");
    node.className = `toast ${type ? `is-${type}` : ""}`;
    node.textContent = message;
    dom.toastRegion.append(node);
    window.setTimeout(() => {
      node.animate(
        [
          { opacity: 1, transform: "translateY(0)" },
          { opacity: 0, transform: "translateY(6px)" },
        ],
        { duration: 180, easing: "ease", fill: "forwards" },
      ).finished.finally(() => node.remove());
    }, 3600);
  }

  function showBusy(title, message) {
    state.busy = true;
    dom.busyTitle.textContent = title;
    dom.busyMessage.textContent = message;
    dom.busyOverlay.hidden = false;
    updateButtons();
  }

  function hideBusy() {
    state.busy = false;
    dom.busyOverlay.hidden = true;
    updateButtons();
  }

  function updateButtons() {
    const hasData = Boolean(state.data);
    const hasSelection = Boolean(state.selection);
    dom.exportBtn.disabled = !hasData || state.busy;
    dom.exportFormat.disabled = !hasData || state.busy;
    dom.deleteSelectionBtn.disabled = !hasSelection || state.busy;
    dom.playSelectionBtn.disabled = !hasSelection || state.busy;
    dom.clearSelectionBtn.disabled = !hasSelection || state.busy;
    dom.resolutionSelect.disabled = !hasData || state.busy;
    dom.zoomOutBtn.disabled = !hasData || state.busy;
    dom.zoomInBtn.disabled = !hasData || state.busy;
    dom.fitBtn.disabled = !hasData || state.busy;
    dom.asrStartBtn.disabled = !hasData || state.busy || state.asrBusy;
    dom.playBtn.disabled = !hasData || state.busy;
    dom.toStartBtn.disabled = !hasData || state.busy;
    dom.languageSelect.disabled = state.busy || state.uploadBusy || state.asrBusy;
    dom.exportBtnLabel.textContent = t(
      hasSelection ? "header.exportSelection" : "header.exportAudio",
    );
    dom.undoBtn.hidden = !state.data?.previous_available;
    dom.undoBtn.disabled = state.busy;
  }

  async function apiError(response) {
    try {
      const payload = await response.json();
      if (Array.isArray(payload.detail)) {
        return payload.detail
          .map((item) => item.msg || String(item))
          .join(t("errors.detailSeparator"));
      }
      return (
        payload.detail ||
        payload.message ||
        t("errors.requestFailed", { status: response.status })
      );
    } catch {
      const text = await response.text().catch(() => "");
      return text || t("errors.requestFailed", { status: response.status });
    }
  }

  function apiFetch(input, init = {}) {
    const headers = new Headers(init.headers || {});
    headers.set("Accept-Language", i18n.getLanguage());
    return fetch(input, { ...init, headers });
  }

  function restoreAsrSettings() {
    try {
      const stored = JSON.parse(localStorage.getItem(ASR_STORAGE_KEY) || "{}");
      if (stored.baseUrl) dom.asrBaseUrl.value = stored.baseUrl;
      if (stored.model) dom.asrModel.value = stored.model;
      if (stored.language) dom.asrLanguage.value = stored.language;
      if (stored.mode) dom.asrMode.value = stored.mode;
      if (stored.chunkSeconds) dom.asrChunkSeconds.value = stored.chunkSeconds;
    } catch {
      // Invalid local preferences are safely ignored.
    }
    updateAsrModeUi();
  }

  function saveAsrSettings() {
    try {
      localStorage.setItem(
        ASR_STORAGE_KEY,
        JSON.stringify({
          baseUrl: dom.asrBaseUrl.value.trim(),
          model: dom.asrModel.value.trim(),
          language: dom.asrLanguage.value,
          mode: dom.asrMode.value,
          chunkSeconds: dom.asrChunkSeconds.value,
        }),
      );
    } catch {
      // Storage may be unavailable in privacy modes; recognition still works.
    }
  }

  function updateAsrModeUi() {
    dom.chunkSecondsField.hidden = dom.asrMode.value !== "segments";
  }

  function populateExportFormats(data) {
    const formats = data.export_formats || ["wav", "mp3", "flac"];
    dom.exportFormat.innerHTML = formats
      .map(
        (format) =>
          `<option value="${escapeHtml(format)}">${escapeHtml(
            FORMAT_NAMES[format] || format.toUpperCase(),
          )}</option>`,
      )
      .join("");
    const preferred =
      data.default_export_format && formats.includes(data.default_export_format)
        ? data.default_export_format
        : "wav";
    dom.exportFormat.value = preferred;
  }

  function applyAudioData(data, options = {}) {
    state.data = data;
    state.resolutionMs = Number(data.resolution_ms) || state.resolutionMs;
    dom.resolutionSelect.value = String(state.resolutionMs);
    dom.totalTime.textContent = formatTime(data.duration);
    dom.factDuration.textContent = formatTime(data.duration);
    dom.factRate.textContent = `${(data.sample_rate / 1000).toFixed(1)} kHz`;
    dom.factChannels.textContent =
      data.channels === 1
        ? t("channels.mono")
        : t("channels.multiple", { count: data.channels });
    dom.headerFileName.textContent = data.name;
    dom.headerFileMeta.textContent = `${(data.source_format || "").toUpperCase()} · ${t(
      "header.defaultExport",
      { format: FORMAT_NAMES[data.default_export_format] || "WAV" },
    )}`;
    document.title = `${data.name} · WaveCraft`;
    populateExportFormats(data);

    if (options.reloadMedia) {
      dom.audioPlayer.pause();
      dom.selectionPlayer.pause();
      dom.selectionPlayer.removeAttribute("src");
      cancelAnimationFrame(state.playbackFrame);
      state.playbackMode = "full";
      state.playbackSelection = null;
      updatePlaybackIcon(false);
      dom.audioPlayer.src = data.media_url;
      dom.audioPlayer.load();
    }

    state.playhead = clamp(state.playhead, 0, data.duration);
    if (state.selection) {
      state.selection = {
        start: clamp(state.selection.start, 0, data.duration),
        end: clamp(state.selection.end, 0, data.duration),
      };
      if (state.selection.end - state.selection.start < MIN_SELECTION_SECONDS) {
        state.selection = null;
      }
    }
    recomputeAutoLabels();
    renderLabels();
    renderTranscripts();
    updateSelectionUi();
    updateTimeUi();
    updateButtons();
    resizeTimeline(options.preserveCenter !== false);
    requestDraw();
  }

  async function uploadFile(file) {
    if (!file || state.uploadBusy) return;
    dom.uploadError.hidden = true;
    dom.uploadError.textContent = "";
    if (file.size > 250 * 1024 * 1024) {
      dom.uploadError.textContent = t("upload.tooLarge");
      dom.uploadError.hidden = false;
      dom.dropZone.focus();
      return;
    }

    state.uploadBusy = true;
    showBusy(t("upload.busyTitle"), t("upload.busyMessage"));
    const form = new FormData();
    form.append("file", file);
    try {
      const response = await apiFetch(
        `/api/audio?resolution_ms=${encodeURIComponent(state.resolutionMs)}`,
        { method: "POST", body: form },
      );
      if (!response.ok) throw new Error(await apiError(response));
      const data = await response.json();

      state.manualLabels = [];
      state.transcripts = [];
      state.autoLabels = [];
      state.dismissedAutoKeys.clear();
      state.selection = null;
      state.playhead = 0;
      state.labelSerial = 1;
      state.transcriptSerial = 1;
      state.undoSnapshot = null;
      state.zoom = 1;
      dom.zoomValue.textContent = "100%";
      dom.uploadStage.hidden = true;
      dom.editor.hidden = false;
      applyAudioData(data, { reloadMedia: true, preserveCenter: false });
      dom.timelineScroller.scrollLeft = 0;
      window.setTimeout(() => {
        resizeTimeline(false);
        requestDraw();
        canvas.focus({ preventScroll: true });
      }, 50);
      toast(t("upload.success"), "success");
    } catch (error) {
      dom.uploadError.textContent =
        error instanceof Error ? error.message : t("upload.failure");
      dom.uploadError.hidden = false;
      dom.dropZone.focus();
    } finally {
      state.uploadBusy = false;
      hideBusy();
      dom.fileInput.value = "";
    }
  }

  function basePixelsPerSecond() {
    return 8 / (state.resolutionMs / 1000);
  }

  function metrics() {
    const width = Math.max(280, dom.timelineScroller.clientWidth);
    const plotWidth = Math.max(180, width - PLOT_LEFT);
    const duration = state.data?.duration || 0;
    const rawWidth = duration * basePixelsPerSecond() * state.zoom;
    const contentWidth = Math.max(plotWidth, rawWidth);
    const pixelsPerSecond = duration ? contentWidth / duration : 1;
    return {
      width,
      plotWidth,
      duration,
      contentWidth,
      pixelsPerSecond,
      scrollLeft: dom.timelineScroller.scrollLeft,
    };
  }

  function resizeTimeline(preserveCenter = true) {
    if (!state.data || dom.editor.hidden) return;
    const old = metrics();
    const centerTime = old.duration
      ? clamp(
          (old.scrollLeft + old.plotWidth / 2) / old.pixelsPerSecond,
          0,
          old.duration,
        )
      : 0;

    const width = Math.max(280, dom.timelineScroller.clientWidth);
    const height = Math.max(250, canvas.clientHeight);
    const next = metrics();
    canvas.style.width = `${width}px`;
    dom.timelineTrack.style.width = `${Math.ceil(next.contentWidth + PLOT_LEFT)}px`;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.max(1, Math.round(width * dpr));
    const pixelHeight = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    if (preserveCenter && centerTime) {
      const maxScroll = Math.max(0, next.contentWidth - next.plotWidth);
      dom.timelineScroller.scrollLeft = clamp(
        centerTime * next.pixelsPerSecond - next.plotWidth / 2,
        0,
        maxScroll,
      );
    }
    requestDraw();
  }

  function requestDraw() {
    if (state.drawQueued) return;
    state.drawQueued = true;
    requestAnimationFrame(() => {
      state.drawQueued = false;
      drawTimeline();
    });
  }

  function chooseTimeStep(pixelsPerSecond, minSpacing) {
    const candidates = [
      0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600,
    ];
    return (
      candidates.find((step) => step * pixelsPerSecond >= minSpacing) ||
      candidates[candidates.length - 1]
    );
  }

  function roundedRectPath(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  function drawTimeline() {
    if (!state.data) return;
    const width = Math.max(280, dom.timelineScroller.clientWidth);
    const height = Math.max(250, canvas.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(width * dpr)) canvas.width = Math.round(width * dpr);
    if (canvas.height !== Math.round(height * dpr)) {
      canvas.height = Math.round(height * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const m = metrics();
    const rulerHeight = 36;
    const labelsTop = 42;
    const waveTop = 94;
    const hasTranscripts = state.transcripts.length > 0;
    const transcriptBandHeight = hasTranscripts ? 82 : 0;
    const waveBottom = Math.max(
      waveTop + 70,
      height - transcriptBandHeight - 18,
    );
    const transcriptTop = waveBottom + 12;
    const dbMin = -60;
    const dbMax = 0;
    const dbToY = (db) =>
      waveBottom -
      ((clamp(db, dbMin, dbMax) - dbMin) / (dbMax - dbMin)) *
        (waveBottom - waveTop);

    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = COLORS.panel;
    ctx.fillRect(0, 0, PLOT_LEFT, height);

    const minorStep = chooseTimeStep(m.pixelsPerSecond, 14);
    const majorStep = chooseTimeStep(m.pixelsPerSecond, 78);
    const visibleStart = m.scrollLeft / m.pixelsPerSecond;
    const visibleEnd =
      (m.scrollLeft + m.plotWidth) / m.pixelsPerSecond;

    ctx.save();
    ctx.beginPath();
    ctx.rect(PLOT_LEFT, 0, m.plotWidth, height);
    ctx.clip();

    const firstTick = Math.floor(visibleStart / minorStep) * minorStep;
    for (let tick = firstTick; tick <= visibleEnd + minorStep; tick += minorStep) {
      if (tick < -1e-8) continue;
      const x = PLOT_LEFT + tick * m.pixelsPerSecond - m.scrollLeft;
      const majorRatio = tick / majorStep;
      const isMajor = Math.abs(majorRatio - Math.round(majorRatio)) < 1e-7;
      ctx.strokeStyle = isMajor ? COLORS.gridStrong : COLORS.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.round(x) + 0.5, isMajor ? rulerHeight : height - 7);
      ctx.lineTo(Math.round(x) + 0.5, isMajor ? height : rulerHeight + 10);
      ctx.stroke();

      if (isMajor) {
        ctx.fillStyle = COLORS.muted;
        ctx.font = '10px "SFMono-Regular", "Cascadia Code", monospace';
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(formatRulerTime(tick, majorStep), x + 5, 17);
        ctx.strokeStyle = "rgba(155, 185, 197, 0.34)";
        ctx.beginPath();
        ctx.moveTo(x + 0.5, rulerHeight - 1);
        ctx.lineTo(x + 0.5, rulerHeight + 8);
        ctx.stroke();
      }
    }

    for (const db of [0, -12, -24, -36, -48, -60]) {
      const y = dbToY(db);
      ctx.strokeStyle = db === 0 ? COLORS.gridStrong : COLORS.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PLOT_LEFT, Math.round(y) + 0.5);
      ctx.lineTo(width, Math.round(y) + 0.5);
      ctx.stroke();
    }

    for (const label of state.autoLabels) {
      const x1 = PLOT_LEFT + label.start * m.pixelsPerSecond - m.scrollLeft;
      const x2 = PLOT_LEFT + label.end * m.pixelsPerSecond - m.scrollLeft;
      if (x2 < PLOT_LEFT || x1 > width) continue;
      ctx.fillStyle = COLORS.amberFill;
      ctx.fillRect(x1, rulerHeight, Math.max(1, x2 - x1), waveBottom - rulerHeight);
    }

    if (state.selection) {
      const x1 =
        PLOT_LEFT + state.selection.start * m.pixelsPerSecond - m.scrollLeft;
      const x2 =
        PLOT_LEFT + state.selection.end * m.pixelsPerSecond - m.scrollLeft;
      if (x2 > PLOT_LEFT && x1 < width) {
        ctx.fillStyle = COLORS.selection;
        ctx.fillRect(x1, rulerHeight, Math.max(1, x2 - x1), waveBottom - rulerHeight);
      }
    }

    const thresholdY = dbToY(state.threshold);
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "rgba(255, 197, 111, 0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PLOT_LEFT, Math.round(thresholdY) + 0.5);
    ctx.lineTo(width, Math.round(thresholdY) + 0.5);
    ctx.stroke();
    ctx.setLineDash([]);

    const binDuration = state.resolutionMs / 1000;
    const barWidth = Math.max(1, binDuration * m.pixelsPerSecond - 1);
    const firstBin = Math.max(
      0,
      Math.floor((m.scrollLeft / m.pixelsPerSecond) / binDuration) - 1,
    );
    const lastBin = Math.min(
      state.data.rms_db.length - 1,
      Math.ceil(((m.scrollLeft + m.plotWidth) / m.pixelsPerSecond) / binDuration) +
        1,
    );
    const centerY = (waveTop + waveBottom) / 2;

    if (Array.isArray(state.data.peak_db)) {
      ctx.beginPath();
      for (let index = firstBin; index <= lastBin; index += 1) {
        const peak = state.data.peak_db[index] ?? -100;
        const x =
          PLOT_LEFT +
          index * binDuration * m.pixelsPerSecond -
          m.scrollLeft +
          Math.max(0.5, barWidth / 2);
        const amplitude =
          ((clamp(peak, dbMin, dbMax) - dbMin) / (dbMax - dbMin)) *
          ((waveBottom - waveTop) / 2 - 1);
        if (amplitude < 0.5) continue;
        ctx.moveTo(x, centerY - amplitude);
        ctx.lineTo(x, centerY + amplitude);
      }
      ctx.strokeStyle = "rgba(190, 239, 227, 0.24)";
      ctx.lineWidth = Math.max(1, Math.min(3, barWidth * 0.42));
      ctx.stroke();
    }

    ctx.beginPath();
    for (let index = firstBin; index <= lastBin; index += 1) {
      const db = state.data.rms_db[index] ?? -100;
      if (db <= state.threshold) continue;
      const x =
        PLOT_LEFT +
        index * binDuration * m.pixelsPerSecond -
        m.scrollLeft;
      const amplitude =
        ((clamp(db, dbMin, dbMax) - dbMin) / (dbMax - dbMin)) *
        ((waveBottom - waveTop) / 2 - 2);
      ctx.rect(x, centerY - amplitude, barWidth, amplitude * 2);
    }
    ctx.fillStyle = COLORS.accent;
    ctx.fill();

    ctx.beginPath();
    for (let index = firstBin; index <= lastBin; index += 1) {
      const db = state.data.rms_db[index] ?? -100;
      if (db > state.threshold) continue;
      const x =
        PLOT_LEFT +
        index * binDuration * m.pixelsPerSecond -
        m.scrollLeft;
      const amplitude =
        ((clamp(db, dbMin, dbMax) - dbMin) / (dbMax - dbMin)) *
        ((waveBottom - waveTop) / 2 - 2);
      ctx.rect(x, centerY - amplitude, barWidth, amplitude * 2);
    }
    ctx.fillStyle = "rgba(255, 197, 111, 0.82)";
    ctx.fill();

    ctx.strokeStyle = "rgba(186, 218, 218, 0.16)";
    ctx.beginPath();
    ctx.moveTo(PLOT_LEFT, Math.round(centerY) + 0.5);
    ctx.lineTo(width, Math.round(centerY) + 0.5);
    ctx.stroke();

    if (state.selection) {
      const x1 =
        PLOT_LEFT + state.selection.start * m.pixelsPerSecond - m.scrollLeft;
      const x2 =
        PLOT_LEFT + state.selection.end * m.pixelsPerSecond - m.scrollLeft;
      ctx.strokeStyle = COLORS.selectionEdge;
      ctx.lineWidth = 2;
      for (const x of [x1, x2]) {
        if (x < PLOT_LEFT - 1 || x > width + 1) continue;
        ctx.beginPath();
        ctx.moveTo(Math.round(x) + 0.5, rulerHeight);
        ctx.lineTo(Math.round(x) + 0.5, waveBottom);
        ctx.stroke();
        ctx.fillStyle = COLORS.selectionEdge;
        ctx.fillRect(x - 2, rulerHeight + 4, 4, 13);
      }
    }

    if (hasTranscripts) {
      ctx.fillStyle = "#0c141b";
      ctx.fillRect(PLOT_LEFT, transcriptTop - 4, m.plotWidth, height - transcriptTop + 2);
      ctx.strokeStyle = COLORS.gridStrong;
      ctx.beginPath();
      ctx.moveTo(PLOT_LEFT, transcriptTop - 5.5);
      ctx.lineTo(width, transcriptTop - 5.5);
      ctx.stroke();
      ctx.fillStyle = COLORS.muted;
      ctx.font = '9px "SFMono-Regular", "Cascadia Code", monospace';
      ctx.textAlign = "left";
      ctx.fillText(t("timeline.transcriptShort"), 8, transcriptTop + 8);

      state.transcripts.forEach((transcript, index) => {
        const x1 =
          PLOT_LEFT + transcript.start * m.pixelsPerSecond - m.scrollLeft;
        const x2 =
          PLOT_LEFT + transcript.end * m.pixelsPerSecond - m.scrollLeft;
        if (x2 < PLOT_LEFT || x1 > width) return;
        const left = Math.max(PLOT_LEFT + 1, x1);
        const right = Math.min(width - 1, x2);
        const blockWidth = Math.max(1, right - left);
        const active = state.hover?.kind === "transcript" && state.hover.index === index;
        ctx.fillStyle = active
          ? "rgba(87, 227, 189, 0.11)"
          : index % 2
            ? "rgba(255, 255, 255, 0.018)"
            : "rgba(87, 227, 189, 0.035)";
        ctx.fillRect(left, transcriptTop, blockWidth, height - transcriptTop - 9);
        if (x1 >= PLOT_LEFT) {
          ctx.strokeStyle = active
            ? "rgba(87, 227, 189, 0.72)"
            : "rgba(126, 158, 172, 0.24)";
          ctx.beginPath();
          ctx.moveTo(Math.round(x1) + 0.5, transcriptTop);
          ctx.lineTo(Math.round(x1) + 0.5, height - 9);
          ctx.stroke();
        }
        if (right - left < 25) return;
        ctx.save();
        ctx.beginPath();
        ctx.rect(left + 5, transcriptTop, blockWidth - 10, height - transcriptTop - 9);
        ctx.clip();
        ctx.fillStyle = COLORS.muted;
        ctx.font = '8px "SFMono-Regular", "Cascadia Code", monospace';
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(formatTime(transcript.start), left + 9, transcriptTop + 15);
        ctx.fillStyle = transcript.text ? COLORS.text : COLORS.faint;
        ctx.font = '11px Inter, "PingFang SC", "Microsoft YaHei", sans-serif';
        const preview = transcript.text || t("transcript.unknown");
        ctx.fillText(preview, left + 9, transcriptTop + 35);
        ctx.restore();
      });
    }

    const visibleLabels = [...state.autoLabels, ...state.manualLabels].sort(
      (a, b) => a.start - b.start || (a.type === "manual" ? -1 : 1),
    );
    const laneEnds = [-Infinity, -Infinity];
    for (const label of visibleLabels) {
      const x = PLOT_LEFT + label.start * m.pixelsPerSecond - m.scrollLeft;
      if (x < PLOT_LEFT - 150 || x > width + 8) continue;
      ctx.font = '9px Inter, "PingFang SC", "Microsoft YaHei", sans-serif';
      const text = labelTitle(label);
      const textWidth = Math.min(132, ctx.measureText(text).width);
      const pillWidth = textWidth + 18;
      let lane = laneEnds.findIndex((end) => x > end + 5);
      if (lane === -1) continue;
      laneEnds[lane] = x + pillWidth;
      const y = labelsTop + lane * 23;
      ctx.strokeStyle =
        label.type === "auto"
          ? "rgba(255, 197, 111, 0.28)"
          : "rgba(87, 227, 189, 0.28)";
      ctx.beginPath();
      ctx.moveTo(Math.round(x) + 0.5, y + 18);
      ctx.lineTo(Math.round(x) + 0.5, waveTop - 2);
      ctx.stroke();
      roundedRectPath(ctx, x, y, pillWidth, 18, 5);
      ctx.fillStyle =
        label.type === "auto"
          ? "rgba(58, 43, 23, 0.94)"
          : "rgba(10, 45, 41, 0.94)";
      ctx.fill();
      ctx.strokeStyle =
        label.type === "auto"
          ? "rgba(255, 197, 111, 0.35)"
          : "rgba(87, 227, 189, 0.35)";
      ctx.stroke();
      ctx.fillStyle = label.type === "auto" ? COLORS.amber : COLORS.accent;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(text, x + 9, y + 9.5, textWidth);
    }

    const playheadX =
      PLOT_LEFT + state.playhead * m.pixelsPerSecond - m.scrollLeft;
    if (playheadX >= PLOT_LEFT - 1 && playheadX <= width + 1) {
      ctx.strokeStyle = COLORS.playhead;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(Math.round(playheadX) + 0.5, rulerHeight);
      ctx.lineTo(Math.round(playheadX) + 0.5, hasTranscripts ? height - 10 : waveBottom);
      ctx.stroke();
      ctx.fillStyle = COLORS.playhead;
      ctx.beginPath();
      ctx.moveTo(playheadX - 4, rulerHeight);
      ctx.lineTo(playheadX + 4, rulerHeight);
      ctx.lineTo(playheadX, rulerHeight + 6);
      ctx.closePath();
      ctx.fill();
    }

    if (state.hover) {
      const hoverX = clamp(state.hover.x, PLOT_LEFT + 2, width - 2);
      if (state.hover.kind === "transcript") {
        drawTranscriptTooltip(
          state.transcripts[state.hover.index],
          hoverX,
          Math.min(transcriptTop + 20, height - 100),
          width,
        );
      } else if (state.hover.y >= rulerHeight && state.hover.y < waveBottom) {
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = "rgba(219, 242, 237, 0.34)";
        ctx.beginPath();
        ctx.moveTo(Math.round(hoverX) + 0.5, rulerHeight);
        ctx.lineTo(Math.round(hoverX) + 0.5, waveBottom);
        ctx.stroke();
        ctx.setLineDash([]);
        const db = dbAtTime(state.hover.time);
        const peakDb = peakAtTime(state.hover.time);
        drawSimpleTooltip(
          `${formatTime(state.hover.time)}  ·  RMS ${i18n.formatNumber(db, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}  ·  ${t("timeline.peak")} ${i18n.formatNumber(peakDb, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })} dBFS`,
          hoverX,
          clamp(state.hover.y - 48, rulerHeight + 8, waveBottom - 42),
          width,
        );
      }
    }
    ctx.restore();

    ctx.fillStyle = COLORS.muted;
    ctx.font = '9px "SFMono-Regular", "Cascadia Code", monospace';
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (const db of [0, -12, -24, -36, -48, -60]) {
      ctx.fillText(`${db}`, PLOT_LEFT - 8, dbToY(db));
    }

    ctx.strokeStyle = "rgba(126, 158, 172, 0.18)";
    ctx.beginPath();
    ctx.moveTo(PLOT_LEFT - 0.5, 0);
    ctx.lineTo(PLOT_LEFT - 0.5, height);
    ctx.stroke();
  }

  function drawSimpleTooltip(text, x, y, width) {
    ctx.font = '10px Inter, "PingFang SC", sans-serif';
    const boxWidth = ctx.measureText(text).width + 18;
    const left = clamp(x + 10, PLOT_LEFT + 4, width - boxWidth - 8);
    roundedRectPath(ctx, left, y, boxWidth, 29, 7);
    ctx.fillStyle = "rgba(22, 33, 44, 0.97)";
    ctx.fill();
    ctx.strokeStyle = "rgba(134, 167, 179, 0.35)";
    ctx.stroke();
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, left + 9, y + 14.5);
  }

  function drawTranscriptTooltip(transcript, x, y, width) {
    if (!transcript) return;
    const maxWidth = Math.min(310, width - PLOT_LEFT - 22);
    ctx.font = '11px Inter, "PingFang SC", "Microsoft YaHei", sans-serif';
    const lines = wrapCanvasText(
      transcript.text || t("transcript.unknown"),
      maxWidth - 20,
      4,
    );
    const header = `${formatTime(transcript.start)} – ${formatTime(transcript.end)}`;
    const boxHeight = 25 + lines.length * 17;
    const left = clamp(x + 10, PLOT_LEFT + 4, width - maxWidth - 8);
    const top = clamp(y, 40, canvas.clientHeight - boxHeight - 8);
    roundedRectPath(ctx, left, top, maxWidth, boxHeight, 9);
    ctx.fillStyle = "rgba(18, 29, 38, 0.98)";
    ctx.fill();
    ctx.strokeStyle = "rgba(87, 227, 189, 0.38)";
    ctx.stroke();
    ctx.fillStyle = COLORS.accent;
    ctx.font = '9px "SFMono-Regular", "Cascadia Code", monospace';
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(header, left + 10, top + 16);
    ctx.fillStyle = COLORS.text;
    ctx.font = '11px Inter, "PingFang SC", "Microsoft YaHei", sans-serif';
    lines.forEach((line, index) => {
      ctx.fillText(line, left + 10, top + 34 + index * 17);
    });
  }

  function wrapCanvasText(text, maxWidth, maxLines) {
    const chars = Array.from(text);
    const lines = [];
    let current = "";
    for (const char of chars) {
      const next = current + char;
      if (ctx.measureText(next).width > maxWidth && current) {
        lines.push(current);
        current = char;
        if (lines.length === maxLines) break;
      } else {
        current = next;
      }
    }
    if (lines.length < maxLines && current) lines.push(current);
    if (lines.length === maxLines) {
      const joined = lines.join("");
      if (joined.length < chars.length) {
        let last = lines[maxLines - 1];
        while (last && ctx.measureText(`${last}…`).width > maxWidth) {
          last = last.slice(0, -1);
        }
        lines[maxLines - 1] = `${last}…`;
      }
    }
    return lines.length ? lines : [""];
  }

  function dbAtTime(time) {
    if (!state.data) return -100;
    const index = Math.floor(time / (state.resolutionMs / 1000));
    return state.data.rms_db[
      clamp(index, 0, Math.max(0, state.data.rms_db.length - 1))
    ] ?? -100;
  }

  function peakAtTime(time) {
    if (!state.data?.peak_db?.length) return dbAtTime(time);
    const index = Math.floor(time / (state.resolutionMs / 1000));
    return state.data.peak_db[
      clamp(index, 0, Math.max(0, state.data.peak_db.length - 1))
    ] ?? -100;
  }

  function timeAtCanvasX(canvasX) {
    const m = metrics();
    if (!m.duration) return 0;
    return clamp(
      (m.scrollLeft + canvasX - PLOT_LEFT) / m.pixelsPerSecond,
      0,
      m.duration,
    );
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: clamp(event.clientX - rect.left, 0, rect.width),
      y: clamp(event.clientY - rect.top, 0, rect.height),
    };
  }

  function labelKey(label) {
    return `auto:${label.start.toFixed(3)}:${label.end.toFixed(3)}`;
  }

  function labelTitle(label) {
    return label.type === "auto"
      ? t("labels.lowLevel")
      : t("labels.manual", { number: label.serial || 1 });
  }

  function recomputeAutoLabels() {
    state.autoLabels = [];
    if (!state.data || !dom.autoLabelToggle.checked) return;
    const binDuration = state.resolutionMs / 1000;
    const minimumDuration = Math.max(binDuration * 2, 0.12);
    let runStart = null;
    let sum = 0;
    let count = 0;
    const finishRun = (endIndex) => {
      if (runStart === null) return;
      const start = runStart * binDuration;
      const end = Math.min(state.data.duration, endIndex * binDuration);
      if (end - start >= minimumDuration) {
        const label = {
          id: `auto-${start.toFixed(3)}-${end.toFixed(3)}`,
          type: "auto",
          start,
          end,
          db: count ? sum / count : -100,
        };
        if (!state.dismissedAutoKeys.has(labelKey(label))) {
          state.autoLabels.push(label);
        }
      }
      runStart = null;
      sum = 0;
      count = 0;
    };

    state.data.rms_db.forEach((db, index) => {
      if (db <= state.threshold) {
        if (runStart === null) runStart = index;
        sum += db;
        count += 1;
      } else {
        finishRun(index);
      }
    });
    finishRun(state.data.rms_db.length);
  }

  function allLabels() {
    return [...state.autoLabels, ...state.manualLabels].sort(
      (a, b) => a.start - b.start || a.type.localeCompare(b.type),
    );
  }

  function renderLabels() {
    recomputeAutoLabels();
    const labels = allLabels();
    dom.labelCount.textContent = String(labels.length);
    if (!labels.length) {
      dom.labelList.innerHTML = state.autoLabelToggle.checked
        ? `<p class="empty-list">${escapeHtml(t("labels.emptyThreshold"))}</p>`
        : `<p class="empty-list">${escapeHtml(t("labels.emptyDisabled"))}</p>`;
      requestDraw();
      return;
    }

    dom.labelList.innerHTML = labels
      .map((label) => {
        const title = labelTitle(label);
        const timeLabel =
          label.type === "auto"
            ? `${formatTime(label.start)} – ${formatTime(label.end)}`
            : formatTime(label.start);
        return `
          <article class="label-item" data-label-id="${escapeHtml(label.id)}">
            <button class="label-jump" type="button" data-label-jump="${escapeHtml(label.id)}">
              <span class="label-title-line">
                <i class="type-dot ${label.type}"></i>
                <strong>${escapeHtml(title)}</strong>
              </span>
              <span class="label-time">${timeLabel}</span>
            </button>
            <button class="delete-item" type="button" data-label-delete="${escapeHtml(
              label.id,
            )}" aria-label="${escapeHtml(
              t("labels.deleteAria", { title }),
            )}" title="${escapeHtml(t("labels.deleteTitle"))}">
              <svg aria-hidden="true"><use href="#icon-trash"></use></svg>
            </button>
          </article>`;
      })
      .join("");
    requestDraw();
  }

  function addManualLabel(time = state.playhead) {
    if (!state.data) return;
    const at = clamp(time, 0, state.data.duration);
    if (
      state.manualLabels.some(
        (label) => Math.abs(label.start - at) < state.resolutionMs / 1000 / 2,
      )
    ) {
      toast(t("labels.alreadyExists"));
      return;
    }
    state.manualLabels.push({
      id: `manual-${Date.now()}-${state.labelSerial}`,
      type: "manual",
      serial: state.labelSerial,
      start: at,
      end: at,
    });
    state.labelSerial += 1;
    renderLabels();
    toast(t("labels.added", { time: formatTime(at) }), "success");
  }

  function deleteLabel(labelId) {
    const auto = state.autoLabels.find((label) => label.id === labelId);
    if (auto) {
      state.dismissedAutoKeys.add(labelKey(auto));
      state.autoLabels = state.autoLabels.filter((label) => label.id !== labelId);
    } else {
      state.manualLabels = state.manualLabels.filter((label) => label.id !== labelId);
    }
    renderLabels();
    toast(t("labels.deleted"));
  }

  function renderTranscripts() {
    const transcripts = [...state.transcripts].sort((a, b) => a.start - b.start);
    dom.transcriptCount.textContent = String(transcripts.length);
    dom.transcriptSection.hidden = transcripts.length === 0;
    if (!transcripts.length) {
      dom.transcriptList.innerHTML = "";
      requestDraw();
      return;
    }
    dom.transcriptList.innerHTML = transcripts
      .map((transcript) => {
        const text = transcript.text || t("transcript.unknown");
        return `
          <article class="transcript-item" data-transcript-id="${escapeHtml(
            transcript.id,
          )}">
            <button class="transcript-jump" type="button" data-transcript-jump="${escapeHtml(
              transcript.id,
            )}">
              <span class="transcript-title-line">
                <strong>${formatTime(transcript.start)} – ${formatTime(
                  transcript.end,
                )}</strong>
              </span>
              <span class="transcript-preview">${escapeHtml(text)}</span>
            </button>
            <button class="delete-item" type="button" data-transcript-delete="${escapeHtml(
              transcript.id,
            )}" aria-label="${escapeHtml(
              t("transcript.deleteAria"),
            )}" title="${escapeHtml(t("transcript.deleteAria"))}">
              <svg aria-hidden="true"><use href="#icon-trash"></use></svg>
            </button>
          </article>`;
      })
      .join("");
    requestDraw();
  }

  function updateSelectionUi() {
    const hasSelection = Boolean(state.selection);
    dom.selectionEmpty.hidden = hasSelection;
    dom.selectionDetails.hidden = !hasSelection;
    if (hasSelection) {
      const { start, end } = state.selection;
      dom.selectionStart.textContent = formatTime(start);
      dom.selectionEnd.textContent = formatTime(end);
      dom.selectionDuration.textContent = formatSeconds(end - start);
    }
    updateButtons();
  }

  function setSelection(start, end, redraw = true) {
    if (!state.data) return;
    const duration = state.data.duration;
    const a = clamp(Math.min(start, end), 0, duration);
    const b = clamp(Math.max(start, end), 0, duration);
    if (b - a < MIN_SELECTION_SECONDS) {
      state.selection = null;
    } else {
      state.selection = { start: a, end: b };
    }
    updateSelectionUi();
    if (redraw) requestDraw();
  }

  function clearSelection() {
    if (!dom.selectionPlayer.paused || state.playbackMode === "selection") {
      pausePlayback();
    }
    state.selection = null;
    state.playbackBoundary = null;
    updateSelectionUi();
    requestDraw();
  }

  function updateTimeUi() {
    dom.currentTime.textContent = formatTime(state.playhead);
    if (state.data) dom.totalTime.textContent = formatTime(state.data.duration);
  }

  function seekTo(time, options = {}) {
    if (!state.data) return;
    if (!dom.selectionPlayer.paused || state.playbackMode === "selection") {
      dom.selectionPlayer.pause();
      state.playbackMode = "full";
      state.playbackSelection = null;
      updatePlaybackIcon(false);
    }
    const previous = state.playhead;
    state.playhead = clamp(time, 0, state.data.duration);
    if (
      Math.abs(dom.audioPlayer.currentTime - state.playhead) > 0.025 ||
      options.forceAudio
    ) {
      try {
        dom.audioPlayer.currentTime = state.playhead;
      } catch {
        // Metadata may not be available yet.
      }
    }
    if (state.selection) state.playbackBoundary = state.selection.end;
    updateTimeUi();
    requestDraw();
    if (previous !== state.playhead) ensureTimeVisible(state.playhead);
  }

  function ensureTimeVisible(time) {
    if (!state.data) return;
    const m = metrics();
    const x = time * m.pixelsPerSecond;
    if (x < dom.timelineScroller.scrollLeft + 20) {
      dom.timelineScroller.scrollLeft = Math.max(0, x - 40);
    } else if (
      x >
      dom.timelineScroller.scrollLeft + m.plotWidth - 20
    ) {
      dom.timelineScroller.scrollLeft =
        x - m.plotWidth + 40;
    }
  }

  function isEditable(target) {
    return (
      target instanceof HTMLElement &&
      (target.matches("input, textarea, select, button, a") ||
        target.isContentEditable)
    );
  }

  function isPlaybackActive() {
    return !dom.audioPlayer.paused || !dom.selectionPlayer.paused;
  }

  function pausePlayback() {
    dom.audioPlayer.pause();
    dom.selectionPlayer.pause();
    cancelAnimationFrame(state.playbackFrame);
    state.playbackMode = "full";
    state.playbackSelection = null;
    updatePlaybackIcon(false);
    requestDraw();
  }

  async function togglePlayback() {
    if (!state.data || state.busy) return;
    if (isPlaybackActive()) {
      pausePlayback();
      return;
    }
    if (state.selection) {
      await playSelection();
      return;
    }
    await playFullAudio();
  }

  async function playFullAudio() {
    if (!state.data) return;
    dom.selectionPlayer.pause();
    state.playbackMode = "full";
    state.playbackSelection = null;
    let start = state.playhead;
    if (!state.selection && start >= state.data.duration - 0.01) start = 0;
    state.playhead = start;
    state.playbackBoundary = state.data.duration;
    try {
      dom.audioPlayer.currentTime = start;
      await dom.audioPlayer.play();
      updateTimeUi();
      startPlaybackFrame();
    } catch (error) {
      toast(
        error instanceof Error
          ? t("playback.error", { message: error.message })
          : t("playback.errorFallback"),
        "error",
      );
    }
  }

  async function playSelection() {
    if (!state.selection || !state.data) return;
    const target = { ...state.selection };
    dom.audioPlayer.pause();
    state.playhead = target.start;
    state.playbackBoundary = target.end;
    state.playbackSelection = target;
    state.playbackMode = "selection";
    updateTimeUi();
    requestDraw();
    try {
      const params = new URLSearchParams({
        start: String(target.start),
        end: String(target.end),
        v: String(state.data.revision),
      });
      const source = `/api/audio/${encodeURIComponent(
        state.data.id,
      )}/selection-preview?${params}`;
      dom.selectionPlayer.src = source;
      dom.selectionPlayer.load();
      await new Promise((resolve, reject) => {
        const onReady = () => {
          cleanup();
          resolve();
        };
        const onError = () => {
          cleanup();
          reject(new Error(t("selection.loadFailed")));
        };
        const cleanup = () => {
          dom.selectionPlayer.removeEventListener("loadedmetadata", onReady);
          dom.selectionPlayer.removeEventListener("error", onError);
        };
        dom.selectionPlayer.addEventListener("loadedmetadata", onReady, {
          once: true,
        });
        dom.selectionPlayer.addEventListener("error", onError, { once: true });
        if (dom.selectionPlayer.readyState >= 1) onReady();
      });
      if (
        !state.selection ||
        state.selection.start !== target.start ||
        state.selection.end !== target.end
      ) {
        throw new Error(t("selection.changed"));
      }
      await dom.selectionPlayer.play();
      state.playbackMode = "selection";
      startPlaybackFrame();
    } catch (error) {
      state.playbackMode = "full";
      state.playbackSelection = null;
      toast(
        error instanceof Error
          ? t("selection.playError", { message: error.message })
          : t("selection.playErrorFallback"),
        "error",
      );
    }
  }

  function startPlaybackFrame() {
    cancelAnimationFrame(state.playbackFrame);
    const tick = () => {
      if (!state.data) return;
      const preview = state.playbackMode === "selection";
      const player = preview ? dom.selectionPlayer : dom.audioPlayer;
      if (player.paused) return;
      if (preview && state.playbackSelection) {
        const range = state.playbackSelection;
        const localTime = clamp(
          player.currentTime,
          0,
          Math.max(0, range.end - range.start),
        );
        state.playhead = clamp(range.start + localTime, range.start, range.end);
      } else {
        state.playhead = clamp(player.currentTime, 0, state.data.duration);
      }
      updateTimeUi();
      requestDraw();
      state.playbackFrame = requestAnimationFrame(tick);
    };
    state.playbackFrame = requestAnimationFrame(tick);
  }

  function updatePlaybackIcon(isPlaying) {
    setIcon(dom.playIcon, isPlaying ? "icon-pause" : "icon-play");
    dom.playBtn.setAttribute(
      "aria-label",
      t(isPlaying ? "transport.pause" : "transport.play"),
    );
  }

  function zoomBy(factor) {
    if (!state.data) return;
    const m = metrics();
    const centerTime = clamp(
      (m.scrollLeft + m.plotWidth / 2) / m.pixelsPerSecond,
      0,
      m.duration,
    );
    state.zoom = clamp(state.zoom * factor, 0.5, 8);
    dom.zoomValue.textContent = `${Math.round(state.zoom * 100)}%`;
    resizeTimeline(false);
    const next = metrics();
    dom.timelineScroller.scrollLeft = clamp(
      centerTime * next.pixelsPerSecond - next.plotWidth / 2,
      0,
      Math.max(0, next.contentWidth - next.plotWidth),
    );
    requestDraw();
  }

  function fitTimeline() {
    if (!state.data) return;
    const plotWidth = Math.max(180, dom.timelineScroller.clientWidth - PLOT_LEFT);
    const baseWidth = state.data.duration * basePixelsPerSecond();
    state.zoom = clamp(baseWidth ? plotWidth / baseWidth : 1, 0.5, 8);
    dom.zoomValue.textContent = `${Math.round(state.zoom * 100)}%`;
    dom.timelineScroller.scrollLeft = 0;
    resizeTimeline(false);
  }

  function updateHover(event) {
    if (!state.data) return;
    const point = canvasPoint(event);
    const time = timeAtCanvasX(point.x);
    const hasTranscripts = state.transcripts.length > 0;
    const m = metrics();
    const waveBottom = Math.max(
      164,
      canvas.clientHeight - (hasTranscripts ? 100 : 18),
    );
    const transcriptTop = waveBottom + 12;
    let kind = "wave";
    let index = -1;
    if (hasTranscripts && point.y >= transcriptTop) {
      kind = "transcript";
      index = state.transcripts.findIndex(
        (transcript) => time >= transcript.start && time <= transcript.end,
      );
      if (index === -1) kind = "none";
    }
    state.hover = { ...point, time, kind, index };
    requestDraw();
  }

  function beginPointer(event) {
    if (!state.data || state.busy || event.button !== 0) return;
    if (isPlaybackActive()) pausePlayback();
    const point = canvasPoint(event);
    if (point.x < PLOT_LEFT) return;
    const time = timeAtCanvasX(point.x);
    canvas.setPointerCapture(event.pointerId);
    canvas.focus({ preventScroll: true });

    if (state.selection) {
      const startX =
        PLOT_LEFT +
        state.selection.start * metrics().pixelsPerSecond -
        dom.timelineScroller.scrollLeft;
      const endX =
        PLOT_LEFT +
        state.selection.end * metrics().pixelsPerSecond -
        dom.timelineScroller.scrollLeft;
      if (Math.abs(point.x - startX) <= 10) {
        state.drag = { mode: "resize-start", start: point.x, anchor: state.selection.end };
        canvas.style.cursor = "ew-resize";
        return;
      }
      if (Math.abs(point.x - endX) <= 10) {
        state.drag = { mode: "resize-end", start: point.x, anchor: state.selection.start };
        canvas.style.cursor = "ew-resize";
        return;
      }
      if (time >= state.selection.start && time <= state.selection.end) {
        state.drag = { mode: "scrub", start: point.x };
        seekTo(time, { forceAudio: true });
        return;
      }
    }

    state.drag = { mode: "select", start: point.x, anchor: time };
    state.playhead = time;
    state.selection = null;
    updateSelectionUi();
    updateTimeUi();
    requestDraw();
  }

  function movePointer(event) {
    if (!state.data) return;
    const point = canvasPoint(event);
    const time = timeAtCanvasX(point.x);
    if (!state.drag) {
      updateHover(event);
      return;
    }
    if (state.drag.mode === "resize-start") {
      setSelection(time, state.drag.anchor);
    } else if (state.drag.mode === "resize-end") {
      setSelection(state.drag.anchor, time);
    } else if (state.drag.mode === "select") {
      const moved = Math.abs(point.x - state.drag.start);
      if (moved >= 3) setSelection(state.drag.anchor, time);
      state.playhead = time;
      updateTimeUi();
    } else if (state.drag.mode === "scrub") {
      seekTo(time);
    }
    state.hover = { ...point, time, kind: "wave", index: -1 };
    requestDraw();
  }

  function endPointer(event) {
    if (!state.drag) return;
    const mode = state.drag.mode;
    state.drag = null;
    canvas.style.cursor = "crosshair";
    try {
      canvas.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released by the browser.
    }
    if (mode === "select" && !state.selection) {
      seekTo(state.playhead);
    } else if (state.selection) {
      state.playhead = clamp(
        state.playhead,
        state.selection.start,
        state.selection.end,
      );
      dom.audioPlayer.currentTime = state.playhead;
      state.playbackBoundary = state.selection.end;
      updateTimeUi();
      updateSelectionUi();
    }
    requestDraw();
  }

  function handleCanvasKeydown(event) {
    if (!state.data) return;
    const step = state.resolutionMs / 1000;
    let next = state.playhead;
    if (event.key === "ArrowLeft") next -= step;
    else if (event.key === "ArrowRight") next += step;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = state.data.duration;
    else if (event.key === "Escape") {
      event.preventDefault();
      clearSelection();
      return;
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      togglePlayback();
      return;
    } else {
      return;
    }
    event.preventDefault();
    next = clamp(next, 0, state.data.duration);
    if (event.shiftKey) {
      const anchor = state.selection
        ? state.selection.start === state.playhead
          ? state.selection.end
          : state.selection.start
        : state.playhead;
      setSelection(anchor, next);
    } else if (state.selection) {
      state.selection = null;
      updateSelectionUi();
    }
    seekTo(next, { forceAudio: true });
  }

  function shiftCollectionsAfterDelete(start, end) {
    const delta = end - start;
    state.manualLabels = state.manualLabels.flatMap((label) => {
      if (label.start < start) return [label];
      if (label.start < end) return [];
      return [{ ...label, start: Math.max(0, label.start - delta) }];
    });
    state.transcripts = state.transcripts.flatMap((transcript) => {
      if (transcript.end <= start) return [transcript];
      if (transcript.start >= end) {
        return [
          {
            ...transcript,
            start: Math.max(0, transcript.start - delta),
            end: Math.max(0, transcript.end - delta),
          },
        ];
      }
      if (transcript.start < start && transcript.end > end) {
        return [{ ...transcript, end: transcript.end - delta }];
      }
      if (transcript.start < start && transcript.end > start) {
        return [{ ...transcript, end: start }];
      }
      if (transcript.start < end && transcript.end > end) {
        return [
          {
            ...transcript,
            start,
            end: transcript.end - delta,
          },
        ];
      }
      return [];
    });
  }

  async function deleteSelection() {
    if (!state.selection || !state.data || state.busy) return;
    const { start, end } = state.selection;
    showBusy(t("delete.busyTitle"), t("delete.busyMessage"));
    try {
      const response = await apiFetch(
        `/api/audio/${encodeURIComponent(
          state.data.id,
        )}/delete?resolution_ms=${encodeURIComponent(state.resolutionMs)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ start, end }),
        },
      );
      if (!response.ok) throw new Error(await apiError(response));
      const data = await response.json();
      const snapshot = {
        manualLabels: state.manualLabels.map((label) => ({ ...label })),
        transcripts: state.transcripts.map((transcript) => ({ ...transcript })),
      };

      pausePlayback();
      state.selection = null;
      state.playhead = Math.min(start, data.duration);
      state.playbackBoundary = null;
      shiftCollectionsAfterDelete(start, end);
      state.dismissedAutoKeys.clear();
      state.undoSnapshot = snapshot;
      applyAudioData(data, { reloadMedia: true, preserveCenter: false });
      ensureTimeVisible(state.playhead);
      toast(t("delete.success"), "success");
    } catch (error) {
      toast(
        error instanceof Error ? error.message : t("delete.failure"),
        "error",
      );
    } finally {
      hideBusy();
    }
  }

  async function undoDelete() {
    if (!state.data?.previous_available || state.busy) return;
    pausePlayback();
    showBusy(t("undo.busyTitle"), t("undo.busyMessage"));
    try {
      const response = await apiFetch(
        `/api/audio/${encodeURIComponent(
          state.data.id,
        )}/undo?resolution_ms=${encodeURIComponent(state.resolutionMs)}`,
        { method: "POST" },
      );
      if (!response.ok) throw new Error(await apiError(response));
      const data = await response.json();
      if (state.undoSnapshot) {
        state.manualLabels = state.undoSnapshot.manualLabels.map((label) => ({
          ...label,
        }));
        state.transcripts = state.undoSnapshot.transcripts.map((transcript) => ({
          ...transcript,
        }));
      }
      state.undoSnapshot = null;
      state.selection = null;
      state.playhead = clamp(state.playhead, 0, data.duration);
      applyAudioData(data, { reloadMedia: true, preserveCenter: true });
      toast(t("undo.success"), "success");
    } catch (error) {
      toast(
        error instanceof Error ? error.message : t("undo.failure"),
        "error",
      );
    } finally {
      hideBusy();
    }
  }

  async function exportAudio() {
    if (!state.data || state.busy) return;
    const format = dom.exportFormat.value || state.data.default_export_format;
    const formatName = FORMAT_NAMES[format] || format;
    const scope = t(
      state.selection ? "export.scopeSelection" : "export.scopeFull",
    );
    showBusy(
      t("export.busyTitle", { format: formatName }),
      t("export.busyMessage", { scope }),
    );
    try {
      const params = new URLSearchParams({ format });
      if (state.selection) {
        params.set("start", String(state.selection.start));
        params.set("end", String(state.selection.end));
      }
      const response = await apiFetch(
        `/api/audio/${encodeURIComponent(state.data.id)}/export?${params}`,
      );
      if (!response.ok) throw new Error(await apiError(response));
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") || "";
      let filename = `${state.data.name.replace(/\.[^.]+$/, "")}-export.${format}`;
      const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i);
      if (encoded) {
        try {
          filename = decodeURIComponent(encoded[1]);
        } catch {
          // Fall back to the locally generated file name.
        }
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast(t("export.success", { scope, format: formatName }), "success");
    } catch (error) {
      toast(
        error instanceof Error ? error.message : t("export.failure"),
        "error",
      );
    } finally {
      hideBusy();
    }
  }

  async function changeResolution() {
    if (!state.data || state.busy) return;
    const resolution = Number(dom.resolutionSelect.value);
    showBusy(
      t("analysis.busyTitle"),
      t("analysis.busyMessage", { resolution }),
    );
    try {
      const response = await apiFetch(
        `/api/audio/${encodeURIComponent(
          state.data.id,
        )}/analysis?resolution_ms=${resolution}`,
      );
      if (!response.ok) throw new Error(await apiError(response));
      const data = await response.json();
      state.resolutionMs = resolution;
      state.dismissedAutoKeys.clear();
      applyAudioData(data, { reloadMedia: false, preserveCenter: true });
      toast(t("analysis.success", { resolution }));
    } catch (error) {
      dom.resolutionSelect.value = String(state.resolutionMs);
      toast(
        error instanceof Error ? error.message : t("analysis.failure"),
        "error",
      );
    } finally {
      hideBusy();
    }
  }

  async function runAsr() {
    if (!state.data || state.asrBusy || state.busy) return;
    const baseUrl = dom.asrBaseUrl.value.trim();
    const model = dom.asrModel.value.trim();
    if (!baseUrl) {
      setAsrStatus(t("asr.baseRequired"), "error");
      dom.asrBaseUrl.focus();
      return;
    }
    if (!model) {
      setAsrStatus(t("asr.modelRequired"), "error");
      dom.asrModel.focus();
      return;
    }

    saveAsrSettings();
    const duration = state.data.duration;
    const mode = dom.asrMode.value;
    const chunkSeconds = Number(dom.asrChunkSeconds.value);
    const chunkCount =
      mode === "segments" ? Math.max(1, Math.ceil(duration / chunkSeconds)) : 1;
    const startRevision = state.data.revision;
    state.asrBusy = true;
    dom.asrStartBtn.disabled = true;
    dom.asrStartLabel.textContent =
      mode === "segments"
        ? t("asr.progressSegments", { count: chunkCount })
        : t("asr.progressWhole");
    setAsrStatus(
      mode === "segments"
        ? t("asr.statusSegments", {
            seconds: i18n.formatNumber(chunkSeconds),
            count: chunkCount,
          })
        : t("asr.statusWhole"),
    );

    try {
      const response = await apiFetch(
        `/api/audio/${encodeURIComponent(state.data.id)}/transcribe`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            base_url: baseUrl,
            api_key: dom.asrApiKey.value.trim() || null,
            model,
            language: dom.asrLanguage.value || null,
            prompt: null,
            mode,
            chunk_seconds: chunkSeconds,
          }),
        },
      );
      if (!response.ok) throw new Error(await apiError(response));
      const result = await response.json();
      if (state.data.revision !== startRevision) {
        throw new Error(t("asr.stale"));
      }
      state.transcripts = result.segments.map((segment, index) => ({
        id: `transcript-${Date.now()}-${state.transcriptSerial + index}`,
        start: Number(segment.start),
        end: Number(segment.end),
        text: String(segment.text || "").trim(),
      }));
      state.transcriptSerial += result.segments.length;
      renderTranscripts();
      resizeTimeline(true);
      setAsrStatus(
        t("asr.completed", {
          count: state.transcripts.length,
          model: result.model,
        }),
        "success",
      );
      toast(t("asr.success"), "success");
      if (state.transcripts.length) {
        const first = state.transcripts[0];
        setSelection(first.start, first.end);
        seekTo(first.start);
        ensureTimeVisible(first.start);
      }
    } catch (error) {
      setAsrStatus(
        error instanceof Error ? error.message : t("asr.failure"),
        "error",
      );
      toast(
        error instanceof Error ? error.message : t("asr.failure"),
        "error",
      );
    } finally {
      state.asrBusy = false;
      dom.asrStartBtn.disabled = !state.data;
      dom.asrStartLabel.textContent = t("asr.start");
      updateButtons();
    }
  }

  function setAsrStatus(message, type = "") {
    dom.asrStatus.textContent = message;
    dom.asrStatus.className = `asr-status${type ? ` is-${type}` : ""}`;
  }

  function refreshLocalizedUi() {
    updateButtons();
    if (state.data) {
      dom.factChannels.textContent =
        state.data.channels === 1
          ? t("channels.mono")
          : t("channels.multiple", { count: state.data.channels });
      dom.headerFileMeta.textContent = `${(
        state.data.source_format || ""
      ).toUpperCase()} · ${t("header.defaultExport", {
        format: FORMAT_NAMES[state.data.default_export_format] || "WAV",
      })}`;
      document.title = `${state.data.name} · WaveCraft`;
      updatePlaybackIcon(isPlaybackActive());
      dom.asrKeyToggle.setAttribute(
        "aria-label",
        t(dom.asrApiKey.type === "text" ? "apiKey.hide" : "apiKey.show"),
      );
      renderLabels();
      renderTranscripts();
      updateSelectionUi();
      updateTimeUi();
      requestDraw();
    } else {
      document.title = t("app.title");
    }
  }

  function openDeleteDialog() {
    if (!state.selection) return;
    dom.deleteRangeLabel.textContent = `${formatTime(
      state.selection.start,
    )} – ${formatTime(state.selection.end)}`;
    if (typeof dom.deleteDialog.showModal === "function") {
      dom.deleteDialog.showModal();
      dom.deleteDialog.querySelector('button[value="cancel"]')?.focus();
    } else if (window.confirm(t("delete.confirmFallback"))) {
      deleteSelection();
    }
  }

  function bindEvents() {
    dom.dropZone.addEventListener("click", () => dom.fileInput.click());
    dom.fileInput.addEventListener("change", () => {
      uploadFile(dom.fileInput.files?.[0]);
    });

    for (const eventName of ["dragenter", "dragover"]) {
      dom.dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dom.dropZone.classList.add("is-dragging");
      });
    }
    for (const eventName of ["dragleave", "drop"]) {
      dom.dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dom.dropZone.classList.remove("is-dragging");
      });
    }
    dom.dropZone.addEventListener("drop", (event) => {
      const file = event.dataTransfer?.files?.[0];
      if (file) uploadFile(file);
    });

    dom.playBtn.addEventListener("click", togglePlayback);
    dom.playSelectionBtn.addEventListener("click", playSelection);
    dom.toStartBtn.addEventListener("click", () => {
      seekTo(0, { forceAudio: true });
    });
    dom.audioPlayer.addEventListener("play", () => {
      if (!dom.selectionPlayer.paused) dom.selectionPlayer.pause();
      state.playbackMode = "full";
      state.playbackSelection = null;
      updatePlaybackIcon(true);
      startPlaybackFrame();
    });
    dom.audioPlayer.addEventListener("pause", () => {
      if (!isPlaybackActive()) updatePlaybackIcon(false);
    });
    dom.audioPlayer.addEventListener("ended", () => {
      if (state.data) state.playhead = state.data.duration;
      state.playbackMode = "full";
      state.playbackSelection = null;
      updatePlaybackIcon(false);
      updateTimeUi();
      requestDraw();
    });
    dom.selectionPlayer.addEventListener("play", () => {
      if (!dom.audioPlayer.paused) dom.audioPlayer.pause();
      state.playbackMode = "selection";
      updatePlaybackIcon(true);
      startPlaybackFrame();
    });
    dom.selectionPlayer.addEventListener("pause", () => {
      if (!isPlaybackActive()) updatePlaybackIcon(false);
    });
    dom.selectionPlayer.addEventListener("ended", () => {
      if (state.playbackSelection) {
        state.playhead = state.playbackSelection.end;
      }
      updatePlaybackIcon(false);
      updateTimeUi();
      requestDraw();
    });

    dom.zoomOutBtn.addEventListener("click", () => zoomBy(0.5));
    dom.zoomInBtn.addEventListener("click", () => zoomBy(2));
    dom.fitBtn.addEventListener("click", fitTimeline);
    dom.resolutionSelect.addEventListener("change", changeResolution);
    dom.timelineScroller.addEventListener("scroll", requestDraw, { passive: true });

    canvas.addEventListener("pointerdown", beginPointer);
    canvas.addEventListener("pointermove", movePointer);
    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", endPointer);
    canvas.addEventListener("pointerleave", (event) => {
      if (!state.drag) {
        state.hover = null;
        requestDraw();
      }
      event.preventDefault();
    });
    canvas.addEventListener("dblclick", (event) => {
      if (!state.data) return;
      const point = canvasPoint(event);
      if (point.x < PLOT_LEFT) return;
      const time = timeAtCanvasX(point.x);
      seekTo(time, { forceAudio: true });
      addManualLabel(time);
    });
    canvas.addEventListener("keydown", handleCanvasKeydown);
    canvas.addEventListener(
      "wheel",
      (event) => {
        if (!state.data) return;
        if (event.shiftKey && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
          event.preventDefault();
          dom.timelineScroller.scrollLeft += event.deltaY;
          requestDraw();
        }
      },
      { passive: false },
    );

    dom.thresholdSlider.addEventListener("input", () => {
      state.threshold = Number(dom.thresholdSlider.value);
      dom.thresholdValue.textContent = `${state.threshold} dBFS`;
      state.dismissedAutoKeys.clear();
      renderLabels();
    });
    dom.autoLabelToggle.addEventListener("change", () => {
      renderLabels();
    });
    dom.addLabelBtn.addEventListener("click", () => addManualLabel());
    dom.clearSelectionBtn.addEventListener("click", clearSelection);
    dom.deleteSelectionBtn.addEventListener("click", openDeleteDialog);
    dom.confirmDeleteBtn.addEventListener("click", () => {
      dom.deleteDialog.close();
      deleteSelection();
    });
    dom.exportBtn.addEventListener("click", exportAudio);
    dom.undoBtn.addEventListener("click", undoDelete);

    dom.labelList.addEventListener("click", (event) => {
      const deleteButton = event.target.closest("[data-label-delete]");
      if (deleteButton) {
        deleteLabel(deleteButton.dataset.labelDelete);
        return;
      }
      const jump = event.target.closest("[data-label-jump]");
      if (!jump) return;
      const label = allLabels().find((item) => item.id === jump.dataset.labelJump);
      if (!label) return;
      if (label.type === "auto") {
        setSelection(label.start, label.end);
      } else {
        clearSelection();
      }
      seekTo(label.start, { forceAudio: true });
    });

    dom.transcriptList.addEventListener("click", (event) => {
      const deleteButton = event.target.closest("[data-transcript-delete]");
      if (deleteButton) {
        state.transcripts = state.transcripts.filter(
          (item) => item.id !== deleteButton.dataset.transcriptDelete,
        );
        renderTranscripts();
        resizeTimeline(true);
        return;
      }
      const jump = event.target.closest("[data-transcript-jump]");
      if (!jump) return;
      const transcript = state.transcripts.find(
        (item) => item.id === jump.dataset.transcriptJump,
      );
      if (!transcript) return;
      setSelection(transcript.start, transcript.end);
      seekTo(transcript.start, { forceAudio: true });
    });
    dom.clearTranscriptBtn.addEventListener("click", () => {
      state.transcripts = [];
      renderTranscripts();
      resizeTimeline(true);
      toast(t("transcript.cleared"));
    });

    dom.asrMode.addEventListener("change", updateAsrModeUi);
    dom.asrKeyToggle.addEventListener("click", () => {
      const showing = dom.asrApiKey.type === "text";
      dom.asrApiKey.type = showing ? "password" : "text";
      dom.asrKeyToggle.setAttribute("aria-pressed", String(!showing));
      dom.asrKeyToggle.setAttribute(
        "aria-label",
        t(showing ? "apiKey.show" : "apiKey.hide"),
      );
    });
    dom.asrStartBtn.addEventListener("click", runAsr);

    const resizeObserver = new ResizeObserver(() => {
      if (!state.data) return;
      resizeTimeline(true);
    });
    resizeObserver.observe(dom.timelineScroller);

    document.addEventListener("keydown", (event) => {
      if (!state.data || isEditable(event.target)) return;
      if (dom.deleteDialog.open) return;
      if (event.code === "Space") {
        event.preventDefault();
        togglePlayback();
      } else if (event.key === "Escape" && state.selection) {
        event.preventDefault();
        clearSelection();
      } else if ((event.key === "Delete" || event.key === "Backspace") && state.selection) {
        event.preventDefault();
        openDeleteDialog();
      } else if (event.key.toLowerCase() === "l") {
        event.preventDefault();
        addManualLabel();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        if (state.data.previous_available) {
          event.preventDefault();
          undoDelete();
        }
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomBy(2);
      } else if (event.key === "-") {
        event.preventDefault();
        zoomBy(0.5);
      }
    });
  }

  i18n.init(refreshLocalizedUi);
  restoreAsrSettings();
  bindEvents();
  updateButtons();
})();
