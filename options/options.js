document.addEventListener('DOMContentLoaded', async () => {
  const i18n = {
    en: {
      title: "PageDye Settings",
      appName: "PageDye",
      navSites: "Website Backgrounds",
      navCustomEffects: "Custom Effects",
      navAppearance: "Interface",
      navBackup: "Backup",
      navSettings: "Settings",
      navDebug: "Diagnostics",
      navAbout: "About",
      settingsTitle: "Settings",
      settingsHint: "Keep PageDye simple, or reveal tools for complex setups and troubleshooting.",
      advancedModeTitle: "Advanced mode",
      advancedModeHint: "Shows page rules, batch tools, custom effects, detailed storage controls, and diagnostics.",
      advancedModeOn: "Advanced tools are visible",
      advancedModeOff: "Using the simplified interface",
      debugTitle: "Diagnostics",
      debugHint: "Troubleshooting tools for checking why PageDye may not work as expected on a website.",
      debugEnable: "Show diagnostics on websites",
      debugEnableHint: "Adds a small diagnostics button to open tabs. Changes take effect immediately.",
      debugFeaturesTitle: "What's included",
      debugFeatureStateTitle: "State",
      debugFeatureState: "Live view of the current site's saved settings (mode, background type, Deep Compatibility Mode, Frosted Glass entries) and the raw JSON.",
      debugFeaturePerfTitle: "Performance",
      debugFeaturePerf: "Live FPS, frame time, and JS heap memory (where supported).",
      debugFeatureLogsTitle: "Logs",
      debugFeatureLogs: "A mirror of this page's console.log/warn/error output.",
      debugFeatureInspectorTitle: "Inspector",
      debugFeatureInspector: "Hover to highlight and click to lock an element, showing its tag/id/class, guessed selector, size and key computed styles.",
      appearanceTitle: "Interface",
      appearanceHint: "Choose how PageDye's popup and settings look. Website backgrounds are not affected.",
      pageBackground: "Page Background Image",
      pageBackgroundHint: "Upload an image for the outer area surrounding the dashboard panel.",
      containerBackground: "Container Background Image",
      containerBackgroundHint: "Upload an image for the sidebar and main panel.",
      appearanceReset: "Reset to Default",
      appearanceSaved: "Appearance updated!",
      appearanceResetDone: "Appearance reset!",
      disableThemeAnimation: "Reduce interface motion",
      disableThemeAnimationHint: "Removes most transitions from the PageDye popup and settings.",
      pauseShortcut: "Pause shortcut",
      pauseShortcutHint: "Use this shortcut to pause or resume PageDye on the website you are viewing.",
      pauseShortcutReset: "Reset",
      pauseShortcutRequirement: "Use at least one modifier key (Ctrl, Alt, Shift, or ⌘).",
      pauseShortcutInvalid: "Add a modifier key to the shortcut.",
      uiThemeColor: "Interface Theme Color",
      uiThemeColorHint: "Changes PageDye popup and settings colors only. Websites stay unchanged.",
      dragOrClick: "Drag image here, or",
      chooseFile: "choose file",
      savedImage: "Saved image",
      sitesTitle: "Website Backgrounds",
      sitesHint: "View and update the backgrounds you have saved.",
      urlRulesTitle: "Page Rules",
      urlRulesHint: "Use different backgrounds on specific pages, or leave a page unchanged.",
      newRule: "New Rule",
      createRule: "Save Rule",
      ruleAction: "What to do",
      ruleApply: "Use a background",
      ruleExclude: "Leave page unchanged",
      ruleType: "Which pages",
      ruleHostname: "Whole website",
      ruleExact: "One exact page",
      rulePrefix: "Pages under a path",
      ruleWildcard: "Website and subdomains",
      rulePattern: "Website or page address",
      rulePatternHint: "Examples: github.com, https://github.com/settings/profile, github.com/settings/*, *.example.com",
      rulePriority: "Order",
      ruleMatch: "Pages",
      ruleBehavior: "Result",
      ruleStatus: "On",
      noRules: "No page rules yet.",
      hostnameFallbacks: "Saved Websites",
      hostnameFallbacksHint: "Select a website to change its background.",
      invalidRulePattern: "Enter a valid pattern for the selected match type.",
      confirmDeleteRule: "Delete rule {pattern}?",
      ruleSaved: "URL rule saved!",
      searchPlaceholder: "Search domains...",
      thDomain: "Website",
      thBgType: "Background",
      thPreview: "Preview",
      thActions: "Actions",
      noSites: "No websites configured yet.",
      bgTypeNone: "None",
      bgTypeColor: "Color",
      bgTypeImage: "Image",
      bgTypeEffect: "Effect",
      deleteBtn: "Delete",
      confirmDelete: "Are you sure you want to delete settings for {domain}?",
      defaultBgRowLabel: "Default Background (All Sites)",
      defaultBgEditTitle: "Default Background (All Sites)",
      confirmDeleteDefault: "Clear the default background? Sites that were inheriting it will show nothing until given their own settings.",
      modalTitle: "Notification",
      confirmOk: "Confirm",
      confirmCancel: "Cancel",
      backupTitle: "Backup",
      backupHint: "Download a copy of your backgrounds and restore it later when needed.",
      exportCardTitle: "Download a backup",
      exportCardText: "Keep a copy of your saved website backgrounds and local images.",
      exportBtn: "Download Backup",
      importCardTitle: "Restore a backup",
      importCardText: "Choose a PageDye backup file you saved earlier.",
      importBtn: "Choose Backup File",
      dangerZoneTitle: "Clear saved backgrounds",
      dangerZoneText: "This removes every website background from PageDye and cannot be undone.",
      clearAllBtn: "Clear All Website Settings",
      clearAllConfirm: "Remove PageDye settings for ALL websites? This cannot be undone.",
      clearAllDone: "All sites cleared!",
      deleteSiteDone: "Site configuration removed!",
      aboutTitle: "About PageDye",
      aboutText: "PageDye lets you give each website its own color, image, gradient, or animated background. Your choices are saved in this browser and return automatically.",
      aboutAuthor: "Developer",
      aboutGithub: "Source Code",
      exportSuccess: "Backup exported successfully!",
      importSuccess: "Backup imported successfully!",
      importError: "Invalid backup file!",
      confirmImport: "Restoring this backup will replace all currently saved website backgrounds. Continue?",
      settings: "Settings",
      backToSites: "Back to Sites",
      editTitle: "Edit Website:",
      bgType: "Choose a Background",
      typeNone: "None",
      typeColor: "Color",
      typeImage: "Image",
      typeEffect: "Effects",
      effectKind: "Effect",
      effectKindHint: "Animated backgrounds are created on your device and do not download extra media.",
      effectMatrix: "Matrix",
      effectParticles: "Particles",
      effectWaves: "Waves",
      effectStarfield: "Starfield",
      effectRipple: "Ripple",
      effectAurora: "Aurora",
      effectSnow: "Snow",
      effectBubbles: "Bubbles",
      effectConstellation: "Constellation",
      effectFireflies: "Fireflies",
      effectGridPulse: "Grid Pulse",
      effectRain: "Rain",
      effectConfetti: "Confetti",
      effectPlasma: "Plasma",
      effectVortex: "Vortex",
      effectTypewriter: "Typewriter",
      effectText: "Text",
      effectColorScheme: "Color Preset",
      effectColorSchemeHint: "Auto follows your system's light/dark setting live.",
      effectSchemeAuto: "Auto",
      effectSchemeLight: "Light",
      effectSchemeDark: "Dark",
      effectSchemeCustom: "Custom",
      effectColor: "Color",
      effectBgColor: "Background Color",
      effectDensity: "Density",
      effectSpeed: "Speed",
      color: "Color",
      tabLocal: "Local File",
      tabUrl: "Web Image",
      orPasteUrl: "Or paste an image address",
      dropText: "Click or Drop image here",
      opacity: "Opacity",
      blur: "Blur",
      fixed: "Keep background fixed",
      sizeCover: "Fill the area",
      sizeContain: "Show the whole image",
      sizeAuto: "Original size",
      sizeStretch: "Stretch to fill",
      repeat: "Repeat",
      reset: "Reset",
      save: "Save",
      saved: "Saved!",
      resetMsg: "Reset!",
      error: "Error saving!",
      tabWallpaper: "Wallpaper",
      tabFrostedGlass: "Frosted Glass",
      advanced: "Developer Controls",
      targetSelector: "Background Selector",
      targetSelectorHint: "Pick an element (or type a CSS selector) and PageDye applies your color/image directly to that element instead of the whole page. Leave empty for a full-page background.",
      deepCompat: "Deep Compatibility Mode",
      runMode: "Website Compatibility",
      runModeHint: "If the background is covered, try Enhanced first. Use Strong only if the problem continues.",
      runModeNormal: "Standard",
      runModeEnhanced: "Enhanced",
      runModeStrong: "Strong",
      deepCompatBadge: "For stubborn sites",
      deepCompatEnable: "Enable for this site",
      deepCompatHint: "For stubborn sites (e.g. Google's mobile pages) where several stacked opaque containers hide the background no matter what. Automatically detects and neutralizes full-viewport opaque layers — including a mosaic of many small opaque cards, not just one big wrapper. May occasionally strip a background some element needed for contrast — use the exclude field below if so.",
      deepCompatAggressiveEnable: "Forceful compatibility mode",
      deepCompatAggressiveHint: "More aggressive: checks DOM/style changes very frequently and restores PageDye overrides. Use only on hostile sites; it may use more CPU.",
      deepCompatExcludePlaceholder: "Exclude selector (optional): .modal, [role=dialog]",
      frostedGlass: "Frosted Glass",
      frostedGlassHint: "Pick a card/container element and PageDye makes its background semi-transparent and blurred, so your wallpaper shows through underneath it.",
      frostedBlur: "Blur",
      frostedOpacity: "Tint",
      frostedCustomColor: "Custom Color",
      frostedAddBtn: "+ Add element",
      customCss: "Custom CSS",
      customCssHint: "Injected into this site. Use !important to override stubborn styles.",
      customEffectsTitle: "Custom Effects",
      customEffectsHint: "Write your own animated Canvas wallpaper and use it on any site. Custom Canvas code executes JavaScript, so only import effects from sources you trust. Extension only - not available in PageDye Lite.",
      newCustomEffect: "New Custom Effect",
      importEffectBtn: "Import",
      thEffectName: "Name",
      thEffectUpdated: "Updated",
      noCustomEffects: "No custom effects yet.",
      backToCustomEffects: "Back to Custom Effects",
      customEffectTypeLabel: "Effect Type",
      customEffectTypeCode: "Canvas Code",
      customEffectTypeUrl: "Website URL",
      effectUrlLabel: "Website URL",
      effectUrlHint: "Embed an HTTPS website in a sandboxed iframe background (HTTP is allowed only for localhost). Some websites may block embedding via X-Frame-Options/CSP.",
      customEffectInteractive: "Allow background interaction (clicks/scrolls)",
      customEffectInteractiveHint: "Note: Because the background is layered behind the webpage, you need to hold the **Alt** key on your keyboard to bring the background to the front and click/interact with it.",
      effectNameLabel: "Name",
      startFromTemplate: "Start from template",
      templateBlank: "Blank skeleton",
      templateWaves: "Waves source",
      templateParticles: "Particles source",
      effectCode: "Code",
      effectCodeHint: "Must evaluate to an object with init(cfg), resize(state, width, height) and draw(ctx, canvas, state, dt). The code runs in an isolated sandbox without extension APIs or network access. Helpers: window.PageDyeEffects.helpers.{hexToRgba, effectSpeedMultiplier, clampPercent}.",
      effectPreviewLabel: "Live Preview",
      exportEffectBtn: "Export",
      untitledEffect: "Untitled Effect",
      editBtn: "Edit",
      confirmDeleteEffect: "Delete custom effect \"{name}\"? Any site using it will fall back to Waves.",
      customEffectsOptgroup: "Custom",
      manageCustomEffects: "Manage custom effects…",
      autoScheme: "Auto Light/Dark",
      schemeLight: "Light Version",
      schemeDark: "Dark Version",
      wallpaperMode: "Background Schedule",
      modeSingle: "Always",
      modeAuto: "Light / Dark",
      modeTimeRange: "By Time",
      modeSlideshow: "Slideshow",
      rotationInterval: "Interval",
      intervalOpen: "Each Open",
      interval15m: "15 Mins",
      interval30m: "30 Mins",
      interval1h: "1 Hour",
      interval24h: "1 Day",
      randomOrder: "Random Order",
      wallpapersList: "Wallpapers",
      selectSchemeToEdit: "Select background to edit",
      selectTimeToEdit: "Select background to edit",
      schemeMorning: "Morning",
      schemeNoon: "Noon",
      schemeDusk: "Dusk",
      schemeNight: "Night",
      timeRangeSettingsTitle: "Custom Time Ranges",
      labelPeriodName: "Period Name:",
      labelPeriodRange: "Time Range:",
      advancedFilters: "More Image Adjustments",
      filtersReset: "Reset",
      filterBrightness: "Brightness",
      filterContrast: "Contrast",
      filterGrayscale: "Grayscale",
      filterHue: "Hue Rotate",
      filterInvert: "Invert",
      colorModeSolid: "Solid",
      colorModeGradient: "Gradient",
      gradientLinear: "Linear",
      gradientRadial: "Radial",
      gradientAngle: "Angle",
      gradientShape: "Shape",
      gradientShapeCircle: "Circle",
      gradientShapeEllipse: "Ellipse",
      gradientStops: "Color Stops",
      gradientAddStop: "+ Add Stop",
      gradientRemoveStop: "Remove stop",
      gradientPresets: "Style Palette",
      gradientExtractFromImage: "Extract from wallpaper",
      gradientExtractDisabledHint: "Set an image first to extract colors from it",
      gradientExtractFailed: "Couldn't read colors from this image",
      gradientGenerateFromColor: "Generate from color",
      gradientAnimated: "Animated",
      gradientSpeed: "Speed",
      statusSaving: "Saving...",
      statusSynced: "Saved"
    },
    zh: {
      title: "PageDye 设置",
      appName: "PageDye",
      navSites: "网站背景",
      navCustomEffects: "自定义动效",
      navAppearance: "界面外观",
      navBackup: "备份",
      navSettings: "设置",
      navDebug: "问题诊断",
      navAbout: "关于",
      settingsTitle: "设置",
      settingsHint: "保持界面简单，或按需显示复杂配置和排查工具。",
      advancedModeTitle: "高级模式",
      advancedModeHint: "显示页面规则、自定义动效、存储明细和问题诊断。",
      advancedModeOn: "高级工具已显示",
      advancedModeOff: "当前使用精简界面",
      debugTitle: "问题诊断",
      debugHint: "用于排查 PageDye 在某些网站上没有按预期显示的问题。",
      debugEnable: "在网页上显示诊断入口",
      debugEnableHint: "在已打开的网页右下角添加一个小按钮，更改后立即生效。",
      debugFeaturesTitle: "包含的功能",
      debugFeatureStateTitle: "状态",
      debugFeatureState: "实时查看当前网站已保存的设置(模式、背景类型、深度兼容模式、磨砂玻璃条目)以及原始 JSON。",
      debugFeaturePerfTitle: "性能",
      debugFeaturePerf: "实时 FPS、单帧耗时,以及 JS 堆内存占用(视浏览器支持情况而定)。",
      debugFeatureLogsTitle: "日志",
      debugFeatureLogs: "镜像当前页面的 console.log/warn/error 输出。",
      debugFeatureInspectorTitle: "元素检查",
      debugFeatureInspector: "悬停高亮、点击锁定某个元素,查看其标签/ID/class、猜测的选择器、尺寸和关键计算样式。",
      appearanceTitle: "界面外观",
      appearanceHint: "调整 PageDye 弹窗和设置页的样式，不会改变网站背景。",
      pageBackground: "页面背景图片",
      pageBackgroundHint: "为控制面板外层区域上传一张背景图片。",
      containerBackground: "容器背景图片",
      containerBackgroundHint: "为侧边栏与主面板上传一张背景图片。",
      appearanceReset: "恢复默认",
      appearanceSaved: "外观已更新!",
      appearanceResetDone: "外观已重置!",
      disableThemeAnimation: "减少界面动画",
      disableThemeAnimationHint: "关闭 PageDye 弹窗和设置页中的大部分过渡效果。",
      pauseShortcut: "暂停快捷键",
      pauseShortcutHint: "使用这个快捷键，可在当前浏览的网站上暂停或恢复 PageDye。",
      pauseShortcutReset: "重置",
      pauseShortcutRequirement: "请至少使用一个修饰键（Ctrl、Alt、Shift 或 ⌘）。",
      pauseShortcutInvalid: "请为快捷键添加一个修饰键。",
      dragOrClick: "拖拽图片至此，或",
      chooseFile: "选择文件",
      savedImage: "已保存的图片",
      sitesTitle: "网站背景",
      sitesHint: "查看和修改已经保存的网站背景。",
      urlRulesTitle: "页面规则",
      urlRulesHint: "让同一网站的特定页面使用不同背景，或保持原样。",
      hostnameFallbacks: "已保存的网站",
      hostnameFallbacksHint: "选择一个网站来修改它的背景。",
      searchPlaceholder: "搜索域名...",
      thDomain: "网站",
      thBgType: "背景",
      thPreview: "预览",
      thActions: "操作",
      noSites: "暂无已配置的网站。",
      bgTypeNone: "无",
      bgTypeColor: "颜色",
      bgTypeImage: "图片",
      bgTypeEffect: "动效",
      deleteBtn: "删除",
      confirmDelete: "确定要删除 {domain} 的配置吗？",
      defaultBgRowLabel: "所有网站默认背景",
      defaultBgEditTitle: "所有网站默认背景",
      confirmDeleteDefault: "确定要清除全站默认背景吗？之前依赖它的网站在单独设置背景之前将不显示任何背景。",
      modalTitle: "提示",
      confirmOk: "确定",
      confirmCancel: "取消",
      backupTitle: "备份",
      backupHint: "下载一份网站背景副本，需要时可随时恢复。",
      exportCardTitle: "下载备份",
      exportCardText: "保存所有网站背景和本地图片的副本。",
      exportBtn: "下载备份文件",
      importCardTitle: "恢复备份",
      importCardText: "选择以前保存的 PageDye 备份文件。",
      importBtn: "选择备份文件",
      dangerZoneTitle: "清除已保存的背景",
      dangerZoneText: "这会移除 PageDye 中所有网站背景，而且无法撤销。",
      clearAllBtn: "清除所有网站设置",
      clearAllConfirm: "确定要清除所有网站的 PageDye 设置吗？此操作无法撤销。",
      clearAllDone: "已清除全部网站!",
      deleteSiteDone: "网站配置已清除!",
      aboutTitle: "关于 PageDye",
      aboutText: "PageDye 可以为每个网站设置不同的颜色、图片、渐变或动态背景。所有选择都保存在当前浏览器中，下次打开网站时会自动恢复。",
      aboutAuthor: "开发者",
      aboutGithub: "项目源码",
      exportSuccess: "备份导出成功!",
      importSuccess: "备份导入成功!",
      importError: "无效的备份文件!",
      confirmImport: "恢复这份备份会替换当前保存的所有网站背景。确定继续吗？",
      settings: "设置",
      backToSites: "返回网站列表",
      editTitle: "编辑网站:",
      bgType: "选择背景",
      typeNone: "无",
      typeColor: "颜色",
      typeImage: "图片",
      typeEffect: "动效",
      effectKind: "特效",
      effectKindHint: "动态背景会直接在当前设备上生成，不会额外下载视频或图片。",
      effectMatrix: "代码雨",
      effectParticles: "粒子",
      effectWaves: "波浪",
      effectStarfield: "星空穿梭",
      effectRipple: "水波纹",
      effectAurora: "极光",
      effectSnow: "雪花",
      effectBubbles: "气泡",
      effectConstellation: "星座",
      effectFireflies: "萤火虫",
      effectGridPulse: "网格脉冲",
      effectRain: "雨丝",
      effectConfetti: "彩纸",
      effectPlasma: "流光",
      effectVortex: "漩涡",
      effectTypewriter: "打字机",
      effectText: "文字内容",
      effectColorScheme: "颜色预置",
      effectColorSchemeHint: "自动会实时跟随系统的浅色/深色设置。",
      effectSchemeAuto: "自动",
      effectSchemeLight: "浅色",
      effectSchemeDark: "深色",
      effectSchemeCustom: "自定义",
      effectColor: "颜色",
      effectBgColor: "背景颜色",
      effectDensity: "密度",
      effectSpeed: "速度",
      color: "颜色",
      tabLocal: "本地文件",
      tabUrl: "网络图片",
      orPasteUrl: "或粘贴图片网址",
      dropText: "点击或拖拽图片到此处",
      opacity: "不透明度",
      blur: "模糊度",
      fixed: "背景保持固定",
      sizeCover: "铺满区域",
      sizeContain: "完整显示",
      sizeAuto: "原始大小",
      sizeStretch: "拉伸填满",
      repeat: "平铺",
      reset: "重置",
      save: "保存",
      saved: "已保存!",
      resetMsg: "已重置!",
      error: "保存失败!",
      tabWallpaper: "壁纸",
      tabFrostedGlass: "磨砂玻璃",
      advanced: "开发者控制",
      targetSelector: "背景选择器",
      targetSelectorHint: "拾取一个元素（或手动输入 CSS 选择器），PageDye 会把颜色/图片直接应用到该元素，而不是整页。留空则为整页背景。",
      deepCompat: "深度兼容模式",
      runMode: "网页适配",
      runModeHint: "如果背景被网页挡住，先尝试“增强”；仍然无效时再使用“强力”。",
      runModeNormal: "标准",
      runModeEnhanced: "增强",
      runModeStrong: "强力",
      deepCompatBadge: "顽固网站专用",
      deepCompatEnable: "为此网站启用",
      deepCompatHint: "适用于顽固网站（例如 Google 移动端页面）：多层不透明容器叠在一起，导致无论怎么设置背景都被遮住。开启后会自动检测并清除铺满视口的不透明背景层——包括由许多小块不透明卡片拼成的情况，不只是单个大容器。可能偶尔误伤某些依赖背景色做对比度的元素，遇到这种情况可在下方填入排除选择器。",
      deepCompatAggressiveEnable: "强兼模式",
      deepCompatAggressiveHint: "更激进：高频检测 DOM/样式变化并反复恢复 PageDye 覆盖。只建议在防御很强的网站使用，可能明显增加性能消耗。",
      deepCompatExcludePlaceholder: "排除选择器（可选）：.modal, [role=dialog]",
      frostedGlass: "磨砂玻璃",
      frostedGlassHint: "拾取一个卡片/容器元素，PageDye 会让它的背景变为半透明并加上模糊效果，让底层的壁纸若隐若现地透上来。",
      frostedBlur: "模糊度",
      frostedOpacity: "透明度",
      frostedCustomColor: "自定义颜色",
      frostedAddBtn: "+ 添加元素",
      customCss: "自定义 CSS",
      customCssHint: "将注入到本网站。可用 !important 覆盖顽固样式。",
      customEffectsTitle: "自定义动效",
      customEffectsHint: "编写你自己的 Canvas 动态壁纸并在任意网站使用。Canvas 代码会执行 JavaScript，请只导入可信来源的动效。仅浏览器扩展版支持——PageDye Lite 暂不支持。",
      newCustomEffect: "新建自定义动效",
      importEffectBtn: "导入",
      thEffectName: "名称",
      thEffectUpdated: "更新时间",
      noCustomEffects: "还没有自定义动效。",
      backToCustomEffects: "返回自定义动效",
      customEffectTypeLabel: "动效类型",
      customEffectTypeCode: "Canvas 代码",
      customEffectTypeUrl: "网站 URL",
      effectUrlLabel: "网站 URL",
      effectUrlHint: "通过沙箱 iframe 将 HTTPS 网站嵌入为背景（HTTP 仅允许本机地址）。部分网站可能通过 X-Frame-Options/CSP 阻止嵌入。",
      customEffectInteractive: "允许与背景交互（点击/滚动）",
      customEffectInteractiveHint: "注意：由于背景层铺在网页底层，您需要在网页上按住 **Alt** 键即可临时将背景置顶并与其交互（点击/滚动）。",
      effectNameLabel: "名称",
      startFromTemplate: "起始模板",
      templateBlank: "空白骨架",
      templateWaves: "Waves 源码",
      templateParticles: "Particles 源码",
      effectCode: "代码",
      effectCodeHint: "代码需要返回包含 init(cfg)、resize(state, width, height)、draw(ctx, canvas, state, dt) 的对象。代码会在无扩展权限、禁止联网的隔离沙箱中运行。可用辅助函数：window.PageDyeEffects.helpers.{hexToRgba, effectSpeedMultiplier, clampPercent}。",
      effectPreviewLabel: "实时预览",
      exportEffectBtn: "导出",
      untitledEffect: "未命名动效",
      editBtn: "编辑",
      confirmDeleteEffect: "删除自定义动效“{name}”？正在使用它的站点会回退到 Waves。",
      customEffectsOptgroup: "自定义",
      manageCustomEffects: "管理自定义动效…",
      autoScheme: "昼夜双态联动",
      schemeLight: "日光版",
      schemeDark: "夜间版",
      wallpaperMode: "背景切换",
      modeSingle: "始终使用",
      modeAuto: "跟随深浅色",
      modeTimeRange: "按时段",
      modeSlideshow: "轮播",
      rotationInterval: "轮换间隔",
      intervalOpen: "每次打开",
      interval15m: "15分钟",
      interval30m: "30分钟",
      interval1h: "1小时",
      interval24h: "1天",
      randomOrder: "随机顺序",
      wallpapersList: "壁纸列表",
      selectSchemeToEdit: "选择要编辑的背景",
      selectTimeToEdit: "选择要编辑的背景",
      schemeMorning: "清晨",
      schemeNoon: "正午",
      schemeDusk: "黄昏",
      schemeNight: "深夜",
      timeRangeSettingsTitle: "自定义时段范围",
      labelPeriodName: "时段名称:",
      labelPeriodRange: "时间范围:",
      advancedFilters: "更多图片调整",
      filtersReset: "重置",
      filterBrightness: "亮度",
      filterContrast: "对比度",
      filterGrayscale: "灰度",
      filterHue: "色相旋转",
      filterInvert: "反色",
      colorModeSolid: "纯色",
      colorModeGradient: "渐变",
      gradientLinear: "线性",
      gradientRadial: "径向",
      gradientAngle: "角度",
      gradientShape: "形状",
      gradientShapeCircle: "圆形",
      gradientShapeEllipse: "椭圆形",
      gradientStops: "颜色节点",
      gradientAddStop: "+ 添加节点",
      gradientRemoveStop: "删除此节点",
      gradientPresets: "风格调色板",
      gradientExtractFromImage: "从壁纸提取",
      gradientExtractDisabledHint: "请先设置图片才能提取颜色",
      gradientExtractFailed: "无法从该图片提取颜色",
      gradientGenerateFromColor: "从颜色生成",
      gradientAnimated: "流动动画",
      gradientSpeed: "速度",
      statusSaving: "正在保存...",
      statusSynced: "已保存"
    }
  };

  let lang = 'en';

  const UI_THEME_KEY = '__pagedye_ui_theme__';
  const ADVANCED_MODE_KEY = '__pagedye_advanced_mode__';
  const PAUSE_SHORTCUT_KEY = '__pagedye_pause_shortcut__';
  const DEFAULT_PAUSE_SHORTCUT = { code: 'KeyP', altKey: true, shiftKey: true, ctrlKey: false, metaKey: false };
  const CUSTOM_EFFECTS_KEY = '__pagedye_custom_effects__';
  const DEBUG_MODE_KEY = '__pagedye_debug_mode__';
  const DEFAULT_BG_KEY = '__pagedye_default_background__';
  const URL_RULES_KEY = '__pagedye_url_rules_v081__';
  const SYSTEM_DARK_QUERY = window.matchMedia('(prefers-color-scheme: dark)');
  const UI_THEME_BASE_DEFAULTS = { pageBgImage: null, containerBgImage: null, accent: 'neutral', customAccent: '#18181b', disableAnimation: false };
  function getSystemUiThemeDefaults() {
    return { ...UI_THEME_BASE_DEFAULTS };
  }
  function normalizeUiTheme(value) {
    const saved = value && typeof value === 'object' ? value : {};
    // Colors from older versions are intentionally ignored. Surface colors are
    // now derived from the selected interface theme; only images are custom.
    const { pageBg, containerBg, backgroundMode, ...theme } = saved;
    return Object.assign({}, getSystemUiThemeDefaults(), theme);
  }
  let currentUiTheme = getSystemUiThemeDefaults();
  const UI_THEME_ACCENTS = {
    neutral: '#18181b',
    red: '#BA1A1A',
    pink: '#B3266E',
    purple: '#6750A4',
    indigo: '#445E91',
    blue: '#0061A4',
    cyan: '#006874',
    teal: '#006A6A',
    green: '#386A20',
    orange: '#8B5000'
  };

  // The base stylesheet only themes text/border/badge colors via
  // `@media (prefers-color-scheme: dark)`, so once the user picks a custom
  // page/container background here, those colors can end up fighting the OS
  // scheme (e.g. a light custom background with a dark OS scheme renders
  // white text and badges on white). Deriving the rest of the palette from
  // the chosen background's lightness keeps everything readable regardless
  // of what the OS prefers.
  // --text-color, --text-secondary, --border-color and --surface-bg used to
  // live here as flat neutral grays. They're now derived from the accent hue
  // instead (see getMaterialYouSurfaceTones) so PageDye's own background and
  // control surfaces pick up a subtle tint of the chosen theme color, the way
  // real Material You derives its whole neutral palette from one seed color
  // instead of just tinting buttons.
  const UI_THEME_LIGHT_PALETTE = {
    '--primary-color': '#18181b', '--primary-color-text': '#ffffff',
    '--primary-hover': '#3f3f46', '--input-focus-shadow': 'rgba(24, 24, 27, 0.1)',
    '--shadow-sm': '0 1px 2px rgba(0,0,0,0.05)', '--shadow-md': '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
    '--shadow-lg': '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.03)',
    '--danger-bg': 'rgba(239, 68, 68, 0.08)', '--danger-text': '#dc2626', '--danger-border': '#fecaca',
    '--primary-gradient': 'linear-gradient(135deg, #18181b 0%, #71717a 100%)',
    '--accent-glow': '0 0 12px rgba(24, 24, 27, 0.25)', '--accent-glow-large': '0 8px 24px rgba(24, 24, 27, 0.25)',
    '--table-hover-bg': 'rgba(24, 24, 27, 0.03)',
    '--badge-color-bg': 'rgba(24, 24, 27, 0.1)', '--badge-color-text': '#18181b',
    '--badge-image-bg': 'rgba(113, 113, 122, 0.15)', '--badge-image-text': '#52525b',
    '--badge-effect-bg': 'rgba(99, 102, 241, 0.12)', '--badge-effect-text': '#4f46e5',
    '--toast-bg': 'rgba(15, 23, 42, 0.9)', '--toast-text': '#ffffff',
  };
  const UI_THEME_DARK_PALETTE = {
    '--primary-color': '#ffffff', '--primary-color-text': '#000000',
    '--primary-hover': '#e5e5e5', '--input-focus-shadow': 'rgba(255, 255, 255, 0.15)',
    '--shadow-sm': '0 1px 2px rgba(0,0,0,0.5)', '--shadow-md': '0 4px 12px rgba(0,0,0,0.8)',
    '--shadow-lg': '0 12px 24px rgba(0,0,0,0.9)',
    '--danger-bg': 'rgba(239, 68, 68, 0.12)', '--danger-text': '#fca5a5', '--danger-border': 'rgba(239, 68, 68, 0.3)',
    '--primary-gradient': 'linear-gradient(135deg, #ffffff 0%, #888888 100%)',
    '--accent-glow': '0 0 12px rgba(255, 255, 255, 0.2)', '--accent-glow-large': '0 8px 24px rgba(255, 255, 255, 0.2)',
    '--table-hover-bg': 'rgba(255, 255, 255, 0.04)',
    '--badge-color-bg': 'rgba(255, 255, 255, 0.1)', '--badge-color-text': '#ffffff',
    '--badge-image-bg': 'rgba(255, 255, 255, 0.15)', '--badge-image-text': '#e5e5e5',
    '--badge-effect-bg': 'rgba(129, 140, 248, 0.18)', '--badge-effect-text': '#a5b4fc',
    '--toast-bg': 'rgba(255, 255, 255, 0.95)', '--toast-text': '#000000',
  };

  function colorIsLight(color) {
    const hex = (color || '').trim().replace('#', '');
    const full = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
    if (!/^[0-9a-fA-F]{6}$/.test(full)) return true;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) >= 140;
  }

  function normalizeHexColor(color, fallback) {
    const value = (color || '').trim();
    return /^#[0-9a-fA-F]{6}$/.test(value) ? value.toUpperCase() : fallback;
  }

  function hexToRgba(color, alpha) {
    const hex = normalizeHexColor(color, '#18181B').replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function shiftHexColor(color, amount) {
    const hex = normalizeHexColor(color, '#18181B').replace('#', '');
    const next = [0, 2, 4].map((idx) => {
      const value = Math.max(0, Math.min(255, parseInt(hex.slice(idx, idx + 2), 16) + amount));
      return value.toString(16).padStart(2, '0');
    });
    return '#' + next.join('').toUpperCase();
  }

  function hexToHsl(color) {
    const hex = normalizeHexColor(color, '#18181B').replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    let h = 0;
    let s = 0;
    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      switch (max) {
        case r: h = 60 * (((g - b) / d) % 6); break;
        case g: h = 60 * ((b - r) / d + 2); break;
        default: h = 60 * ((r - g) / d + 4); break;
      }
      if (h < 0) h += 360;
    }
    return { h, s: s * 100, l: l * 100 };
  }

  function hslToHex(h, s, l) {
    const sat = s / 100;
    const light = l / 100;
    const c = (1 - Math.abs(2 * light - 1)) * sat;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = light - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
    return ('#' + toHex(r) + toHex(g) + toHex(b)).toUpperCase();
  }

  // Real Material You dynamic color derives its whole neutral tonal palette
  // (surfaces, containers, outlines, on-surface text) from the seed color's
  // hue at low chroma — not just the primary/accent color itself. Scaling
  // the tint's saturation by the accent's OWN saturation (rather than a flat
  // constant) keeps the near-gray "neutral" preset rendering as true neutral
  // gray, while a vivid accent (purple, teal, etc.) visibly tints the whole
  // dashboard — background, sidebar, cards, borders — not just buttons.
  // Tone (lightness) targets mirror the existing static palette/CSS values
  // so contrast relationships stay the same; only the hue/chroma shifts.
  function getMaterialYouSurfaceTones(accentHex, isDark) {
    const { h, s: accentSat } = hexToHsl(accentHex);
    const surfaceSat = Math.min(45, accentSat * 1.0);
    const outlineSat = Math.min(30, accentSat * 0.8);
    const textSat = Math.min(12, accentSat * 0.3);
    if (isDark) {
      return {
        '--text-color': hslToHex(h, textSat, 88),
        '--text-secondary': hslToHex(h, textSat, 76),
        '--border-color': hslToHex(h, outlineSat, 28),
        '--surface-bg': hslToHex(h, surfaceSat, 11),
        '--md-sys-color-surface': hslToHex(h, surfaceSat, 6),
        '--md-sys-color-surface-dim': hslToHex(h, surfaceSat, 6),
        '--md-sys-color-surface-container-lowest': hslToHex(h, surfaceSat, 5),
        '--md-sys-color-surface-container-low': hslToHex(h, surfaceSat, 9),
        '--md-sys-color-surface-container': hslToHex(h, surfaceSat, 11),
        '--md-sys-color-surface-container-high': hslToHex(h, surfaceSat, 16),
        '--md-sys-color-surface-container-highest': hslToHex(h, surfaceSat, 21),
        '--md-sys-color-on-surface': hslToHex(h, textSat, 89),
        '--md-sys-color-on-surface-variant': hslToHex(h, textSat, 76),
        '--md-sys-color-outline': hslToHex(h, outlineSat, 58),
        '--md-sys-color-outline-variant': hslToHex(h, outlineSat, 28),
        '--md-sys-color-inverse-surface': hslToHex(h, surfaceSat, 89),
        '--md-sys-color-inverse-on-surface': hslToHex(h, textSat, 19)
      };
    }
    return {
      '--text-color': hslToHex(h, textSat, 10),
      '--text-secondary': hslToHex(h, textSat, 28),
      '--border-color': hslToHex(h, outlineSat, 76),
      '--surface-bg': hslToHex(h, surfaceSat, 95),
      '--md-sys-color-surface': hslToHex(h, surfaceSat, 97),
      '--md-sys-color-surface-dim': hslToHex(h, surfaceSat, 86),
      '--md-sys-color-surface-container-lowest': hslToHex(h, surfaceSat, 99),
      '--md-sys-color-surface-container-low': hslToHex(h, surfaceSat, 95),
      '--md-sys-color-surface-container': hslToHex(h, surfaceSat, 93),
      '--md-sys-color-surface-container-high': hslToHex(h, surfaceSat, 91),
      '--md-sys-color-surface-container-highest': hslToHex(h, surfaceSat, 89),
      '--md-sys-color-on-surface': hslToHex(h, textSat, 9),
      '--md-sys-color-on-surface-variant': hslToHex(h, textSat, 28),
      '--md-sys-color-outline': hslToHex(h, outlineSat, 47),
      '--md-sys-color-outline-variant': hslToHex(h, outlineSat, 76),
      '--md-sys-color-inverse-surface': hslToHex(h, surfaceSat, 19),
      '--md-sys-color-inverse-on-surface': hslToHex(h, textSat, 95)
    };
  }

  function getUiAccentColor(theme) {
    if (theme.accent === 'custom') {
      return normalizeHexColor(theme.customAccent, UI_THEME_ACCENTS.neutral);
    }
    return UI_THEME_ACCENTS[theme.accent] || UI_THEME_ACCENTS.neutral;
  }

  // The accent is also used directly as foreground text/icon color (badges,
  // "on-container" text), not just as a button fill. Its raw hue/sat is kept,
  // but lightness is remapped so it stays legible against the current
  // dark/light container background — otherwise the default near-black
  // "neutral" accent renders as near-black text on a dark container.
  function getDisplayAccentColor(accentHex, isDark) {
    const { h, s, l } = hexToHsl(accentHex);
    const targetL = isDark ? Math.max(l, 70) : Math.min(l, 45);
    return hslToHex(h, s, targetL);
  }

  function applyUiThemeAccent(theme) {
    const root = document.documentElement.style;
    const isDark = SYSTEM_DARK_QUERY.matches;
    const rawAccent = getUiAccentColor(theme);
    const accent = getDisplayAccentColor(rawAccent, isDark);
    const onAccent = colorIsLight(accent) ? '#000000' : '#ffffff';
    const hover = shiftHexColor(accent, colorIsLight(accent) ? -32 : 24);
    root.setProperty('--primary-color', accent);
    root.setProperty('--primary-color-text', onAccent);
    root.setProperty('--primary-hover', hover);
    root.setProperty('--input-focus-shadow', hexToRgba(accent, 0.16));
    root.setProperty('--primary-gradient', `linear-gradient(135deg, ${accent} 0%, ${hover} 100%)`);
    root.setProperty('--accent-glow', `0 0 12px ${hexToRgba(accent, 0.22)}`);
    root.setProperty('--accent-glow-large', `0 8px 24px ${hexToRgba(accent, 0.22)}`);
    root.setProperty('--table-hover-bg', hexToRgba(accent, 0.05));
    root.setProperty('--badge-color-bg', hexToRgba(accent, 0.12));
    root.setProperty('--badge-color-text', accent);
    root.setProperty('--badge-image-bg', hexToRgba(accent, 0.14));
    root.setProperty('--badge-image-text', accent);
    root.setProperty('--md-sys-color-primary', accent);
    root.setProperty('--md-sys-color-on-primary', onAccent);
    root.setProperty('--md-sys-color-primary-container', hexToRgba(accent, 0.18));
    root.setProperty('--md-sys-color-on-primary-container', accent);
    root.setProperty('--md-sys-color-secondary-container', hexToRgba(accent, 0.16));
    root.setProperty('--md-sys-color-on-secondary-container', accent);
    root.setProperty('--md-state-hover', hexToRgba(accent, 0.08));
    root.setProperty('--md-state-focus', hexToRgba(accent, 0.14));
    root.setProperty('--md-state-press', hexToRgba(accent, 0.14));

    const surfaces = getMaterialYouSurfaceTones(rawAccent, isDark);
    Object.keys(surfaces).forEach((name) => root.setProperty(name, surfaces[name]));
  }

  // Elements
  const els = {
    navItems: document.querySelectorAll('.nav-item'),
    sections: document.querySelectorAll('.content-section'),
    versionLabel: document.getElementById('version'),
    aboutVersion: document.getElementById('about-version'),
    sitesListBody: document.getElementById('sites-list-body'),
    rulesListBody: document.getElementById('rules-list-body'),
    noRulesMsg: document.getElementById('no-rules-msg'),
    newRuleBtn: document.getElementById('new-rule-btn'),
    ruleForm: document.getElementById('rule-form'),
    ruleAction: document.getElementById('rule-action'),
    ruleType: document.getElementById('rule-type'),
    rulePattern: document.getElementById('rule-pattern'),
    ruleFormError: document.getElementById('rule-form-error'),
    ruleCancelBtn: document.getElementById('rule-cancel-btn'),
    noSitesMsg: document.getElementById('no-sites-msg'),
    searchInput: document.getElementById('search-input'),
    exportBtn: document.getElementById('export-btn'),
    importBtn: document.getElementById('import-btn'),
    importFile: document.getElementById('import-file'),
    clearAllBtn: document.getElementById('clear-all-btn'),
    statusMsg: document.getElementById('status-msg'),
    themeResetBtn: document.getElementById('theme-reset-btn'),
    themePageBgDrop: document.getElementById('theme-page-bg-drop'),
    themePageBgFile: document.getElementById('theme-page-bg-file'),
    themePageBgFileInfo: document.getElementById('theme-page-bg-file-info'),
    themePageBgFilename: document.getElementById('theme-page-bg-filename'),
    themePageBgRemove: document.getElementById('theme-page-bg-remove'),
    themeContainerBgDrop: document.getElementById('theme-container-bg-drop'),
    themeContainerBgFile: document.getElementById('theme-container-bg-file'),
    themeContainerBgFileInfo: document.getElementById('theme-container-bg-file-info'),
    themeContainerBgFilename: document.getElementById('theme-container-bg-filename'),
    themeContainerBgRemove: document.getElementById('theme-container-bg-remove'),
    uiThemeColorGrid: document.getElementById('ui-theme-color-grid'),
    uiThemeCustomColor: document.getElementById('ui-theme-custom-color'),
    uiThemeCustomColorText: document.getElementById('ui-theme-custom-color-text'),
    pauseShortcutInput: document.getElementById('pause-shortcut-input'),
    pauseShortcutReset: document.getElementById('pause-shortcut-reset'),
    advancedModeToggle: document.getElementById('advanced-mode-toggle'),
    advancedModeStatus: document.getElementById('advanced-mode-status'),
    debugModeToggle: document.getElementById('debug-mode-toggle'),

    // Edit site controls
    editWpModes: document.getElementsByName('edit-wpMode'),
    editSchemeCardsContainer: document.getElementById('edit-scheme-cards-container'),
    editCardSchemeLight: document.getElementById('edit-card-scheme-light'),
    editCardSchemeDark: document.getElementById('edit-card-scheme-dark'),
    editPreviewCardLight: document.getElementById('edit-preview-card-light'),
    editPreviewCardDark: document.getElementById('edit-preview-card-dark'),

    editTimeCardsContainer: document.getElementById('edit-time-cards-container'),
    editTimePeriodsList: document.getElementById('edit-time-periods-list'),
    editTimePeriodName: document.getElementById('edit-time-period-name'),
    editTimePeriodStart: document.getElementById('edit-time-period-start'),
    editTimePeriodEnd: document.getElementById('edit-time-period-end'),
    editTimeRangePeriodEditFields: document.getElementById('edit-time-range-period-edit-fields'),
    
    editSlideshowConfigPanel: document.getElementById('edit-slideshow-config-panel'),
    editSlideshowInterval: document.getElementById('edit-slideshow-interval'),
    editSlideshowRandom: document.getElementById('edit-slideshow-random'),
    editWallpapersGrid: document.getElementById('edit-wallpapers-grid'),
    editStatusDot: document.getElementById('edit-status-dot'),
    editStatusText: document.getElementById('edit-status-text'),
    editResetBtn: document.getElementById('edit-reset-btn'),

    // Custom effects
    customEffectsListBody: document.getElementById('custom-effects-list-body'),
    noCustomEffectsMsg: document.getElementById('no-custom-effects-msg'),
    newCustomEffectBtn: document.getElementById('new-custom-effect-btn'),
    importCustomEffectBtn: document.getElementById('import-custom-effect-btn'),
    importEffectFile: document.getElementById('import-effect-file'),
    editCustomEffectBackBtn: document.getElementById('edit-effect-back-btn'),
    editCustomEffectHeading: document.getElementById('edit-custom-effect-heading'),
    editCustomEffectName: document.getElementById('edit-custom-effect-name'),
    editCustomEffectTemplate: document.getElementById('edit-custom-effect-template'),
    editCustomEffectTemplateControl: document.getElementById('edit-custom-effect-template-control'),
    editCustomEffectCode: document.getElementById('edit-custom-effect-code'),
    editCustomEffectError: document.getElementById('edit-custom-effect-error'),
    editCustomEffectPreviewCanvas: document.getElementById('edit-custom-effect-preview-canvas'),
    editCustomEffectExportBtn: document.getElementById('edit-custom-effect-export-btn'),
    editCustomEffectDeleteBtn: document.getElementById('edit-custom-effect-delete-btn'),
    editCustomEffectSaveBtn: document.getElementById('edit-custom-effect-save-btn')
  };

  function setAccordionOpen(details, open, animate = true) {
    const content = details && details.querySelector(':scope > .accordion-content');
    if (!details || !content) return;

    if (details.open === open && !details.classList.contains('accordion-animating')) return;
    details._pagedyeAccordionOpenTarget = open;

    if (details._pagedyeAccordionAnimation) {
      details._pagedyeAccordionAnimation.cancel();
      details._pagedyeAccordionAnimation = null;
    }

    const shouldAnimate = animate && !document.documentElement.classList.contains('pagedye-no-animation') && content.animate;
    if (!shouldAnimate) {
      details.open = open;
      content.style.height = '';
      content.style.overflow = '';
      content.style.opacity = '';
      details.classList.remove('accordion-animating');
      return;
    }

    details.classList.add('accordion-animating');

    if (open) {
      content.style.height = '0px';
      content.style.overflow = 'hidden';
      details.open = true;
      const targetHeight = content.scrollHeight;
      details._pagedyeAccordionAnimation = content.animate(
        [{ height: '0px', opacity: 0.35 }, { height: targetHeight + 'px', opacity: 1 }],
        { duration: 220, easing: 'cubic-bezier(.22,1,.36,1)' }
      );
    } else {
      const startHeight = content.scrollHeight;
      content.style.height = startHeight + 'px';
      content.style.overflow = 'hidden';
      details._pagedyeAccordionAnimation = content.animate(
        [{ height: startHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0.35 }],
        { duration: 170, easing: 'ease' }
      );
    }

    details._pagedyeAccordionAnimation.onfinish = () => {
      details.open = open;
      content.style.height = '';
      content.style.overflow = '';
      content.style.opacity = '';
      details.classList.remove('accordion-animating');
      details._pagedyeAccordionAnimation = null;
      details._pagedyeAccordionOpenTarget = open;
    };
  }

  function handleAccordionSummaryClick(e) {
    const summary = e.target.closest('.accordion-summary');
    if (!summary) return;
    const details = summary.closest('.accordion');
    if (!details || !details.contains(summary)) return;
    e.preventDefault();
    const currentTarget = typeof details._pagedyeAccordionOpenTarget === 'boolean'
      ? details._pagedyeAccordionOpenTarget
      : details.open;
    setAccordionOpen(details, !currentTarget);
  }

  document.addEventListener('click', handleAccordionSummaryClick);

  // Init translations & versions
  initI18n();
  let editCssEditorController = initCodeEditor('edit-custom-css', 'edit-custom-css-editor', 'css');
  let editCustomEffectCodeController = initCodeEditor('edit-custom-effect-code', 'edit-custom-effect-code-editor', 'javascript');
  const editGradientKeyframesStyle = document.createElement('style');
  editGradientKeyframesStyle.textContent = window.PageDyeGradient.GRADIENT_KEYFRAMES_CSS;
  document.head.appendChild(editGradientKeyframesStyle);
  renderEditGradientPresetsGrid();
  const extensionVersion = 'v' + chrome.runtime.getManifest().version;
  if (els.versionLabel) els.versionLabel.textContent = extensionVersion;
  if (els.aboutVersion) els.aboutVersion.textContent = extensionVersion;
  const editVersionEl = document.getElementById('edit-version');
  if (editVersionEl) editVersionEl.textContent = extensionVersion;
  await initAdvancedMode();

  // Load configured sites
  await loadRulesList();
  await loadSitesList();
  await loadCustomEffectsList();
  await populateCustomEffectOptions(document.getElementById('edit-effect-kind'));

  // Debug mode toggle — global (not per-domain), read directly by scripts/debug.js
  // on every page via chrome.storage.onChanged, so this takes effect immediately.
  if (els.debugModeToggle) {
    const debugData = await chrome.storage.local.get([DEBUG_MODE_KEY]);
    els.debugModeToggle.checked = !!debugData[DEBUG_MODE_KEY];
    els.debugModeToggle.addEventListener('change', async () => {
      await chrome.storage.local.set({ [DEBUG_MODE_KEY]: els.debugModeToggle.checked });
      await refreshDebugRuntime();
    });
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (Object.prototype.hasOwnProperty.call(changes, ADVANCED_MODE_KEY)) {
      applyAdvancedMode(!!changes[ADVANCED_MODE_KEY].newValue);
    }
    if (Object.prototype.hasOwnProperty.call(changes, URL_RULES_KEY) && document.getElementById('section-sites').classList.contains('active')) {
      loadRulesList();
    }
    if (Object.prototype.hasOwnProperty.call(changes, CUSTOM_EFFECTS_KEY)) {
      populateCustomEffectOptions(document.getElementById('edit-effect-kind'));
      if (document.getElementById('section-custom-effects').classList.contains('active')) {
        loadCustomEffectsList();
      }
    }
  });

  // Load & wire up dashboard appearance (page/container background colors)
  await initUiTheme();
  await initPauseShortcut();

  // Sidebar navigation switching
  els.navItems.forEach(item => {
    item.addEventListener('click', () => {
      navigateToSection(item.dataset.target);
    });
  });

  const requestedSection = location.hash.slice(1);
  if (requestedSection && document.getElementById(requestedSection)) {
    const requestedNav = document.querySelector(`.nav-item[data-target="${requestedSection}"]`);
    navigateToSection(requestedNav && requestedNav.hasAttribute('data-advanced-only') && !document.body.classList.contains('advanced-mode')
      ? 'section-settings'
      : requestedSection);
  }

  // Search input filter
  els.searchInput.addEventListener('input', () => {
    filterSites(els.searchInput.value.toLowerCase().trim());
  });

  els.newRuleBtn.addEventListener('click', () => {
    els.ruleForm.classList.remove('hidden');
    els.rulePattern.focus();
  });
  els.ruleCancelBtn.addEventListener('click', closeRuleForm);
  els.ruleType.addEventListener('change', updateRulePatternPlaceholder);
  els.ruleForm.addEventListener('submit', createRule);

  // Backup: Export Configs
  els.exportBtn.addEventListener('click', exportConfigs);

  // Backup: Import Trigger & Action
  els.importBtn.addEventListener('click', () => els.importFile.click());
  els.importFile.addEventListener('change', importConfigs);

  // Backup: Clear all
  els.clearAllBtn.addEventListener('click', clearAllSites);

  // Helper functions
  function navigateToSection(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;
    window.PageDyeEffects.stopEffect();
    els.navItems.forEach((item) => item.classList.toggle('active', item.dataset.target === targetId));
    els.sections.forEach((section) => section.classList.toggle('active', section.id === targetId));
  }

  function applyAdvancedMode(enabled) {
    document.body.classList.toggle('advanced-mode', enabled);
    if (els.advancedModeToggle) els.advancedModeToggle.checked = enabled;
    if (els.advancedModeStatus) {
      els.advancedModeStatus.textContent = t(enabled ? 'advancedModeOn' : 'advancedModeOff');
    }

    if (!enabled) {
      const activeAdvancedNav = document.querySelector('.nav-item.active[data-advanced-only]');
      if (activeAdvancedNav) navigateToSection('section-settings');
      document.querySelectorAll('[data-advanced-only].accordion[open]').forEach((details) => {
        details.open = false;
      });
    }
  }

  async function refreshDebugRuntime() {
    const tabs = await chrome.tabs.query({});
    await Promise.allSettled(tabs.filter((tab) => tab.id).map((tab) => window.PageDyeInjection.ensure(tab.id)));
  }

  async function initAdvancedMode() {
    if (!els.advancedModeToggle) return;
    const data = await chrome.storage.local.get([ADVANCED_MODE_KEY, DEBUG_MODE_KEY]);
    const enabled = !!data[ADVANCED_MODE_KEY] || !!data[DEBUG_MODE_KEY];
    applyAdvancedMode(enabled);

    if (enabled && !data[ADVANCED_MODE_KEY]) {
      await chrome.storage.local.set({ [ADVANCED_MODE_KEY]: true });
    }

    els.advancedModeToggle.addEventListener('change', async () => {
      const next = els.advancedModeToggle.checked;
      if (!next && els.debugModeToggle?.checked) {
        els.debugModeToggle.checked = false;
        await chrome.storage.local.set({ [ADVANCED_MODE_KEY]: false, [DEBUG_MODE_KEY]: false });
        await refreshDebugRuntime();
      } else {
        await chrome.storage.local.set({ [ADVANCED_MODE_KEY]: next });
      }
      applyAdvancedMode(next);
    });
  }

  function initI18n() {
    const browserLang = navigator.language || navigator.userLanguage; 
    if (browserLang.toLowerCase().startsWith('zh')) {
      lang = 'zh';
    } else {
      lang = 'en';
    }
    
    // Set tab title
    document.title = t('title');

    // Translate elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });

    // Translate inputs with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = t(key);
    });
  }

  function t(key) {
    const zhFallback = {
      uiThemeColor: "界面主题色",
      uiThemeColorHint: "只改变 PageDye 设置页和弹窗的颜色，不会影响网站背景。",
      newRule: "新建规则",
      createRule: "保存规则",
      ruleAction: "要做什么",
      ruleApply: "使用背景",
      ruleExclude: "保持页面原样",
      ruleType: "适用页面",
      ruleHostname: "整个网站",
      ruleExact: "一个指定页面",
      rulePrefix: "某个路径下的页面",
      ruleWildcard: "网站及其子域名",
      rulePattern: "网站或页面地址",
      rulePatternHint: "例如 github.com、https://github.com/settings/profile、github.com/settings/*、*.example.com",
      rulePriority: "顺序",
      ruleMatch: "页面",
      ruleBehavior: "效果",
      ruleStatus: "启用",
      noRules: "还没有页面规则。",
      invalidRulePattern: "请输入符合所选范围的网站或页面地址。",
      confirmDeleteRule: "删除规则 {pattern}？",
      ruleSaved: "页面规则已保存！"
    };
    if (i18n[lang][key]) return i18n[lang][key];
    if (lang === 'zh' && zhFallback[key]) return zhFallback[key];
    return i18n.en[key] || key;
  }

  function buildBgTypeBadge(settings) {
    const badge = document.createElement('span');
    let typeText = t('bgTypeNone');
    if (settings.mode === 'auto') {
      badge.className = 'bg-type-badge auto';
      typeText = t('autoScheme');
    } else if (settings.mode === 'slideshow') {
      badge.className = 'bg-type-badge slideshow';
      const count = settings.slideshow && settings.slideshow.items ? settings.slideshow.items.length : 0;
      typeText = `${t('modeSlideshow')} (${count})`;
    } else if (settings.mode === 'timeRange') {
      badge.className = 'bg-type-badge slideshow';
      const count = settings.timeRange && settings.timeRange.items ? settings.timeRange.items.length : 0;
      typeText = `${t('modeTimeRange')} (${count})`;
    } else {
      badge.className = `bg-type-badge ${settings.type}`;
      if (settings.type === 'color') typeText = t('bgTypeColor');
      if (settings.type === 'image') typeText = t('bgTypeImage');
      if (settings.type === 'effect') typeText = t('bgTypeEffect');
    }
    badge.textContent = typeText;
    return badge;
  }

  function buildPreviewSwatch(settings) {
    if (settings.mode === 'auto') {
      const swatch = document.createElement('div');
      swatch.className = 'preview-swatch preview-swatch-auto';

      const lightSwatch = document.createElement('div');
      lightSwatch.className = 'swatch-half light-half';
      if (settings.light.type === 'color' && settings.light.colorMode === 'gradient' && settings.light.gradient) {
        lightSwatch.style.backgroundImage = window.PageDyeGradient.buildGradientCss(settings.light.gradient);
      } else if (settings.light.type === 'color') {
        lightSwatch.style.backgroundColor = settings.light.value;
      } else if (settings.light.type === 'image' && settings.light.value) {
        lightSwatch.style.backgroundImage = `url('${settings.light.value}')`;
      }
      lightSwatch.style.opacity = (settings.light.opacity !== undefined ? settings.light.opacity : 100) / 100;

      const darkSwatch = document.createElement('div');
      darkSwatch.className = 'swatch-half dark-half';
      if (settings.dark.type === 'color' && settings.dark.colorMode === 'gradient' && settings.dark.gradient) {
        darkSwatch.style.backgroundImage = window.PageDyeGradient.buildGradientCss(settings.dark.gradient);
      } else if (settings.dark.type === 'color') {
        darkSwatch.style.backgroundColor = settings.dark.value;
      } else if (settings.dark.type === 'image' && settings.dark.value) {
        darkSwatch.style.backgroundImage = `url('${settings.dark.value}')`;
      }
      darkSwatch.style.opacity = (settings.dark.opacity !== undefined ? settings.dark.opacity : 100) / 100;

      swatch.appendChild(lightSwatch);
      swatch.appendChild(darkSwatch);
      return swatch;
    } else if (settings.mode === 'slideshow' && settings.slideshow && settings.slideshow.items) {
      const stack = document.createElement('div');
      stack.className = 'preview-swatch-stack';

      const items = settings.slideshow.items.slice(0, 3);
      items.forEach((item) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'stack-item';
        if (item.type === 'color' && item.colorMode === 'gradient' && item.gradient) {
          itemEl.style.backgroundImage = window.PageDyeGradient.buildGradientCss(item.gradient);
        } else if (item.type === 'color') {
          itemEl.style.backgroundColor = item.value;
        } else if (item.type === 'image' && item.value) {
          itemEl.style.backgroundImage = `url('${item.value}')`;
        }
        itemEl.style.opacity = (item.opacity !== undefined ? item.opacity : 100) / 100;
        stack.appendChild(itemEl);
      });
      return stack;
    } else if (settings.mode === 'timeRange' && settings.timeRange && settings.timeRange.items) {
      const stack = document.createElement('div');
      stack.className = 'preview-swatch-stack';

      const items = settings.timeRange.items.slice(0, 3);
      items.forEach((item) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'stack-item';
        if (item.type === 'color' && item.colorMode === 'gradient' && item.gradient) {
          itemEl.style.backgroundImage = window.PageDyeGradient.buildGradientCss(item.gradient);
        } else if (item.type === 'color') {
          itemEl.style.backgroundColor = item.value;
        } else if (item.type === 'image' && item.value) {
          itemEl.style.backgroundImage = `url('${item.value}')`;
        }
        itemEl.style.opacity = (item.opacity !== undefined ? item.opacity : 100) / 100;
        stack.appendChild(itemEl);
      });
      return stack;
    }
    const swatch = document.createElement('div');
    swatch.className = 'preview-swatch';
    if (settings.type === 'color' && settings.colorMode === 'gradient' && settings.gradient) {
      swatch.style.backgroundImage = window.PageDyeGradient.buildGradientCss(settings.gradient);
    } else if (settings.type === 'color') {
      swatch.style.backgroundColor = settings.value;
    } else if (settings.type === 'image' && settings.value) {
      swatch.style.backgroundImage = `url('${settings.value}')`;
    } else if (settings.type === 'effect') {
      swatch.style.background = 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 50%, #6d28d9 100%)';
    }
    const opVal = settings.opacity !== undefined ? settings.opacity : 100;
    swatch.style.opacity = opVal / 100;
    return swatch;
  }

  // Pinned first row for the shared default background — always shown
  // (even unconfigured) so it's discoverable, excluded from the per-site
  // domain filter/search and from "no sites configured" messaging.
  function closeRuleForm() {
    els.ruleForm.reset();
    els.ruleForm.classList.add('hidden');
    els.ruleFormError.classList.add('hidden');
    els.ruleFormError.textContent = '';
    updateRulePatternPlaceholder();
  }

  function updateRulePatternPlaceholder() {
    const placeholders = {
      hostname: 'github.com',
      exact: 'https://github.com/settings/profile',
      prefix: 'github.com/settings/*',
      wildcard: '*.example.com'
    };
    els.rulePattern.placeholder = placeholders[els.ruleType.value] || '';
  }

  function generateRuleId() {
    if (crypto.randomUUID) return 'rule_' + crypto.randomUUID().replaceAll('-', '');
    return 'rule_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  function blankRuleSettings() {
    return {
      mode: 'single', type: 'none', value: '', opacity: 100, blur: 0,
      style: { fixed: true, size: 'cover', repeat: false }
    };
  }

  function ruleHostname(rule) {
    try {
      if (rule.type === 'exact') return new URL(rule.pattern).hostname;
      if (rule.type === 'wildcard') return rule.pattern.slice(2);
      return rule.pattern.split('/')[0];
    } catch (_) {
      return '';
    }
  }

  async function createRule(event) {
    event.preventDefault();
    const type = els.ruleType.value;
    const pattern = window.PageDyeStorage.normalizeRulePattern(type, els.rulePattern.value);
    if (!pattern) {
      els.ruleFormError.textContent = t('invalidRulePattern');
      els.ruleFormError.classList.remove('hidden');
      els.rulePattern.focus();
      return;
    }
    const data = await chrome.storage.local.get(null);
    const action = els.ruleAction.value;
    const rule = { id: generateRuleId(), type, pattern, action, enabled: true };
    if (action === 'apply') {
      const inherited = data[ruleHostname(rule)] || data[DEFAULT_BG_KEY] || blankRuleSettings();
      rule.settings = JSON.parse(JSON.stringify(inherited));
    }
    const rules = window.PageDyeStorage.normalizeUrlRules(data[URL_RULES_KEY]);
    rules.unshift(rule);
    rules.splice(window.PageDyeStorage.MAX_URL_RULES);
    await chrome.storage.local.set({ [URL_RULES_KEY]: rules });
    closeRuleForm();
    await loadRulesList();
    showStatus(t('ruleSaved'));
    if (action === 'apply') openEditSite(null, rule.id);
  }

  async function updateStoredRules(mutator) {
    const data = await chrome.storage.local.get(URL_RULES_KEY);
    const rules = window.PageDyeStorage.normalizeUrlRules(data[URL_RULES_KEY]);
    const next = mutator(rules) || rules;
    await chrome.storage.local.set({ [URL_RULES_KEY]: next });
  }

  async function deleteRule(rule) {
    if (!(await showConfirm(t('confirmDeleteRule').replace('{pattern}', rule.pattern)))) return;
    await updateStoredRules((rules) => rules.filter((item) => item.id !== rule.id));
    await loadRulesList();
    showStatus(t('deleteSiteDone'));
  }

  function ruleTypeLabel(type) {
    return t({ hostname: 'ruleHostname', exact: 'ruleExact', prefix: 'rulePrefix', wildcard: 'ruleWildcard' }[type]);
  }

  async function loadRulesList() {
    els.rulesListBody.innerHTML = '';
    const data = await chrome.storage.local.get(URL_RULES_KEY);
    const rules = window.PageDyeStorage.normalizeUrlRules(data[URL_RULES_KEY]);
    els.noRulesMsg.classList.toggle('hidden', rules.length > 0);

    rules.forEach((rule, index) => {
      const tr = document.createElement('tr');
      tr.className = 'rule-row' + (rule.enabled ? '' : ' rule-row-disabled');
      tr.draggable = true;
      tr.dataset.ruleId = rule.id;
      tr.dataset.domain = rule.pattern.toLowerCase();

      const priority = document.createElement('td');
      priority.innerHTML = `<span class="rule-priority"><svg class="drag-handle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>${index + 1}</span>`;
      tr.appendChild(priority);

      const match = document.createElement('td');
      match.innerHTML = '<div class="rule-match"><code></code><span class="rule-kind"></span></div>';
      match.querySelector('code').textContent = rule.pattern;
      match.querySelector('.rule-kind').textContent = ruleTypeLabel(rule.type);
      tr.appendChild(match);

      const behavior = document.createElement('td');
      behavior.className = 'rule-behavior';
      const actionBadge = document.createElement('span');
      actionBadge.className = `rule-action-badge ${rule.action}`;
      actionBadge.textContent = t(rule.action === 'exclude' ? 'ruleExclude' : 'ruleApply');
      behavior.appendChild(actionBadge);
      if (rule.action === 'apply') behavior.appendChild(buildBgTypeBadge(rule.settings));
      tr.appendChild(behavior);

      const status = document.createElement('td');
      const toggle = document.createElement('input');
      toggle.type = 'checkbox';
      toggle.className = 'rule-enabled-toggle';
      toggle.checked = rule.enabled;
      toggle.title = t('ruleStatus');
      toggle.addEventListener('change', async () => {
        await updateStoredRules((items) => items.map((item) => item.id === rule.id ? { ...item, enabled: toggle.checked } : item));
        await loadRulesList();
      });
      status.appendChild(toggle);
      tr.appendChild(status);

      const actions = document.createElement('td');
      actions.className = 'rule-actions';
      if (rule.action === 'apply') {
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.className = 'icon-btn';
        edit.title = t('editBtn');
        edit.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>';
        edit.addEventListener('click', () => openEditSite(null, rule.id));
        actions.appendChild(edit);
      }
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'icon-btn-danger';
      remove.title = t('deleteBtn');
      remove.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path></svg>';
      remove.addEventListener('click', () => deleteRule(rule));
      actions.appendChild(remove);
      tr.appendChild(actions);

      tr.addEventListener('dragstart', () => {
        tr.classList.add('dragging');
        document.body.dataset.draggedRuleId = rule.id;
      });
      tr.addEventListener('dragend', () => {
        tr.classList.remove('dragging');
        delete document.body.dataset.draggedRuleId;
        els.rulesListBody.querySelectorAll('.drag-over').forEach((row) => row.classList.remove('drag-over'));
      });
      tr.addEventListener('dragover', (event) => {
        event.preventDefault();
        tr.classList.add('drag-over');
      });
      tr.addEventListener('dragleave', () => tr.classList.remove('drag-over'));
      tr.addEventListener('drop', async (event) => {
        event.preventDefault();
        const draggedId = document.body.dataset.draggedRuleId;
        tr.classList.remove('drag-over');
        if (!draggedId || draggedId === rule.id) return;
        await updateStoredRules((items) => {
          const from = items.findIndex((item) => item.id === draggedId);
          if (from < 0) return items;
          const [moved] = items.splice(from, 1);
          const to = items.findIndex((item) => item.id === rule.id);
          if (to < 0) return items;
          items.splice(to, 0, moved);
          return items;
        });
        await loadRulesList();
      });

      els.rulesListBody.appendChild(tr);
    });
  }

  function buildDefaultBgRow(rawSettings) {
    const settings = rawSettings || { mode: 'single', type: 'none' };
    const tr = document.createElement('tr');
    tr.className = 'row-default-bg';
    tr.dataset.pinned = 'true';

    const tdDomain = document.createElement('td');
    const link = document.createElement('button');
    link.type = 'button';
    link.className = 'domain-edit-link';
    link.textContent = '🌐 ' + t('defaultBgRowLabel');
    link.addEventListener('click', () => openEditSite(DEFAULT_BG_KEY));
    tdDomain.appendChild(link);
    tr.appendChild(tdDomain);

    const tdBgType = document.createElement('td');
    tdBgType.appendChild(buildBgTypeBadge(settings));
    tr.appendChild(tdBgType);

    const tdPreview = document.createElement('td');
    tdPreview.appendChild(buildPreviewSwatch(settings));
    tr.appendChild(tdPreview);

    tr.appendChild(document.createElement('td'));

    return tr;
  }

  async function loadSitesList() {
    els.sitesListBody.innerHTML = '';
    const data = await chrome.storage.local.get(null);

    els.sitesListBody.appendChild(buildDefaultBgRow(data[DEFAULT_BG_KEY] || null));

    // Filter out potential non-domain configuration keys
    const domains = Object.keys(data).filter((key) => window.PageDyeStorage.isSiteSettingsKey(key, data[key]));

    if (domains.length === 0) {
      els.noSitesMsg.classList.remove('hidden');
      return;
    }

    els.noSitesMsg.classList.add('hidden');

    // Sort domain keys alphabetically
    domains.sort().forEach(domain => {
      const settings = data[domain];
      const tr = document.createElement('tr');
      tr.dataset.domain = domain.toLowerCase();

      // 1. Domain column (clickable domain link)
      const tdDomain = document.createElement('td');
      const domainLink = document.createElement('button');
      domainLink.type = 'button';
      domainLink.className = 'domain-edit-link';
      domainLink.textContent = domain;
      domainLink.addEventListener('click', () => {
        openEditSite(domain);
      });
      tdDomain.appendChild(domainLink);
      tr.appendChild(tdDomain);

      // 2. Background Type badge column
      const tdBgType = document.createElement('td');
      tdBgType.appendChild(buildBgTypeBadge(settings));
      tr.appendChild(tdBgType);

      // 3. Preview Swatch column (supports settings opacity)
      const tdPreview = document.createElement('td');
      tdPreview.appendChild(buildPreviewSwatch(settings));
      tr.appendChild(tdPreview);

      // 4. Actions column (Delete button)
      const tdActions = document.createElement('td');
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'icon-btn-danger';
      deleteBtn.title = t('deleteBtn');
      deleteBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      `;
      deleteBtn.addEventListener('click', async () => {
        const confirmMsg = t('confirmDelete').replace('{domain}', domain);
        if (await showConfirm(confirmMsg)) {
          await chrome.storage.local.remove(domain);
          await loadSitesList();
          showStatus(t('deleteSiteDone'));
        }
      });
      tdActions.appendChild(deleteBtn);
      tr.appendChild(tdActions);

      els.sitesListBody.appendChild(tr);
    });
  }

  function filterSites(query) {
    const rows = els.sitesListBody.querySelectorAll('tr:not([data-pinned])');
    let visibleCount = 0;

    rows.forEach(row => {
      const domain = row.dataset.domain;
      if (domain.includes(query)) {
        row.classList.remove('hidden');
        visibleCount++;
      } else {
        row.classList.add('hidden');
      }
    });

    els.rulesListBody.querySelectorAll('tr').forEach((row) => {
      row.classList.toggle('hidden', !row.dataset.domain.includes(query));
    });

    if (visibleCount === 0) {
      els.noSitesMsg.classList.remove('hidden');
    } else {
      els.noSitesMsg.classList.add('hidden');
    }
  }

  // ---- Custom Effects -------------------------------------------------

  let currentEditingEffectId = null;
  let effectPreviewDebounceTimer = null;
  let effectPreviewSequence = 0;

  function generateEffectId() {
    return 'ce_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // Starter code offered when creating a new custom effect. "waves" and
  // "particles" are real ports of the built-in engines (scripts/effects.js)
  // so users can study/tweak working code instead of an API doc + a blank
  // page — the color/speed helpers those engines reach via closure are
  // called through window.PageDyeEffects.helpers here since compiled custom
  // code runs in the global scope, not inside that module's closure.
  const CUSTOM_EFFECT_TEMPLATES = {
    blank:
`return {
  init(cfg) {
    return { width: 0, height: 0, t: 0, cfg };
  },
  resize(state, width, height) {
    state.width = width;
    state.height = height;
  },
  draw(ctx, canvas, state, dt) {
    const { width, height, cfg } = state;
    if (!width || !height) return;
    state.t += dt;

    ctx.fillStyle = cfg.bgColor;
    ctx.fillRect(0, 0, width, height);

    const helpers = window.PageDyeEffects.helpers;
    const speedMul = helpers.effectSpeedMultiplier(cfg.speed);
    const r = 20 + (cfg.density / 100) * 40 + 10 * Math.sin(state.t * 0.003 * speedMul);
    ctx.fillStyle = cfg.color;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, Math.max(4, r), 0, Math.PI * 2);
    ctx.fill();
  }
};`,
    waves:
`return {
  init(cfg) {
    return { width: 0, height: 0, phase: 0, lineCount: 6, cfg };
  },
  resize(state, width, height) {
    state.width = width;
    state.height = height;
    // density 0-100 maps to 3-14 stacked wave lines.
    state.lineCount = Math.max(2, Math.round(3 + (state.cfg.density / 100) * 11));
  },
  draw(ctx, canvas, state, dt) {
    const { width, height, lineCount, cfg } = state;
    if (!width || !height) return;
    const helpers = window.PageDyeEffects.helpers;
    state.phase += dt * 0.0006 * helpers.effectSpeedMultiplier(cfg.speed);

    ctx.fillStyle = cfg.bgColor;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < lineCount; i++) {
      const t = i / (lineCount - 1 || 1);
      const baseY = height * (0.3 + t * 0.5);
      const amplitude = 24 + t * 40;
      const freq = 0.006 + t * 0.002;
      const speed = 1 + t * 0.6;
      const opacity = 0.12 + (1 - t) * 0.25;

      ctx.beginPath();
      ctx.strokeStyle = helpers.hexToRgba(cfg.color, opacity);
      ctx.lineWidth = 1.5;
      for (let x = 0; x <= width; x += 4) {
        const y = baseY + Math.sin(x * freq + state.phase * speed) * amplitude;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
};`,
    particles:
`return {
  init(cfg) {
    return { width: 0, height: 0, particles: [], mouse: { x: -9999, y: -9999 }, cfg };
  },
  resize(state, width, height) {
    state.width = width;
    state.height = height;
    const helpers = window.PageDyeEffects.helpers;
    // density 0-100 maps to particle count ~20-220.
    const target = Math.round(20 + (state.cfg.density / 100) * 200);
    const count = Math.min(240, Math.max(10, target));
    const speedMul = helpers.effectSpeedMultiplier(state.cfg.speed);
    state.particles = new Array(count).fill(0).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 24 * speedMul,
      vy: (Math.random() - 0.5) * 24 * speedMul
    }));
  },
  onMouseMove(state, e, canvas) {
    const rect = canvas.getBoundingClientRect();
    state.mouse.x = e.clientX - rect.left;
    state.mouse.y = e.clientY - rect.top;
  },
  draw(ctx, canvas, state, dt) {
    const { width, height, particles, mouse, cfg } = state;
    if (!width || !height) return;
    const helpers = window.PageDyeEffects.helpers;
    ctx.fillStyle = cfg.bgColor;
    ctx.fillRect(0, 0, width, height);

    const dtSec = dt / 1000;
    const repelRadius = 90;
    const speedMul = helpers.effectSpeedMultiplier(cfg.speed);

    particles.forEach((p) => {
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      if (dist < repelRadius) {
        const force = (1 - dist / repelRadius) * 260 * speedMul;
        p.vx += (dx / dist) * force * dtSec;
        p.vy += (dy / dist) * force * dtSec;
      }
      p.x += p.vx * dtSec;
      p.y += p.vy * dtSec;
      p.vx *= 0.98;
      p.vy *= 0.98;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;
      p.x = Math.max(0, Math.min(width, p.x));
      p.y = Math.max(0, Math.min(height, p.y));
    });

    ctx.strokeStyle = helpers.hexToRgba(cfg.color, 0.15);
    ctx.lineWidth = 1;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.globalAlpha = 1 - dist / 120;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = cfg.color;
    particles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    });
  }
};`
  };

  async function loadCustomEffectsList() {
    els.customEffectsListBody.innerHTML = '';
    const data = await chrome.storage.local.get(CUSTOM_EFFECTS_KEY);
    const list = (data[CUSTOM_EFFECTS_KEY] || []).slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    if (list.length === 0) {
      els.noCustomEffectsMsg.classList.remove('hidden');
      document.querySelector('.effects-table').classList.add('hidden');
      return;
    }

    els.noCustomEffectsMsg.classList.add('hidden');
    document.querySelector('.effects-table').classList.remove('hidden');

    list.forEach((entry) => {
      const tr = document.createElement('tr');

      const tdName = document.createElement('td');
      tdName.textContent = entry.name || t('untitledEffect');
      if (entry.type === 'url') {
        const badge = document.createElement('span');
        badge.className = 'bg-type-badge';
        badge.style.marginLeft = '8px';
        badge.style.fontSize = '10px';
        badge.style.padding = '2px 6px';
        badge.style.borderRadius = '4px';
        badge.style.background = 'rgba(99, 102, 241, 0.12)';
        badge.style.color = '#4f46e5';
        badge.textContent = 'URL';
        tdName.appendChild(badge);
      }
      tr.appendChild(tdName);

      const tdUpdated = document.createElement('td');
      tdUpdated.textContent = entry.updatedAt ? new Date(entry.updatedAt).toLocaleDateString() : '';
      tr.appendChild(tdUpdated);

      const tdActions = document.createElement('td');
      const actionsWrap = document.createElement('div');
      actionsWrap.className = 'effect-actions-cell';
      tdActions.appendChild(actionsWrap);

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'ghost-link-btn';
      editBtn.textContent = t('editBtn');
      editBtn.addEventListener('click', () => openEditCustomEffect(entry.id));
      actionsWrap.appendChild(editBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'icon-btn-danger';
      deleteBtn.title = t('deleteBtn');
      deleteBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      `;
      deleteBtn.addEventListener('click', async () => {
        if (!(await showConfirm(t('confirmDeleteEffect').replace('{name}', entry.name || t('untitledEffect'))))) return;
        const freshData = await chrome.storage.local.get(CUSTOM_EFFECTS_KEY);
        const freshList = (freshData[CUSTOM_EFFECTS_KEY] || []).filter((e) => e.id !== entry.id);
        await chrome.storage.local.set({ [CUSTOM_EFFECTS_KEY]: freshList });
        await loadCustomEffectsList();
      });
      actionsWrap.appendChild(deleteBtn);

      tr.appendChild(tdActions);
      els.customEffectsListBody.appendChild(tr);
    });
  }

  // Compiles the in-progress code and, only if it's valid, runs it live on
  // the small preview canvas — a syntax/runtime error shows the red banner
  // instead of silently falling back to a built-in effect the way the
  // production startEffect() path does (that fallback is right for a real
  // site background, but would be confusing here: "why does my broken code
  // look fine?").
  function configureCustomUrlPreviewIframe(iframe) {
    iframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-pointer-lock');
    iframe.setAttribute('referrerpolicy', 'no-referrer');
    iframe.setAttribute('allow', '');
    iframe.setAttribute('title', 'Custom URL effect preview');
  }

  function showCustomEffectPreviewError(error) {
    els.editCustomEffectError.textContent = error && error.message ? error.message : String(error);
    els.editCustomEffectError.classList.remove('hidden');
  }

  // Preview user code in an isolated extension sandbox with no extension APIs
  // or network access. Invalid code is reported instead of falling back.
  function updateCustomEffectPreview() {
    clearTimeout(effectPreviewDebounceTimer);
    const sequence = ++effectPreviewSequence;
    effectPreviewDebounceTimer = setTimeout(async () => {
      window.PageDyeEffects.stopEffect();
      const canvas = els.editCustomEffectPreviewCanvas;
      const iframe = document.getElementById('edit-custom-effect-preview-iframe');
      const type = document.querySelector('input[name="edit-custom-effect-type"]:checked').value;

      if (type === 'url') {
        window.PageDyeCustomSandbox.release(iframe);
        configureCustomUrlPreviewIframe(iframe);
        canvas.style.display = 'none';
        iframe.style.display = 'block';
        iframe.style.pointerEvents = document.getElementById('edit-custom-effect-interactive').checked ? 'auto' : 'none';
        const targetUrl = window.PageDyeStorage.normalizeEffectUrl(document.getElementById('edit-custom-effect-url').value.trim());
        iframe.src = targetUrl || 'about:blank';
        els.editCustomEffectError.classList.add('hidden');
        return;
      }

      const code = els.editCustomEffectCode.value;
      canvas.style.display = 'none';
      if (!code.trim()) {
        window.PageDyeCustomSandbox.release(iframe);
        iframe.style.display = 'none';
        iframe.src = 'about:blank';
        els.editCustomEffectError.classList.add('hidden');
        return;
      }

      els.editCustomEffectError.classList.add('hidden');
      try {
        const result = await window.PageDyeCustomSandbox.start(iframe, {
          name: els.editCustomEffectName.value.trim() || t('untitledEffect'),
          code
        }, {
          color: '#ffffff', bgColor: '#000000', density: 50, speed: 50, text: 'PageDye'
        }, {
          opacity: 100,
          onError: (error) => {
            if (sequence === effectPreviewSequence) showCustomEffectPreviewError(error);
          }
        });
        if (sequence === effectPreviewSequence && result.ok) els.editCustomEffectError.classList.add('hidden');
      } catch (error) {
        if (sequence === effectPreviewSequence && !/released/i.test(error && error.message || '')) {
          showCustomEffectPreviewError(error);
        }
      }
    }, 350);
  }

  function openNewCustomEffect() {
    currentEditingEffectId = null;
    els.editCustomEffectHeading.textContent = t('newCustomEffect');
    els.editCustomEffectName.value = '';

    document.querySelector('input[name="edit-custom-effect-type"][value="code"]').checked = true;
    document.getElementById('edit-custom-effect-code-control').classList.remove('hidden');
    document.getElementById('edit-custom-effect-url-control').classList.add('hidden');
    document.getElementById('edit-custom-effect-url').value = '';
    document.getElementById('edit-custom-effect-interactive').checked = false;
    setAccordionOpen(document.getElementById('edit-accordion-custom-effect-advanced'), false, false);

    els.editCustomEffectTemplateControl.classList.remove('hidden');
    els.editCustomEffectTemplate.value = 'blank';
    els.editCustomEffectCode.value = CUSTOM_EFFECT_TEMPLATES.blank;
    editCustomEffectCodeController.update();
    els.editCustomEffectError.classList.add('hidden');
    els.editCustomEffectDeleteBtn.classList.add('hidden');
    els.editCustomEffectExportBtn.classList.add('hidden');

    els.sections.forEach((s) => s.classList.remove('active'));
    document.getElementById('section-edit-custom-effect').classList.add('active');
    updateCustomEffectPreview();
  }

  async function openEditCustomEffect(id) {
    const data = await chrome.storage.local.get(CUSTOM_EFFECTS_KEY);
    const entry = (data[CUSTOM_EFFECTS_KEY] || []).find((e) => e.id === id);
    if (!entry) return;

    currentEditingEffectId = id;
    els.editCustomEffectHeading.textContent = entry.name || t('untitledEffect');
    els.editCustomEffectName.value = entry.name || '';

    const type = entry.type || 'code';
    document.querySelector(`input[name="edit-custom-effect-type"][value="${type}"]`).checked = true;

    const codeControl = document.getElementById('edit-custom-effect-code-control');
    const urlControl = document.getElementById('edit-custom-effect-url-control');
    const urlInput = document.getElementById('edit-custom-effect-url');

    if (type === 'url') {
      codeControl.classList.add('hidden');
      urlControl.classList.remove('hidden');
      urlInput.value = entry.url || '';
    } else {
      codeControl.classList.remove('hidden');
      urlControl.classList.add('hidden');
      urlInput.value = '';
    }

    document.getElementById('edit-custom-effect-interactive').checked = !!entry.interactive;
    setAccordionOpen(document.getElementById('edit-accordion-custom-effect-advanced'), !!entry.interactive, false);

    els.editCustomEffectTemplateControl.classList.add('hidden');
    els.editCustomEffectCode.value = entry.code || '';
    editCustomEffectCodeController.update();
    els.editCustomEffectError.classList.add('hidden');
    els.editCustomEffectDeleteBtn.classList.remove('hidden');
    els.editCustomEffectExportBtn.classList.remove('hidden');

    els.sections.forEach((s) => s.classList.remove('active'));
    document.getElementById('section-edit-custom-effect').classList.add('active');
    updateCustomEffectPreview();
  }

  function closeCustomEffectEditor() {
    window.PageDyeEffects.stopEffect();
    effectPreviewSequence += 1;
    const iframe = document.getElementById('edit-custom-effect-preview-iframe');
    if (iframe) {
      window.PageDyeCustomSandbox.release(iframe);
      iframe.src = 'about:blank';
    }
    els.sections.forEach((s) => s.classList.remove('active'));
    document.getElementById('section-custom-effects').classList.add('active');
    loadCustomEffectsList();
  }

  async function saveCustomEffect() {
    const name = (els.editCustomEffectName.value.trim() || t('untitledEffect')).slice(0, window.PageDyeStorage.MAX_EFFECT_NAME_CHARS);
    const type = document.querySelector('input[name="edit-custom-effect-type"]:checked').value;
    let code = '';
    let url = '';
    const interactive = document.getElementById('edit-custom-effect-interactive').checked;

    if (type === 'url') {
      url = window.PageDyeStorage.normalizeEffectUrl(document.getElementById('edit-custom-effect-url').value);
      if (!url) {
        showStatus(lang === 'zh' ? '仅支持 HTTPS URL（本机地址可使用 HTTP）' : 'Only HTTPS URLs are allowed (HTTP is allowed for localhost).');
        return;
      }
    } else {
      code = els.editCustomEffectCode.value;
      if (code.length > window.PageDyeStorage.MAX_EFFECT_CODE_CHARS) {
        showStatus(lang === 'zh' ? '动效代码过大' : 'Effect code is too large.');
        return;
      }
      const validation = await window.PageDyeCustomSandbox.validate(code);
      if (!validation.ok) {
        els.editCustomEffectError.textContent = validation.error;
        els.editCustomEffectError.classList.remove('hidden');
        return;
      }
    }

    if (type === 'url' && interactive) {
      const warning = lang === 'zh'
        ? '交互模式会让嵌入的网站接收你的点击、滚动和键盘操作。iframe 已启用沙箱，但仍应只使用可信 URL。继续保存吗？'
        : 'Interactive mode lets the embedded site receive clicks, scrolling, and keyboard input. The iframe is sandboxed, but you should still use only trusted URLs. Save it?';
      if (!(await showConfirm(warning))) return;
    }

    const data = await chrome.storage.local.get(CUSTOM_EFFECTS_KEY);
    const list = window.PageDyeStorage.normalizeCustomEffects(data[CUSTOM_EFFECTS_KEY]);
    const id = currentEditingEffectId || generateEffectId();
    const entry = window.PageDyeStorage.normalizeCustomEffect({ id, name, type, code, url, interactive, updatedAt: Date.now() });
    if (!entry) {
      showStatus(t('importError'));
      return;
    }
    const idx = list.findIndex((effect) => effect.id === id);
    if (idx >= 0) {
      list[idx] = entry;
    } else {
      if (list.length >= window.PageDyeStorage.MAX_CUSTOM_EFFECTS) {
        showStatus(lang === 'zh' ? '自定义动效数量已达到上限' : 'The custom effect limit has been reached.');
        return;
      }
      list.push(entry);
    }
    await chrome.storage.local.set({ [CUSTOM_EFFECTS_KEY]: list });

    showStatus(t('saved'));
    closeCustomEffectEditor();
  }

  function exportCustomEffectEntry(entry) {
    const payload = {
      pagedyeCustomEffect: true,
      name: entry.name,
      type: entry.type || 'code',
      code: entry.code || '',
      url: entry.url || '',
      interactive: !!entry.interactive
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pagedye-effect-${(entry.name || 'effect').replace(/[^a-z0-9-_]+/gi, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importCustomEffectFile(file) {
    if (file.size > window.PageDyeStorage.MAX_EFFECT_FILE_BYTES) {
      showStatus(t('importError'));
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed || parsed.pagedyeCustomEffect !== true) throw new Error('Invalid custom effect file.');
        const normalized = window.PageDyeStorage.normalizeCustomEffect({
          id: generateEffectId(),
          name: parsed.name || t('untitledEffect'),
          type: parsed.type,
          code: parsed.code,
          url: parsed.url,
          interactive: parsed.interactive,
          updatedAt: Date.now()
        }, { fallbackName: t('untitledEffect') });
        if (!normalized) throw new Error('Invalid custom effect payload.');

        const data = await chrome.storage.local.get(CUSTOM_EFFECTS_KEY);
        const list = window.PageDyeStorage.normalizeCustomEffects(data[CUSTOM_EFFECTS_KEY]);
        if (list.length >= window.PageDyeStorage.MAX_CUSTOM_EFFECTS) {
          showStatus(lang === 'zh' ? '自定义动效数量已达到上限' : 'The custom effect limit has been reached.');
          return;
        }

        if (normalized.type === 'code') {
          const warning = lang === 'zh'
            ? '导入的 Canvas 动效包含 JavaScript。代码会在无扩展权限、禁止联网的隔离沙箱中运行；仍请只导入可信文件。继续吗？'
            : 'Imported Canvas effects contain JavaScript. It runs in an isolated sandbox without extension APIs or network access; still import only trusted files. Continue?';
          if (!(await showConfirm(warning))) return;
          const validation = await window.PageDyeCustomSandbox.validate(normalized.code);
          if (!validation.ok) throw new Error(validation.error || 'Invalid custom effect code.');
        }

        list.push(normalized);
        await chrome.storage.local.set({ [CUSTOM_EFFECTS_KEY]: list });
        await loadCustomEffectsList();
        showStatus(t('importSuccess'));
      } catch (err) {
        console.error(err);
        showStatus(t('importError'));
      }
    };
    reader.readAsText(file);
  }

  // Appends the user's custom effects as an <optgroup> after the built-in
  // <option>s of a per-site "Effect" <select> (edit-effect-kind here,
  // popup.js's #effect-kind mirrors this). Re-run on every load and again
  // whenever the custom-effect library changes so an edit/delete/rename
  // shows up without reopening the page.
  async function populateCustomEffectOptions(selectEl) {
    if (!selectEl) return;
    const previousValue = selectEl.value;
    const existingGroup = selectEl.querySelector('optgroup[data-custom-effects]');
    if (existingGroup) existingGroup.remove();

    const data = await chrome.storage.local.get(CUSTOM_EFFECTS_KEY);
    const list = data[CUSTOM_EFFECTS_KEY] || [];
    if (list.length > 0) {
      const group = document.createElement('optgroup');
      group.setAttribute('data-custom-effects', '');
      group.label = t('customEffectsOptgroup');
      list.forEach((entry) => {
        const opt = document.createElement('option');
        opt.value = 'custom:' + entry.id;
        opt.textContent = entry.name || t('untitledEffect');
        group.appendChild(opt);
      });
      selectEl.appendChild(group);
    }

    if (previousValue && Array.from(selectEl.options).some((o) => o.value === previousValue)) {
      selectEl.value = previousValue;
    }
  }

  async function exportConfigs() {
    try {
      const data = await chrome.storage.local.get(null);
      const backup = window.PageDyeStorage.buildBackup(data, chrome.runtime.getManifest().version);
      const jsonString = JSON.stringify(backup, null, 2);
      const backupBytes = new TextEncoder().encode(jsonString).byteLength;
      if (backupBytes > window.PageDyeStorage.MAX_BACKUP_BYTES) {
        throw new Error('Backup exceeds the maximum supported size.');
      }
      const storageAnalysis = window.PageDyeStorageManager.analyze(data, window.PageDyeStorage);
      const backupImageCount = storageAnalysis.images.filter((image) => image.ownerType !== 'appearance').length;
      const sizeWarning = lang === 'zh'
        ? `这份备份约 ${window.PageDyeStorageManager.formatBytes(backupBytes)}，包含 ${backupImageCount} 张图片。现在下载吗？`
        : `This backup is about ${window.PageDyeStorageManager.formatBytes(backupBytes)} and contains ${backupImageCount} images. Download it now?`;
      if (!(await showConfirm(sizeWarning))) return;
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pagedye_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showStatus(t('exportSuccess'));
    } catch (err) {
      console.error(err);
      showStatus(t('importError'));
    }
  }

  function importConfigs(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > window.PageDyeStorage.MAX_BACKUP_BYTES) {
      showStatus(t('importError'));
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        const prepared = window.PageDyeStorage.prepareImport(importedData);
        if (!(await showConfirm(t('confirmImport')))) return;
        const importedEffects = prepared.write[CUSTOM_EFFECTS_KEY] || [];
        const codeEffects = importedEffects.filter((effect) => effect.type === 'code');
        if (codeEffects.length) {
          const warning = lang === 'zh'
            ? '此备份包含 JavaScript Canvas 动效。代码会在无扩展权限、禁止联网的隔离沙箱中运行；仍请确认备份来源可信。继续恢复吗？'
            : 'This backup contains JavaScript Canvas effects. They run in an isolated sandbox without extension APIs or network access; still continue only if you trust the backup. Restore it?';
          if (!(await showConfirm(warning))) return;
          for (const effect of codeEffects) {
            const validation = await window.PageDyeCustomSandbox.validate(effect.code);
            if (!validation.ok) throw new Error(`Invalid custom effect ${effect.name}: ${validation.error}`);
          }
        }

        const existing = await chrome.storage.local.get(null);
        const staleSiteKeys = Object.keys(existing).filter((key) =>
          window.PageDyeStorage.isSiteSettingsKey(key, existing[key]) && !prepared.siteKeys.includes(key)
        );
        if (Object.keys(prepared.write).length) await chrome.storage.local.set(prepared.write);
        const keysToRemove = [...new Set([...staleSiteKeys, ...prepared.removeKeys])];
        if (keysToRemove.length) await chrome.storage.local.remove(keysToRemove);

        await loadSitesList();
        await loadCustomEffectsList();
        showStatus(t('importSuccess'));
      } catch (err) {
        console.error(err);
        showStatus(t('importError'));
      } finally {
        els.importFile.value = '';
      }
    };
    reader.readAsText(file);
  }

  async function clearAllSites() {
    if (!(await showConfirm(t('clearAllConfirm')))) return;
    const data = await chrome.storage.local.get(null);
    const siteKeys = Object.keys(data).filter((key) => window.PageDyeStorage.isSiteSettingsKey(key, data[key]));
    if (siteKeys.length) await chrome.storage.local.remove(siteKeys);
    await chrome.storage.local.remove(URL_RULES_KEY);
    await loadRulesList();
    await loadSitesList();
    showStatus(t('clearAllDone'));
  }

  // Dashboard Appearance (page/container background colors & images)
  function normalizePauseShortcut(value) {
    if (!value || typeof value.code !== 'string' || !value.code || !/^(Key|Digit|F\d{1,2}|Numpad|Arrow|Space|Home|End|Page|Insert|Delete|Escape)/.test(value.code)) {
      return { ...DEFAULT_PAUSE_SHORTCUT };
    }
    const shortcut = {
      code: value.code,
      altKey: !!value.altKey,
      shiftKey: !!value.shiftKey,
      ctrlKey: !!value.ctrlKey,
      metaKey: !!value.metaKey
    };
    return (shortcut.altKey || shortcut.shiftKey || shortcut.ctrlKey || shortcut.metaKey)
      ? shortcut
      : { ...DEFAULT_PAUSE_SHORTCUT };
  }

  function formatPauseShortcut(shortcut) {
    const labels = [];
    if (shortcut.ctrlKey) labels.push('Ctrl');
    if (shortcut.altKey) labels.push('Alt');
    if (shortcut.shiftKey) labels.push('Shift');
    if (shortcut.metaKey) labels.push('⌘');
    let key = shortcut.code
      .replace(/^Key/, '')
      .replace(/^Digit/, '')
      .replace(/^Numpad/, 'Num ')
      .replace(/^Arrow/, 'Arrow ')
      .replace(/^Space$/, 'Space');
    labels.push(key);
    return labels.join(' + ');
  }

  async function initPauseShortcut() {
    if (!els.pauseShortcutInput || !els.pauseShortcutReset) return;
    const data = await chrome.storage.local.get(PAUSE_SHORTCUT_KEY);
    let shortcut = normalizePauseShortcut(data[PAUSE_SHORTCUT_KEY]);
    const render = () => { els.pauseShortcutInput.value = formatPauseShortcut(shortcut); };
    render();

    els.pauseShortcutInput.addEventListener('keydown', async (event) => {
      event.preventDefault();
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) return;
      if (!(event.ctrlKey || event.altKey || event.shiftKey || event.metaKey)) {
        showStatus(t('pauseShortcutInvalid'));
        return;
      }
      shortcut = normalizePauseShortcut({
        code: event.code,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey
      });
      render();
      await chrome.storage.local.set({ [PAUSE_SHORTCUT_KEY]: shortcut });
      showStatus(t('appearanceSaved'));
    });
    els.pauseShortcutReset.addEventListener('click', async () => {
      shortcut = { ...DEFAULT_PAUSE_SHORTCUT };
      render();
      await chrome.storage.local.set({ [PAUSE_SHORTCUT_KEY]: shortcut });
      showStatus(t('appearanceSaved'));
    });
  }

  async function initUiTheme() {
    const data = await chrome.storage.local.get(UI_THEME_KEY);
    currentUiTheme = normalizeUiTheme(data[UI_THEME_KEY]);
    applyUiTheme(currentUiTheme);
    syncUiThemeInputs(currentUiTheme);

    if (els.uiThemeColorGrid) {
      els.uiThemeColorGrid.addEventListener('click', (e) => {
        const dot = e.target.closest('.theme-color-dot');
        if (!dot) return;
        saveUiTheme({ accent: dot.dataset.themeAccent || 'neutral' });
      });
    }
    const onCustomAccentChange = (value) => {
      const color = normalizeHexColor(value, currentUiTheme.customAccent || UI_THEME_ACCENTS.neutral);
      els.uiThemeCustomColor.value = color;
      els.uiThemeCustomColorText.value = color;
      saveUiTheme({ accent: 'custom', customAccent: color });
    };
    if (els.uiThemeCustomColor) {
      els.uiThemeCustomColor.addEventListener('input', (e) => onCustomAccentChange(e.target.value));
    }
    if (els.uiThemeCustomColorText) {
      els.uiThemeCustomColorText.addEventListener('change', (e) => {
        if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onCustomAccentChange(e.target.value);
      });
    }

    setupThemeImageUpload('page', els.themePageBgDrop, els.themePageBgFile, els.themePageBgFileInfo, els.themePageBgFilename, els.themePageBgRemove);
    setupThemeImageUpload('container', els.themeContainerBgDrop, els.themeContainerBgFile, els.themeContainerBgFileInfo, els.themeContainerBgFilename, els.themeContainerBgRemove);

    SYSTEM_DARK_QUERY.addEventListener('change', () => {
      applyUiTheme(currentUiTheme);
      syncUiThemeInputs(currentUiTheme);
    });

    const themeDisableAnim = document.getElementById('theme-disable-animation');
    if (themeDisableAnim) {
      themeDisableAnim.addEventListener('change', (e) => {
        saveUiTheme({ disableAnimation: e.target.checked });
      });
    }

    els.themeResetBtn.addEventListener('click', async () => {
      await chrome.storage.local.remove(UI_THEME_KEY);
      currentUiTheme = getSystemUiThemeDefaults();
      applyUiTheme(currentUiTheme);
      syncUiThemeInputs(currentUiTheme);
      showStatus(t('appearanceResetDone'));
    });
  }

  function setupThemeImageUpload(field, dropEl, fileEl, fileInfoEl, filenameEl, removeEl) {
    const imageKey = field === 'page' ? 'pageBgImage' : 'containerBgImage';

    dropEl.addEventListener('click', () => fileEl.click());
    dropEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropEl.classList.add('dragover');
    });
    dropEl.addEventListener('dragleave', () => dropEl.classList.remove('dragover'));
    dropEl.addEventListener('drop', (e) => {
      e.preventDefault();
      dropEl.classList.remove('dragover');
      if (e.dataTransfer.files.length) handleThemeImageFile(e.dataTransfer.files[0]);
    });
    fileEl.addEventListener('change', (e) => {
      if (e.target.files.length) handleThemeImageFile(e.target.files[0]);
    });

    async function handleThemeImageFile(file) {
      if (!file.type.startsWith('image/')) return;
      try {
        const prepared = await window.PageDyeImage.prepareImage(file);
        const image = { data: prepared.dataUrl, name: prepared.name };
        dropEl.classList.add('hidden');
        fileInfoEl.classList.remove('hidden');
        filenameEl.textContent = prepared.name;
        saveUiTheme({ [imageKey]: image });
      } catch (error) {
        console.error('Failed to prepare theme image:', error);
        showStatus(error && error.message ? error.message : t('importError'));
      }
    }

    removeEl.addEventListener('click', () => {
      fileEl.value = '';
      dropEl.classList.remove('hidden');
      fileInfoEl.classList.add('hidden');
      saveUiTheme({ [imageKey]: null });
    });
  }

  function syncUiThemeInputs(theme) {
    if (els.uiThemeCustomColor) els.uiThemeCustomColor.value = normalizeHexColor(theme.customAccent, UI_THEME_ACCENTS.neutral);
    if (els.uiThemeCustomColorText) els.uiThemeCustomColorText.value = normalizeHexColor(theme.customAccent, UI_THEME_ACCENTS.neutral);
    if (els.uiThemeColorGrid) {
      els.uiThemeColorGrid.querySelectorAll('.theme-color-dot').forEach((dot) => {
        dot.classList.toggle('active', (theme.accent || 'neutral') === dot.dataset.themeAccent);
      });
    }

    syncThemeImageUi(theme.pageBgImage, els.themePageBgDrop, els.themePageBgFileInfo, els.themePageBgFilename);
    syncThemeImageUi(theme.containerBgImage, els.themeContainerBgDrop, els.themeContainerBgFileInfo, els.themeContainerBgFilename);

    const themeDisableAnim = document.getElementById('theme-disable-animation');
    if (themeDisableAnim) {
      themeDisableAnim.checked = !!theme.disableAnimation;
    }
  }

  function syncThemeImageUi(image, dropEl, fileInfoEl, filenameEl) {
    if (image && image.data) {
      dropEl.classList.add('hidden');
      fileInfoEl.classList.remove('hidden');
      filenameEl.textContent = image.name || t('savedImage');
    } else {
      dropEl.classList.remove('hidden');
      fileInfoEl.classList.add('hidden');
    }
  }

  function applyUiTheme(theme) {
    const root = document.documentElement.style;
    const palette = SYSTEM_DARK_QUERY.matches ? UI_THEME_DARK_PALETTE : UI_THEME_LIGHT_PALETTE;
    Object.keys(palette).forEach(name => root.setProperty(name, palette[name]));
    applyUiThemeAccent(theme);

    applyThemeBgImage(document.body, theme.pageBgImage);
    applyThemeBgImage(document.querySelector('.dashboard-container'), theme.containerBgImage);
    applyThemeBgImage(document.querySelector('.sidebar'), theme.containerBgImage);

    if (theme.disableAnimation) {
      document.documentElement.classList.add('pagedye-no-animation');
    } else {
      document.documentElement.classList.remove('pagedye-no-animation');
    }
  }

  function applyThemeBgImage(el, image) {
    if (!el) return;
    if (image && image.data) {
      el.style.backgroundImage = `url('${image.data}')`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.style.backgroundRepeat = 'no-repeat';
    } else {
      el.style.backgroundImage = '';
      el.style.backgroundSize = '';
      el.style.backgroundPosition = '';
      el.style.backgroundRepeat = '';
    }
  }

  let themeSaveDebounceTimer = null;
  function saveUiTheme(partial) {
    currentUiTheme = Object.assign({}, currentUiTheme, partial);
    applyUiTheme(currentUiTheme);
    syncUiThemeInputs(currentUiTheme);

    if (themeSaveDebounceTimer) clearTimeout(themeSaveDebounceTimer);
    themeSaveDebounceTimer = setTimeout(async () => {
      await chrome.storage.local.set({ [UI_THEME_KEY]: currentUiTheme });
      showStatus(t('appearanceSaved'));
    }, 300);
  }

  function showStatus(msg) {
    els.statusMsg.textContent = msg;
    els.statusMsg.classList.remove('hidden');
    setTimeout(() => els.statusMsg.classList.add('hidden'), 2000);
  }

  function showConfirm(message) {
    return new Promise((resolve) => {
      const modal = document.getElementById('confirm-modal');
      const msgEl = document.getElementById('confirm-modal-message');
      const titleEl = document.getElementById('confirm-modal-title');
      const cancelBtn = document.getElementById('confirm-modal-cancel');
      const okBtn = document.getElementById('confirm-modal-ok');
      const previousFocus = document.activeElement;
      let settled = false;

      titleEl.textContent = t('modalTitle');
      msgEl.textContent = message;
      cancelBtn.textContent = t('confirmCancel');
      okBtn.textContent = t('confirmOk');

      const finish = (result) => {
        if (settled) return;
        settled = true;
        document.removeEventListener('keydown', onKeyDown, true);
        modal.onclick = null;
        cancelBtn.onclick = null;
        okBtn.onclick = null;
        modal.classList.remove('active');
        setTimeout(() => {
          modal.classList.add('hidden');
          if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
        }, 250);
        resolve(result);
      };

      const onKeyDown = (event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          finish(false);
        } else if (event.key === 'Tab') {
          const focusable = [cancelBtn, okBtn];
          const index = focusable.indexOf(document.activeElement);
          const nextIndex = event.shiftKey ? (index <= 0 ? focusable.length - 1 : index - 1) : (index + 1) % focusable.length;
          event.preventDefault();
          focusable[nextIndex].focus();
        }
      };

      cancelBtn.onclick = () => finish(false);
      okBtn.onclick = () => finish(true);
      modal.onclick = (event) => { if (event.target === modal) finish(false); };
      document.addEventListener('keydown', onKeyDown, true);

      modal.classList.remove('hidden');
      modal.offsetHeight;
      modal.classList.add('active');
      cancelBtn.focus();
    });
  }
  window.PageDyeOptionsConfirm = showConfirm;

  // Edit Site Feature Implementation
  let currentEditingDomain = '';
  let currentEditingRuleId = null;
  let editCurrentImageBase64 = null;
  let editActiveScheme = 'light';
  let editActiveTimePeriodIndex = 0;
  let editActiveSlideshowIndex = 0;
  let currentEditSettings = null;
  let editGradientStopsState = [];
  let editFrostedGlassState = [];
  let lastSelectedEditorTab = 'wallpaper';

  function populateEditForm(subSettings) {
    document.querySelector(`input[name="edit-bgType"][value="${subSettings.type || 'none'}"]`).checked = true;
    updateEditUI(subSettings.type || 'none');

    editCurrentImageBase64 = null;
    document.getElementById('edit-image-url').value = '';
    document.getElementById('edit-image-file').value = '';
    document.getElementById('edit-drop-area').classList.remove('hidden');
    document.getElementById('edit-file-info').classList.add('hidden');

    if (subSettings.type === 'color') {
      document.getElementById('edit-color-picker').value = subSettings.value || '#ffffff';
      document.getElementById('edit-color-text').value = subSettings.value || '#ffffff';

      const colorMode = subSettings.colorMode || 'solid';
      populateEditGradientPanel(subSettings.gradient || window.PageDyeGradient.defaultGradient(subSettings.value));
      updateEditColorModeUI(colorMode);
    } else if (subSettings.type === 'image') {
      if (subSettings.value && subSettings.value.startsWith('data:')) {
        editCurrentImageBase64 = subSettings.value;
        document.getElementById('edit-drop-area').classList.add('hidden');
        document.getElementById('edit-file-info').classList.remove('hidden');
        document.getElementById('edit-filename').textContent = t('savedImage');
      } else {
        document.getElementById('edit-image-url').value = subSettings.value || '';
      }
    } else if (subSettings.type === 'effect') {
      document.getElementById('edit-effect-kind').value = subSettings.effect || 'waves';
      document.getElementById('edit-effect-text').value = subSettings.effectText || 'PageDye';
      document.getElementById('edit-effect-text-control').classList.toggle('hidden', document.getElementById('edit-effect-kind').value !== 'typewriter');
      document.getElementById('edit-effect-color-scheme').value = subSettings.effectColorScheme || 'auto';
      document.getElementById('edit-effect-color-custom-control').classList.toggle('hidden', document.getElementById('edit-effect-color-scheme').value !== 'custom');
      document.getElementById('edit-effect-color').value = subSettings.effectColor || '#ffffff';
      document.getElementById('edit-effect-color-text').value = subSettings.effectColor || '#ffffff';
      document.getElementById('edit-effect-bg-color').value = subSettings.effectBgColor || '#000000';
      document.getElementById('edit-effect-bg-color-text').value = subSettings.effectBgColor || '#000000';
      document.getElementById('edit-effect-density').value = subSettings.effectDensity !== undefined ? subSettings.effectDensity : 50;
      document.getElementById('edit-effect-density-val').textContent = `${document.getElementById('edit-effect-density').value}%`;
      document.getElementById('edit-effect-speed').value = subSettings.effectSpeed !== undefined ? subSettings.effectSpeed : 50;
      document.getElementById('edit-effect-speed-val').textContent = `${document.getElementById('edit-effect-speed').value}%`;
    }

    document.getElementById('edit-opacity').value = subSettings.opacity !== undefined ? subSettings.opacity : 100;
    document.getElementById('edit-opacity-val').textContent = `${document.getElementById('edit-opacity').value}%`;
    document.getElementById('edit-blur').value = subSettings.blur !== undefined ? subSettings.blur : 0;
    document.getElementById('edit-blur-val').textContent = `${document.getElementById('edit-blur').value}px`;

    // Populate advanced filters
    const f = subSettings.filters || {};
    const bri = f.brightness !== undefined ? f.brightness : 100;
    const con = f.contrast !== undefined ? f.contrast : 100;
    const gry = f.grayscale !== undefined ? f.grayscale : 0;
    const hue = f.hue !== undefined ? f.hue : 0;
    const inv = f.invert !== undefined ? f.invert : 0;
    document.getElementById('edit-filter-brightness').value = bri;
    document.getElementById('edit-filter-brightness-val').textContent = `${bri}%`;
    document.getElementById('edit-filter-contrast').value = con;
    document.getElementById('edit-filter-contrast-val').textContent = `${con}%`;
    document.getElementById('edit-filter-grayscale').value = gry;
    document.getElementById('edit-filter-grayscale-val').textContent = `${gry}%`;
    document.getElementById('edit-filter-hue').value = hue;
    document.getElementById('edit-filter-hue-val').textContent = `${hue}deg`;
    document.getElementById('edit-filter-invert').value = inv;
    document.getElementById('edit-filter-invert-val').textContent = `${inv}%`;

    if (subSettings.style) {
      document.getElementById('edit-bg-fixed').checked = subSettings.style.fixed !== false;
      document.getElementById('edit-bg-size').value = subSettings.style.size || 'cover';
      document.getElementById('edit-bg-repeat').checked = !!subSettings.style.repeat;
    }

    updateEditPreview();
  }

  function collectEditFormTo(dest) {
    const type = document.querySelector('input[name="edit-bgType"]:checked').value;
    let value = '';

    if (type === 'color') {
      value = document.getElementById('edit-color-picker').value;
      dest.colorMode = document.querySelector('input[name="edit-colorMode"]:checked').value;
      dest.gradient = collectEditGradientFromForm();
    } else if (type === 'image') {
      value = editCurrentImageBase64 || document.getElementById('edit-image-url').value;
    } else if (type === 'effect') {
      dest.effect = document.getElementById('edit-effect-kind').value;
      dest.effectText = document.getElementById('edit-effect-text').value || 'PageDye';
      dest.effectColorScheme = document.getElementById('edit-effect-color-scheme').value;
      dest.effectColor = document.getElementById('edit-effect-color').value;
      dest.effectBgColor = document.getElementById('edit-effect-bg-color').value;
      dest.effectDensity = parseInt(document.getElementById('edit-effect-density').value, 10);
      dest.effectSpeed = parseInt(document.getElementById('edit-effect-speed').value, 10);
    }

    dest.type = type;
    dest.value = value;
    dest.opacity = parseInt(document.getElementById('edit-opacity').value, 10);
    dest.blur = parseInt(document.getElementById('edit-blur').value, 10);
    dest.filters = {
      brightness: parseInt(document.getElementById('edit-filter-brightness').value, 10),
      contrast:   parseInt(document.getElementById('edit-filter-contrast').value,   10),
      grayscale:  parseInt(document.getElementById('edit-filter-grayscale').value,  10),
      hue:        parseInt(document.getElementById('edit-filter-hue').value,        10),
      invert:     parseInt(document.getElementById('edit-filter-invert').value,     10)
    };
    dest.style = {
      fixed: document.getElementById('edit-bg-fixed').checked,
      size: document.getElementById('edit-bg-size').value,
      repeat: document.getElementById('edit-bg-repeat').checked
    };
  }

  let editSaveDebounceTimer = null;
  function queueEditAutoSave() {
    setEditSavingState();
    if (editSaveDebounceTimer) clearTimeout(editSaveDebounceTimer);
    editSaveDebounceTimer = setTimeout(() => {
      saveEditSettings(true);
    }, 400);
  }

  function triggerEditImmediateSave() {
    setEditSavingState();
    if (editSaveDebounceTimer) clearTimeout(editSaveDebounceTimer);
    saveEditSettings(true);
  }

  function setEditSavingState() {
    els.editStatusDot.classList.add('saving');
    els.editStatusText.textContent = t('statusSaving') || 'Saving...';
  }

  function setEditSyncedState() {
    els.editStatusDot.classList.remove('saving');
    els.editStatusText.textContent = t('statusSynced') || 'Synced';
  }

  async function openEditSite(domain, ruleId = null) {
    currentEditingDomain = domain;
    currentEditingRuleId = ruleId;

    let rule = null;
    if (ruleId) {
      const ruleData = await chrome.storage.local.get(URL_RULES_KEY);
      rule = window.PageDyeStorage.normalizeUrlRules(ruleData[URL_RULES_KEY]).find((item) => item.id === ruleId) || null;
      if (!rule || rule.action !== 'apply') return;
    }
    document.getElementById('edit-domain-name').textContent = rule
      ? rule.pattern
      : domain === DEFAULT_BG_KEY ? t('defaultBgEditTitle') : domain;

    els.sections.forEach(s => s.classList.remove('active'));
    document.getElementById('section-edit-site').classList.add('active');

    // Restore the last selected tab when opening the editor
    const activeTab = lastSelectedEditorTab || 'wallpaper';
    const tabRadio = document.querySelector(`input[name="edit-mainTab"][value="${activeTab}"]`);
    if (tabRadio) tabRadio.checked = true;

    const editPanelsSlider = document.getElementById('edit-panels-slider');
    if (editPanelsSlider) {
      editPanelsSlider.style.transition = 'none';
      editPanelsSlider.style.transform = activeTab === 'frosted' ? 'translateX(-50%)' : 'translateX(0)';
      editPanelsSlider.offsetHeight; // trigger reflow
      editPanelsSlider.style.transition = '';
    }
    const editPanelWallpaper = document.getElementById('edit-panel-wallpaper');
    const editPanelFrosted = document.getElementById('edit-panel-frosted');
    if (editPanelWallpaper) {
      editPanelWallpaper.classList.toggle('inactive', activeTab === 'frosted');
    }
    if (editPanelFrosted) {
      editPanelFrosted.classList.toggle('inactive', activeTab !== 'frosted');
    }

    const data = rule ? null : await chrome.storage.local.get(domain);
    currentEditSettings = (rule ? rule.settings : data[domain]) || {
      mode: 'single',
      type: 'none',
      value: '',
      opacity: 100,
      blur: 0,
      style: { fixed: true, size: 'cover', repeat: false }
    };

    if (!currentEditSettings.mode) {
      currentEditSettings.mode = 'single';
    }

    if (!currentEditSettings.light) {
      currentEditSettings.light = {
        type: currentEditSettings.type && currentEditSettings.type !== 'none' ? currentEditSettings.type : 'none',
        value: currentEditSettings.value || '',
        opacity: currentEditSettings.opacity !== undefined ? currentEditSettings.opacity : 100,
        blur: currentEditSettings.blur !== undefined ? currentEditSettings.blur : 0,
        style: Object.assign({ fixed: true, size: 'cover', repeat: false }, currentEditSettings.style || {})
      };
    }
    if (!currentEditSettings.dark) {
      currentEditSettings.dark = {
        type: currentEditSettings.type && currentEditSettings.type !== 'none' ? currentEditSettings.type : 'none',
        value: currentEditSettings.value || '',
        opacity: currentEditSettings.opacity !== undefined ? currentEditSettings.opacity : 100,
        blur: currentEditSettings.blur !== undefined ? currentEditSettings.blur : 0,
        style: Object.assign({ fixed: true, size: 'cover', repeat: false }, currentEditSettings.style || {})
      };
    }

    if (!currentEditSettings.timeRange || !Array.isArray(currentEditSettings.timeRange.items)) {
      if (currentEditSettings.timeRange && currentEditSettings.timeRange.morning) {
        const tr = currentEditSettings.timeRange;
        const config = currentEditSettings.timeRangeConfig || { morningStart: 5, noonStart: 9, duskStart: 17, nightStart: 21 };
        currentEditSettings.timeRange = {
          items: [
            Object.assign({ id: 'morning', name: lang === 'zh' ? '清晨' : 'Morning', start: config.morningStart, end: config.noonStart }, tr.morning),
            Object.assign({ id: 'noon', name: lang === 'zh' ? '正午' : 'Noon', start: config.noonStart, end: config.duskStart }, tr.noon),
            Object.assign({ id: 'dusk', name: lang === 'zh' ? '黄昏' : 'Dusk', start: config.duskStart, end: config.nightStart }, tr.dusk),
            Object.assign({ id: 'night', name: lang === 'zh' ? '深夜' : 'Night', start: config.nightStart, end: config.morningStart }, tr.night)
          ]
        };
      } else {
        const template = {
          type: currentEditSettings.type && currentEditSettings.type !== 'none' ? currentEditSettings.type : 'none',
          value: currentEditSettings.value || '',
          opacity: currentEditSettings.opacity !== undefined ? currentEditSettings.opacity : 100,
          blur: currentEditSettings.blur !== undefined ? currentEditSettings.blur : 0,
          style: Object.assign({ fixed: true, size: 'cover', repeat: false }, currentEditSettings.style || {}),
          colorMode: currentEditSettings.colorMode || 'solid',
          gradient: currentEditSettings.gradient || null,
          effect: currentEditSettings.effect || 'waves',
          effectText: currentEditSettings.effectText || 'PageDye',
          effectColorScheme: currentEditSettings.effectColorScheme || 'auto',
          effectColor: currentEditSettings.effectColor || '#ffffff',
          effectBgColor: currentEditSettings.effectBgColor || '#000000',
          effectDensity: currentEditSettings.effectDensity !== undefined ? currentEditSettings.effectDensity : 50,
          effectSpeed: currentEditSettings.effectSpeed !== undefined ? currentEditSettings.effectSpeed : 50,
          filters: Object.assign({ brightness: 100, contrast: 100, grayscale: 0, hue: 0, invert: 0 }, currentEditSettings.filters || {})
        };
        currentEditSettings.timeRange = {
          items: [
            Object.assign({ id: 'morning', name: lang === 'zh' ? '清晨' : 'Morning', start: 5, end: 9 }, JSON.parse(JSON.stringify(template))),
            Object.assign({ id: 'noon', name: lang === 'zh' ? '正午' : 'Noon', start: 9, end: 17 }, JSON.parse(JSON.stringify(template))),
            Object.assign({ id: 'dusk', name: lang === 'zh' ? '黄昏' : 'Dusk', start: 17, end: 21 }, JSON.parse(JSON.stringify(template))),
            Object.assign({ id: 'night', name: lang === 'zh' ? '深夜' : 'Night', start: 21, end: 5 }, JSON.parse(JSON.stringify(template)))
          ]
        };
      }
    }

    if (!currentEditSettings.slideshow) {
      currentEditSettings.slideshow = {
        interval: 'open',
        order: 'sequential',
        currentIndex: 0,
        lastRotationTime: Date.now(),
        items: [
          {
            type: currentEditSettings.type || 'none',
            value: currentEditSettings.value || '',
            opacity: currentEditSettings.opacity !== undefined ? currentEditSettings.opacity : 100,
            blur: currentEditSettings.blur !== undefined ? currentEditSettings.blur : 0,
            style: Object.assign({ fixed: true, size: 'cover', repeat: false }, currentEditSettings.style || {})
          }
        ]
      };
    }

    const mode = currentEditSettings.mode || 'single';
    const radio = document.querySelector(`input[name="edit-wpMode"][value="${mode}"]`);
    if (radio) radio.checked = true;
    updateEditModeUI(mode);

    document.getElementById('edit-target-selector').value = currentEditSettings.targetSelector || '';
    syncEditDeepCompatRunMode(editDeepCompatModeFromSettings(currentEditSettings));
    document.getElementById('edit-deep-compat-exclude').value = currentEditSettings.deepCompatExclude || '';
    document.getElementById('edit-custom-css').value = currentEditSettings.customCss || '';
    if (editCssEditorController) editCssEditorController.update();

    renderEditFrostedList(normalizeFrostedGlassList(currentEditSettings.frostedGlass));

    // Deep Compatibility Mode now has its own always-expanded accordion.
    const editAccordionAdvanced = document.getElementById('edit-accordion-advanced');
    if (editAccordionAdvanced) {
      setAccordionOpen(editAccordionAdvanced, !!(currentEditSettings.targetSelector || currentEditSettings.customCss), false);
    }
  }

  function editDeepCompatModeFromSettings(settings) {
    if (settings && settings.deepCompatAggressive) return 'strong';
    if (settings && settings.deepCompat) return 'enhanced';
    return 'normal';
  }

  function syncEditDeepCompatRunMode(mode) {
    const nextMode = mode || 'normal';
    const radio = document.querySelector(`input[name="edit-deepCompatMode"][value="${nextMode}"]`);
    if (radio) radio.checked = true;
    const badge = document.getElementById('edit-run-mode-badge');
    if (badge) {
      const labelKey = nextMode === 'strong' ? 'runModeStrong' : nextMode === 'enhanced' ? 'runModeEnhanced' : 'runModeNormal';
      badge.textContent = t(labelKey);
    }
  }

  function collectEditDeepCompatRunMode() {
    const checked = document.querySelector('input[name="edit-deepCompatMode"]:checked');
    const mode = checked ? checked.value : 'normal';
    currentEditSettings.deepCompat = mode !== 'normal';
    currentEditSettings.deepCompatAggressive = mode === 'strong';
    syncEditDeepCompatRunMode(mode);
  }

  function updateEditModeUI(mode) {
    els.editSchemeCardsContainer.classList.add('hidden');
    els.editTimeCardsContainer.classList.add('hidden');
    els.editSlideshowConfigPanel.classList.add('hidden');

    const activeModeBadge = document.getElementById('edit-active-mode-badge');
    if (activeModeBadge) {
      if (mode === 'single') {
        activeModeBadge.textContent = t('modeSingle');
      } else if (mode === 'auto') {
        activeModeBadge.textContent = t('modeAuto');
      } else if (mode === 'timeRange') {
        activeModeBadge.textContent = t('modeTimeRange');
      } else if (mode === 'slideshow') {
        activeModeBadge.textContent = t('modeSlideshow');
      }
    }

    if (els.editTimeRangePeriodEditFields) {
      els.editTimeRangePeriodEditFields.classList.toggle('hidden', mode !== 'timeRange');
    }

    if (mode === 'single') {
      populateEditForm(currentEditSettings);
    } else if (mode === 'auto') {
      els.editSchemeCardsContainer.classList.remove('hidden');
      els.editCardSchemeLight.classList.remove('active');
      els.editCardSchemeDark.classList.remove('active');
      if (editActiveScheme === 'dark') {
        els.editCardSchemeDark.classList.add('active');
      } else {
        editActiveScheme = 'light';
        els.editCardSchemeLight.classList.add('active');
      }
      populateEditForm(currentEditSettings[editActiveScheme]);
    } else if (mode === 'timeRange') {
      els.editTimeCardsContainer.classList.remove('hidden');
      const items = currentEditSettings.timeRange.items || [];
      if (editActiveTimePeriodIndex >= items.length) {
        editActiveTimePeriodIndex = 0;
      }
      renderEditTimeCards();
      const activeItem = items[editActiveTimePeriodIndex];
      if (activeItem) {
        populateEditForm(activeItem);
        populateTimeRangeEditPanel(activeItem);
      }
    } else if (mode === 'slideshow') {
      els.editSlideshowConfigPanel.classList.remove('hidden');
      els.editSlideshowInterval.value = currentEditSettings.slideshow.interval || 'open';
      els.editSlideshowRandom.checked = currentEditSettings.slideshow.order === 'random';
      
      editActiveSlideshowIndex = currentEditSettings.slideshow.currentIndex || 0;
      if (editActiveSlideshowIndex >= currentEditSettings.slideshow.items.length) {
        editActiveSlideshowIndex = 0;
      }
      renderEditWallpapersGrid();
      populateEditForm(currentEditSettings.slideshow.items[editActiveSlideshowIndex]);
    }
    updateEditInteractivePreviews();
  }

  function renderEditWallpapersGrid() {
    els.editWallpapersGrid.innerHTML = '';
    const items = currentEditSettings.slideshow.items || [];
    
    items.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'wallpaper-grid-card';
      if (idx === editActiveSlideshowIndex) card.classList.add('active');
      
      if (item.type === 'color' && item.colorMode === 'gradient' && item.gradient) {
        card.style.backgroundImage = window.PageDyeGradient.buildGradientCss(item.gradient);
      } else if (item.type === 'color') {
        card.style.backgroundColor = item.value || '#ffffff';
        card.style.backgroundImage = 'none';
      } else if (item.type === 'image' && item.value) {
        card.style.backgroundImage = `url('${item.value}')`;
      } else if (item.type === 'effect') {
        card.classList.add('type-none');
        card.textContent = t('typeEffect');
      } else {
        card.classList.add('type-none');
        card.textContent = 'None';
      }
      card.dataset.index = idx;

      if (items.length > 1) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-grid-btn';
        deleteBtn.textContent = '×';
        deleteBtn.type = 'button';
        deleteBtn.title = lang === 'zh' ? '删除此壁纸' : 'Delete wallpaper';
        card.appendChild(deleteBtn);
      }
      els.editWallpapersGrid.appendChild(card);
    });

    const addCard = document.createElement('div');
    addCard.className = 'add-grid-card';
    addCard.textContent = '+';
    els.editWallpapersGrid.appendChild(addCard);
  }

  function updateCardPreview(element, subSettings) {
    if (!element || !subSettings) return;
    if (subSettings.type === 'color' && subSettings.colorMode === 'gradient' && subSettings.gradient) {
      element.style.backgroundImage = window.PageDyeGradient.buildGradientCss(subSettings.gradient);
      element.style.backgroundColor = '';
    } else if (subSettings.type === 'color') {
      element.style.backgroundColor = subSettings.value || '#ffffff';
      element.style.backgroundImage = 'none';
    } else if (subSettings.type === 'image' && subSettings.value) {
      element.style.backgroundImage = `url('${subSettings.value}')`;
    } else {
      element.style.backgroundColor = 'var(--surface-bg)';
      element.style.backgroundImage = 'none';
    }
    element.style.opacity = (subSettings.opacity !== undefined ? subSettings.opacity : 100) / 100;
  }

  function updateEditInteractivePreviews() {
    if (!currentEditSettings) return;
    
    const mode = currentEditSettings.mode || 'single';
    if (mode === 'auto') {
      updateCardPreview(els.editPreviewCardLight, currentEditSettings.light);
      updateCardPreview(els.editPreviewCardDark, currentEditSettings.dark);
    } else if (mode === 'timeRange') {
      const activeCard = els.editTimePeriodsList ? els.editTimePeriodsList.querySelector(`.scheme-card.active .scheme-card-preview`) : null;
      if (activeCard) {
        const item = currentEditSettings.timeRange.items[editActiveTimePeriodIndex];
        if (item) {
          updateCardPreview(activeCard, item);
        }
      }
    } else if (mode === 'slideshow') {
      const activeCard = els.editWallpapersGrid.querySelector(`.wallpaper-grid-card.active`);
      if (activeCard) {
        const item = currentEditSettings.slideshow.items[editActiveSlideshowIndex];
        if (item) {
          activeCard.textContent = '';
          activeCard.style.backgroundColor = '';
          activeCard.style.backgroundImage = '';
          if (item.type === 'color' && item.colorMode === 'gradient' && item.gradient) {
            activeCard.style.backgroundImage = window.PageDyeGradient.buildGradientCss(item.gradient);
            activeCard.className = 'wallpaper-grid-card active';
          } else if (item.type === 'color') {
            activeCard.style.backgroundColor = item.value || '#ffffff';
            activeCard.className = 'wallpaper-grid-card active';
          } else if (item.type === 'image' && item.value) {
            activeCard.style.backgroundImage = `url('${item.value}')`;
            activeCard.className = 'wallpaper-grid-card active';
          } else {
            activeCard.className = 'wallpaper-grid-card active type-none';
            activeCard.textContent = 'None';
          }
          
          const count = currentEditSettings.slideshow.items.length;
          if (count > 1 && !activeCard.querySelector('.delete-grid-btn')) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-grid-btn';
            deleteBtn.textContent = '×';
            deleteBtn.type = 'button';
            deleteBtn.title = lang === 'zh' ? '删除此壁纸' : 'Delete wallpaper';
            activeCard.appendChild(deleteBtn);
          }
        }
      }
    }
  }

  function updateEditUI(type) {
    document.getElementById('edit-section-color').classList.add('hidden');
    document.getElementById('edit-section-image').classList.add('hidden');
    document.getElementById('edit-section-effects').classList.add('hidden');
    document.getElementById('edit-section-styles').classList.add('hidden');
    document.getElementById('edit-image-options').classList.add('hidden');
    document.getElementById('edit-blur-control').classList.add('hidden');
    document.getElementById('edit-advanced-filters').classList.add('hidden');

    if (type === 'color') {
      document.getElementById('edit-section-color').classList.remove('hidden');
      document.getElementById('edit-section-styles').classList.remove('hidden');
      const checkedColorMode = document.querySelector('input[name="edit-colorMode"]:checked');
      updateEditColorModeUI(checkedColorMode ? checkedColorMode.value : 'solid');
    } else if (type === 'image') {
      document.getElementById('edit-section-image').classList.remove('hidden');
      document.getElementById('edit-section-styles').classList.remove('hidden');
      document.getElementById('edit-image-options').classList.remove('hidden');
      document.getElementById('edit-blur-control').classList.remove('hidden');
      document.getElementById('edit-advanced-filters').classList.remove('hidden');
      updateEditPreview();
    } else if (type === 'effect') {
      document.getElementById('edit-section-effects').classList.remove('hidden');
      document.getElementById('edit-section-styles').classList.remove('hidden');
    }
  }

  function updateEditColorModeUI(colorMode) {
    const isGradient = colorMode === 'gradient';
    const radio = document.querySelector(`input[name="edit-colorMode"][value="${colorMode || 'solid'}"]`);
    if (radio) radio.checked = true;
    document.getElementById('edit-solid-color-panel').classList.toggle('hidden', isGradient);
    document.getElementById('edit-gradient-panel').classList.toggle('hidden', !isGradient);
    if (isGradient) {
      // Guards against toggling to Gradient on a slot that has never been
      // through populateEditGradientPanel (e.g. a fresh domain whose type
      // starts as 'none'/'image') — without this, the stop list and live
      // preview would stay empty until the next full populateEditForm call.
      if (editGradientStopsState.length < window.PageDyeGradient.MIN_STOPS) {
        renderEditGradientStops(window.PageDyeGradient.defaultGradient(document.getElementById('edit-color-picker').value).stops);
      }
      const kindRadio = document.querySelector('input[name="edit-gradientKind"]:checked');
      updateEditGradientKindUI(kindRadio ? kindRadio.value : 'linear');
      updateEditGradientPreview();
      updateEditGradientExtractButtonState();
    }
  }

  function updateEditGradientKindUI(kind) {
    document.getElementById('edit-gradient-angle-control').classList.toggle('hidden', kind !== 'linear');
    document.getElementById('edit-gradient-shape-control').classList.toggle('hidden', kind !== 'radial');
  }

  function populateEditGradientPanel(gradient) {
    const kindRadio = document.querySelector(`input[name="edit-gradientKind"][value="${gradient.kind || 'linear'}"]`);
    if (kindRadio) kindRadio.checked = true;
    document.getElementById('edit-gradient-angle').value = gradient.angle !== undefined ? gradient.angle : 90;
    document.getElementById('edit-gradient-angle-val').textContent = `${document.getElementById('edit-gradient-angle').value}°`;
    document.getElementById('edit-gradient-shape').value = gradient.shape || 'circle';
    document.getElementById('edit-gradient-animated').checked = !!gradient.animated;
    document.getElementById('edit-gradient-speed').value = gradient.speed !== undefined ? gradient.speed : 10;
    document.getElementById('edit-gradient-speed-val').textContent = `${document.getElementById('edit-gradient-speed').value}s`;
    document.getElementById('edit-gradient-speed-control').classList.toggle('hidden', !gradient.animated);

    const stops = (gradient.stops && gradient.stops.length >= window.PageDyeGradient.MIN_STOPS)
      ? gradient.stops
      : window.PageDyeGradient.defaultGradient().stops;
    renderEditGradientStops(stops);

    updateEditGradientKindUI(gradient.kind || 'linear');
    updateEditGradientPreview();
  }

  // Rebuilds the stop-row list from scratch; listeners are delegated on the
  // parent (see the edit-gradient-stops-list input/click handlers below)
  // since rows are recreated on every add/remove.
  function renderEditGradientStops(stops) {
    editGradientStopsState = stops.map(s => ({ color: s.color, position: s.position }));
    const list = document.getElementById('edit-gradient-stops-list');
    list.innerHTML = '';

    editGradientStopsState.forEach((stop, idx) => {
      const row = document.createElement('div');
      row.className = 'gradient-stop-row';
      row.dataset.index = idx;

      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.className = 'gradient-stop-color';
      colorInput.value = stop.color;

      const hexInput = document.createElement('input');
      hexInput.type = 'text';
      hexInput.className = 'gradient-stop-hex';
      hexInput.value = stop.color;

      const posInput = document.createElement('input');
      posInput.type = 'number';
      posInput.className = 'gradient-stop-pos';
      posInput.min = '0';
      posInput.max = '100';
      posInput.value = stop.position;

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'gradient-stop-remove';
      removeBtn.textContent = '×';
      removeBtn.title = t('gradientRemoveStop');
      removeBtn.disabled = editGradientStopsState.length <= window.PageDyeGradient.MIN_STOPS;

      row.appendChild(colorInput);
      row.appendChild(hexInput);
      row.appendChild(posInput);
      row.appendChild(removeBtn);
      list.appendChild(row);
    });

    document.getElementById('edit-gradient-add-stop').disabled = editGradientStopsState.length >= window.PageDyeGradient.MAX_STOPS;
  }

  // Older saved settings stored frostedGlass as a single { selector, blur,
  // opacity } object. Upgrade that shape to a one-entry array transparently.
  function normalizeFrostedGlassList(fg) {
    if (Array.isArray(fg)) return fg;
    if (fg && typeof fg === 'object' && fg.selector) return [fg];
    return [];
  }

  // Rebuilds the frosted-entry list from scratch, one card per element, so
  // saving a new element never clobbers the others.
  function renderEditFrostedList(list) {
    editFrostedGlassState = list.map(f => ({
      selector: f.selector || '',
      blur: f.blur !== undefined ? f.blur : 12,
      opacity: f.opacity !== undefined ? f.opacity : 55,
      color: f.color || null
    }));
    const container = document.getElementById('edit-frosted-list');
    container.innerHTML = '';

    editFrostedGlassState.forEach((entry, idx) => {
      const row = document.createElement('div');
      row.className = 'frosted-entry';
      row.dataset.index = idx;

      const selectorRow = document.createElement('div');
      selectorRow.className = 'selector-row';

      const selectorInput = document.createElement('input');
      selectorInput.type = 'text';
      selectorInput.className = 'frosted-entry-selector';
      selectorInput.placeholder = '.card, main';
      selectorInput.value = entry.selector;

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'frosted-entry-remove';
      removeBtn.textContent = '×';
      removeBtn.title = t('gradientRemoveStop');

      selectorRow.appendChild(selectorInput);
      selectorRow.appendChild(removeBtn);

      const blurLabelRow = document.createElement('div');
      blurLabelRow.className = 'label-row';
      const blurLabel = document.createElement('label');
      blurLabel.textContent = t('frostedBlur');
      const blurVal = document.createElement('span');
      blurVal.className = 'val-badge frosted-entry-blur-val';
      blurVal.textContent = `${entry.blur}px`;
      blurLabelRow.appendChild(blurLabel);
      blurLabelRow.appendChild(blurVal);

      const blurInput = document.createElement('input');
      blurInput.type = 'range';
      blurInput.className = 'frosted-entry-blur';
      blurInput.min = '0';
      blurInput.max = '30';
      blurInput.step = '0.1';
      blurInput.value = entry.blur;

      const opacityLabelRow = document.createElement('div');
      opacityLabelRow.className = 'label-row';
      const opacityLabel = document.createElement('label');
      opacityLabel.textContent = t('frostedOpacity');
      const opacityVal = document.createElement('span');
      opacityVal.className = 'val-badge frosted-entry-opacity-val';
      opacityVal.textContent = `${entry.opacity}%`;
      opacityLabelRow.appendChild(opacityLabel);
      opacityLabelRow.appendChild(opacityVal);

      const opacityInput = document.createElement('input');
      opacityInput.type = 'range';
      opacityInput.className = 'frosted-entry-opacity';
      opacityInput.min = '0';
      opacityInput.max = '100';
      opacityInput.value = entry.opacity;

      const colorRow = document.createElement('div');
      colorRow.className = 'frosted-entry-color-row';

      const colorToggleLabel = document.createElement('label');
      colorToggleLabel.className = 'checkbox-label';
      const colorToggle = document.createElement('input');
      colorToggle.type = 'checkbox';
      colorToggle.className = 'frosted-entry-color-toggle';
      colorToggle.checked = !!entry.color;
      const colorToggleText = document.createElement('span');
      colorToggleText.textContent = t('frostedCustomColor');
      colorToggleLabel.appendChild(colorToggle);
      colorToggleLabel.appendChild(colorToggleText);

      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.className = 'frosted-entry-color';
      colorInput.value = entry.color || '#ffffff';
      colorInput.disabled = !entry.color;

      colorRow.appendChild(colorToggleLabel);
      colorRow.appendChild(colorInput);

      row.appendChild(selectorRow);
      row.appendChild(blurLabelRow);
      row.appendChild(blurInput);
      row.appendChild(opacityLabelRow);
      row.appendChild(opacityInput);
      row.appendChild(colorRow);
      container.appendChild(row);
    });
  }

  function collectEditGradientFromForm() {
    const kindRadio = document.querySelector('input[name="edit-gradientKind"]:checked');
    return {
      kind: kindRadio ? kindRadio.value : 'linear',
      angle: parseInt(document.getElementById('edit-gradient-angle').value, 10),
      shape: document.getElementById('edit-gradient-shape').value,
      stops: editGradientStopsState.map(s => ({ color: s.color, position: s.position })),
      animated: document.getElementById('edit-gradient-animated').checked,
      speed: parseInt(document.getElementById('edit-gradient-speed').value, 10)
    };
  }

  function updateEditGradientPreview() {
    const gradient = collectEditGradientFromForm();
    const bg = document.getElementById('edit-gradient-preview-bg');
    bg.style.backgroundImage = window.PageDyeGradient.buildGradientCss(gradient);
    bg.style.opacity = (parseInt(document.getElementById('edit-opacity').value, 10) || 100) / 100;
    if (gradient.animated) {
      bg.style.backgroundSize = gradient.kind === 'radial' ? '200% 200%' : '300% 300%';
      bg.style.animation = `pagedye-gradient-flow ${gradient.speed || 10}s ease infinite`;
    } else {
      bg.style.backgroundSize = 'auto';
      bg.style.animation = 'none';
    }
    // Every gradient control funnels through this function, so this is the
    // one place needed to keep the Auto/Slideshow scheme-card swatches live
    // too (they read currentEditSettings.light/dark/slideshow directly,
    // same as the solid-color and image controls already keep them in sync).
    updateEditInteractivePreviews();
  }

  function renderEditGradientPresetsGrid() {
    const grid = document.getElementById('edit-gradient-presets-grid');
    grid.innerHTML = '';
    window.PageDyeGradient.GRADIENT_PRESETS.forEach((preset, idx) => {
      const swatch = document.createElement('div');
      swatch.className = 'gradient-preset-swatch';
      swatch.style.background = window.PageDyeGradient.buildGradientCss(preset);
      swatch.title = lang === 'zh' ? preset.name_zh : preset.name_en;
      swatch.dataset.index = idx;
      grid.appendChild(swatch);
    });
  }

  function updateEditGradientExtractButtonState() {
    const hasImage = !!(editCurrentImageBase64 || document.getElementById('edit-image-url').value);
    const btn = document.getElementById('edit-gradient-extract-btn');
    btn.disabled = !hasImage;
    btn.title = hasImage ? '' : t('gradientExtractDisabledHint');
  }

  // Maps a flat hex list (from either Monet helper) to evenly-spaced stops.
  function normalizeEditStopObjects(hexColors) {
    const n = hexColors.length;
    return hexColors.map((color, i) => ({ color, position: n === 1 ? 0 : Math.round((i * 100) / (n - 1)) }));
  }

  function updateEditPreview() {
    let imageUrl = '';
    if (editCurrentImageBase64) {
      imageUrl = `url('${editCurrentImageBase64}')`;
    } else {
      const urlVal = document.getElementById('edit-image-url').value;
      if (urlVal) {
        imageUrl = `url('${urlVal}')`;
      }
    }
    const bgPreview = document.getElementById('edit-image-preview-bg');
    bgPreview.style.backgroundImage = imageUrl;
    const imageSize = document.getElementById('edit-bg-size').value;
    bgPreview.style.backgroundSize = imageSize === 'stretch' ? '100% 100%' : imageSize;

    const blur       = parseInt(document.getElementById('edit-blur').value, 10) || 0;
    const brightness = parseInt(document.getElementById('edit-filter-brightness').value, 10);
    const contrast   = parseInt(document.getElementById('edit-filter-contrast').value, 10);
    const grayscale  = parseInt(document.getElementById('edit-filter-grayscale').value, 10);
    const hue        = parseInt(document.getElementById('edit-filter-hue').value, 10);
    const invert     = parseInt(document.getElementById('edit-filter-invert').value, 10);

    const filterStr = [
      blur        > 0                ? `blur(${blur}px)`              : '',
      brightness !== 100             ? `brightness(${brightness}%)`   : '',
      contrast   !== 100             ? `contrast(${contrast}%)`       : '',
      grayscale  > 0                 ? `grayscale(${grayscale}%)`     : '',
      hue        > 0                 ? `hue-rotate(${hue}deg)`        : '',
      invert     > 0                 ? `invert(${invert}%)`           : ''
    ].filter(Boolean).join(' ') || 'none';

    bgPreview.style.filter = filterStr;
    bgPreview.style.transform = blur > 0 ? 'scale(1.08)' : 'none';

    const opacity = document.getElementById('edit-opacity').value;
    bgPreview.style.opacity = opacity / 100;
  }

  function collectEditSettings() {
    const mode = document.querySelector('input[name="edit-wpMode"]:checked').value;
    currentEditSettings.mode = mode;

    if (mode === 'single') {
      collectEditFormTo(currentEditSettings);
    } else if (mode === 'auto') {
      collectEditFormTo(currentEditSettings[editActiveScheme]);
    } else if (mode === 'timeRange') {
      const activeItem = currentEditSettings.timeRange.items[editActiveTimePeriodIndex];
      if (activeItem) {
        collectEditFormTo(activeItem);
        collectTimeRangeEditPanel(activeItem);
      }
    } else if (mode === 'slideshow') {
      collectEditFormTo(currentEditSettings.slideshow.items[editActiveSlideshowIndex]);
      currentEditSettings.slideshow.interval = els.editSlideshowInterval.value;
      currentEditSettings.slideshow.order = els.editSlideshowRandom.checked ? 'random' : 'sequential';
    }

    currentEditSettings.targetSelector = document.getElementById('edit-target-selector').value.trim();
    collectEditDeepCompatRunMode();
    currentEditSettings.deepCompatExclude = document.getElementById('edit-deep-compat-exclude').value.trim();
    currentEditSettings.customCss = document.getElementById('edit-custom-css').value;
    currentEditSettings.frostedGlass = editFrostedGlassState.map(f => ({
      selector: f.selector.trim(),
      blur: f.blur,
      opacity: f.opacity,
      color: f.color || null
    }));
    currentEditSettings.timestamp = Date.now();
  }

  async function saveEditSettings(silent = true) {
    if (!currentEditSettings) return;
    collectEditSettings();

    try {
      if (currentEditingRuleId) {
        await updateStoredRules((rules) => rules.map((rule) =>
          rule.id === currentEditingRuleId ? { ...rule, settings: currentEditSettings } : rule
        ));
      } else {
        await chrome.storage.local.set({ [currentEditingDomain]: currentEditSettings });
      }
      setEditSyncedState();
      notifyTabsOfDomain(currentEditingRuleId ? URL_RULES_KEY : currentEditingDomain);
    } catch (err) {
      els.editStatusText.textContent = t('error');
      console.error(err);
    }
  }

  async function resetEditSettings() {
    if (currentEditingRuleId) {
      const data = await chrome.storage.local.get(URL_RULES_KEY);
      const rule = window.PageDyeStorage.normalizeUrlRules(data[URL_RULES_KEY]).find((item) => item.id === currentEditingRuleId);
      if (!rule || !(await showConfirm(t('confirmDeleteRule').replace('{pattern}', rule.pattern)))) return;
      await updateStoredRules((rules) => rules.filter((item) => item.id !== currentEditingRuleId));
      currentEditingRuleId = null;
      els.sections.forEach((section) => section.classList.remove('active'));
      document.getElementById('section-sites').classList.add('active');
      await loadRulesList();
      return;
    }
    const confirmMsg = currentEditingDomain === DEFAULT_BG_KEY
      ? t('confirmDeleteDefault')
      : t('confirmDelete').replace('{domain}', currentEditingDomain);
    if (!(await showConfirm(confirmMsg))) return;
    setEditSavingState();
    await chrome.storage.local.remove(currentEditingDomain);
    
    currentEditSettings = {
      mode: 'single',
      type: 'none',
      value: '',
      opacity: 100,
      blur: 0,
      style: { fixed: true, size: 'cover', repeat: false },
      timeRange: {
        items: [
          { id: 'morning', name: lang === 'zh' ? '清晨' : 'Morning', start: 5, end: 9, type: 'none', value: '', opacity: 100, blur: 0, style: { fixed: true, size: 'cover', repeat: false } },
          { id: 'noon', name: lang === 'zh' ? '正午' : 'Noon', start: 9, end: 17, type: 'none', value: '', opacity: 100, blur: 0, style: { fixed: true, size: 'cover', repeat: false } },
          { id: 'dusk', name: lang === 'zh' ? '黄昏' : 'Dusk', start: 17, end: 21, type: 'none', value: '', opacity: 100, blur: 0, style: { fixed: true, size: 'cover', repeat: false } },
          { id: 'night', name: lang === 'zh' ? '深夜' : 'Night', start: 21, end: 5, type: 'none', value: '', opacity: 100, blur: 0, style: { fixed: true, size: 'cover', repeat: false } }
        ]
      },
      slideshow: {
        interval: 'open',
        order: 'sequential',
        currentIndex: 0,
        lastRotationTime: Date.now(),
        items: [
          { type: 'none', value: '', opacity: 100, blur: 0, style: { fixed: true, size: 'cover', repeat: false } }
        ]
      },
      targetSelector: '',
      deepCompat: false,
      deepCompatAggressive: false,
      deepCompatExclude: '',
      customCss: '',
      frostedGlass: []
    };
    editActiveScheme = 'light';
    editActiveTimePeriodIndex = 0;
    editActiveSlideshowIndex = 0;
    
    const radio = document.querySelector('input[name="edit-wpMode"][value="single"]');
    if (radio) radio.checked = true;
    updateEditModeUI('single');

    document.getElementById('edit-type-none').checked = true;
    updateEditUI('none');
    document.getElementById('edit-opacity').value = 100;
    document.getElementById('edit-opacity-val').textContent = '100%';
    document.getElementById('edit-blur').value = 0;
    document.getElementById('edit-blur-val').textContent = '0px';
    document.getElementById('edit-effect-kind').value = 'waves';
    document.getElementById('edit-effect-text').value = 'PageDye';
    document.getElementById('edit-effect-text-control').classList.add('hidden');
    document.getElementById('edit-effect-color-scheme').value = 'auto';
    document.getElementById('edit-effect-color-custom-control').classList.add('hidden');
    document.getElementById('edit-effect-color').value = '#ffffff';
    document.getElementById('edit-effect-color-text').value = '#ffffff';
    document.getElementById('edit-effect-bg-color').value = '#000000';
    document.getElementById('edit-effect-bg-color-text').value = '#000000';
    document.getElementById('edit-effect-density').value = 50;
    document.getElementById('edit-effect-density-val').textContent = '50%';
    document.getElementById('edit-effect-speed').value = 50;
    document.getElementById('edit-effect-speed-val').textContent = '50%';
    editCurrentImageBase64 = null;
    document.getElementById('edit-image-file').value = '';
    document.getElementById('edit-drop-area').classList.remove('hidden');
    document.getElementById('edit-file-info').classList.add('hidden');
    document.getElementById('edit-image-url').value = '';
    document.getElementById('edit-target-selector').value = '';
    syncEditDeepCompatRunMode('normal');
    document.getElementById('edit-deep-compat-exclude').value = '';
    document.getElementById('edit-custom-css').value = '';
    renderEditFrostedList([]);
    if (editCssEditorController) editCssEditorController.update();

    notifyTabsOfDomain(currentEditingDomain);
    setEditSyncedState();
  }

  async function notifyTabsOfDomain(domain) {
    try {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.url) {
          try {
            const url = new URL(tab.url);
            let shouldNotify;
            if (domain === URL_RULES_KEY) {
              shouldNotify = true;
            } else if (domain === DEFAULT_BG_KEY) {
              // The default only actually applies to tabs whose own site
              // has no override — pushing it to every open tab would
              // clobber sites that are independently configured.
              const own = await chrome.storage.local.get(url.hostname);
              shouldNotify = !own[url.hostname];
            } else {
              shouldNotify = url.hostname.toLowerCase() === domain.toLowerCase();
            }
            if (shouldNotify) {
              // The storage mutation already tells a live content script to
              // repaint. Ensure only restores tabs that missed the install or
              // extension reload, and uses the complete dependency bundle.
              await window.PageDyeInjection.ensure(tab.id);
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error('Error notifying tabs:', err);
    }
  }

  // Edit Site Event Listeners Setup
  const editTypeRadios = document.getElementsByName('edit-bgType');
  editTypeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      // When switching to image type, restore the previously saved image value
      // so that editCurrentImageBase64 is not lost when cycling through types.
      if (radio.value === 'image') {
        // Determine which settings object is currently active
        let activeSettings = currentEditSettings;
        const mode = currentEditSettings ? (currentEditSettings.mode || 'single') : 'single';
        if (mode === 'auto') {
          activeSettings = currentEditSettings[editActiveScheme];
        } else if (mode === 'slideshow') {
          activeSettings = currentEditSettings.slideshow.items[editActiveSlideshowIndex];
        }
        // Restore base64 image if the saved value is a data URI, otherwise clear
        if (activeSettings && activeSettings.value && activeSettings.value.startsWith('data:')) {
          editCurrentImageBase64 = activeSettings.value;
        } else {
          editCurrentImageBase64 = null;
        }
        // Sync the file-info UI to match the restored state
        if (editCurrentImageBase64) {
          document.getElementById('edit-drop-area').classList.add('hidden');
          document.getElementById('edit-file-info').classList.remove('hidden');
          document.getElementById('edit-filename').textContent = t('savedImage') || 'Saved image';
        } else {
          document.getElementById('edit-drop-area').classList.remove('hidden');
          document.getElementById('edit-file-info').classList.add('hidden');
          // Restore URL value if applicable
          if (activeSettings && activeSettings.value && !activeSettings.value.startsWith('data:')) {
            document.getElementById('edit-image-url').value = activeSettings.value;
          }
        }
      }
      // Full opacity makes an effect's flat bgColor look harsh; nudge a
      // still-untouched (100%) slider down when switching into this type.
      if (radio.value === 'effect' && document.getElementById('edit-opacity').value === '100') {
        document.getElementById('edit-opacity').value = 85;
        document.getElementById('edit-opacity-val').textContent = '85%';
      }
      updateEditUI(radio.value);
      updateEditInteractivePreviews();
      triggerEditImmediateSave();
    });
  });

  // Effect kind / color / density / speed
  document.getElementById('edit-effect-kind').addEventListener('change', () => {
    document.getElementById('edit-effect-text-control').classList.toggle(
      'hidden', document.getElementById('edit-effect-kind').value !== 'typewriter'
    );
    triggerEditImmediateSave();
  });
  document.getElementById('edit-effect-text').addEventListener('input', () => queueEditAutoSave());
  document.getElementById('edit-effect-color-scheme').addEventListener('change', () => {
    document.getElementById('edit-effect-color-custom-control').classList.toggle(
      'hidden', document.getElementById('edit-effect-color-scheme').value !== 'custom'
    );
    triggerEditImmediateSave();
  });
  const editEffectColor = document.getElementById('edit-effect-color');
  const editEffectColorText = document.getElementById('edit-effect-color-text');
  editEffectColor.addEventListener('input', (e) => {
    editEffectColorText.value = e.target.value;
    queueEditAutoSave();
  });
  editEffectColorText.addEventListener('input', (e) => {
    editEffectColor.value = e.target.value;
    queueEditAutoSave();
  });
  const editEffectBgColor = document.getElementById('edit-effect-bg-color');
  const editEffectBgColorText = document.getElementById('edit-effect-bg-color-text');
  editEffectBgColor.addEventListener('input', (e) => {
    editEffectBgColorText.value = e.target.value;
    queueEditAutoSave();
  });
  editEffectBgColorText.addEventListener('input', (e) => {
    editEffectBgColor.value = e.target.value;
    queueEditAutoSave();
  });
  const editEffectDensity = document.getElementById('edit-effect-density');
  const editEffectDensityVal = document.getElementById('edit-effect-density-val');
  editEffectDensity.addEventListener('input', (e) => {
    editEffectDensityVal.textContent = `${e.target.value}%`;
    queueEditAutoSave();
  });
  const editEffectSpeed = document.getElementById('edit-effect-speed');
  const editEffectSpeedVal = document.getElementById('edit-effect-speed-val');
  editEffectSpeed.addEventListener('input', (e) => {
    editEffectSpeedVal.textContent = `${e.target.value}%`;
    queueEditAutoSave();
  });

  const editColorPicker = document.getElementById('edit-color-picker');
  const editColorText = document.getElementById('edit-color-text');
  editColorPicker.addEventListener('input', (e) => {
    editColorText.value = e.target.value;
    updateEditInteractivePreviews();
    queueEditAutoSave();
  });
  editColorText.addEventListener('input', (e) => {
    editColorPicker.value = e.target.value;
    updateEditInteractivePreviews();
    queueEditAutoSave();
  });

  // Gradient: Solid <-> Gradient sub-mode switch.
  // Note the order below (save, then re-derive the preview) for every
  // *discrete* gradient action in this section: triggerEditImmediateSave()
  // synchronously runs collectEditFormTo(), which is what writes the form's
  // gradient into currentEditSettings[activeSlot] — updateEditGradientPreview()
  // piggybacks a scheme-card/slideshow-thumbnail refresh (see its own
  // definition) that reads exactly that object, so it must run *after* the
  // save or it renders one action behind. Debounced slider edits (angle,
  // speed, per-stop color/position) keep the opposite order, matching the
  // existing solid-color/opacity slider precedent elsewhere in this file.
  document.getElementsByName('edit-colorMode').forEach(radio => {
    radio.addEventListener('change', () => {
      updateEditColorModeUI(radio.value);
      triggerEditImmediateSave();
      updateEditGradientPreview();
    });
  });

  // Gradient: Linear <-> Radial
  document.getElementsByName('edit-gradientKind').forEach(radio => {
    radio.addEventListener('change', () => {
      updateEditGradientKindUI(radio.value);
      triggerEditImmediateSave();
      updateEditGradientPreview();
    });
  });

  document.getElementById('edit-gradient-angle').addEventListener('input', (e) => {
    document.getElementById('edit-gradient-angle-val').textContent = `${e.target.value}°`;
    updateEditGradientPreview();
    queueEditAutoSave();
  });

  document.getElementById('edit-gradient-shape').addEventListener('change', () => {
    triggerEditImmediateSave();
    updateEditGradientPreview();
  });

  document.getElementById('edit-gradient-animated').addEventListener('change', (e) => {
    document.getElementById('edit-gradient-speed-control').classList.toggle('hidden', !e.target.checked);
    triggerEditImmediateSave();
    updateEditGradientPreview();
  });

  document.getElementById('edit-gradient-speed').addEventListener('input', (e) => {
    document.getElementById('edit-gradient-speed-val').textContent = `${e.target.value}s`;
    updateEditGradientPreview();
    queueEditAutoSave();
  });

  document.getElementById('edit-gradient-add-stop').addEventListener('click', () => {
    if (editGradientStopsState.length >= window.PageDyeGradient.MAX_STOPS) return;
    const lastPos = editGradientStopsState.length ? editGradientStopsState[editGradientStopsState.length - 1].position : 0;
    editGradientStopsState.push({ color: '#ffffff', position: Math.min(100, lastPos + 10) });
    renderEditGradientStops(editGradientStopsState);
    triggerEditImmediateSave();
    updateEditGradientPreview();
  });

  const editGradientStopsList = document.getElementById('edit-gradient-stops-list');

  editGradientStopsList.addEventListener('input', (e) => {
    const row = e.target.closest('.gradient-stop-row');
    if (!row) return;
    const idx = parseInt(row.dataset.index, 10);
    if (e.target.classList.contains('gradient-stop-color')) {
      row.querySelector('.gradient-stop-hex').value = e.target.value;
      editGradientStopsState[idx].color = e.target.value;
    } else if (e.target.classList.contains('gradient-stop-hex')) {
      row.querySelector('.gradient-stop-color').value = e.target.value;
      editGradientStopsState[idx].color = e.target.value;
    } else if (e.target.classList.contains('gradient-stop-pos')) {
      editGradientStopsState[idx].position = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
    }
    updateEditGradientPreview();
    queueEditAutoSave();
  });

  editGradientStopsList.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.gradient-stop-remove');
    if (!removeBtn) return;
    if (editGradientStopsState.length <= window.PageDyeGradient.MIN_STOPS) return;
    const idx = parseInt(removeBtn.closest('.gradient-stop-row').dataset.index, 10);
    editGradientStopsState.splice(idx, 1);
    renderEditGradientStops(editGradientStopsState);
    triggerEditImmediateSave();
    updateEditGradientPreview();
  });

  document.getElementById('edit-gradient-presets-grid').addEventListener('click', (e) => {
    const swatch = e.target.closest('.gradient-preset-swatch');
    if (!swatch) return;
    const preset = window.PageDyeGradient.GRADIENT_PRESETS[parseInt(swatch.dataset.index, 10)];
    populateEditGradientPanel(Object.assign({ animated: false, speed: 10 }, preset));
    triggerEditImmediateSave();
    updateEditGradientPreview();
  });

  document.getElementById('edit-gradient-generate-btn').addEventListener('click', () => {
    const seed = editColorPicker.value;
    const stops = window.PageDyeGradient.clampStops(normalizeEditStopObjects(window.PageDyeGradient.generateTonalPalette(seed)));
    renderEditGradientStops(stops);
    triggerEditImmediateSave();
    updateEditGradientPreview();
  });

  document.getElementById('edit-gradient-extract-btn').addEventListener('click', async () => {
    const imgSrc = editCurrentImageBase64 || document.getElementById('edit-image-url').value;
    if (!imgSrc) return;
    const extractBtn = document.getElementById('edit-gradient-extract-btn');
    extractBtn.disabled = true;
    const result = await window.PageDyeGradient.extractPaletteFromImage(imgSrc, 5);
    updateEditGradientExtractButtonState();
    if (!result.ok) {
      els.editStatusText.textContent = t('gradientExtractFailed');
      setTimeout(setEditSyncedState, 1800);
      return;
    }
    const stops = window.PageDyeGradient.clampStops(normalizeEditStopObjects(result.colors));
    renderEditGradientStops(stops);
    triggerEditImmediateSave();
    updateEditGradientPreview();
  });



  const editDropArea = document.getElementById('edit-drop-area');
  const editFileInput = document.getElementById('edit-image-file');
  editDropArea.addEventListener('click', () => editFileInput.click());
  editFileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleEditFile(e.target.files[0]);
  });
  editDropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    editDropArea.classList.add('dragover');
  });
  editDropArea.addEventListener('dragleave', () => editDropArea.classList.remove('dragover'));
  editDropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    editDropArea.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      handleEditFile(e.dataTransfer.files[0]);
    }
  });

  async function handleEditFile(file) {
    if (!file.type.startsWith('image/')) return;
    try {
      const prepared = await window.PageDyeImage.prepareImage(file);
      editCurrentImageBase64 = prepared.dataUrl;
      document.getElementById('edit-image-url').value = '';
      editDropArea.classList.add('hidden');
      document.getElementById('edit-file-info').classList.remove('hidden');
      document.getElementById('edit-filename').textContent = prepared.name;
      updateEditPreview();
      updateEditInteractivePreviews();
      triggerEditImmediateSave();
    } catch (error) {
      console.error('Failed to prepare image:', error);
      showStatus(error && error.message ? error.message : t('importError'));
    }
  }

  document.getElementById('edit-remove-file').addEventListener('click', () => {
    editCurrentImageBase64 = null;
    editFileInput.value = '';
    editDropArea.classList.remove('hidden');
    document.getElementById('edit-file-info').classList.add('hidden');
    updateEditPreview();
    updateEditInteractivePreviews();
    triggerEditImmediateSave();
  });

  const editOpacity = document.getElementById('edit-opacity');
  const editOpacityVal = document.getElementById('edit-opacity-val');
  editOpacity.addEventListener('input', (e) => {
    editOpacityVal.textContent = `${e.target.value}%`;
    updateEditPreview();
    updateEditInteractivePreviews();
    queueEditAutoSave();
  });

  const editBlur = document.getElementById('edit-blur');
  const editBlurVal = document.getElementById('edit-blur-val');
  editBlur.addEventListener('input', (e) => {
    editBlurVal.textContent = `${e.target.value}px`;
    updateEditPreview();
    updateEditInteractivePreviews();
    queueEditAutoSave();
  });

  document.getElementById('edit-image-url').addEventListener('input', (e) => {
    if (e.target.value) {
      editCurrentImageBase64 = null;
      editFileInput.value = '';
      editDropArea.classList.remove('hidden');
      document.getElementById('edit-file-info').classList.add('hidden');
    }
    updateEditPreview();
    updateEditInteractivePreviews();
    queueEditAutoSave();
  });

  // Advanced filter sliders
  const filterDefs = [
    { id: 'edit-filter-brightness', valId: 'edit-filter-brightness-val', unit: '%' },
    { id: 'edit-filter-contrast',   valId: 'edit-filter-contrast-val',   unit: '%' },
    { id: 'edit-filter-grayscale',  valId: 'edit-filter-grayscale-val',  unit: '%' },
    { id: 'edit-filter-hue',        valId: 'edit-filter-hue-val',        unit: 'deg' },
    { id: 'edit-filter-invert',     valId: 'edit-filter-invert-val',     unit: '%' }
  ];
  filterDefs.forEach(({ id, valId, unit }) => {
    document.getElementById(id).addEventListener('input', (e) => {
      document.getElementById(valId).textContent = `${e.target.value}${unit}`;
      updateEditPreview();
      queueEditAutoSave();
    });
  });

  document.getElementById('edit-filters-reset').addEventListener('click', () => {
    document.getElementById('edit-filter-brightness').value = 100;
    document.getElementById('edit-filter-brightness-val').textContent = '100%';
    document.getElementById('edit-filter-contrast').value = 100;
    document.getElementById('edit-filter-contrast-val').textContent = '100%';
    document.getElementById('edit-filter-grayscale').value = 0;
    document.getElementById('edit-filter-grayscale-val').textContent = '0%';
    document.getElementById('edit-filter-hue').value = 0;
    document.getElementById('edit-filter-hue-val').textContent = '0deg';
    document.getElementById('edit-filter-invert').value = 0;
    document.getElementById('edit-filter-invert-val').textContent = '0%';
    updateEditPreview();
    triggerEditImmediateSave();
  });



  // Toggles and inputs on edit view
  document.getElementById('edit-bg-fixed').addEventListener('change', () => triggerEditImmediateSave());
  document.getElementById('edit-bg-size').addEventListener('change', () => {
    updateEditPreview();
    triggerEditImmediateSave();
  });
  document.getElementById('edit-bg-repeat').addEventListener('change', () => triggerEditImmediateSave());
  document.getElementById('edit-target-selector').addEventListener('input', () => queueEditAutoSave());
  Array.from(document.getElementsByName('edit-deepCompatMode')).forEach((radio) => {
    radio.addEventListener('change', () => {
      syncEditDeepCompatRunMode(radio.value);
      triggerEditImmediateSave();
    });
  });
  document.getElementById('edit-deep-compat-exclude').addEventListener('input', () => queueEditAutoSave());
  document.getElementById('edit-custom-css').addEventListener('input', () => queueEditAutoSave());
  // Frosted glass entries are rebuilt on every render, so listeners are
  // delegated on the (stable) parent container rather than attached per-row.
  const editFrostedList = document.getElementById('edit-frosted-list');
  editFrostedList.addEventListener('input', (e) => {
    const row = e.target.closest('.frosted-entry');
    if (!row) return;
    const idx = parseInt(row.dataset.index, 10);
    if (e.target.classList.contains('frosted-entry-selector')) {
      editFrostedGlassState[idx].selector = e.target.value;
    } else if (e.target.classList.contains('frosted-entry-blur')) {
      editFrostedGlassState[idx].blur = parseFloat(e.target.value) || 0;
      row.querySelector('.frosted-entry-blur-val').textContent = `${e.target.value}px`;
    } else if (e.target.classList.contains('frosted-entry-opacity')) {
      editFrostedGlassState[idx].opacity = parseInt(e.target.value, 10);
      row.querySelector('.frosted-entry-opacity-val').textContent = `${e.target.value}%`;
    } else if (e.target.classList.contains('frosted-entry-color-toggle')) {
      const colorInput = row.querySelector('.frosted-entry-color');
      colorInput.disabled = !e.target.checked;
      editFrostedGlassState[idx].color = e.target.checked ? colorInput.value : null;
    } else if (e.target.classList.contains('frosted-entry-color')) {
      editFrostedGlassState[idx].color = e.target.value;
    }
    queueEditAutoSave();
  });

  editFrostedList.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.frosted-entry-remove');
    if (!removeBtn) return;
    const idx = parseInt(removeBtn.closest('.frosted-entry').dataset.index, 10);
    editFrostedGlassState.splice(idx, 1);
    renderEditFrostedList(editFrostedGlassState);
    triggerEditImmediateSave();
  });

  document.getElementById('edit-frosted-add-btn').addEventListener('click', () => {
    editFrostedGlassState.push({ selector: '', blur: 12, opacity: 55, color: null });
    renderEditFrostedList(editFrostedGlassState);
    triggerEditImmediateSave();
  });

  document.getElementById('edit-back-btn').addEventListener('click', () => {
    els.sections.forEach(s => s.classList.remove('active'));
    document.getElementById('section-sites').classList.add('active');
    currentEditingRuleId = null;
    loadRulesList();
    loadSitesList();
  });

  // Top-level tabs: Wallpaper vs Frosted Glass sliding transition
  const editPanelWallpaper = document.getElementById('edit-panel-wallpaper');
  const editPanelFrosted = document.getElementById('edit-panel-frosted');
  const editPanelsSlider = document.getElementById('edit-panels-slider');

  document.getElementsByName('edit-mainTab').forEach((radio) => {
    radio.addEventListener('change', () => {
      const isFrosted = radio.checked && radio.value === 'frosted';
      lastSelectedEditorTab = radio.value;
      
      // Ensure both are visible during transition
      if (editPanelWallpaper) editPanelWallpaper.classList.remove('inactive');
      if (editPanelFrosted) editPanelFrosted.classList.remove('inactive');
      
      requestAnimationFrame(() => {
        if (editPanelsSlider) {
          editPanelsSlider.style.transform = isFrosted ? 'translateX(-50%)' : 'translateX(0)';
        }
      });
    });
  });

  if (editPanelsSlider) {
    editPanelsSlider.addEventListener('transitionend', (e) => {
      if (e.target !== editPanelsSlider || e.propertyName !== 'transform') return;
      const activeRadio = document.querySelector('input[name="edit-mainTab"]:checked');
      const isFrosted = activeRadio && activeRadio.value === 'frosted';
      if (isFrosted) {
        if (editPanelWallpaper) editPanelWallpaper.classList.add('inactive');
      } else {
        if (editPanelFrosted) editPanelFrosted.classList.add('inactive');
      }
    });
  }

  // Edit Wallpaper Mode Switch
  els.editWpModes.forEach(radio => {
    radio.addEventListener('change', () => {
      if (!currentEditSettings) return;
      
      const prevMode = currentEditSettings.mode || 'single';
      if (prevMode === 'single') {
        collectEditFormTo(currentEditSettings);
      } else if (prevMode === 'auto') {
        collectEditFormTo(currentEditSettings[editActiveScheme]);
      } else if (prevMode === 'timeRange') {
        const activeItem = currentEditSettings.timeRange.items[editActiveTimePeriodIndex];
        if (activeItem) {
          collectEditFormTo(activeItem);
          collectTimeRangeEditPanel(activeItem);
        }
      } else if (prevMode === 'slideshow') {
        collectEditFormTo(currentEditSettings.slideshow.items[editActiveSlideshowIndex]);
        currentEditSettings.slideshow.interval = els.editSlideshowInterval.value;
        currentEditSettings.slideshow.order = els.editSlideshowRandom.checked ? 'random' : 'sequential';
      }
      
      currentEditSettings.mode = radio.value;
      updateEditModeUI(radio.value);
      triggerEditImmediateSave();
    });
  });

  // Auto Mode cards click handlers inside Edit Panel
  els.editCardSchemeLight.addEventListener('click', () => {
    if (!currentEditSettings || editActiveScheme === 'light') return;
    collectEditFormTo(currentEditSettings[editActiveScheme]);
    editActiveScheme = 'light';
    els.editCardSchemeDark.classList.remove('active');
    els.editCardSchemeLight.classList.add('active');
    populateEditForm(currentEditSettings[editActiveScheme]);
  });

  els.editCardSchemeDark.addEventListener('click', () => {
    if (!currentEditSettings || editActiveScheme === 'dark') return;
    collectEditFormTo(currentEditSettings[editActiveScheme]);
    editActiveScheme = 'dark';
    els.editCardSchemeLight.classList.remove('active');
    els.editCardSchemeDark.classList.add('active');
    populateEditForm(currentEditSettings[editActiveScheme]);
  });

  // Slideshow visual grid clicks using delegation inside Edit Panel
  els.editWallpapersGrid.addEventListener('click', (e) => {
    if (!currentEditSettings || !currentEditSettings.slideshow) return;

    // 1. Add Card Click
    const addCard = e.target.closest('.add-grid-card');
    if (addCard) {
      collectEditFormTo(currentEditSettings.slideshow.items[editActiveSlideshowIndex]);
      const newItem = {
        type: 'none',
        value: '',
        opacity: 100,
        blur: 0,
        style: { fixed: true, size: 'cover', repeat: false }
      };
      currentEditSettings.slideshow.items.push(newItem);
      editActiveSlideshowIndex = currentEditSettings.slideshow.items.length - 1;
      renderEditWallpapersGrid();
      populateEditForm(currentEditSettings.slideshow.items[editActiveSlideshowIndex]);
      triggerEditImmediateSave();
      return;
    }

    // 2. Delete Card Click
    const deleteBtn = e.target.closest('.delete-grid-btn');
    if (deleteBtn) {
      e.stopPropagation();
      const card = deleteBtn.closest('.wallpaper-grid-card');
      const idx = parseInt(card.dataset.index, 10);
      currentEditSettings.slideshow.items.splice(idx, 1);
      
      if (editActiveSlideshowIndex >= currentEditSettings.slideshow.items.length) {
        editActiveSlideshowIndex = currentEditSettings.slideshow.items.length - 1;
      }
      
      renderEditWallpapersGrid();
      populateEditForm(currentEditSettings.slideshow.items[editActiveSlideshowIndex]);
      triggerEditImmediateSave();
      return;
    }

    // 3. Select Card Click
    const card = e.target.closest('.wallpaper-grid-card');
    if (card) {
      const idx = parseInt(card.dataset.index, 10);
      if (editActiveSlideshowIndex === idx) return;
      collectEditFormTo(currentEditSettings.slideshow.items[editActiveSlideshowIndex]);
      editActiveSlideshowIndex = idx;
      
      // Update selected border
      els.editWallpapersGrid.querySelectorAll('.wallpaper-grid-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      
      populateEditForm(currentEditSettings.slideshow.items[editActiveSlideshowIndex]);
    }
  });

  // Edit Slideshow inputs listeners
  els.editSlideshowInterval.addEventListener('change', () => {
    if (currentEditSettings && currentEditSettings.slideshow) {
      currentEditSettings.slideshow.interval = els.editSlideshowInterval.value;
      triggerEditImmediateSave();
    }
  });

  els.editSlideshowRandom.addEventListener('change', () => {
    if (currentEditSettings && currentEditSettings.slideshow) {
      currentEditSettings.slideshow.order = els.editSlideshowRandom.checked ? 'random' : 'sequential';
      triggerEditImmediateSave();
    }
  });

  els.editResetBtn.addEventListener('click', resetEditSettings);

  // Custom Effects
  els.newCustomEffectBtn.addEventListener('click', openNewCustomEffect);
  els.editCustomEffectBackBtn.addEventListener('click', closeCustomEffectEditor);
  els.editCustomEffectSaveBtn.addEventListener('click', saveCustomEffect);

  els.editCustomEffectTemplate.addEventListener('change', () => {
    const tpl = CUSTOM_EFFECT_TEMPLATES[els.editCustomEffectTemplate.value];
    if (tpl === undefined) return;
    els.editCustomEffectCode.value = tpl;
    editCustomEffectCodeController.update();
    updateCustomEffectPreview();
  });

  els.editCustomEffectCode.addEventListener('input', updateCustomEffectPreview);

  document.getElementsByName('edit-custom-effect-type').forEach((radio) => {
    radio.addEventListener('change', () => {
      const type = radio.value;
      const codeControl = document.getElementById('edit-custom-effect-code-control');
      const urlControl = document.getElementById('edit-custom-effect-url-control');
      if (type === 'url') {
        codeControl.classList.add('hidden');
        urlControl.classList.remove('hidden');
        els.editCustomEffectTemplateControl.classList.add('hidden');
      } else {
        codeControl.classList.remove('hidden');
        urlControl.classList.add('hidden');
        if (!currentEditingEffectId) {
          els.editCustomEffectTemplateControl.classList.remove('hidden');
        }
      }
      updateCustomEffectPreview();
    });
  });

  document.getElementById('edit-custom-effect-url').addEventListener('input', updateCustomEffectPreview);

  els.editCustomEffectDeleteBtn.addEventListener('click', async () => {
    if (!currentEditingEffectId) return;
    const name = els.editCustomEffectName.value.trim() || t('untitledEffect');
    if (!(await showConfirm(t('confirmDeleteEffect').replace('{name}', name)))) return;
    const data = await chrome.storage.local.get(CUSTOM_EFFECTS_KEY);
    const list = (data[CUSTOM_EFFECTS_KEY] || []).filter((e) => e.id !== currentEditingEffectId);
    await chrome.storage.local.set({ [CUSTOM_EFFECTS_KEY]: list });
    closeCustomEffectEditor();
  });

  els.editCustomEffectExportBtn.addEventListener('click', async () => {
    if (!currentEditingEffectId) return;
    const data = await chrome.storage.local.get(CUSTOM_EFFECTS_KEY);
    const entry = (data[CUSTOM_EFFECTS_KEY] || []).find((e) => e.id === currentEditingEffectId);
    if (entry) exportCustomEffectEntry(entry);
  });

  els.importCustomEffectBtn.addEventListener('click', () => els.importEffectFile.click());
  els.importEffectFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) importCustomEffectFile(file);
    e.target.value = '';
  });

  function renderEditTimeCards() {
    if (!els.editTimePeriodsList || !currentEditSettings) return;
    els.editTimePeriodsList.innerHTML = '';
    const items = currentEditSettings.timeRange.items || [];
    const formatHour = h => String(h).padStart(2, '0') + ':00';

    items.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'scheme-card';
      if (idx === editActiveTimePeriodIndex) card.classList.add('active');
      card.dataset.index = idx;

      const preview = document.createElement('div');
      preview.className = 'scheme-card-preview';
      updateCardPreview(preview, item);
      card.appendChild(preview);

      const info = document.createElement('div');
      info.className = 'scheme-card-info';
      
      const icon = document.createElement('span');
      icon.innerHTML = `<svg class="scheme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M5.22 5.22l1.42 1.42M18.78 5.22l-1.42 1.42M2 12h2M20 12h2"/></svg>`;
      info.appendChild(icon);

      const span = document.createElement('span');
      span.textContent = `${item.name || (lang === 'zh' ? '未命名' : 'Unnamed')} (${formatHour(item.start)} - ${formatHour(item.end)})`;
      info.appendChild(span);
      card.appendChild(info);

      if (items.length > 1) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-card-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.type = 'button';
        deleteBtn.title = lang === 'zh' ? '删除此时段' : 'Delete period';
        deleteBtn.style.cssText = 'position: absolute; top: 4px; right: 4px; border: none; background: rgba(0,0,0,0.4); color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; z-index: 10;';
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (items.length <= 1) return;
          items.splice(idx, 1);
          if (editActiveTimePeriodIndex >= items.length) {
            editActiveTimePeriodIndex = items.length - 1;
          }
          renderEditTimeCards();
          const activeItem = items[editActiveTimePeriodIndex];
          if (activeItem) {
            populateEditForm(activeItem);
            populateTimeRangeEditPanel(activeItem);
          }
          queueEditAutoSave();
        });
        card.appendChild(deleteBtn);
      }

      card.addEventListener('click', () => {
        if (editActiveTimePeriodIndex === idx) return;
        const prevItem = items[editActiveTimePeriodIndex];
        if (prevItem) {
          collectEditFormTo(prevItem);
          collectTimeRangeEditPanel(prevItem);
        }
        editActiveTimePeriodIndex = idx;
        renderEditTimeCards();
        const activeItem = items[editActiveTimePeriodIndex];
        if (activeItem) {
          populateEditForm(activeItem);
          populateTimeRangeEditPanel(activeItem);
        }
      });

      els.editTimePeriodsList.appendChild(card);
    });

    const addCard = document.createElement('div');
    addCard.className = 'scheme-card add-time-card';
    addCard.style.cssText = 'border: 2px dashed var(--border-color); background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 24px; color: var(--text-secondary); min-height: 80px; border-radius: var(--radius); position: relative;';
    addCard.textContent = '+';
    addCard.addEventListener('click', () => {
      const template = {
        id: 'period_' + Date.now(),
        name: lang === 'zh' ? '新时段' : 'New Period',
        start: 0,
        end: 23,
        type: 'none',
        value: '',
        opacity: 100,
        blur: 0,
        style: { fixed: true, size: 'cover', repeat: false }
      };
      items.push(template);
      editActiveTimePeriodIndex = items.length - 1;
      renderEditTimeCards();
      const activeItem = items[editActiveTimePeriodIndex];
      if (activeItem) {
        populateEditForm(activeItem);
        populateTimeRangeEditPanel(activeItem);
      }
      queueEditAutoSave();
    });
    els.editTimePeriodsList.appendChild(addCard);
  }

  function initTimeRangePeriodSelects() {
    const selects = [els.editTimePeriodStart, els.editTimePeriodEnd];
    selects.forEach(selectEl => {
      if (!selectEl) return;
      selectEl.innerHTML = '';
      for (let h = 0; h < 24; h++) {
        const opt = document.createElement('option');
        opt.value = h;
        opt.textContent = String(h).padStart(2, '0') + ':00';
        selectEl.appendChild(opt);
      }
    });

    if (els.editTimePeriodName) {
      els.editTimePeriodName.addEventListener('input', () => {
        if (!currentEditSettings || !currentEditSettings.timeRange || !currentEditSettings.timeRange.items) return;
        const activeItem = currentEditSettings.timeRange.items[editActiveTimePeriodIndex];
        if (activeItem) {
          activeItem.name = els.editTimePeriodName.value.trim();
          renderEditTimeCards();
          queueEditAutoSave();
        }
      });
    }

    if (els.editTimePeriodStart) {
      els.editTimePeriodStart.addEventListener('change', () => {
        if (!currentEditSettings || !currentEditSettings.timeRange || !currentEditSettings.timeRange.items) return;
        const activeItem = currentEditSettings.timeRange.items[editActiveTimePeriodIndex];
        if (activeItem) {
          activeItem.start = parseInt(els.editTimePeriodStart.value, 10);
          renderEditTimeCards();
          queueEditAutoSave();
        }
      });
    }

    if (els.editTimePeriodEnd) {
      els.editTimePeriodEnd.addEventListener('change', () => {
        if (!currentEditSettings || !currentEditSettings.timeRange || !currentEditSettings.timeRange.items) return;
        const activeItem = currentEditSettings.timeRange.items[editActiveTimePeriodIndex];
        if (activeItem) {
          activeItem.end = parseInt(els.editTimePeriodEnd.value, 10);
          renderEditTimeCards();
          queueEditAutoSave();
        }
      });
    }
  }

  function populateTimeRangeEditPanel(item) {
    if (!item) return;
    if (els.editTimePeriodName) els.editTimePeriodName.value = item.name || '';
    if (els.editTimePeriodStart) els.editTimePeriodStart.value = item.start;
    if (els.editTimePeriodEnd) els.editTimePeriodEnd.value = item.end;
  }

  function collectTimeRangeEditPanel(item) {
    if (!item) return;
    if (els.editTimePeriodName) item.name = els.editTimePeriodName.value.trim() || (lang === 'zh' ? '未命名' : 'Unnamed');
    if (els.editTimePeriodStart) item.start = parseInt(els.editTimePeriodStart.value, 10);
    if (els.editTimePeriodEnd) item.end = parseInt(els.editTimePeriodEnd.value, 10);
  }

  initTimeRangePeriodSelects();
});

// language defaults to 'css'. When Prism doesn't have a grammar for the
// requested language loaded (lib/prism.js only bundles core+css — no
// javascript/clike component), falls back to plain escaped text so the
// gutter/tab/bracket-autocomplete behavior below still works without color
// highlighting, rather than throwing on Prism.highlight(code, undefined, ...).
function initCodeEditor(textareaId, containerId, language) {
  language = language || 'css';
  const textarea = document.getElementById(textareaId);
  const container = document.getElementById(containerId);
  if (!textarea || !container) return null;

  const gutter = container.querySelector('.editor-gutter');
  const codeBlock = container.querySelector('.editor-highlight code');
  const preBlock = container.querySelector('.editor-highlight');
  const grammar = window.Prism && Prism.languages[language];

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function updateEditor() {
    let code = textarea.value;
    const isPlaceholder = !code;

    if (isPlaceholder) {
      code = textarea.getAttribute('placeholder') || '';
      container.classList.add('placeholder-active');
    } else {
      container.classList.remove('placeholder-active');
    }

    const highlighted = grammar ? Prism.highlight(code, grammar, language) : escapeHtml(code);
    codeBlock.innerHTML = code.endsWith('\n') ? highlighted + ' ' : highlighted;

    const lineCount = code.split('\n').length;
    let gutterHTML = '';
    for (let i = 1; i <= lineCount; i++) {
      gutterHTML += `<span class="editor-gutter-num">${i}</span>`;
    }
    gutter.innerHTML = gutterHTML;
    
    syncScrolls();
  }

  function syncScrolls() {
    gutter.scrollTop = textarea.scrollTop;
    preBlock.scrollTop = textarea.scrollTop;
    preBlock.scrollLeft = textarea.scrollLeft;
  }

  textarea.addEventListener('scroll', syncScrolls);
  textarea.addEventListener('input', updateEditor);

  textarea.addEventListener('keydown', (e) => {
    const val = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // 1. Tab Key Support (2 spaces)
    if (e.key === 'Tab') {
      e.preventDefault();
      textarea.value = val.substring(0, start) + '  ' + val.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;
      updateEditor();
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // 2. Overwrite closing character if already typed
    const closers = ['}', ')', ']', '"', "'"];
    if (closers.includes(e.key) && start === end) {
      const nextChar = val.charAt(start);
      if (nextChar === e.key) {
        e.preventDefault();
        textarea.selectionStart = textarea.selectionEnd = start + 1;
        return;
      }
    }

    // 3. Auto-closing brackets
    const pairs = {
      '{': '}',
      '(': ')',
      '[': ']',
      '"': '"',
      "'": "'"
    };

    if (pairs[e.key] !== undefined) {
      e.preventDefault();
      const closing = pairs[e.key];
      if (start !== end) {
        const selected = val.substring(start, end);
        textarea.value = val.substring(0, start) + e.key + selected + closing + val.substring(end);
        textarea.selectionStart = start + 1;
        textarea.selectionEnd = end + 1;
      } else {
        textarea.value = val.substring(0, start) + e.key + closing + val.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }
      updateEditor();
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // 4. Smart Indentation on Enter key
    if (e.key === 'Enter' && start === end) {
      const charBefore = val.charAt(start - 1);
      const charAfter = val.charAt(start);
      if (charBefore === '{' && charAfter === '}') {
        e.preventDefault();
        textarea.value = val.substring(0, start) + '\n  \n' + val.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 3;
        updateEditor();
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (charBefore === '{') {
        e.preventDefault();
        textarea.value = val.substring(0, start) + '\n  ' + val.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 3;
        updateEditor();
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  });

  updateEditor();

  return {
    update: updateEditor
  };
}
