# CLAUDE.md — 本项目协作指引

面向在本仓库工作的开发者与 AI 编码助手(如 Claude Code)。先读这里,再动手。

## 项目一句话

微信小程序 demo:用原生框架 + echarts-for-weixin 复刻一张可交互流量监控图(折线面积图,
触摸准线 + tooltip),数据为本地 mock。需求样例与演进截图在 `question/`(**不入库**,见 .gitignore)。

## 常用操作

- 运行:微信开发者工具「导入项目」选仓库根目录,首页即流量卡片。
- 渲染验证(改了图表配置必跑):
  ```
  node scripts/verify-render.js
  ```
  按 330×360(iPhone6 基准)SSR 渲染,断言文字零越界 + 轴刻度内容,exit 0 通过。无 npm 依赖。
- 数据形态验证:mock 生成器是纯函数,可直接 `node -e "require('./utils/mockTraffic').buildTrafficSeries()"` 检查。

## 架构约定(改动前必读)

```
数据层 utils/mockTraffic.js   →  配置层 utils/trafficOption.js  →  渲染层 components/ec-canvas/
(纯函数, CommonJS, 不依赖 wx)    (纯函数, CommonJS, 不依赖 wx)     (上游第三方, 保持原样勿改)
```

- **水位 = 速率 ÷ 带宽**。所有水位指标由数据推导,禁止硬编码数值。
- 页面(`pages/index/index.js`)只做「翻译」:把数据与配置注入组件,不写绘制逻辑。
- utils 保持 **CommonJS** 且不碰 `wx`:这是 node 能直接跑它们的前提(SSR 验证依赖此)。
- `components/ec-canvas/` 是上游官方组件,**不要修改**;升级时整目录替换后跑验证脚本。
- mock 数据用 mulberry32 种子随机(种子 20261030):同种子同曲线。改曲线形状只动
  `baseline()` 的分段锚点;改噪声只动 `noiseAmp()`。

## 踩坑清单(症状 → 原因 → 处置)

1. 图表白屏/不渲染 → 渲染器问题:本项目 app.json 用 `webview`,**别改回 skyline**
   (ec-canvas 的 canvas 2d 依赖 webview 渲染器,Skyline 兼容性官方未背书)。
2. 轴标签/轴名被裁 → `containLabel: true` 不计旋转标签宽度;轴名默认以轴线居中。
   处置:grid.left 手动留足(~55px 旋转横向分量),y 轴名 `nameTextStyle.align: 'left'`。
3. x 轴首二刻度间隔异常翻倍 → 强制 `showMinLabel: true` 后,第二个刻度与首标签
   旋转包围盒重叠被 ECharts 自动抑制。处置:interval 放大到 120min(interval: 11)。
4. tooltip 富文本(HTML marker)显示异常 → 小程序 canvas 模式下不可靠,用纯文本 formatter。
5. node ≥ 21 require echarts 构建版报 `window is not defined` → 先
   `delete globalThis.navigator` 再 require(构建版环境误判)。
6. node 跑完 SSR 不退出 → 缺 `chart.dispose()`(动画定时器挂住事件循环)。

## 边界与状态(截至最后提交)

- 已完成:卡片 UI、交互图表、确定性 mock(145 点/10min)、SSR 验证体系、三轮模拟器实测修复。
- 未做:真实数据接口、ECharts 按需裁剪(~1MB 包体)、真机复核、深色模式。
  取舍理由详见 `文档/开发过程.md`,功能与架构详见 `文档/项目介绍.md`。
- 远程:GitHub `Pikature/Traffic-Monitoring-demo`(main 分支)。
- `project.config.json` 的 appid 是占位符 `touristappid`(公开仓库不携带真实 appid);
  本地开发预览时在开发者工具里改回自己的 appid 即可,勿提交真实值。

## 不入库清单(.gitignore 已配)

- `question/`:任务材料与本地截图;
- `project.private.config.json`:开发者工具个人配置,每台机器各自生成,勿手动提交。
