# MITA - Botanical Garden
**基于 A-Frame (WebVR) 框架的多模态植物园导览项目**

## 项目结构
```
├── index.html               # 核心渲染骨架  
├── src/  
│   └── main.js              # 核心逻辑：场景配置、导航控制与模型渲染  
└── public/                  # 场景资源  
    ├── scene-1.jpg          # 全景图  
    ├── arrow.svg            # UI 导航图标  
    └──models/               # 模型  
       ├── Lavandula.glb  
       └── ...
```

## 快速开始
1.克隆仓库
```bash
git clone https://github.com/Shiqi-H/MITA.git
```

2.环境配置  
本项目依赖 **Node.js** 环境进行开发与调试。
- 安装 Node.js：请前往官网下载并安装 LTS 版本。
- 安装依赖包：在项目根目录下运行以下命令，安装 A-Frame 以及相关开发工具。
```bash
npm install
```

3.运行  
执行以下命令启动本地开发服务器。
```bash
npm run dev
```
启动后，控制台会输出一个本地地址（如 http://localhost:5173），在浏览器中打开该地址即可开始预览。

## 任务进度
- [x] 3D 场景构建，支持自由转动视角，场景之间可切换。
- [x] 导入外部模型，支持调整大小与位置。