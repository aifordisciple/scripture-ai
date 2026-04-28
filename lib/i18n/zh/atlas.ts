export const atlas = {
  atlas: {
    // AtlasPanel
    loadingMap: '加载地图中...',
    extractingLocations: '正在从经文中提取地点...',
    extractFailed: '提取地点失败',
    identifiedLocations: '识别到 {count} 个地点：',
    tabMap: '地图',
    tabTimeline: '时间线',
    tabJourney: '旅程',
    // LocationCard
    biblicalSignificance: '圣经意义',
    loadingRelatedVerses: '加载相关经文...',
    relatedVerses: '相关经文',
    viewAllRelatedVerses: '查看全部相关经文',
    // LocationVersesView
    relatedVersesOf: '{locationName} 相关经文',
    loadingVerses: '正在加载相关经文...',
    noRelatedVerses: '暂无相关经文记录',
    foundVersesCount: '找到 {count} 处相关经文',
    // TimelineSlider
    bcYear: '公元前 {year} 年',
    adYear1: '公元 1 年',
    adYear: '公元 {year} 年',
    eventsInPeriod: '该时期的事件',
    loading: '加载中...',
    noEventsInPeriod: '该时期暂无记录的事件',
    bc: '公元前',
    ad: '公元',
    approx: ' (约)',
    keyEventAbraham: '亚伯拉罕',
    keyEventExodus: '出埃及',
    keyEventDavidDynasty: '大卫王朝',
    keyEventBabylonianExile: '被掳巴比伦',
    keyEventTempleRebuilt: '圣殿重建',
    keyEventJesusBirth: '耶稣诞生',
    keyEventJesusCrucifixion: '耶稣受难',
    keyEventJerusalemDestroyed: '耶路撒冷被毁',
    // MapView
    loadingLocationData: '加载地点数据中...',
    eventYearBc: '公元前{year}年',
    eventYearAd: '公元{year}年',
    stopOrder: '第 {order} 站',
    // JourneyPlayer
    loadingJourneyData: '加载旅程数据中...',
    selectJourney: '选择旅程',
    stopsCount: '{count} 站',
    noJourneyData: '暂无旅程数据',
    returnToList: '← 返回列表',
    journeyStep: '第 {current} / {total} 站',
    // LocationSearch
    searchPlaceholder: '搜索地点...',
  },
} as const
