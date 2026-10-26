(() => {
  "use strict";

  const TRANSLATIONS = {
    zh: {
      "app.title": "声刻 WaveCraft · 音频编辑",
      "app.description":
        "声刻 WaveCraft：在浏览器中分析 RMS 波形、标记低电平区段、试听、删除并导出音频片段。",
      "app.brandHome": "声刻 WaveCraft 首页",
      "app.skip": "跳到主要内容",
      "language.interface": "界面语言",
      "header.waitingFile": "等待载入音频",
      "header.undo": "撤销删除",
      "header.format": "格式",
      "header.exportFormat": "导出格式",
      "header.exportTitle": "导出当前选区；没有选区时导出完整音频",
      "header.exportAudio": "导出音频",
      "header.exportSelection": "导出选区",
      "header.defaultExport": "{format} 默认导出",
      "upload.eyebrow": "浏览器音频工作台",
      "upload.titleLead": "听见声音的",
      "upload.titleAccent": "每一段呼吸",
      "upload.intro":
        "分析 RMS 波形，自动发现低电平区段。拖动选区即可试听、导出或从音频中删除。",
      "upload.formatsAria": "支持的音频格式",
      "upload.dropTitle": "拖入音频，或点击选择",
      "upload.dropSubtitle": "最大 250 MB · 自动转换为无损 PCM",
      "upload.help": "首次分析需要解码音频，较长文件可能需要几秒钟。",
      "upload.featuresAria": "主要功能",
      "upload.feature1Title": "精细 RMS 波形",
      "upload.feature1Body": "50–200 ms 分析精度，横向滚动查看整段音频。",
      "upload.feature2Title": "静音自动定位",
      "upload.feature2Body": "低于阈值的区段自动标记，阈值可即时调整。",
      "upload.feature3Title": "选区直接交付",
      "upload.feature3Body": "试听、导出 WAV，或删除不需要的片段。",
      "editor.eyebrow": "当前工作区",
      "editor.title": "音频概览",
      "editor.infoAria": "音频信息",
      "editor.duration": "时长",
      "editor.sampleRate": "采样率",
      "editor.channels": "声道",
      "transport.aria": "播放控制",
      "transport.toStart": "跳到开头",
      "transport.play": "播放",
      "transport.pause": "暂停",
      "transport.playPauseTitle": "播放 / 暂停（Space）",
      "transport.resolution": "分析精度",
      "transport.zoomAria": "波形缩放",
      "transport.zoomOut": "缩小时间线",
      "transport.zoomOutTitle": "缩小",
      "transport.zoomIn": "放大时间线",
      "transport.zoomInTitle": "放大",
      "transport.fit": "适应窗口",
      "timeline.scrollerAria": "可横向滚动的 RMS 时间线",
      "timeline.canvasAria":
        "RMS 波形。拖动选择片段，双击添加标签。方向键移动播放头，Shift 加方向键调整选区。",
      "timeline.help": "拖动波形选择片段 · 双击添加标签 · Shift + 滚轮横向滚动",
      "timeline.legendAria": "图例",
      "timeline.normalLevel": "正常电平",
      "timeline.lowLevel": "低电平",
      "timeline.selection": "选区",
      "timeline.transcript": "识别文本",
      "timeline.transcriptShort": "识别文本",
      "timeline.peak": "峰值",
      "inspector.aria": "音频检查器",
      "lowLevel.kicker": "低电平检测",
      "lowLevel.title": "低电平区段",
      "lowLevel.auto": "自动",
      "lowLevel.threshold": "阈值",
      "lowLevel.note": "连续低于阈值的 RMS 区段会被标记。调整阈值后可立即查看结果。",
      "selection.kicker": "当前选区",
      "selection.title": "当前选区",
      "selection.clear": "清除",
      "selection.empty": "在波形上横向拖动，选择要处理的声音片段。",
      "selection.start": "起点",
      "selection.end": "终点",
      "selection.selected": "已选择",
      "selection.accuracy":
        "试听使用服务端精确切片；导出时首尾自动加入 5 ms 淡入淡出，避免爆音。",
      "selection.play": "播放选区",
      "selection.delete": "从音频中删除",
      "asr.kicker": "语音转文字",
      "asr.title": "语音识别",
      "asr.optional": "可选",
      "asr.configure": "配置 OpenAI 兼容接口",
      "asr.baseUrl": "Base URL 或完整转写地址",
      "asr.baseUrlExample": "https://api.openai.com/v1",
      "asr.apiKey": "API Key",
      "asr.apiKeyHelp": "可留空供本地服务使用",
      "asr.model": "模型",
      "asr.language": "语言",
      "asr.autoDetect": "自动检测",
      "asr.processing": "处理方式",
      "asr.segments": "自动分段",
      "asr.whole": "整段识别",
      "asr.chunkDuration": "每段时长",
      "asr.seconds": "{value} 秒",
      "asr.seconds15": "15 秒",
      "asr.seconds30": "30 秒",
      "asr.seconds45": "45 秒",
      "asr.seconds60": "60 秒",
      "asr.privacy":
        "API Key 仅随本次请求发送到本站后端并转发给所填服务，不写入磁盘。",
      "asr.start": "开始识别",
      "asr.baseRequired": "请先填写兼容接口的 Base URL。",
      "asr.modelRequired": "请填写 ASR 模型名称。",
      "asr.progressSegments": "识别 {count} 段中…",
      "asr.progressWhole": "识别中…",
      "asr.statusSegments": "正在按 {seconds} 秒分段识别，共 {count} 段。",
      "asr.statusWhole": "正在发送整段音频，请等待接口返回。",
      "asr.stale": "音频在识别期间发生了变化，结果已舍弃，请重新识别。",
      "asr.completed": "识别完成：{count} 段，模型 {model}。",
      "asr.success": "语音识别完成，文本已对齐到时间轴。",
      "asr.failure": "语音识别失败，请检查接口配置。",
      "transcript.kicker": "识别文本",
      "transcript.title": "识别文本",
      "transcript.clearAria": "清除识别文本",
      "transcript.clearTitle": "清除识别文本",
      "transcript.note": "点击文本块可跳转到对应时间段。",
      "transcript.unknown": "未识别到语音",
      "transcript.deleteAria": "删除该段识别文本",
      "transcript.cleared": "识别文本已清除。",
      "labels.kicker": "时间标签",
      "labels.title": "时间标签",
      "labels.addAria": "在播放头位置添加标签",
      "labels.addTitle": "在播放头位置添加标签（L）",
      "labels.note": "点击标签跳转；自动标签也可单独删除。",
      "labels.lowLevel": "低电平",
      "labels.manual": "手动标记 {number}",
      "labels.emptyThreshold": "当前阈值下没有检测到低电平区段，可继续调高阈值。",
      "labels.emptyDisabled": "自动标签已关闭。可在播放头位置添加手动标签。",
      "labels.deleteAria": "删除标签 {title}",
      "labels.deleteTitle": "删除标签",
      "labels.alreadyExists": "这个位置已经有手动标签。",
      "labels.added": "已在 {time} 添加标签。",
      "labels.deleted": "标签已删除。",
      "delete.title": "删除所选片段？",
      "delete.bodyPrefix": "将从当前音频中移除",
      "delete.bodySuffix": "。删除后可撤销最近一次操作。",
      "delete.confirmFallback": "确认删除所选音频片段？",
      "delete.cancel": "取消",
      "delete.confirm": "确认删除",
      "delete.busyTitle": "正在删除片段",
      "delete.busyMessage": "拼接波形并重新计算 RMS，请稍候。",
      "delete.success": "片段已删除，可使用“撤销删除”恢复。",
      "delete.failure": "删除片段失败，请重试。",
      "undo.busyTitle": "正在恢复音频",
      "undo.busyMessage": "重新载入上一次删除前的音频。",
      "undo.success": "已恢复删除前的音频。",
      "undo.failure": "撤销失败，请重试。",
      "export.scopeSelection": "所选片段",
      "export.scopeFull": "完整音频",
      "export.busyTitle": "正在导出 {format}",
      "export.busyMessage": "编码{scope}，请稍候。",
      "export.success": "{scope}已导出为 {format}。",
      "export.failure": "导出失败，请重试。",
      "analysis.busyTitle": "正在重新分析",
      "analysis.busyMessage": "以 {resolution} ms 精度计算 RMS 波形。",
      "analysis.success": "分析精度已切换为 {resolution} ms。",
      "analysis.failure": "重新分析失败。",
      "playback.error": "无法播放音频：{message}",
      "playback.errorFallback": "无法播放音频。",
      "selection.loadFailed": "选区音频加载失败",
      "selection.changed": "选区已发生变化，请重新播放",
      "selection.playError": "无法播放选区：{message}",
      "selection.playErrorFallback": "无法播放选区。",
      "upload.tooLarge": "文件超过 250 MB 限制，请先压缩或裁剪音频。",
      "upload.busyTitle": "正在载入音频",
      "upload.busyMessage": "解码音频并计算 RMS 波形，请稍候。",
      "upload.success": "音频已载入，拖动波形即可选择片段。",
      "upload.failure": "音频处理失败，请重试。",
      "busy.defaultTitle": "正在分析音频",
      "busy.defaultMessage": "解码并计算 RMS 波形，请稍候。",
      "channels.mono": "单声道",
      "channels.multiple": "{count} 声道",
      "units.milliseconds": "{value} 毫秒",
      "units.seconds": "{value} 秒",
      "errors.requestFailed": "请求失败（{status}）",
      "errors.detailSeparator": "；",
      "apiKey.show": "显示 API Key",
      "apiKey.hide": "隐藏 API Key",
    },
    en: {
      "app.title": "WaveCraft · Audio Editor",
      "app.description":
        "WaveCraft is a browser audio editor for RMS waveform analysis, low-level detection, selection preview, deletion, and audio export.",
      "app.brandHome": "WaveCraft home",
      "app.skip": "Skip to main content",
      "language.interface": "Interface language",
      "header.waitingFile": "Waiting for audio",
      "header.undo": "Undo deletion",
      "header.format": "Format",
      "header.exportFormat": "Export format",
      "header.exportTitle":
        "Export the current selection, or the complete audio when nothing is selected",
      "header.exportAudio": "Export audio",
      "header.exportSelection": "Export selection",
      "header.defaultExport": "{format} default",
      "upload.eyebrow": "Browser audio workspace",
      "upload.titleLead": "Hear every",
      "upload.titleAccent": "breath of sound",
      "upload.intro":
        "Analyze RMS waveforms and find quiet passages automatically. Drag to preview, export, or remove any part of the audio.",
      "upload.formatsAria": "Supported audio formats",
      "upload.dropTitle": "Drop an audio file, or click to choose",
      "upload.dropSubtitle": "Up to 250 MB · Automatic lossless PCM conversion",
      "upload.help":
        "The first analysis decodes the audio. Longer files may take a few seconds.",
      "upload.featuresAria": "Main features",
      "upload.feature1Title": "Detailed RMS waveform",
      "upload.feature1Body":
        "50–200 ms analysis resolution with horizontal scrolling for the complete file.",
      "upload.feature2Title": "Automatic silence detection",
      "upload.feature2Body":
        "Regions below the threshold are marked automatically, with instant threshold updates.",
      "upload.feature3Title": "Selections ready to use",
      "upload.feature3Body": "Preview, export as WAV, or remove unwanted sections.",
      "editor.eyebrow": "Current workspace",
      "editor.title": "Audio overview",
      "editor.infoAria": "Audio details",
      "editor.duration": "Duration",
      "editor.sampleRate": "Sample rate",
      "editor.channels": "Channels",
      "transport.aria": "Playback controls",
      "transport.toStart": "Jump to start",
      "transport.play": "Play",
      "transport.pause": "Pause",
      "transport.playPauseTitle": "Play / pause (Space)",
      "transport.resolution": "Analysis resolution",
      "transport.zoomAria": "Waveform zoom",
      "transport.zoomOut": "Zoom timeline out",
      "transport.zoomOutTitle": "Zoom out",
      "transport.zoomIn": "Zoom timeline in",
      "transport.zoomInTitle": "Zoom in",
      "transport.fit": "Fit to window",
      "timeline.scrollerAria": "Horizontally scrollable RMS timeline",
      "timeline.canvasAria":
        "RMS waveform. Drag to select a clip and double-click to add a marker. Use arrow keys to move the playhead and Shift plus arrow keys to adjust the selection.",
      "timeline.help":
        "Drag to select · Double-click to add a marker · Shift + wheel to scroll",
      "timeline.legendAria": "Legend",
      "timeline.normalLevel": "Normal level",
      "timeline.lowLevel": "Low level",
      "timeline.selection": "Selection",
      "timeline.transcript": "Transcript",
      "timeline.transcriptShort": "TRANSCRIPT",
      "timeline.peak": "Peak",
      "inspector.aria": "Audio inspector",
      "lowLevel.kicker": "Low-level detection",
      "lowLevel.title": "Low-level regions",
      "lowLevel.auto": "Auto",
      "lowLevel.threshold": "Threshold",
      "lowLevel.note":
        "Continuous RMS regions below the threshold are marked. Adjust the threshold to update the results instantly.",
      "selection.kicker": "Active range",
      "selection.title": "Current selection",
      "selection.clear": "Clear",
      "selection.empty": "Drag horizontally across the waveform to select a sound clip.",
      "selection.start": "Start",
      "selection.end": "End",
      "selection.selected": "Selected",
      "selection.accuracy":
        "Previews are sliced precisely on the server. Exports include automatic 5 ms fades to prevent clicks.",
      "selection.play": "Play selection",
      "selection.delete": "Delete from audio",
      "asr.kicker": "Speech to text",
      "asr.title": "Speech recognition",
      "asr.optional": "Optional",
      "asr.configure": "Configure an OpenAI-compatible endpoint",
      "asr.baseUrl": "Base URL or full transcription URL",
      "asr.baseUrlExample": "https://api.openai.com/v1",
      "asr.apiKey": "API key",
      "asr.apiKeyHelp": "May be empty for local services",
      "asr.model": "Model",
      "asr.language": "Language",
      "asr.autoDetect": "Auto-detect",
      "asr.processing": "Processing mode",
      "asr.segments": "Automatic segments",
      "asr.whole": "Whole file",
      "asr.chunkDuration": "Segment duration",
      "asr.seconds": "{value} sec",
      "asr.seconds15": "15 sec",
      "asr.seconds30": "30 sec",
      "asr.seconds45": "45 sec",
      "asr.seconds60": "60 sec",
      "asr.privacy":
        "The API key is sent only with this request to this app's backend and then forwarded to the configured service. It is not written to disk.",
      "asr.start": "Start transcription",
      "asr.baseRequired": "Enter the Base URL of a compatible endpoint first.",
      "asr.modelRequired": "Enter the ASR model name.",
      "asr.progressSegments": "Transcribing {count} segments…",
      "asr.progressWhole": "Transcribing…",
      "asr.statusSegments":
        "Transcribing in {seconds}-second segments; {count} segments in total.",
      "asr.statusWhole": "Sending the complete audio. Waiting for the endpoint to respond.",
      "asr.stale":
        "The audio changed during transcription. The result was discarded; please try again.",
      "asr.completed": "Transcription complete: {count} segments · model {model}.",
      "asr.success": "Speech recognition complete. The text is aligned to the timeline.",
      "asr.failure": "Speech recognition failed. Check the endpoint configuration.",
      "transcript.kicker": "Transcript",
      "transcript.title": "Transcript",
      "transcript.clearAria": "Clear transcript",
      "transcript.clearTitle": "Clear transcript",
      "transcript.note": "Select a text block to jump to its time range.",
      "transcript.unknown": "No speech recognized",
      "transcript.deleteAria": "Delete this transcript segment",
      "transcript.cleared": "Transcript cleared.",
      "labels.kicker": "Timeline notes",
      "labels.title": "Timeline markers",
      "labels.addAria": "Add marker at playhead",
      "labels.addTitle": "Add marker at playhead (L)",
      "labels.note": "Select a marker to jump to it. Automatic markers can be deleted individually.",
      "labels.lowLevel": "Low level",
      "labels.manual": "Manual marker {number}",
      "labels.emptyThreshold":
        "No low-level regions were detected at this threshold. Try raising it.",
      "labels.emptyDisabled":
        "Automatic markers are off. Add a manual marker at the playhead.",
      "labels.deleteAria": "Delete marker {title}",
      "labels.deleteTitle": "Delete marker",
      "labels.alreadyExists": "There is already a manual marker at this position.",
      "labels.added": "Marker added at {time}.",
      "labels.deleted": "Marker deleted.",
      "delete.title": "Delete selected clip?",
      "delete.bodyPrefix": "This will remove",
      "delete.bodySuffix": " from the current audio. You can undo the latest deletion.",
      "delete.confirmFallback": "Delete the selected audio clip?",
      "delete.cancel": "Cancel",
      "delete.confirm": "Delete",
      "delete.busyTitle": "Deleting clip",
      "delete.busyMessage": "Joining the waveform and recalculating RMS. Please wait.",
      "delete.success": "Clip deleted. Use “Undo deletion” to restore it.",
      "delete.failure": "Could not delete the clip. Please try again.",
      "undo.busyTitle": "Restoring audio",
      "undo.busyMessage": "Reloading the audio from before the latest deletion.",
      "undo.success": "The audio was restored.",
      "undo.failure": "Could not undo the deletion. Please try again.",
      "export.scopeSelection": "the selected clip",
      "export.scopeFull": "the complete audio",
      "export.busyTitle": "Exporting {format}",
      "export.busyMessage": "Encoding {scope}. Please wait.",
      "export.success": "Export complete: {scope} as {format}.",
      "export.failure": "Export failed. Please try again.",
      "analysis.busyTitle": "Reanalyzing audio",
      "analysis.busyMessage": "Calculating the RMS waveform at {resolution} ms.",
      "analysis.success": "Analysis resolution changed to {resolution} ms.",
      "analysis.failure": "Reanalysis failed.",
      "playback.error": "Unable to play audio: {message}",
      "playback.errorFallback": "Unable to play audio.",
      "selection.loadFailed": "Could not load the selection audio",
      "selection.changed": "The selection changed. Please play it again.",
      "selection.playError": "Unable to play the selection: {message}",
      "selection.playErrorFallback": "Unable to play the selection.",
      "upload.tooLarge":
        "The file exceeds the 250 MB limit. Compress or trim the audio first.",
      "upload.busyTitle": "Loading audio",
      "upload.busyMessage": "Decoding the audio and calculating RMS. Please wait.",
      "upload.success": "Audio loaded. Drag across the waveform to select a clip.",
      "upload.failure": "Audio processing failed. Please try again.",
      "busy.defaultTitle": "Analyzing audio",
      "busy.defaultMessage": "Decoding and calculating the RMS waveform. Please wait.",
      "channels.mono": "Mono",
      "channels.multiple": "{count} channels",
      "units.milliseconds": "{value} ms",
      "units.seconds": "{value} sec",
      "errors.requestFailed": "Request failed ({status})",
      "errors.detailSeparator": "; ",
      "apiKey.show": "Show API key",
      "apiKey.hide": "Hide API key",
    },
    fr: {
      "app.title": "WaveCraft · Éditeur audio",
      "app.description":
        "WaveCraft est un éditeur audio dans le navigateur pour analyser la forme d'onde RMS, détecter les passages faibles, prévisualiser, supprimer et exporter des extraits audio.",
      "app.brandHome": "Accueil WaveCraft",
      "app.skip": "Aller au contenu principal",
      "language.interface": "Langue de l'interface",
      "header.waitingFile": "En attente d'un fichier audio",
      "header.undo": "Annuler la suppression",
      "header.format": "Format",
      "header.exportFormat": "Format d'export",
      "header.exportTitle":
        "Exporter la sélection actuelle ou l'intégralité de l'audio si rien n'est sélectionné",
      "header.exportAudio": "Exporter l'audio",
      "header.exportSelection": "Exporter la sélection",
      "header.defaultExport": "{format} par défaut",
      "upload.eyebrow": "Atelier audio dans le navigateur",
      "upload.titleLead": "Entendez chaque",
      "upload.titleAccent": "souffle du son",
      "upload.intro":
        "Analysez la forme d'onde RMS et repérez automatiquement les passages faibles. Faites glisser une sélection pour l'écouter, l'exporter ou la supprimer.",
      "upload.formatsAria": "Formats audio pris en charge",
      "upload.dropTitle": "Déposez un fichier audio ou cliquez pour le choisir",
      "upload.dropSubtitle": "250 Mo maximum · Conversion automatique en PCM sans perte",
      "upload.help":
        "La première analyse décode le fichier audio. Les fichiers longs peuvent prendre quelques secondes.",
      "upload.featuresAria": "Fonctions principales",
      "upload.feature1Title": "Forme d'onde RMS précise",
      "upload.feature1Body":
        "Précision d'analyse de 50 à 200 ms et défilement horizontal sur tout le fichier.",
      "upload.feature2Title": "Détection automatique des silences",
      "upload.feature2Body":
        "Les passages sous le seuil sont signalés automatiquement, avec un réglage immédiat.",
      "upload.feature3Title": "Sélections prêtes à l'emploi",
      "upload.feature3Body": "Écoutez, exportez en WAV ou supprimez les passages inutiles.",
      "editor.eyebrow": "Espace de travail actuel",
      "editor.title": "Vue d'ensemble de l'audio",
      "editor.infoAria": "Informations audio",
      "editor.duration": "Durée",
      "editor.sampleRate": "Fréquence d'échantillonnage",
      "editor.channels": "Canaux",
      "transport.aria": "Commandes de lecture",
      "transport.toStart": "Aller au début",
      "transport.play": "Lire",
      "transport.pause": "Pause",
      "transport.playPauseTitle": "Lire / mettre en pause (Espace)",
      "transport.resolution": "Précision d'analyse",
      "transport.zoomAria": "Zoom de la forme d'onde",
      "transport.zoomOut": "Réduire la chronologie",
      "transport.zoomOutTitle": "Réduire",
      "transport.zoomIn": "Agrandir la chronologie",
      "transport.zoomInTitle": "Agrandir",
      "transport.fit": "Ajuster à la fenêtre",
      "timeline.scrollerAria": "Chronologie RMS à défilement horizontal",
      "timeline.canvasAria":
        "Forme d'onde RMS. Faites glisser pour sélectionner un extrait et double-cliquez pour ajouter un repère. Utilisez les flèches pour déplacer la tête de lecture et Maj plus les flèches pour ajuster la sélection.",
      "timeline.help":
        "Glisser pour sélectionner · Double-cliquer pour ajouter un repère · Maj + molette pour défiler",
      "timeline.legendAria": "Légende",
      "timeline.normalLevel": "Niveau normal",
      "timeline.lowLevel": "Niveau faible",
      "timeline.selection": "Sélection",
      "timeline.transcript": "Transcription",
      "timeline.transcriptShort": "TEXTE",
      "timeline.peak": "Crête",
      "inspector.aria": "Inspecteur audio",
      "lowLevel.kicker": "Détection de faible niveau",
      "lowLevel.title": "Passages à faible niveau",
      "lowLevel.auto": "Auto",
      "lowLevel.threshold": "Seuil",
      "lowLevel.note":
        "Les passages RMS continus sous le seuil sont signalés. Modifiez le seuil pour actualiser immédiatement les résultats.",
      "selection.kicker": "Plage active",
      "selection.title": "Sélection actuelle",
      "selection.clear": "Effacer",
      "selection.empty":
        "Faites glisser horizontalement sur la forme d'onde pour sélectionner un extrait.",
      "selection.start": "Début",
      "selection.end": "Fin",
      "selection.selected": "Sélection",
      "selection.accuracy":
        "Les extraits d'écoute sont découpés précisément sur le serveur. Les exports incluent des fondus automatiques de 5 ms pour éviter les clics.",
      "selection.play": "Lire la sélection",
      "selection.delete": "Supprimer de l'audio",
      "asr.kicker": "Parole vers texte",
      "asr.title": "Reconnaissance vocale",
      "asr.optional": "Facultatif",
      "asr.configure": "Configurer une interface compatible OpenAI",
      "asr.baseUrl": "URL de base ou URL complète de transcription",
      "asr.baseUrlExample": "https://api.openai.com/v1",
      "asr.apiKey": "Clé API",
      "asr.apiKeyHelp": "Peut rester vide pour un service local",
      "asr.model": "Modèle",
      "asr.language": "Langue",
      "asr.autoDetect": "Détection automatique",
      "asr.processing": "Mode de traitement",
      "asr.segments": "Segments automatiques",
      "asr.whole": "Fichier complet",
      "asr.chunkDuration": "Durée d'un segment",
      "asr.seconds": "{value} s",
      "asr.seconds15": "15 s",
      "asr.seconds30": "30 s",
      "asr.seconds45": "45 s",
      "asr.seconds60": "60 s",
      "asr.privacy":
        "La clé API est envoyée uniquement avec cette requête au serveur de l'application, puis transmise au service configuré. Elle n'est pas écrite sur le disque.",
      "asr.start": "Lancer la transcription",
      "asr.baseRequired": "Saisissez d'abord l'URL de base d'une interface compatible.",
      "asr.modelRequired": "Saisissez le nom du modèle ASR.",
      "asr.progressSegments": "Transcription de {count} segments…",
      "asr.progressWhole": "Transcription en cours…",
      "asr.statusSegments":
        "Transcription par segments de {seconds} s, {count} segments au total.",
      "asr.statusWhole":
        "Envoi de l'intégralité de l'audio. En attente de la réponse du service.",
      "asr.stale":
        "L'audio a changé pendant la transcription. Le résultat a été ignoré ; veuillez réessayer.",
      "asr.completed": "Transcription terminée : {count} segments · modèle {model}.",
      "asr.success":
        "Reconnaissance vocale terminée. Le texte est aligné sur la chronologie.",
      "asr.failure":
        "La reconnaissance vocale a échoué. Vérifiez la configuration de l'interface.",
      "transcript.kicker": "Transcription",
      "transcript.title": "Transcription",
      "transcript.clearAria": "Effacer la transcription",
      "transcript.clearTitle": "Effacer la transcription",
      "transcript.note": "Sélectionnez un bloc de texte pour accéder à sa plage horaire.",
      "transcript.unknown": "Aucune parole reconnue",
      "transcript.deleteAria": "Supprimer ce segment de transcription",
      "transcript.cleared": "Transcription effacée.",
      "labels.kicker": "Repères temporels",
      "labels.title": "Repères",
      "labels.addAria": "Ajouter un repère à la tête de lecture",
      "labels.addTitle": "Ajouter un repère à la tête de lecture (L)",
      "labels.note":
        "Sélectionnez un repère pour y accéder. Les repères automatiques peuvent être supprimés individuellement.",
      "labels.lowLevel": "Niveau faible",
      "labels.manual": "Repère manuel {number}",
      "labels.emptyThreshold":
        "Aucun passage à faible niveau n'a été détecté avec ce seuil. Essayez de l'augmenter.",
      "labels.emptyDisabled":
        "Les repères automatiques sont désactivés. Ajoutez un repère manuel à la tête de lecture.",
      "labels.deleteAria": "Supprimer le repère {title}",
      "labels.deleteTitle": "Supprimer le repère",
      "labels.alreadyExists": "Un repère manuel existe déjà à cet endroit.",
      "labels.added": "Repère ajouté à {time}.",
      "labels.deleted": "Repère supprimé.",
      "delete.title": "Supprimer l'extrait sélectionné ?",
      "delete.bodyPrefix": "Cela supprimera",
      "delete.bodySuffix":
        " de l'audio actuel. La dernière suppression peut être annulée.",
      "delete.confirmFallback": "Supprimer l'extrait audio sélectionné ?",
      "delete.cancel": "Annuler",
      "delete.confirm": "Supprimer",
      "delete.busyTitle": "Suppression de l'extrait",
      "delete.busyMessage":
        "Assemblage de la forme d'onde et recalcul du RMS. Veuillez patienter.",
      "delete.success":
        "Extrait supprimé. Utilisez « Annuler la suppression » pour le restaurer.",
      "delete.failure": "Impossible de supprimer l'extrait. Veuillez réessayer.",
      "undo.busyTitle": "Restauration de l'audio",
      "undo.busyMessage":
        "Rechargement de l'audio tel qu'il était avant la dernière suppression.",
      "undo.success": "L'audio a été restauré.",
      "undo.failure": "Impossible d'annuler la suppression. Veuillez réessayer.",
      "export.scopeSelection": "l'extrait sélectionné",
      "export.scopeFull": "l'intégralité de l'audio",
      "export.busyTitle": "Export en {format}",
      "export.busyMessage": "Encodage : {scope}. Veuillez patienter.",
      "export.success": "Export terminé : {scope} au format {format}.",
      "export.failure": "L'export a échoué. Veuillez réessayer.",
      "analysis.busyTitle": "Nouvelle analyse de l'audio",
      "analysis.busyMessage": "Calcul de la forme d'onde RMS avec une précision de {resolution} ms.",
      "analysis.success": "Précision d'analyse modifiée : {resolution} ms.",
      "analysis.failure": "La nouvelle analyse a échoué.",
      "playback.error": "Lecture audio impossible : {message}",
      "playback.errorFallback": "Lecture audio impossible.",
      "selection.loadFailed": "Impossible de charger l'extrait sélectionné",
      "selection.changed": "La sélection a changé. Veuillez la lire à nouveau.",
      "selection.playError": "Lecture de la sélection impossible : {message}",
      "selection.playErrorFallback": "Lecture de la sélection impossible.",
      "upload.tooLarge":
        "Le fichier dépasse la limite de 250 Mo. Compressez ou raccourcissez l'audio.",
      "upload.busyTitle": "Chargement de l'audio",
      "upload.busyMessage": "Décodage de l'audio et calcul du RMS. Veuillez patienter.",
      "upload.success":
        "Audio chargé. Faites glisser la forme d'onde pour sélectionner un extrait.",
      "upload.failure": "Le traitement audio a échoué. Veuillez réessayer.",
      "busy.defaultTitle": "Analyse de l'audio",
      "busy.defaultMessage":
        "Décodage et calcul de la forme d'onde RMS. Veuillez patienter.",
      "channels.mono": "Mono",
      "channels.multiple": "{count} canaux",
      "units.milliseconds": "{value} ms",
      "units.seconds": "{value} s",
      "errors.requestFailed": "Échec de la requête ({status})",
      "errors.detailSeparator": " ; ",
      "apiKey.show": "Afficher la clé API",
      "apiKey.hide": "Masquer la clé API",
    },
    de: {
      "app.title": "WaveCraft · Audioeditor",
      "app.description":
        "WaveCraft ist ein Audioeditor im Browser für RMS-Wellenformanalyse, Erkennung schwacher Pegel, Auswahlvorschau, Löschen und Audioexport.",
      "app.brandHome": "WaveCraft Startseite",
      "app.skip": "Zum Hauptinhalt springen",
      "language.interface": "Sprache der Benutzeroberfläche",
      "header.waitingFile": "Warten auf Audiodatei",
      "header.undo": "Löschen rückgängig",
      "header.format": "Format",
      "header.exportFormat": "Exportformat",
      "header.exportTitle":
        "Aktuelle Auswahl exportieren oder die vollständige Audiodatei exportieren, wenn nichts ausgewählt ist",
      "header.exportAudio": "Audio exportieren",
      "header.exportSelection": "Auswahl exportieren",
      "header.defaultExport": "{format} als Standard",
      "upload.eyebrow": "Audioarbeitsbereich im Browser",
      "upload.titleLead": "Höre jeden",
      "upload.titleAccent": "Atem des Klangs",
      "upload.intro":
        "Analysiere RMS-Wellenformen und erkenne leise Abschnitte automatisch. Ziehe eine Auswahl auf, um sie anzuhören, zu exportieren oder zu löschen.",
      "upload.formatsAria": "Unterstützte Audioformate",
      "upload.dropTitle": "Audiodatei ablegen oder zum Auswählen klicken",
      "upload.dropSubtitle": "Max. 250 MB · Automatische verlustfreie PCM-Konvertierung",
      "upload.help":
        "Die erste Analyse dekodiert die Audiodatei. Bei längeren Dateien kann dies einige Sekunden dauern.",
      "upload.featuresAria": "Hauptfunktionen",
      "upload.feature1Title": "Detaillierte RMS-Wellenform",
      "upload.feature1Body":
        "50–200 ms Analysegenauigkeit und horizontales Scrollen durch die gesamte Datei.",
      "upload.feature2Title": "Automatische Stille-Erkennung",
      "upload.feature2Body":
        "Abschnitte unter dem Schwellenwert werden automatisch markiert; der Schwellenwert reagiert sofort.",
      "upload.feature3Title": "Direkt nutzbare Auswahlen",
      "upload.feature3Body": "Anhören, als WAV exportieren oder unerwünschte Abschnitte entfernen.",
      "editor.eyebrow": "Aktueller Arbeitsbereich",
      "editor.title": "Audioübersicht",
      "editor.infoAria": "Audioinformationen",
      "editor.duration": "Dauer",
      "editor.sampleRate": "Abtastrate",
      "editor.channels": "Kanäle",
      "transport.aria": "Wiedergabesteuerung",
      "transport.toStart": "Zum Anfang springen",
      "transport.play": "Abspielen",
      "transport.pause": "Pause",
      "transport.playPauseTitle": "Abspielen / pausieren (Leertaste)",
      "transport.resolution": "Analysegenauigkeit",
      "transport.zoomAria": "Wellenform-Zoom",
      "transport.zoomOut": "Zeitachse verkleinern",
      "transport.zoomOutTitle": "Verkleinern",
      "transport.zoomIn": "Zeitachse vergrößern",
      "transport.zoomInTitle": "Vergrößern",
      "transport.fit": "An Fenster anpassen",
      "timeline.scrollerAria": "Horizontal scrollbare RMS-Zeitachse",
      "timeline.canvasAria":
        "RMS-Wellenform. Ziehen wählt einen Ausschnitt aus, Doppelklick fügt eine Marke hinzu. Mit den Pfeiltasten wird die Abspielposition bewegt, mit Umschalt plus Pfeiltasten die Auswahl angepasst.",
      "timeline.help":
        "Ziehen zum Auswählen · Doppelklick für Marke · Umschalt + Mausrad zum Scrollen",
      "timeline.legendAria": "Legende",
      "timeline.normalLevel": "Normaler Pegel",
      "timeline.lowLevel": "Niedriger Pegel",
      "timeline.selection": "Auswahl",
      "timeline.transcript": "Transkript",
      "timeline.transcriptShort": "TEXT",
      "timeline.peak": "Spitze",
      "inspector.aria": "Audioinspektor",
      "lowLevel.kicker": "Pegelerkennung",
      "lowLevel.title": "Abschnitte mit niedrigem Pegel",
      "lowLevel.auto": "Auto",
      "lowLevel.threshold": "Schwellenwert",
      "lowLevel.note":
        "Fortlaufende RMS-Abschnitte unter dem Schwellenwert werden markiert. Eine Änderung des Schwellenwerts aktualisiert die Ergebnisse sofort.",
      "selection.kicker": "Aktiver Bereich",
      "selection.title": "Aktuelle Auswahl",
      "selection.clear": "Aufheben",
      "selection.empty":
        "Ziehe horizontal über die Wellenform, um einen Tonabschnitt auszuwählen.",
      "selection.start": "Start",
      "selection.end": "Ende",
      "selection.selected": "Ausgewählt",
      "selection.accuracy":
        "Vorschauen werden serverseitig präzise zugeschnitten. Exporte erhalten automatische 5-ms-Blenden, um Knackgeräusche zu vermeiden.",
      "selection.play": "Auswahl abspielen",
      "selection.delete": "Aus Audio löschen",
      "asr.kicker": "Sprache zu Text",
      "asr.title": "Spracherkennung",
      "asr.optional": "Optional",
      "asr.configure": "OpenAI-kompatiblen Endpunkt konfigurieren",
      "asr.baseUrl": "Basis-URL oder vollständige Transkriptions-URL",
      "asr.baseUrlExample": "https://api.openai.com/v1",
      "asr.apiKey": "API-Schlüssel",
      "asr.apiKeyHelp": "Kann für lokale Dienste leer bleiben",
      "asr.model": "Modell",
      "asr.language": "Sprache",
      "asr.autoDetect": "Automatisch erkennen",
      "asr.processing": "Verarbeitungsmodus",
      "asr.segments": "Automatische Segmente",
      "asr.whole": "Gesamte Datei",
      "asr.chunkDuration": "Segmentdauer",
      "asr.seconds": "{value} s",
      "asr.seconds15": "15 s",
      "asr.seconds30": "30 s",
      "asr.seconds45": "45 s",
      "asr.seconds60": "60 s",
      "asr.privacy":
        "Der API-Schlüssel wird nur mit dieser Anfrage an das Backend dieser Anwendung und anschließend an den konfigurierten Dienst gesendet. Er wird nicht auf dem Datenträger gespeichert.",
      "asr.start": "Transkription starten",
      "asr.baseRequired": "Gib zuerst die Basis-URL eines kompatiblen Endpunkts ein.",
      "asr.modelRequired": "Gib den Namen des ASR-Modells ein.",
      "asr.progressSegments": "{count} Segmente werden transkribiert…",
      "asr.progressWhole": "Transkription läuft…",
      "asr.statusSegments":
        "Transkription in {seconds}-Sekunden-Segmenten, insgesamt {count} Segmente.",
      "asr.statusWhole":
        "Die vollständige Audiodatei wird gesendet. Warten auf die Antwort des Endpunkts.",
      "asr.stale":
        "Die Audiodatei hat sich während der Transkription geändert. Das Ergebnis wurde verworfen; bitte erneut versuchen.",
      "asr.completed": "Transkription abgeschlossen: {count} Segmente · Modell {model}.",
      "asr.success":
        "Spracherkennung abgeschlossen. Der Text ist an der Zeitachse ausgerichtet.",
      "asr.failure":
        "Spracherkennung fehlgeschlagen. Prüfe die Konfiguration des Endpunkts.",
      "transcript.kicker": "Transkript",
      "transcript.title": "Transkript",
      "transcript.clearAria": "Transkript löschen",
      "transcript.clearTitle": "Transkript löschen",
      "transcript.note": "Wähle einen Textblock, um zu seinem Zeitbereich zu springen.",
      "transcript.unknown": "Keine Sprache erkannt",
      "transcript.deleteAria": "Dieses Transkriptsegment löschen",
      "transcript.cleared": "Transkript gelöscht.",
      "labels.kicker": "Zeitmarken",
      "labels.title": "Zeitmarken",
      "labels.addAria": "Marke an der Abspielposition hinzufügen",
      "labels.addTitle": "Marke an der Abspielposition hinzufügen (L)",
      "labels.note":
        "Wähle eine Marke zum Springen. Automatische Marken können einzeln gelöscht werden.",
      "labels.lowLevel": "Niedriger Pegel",
      "labels.manual": "Manuelle Marke {number}",
      "labels.emptyThreshold":
        "Bei diesem Schwellenwert wurden keine Abschnitte mit niedrigem Pegel erkannt. Erhöhe ihn gegebenenfalls.",
      "labels.emptyDisabled":
        "Automatische Marken sind ausgeschaltet. Füge an der Abspielposition eine manuelle Marke hinzu.",
      "labels.deleteAria": "Marke {title} löschen",
      "labels.deleteTitle": "Marke löschen",
      "labels.alreadyExists": "An dieser Position gibt es bereits eine manuelle Marke.",
      "labels.added": "Marke bei {time} hinzugefügt.",
      "labels.deleted": "Marke gelöscht.",
      "delete.title": "Ausgewählten Ausschnitt löschen?",
      "delete.bodyPrefix": "Dadurch wird",
      "delete.bodySuffix":
        " aus dem aktuellen Audio entfernt. Das letzte Löschen kann rückgängig gemacht werden.",
      "delete.confirmFallback": "Den ausgewählten Audioausschnitt löschen?",
      "delete.cancel": "Abbrechen",
      "delete.confirm": "Löschen",
      "delete.busyTitle": "Ausschnitt wird gelöscht",
      "delete.busyMessage":
        "Wellenform wird zusammengesetzt und RMS neu berechnet. Bitte warten.",
      "delete.success":
        "Ausschnitt gelöscht. Über „Löschen rückgängig“ kann er wiederhergestellt werden.",
      "delete.failure": "Ausschnitt konnte nicht gelöscht werden. Bitte erneut versuchen.",
      "undo.busyTitle": "Audio wird wiederhergestellt",
      "undo.busyMessage": "Audio vom Stand vor dem letzten Löschen wird neu geladen.",
      "undo.success": "Das Audio wurde wiederhergestellt.",
      "undo.failure": "Das Löschen konnte nicht rückgängig gemacht werden.",
      "export.scopeSelection": "Ausgewählter Ausschnitt",
      "export.scopeFull": "Vollständiges Audio",
      "export.busyTitle": "{format} wird exportiert",
      "export.busyMessage": "{scope} wird kodiert. Bitte warten.",
      "export.success": "Export abgeschlossen: {scope} als {format}.",
      "export.failure": "Export fehlgeschlagen. Bitte erneut versuchen.",
      "analysis.busyTitle": "Audio wird erneut analysiert",
      "analysis.busyMessage": "RMS-Wellenform mit {resolution} ms Genauigkeit wird berechnet.",
      "analysis.success": "Analysegenauigkeit auf {resolution} ms geändert.",
      "analysis.failure": "Erneute Analyse fehlgeschlagen.",
      "playback.error": "Audio kann nicht abgespielt werden: {message}",
      "playback.errorFallback": "Audio kann nicht abgespielt werden.",
      "selection.loadFailed": "Auswahl-Audio konnte nicht geladen werden",
      "selection.changed": "Die Auswahl hat sich geändert. Bitte erneut abspielen.",
      "selection.playError": "Auswahl kann nicht abgespielt werden: {message}",
      "selection.playErrorFallback": "Auswahl kann nicht abgespielt werden.",
      "upload.tooLarge":
        "Die Datei überschreitet das Limit von 250 MB. Komprimiere oder kürze das Audio zuerst.",
      "upload.busyTitle": "Audio wird geladen",
      "upload.busyMessage": "Audio wird dekodiert und RMS berechnet. Bitte warten.",
      "upload.success":
        "Audio geladen. Ziehe über die Wellenform, um einen Ausschnitt auszuwählen.",
      "upload.failure": "Audioverarbeitung fehlgeschlagen. Bitte erneut versuchen.",
      "busy.defaultTitle": "Audio wird analysiert",
      "busy.defaultMessage":
        "RMS-Wellenform wird dekodiert und berechnet. Bitte warten.",
      "channels.mono": "Mono",
      "channels.multiple": "{count} Kanäle",
      "units.milliseconds": "{value} ms",
      "units.seconds": "{value} s",
      "errors.requestFailed": "Anfrage fehlgeschlagen ({status})",
      "errors.detailSeparator": "; ",
      "apiKey.show": "API-Schlüssel anzeigen",
      "apiKey.hide": "API-Schlüssel ausblenden",
    },
  };

  const STORAGE_KEY = "wavecraft.language";
  const SUPPORTED_LANGUAGES = Object.keys(TRANSLATIONS);
  const LOCALE_TAGS = {
    zh: "zh-CN",
    en: "en",
    fr: "fr",
    de: "de",
  };

  function normalizeLanguage(value) {
    const normalized = String(value || "")
      .trim()
      .toLowerCase()
      .split("-")[0];
    return SUPPORTED_LANGUAGES.includes(normalized) ? normalized : null;
  }

  function initialLanguage() {
    const queryLanguage = normalizeLanguage(
      new URLSearchParams(window.location.search).get("lang"),
    );
    if (queryLanguage) return queryLanguage;

    try {
      const storedLanguage = normalizeLanguage(localStorage.getItem(STORAGE_KEY));
      if (storedLanguage) return storedLanguage;
    } catch {
      // Storage may be unavailable in privacy modes.
    }

    for (const language of navigator.languages || [navigator.language]) {
      const normalized = normalizeLanguage(language);
      if (normalized) return normalized;
    }
    return "zh";
  }

  let currentLanguage = initialLanguage();

  function t(key, values = {}, language = currentLanguage) {
    const template =
      TRANSLATIONS[language]?.[key] ??
      TRANSLATIONS.en[key] ??
      TRANSLATIONS.zh[key] ??
      key;
    return String(template).replace(/\{(\w+)\}/g, (match, name) =>
      Object.hasOwn(values, name) ? String(values[name]) : match,
    );
  }

  function formatNumber(value, options = {}) {
    return new Intl.NumberFormat(LOCALE_TAGS[currentLanguage], options).format(value);
  }

  function translateElement(root = document) {
    root.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });
    root.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
      element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
    });
    root.querySelectorAll("[data-i18n-title]").forEach((element) => {
      element.setAttribute("title", t(element.dataset.i18nTitle));
    });
    root.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
    });
    root.querySelectorAll("[data-i18n-content]").forEach((element) => {
      element.setAttribute("content", t(element.dataset.i18nContent));
    });

    document.title = t("app.title");
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", t("app.description"));
  }

  function updateLanguageUrl(language) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("lang", language);
      window.history.replaceState(null, "", url);
    } catch {
      // URL updates are a convenience; language switching still works without them.
    }
  }

  function apply(language = currentLanguage) {
    currentLanguage = normalizeLanguage(language) || "zh";
    document.documentElement.lang = LOCALE_TAGS[currentLanguage];
    document.documentElement.dataset.language = currentLanguage;
    translateElement();
    const selector = document.getElementById("languageSelect");
    if (selector) selector.value = currentLanguage;
    return currentLanguage;
  }

  function setLanguage(language, options = {}) {
    const nextLanguage = normalizeLanguage(language);
    if (!nextLanguage) return currentLanguage;
    currentLanguage = nextLanguage;
    if (options.persist !== false) {
      try {
        localStorage.setItem(STORAGE_KEY, currentLanguage);
      } catch {
        // Language still applies for the current page when storage is unavailable.
      }
    }
    if (options.updateUrl !== false) updateLanguageUrl(currentLanguage);
    apply(currentLanguage);
    options.onChange?.(currentLanguage);
    return currentLanguage;
  }

  function init(onChange) {
    apply(currentLanguage);
    const selector = document.getElementById("languageSelect");
    selector?.addEventListener("change", () => {
      setLanguage(selector.value, { onChange });
    });
    return currentLanguage;
  }

  window.WaveCraftI18n = {
    init,
    t,
    apply,
    setLanguage,
    formatNumber,
    getLanguage: () => currentLanguage,
    hasKey: (language, key) =>
      Object.hasOwn(TRANSLATIONS[normalizeLanguage(language) || ""] || {}, key),
    supportedLanguages: [...SUPPORTED_LANGUAGES],
  };
})();
