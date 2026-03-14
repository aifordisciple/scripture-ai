// scripts/seed_theme_connections.js
// 圣经主题关联关系种子数据脚本

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 主题关联关系定义
// 格式: { themeA, themeB, strength, description }
// strength: 1-10 (1=弱关联, 10=强关联)
const THEME_CONNECTIONS = [
  // 核心神学关系 - 救恩链条
  { themeA: '救恩', themeB: '恩典', strength: 9, description: '救恩是神的恩典' },
  { themeA: '救恩', themeB: '信心', strength: 9, description: '因信得救' },
  { themeA: '救恩', themeB: '称义', strength: 9, description: '称义是救恩的结果' },
  { themeA: '救恩', themeB: '悔改', strength: 8, description: '悔改是得救的前提' },
  { themeA: '救恩', themeB: '重生', strength: 8, description: '重生是救恩的开始' },
  { themeA: '救恩', themeB: '永生', strength: 9, description: '救恩带来永生' },
  { themeA: '救恩', themeB: '赎罪', strength: 9, description: '赎罪是救恩的基础' },
  { themeA: '救恩', themeB: '宝血', strength: 8, description: '耶稣宝血成就救恩' },
  { themeA: '救恩', themeB: '代赎', strength: 8, description: '基督代赎成就救恩' },

  // 三位一体关系
  { themeA: '三位一体', themeB: '神', strength: 10, description: '圣父' },
  { themeA: '三位一体', themeB: '耶稣基督', strength: 10, description: '圣子' },
  { themeA: '三位一体', themeB: '圣灵', strength: 10, description: '圣灵' },
  { themeA: '耶稣基督', themeB: '道成肉身', strength: 9, description: '道成肉身' },
  { themeA: '耶稣基督', themeB: '升天', strength: 8, description: '升天' },
  { themeA: '耶稣基督', themeB: '再来', strength: 8, description: '再来' },
  { themeA: '耶稣基督', themeB: '复活', strength: 9, description: '复活' },
  { themeA: '耶稣基督', themeB: '圣灵感孕', strength: 8, description: '圣灵感孕' },
  { themeA: '耶稣基督', themeB: '神迹', strength: 7, description: '行神迹' },
  { themeA: '耶稣基督', themeB: '中保', strength: 9, description: '中保' },
  { themeA: '耶稣基督', themeB: '代求', strength: 8, description: '代求' },

  // 称义与成圣
  { themeA: '称义', themeB: '成圣', strength: 8, description: '称义后走向成圣' },
  { themeA: '成圣', themeB: '圣灵', strength: 8, description: '靠圣灵成圣' },
  { themeA: '成圣', themeB: '得荣', strength: 7, description: '成圣最终得荣' },

  // 罪与救赎
  { themeA: '罪', themeB: '悔改', strength: 8, description: '认罪悔改' },
  { themeA: '罪', themeB: '赦免', strength: 8, description: '罪得赦免' },
  { themeA: '罪', themeB: '赎罪', strength: 9, description: '赎罪解决罪' },
  { themeA: '罪', themeB: '代赎', strength: 8, description: '基督代赎' },
  { themeA: '罪', themeB: '宝血', strength: 8, description: '宝血洗净罪' },

  // 圣灵与信徒
  { themeA: '圣灵', themeB: '重生', strength: 8, description: '圣灵使人重生' },
  { themeA: '圣灵', themeB: '成圣', strength: 8, description: '圣灵帮助成圣' },
  { themeA: '圣灵', themeB: '祷告', strength: 8, description: '圣灵帮助祷告' },
  { themeA: '圣灵', themeB: '神迹', strength: 7, description: '圣灵行神迹' },
  { themeA: '圣灵', themeB: '恩赐', strength: 7, description: '圣灵赐恩赐' },

  // 信心相关
  { themeA: '信心', themeB: '称义', strength: 9, description: '因信称义' },
  { themeA: '信心', themeB: '祷告', strength: 8, description: '信心的祷告' },
  { themeA: '信心', themeB: '神迹', strength: 7, description: '信心与神迹' },
  { themeA: '信心', themeB: '顺服', strength: 8, description: '信心带来顺服' },

  // 恩典相关
  { themeA: '恩典', themeB: '拣选', strength: 7, description: '拣选是恩典' },
  { themeA: '恩典', themeB: '预定', strength: 6, description: '预定与恩典' },
  { themeA: '恩典', themeB: '呼召', strength: 7, description: '蒙恩呼召' },

  // 爱的关系
  { themeA: '爱', themeB: '神', strength: 10, description: '神就是爱' },
  { themeA: '爱', themeB: '耶稣基督', strength: 9, description: '基督的爱' },
  { themeA: '爱', themeB: '饶恕', strength: 8, description: '爱带来饶恕' },
  { themeA: '爱', themeB: '恩慈', strength: 8, description: '爱是恩慈' },
  { themeA: '爱', themeB: '服事', strength: 7, description: '爱中服事' },
  { themeA: '爱', themeB: '接待', strength: 6, description: '爱心接待' },
  { themeA: '爱', themeB: '传福音', strength: 7, description: '爱驱动传福音' },

  // 盼望与忍耐
  { themeA: '盼望', themeB: '永生', strength: 8, description: '永生的盼望' },
  { themeA: '盼望', themeB: '天堂', strength: 8, description: '天堂的盼望' },
  { themeA: '盼望', themeB: '再来', strength: 8, description: '等候主再来' },
  { themeA: '盼望', themeB: '忍耐', strength: 7, description: '盼望生忍耐' },
  { themeA: '盼望', themeB: '受苦', strength: 6, description: '苦难中的盼望' },

  // 和平与和好
  { themeA: '和平', themeB: '和好', strength: 8, description: '和平带来和好' },
  { themeA: '和好', themeB: '耶稣基督', strength: 9, description: '基督使我们与神和好' },
  { themeA: '和好', themeB: '收养', strength: 6, description: '和好得儿子名分' },

  // 圣灵果子
  { themeA: '喜乐', themeB: '圣灵', strength: 7, description: '圣灵的果子' },
  { themeA: '和平', themeB: '圣灵', strength: 7, description: '圣灵的果子' },
  { themeA: '忍耐', themeB: '圣灵', strength: 7, description: '圣灵的果子' },
  { themeA: '恩慈', themeB: '圣灵', strength: 7, description: '圣灵的果子' },
  { themeA: '良善', themeB: '圣灵', strength: 7, description: '圣灵的果子' },
  { themeA: '信实', themeB: '圣灵', strength: 7, description: '圣灵的果子' },
  { themeA: '温柔', themeB: '圣灵', strength: 7, description: '圣灵的果子' },
  { themeA: '节制', themeB: '圣灵', strength: 7, description: '圣灵的果子' },

  // 祷告与敬拜
  { themeA: '祷告', themeB: '禁食', strength: 6, description: '禁食祷告' },
  { themeA: '祷告', themeB: '圣灵', strength: 8, description: '靠圣灵祷告' },
  { themeA: '祷告', themeB: '信心', strength: 8, description: '信心的祷告' },

  // 教会相关
  { themeA: '教会生活', themeB: '圣餐', strength: 8, description: '领圣餐' },
  { themeA: '教会生活', themeB: '洗礼', strength: 8, description: '洗礼' },
  { themeA: '教会生活', themeB: '圣灵', strength: 7, description: '圣灵在教会中' },
  { themeA: '教会生活', themeB: '门徒训练', strength: 7, description: '门徒训练' },
  { themeA: '教会生活', themeB: '见证', strength: 7, description: '作见证' },
  { themeA: '教会生活', themeB: '传福音', strength: 7, description: '传福音' },

  // 门徒与传福音
  { themeA: '门徒训练', themeB: '传福音', strength: 7, description: '训练门徒传福音' },
  { themeA: '门徒训练', themeB: '顺服', strength: 7, description: '顺服主的大使命' },
  { themeA: '传福音', themeB: '见证', strength: 8, description: '见证福音' },
  { themeA: '传福音', themeB: '爱', strength: 7, description: '爱推动传福音' },
  { themeA: '见证', themeB: '圣灵', strength: 7, description: '圣灵赐能力作见证' },

  // 圣礼
  { themeA: '圣餐', themeB: '耶稣基督', strength: 9, description: '记念主' },
  { themeA: '圣餐', themeB: '宝血', strength: 8, description: '宝血立新约' },
  { themeA: '洗礼', themeB: '重生', strength: 7, description: '洗礼象征重生' },
  { themeA: '洗礼', themeB: '信心', strength: 7, description: '信心的洗礼' },

  // 家庭伦理
  { themeA: '婚姻', themeB: '爱', strength: 8, description: '婚姻中的爱' },
  { themeA: '婚姻', themeB: '耶稣基督', strength: 7, description: '基督与教会' },
  { themeA: '家庭', themeB: '孝敬', strength: 8, description: '孝敬父母' },
  { themeA: '家庭', themeB: '儿女', strength: 6, description: '教养儿女' },
  { themeA: '孝敬', themeB: '顺服', strength: 6, description: '孝敬与顺服' },

  // 社会伦理
  { themeA: '工作', themeB: '管家职分', strength: 7, description: '工作即管家' },
  { themeA: '金钱', themeB: '十一奉献', strength: 8, description: '十一奉献' },
  { themeA: '金钱', themeB: '慷慨', strength: 7, description: '慷慨奉献' },
  { themeA: '金钱', themeB: '管家职分', strength: 7, description: '金钱的管家' },
  { themeA: '十一奉献', themeB: '祝福', strength: 6, description: '奉献得祝福' },

  // 安息与休息
  { themeA: '安息日', themeB: '休息', strength: 8, description: '安息日的休息' },
  { themeA: '安息日', themeB: '十诫', strength: 9, description: '第四诫' },
  { themeA: '休息', themeB: '安息', strength: 7, description: '安息' },

  // 旧约历史主题
  { themeA: '约', themeB: '神', strength: 9, description: '神与人的约' },
  { themeA: '约', themeB: '亚伯拉罕', strength: 8, description: '亚伯拉罕之约' },
  { themeA: '约', themeB: '摩西', strength: 8, description: '摩西之约' },
  { themeA: '约', themeB: '大卫', strength: 7, description: '大卫之约' },
  { themeA: '约', themeB: '新约', strength: 8, description: '新约' },
  { themeA: '约', themeB: '耶稣基督', strength: 8, description: '基督立新约' },

  { themeA: '出埃及', themeB: '摩西', strength: 9, description: '摩西领出埃及' },
  { themeA: '出埃及', themeB: '救恩', strength: 8, description: '出埃及预表救恩' },
  { themeA: '出埃及', themeB: '应许之地', strength: 8, description: '前往应许之地' },
  { themeA: '出埃及', themeB: '旷野', strength: 8, description: '经过旷野' },
  { themeA: '出埃及', themeB: '过红海', strength: 7, description: '过红海' },

  { themeA: '应许之地', themeB: '约书亚', strength: 8, description: '约书亚领进迦南' },
  { themeA: '应许之地', themeB: '约', strength: 7, description: '应许之地是约的成就' },
  { themeA: '应许之地', themeB: '以色列', strength: 8, description: '以色列得地为业' },

  { themeA: '旷野', themeB: '以色列', strength: 8, description: '以色列在旷野' },
  { themeA: '旷野', themeB: '试探', strength: 6, description: '旷野的试探' },
  { themeA: '旷野', themeB: '信心', strength: 6, description: '旷野中的信心' },

  { themeA: '被掳', themeB: '以色列', strength: 9, description: '以色列被掳' },
  { themeA: '被掳', themeB: '罪', strength: 8, description: '被掳因罪' },
  { themeA: '被掳', themeB: '先知', strength: 7, description: '先知警告' },
  { themeA: '被掳', themeB: '流亡', strength: 9, description: '流亡他乡' },

  { themeA: '归回', themeB: '以斯拉', strength: 8, description: '以斯拉带领归回' },
  { themeA: '归回', themeB: '尼希米', strength: 8, description: '尼希米重建' },
  { themeA: '归回', themeB: '悔改', strength: 7, description: '悔改归回' },
  { themeA: '归回', themeB: '应许', strength: 7, description: '应许的归回' },

  // 圣殿与会幕
  { themeA: '会幕', themeB: '圣殿', strength: 8, description: '会幕到圣殿' },
  { themeA: '会幕', themeB: '神的同在', strength: 9, description: '神的同在' },
  { themeA: '圣殿', themeB: '神的同在', strength: 9, description: '神的同在' },
  { themeA: '圣殿', themeB: '耶稣基督', strength: 7, description: '基督是真正的殿' },
  { themeA: '圣殿', themeB: '圣灵', strength: 7, description: '圣灵住在殿中' },
  { themeA: '圣殿', themeB: '所罗门', strength: 8, description: '所罗门建殿' },

  // 祭司与献祭
  { themeA: '祭司', themeB: '献祭', strength: 9, description: '祭司献祭' },
  { themeA: '祭司', themeB: '利未', strength: 8, description: '利未祭司' },
  { themeA: '祭司', themeB: '耶稣基督', strength: 8, description: '基督是大祭司' },
  { themeA: '献祭', themeB: '赎罪', strength: 9, description: '献祭赎罪' },
  { themeA: '献祭', themeB: '血', strength: 8, description: '血是赎罪' },
  { themeA: '献祭', themeB: '祭物', strength: 8, description: '祭物' },

  // 节期
  { themeA: '节期', themeB: '逾越节', strength: 8, description: '逾越节' },
  { themeA: '节期', themeB: '五旬节', strength: 7, description: '五旬节' },
  { themeA: '节期', themeB: '住棚节', strength: 7, description: '住棚节' },
  { themeA: '逾越节', themeB: '出埃及', strength: 9, description: '出埃及的逾越节' },
  { themeA: '逾越节', themeB: '耶稣基督', strength: 8, description: '基督是逾越节羔羊' },
  { themeA: '五旬节', themeB: '圣灵', strength: 9, description: '圣灵浇灌' },

  // 律法
  { themeA: '律法', themeB: '十诫', strength: 9, description: '十诫是律法核心' },
  { themeA: '律法', themeB: '摩西', strength: 9, description: '摩西领律法' },
  { themeA: '律法', themeB: '罪', strength: 8, description: '律法显明罪' },
  { themeA: '律法', themeB: '耶稣基督', strength: 7, description: '基督成全律法' },
  { themeA: '十诫', themeB: '安息日', strength: 8, description: '记念安息日' },
  { themeA: '十诫', themeB: '孝敬', strength: 7, description: '孝敬父母' },

  // 领袖人物
  { themeA: '君王', themeB: '大卫', strength: 9, description: '大卫王' },
  { themeA: '君王', themeB: '所罗门', strength: 8, description: '所罗门王' },
  { themeA: '君王', themeB: '弥赛亚', strength: 8, description: '弥赛亚君王' },
  { themeA: '君王', themeB: '耶稣基督', strength: 9, description: '基督是万王之王' },

  { themeA: '先知', themeB: '以利亚', strength: 7, description: '先知以利亚' },
  { themeA: '先知', themeB: '以利沙', strength: 6, description: '先知以利沙' },
  { themeA: '先知', themeB: '以赛亚', strength: 7, description: '先知以赛亚' },
  { themeA: '先知', themeB: '耶利米', strength: 7, description: '先知耶利米' },
  { themeA: '先知', themeB: '弥赛亚', strength: 7, description: '预言弥赛亚' },

  { themeA: '士师', themeB: '以色列', strength: 8, description: '士师拯救以色列' },
  { themeA: '士师', themeB: '基甸', strength: 6, description: '基甸' },
  { themeA: '士师', themeB: '参孙', strength: 6, description: '参孙' },

  // 选民
  { themeA: '选民', themeB: '以色列', strength: 9, description: '以色列是选民' },
  { themeA: '选民', themeB: '约', strength: 8, description: '选民与约' },
  { themeA: '选民', themeB: '拣选', strength: 8, description: '神的拣选' },
  { themeA: '选民', themeB: '亚伯拉罕', strength: 8, description: '亚伯拉罕的后裔' },

  // 弥赛亚预言
  { themeA: '弥赛亚', themeB: '耶稣基督', strength: 10, description: '耶稣是弥赛亚' },
  { themeA: '弥赛亚', themeB: '大卫', strength: 8, description: '大卫的子孙' },
  { themeA: '弥赛亚', themeB: '预言', strength: 9, description: '弥赛亚预言' },
  { themeA: '弥赛亚', themeB: '以赛亚', strength: 8, description: '以赛亚预言弥赛亚' },
  { themeA: '弥赛亚', themeB: '伯利恒', strength: 6, description: '生于伯利恒' },

  // 末世论
  { themeA: '末世', themeB: '再来', strength: 9, description: '主再来' },
  { themeA: '末世', themeB: '审判', strength: 9, description: '末后的审判' },
  { themeA: '末世', themeB: '新天新地', strength: 8, description: '新天新地' },
  { themeA: '末世', themeB: '敌基督', strength: 7, description: '敌基督出现' },
  { themeA: '末世', themeB: '大灾难', strength: 8, description: '大灾难' },
  { themeA: '末世', themeB: '被提', strength: 7, description: '教会被提' },
  { themeA: '末世', themeB: '千禧年', strength: 6, description: '千禧年国度' },

  { themeA: '审判', themeB: '神', strength: 9, description: '神的审判' },
  { themeA: '审判', themeB: '地狱', strength: 8, description: '地狱的审判' },
  { themeA: '审判', themeB: '罪', strength: 8, description: '罪的审判' },
  { themeA: '审判', themeB: '白色大宝座', strength: 7, description: '白色大宝座审判' },

  { themeA: '新天新地', themeB: '天堂', strength: 9, description: '新天新地与新耶路撒冷' },
  { themeA: '新天新地', themeB: '永生', strength: 8, description: '永恒的生命' },
  { themeA: '新天新地', themeB: '神', strength: 9, description: '神与人同住' },

  { themeA: '敌基督', themeB: '撒但', strength: 9, description: '撒但的工具' },
  { themeA: '敌基督', themeB: '兽', strength: 8, description: '敌基督即兽' },
  { themeA: '敌基督', themeB: '假先知', strength: 8, description: '假先知随从敌基督' },
  { themeA: '敌基督', themeB: '兽印', strength: 8, description: '兽印' },

  { themeA: '撒但', themeB: '试探', strength: 8, description: '撒但试探人' },
  { themeA: '撒但', themeB: '蛇', strength: 7, description: '古蛇' },
  { themeA: '撒但', themeB: '龙', strength: 7, description: '大红龙' },
  { themeA: '撒但', themeB: '地狱', strength: 8, description: '撒但的结局' },

  // 启示录七印七号七碗
  { themeA: '七印', themeB: '末世', strength: 8, description: '末世的印' },
  { themeA: '七号', themeB: '末世', strength: 8, description: '末世的号' },
  { themeA: '七碗', themeB: '末世', strength: 8, description: '末世的碗' },
  { themeA: '七印', themeB: '七号', strength: 7, description: '印后是号' },
  { themeA: '七号', themeB: '七碗', strength: 7, description: '号后是碗' },

  // 创造与护理
  { themeA: '创造', themeB: '神', strength: 10, description: '神创造万物' },
  { themeA: '创造', themeB: '亚当', strength: 7, description: '创造亚当' },
  { themeA: '创造', themeB: '夏娃', strength: 6, description: '创造夏娃' },
  { themeA: '创造', themeB: '安息日', strength: 7, description: '创造后的安息' },

  // 神的国
  { themeA: '神的国', themeB: '天国', strength: 9, description: '神的国即天国' },
  { themeA: '神的国', themeB: '耶稣基督', strength: 9, description: '基督传神国福音' },
  { themeA: '神的国', themeB: '教会', strength: 7, description: '教会彰显神国' },
  { themeA: '神的国', themeB: '千禧年', strength: 7, description: '千禧年国度' },
  { themeA: '神的国', themeB: '新天新地', strength: 8, description: '永恒的国度' },

  // 启示相关
  { themeA: '启示', themeB: '圣经', strength: 9, description: '圣经是神的启示' },
  { themeA: '启示', themeB: '预言', strength: 8, description: '预言性启示' },
  { themeA: '预言', themeB: '先知', strength: 8, description: '先知发预言' },
  { themeA: '预言', themeB: '应验', strength: 7, description: '预言应验' },
];

async function main() {
  console.log('开始种子圣经主题关联数据...\n');

  // 获取所有主题
  const themes = await prisma.bibleTheme.findMany();
  const themeMap = new Map();
  for (const theme of themes) {
    themeMap.set(theme.nameZh, theme.id);
  }
  console.log(`找到 ${themes.length} 个主题`);

  let created = 0;
  let skipped = 0;
  let notFound = 0;

  for (const conn of THEME_CONNECTIONS) {
    const themeAId = themeMap.get(conn.themeA);
    const themeBId = themeMap.get(conn.themeB);

    if (!themeAId || !themeBId) {
      console.log(`警告：找不到主题 "${conn.themeA}" 或 "${conn.themeB}"`);
      notFound++;
      continue;
    }

    try {
      await prisma.themeConnection.create({
        data: {
          themeAId,
          themeBId,
          strength: conn.strength,
          description: conn.description,
        },
      });
      created++;
    } catch (error) {
      if (error.code === 'P2002') {
        skipped++;
      } else {
        console.error(`创建关联失败: ${conn.themeA} - ${conn.themeB}`, error.message);
      }
    }
  }

  const totalConnections = await prisma.themeConnection.count();

  console.log('\n=== 主题关联数据种子完成 ===');
  console.log(`创建: ${created}`);
  console.log(`跳过（已存在）: ${skipped}`);
  console.log(`未找到主题: ${notFound}`);
  console.log(`数据库总关联数: ${totalConnections}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });