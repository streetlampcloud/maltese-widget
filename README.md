# Line Dog — 桌宠

Windows 桌面宠物，透明无边框窗口，置顶显示，根据时间与天气自动切换宠物状态图片。

## 功能

- 桌面宠物：透明无边框窗口，只显示宠物图片（gif/png/jpg），无多余 UI
- 单击摸摸：点击宠物切换到 happy 状态，3 秒后恢复
- 天气联动：每天早上和每个整点显示 1 分钟天气预报；单击时根据天气显示对应反应动画
- 时间状态：早上工作/摸鱼、午饭、午休、下午工作、晚餐、晚上娱乐、睡觉
- 天气状态：晴、多云、雨、雪、雷暴
- 拖拽模式：设置中开启后可拖动宠物到桌面任意位置
- 鼠标穿透：设置中开启后宠物不拦截鼠标点击
- 系统托盘：双击打开设置，右键菜单
- 设置窗口：独立 800×800 窗口，iOS 风格

## 开发

```bash
npm install
npm run dev
```

## 打包

```bash
npm run build
npm run package:win
```

输出 `release/Line Dog Widget.exe`，绿色便携版。

## 宠物素材

宠物图片放在 `public/assets/pet/`，文件名对应状态：
`idle.gif`, `happy.gif`, `morning_work.gif`, `morning_slack.gif`, `lunch.gif`,
`afternoon_nap.gif`, `afternoon_work.gif`, `dinner.gif`, `evening_play.gif`,
`night_sleep.gif`, `loading.gif`, `dragging.gif`, `cloudy.gif`, `rainy.gif`,
`snowy.gif`, `stormy.gif`, `sleepy.gif`, `error.gif`

Vite 会自动将 `public/` 复制到构建输出，无需额外配置。

## 技术栈

- Electron 33 + Vite 6 + React 19 + TypeScript
- Open-Meteo API（天气 & 地理编码）
- electron-builder 打包
