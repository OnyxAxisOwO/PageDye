# PageDye

给任意网站设置自定义背景——纯色、渐变、图片或动态特效壁纸，按站点独立保存，完全本地、无追踪、无网络请求。

支持 **Chrome / Edge / Brave** 等 Chromium 内核浏览器，以及 **Firefox**（含 Firefox for Android）。手机 / 平板可以用精简的 **PageDye Lite** 用户脚本（Android 上的 Edge / Firefox、iOS/iPadOS 上的 Safari）。

## 功能特性

- **多种背景类型**：纯色、线性/径向渐变、图片（本地文件或 URL）、五种黑白动态特效壁纸（Matrix 雨、粒子、波浪、星空、水波纹）
- **磨砂玻璃**：为指定卡片/容器元素加毛玻璃背景，透出下层壁纸，颜色、模糊度独立可调
- **昼夜双态联动**：跟随系统 `prefers-color-scheme` 自动切换浅色/深色壁纸
- **幻灯轮换**：多张壁纸按间隔（每次打开 / 15 分钟 / 30 分钟 / 1 小时 / 1 天）自动轮换，支持随机顺序
- **高级图片滤镜**：亮度、对比度、灰度、色相旋转、反色，实时预览
- **背景选择器（元素拾取器）**：当站点自身 CSS 遮挡整页背景时，直接把背景应用到指定元素
- **自定义 CSS**：为任意站点注入自定义样式
- **设置面板**：站点管理、备份/还原（含本地图片）、一键清空所有站点配置

## 安装

扩展尚未上架各浏览器商店，目前需要手动加载已解压的扩展包。

前往 [**Releases**](../../releases) 下载最新的正式版本 `.zip`，或前往 [**Actions**](../../actions) → 选择最近一次成功的运行 → 下载页面底部的 artifact，然后解压。

### Chrome / Edge / Brave 等 Chromium 内核浏览器

1. 地址栏输入 `chrome://extensions`（Edge 为 `edge://extensions`）。
2. 打开右上角的**开发者模式**。
3. 点击**加载已解压的扩展程序**，选择解压后的文件夹。

### Firefox（需 140 及以上版本；Firefox for Android 需 142 及以上）

扩展未经 Mozilla 签名，只能以“临时扩展”方式加载，**浏览器重启后需要重新加载一次**：

1. 地址栏输入 `about:debugging#/runtime/this-firefox`。
2. 点击**临时载入附加组件…**。
3. 选择解压后文件夹内的 `manifest.json`。

## 手机 / 平板安装（PageDye Lite）

手机浏览器大多没有完整扩展开发者模式，PageDye 额外提供了一个精简的 [**PageDye Lite**](userscript/pagedye.user.js) 用户脚本（UserScript）版本，通过脚本管理器运行，核心渲染逻辑和正式扩展版共享，功能是完整版的子集（多站点仪表盘、跨标签页实时联动、右键菜单入口等在脚本内说明里列了取舍）。

### Android — Edge / Firefox

1. 安装脚本管理器 [Tampermonkey](https://www.tampermonkey.net/)：Edge、Firefox 移动版现在都已支持在扩展/附加组件商店里直接搜索安装 Tampermonkey。
2. 打开 Tampermonkey，新建一个脚本。
3. 打开 [`userscript/pagedye.user.js`](userscript/pagedye.user.js) 文件，全选复制其内容，粘贴进去覆盖默认模板，保存。

> Chrome 移动版官方不支持任何扩展，无法安装 Tampermonkey；需要用 Chromium 内核浏览器的话可以换 Edge、Firefox，或 Kiwi Browser 等支持扩展的第三方分支。

### iOS / iPadOS — Safari

1. App Store 搜索安装 **Userscripts**（作者 Quoid，免费开源）。
2. 设置 → Safari → 扩展 → 启用 **Userscripts**，并允许在所有网站上运行。
3. 打开 [`userscript/pagedye.user.js`](userscript/pagedye.user.js) 复制内容，在 Userscripts App 里新建脚本并粘贴保存。

安装完成后，打开任意网站，右下角会出现一个悬浮按钮，点开即为设置面板；按钮的颜色、大小、图标、拖动、贴边隐藏都可以在面板的**高级设置**标签页里自定义。

## 使用

1. 访问任意网站，点击 PageDye 图标。
2. 选择背景类型（纯色 / 渐变 / 图片 / 特效），调整不透明度、模糊度等参数，保存即可生效。

对于大多数网站，到这里就完成了。若网站自身的 CSS 遮挡了整页背景，请使用下方的背景选择器。

## 背景选择器（元素拾取器）

部分网站会用自己的不透明元素覆盖页面背景，导致整页覆盖层不可见。背景选择器允许你将背景直接应用到任意元素上。

打开**高级设置 → 背景选择器**，先配置好颜色或图片，再点击**拾取**。弹窗关闭后，页面上会出现一个蓝色高亮框跟随鼠标移动，同时显示当前元素的 CSS 选择器。**点击**即可将背景应用到该元素，按 **Esc** 取消。

背景通过 `!important` 直接作用于目标元素（图片模式使用 `::before` 层，确保不透明度和模糊效果不影响元素内的文字和子元素）。效果立即生效，刷新页面后依然保留。

也可以跳过拾取，直接手动输入 CSS 选择器（如 `#app`、`.layout-bg`）。

## 设置面板

点击弹窗底部的**设置**（或右键扩展图标 → 选项）打开完整的设置面板，可以：

- 查看和编辑所有已配置站点的背景设置
- 导出 / 导入备份（JSON，含 base64 编码的本地图片）
- 一键清空所有站点配置

## 许可证

[MIT](LICENSE)
