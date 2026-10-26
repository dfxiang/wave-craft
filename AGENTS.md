# 仓库协作约定

## 远端同步

- 本项目从 GitHub fork 后同步到自建 GitLab。任何需要提交的改动都必须同时推送到 GitLab 和 GitHub。
- GitLab `origin`：`ssh://git@git:2222/danny/wave-craft.git`
- GitHub `github`：`https://github.com/dfxiang/wave-craft.git`
- 完成改动后逐一验证两个远端都已包含目标提交。若缺少 GitHub 远端或任一侧推送失败，明确指出并停止，不以仅推送到单一远端作为完成。
