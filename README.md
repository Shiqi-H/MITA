# 任务进度

- [x] 3D 场景构建，支持自由转动视角，场景之间可切换。
- [x] 导入外部植物模型，支持调整大小与位置；缺少模型的植物使用 fallback geometry 展示。
- [x] 植物、场景、意图关键词数据已从 `main.js` 拆分到独立 JSON 文件。
- [x] 前端结构已拆分为 `app`、`scene`、`speech`、`intent`、`ui`、`data` 等模块。
- [x] 支持英文文本输入与浏览器语音输入，系统使用英文 UI 与英文 TTS 输出。
- [x] Task 1 已实现虚拟视觉射线选择：点击 3D 场景时通过 Raycaster 收集命中的植物模型。
- [x] Task 1 已实现歧义处理：当射线命中两个或以上植物时，显示 `Referential Ambiguity` 窗口。
- [x] Task 1 已实现 A/B 植物标识，输入对应字母可完成消歧。
- [x] Task 2 已实现历史访问记录与当前选中对象，用于植物耐旱性对比。
- [x] Task 2 已实现对比面板，可对比当前植物与 Giant Water Lily 的 drought tolerance。
- [x] Task 3 已实现药用价值意图识别，支持打开 medicinal focus 面板。
- [x] 植物详情窗口底部已加入统一输入栏，可继续询问当前植物相关问题。
- [x] Speak 图标支持语音输入动画，再次点击可停止语音输入。
- [x] 状态栏已调整到顶部，避免遮挡底部植物模型。
- [x] 已保留本地规则解析与后端 LLM API 两套意图解析方案。
- [x] 后端已按 `config`、`services`、`handlers` 拆分，并支持通过环境变量接入 NewAPI 模型。
- [x] Vite 已配置 `/api` 代理到本地后端，便于前端调用真实 LLM 服务。