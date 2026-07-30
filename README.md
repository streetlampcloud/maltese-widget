# Line Dog Widget

一个基于 Electron 的 Windows 桌面小狗组件。它会以透明无边框窗口显示在桌面上，根据时间、天气和用户互动切换不同的小狗 GIF 状态，适合作为轻量陪伴型桌宠使用。

## 功能特性

- 透明桌宠窗口：无边框、默认置顶，可悬浮在桌面上。
- 小狗互动：点击桌宠会触发开心状态，并在短时间后恢复当前状态。
- 时间状态：根据一天中的时间自动切换工作、摸鱼、吃饭、午休、娱乐、睡觉等状态。
- 天气联动：支持城市搜索、当前天气获取、天气缓存，以及雨、雪、雷雨、多云等天气反应。
- 设置窗口：可配置城市、温度单位、天气刷新间隔、置顶、鼠标穿透、拖动模式、开机自启、透明度和动画速度。
- 系统托盘：支持从托盘打开设置、退出程序。
- 本地数据：设置和天气缓存写入 `.user-data/`，不会提交到仓库。

## 技术栈

- Electron 33
- React 19
- Vite 6
- TypeScript 5
- Open-Meteo API

## 目录结构

```text
line-dog-widget/
├─ electron/              # Electron 主进程与 preload
├─ public/assets/pet/     # 桌宠 GIF/图片资源
├─ src/                   # React 渲染进程代码
├─ index.html             # Vite 入口 HTML
├─ package.json           # 脚本与依赖
└─ README.md
```

## 开发运行

先安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

开发模式会同时启动 Vite 和 Electron。

## 构建

```bash
npm run build
```

构建后会生成：

- `dist/`：前端构建产物。
- `dist-electron/`：Electron 主进程与 preload 构建产物。

这些目录属于构建产物，已在 `.gitignore` 中忽略。

## 打包 Windows 程序

项目提供了 Windows 便携版打包脚本：

```bash
npm run package:win
```

注意：当前脚本依赖 `electron-builder`。如果本地没有安装，需要先执行：

```bash
npm install -D electron-builder
```

打包输出目录为 `release/`。该目录属于发布产物，默认不提交到仓库。

## 桌宠素材

桌宠素材放在：

```text
public/assets/pet/
```

当前使用的状态文件包括：

```text
idle.gif
loading.gif
happy.gif
dragging.gif
morning_work.gif
morning_slack.gif
lunch.gif
afternoon_nap.gif
afternoon_work.gif
dinner.gif
evening_play.gif
night_sleep.gif
cloudy.gif
rainy.gif
snowy.gif
stormy.gif
sleepy.gif
error.gif
```

代码会优先按状态名加载 `.gif`，并在资源缺失时尝试 `.png`、`.jpg`。如果仍然加载失败，会显示内置的线稿小狗降级图形。

## 本地数据与不提交内容

以下内容属于本地运行数据、缓存或构建产物，不应提交到 GitHub：

```text
node_modules/
.agents/
dist/
dist-electron/
release/
.npm-cache/
.electron-cache/
.user-data/
*.log
*.tsbuildinfo
```

其中 `.user-data/` 可能包含用户设置、天气缓存和窗口位置等本地数据。

## 版权声明

本仓库代码默认保留全部权利，除非后续单独添加明确的开源许可证文件，否则不得擅自复制、分发、修改后再发布或用于商业用途。

项目中涉及的“线条小狗”相关形象、名称、GIF、图片及其他素材，其版权、商标权和相关权益归原权利人所有。本项目仅作为个人学习、桌面美化和非商业用途整理使用；如需公开发布、传播、二次创作或商业使用，请自行确认素材授权与合规性。

如果你是相关权利人，认为本项目中的内容存在不当使用，请联系项目维护者处理。
