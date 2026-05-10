# MITA Plant Interaction Demo

MITA 是一个面向植物场景探索的交互式 Web Demo。前端使用 Vite + A-Frame/Three.js 呈现 360 全景、3D 植物模型和交互面板；后端提供意图解析、植物信息生成、歧义澄清和植物比较接口。

## 运行方式

项目需要同时启动前端和后端两个进程。

### 1. 启动前端

在项目根目录运行：

```powershell
npm.cmd run dev
```

前端由 Vite 启动，默认访问地址通常是：

```text
http://localhost:5173
```

### 2. 启动后端

另开一个终端，在项目根目录运行：

```powershell
npm.cmd run server
```

该命令会执行根目录 `package.json` 中的 `server` 脚本，并转到 `server` 目录运行后端：

```text
npm --prefix server run dev
```

后端默认提供 `/api` 接口，例如：

```text
GET  /api/health
POST /api/parse-intent
POST /api/generate-info
POST /api/generate-disambiguation
POST /api/clarify
POST /api/compare
```

> PowerShell 中建议使用 `npm.cmd`。如果环境支持，也可以使用 `npm run dev` 和 `npm run server`。

## 已实现的 Task

### Task 1: 3D 场景中的植物识别与选择

关键点：

- 使用全景图片构建多个植物场景，并通过场景导航切换不同区域。
- 支持 GLB 植物模型加载；没有模型的植物使用 fallback geometry 显示，保证场景中仍有可点击目标。
- 使用 Raycaster / 点击事件选择植物，并把选中的植物同步到右侧信息面板。
- 植物数据集中维护名称、别名、模型路径、位置、描述、药用信息和属性，避免把内容写死在 UI 逻辑里。

### Task 2: 指代表达和歧义消解

关键点：

- 用户可以问类似 `what is this`、`what plant am I looking at` 的问题。
- 当前视野或当前场景中有多个候选植物时，会进入 Referential Ambiguity 流程。
- 系统为候选植物生成 A/B/C 标记，用户可以点击候选项，也可以输入或语音回答字母。
- 如果语音识别或回答无法匹配，系统会提示用户重新选择，并在多次失败后引导用户直接点击目标植物。

### Task 3: 植物属性查询与药用价值展示

关键点：

- 支持查询植物属性，例如药用价值、植物基础信息等。
- 当用户询问 medicinal value / medical / herbal use 时，会打开专门的药用信息面板。
- 如果用户询问暂不支持的兴趣点，例如 symbolism、feng shui，会显示 fallback 交互，引导用户查看已支持的 botanical features 或 medicinal value。
- 信息生成优先走后端 LLM 接口；失败时保留本地 fallback，避免核心交互完全中断。

### Task 4: 植物比较

关键点：

- 支持比较当前选中植物和另一个植物，例如：

```text
Is this more drought tolerant than the giant water lily?
```

- 比较面板会展示两个植物的描述和关键属性，包括 drought tolerance、height、lifespan、medicinal value。
- 比较目标优先从用户访问历史中查找；如果历史中没有，则回退到全局植物数据库。
- 后端 `/api/compare` 接口负责生成自然语言比较回答，前端负责展示结构化对比结果。

### Task 5: 语音输入、文本输入和对话反馈

关键点：

- 页面提供文本输入和 Speak 按钮，支持手动输入和语音识别。
- 用户问题会被记录到 voice log，便于展示交互过程。
- 关键交互结果会通过 TTS 播放，例如选中植物、歧义提示、比较结果和 fallback 提示。
- 前端保存当前场景、当前选中植物、歧义候选、访问历史和语音失败次数，用于维持上下文。

### Task 6: 前后端 LLM 接口拆分

关键点：

- 前端通过 `src/intent/llmClient.js` 调用后端 API，不直接暴露模型调用细节。
- 后端按 `config`、`services`、`handlers` 分层组织，负责意图解析、澄清、信息生成和比较回答。
- Vite 使用 `/api` 代理到后端，前端开发时可以直接调用同源 `/api/...`。
- 意图解析支持 LLM 优先、本地规则 fallback 的策略，提高开发和演示稳定性。

## 计划实现的功能

- 历史比较：支持用户问“这个选中的植物和上一个选中的植物相比，谁更耐旱一些？”，系统根据 `visitedPlantIds` 找到上一次选中的植物并自动比较。
- 更完整的比较属性：除了耐旱性，还支持光照需求、浇水频率、适合室内/室外、养护难度等。
- 多轮追问：用户可以先选择植物，再问“那它有什么药用价值？”、“它和刚才那个比呢？”，系统自动继承上下文。
- 更强的目标解析：支持“左边那个”、“靠近水边的那个”、“最高的那个”等空间描述。
- 植物历史面板：把访问过的植物按时间展示，并允许用户从历史中重新选择、比较或查看详情。
- 更丰富的数据来源：为每个植物补充图片、来源链接、养护建议和医学免责声明。
- 离线演示模式：在没有 LLM API 的情况下，使用更完整的本地规则和模板生成回答。
