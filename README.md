# Traffic-Monitoring-demo

微信小程序示例项目:复刻一张设备级「上行速率」可交互流量监控图。

以一张流量监控卡片为载体,实现折线面积图、触摸十字准线、tooltip 联动、水位指标自动推导;
数据为本地确定性 mock,开箱即跑,无需任何后端或密钥。

## 功能特性

- **监控卡片**:设备标题行(名称/MAC/IP + 统计时段)与指标行(接入带宽 / 当前水位 / 昨日水位)
- **24h 流量图**:145 个采样点(10 分钟粒度)折线 + 渐变面积图,45° 旋转时间轴
- **触摸交互**:按住图表滑动出现虚线准线与 tooltip(时间、速率、参考水位实时换算)
- **确定性 mock**:种子伪随机生成,同一种子恒定同一条曲线,便于回归与演示
- **渲染可验证**:附带 node 脚本,不打开 IDE 即可断言图表文字零越界

## 快速开始

```bash
git clone https://github.com/Pikature/Traffic-Monitoring-demo.git
```

1. 打开**微信开发者工具** → 「导入项目」→ 选择仓库根目录(基础库 ≥ 2.9.0,推荐 3.x);
2. 首页即流量监控卡片,模拟器/真机中按住图表滑动可体验准线与 tooltip;
3. (可选)渲染验证:

```bash
node scripts/verify-render.js   # SSR 渲染断言, exit 0 即通过, 无 npm 依赖
```

> 说明:project.config.json 使用占位 appid(`touristappid`),游客模式即可打开;
> 需真机预览时在开发者工具中改回自己的 appid(请勿提交真实值)。

## 目录结构

```
pages/index/              监控卡片页面(唯一业务页)
components/ec-canvas/     echarts-for-weixin 官方组件(未修改)
utils/mockTraffic.js      mock 数据生成器(纯函数)
utils/trafficOption.js    ECharts 配置构造(纯函数)
scripts/verify-render.js  SSR 渲染验证脚本
文档/                     项目介绍 与 开发过程 两份文档
CLAUDE.md                 面向后续开发者/AI 协作的工程指引
```

## 技术栈

| 项 | 说明 |
|---|---|
| 框架 | 微信小程序原生(WebView 渲染器) |
| 图表 | ECharts 5.3.3,经 echarts-for-weixin(ec-canvas, canvas 2d)适配 |
| 验证 | Node.js 内置能力 + ECharts SSR,零第三方依赖 |

## 提交结构

- `初始化`: 微信开发者工具 quickstart 基础模板
- `最终版`: 完整实现(图表、交互、mock 数据、文档、验证脚本)

更多设计取舍与踩坑记录见 [文档/开发过程.md](文档/开发过程.md),
架构与扩展指南见 [文档/项目介绍.md](文档/项目介绍.md)。

## 说明

本项目为学习/演示用途;mock 数据形态参考示例监控图,不代表任何真实设备流量。
