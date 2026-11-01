// utils/mockTraffic.js
// 生成与示例图形态一致的 24 小时上行速率 mock 数据(纯函数, 不依赖 wx)
// CommonJS 导出, 便于小程序与 node 脚本(SSR 验证)共用

const BANDWIDTH_G = 10 // 接入带宽 (G)
const MAC = '0c:42:a1:0c:e4:dc'
const IP = '120.241.236.52'
const DEVICE_NAME = '鹏达'
const YESTERDAY_LEVEL = 40.11 // 昨日水位 (%), mock 固定值

const START = new Date(2026, 9, 30, 19, 0, 0) // 26-10-30 19:00
const STEP_MIN = 10
const POINTS = 145 // 19:00 → 次日 19:00, 每 10 分钟一个点

// 可复现伪随机 (mulberry32), 保证每次进入页面图形一致
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const lerp = (x0, y0, x1, y1, x) => y0 + ((x - x0) / (x1 - x0)) * (y1 - y0)

// 示例图形态的分段基线, t 为距 26-10-30 19:00 的分钟数
function baseline(t) {
  if (t <= 310) return 0.08 // 夜间静默
  if (t <= 320) return lerp(310, 0.08, 320, 5.6, t) // 00:20 陡升尖峰
  if (t <= 560) return 0.62 + 4.98 * Math.exp(-(t - 320) / 95) // 峰值指数回落
  if (t <= 650) return 0.62 // 凌晨谷底
  if (t <= 1040) {
    // 白天逐级爬升
    const anchors = [[650, 0.7], [720, 1.4], [800, 2.3], [880, 3.4], [960, 4.5], [1040, 5.35]]
    for (let i = 1; i < anchors.length; i++) {
      if (t <= anchors[i][0]) {
        return lerp(anchors[i - 1][0], anchors[i - 1][1], anchors[i][0], anchors[i][1], t)
      }
    }
  }
  if (t <= 1060) return lerp(1040, 5.35, 1060, 2.5, t) // 12:40 骤降
  if (t <= 1080) return lerp(1060, 2.5, 1080, 5.95, t) // 快速恢复
  if (t <= 1220) return 6.0 + 0.3 * Math.exp(-(t - 1080) / 40) // 午后高位平台
  if (t <= 1360) return lerp(1220, 6.0, 1360, 5.0, t) // 缓慢回落
  if (t <= 1370) return lerp(1360, 5.0, 1370, 0.1, t) // 17:50 归零
  return 0.06
}

// 各分段叠加的随机噪声幅度
function noiseAmp(t) {
  if (t <= 310) return 0.03
  if (t <= 320) return 0
  if (t <= 560) return 0.06
  if (t <= 650) return 0.07
  if (t <= 1040) return 0.12
  if (t <= 1080) return 0.15
  if (t <= 1220) return 0.22
  if (t <= 1360) return 0.18
  if (t <= 1370) return 0
  return 0.02
}

function pad2(n) {
  return n < 10 ? '0' + n : '' + n
}

function formatTime(date) {
  const y = date.getFullYear() % 100
  return `${y}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function buildTrafficSeries() {
  const rand = mulberry32(20261030)
  const points = []
  for (let i = 0; i < POINTS; i++) {
    const t = i * STEP_MIN
    const jitter = (rand() - 0.5) * 2 * noiseAmp(t)
    const value = Math.min(6.6, Math.max(0.02, baseline(t) + jitter))
    points.push({
      time: formatTime(new Date(START.getTime() + t * 60000)),
      value: Math.round(value * 100) / 100,
    })
  }
  return points
}

module.exports = {
  BANDWIDTH_G,
  MAC,
  IP,
  DEVICE_NAME,
  YESTERDAY_LEVEL,
  formatTime,
  buildTrafficSeries,
  timeRangeText: `${formatTime(START)} 至 ${formatTime(new Date(START.getTime() + 24 * 3600000))}`,
}
