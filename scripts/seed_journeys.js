// scripts/seed_journeys.js
// 圣经旅程种子数据脚本

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 需要添加的额外地点（用于旅程）
const ADDITIONAL_LOCATIONS = [
  {
    nameZh: '兰塞',
    nameEn: 'Rameses',
    nameOriginal: 'רַעְמְסֵס',
    aliases: ['兰塞城'],
    latitude: 30.8000,
    longitude: 31.8333,
    region: '埃及',
    modernCountry: '埃及',
    description: '以色列人出埃及的起点，位于尼罗河三角洲。',
    significance: '以色列人从此地起行出埃及。',
  },
  {
    nameZh: '疏割',
    nameEn: 'Succoth',
    nameOriginal: 'סֻכּוֹת',
    aliases: [],
    latitude: 29.6000,
    longitude: 32.3000,
    region: '埃及',
    modernCountry: '埃及',
    description: '以色列人出埃及后的第一个营地。',
    significance: '以色列人从兰塞起行，安营在疏割。',
  },
  {
    nameZh: '以倘',
    nameEn: 'Etham',
    nameOriginal: 'אֵתָם',
    aliases: [],
    latitude: 29.5000,
    longitude: 32.8000,
    region: '埃及',
    modernCountry: '埃及',
    description: '以色列人出埃及后经过的地点。',
    significance: '以色列人从疏割起行，安营在旷野边的以倘。',
  },
  {
    nameZh: '比哈希录',
    nameEn: 'Pi Hahiroth',
    nameOriginal: 'פִּי הַחִירוֹת',
    aliases: [],
    latitude: 29.2000,
    longitude: 33.0000,
    region: '埃及',
    modernCountry: '埃及',
    description: '位于红海边，以色列人过红海前的营地。',
    significance: '以色列人在此安营，面对红海，后有埃及军兵追赶。',
  },
  {
    nameZh: '红海',
    nameEn: 'Red Sea',
    nameOriginal: 'יַם סוּף',
    aliases: ['芦苇海'],
    latitude: 29.0000,
    longitude: 33.0000,
    region: '埃及',
    modernCountry: '埃及/沙特',
    description: '神使红海分开，以色列人走干地过海。',
    significance: '神藉摩西分开红海，以色列人得救，埃及军兵被淹没。',
  },
  {
    nameZh: '玛拉',
    nameEn: 'Marah',
    nameOriginal: 'מָרָה',
    aliases: [],
    latitude: 28.9000,
    longitude: 33.2000,
    region: '西奈旷野',
    modernCountry: '埃及',
    description: '水苦不能喝，神指示摩西把树丢在水里，水就变甜了。',
    significance: '神在旷野中供应以色列人的需要。',
  },
  {
    nameZh: '以琳',
    nameEn: 'Elim',
    nameOriginal: 'אֵילִם',
    aliases: [],
    latitude: 28.8000,
    longitude: 33.4000,
    region: '西奈旷野',
    modernCountry: '埃及',
    description: '有十二股水泉，七十棵棕树。',
    significance: '神在旷野中为以色列人预备安歇之处。',
  },
  {
    nameZh: '汛旷野',
    nameEn: 'Wilderness of Sin',
    nameOriginal: 'מִדְבַּר סִין',
    aliases: [],
    latitude: 28.7000,
    longitude: 33.8000,
    region: '西奈旷野',
    modernCountry: '埃及',
    description: '以色列人在此抱怨没有食物。',
    significance: '神从天上降下吗哪给以色列人吃。',
  },
  {
    nameZh: '利非订',
    nameEn: 'Rephidim',
    nameOriginal: 'רְפִידִים',
    aliases: [],
    latitude: 28.6000,
    longitude: 34.0000,
    region: '西奈旷野',
    modernCountry: '埃及',
    description: '以色列人在此没有水喝，也与亚玛力人争战。',
    significance: '摩西击打磐石出水；约书亚战胜亚玛力人。',
  },
  {
    nameZh: '基博罗哈他瓦',
    nameEn: 'Kibroth Hattaavah',
    nameOriginal: 'קִבְרוֹת הַתַּאֲוָה',
    aliases: ['贪欲之人的坟墓'],
    latitude: 29.0000,
    longitude: 34.5000,
    region: '巴兰旷野',
    modernCountry: '埃及',
    description: '百姓抱怨没有肉吃，神赐下鹌鹑，许多人因贪吃而死。',
    significance: '神管教百姓的贪欲。',
  },
  {
    nameZh: '摩押平原',
    nameEn: 'Plains of Moab',
    nameOriginal: 'עֲרְבוֹת מוֹאָב',
    aliases: [],
    latitude: 31.8000,
    longitude: 35.6000,
    region: '摩押',
    modernCountry: '约旦',
    description: '以色列人在此安营，准备过约旦河进入迦南。',
    significance: '巴兰在此祝福以色列人；摩西在此去世。',
  },
  {
    nameZh: '吾珥',
    nameEn: 'Ur',
    nameOriginal: 'אוּר כַּשְׂדִּים',
    aliases: ['迦勒底的吾珥'],
    latitude: 30.9628,
    longitude: 46.1031,
    region: '巴比伦',
    modernCountry: '伊拉克',
    description: '亚伯拉罕的出生地，位于美索不达米亚南部。',
    significance: '神呼召亚伯拉罕离开吾珥，前往应许之地。',
  },
  {
    nameZh: '哈兰',
    nameEn: 'Haran',
    nameOriginal: 'חָרָן',
    aliases: [],
    latitude: 36.8667,
    longitude: 39.0333,
    region: '亚兰',
    modernCountry: '土耳其',
    description: '亚伯拉罕的父亲他拉在此去世。',
    significance: '亚伯拉罕在此蒙神呼召继续前往迦南。',
  },
  {
    nameZh: '什亭',
    nameEn: 'Shittim',
    nameOriginal: 'שִׁטִּים',
    aliases: ['亚伯什亭'],
    latitude: 31.8500,
    longitude: 35.6000,
    region: '摩押',
    modernCountry: '约旦',
    description: '以色列人过约旦河前的最后一个营地。',
    significance: '以色列人由此过约旦河进入迦南。',
  },
  {
    nameZh: '艾城',
    nameEn: 'Ai',
    nameOriginal: 'עַי',
    aliases: [],
    latitude: 31.9167,
    longitude: 35.2500,
    region: '便雅悯',
    modernCountry: '巴勒斯坦',
    description: '耶利哥附近的一座小城。',
    significance: '因亚干犯罪，以色列人首次攻打失败。处理罪后，以计取胜。',
  },
  {
    nameZh: '底璧',
    nameEn: 'Debir',
    nameOriginal: 'דְּבִיר',
    aliases: ['基列西弗'],
    latitude: 31.4500,
    longitude: 35.1000,
    region: '犹大山地',
    modernCountry: '以色列',
    description: '犹大山地南部的城市。',
    significance: '俄陀聂夺取此城，获得押撒为妻。',
  },
  {
    nameZh: '居比路',
    nameEn: 'Cyprus',
    nameOriginal: 'Κύπρος',
    aliases: ['塞浦路斯'],
    latitude: 35.1264,
    longitude: 33.4299,
    region: '地中海',
    modernCountry: '塞浦路斯',
    description: '地中海东部的一个大岛。',
    significance: '巴拿巴的家乡。保罗第一次宣教旅程经过此地。',
  },
  {
    nameZh: '别加',
    nameEn: 'Perga',
    nameOriginal: 'Πέργη',
    aliases: [],
    latitude: 37.0333,
    longitude: 30.8667,
    region: '旁非利亚',
    modernCountry: '土耳其',
    description: '旁非利亚的城市。',
    significance: '保罗第一次宣教旅程经过此地。马可在此离开他们回耶路撒冷。',
  },
  {
    nameZh: '彼西底安提阿',
    nameEn: 'Antioch in Pisidia',
    nameOriginal: 'Ἀντιόχεια τῆς Πισιδίας',
    aliases: [],
    latitude: 38.3069,
    longitude: 31.0569,
    region: '彼西底',
    modernCountry: '土耳其',
    description: '加拉太省的城市。',
    significance: '保罗在此讲道，外邦人信主。犹太人挑唆人将他们赶出城。',
  },
  {
    nameZh: '以哥念',
    nameEn: 'Iconium',
    nameOriginal: 'Ἰκόνιον',
    aliases: ['哥念'],
    latitude: 37.8667,
    longitude: 32.4833,
    region: '吕高尼',
    modernCountry: '土耳其',
    description: '吕高尼地区的首府。',
    significance: '保罗和巴拿巴在此传道，行神迹，许多人信主。',
  },
  {
    nameZh: '路司得',
    nameEn: 'Lystra',
    nameOriginal: 'Λύστρα',
    aliases: [],
    latitude: 37.1500,
    longitude: 32.9333,
    region: '吕高尼',
    modernCountry: '土耳其',
    description: '吕高尼地区的城市。',
    significance: '保罗在此医治瘸腿的人，被众人当作神。后被犹太人用石头打。',
  },
  {
    nameZh: '特庇',
    nameEn: 'Derbe',
    nameOriginal: 'Δέρβη',
    aliases: [],
    latitude: 37.2167,
    longitude: 33.5167,
    region: '吕高尼',
    modernCountry: '土耳其',
    description: '吕高尼地区东部的城市。',
    significance: '保罗第一次宣教旅程的最远点。提摩太的家乡附近。',
  },
  {
    nameZh: '特罗亚',
    nameEn: 'Troas',
    nameOriginal: 'Τρῳάς',
    aliases: ['亚力山大全特罗亚'],
    latitude: 39.7572,
    longitude: 26.1486,
    region: '亚西亚',
    modernCountry: '土耳其',
    description: '小亚细亚西北海岸的城市。',
    significance: '保罗在此看见马其顿的异象。犹推古从窗台跌落复活。',
  },
  {
    nameZh: '腓立比',
    nameEn: 'Philippi',
    nameOriginal: 'Φίλιπποι',
    aliases: [],
    latitude: 41.0086,
    longitude: 24.2822,
    region: '马其顿',
    modernCountry: '希腊',
    description: '马其顿的主要城市，罗马殖民地。',
    significance: '福音进入欧洲的第一站。吕底亚信主，保罗和西拉被囚，禁卒全家信主。',
  },
  {
    nameZh: '帖撒罗尼迦',
    nameEn: 'Thessalonica',
    nameOriginal: 'Θεσσαλονίκη',
    aliases: [],
    latitude: 40.6401,
    longitude: 22.9444,
    region: '马其顿',
    modernCountry: '希腊',
    description: '马其顿的首府和最大城市。',
    significance: '保罗在此传道三个安息日，建立教会。后因犹太人搅扰离开。',
  },
  {
    nameZh: '庇哩亚',
    nameEn: 'Berea',
    nameOriginal: 'Βέροια',
    aliases: [],
    latitude: 40.5222,
    longitude: 22.1989,
    region: '马其顿',
    modernCountry: '希腊',
    description: '马其顿的城市。',
    significance: '庇哩亚人甘心领受这道，天天查考圣经。',
  },
  {
    nameZh: '雅典',
    nameEn: 'Athens',
    nameOriginal: 'Ἀθῆναι',
    aliases: [],
    latitude: 37.9838,
    longitude: 23.7275,
    region: '亚该亚',
    modernCountry: '希腊',
    description: '希腊的哲学和文化中心。',
    significance: '保罗在亚略巴古讲道，虽然信的人不多，但仍有几个人信主。',
  },
  {
    nameZh: '哥林多',
    nameEn: 'Corinth',
    nameOriginal: 'Κόρινθος',
    aliases: [],
    latitude: 37.9394,
    longitude: 22.9331,
    region: '亚该亚',
    modernCountry: '希腊',
    description: '亚该亚省的首府，商业繁荣的城市。',
    significance: '保罗在此住了一年半，建立教会。',
  },
  {
    nameZh: '米利都',
    nameEn: 'Miletus',
    nameOriginal: 'Μίλητος',
    aliases: [],
    latitude: 37.5333,
    longitude: 27.2667,
    region: '亚西亚',
    modernCountry: '土耳其',
    description: '亚西亚海岸的城市。',
    significance: '保罗在此召以弗所的长老来，给他们最后的劝勉。',
  },
  {
    nameZh: '每拉',
    nameEn: 'Myra',
    nameOriginal: 'Μύρα',
    aliases: [],
    latitude: 36.2667,
    longitude: 29.9833,
    region: '吕家',
    modernCountry: '土耳其',
    description: '吕家地区的港口城市。',
    significance: '保罗被押往罗马途中经过此地，换乘亚历山大的船。',
  },
  {
    nameZh: '佳澳',
    nameEn: 'Fair Havens',
    nameOriginal: 'Καλοὶ Λιμένες',
    aliases: [],
    latitude: 34.9333,
    longitude: 24.7833,
    region: '克里特',
    modernCountry: '希腊',
    description: '克里特岛南岸的港口。',
    significance: '保罗被押往罗马途中在此停靠。',
  },
  {
    nameZh: '马耳他',
    nameEn: 'Malta',
    nameOriginal: 'Μελίτη',
    aliases: ['米利大'],
    latitude: 35.9375,
    longitude: 14.3754,
    region: '地中海',
    modernCountry: '马耳他',
    description: '地中海中部的岛屿。',
    significance: '保罗被押往罗马途中船只在此搁浅。保罗在此被毒蛇咬但不死，医治岛长的父亲。',
  },
  {
    nameZh: '叙拉古',
    nameEn: 'Syracuse',
    nameOriginal: 'Συράκουσαι',
    aliases: [],
    latitude: 37.0833,
    longitude: 15.2833,
    region: '西西里',
    modernCountry: '意大利',
    description: '西西里岛的主要城市。',
    significance: '保罗被押往罗马途中经过此地。',
  },
  {
    nameZh: '部丢利',
    nameEn: 'Puteoli',
    nameOriginal: 'Ποτιόλοι',
    aliases: [],
    latitude: 40.8333,
    longitude: 14.1167,
    region: '意大利',
    modernCountry: '意大利',
    description: '意大利南部的主要港口。',
    significance: '保罗在此上岸，与弟兄们同住七天。',
  },
  {
    nameZh: '罗马',
    nameEn: 'Rome',
    nameOriginal: 'Ῥώμη',
    aliases: ['罗马城'],
    latitude: 41.9028,
    longitude: 12.4964,
    region: '意大利',
    modernCountry: '意大利',
    description: '罗马帝国的首都。',
    significance: '保罗在此被软禁两年，放胆传讲神国的道。',
  },
];

// 旅程定义
const JOURNEYS_DATA = [
  {
    titleZh: '出埃及之旅',
    journeyType: 'EXODUS',
    yearStart: -1446,
    yearEnd: -1406,
    stops: [
      { nameZh: '兰塞', verseRef: '出12:37', order: 1 },
      { nameZh: '疏割', verseRef: '出12:37', order: 2 },
      { nameZh: '以倘', verseRef: '出13:20', order: 3 },
      { nameZh: '比哈希录', verseRef: '出14:2', order: 4 },
      { nameZh: '红海', verseRef: '出14:21-22', order: 5 },
      { nameZh: '玛拉', verseRef: '出15:23', order: 6 },
      { nameZh: '以琳', verseRef: '出15:27', order: 7 },
      { nameZh: '汛旷野', verseRef: '出16:1', order: 8 },
      { nameZh: '利非订', verseRef: '出17:1', order: 9 },
      { nameZh: '西奈山', verseRef: '出19:1-2', order: 10 },
      { nameZh: '基博罗哈他瓦', verseRef: '民11:35', order: 11 },
      { nameZh: '加低斯', verseRef: '民13:26', order: 12 },
      { nameZh: '摩押平原', verseRef: '民22:1', order: 13 },
    ],
  },
  {
    titleZh: '亚伯拉罕的旅程',
    journeyType: 'MIGRATION',
    yearStart: -2091,
    yearEnd: -1991,
    stops: [
      { nameZh: '吾珥', verseRef: '创11:31', order: 1 },
      { nameZh: '哈兰', verseRef: '创11:31', order: 2 },
      { nameZh: '示剑', verseRef: '创12:6', order: 3 },
      { nameZh: '伯特利', verseRef: '创12:8', order: 4 },
      { nameZh: '埃及', verseRef: '创12:10', order: 5 },
      { nameZh: '伯特利', verseRef: '创13:3', order: 6 },
      { nameZh: '希伯仑', verseRef: '创13:18', order: 7 },
    ],
  },
  {
    titleZh: '保罗第一次宣教之旅',
    journeyType: 'MISSIONARY',
    yearStart: 46,
    yearEnd: 48,
    stops: [
      { nameZh: '安提阿', verseRef: '徒13:1-3', order: 1 },
      { nameZh: '居比路', verseRef: '徒13:4-12', order: 2 },
      { nameZh: '别加', verseRef: '徒13:13-14', order: 3 },
      { nameZh: '彼西底安提阿', verseRef: '徒13:14-52', order: 4 },
      { nameZh: '以哥念', verseRef: '徒14:1-7', order: 5 },
      { nameZh: '路司得', verseRef: '徒14:8-20', order: 6 },
      { nameZh: '特庇', verseRef: '徒14:20-21', order: 7 },
      { nameZh: '安提阿', verseRef: '徒14:26-28', order: 8 },
    ],
  },
  {
    titleZh: '保罗第二次宣教之旅',
    journeyType: 'MISSIONARY',
    yearStart: 49,
    yearEnd: 52,
    stops: [
      { nameZh: '安提阿', verseRef: '徒15:36', order: 1 },
      { nameZh: '特庇', verseRef: '徒16:1', order: 2 },
      { nameZh: '路司得', verseRef: '徒16:1-5', order: 3 },
      { nameZh: '特罗亚', verseRef: '徒16:8', order: 4 },
      { nameZh: '腓立比', verseRef: '徒16:12-40', order: 5 },
      { nameZh: '帖撒罗尼迦', verseRef: '徒17:1-9', order: 6 },
      { nameZh: '庇哩亚', verseRef: '徒17:10-15', order: 7 },
      { nameZh: '雅典', verseRef: '徒17:16-34', order: 8 },
      { nameZh: '哥林多', verseRef: '徒18:1-18', order: 9 },
      { nameZh: '以弗所', verseRef: '徒18:19-21', order: 10 },
      { nameZh: '耶路撒冷', verseRef: '徒18:22', order: 11 },
      { nameZh: '安提阿', verseRef: '徒18:22', order: 12 },
    ],
  },
  {
    titleZh: '保罗第三次宣教之旅',
    journeyType: 'MISSIONARY',
    yearStart: 53,
    yearEnd: 57,
    stops: [
      { nameZh: '安提阿', verseRef: '徒18:23', order: 1 },
      { nameZh: '以弗所', verseRef: '徒19:1-41', order: 2 },
      { nameZh: '马其顿', verseRef: '徒20:1-2', order: 3 },
      { nameZh: '希腊', verseRef: '徒20:2-3', order: 4 },
      { nameZh: '特罗亚', verseRef: '徒20:6-12', order: 5 },
      { nameZh: '米利都', verseRef: '徒20:17-38', order: 6 },
      { nameZh: '耶路撒冷', verseRef: '徒21:17', order: 7 },
    ],
  },
  {
    titleZh: '保罗押解罗马之旅',
    journeyType: 'MISSIONARY',
    yearStart: 59,
    yearEnd: 60,
    stops: [
      { nameZh: '耶路撒冷', verseRef: '徒23:11', order: 1 },
      { nameZh: '该撒利亚', verseRef: '徒23:33', order: 2 },
      { nameZh: '每拉', verseRef: '徒27:5-6', order: 3 },
      { nameZh: '佳澳', verseRef: '徒27:8', order: 4 },
      { nameZh: '马耳他', verseRef: '徒28:1', order: 5 },
      { nameZh: '叙拉古', verseRef: '徒28:12', order: 6 },
      { nameZh: '部丢利', verseRef: '徒28:13', order: 7 },
      { nameZh: '罗马', verseRef: '徒28:14-16', order: 8 },
    ],
  },
  {
    titleZh: '耶稣传道路线',
    journeyType: 'MISSIONARY',
    yearStart: 26,
    yearEnd: 30,
    stops: [
      { nameZh: '伯利恒', verseRef: '太2:1', order: 1 },
      { nameZh: '拿撒勒', verseRef: '太2:23', order: 2 },
      { nameZh: '约旦河', verseRef: '太3:13', order: 3 },
      { nameZh: '旷野', verseRef: '太4:1', order: 4 },
      { nameZh: '迦拿', verseRef: '约2:1', order: 5 },
      { nameZh: '迦百农', verseRef: '太4:13', order: 6 },
      { nameZh: '加利利湖', verseRef: '太14:25', order: 7 },
      { nameZh: '该撒利亚腓立比', verseRef: '太16:13', order: 8 },
      { nameZh: '耶路撒冷', verseRef: '太21:1', order: 9 },
      { nameZh: '伯大尼', verseRef: '太21:17', order: 10 },
      { nameZh: '橄榄山', verseRef: '太24:3', order: 11 },
    ],
  },
];

async function main() {
  console.log('开始种子圣经旅程数据...\n');

  // 步骤1：添加额外的地点
  console.log('=== 步骤1：添加额外地点 ===');
  for (const location of ADDITIONAL_LOCATIONS) {
    try {
      const created = await prisma.bibleLocation.create({
        data: location,
      });
      console.log(`创建地点: ${created.nameZh}`);
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`地点已存在: ${location.nameZh}`);
      } else {
        console.error(`创建地点失败 ${location.nameZh}:`, error.message);
      }
    }
  }

  // 步骤2：获取所有地点的映射
  console.log('\n=== 步骤2：获取地点映射 ===');
  const locations = await prisma.bibleLocation.findMany();
  const locationMap = new Map();
  for (const loc of locations) {
    locationMap.set(loc.nameZh, loc.id);
  }
  console.log(`找到 ${locations.length} 个地点`);

  // 步骤3：创建旅程和站点
  console.log('\n=== 步骤3：创建旅程 ===');
  for (const journeyData of JOURNEYS_DATA) {
    try {
      // 创建旅程
      const journey = await prisma.bibleJourney.create({
        data: {
          titleZh: journeyData.titleZh,
          journeyType: journeyData.journeyType,
          yearStart: journeyData.yearStart,
          yearEnd: journeyData.yearEnd,
        },
      });
      console.log(`\n创建旅程: ${journey.titleZh}`);

      // 创建站点
      let stopsCreated = 0;
      for (const stopData of journeyData.stops) {
        const locationId = locationMap.get(stopData.nameZh);
        if (!locationId) {
          console.log(`  警告：找不到地点 "${stopData.nameZh}"，跳过此站`);
          continue;
        }

        await prisma.journeyStop.create({
          data: {
            journeyId: journey.id,
            locationId: locationId,
            order: stopData.order,
            verseRef: stopData.verseRef,
          },
        });
        stopsCreated++;
      }
      console.log(`  创建 ${stopsCreated} 个站点`);
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`旅程已存在: ${journeyData.titleZh}`);
      } else {
        console.error(`创建旅程失败 ${journeyData.titleZh}:`, error.message);
      }
    }
  }

  // 统计
  const totalJourneys = await prisma.bibleJourney.count();
  const totalStops = await prisma.journeyStop.count();
  const totalLocations = await prisma.bibleLocation.count();

  console.log('\n=== 旅程数据种子完成 ===');
  console.log(`总旅程数: ${totalJourneys}`);
  console.log(`总站点数: ${totalStops}`);
  console.log(`总地点数: ${totalLocations}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });