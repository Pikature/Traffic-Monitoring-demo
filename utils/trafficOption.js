// utils/trafficOption.js
// 示例图 → ECharts option 的翻译层。独立成模块以便用 node SSR 渲染做越界验证。
// CommonJS 导出, 便于小程序与 node 脚本共用。

const echarts = require('../components/ec-canvas/echarts')
const { BANDWIDTH_G, MAC, buildTrafficSeries } = require('./mockTraffic')

const series = buildTrafficSeries()

function buildChartOption() {
  return {
    // left 需容纳 45° 旋转后首标签向左下伸出的横向分量(~55px), 否则首标签被裁或被自动隐藏
    grid: { left: 48, right: 32, top: 56, bottom: 16, containLabel: true },
    tooltip: {
      trigger: 'axis',
      confine: true,
      axisPointer: {
        type: 'line',
        lineStyle: { type: 'dashed', color: '#b0b0b6' },
      },
      backgroundColor: '#ffffff',
      borderColor: '#e6e6ea',
      borderWidth: 1,
      padding: [10, 14],
      textStyle: { color: '#333', fontSize: 12 },
      formatter: (params) => {
        const p = params[0]
        const level = ((p.value / BANDWIDTH_G) * 100).toFixed(1)
        return `${p.name}\n● ${MAC}: ${p.value.toFixed(2)} G\n参考水位: ${level}%`
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: series.map((p) => p.time),
      axisLabel: {
        rotate: 45,
        // 每 120 分钟一个刻度。为何不是示例图的 80 分钟(interval:7): 窄画布上强制显示
        // 首标签 19:00 后, 相邻的 20:20 刻度与其旋转标签几乎完全重叠, 会被 ECharts
        // 自动抑制, 造成首二标签间隔 160 分钟的空档; 120 分钟间距可避开抑制且均匀。
        interval: 11,
        showMinLabel: true, // 默认 auto 时首标签因越界被自动隐藏, 强制显示
        showMaxLabel: false, // 隐藏最右 19:00 刻度, 末标签止于 17:00
        fontSize: 10,
        color: '#8a8a8f',
      },
      axisLine: { lineStyle: { color: '#d8d8dc' } },
      axisTick: { alignWithLabel: true, lineStyle: { color: '#d8d8dc' } },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 7,
      interval: 1,
      name: '上行速率（G）',
      // align left: 名称以轴线为左端向右排布, 避免左侧伸出画布被裁
      nameTextStyle: { color: '#55555a', fontSize: 12, align: 'left', padding: [0, 0, 8, 0] },
      axisLabel: { color: '#8a8a8f', fontSize: 11 },
      splitLine: { lineStyle: { color: '#ececf0' } },
    },
    series: [
      {
        name: MAC,
        type: 'line',
        data: series.map((p) => p.value),
        showSymbol: false,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { width: 2, color: '#4A7DFF' },
        itemStyle: { color: '#4A7DFF' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(74, 125, 255, 0.28)' },
            { offset: 1, color: 'rgba(74, 125, 255, 0.03)' },
          ]),
        },
      },
    ],
  }
}

module.exports = { buildChartOption, series }
