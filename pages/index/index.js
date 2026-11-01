// index.js
const echarts = require('../../components/ec-canvas/echarts')
const {
  BANDWIDTH_G,
  MAC,
  IP,
  DEVICE_NAME,
  YESTERDAY_LEVEL,
  timeRangeText,
} = require('../../utils/mockTraffic')
const { buildChartOption, series } = require('../../utils/trafficOption')

// ec-canvas 组件在 ready 时回调 initChart, 页面侧仅通过 ec 参数注入
function initChart(canvas, width, height, dpr) {
  const chart = echarts.init(canvas, null, { width, height, devicePixelRatio: dpr })
  canvas.setChart(chart)
  chart.setOption(buildChartOption())
  return chart
}

Page({
  data: {
    deviceTitle: `${DEVICE_NAME} / ${MAC} / ${IP}`,
    bandwidthText: `${BANDWIDTH_G} G`,
    timeRangeText,
    currentLevel: '0.00',
    yesterdayLevel: YESTERDAY_LEVEL.toFixed(2),
    ec: { onInit: initChart },
  },
  onLoad() {
    // 当前水位 = 末点速率 ÷ 接入带宽
    const last = series[series.length - 1]
    this.setData({ currentLevel: ((last.value / BANDWIDTH_G) * 100).toFixed(2) })
  },
})
