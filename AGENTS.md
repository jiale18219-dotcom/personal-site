# AGENTS.md — 项目 AI 助手指令

## AgentMemory 记忆共享

本项目的记忆通过 AgentMemory 共享，跨 Cursor / Claude Code / Codex 互通。

### 会话启动
新会话开始后，立即调用 `agent_memory_get_context`，参数 `project="personalSite"`，
加载本项目的全部历史记忆。然后基于加载的内容继续工作。

### 自动记忆
以下场景主动调用 `agent_memory_remember`，无需等待用户开口：
- 讨论架构/技术栈 → category: architecture
- 做出技术选型或决策 → category: decision
- 修复 Bug → category: bugfix
- 用户说明编码偏好 → category: preference
- 完成阶段性工作 → category: progress
- 用户说"记住" → 按内容判断

### 检索
- 用户引用历史时优先用 `agent_memory_search`（混合检索，命中率最高）
- 不确定时用 `agent_memory_search`，它同时覆盖语义和关键词

## 回复风格

- Do not send optional commentary. Do not include any text outside of code changes unless asked to explain.
