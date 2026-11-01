// scripts/verify-render.js
// 用 ECharts SSR 模式按手机尺寸真实渲染图表, 检查文字元素是否越出画布(即被裁剪)。
// 用法: node scripts/verify-render.js   (项目根目录下执行)
// 说明: 宽高取 iPhone6 基准 (ec-canvas 720rpx 高, 卡片内宽约 638rpx ≈ 330x360px)

// echarts 构建版按环境自适应: Node ≥21 自带 navigator 全局会被误判为浏览器而崩溃,
// 删掉后走其内置 node 分支(svgSupported=true), SSR 才可用。必须在 require 之前删。
delete globalThis.navigator

const echarts = require('../components/ec-canvas/echarts')
const { buildChartOption } = require('../utils/trafficOption')

const WIDTH = 330
const HEIGHT = 360

console.log('echarts version:', echarts.version)

const chart = echarts.init(null, null, {
  renderer: 'svg',
  ssr: true,
  width: WIDTH,
  height: HEIGHT,
})
chart.setOption(buildChartOption())
const svg = chart.renderToSVGString()
chart.dispose()

// ---- 解析 <text> 元素的包围盒 ----
// 位置可能写在 x/y 属性, 也可能写在 transform 的 translate/matrix 里, 两者都处理。
// 文字宽度按字符估算: CJK≈1em, latin/数字≈0.6em; 45° 旋转(矩阵 0.707)按对角分量展开。
function charWidth(str, fs) {
  let w = 0
  for (const ch of str) w += ch.charCodeAt(0) > 0x2e7f ? fs : fs * 0.6
  return w
}

const tagRe = /<text([^>]*)>([^<]*)<\/text>/g
let m
const boxes = []
while ((m = tagRe.exec(svg))) {
  const attrs = m[1]
  const content = m[2].trim()
  if (!content) continue
  const get = (k) => {
    const r = attrs.match(new RegExp(k + '="([^"]*)"'))
    return r ? r[1] : null
  }
  const anchor = get('text-anchor') || 'start'
  const fs = parseFloat((attrs.match(/font-size:(\d+(?:\.\d+)?)px/) || [])[1] || '12')

  // 基准点: 优先 transform, 回退 x/y 属性
  let px = parseFloat(get('x'))
  let py = parseFloat(get('y'))
  let cos = 1 // 旋转变换后基线方向的横向分量
  let sin = 0 // 纵向分量(向下为正)
  const mat = attrs.match(/matrix\(([-\d.,\s]+)\)/)
  const tra = attrs.match(/translate\(([-\d.\s]+)\)/)
  if (mat) {
    const v = mat[1].split(',').map(Number)
    cos = Math.abs(v[0])
    sin = Math.abs(v[1]) // matrix(0.707,-0.707,...) → 文字向右下延伸
    px = v[4]
    py = v[5]
  } else if (tra) {
    const v = tra[1].trim().split(/\s+/).map(Number)
    px = v[0]
    py = v.length > 1 ? v[1] : 0
  }
  if (Number.isNaN(px) || Number.isNaN(py)) {
    console.log(`无法解析定位, 跳过: "${content}"`)
    continue
  }

  const w = charWidth(content, fs)
  // anchor=end 时文字从基准点向基线反方向延伸
  const x0 = anchor === 'end' ? px - w * cos : px
  const x1 = x0 + w * cos
  const y0 = py
  const y1 = py + w * sin + fs
  boxes.push({ content, x0, x1, y0, y1 })
}

// ---- 越界检查 ----
let overflow = 0
for (const b of boxes) {
  if (b.x0 < -1 || b.x1 > WIDTH + 1 || b.y0 < -10 || b.y1 > HEIGHT + 1) {
    overflow++
    console.log(
      `越界: "${b.content}" x∈[${b.x0.toFixed(1)}, ${b.x1.toFixed(1)}] y∈[${b.y0.toFixed(1)}, ${b.y1.toFixed(1)}]`
    )
  }
}

// ---- 内容期望检查 ----
// 刻度策略: 每 120 分钟(interval:11) + 强制首标签, 12 个标签均匀分布。
// 不用示例图的 80 分钟: 该间距下第 2 个刻度会被首标签的旋转包围盒挤掉产生空档。
const labels = boxes.map((b) => b.content)
const xlabels = labels.filter((t) => /^\d\d-\d\d-\d\d \d\d:\d\d$/.test(t))
const expect = (cond, msg) => console.log((cond ? '通过' : '失败') + ':', msg)
expect(labels.includes('上行速率（G）'), 'y 轴名存在')
expect(xlabels[0] === '26-10-30 19:00', 'x 轴首标签为 19:00')
expect(xlabels[1] === '26-10-30 21:00', '第 2 个标签为 21:00(间距均匀, 无空档)')
expect(xlabels[xlabels.length - 1] === '26-10-31 17:00', 'x 轴末标签为 17:00')
expect(!labels.includes('26-10-31 19:00'), '最右 19:00 刻度已隐藏')
expect(xlabels.length === 12, 'x 轴标签共 12 个')

console.log(`画布 ${WIDTH}x${HEIGHT}, 文本元素 ${boxes.length} 个, 越界 ${overflow} 个`)
process.exit(overflow === 0 ? 0 : 1)
