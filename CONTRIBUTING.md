# 贡献指南

感谢你愿意为 WaveCraft 出力。提交代码前，请先搜索现有 Issue，并确保改动范围清晰、
可以复现和验证。

## 环境要求

| 组件 | 版本 | 用途 |
| --- | --- | --- |
| Python | 3.12+ | 后端、音频处理与测试 |
| Docker + Compose v2 | 最新稳定版 | 容器化运行 |
| 现代浏览器 | 最新稳定版 | 前端交互验证 |

FFmpeg 由 `imageio-ffmpeg` 随 Python 依赖安装，本机开发不要求单独配置。

## 本地开发

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

浏览器访问 [http://localhost:8000](http://localhost:8000)。需要在干净环境验证部署时，
执行 `docker compose up -d --build`。

## 提交前检查

```bash
pytest -q
python -m compileall -q app.py
docker compose config
```

涉及音频编辑和导出的改动，至少应覆盖以下情况：

- WAV 与一种压缩格式的上传和导出；
- 选区首尾、极短选区和空选区等边界；
- 删除、撤销与重新分析后的状态一致性；
- ASR 接口成功、上游报错和 Key 不落盘。

## 代码约定

- Python 遵循 PEP 8，优先补充类型标注和可复现测试。
- 前端保持原生 JavaScript，不引入构建步骤；交互应兼容键盘操作和窄屏布局。
- API 变更同步更新 `README.md` 的接口列表。
- 不提交上传的音频、生成文件、API Key、访问令牌或真实用户数据。
- 提交信息建议使用 `类型(范围): 说明`，类型如 `feat`、`fix`、`docs`、`test`、`chore`。

## 安全问题

请不要通过公开 Issue 报告安全漏洞，按 [SECURITY.md](SECURITY.md) 的私下渠道提交。

## 许可

本项目采用 Apache-2.0 + Commons Clause（见 [LICENSE](LICENSE)）。你提交的贡献将按同一
许可分发，请确认你有权提交相关代码和素材。
