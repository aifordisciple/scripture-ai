// scripts/seed_theme_connections.js
// 圣经主题关联关系种子数据脚本

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 主题关联关系定义
// 格式: { themeName, relatedThemeName, connectionType, strength, description }
// connectionType: PARENT, CHILD, RELATED, CONTRAST, FULFILLS
// strength: 0.1-1.0 (0.1=弱关联, 1.0=强关联)
const THEME_CONNECTIONS = [
  // 核心神学关系 - 救恩链条
  { themeName: '救恩', relatedThemeName: '恩典', connectionType: 'RELATED', strength: 0.9, description: '救恩是神的恩典' },
  { themeName: '救恩', relatedThemeName: '信心', connectionType: 'RELATED', strength: 0.9, description: '因信得救' },
  { themeName: '救恩', relatedThemeName: '称义', connectionType: 'RELATED', strength: 0.9, description: '称义是救恩的结果' },
  { themeName: '救恩', relatedThemeName: '悔改', connectionType: 'RELATED', strength: 0.8, description: '悔改是得救的前提' },
  { themeName: '救恩', relatedThemeName: '重生', connectionType: 'RELATED', strength: 0.8, description: '重生是救恩的开始' },
  { themeName: '救恩', relatedThemeName: '永生', connectionType: 'RELATED', strength: 0.9, description: '救恩带来永生' },
  { themeName: '救恩', relatedThemeName: '赎罪', connectionType: 'RELATED', strength: 0.9, description: '赎罪是救恩的基础' },
  { themeName: '救恩', relatedThemeName: '宝血', connectionType: 'RELATED', strength: 0.8, description: '耶稣宝血成就救恩' },
  { themeName: '救恩', relatedThemeName: '代赎', connectionType: 'RELATED', strength: 0.8, description: '基督代赎成就救恩' },

  // 三位一体关系
  { themeName: '三位一体', relatedThemeName: '神', connectionType: 'CHILD', strength: 1.0, description: '圣父' },
  { themeName: '三位一体', relatedThemeName: '耶稣基督', connectionType: 'CHILD', strength: 1.0, description: '圣子' },
  { themeName: '三位一体', relatedThemeName: '圣灵', connectionType: 'CHILD', strength: 1.0, description: '圣灵' },
  { themeName: '耶稣基督', relatedThemeName: '道成肉身', connectionType: 'RELATED', strength: 0.9, description: '道成肉身' },
  { themeName: '耶稣基督', relatedThemeName: '升天', connectionType: 'RELATED', strength: 0.8, description: '升天' },
  { themeName: '耶稣基督', relatedThemeName: '再来', connectionType: 'RELATED', strength: 0.8, description: '再来' },
  { themeName: '耶稣基督', relatedThemeName: '复活', connectionType: 'RELATED', strength: 0.9, description: '复活' },
  { themeName: '耶稣基督', relatedThemeName: '圣灵感孕', connectionType: 'RELATED', strength: 0.8, description: '圣灵感孕' },
  { themeName: '耶稣基督', relatedThemeName: '神迹', connectionType: 'RELATED', strength: 0.7, description: '行神迹' },
  { themeName: '耶稣基督', relatedThemeName: '中保', connectionType: 'RELATED', strength: 0.9, description: '中保' },
  { themeName: '耶稣基督', relatedThemeName: '代求', connectionType: 'RELATED', strength: 0.8, description: '代求' },

  // 称义与成圣
  { themeName: '称义', relatedThemeName: '成圣', connectionType: 'RELATED', strength: 0.8, description: '称义后走向成圣' },
  { themeName: '成圣', relatedThemeName: '圣灵', connectionType: 'RELATED', strength: 0.8, description: '靠圣灵成圣' },
  { themeName: '成圣', relatedThemeName: '得荣', connectionType: 'RELATED', strength: 0.7, description: '成圣最终得荣' },

  // 罪与救赎
  { themeName: '罪', relatedThemeName: '悔改', connectionType: 'RELATED', strength: 0.8, description: '认罪悔改' },
  { themeName: '罪', relatedThemeName: '饶恕', connectionType: 'RELATED', strength: 0.8, description: '罪得赦免' },
  { themeName: '罪', relatedThemeName: '赎罪', connectionType: 'RELATED', strength: 0.9, description: '赎罪解决罪' },
  { themeName: '罪', relatedThemeName: '代赎', connectionType: 'RELATED', strength: 0.8, description: '基督代赎' },
  { themeName: '罪', relatedThemeName: '宝血', connectionType: 'RELATED', strength: 0.8, description: '宝血洗净罪' },

  // 圣灵与信徒
  { themeName: '圣灵', relatedThemeName: '重生', connectionType: 'RELATED', strength: 0.8, description: '圣灵使人重生' },
  { themeName: '圣灵', relatedThemeName: '成圣', connectionType: 'RELATED', strength: 0.8, description: '圣灵帮助成圣' },
  { themeName: '圣灵', relatedThemeName: '祷告', connectionType: 'RELATED', strength: 0.8, description: '圣灵帮助祷告' },
  { themeName: '圣灵', relatedThemeName: '神迹', connectionType: 'RELATED', strength: 0.7, description: '圣灵行神迹' },

  // 信心相关
  { themeName: '信心', relatedThemeName: '称义', connectionType: 'RELATED', strength: 0.9, description: '因信称义' },
  { themeName: '信心', relatedThemeName: '祷告', connectionType: 'RELATED', strength: 0.8, description: '信心的祷告' },
  { themeName: '信心', relatedThemeName: '神迹', connectionType: 'RELATED', strength: 0.7, description: '信心与神迹' },
  { themeName: '信心', relatedThemeName: '顺服', connectionType: 'RELATED', strength: 0.8, description: '信心带来顺服' },

  // 恩典相关
  { themeName: '恩典', relatedThemeName: '拣选', connectionType: 'RELATED', strength: 0.7, description: '拣选是恩典' },
  { themeName: '恩典', relatedThemeName: '预定', connectionType: 'RELATED', strength: 0.6, description: '预定与恩典' },
  { themeName: '恩典', relatedThemeName: '呼召', connectionType: 'RELATED', strength: 0.7, description: '蒙恩呼召' },

  // 爱的关系
  { themeName: '爱', relatedThemeName: '神', connectionType: 'RELATED', strength: 1.0, description: '神就是爱' },
  { themeName: '爱', relatedThemeName: '耶稣基督', connectionType: 'RELATED', strength: 0.9, description: '基督的爱' },
  { themeName: '爱', relatedThemeName: '饶恕', connectionType: 'RELATED', strength: 0.8, description: '爱带来饶恕' },
  { themeName: '爱', relatedThemeName: '恩慈', connectionType: 'RELATED', strength: 0.8, description: '爱是恩慈' },
  { themeName: '爱', relatedThemeName: '服事', connectionType: 'RELATED', strength: 0.7, description: '爱中服事' },
  { themeName: '爱', relatedThemeName: '接待', connectionType: 'RELATED', strength: 0.6, description: '爱心接待' },
  { themeName: '爱', relatedThemeName: '传福音', connectionType: 'RELATED', strength: 0.7, description: '爱驱动传福音' },

  // 盼望与忍耐
  { themeName: '盼望', relatedThemeName: '永生', connectionType: 'RELATED', strength: 0.8, description: '永生的盼望' },
  { themeName: '盼望', relatedThemeName: '天堂', connectionType: 'RELATED', strength: 0.8, description: '天堂的盼望' },
  { themeName: '盼望', relatedThemeName: '再来', connectionType: 'RELATED', strength: 0.8, description: '等候主再来' },
  { themeName: '盼望', relatedThemeName: '忍耐', connectionType: 'RELATED', strength: 0.7, description: '盼望生忍耐' },
  { themeName: '盼望', relatedThemeName: '受苦', connectionType: 'RELATED', strength: 0.6, description: '苦难中的盼望' },

  // 和平与和好
  { themeName: '和平', relatedThemeName: '和好', connectionType: 'RELATED', strength: 0.8, description: '和平带来和好' },
  { themeName: '和好', relatedThemeName: '耶稣基督', connectionType: 'RELATED', strength: 0.9, description: '基督使我们与神和好' },
  { themeName: '和好', relatedThemeName: '收养', connectionType: 'RELATED', strength: 0.6, description: '和好得儿子名分' },

  // 圣灵果子
  { themeName: '喜乐', relatedThemeName: '圣灵', connectionType: 'RELATED', strength: 0.7, description: '圣灵的果子' },
  { themeName: '和平', relatedThemeName: '圣灵', connectionType: 'RELATED', strength: 0.7, description: '圣灵的果子' },
  { themeName: '忍耐', relatedThemeName: '圣灵', connectionType: 'RELATED', strength: 0.7, description: '圣灵的果子' },
  { themeName: '恩慈', relatedThemeName: '圣灵', connectionType: 'RELATED', strength: 0.7, description: '圣灵的果子' },
  { themeName: '良善', relatedThemeName: '圣灵', connectionType: 'RELATED', strength: 0.7, description: '圣灵的果子' },
  { themeName: '信实', relatedThemeName: '圣灵', connectionType: 'RELATED', strength: 0.7, description: '圣灵的果子' },
  { themeName: '温柔', relatedThemeName: '圣灵', connectionType: 'RELATED', strength: 0.7, description: '圣灵的果子' },
  { themeName: '节制', relatedThemeName: '圣灵', connectionType: 'RELATED', strength: 0.7, description: '圣灵的果子' },

  // 祷告与敬拜
  { themeName: '祷告', relatedThemeName: '禁食', connectionType: 'RELATED', strength: 0.6, description: '禁食祷告' },
  { themeName: '祷告', relatedThemeName: '圣灵', connectionType: 'RELATED', strength: 0.8, description: '靠圣灵祷告' },
  { themeName: '祷告', relatedThemeName: '信心', connectionType: 'RELATED', strength: 0.8, description: '信心的祷告' },

  // 教会相关
  { themeName: '教会生活', relatedThemeName: '圣餐', connectionType: 'RELATED', strength: 0.8, description: '领圣餐' },
  { themeName: '教会生活', relatedThemeName: '洗礼', connectionType: 'RELATED', strength: 0.8, description: '洗礼' },
  { themeName: '教会生活', relatedThemeName: '圣灵', connectionType: 'RELATED', strength: 0.7, description: '圣灵在教会中' },
  { themeName: '教会生活', relatedThemeName: '门徒训练', connectionType: 'RELATED', strength: 0.7, description: '门徒训练' },
  { themeName: '教会生活', relatedThemeName: '见证', connectionType: 'RELATED', strength: 0.7, description: '作见证' },
  { themeName: '教会生活', relatedThemeName: '传福音', connectionType: 'RELATED', strength: 0.7, description: '传福音' },

  // 门徒与传福音
  { themeName: '门徒训练', relatedThemeName: '传福音', connectionType: 'RELATED', strength: 0.7, description: '训练门徒传福音' },
  { themeName: '门徒训练', relatedThemeName: '顺服', connectionType: 'RELATED', strength: 0.7, description: '顺服主的大使命' },
  { themeName: '传福音', relatedThemeName: '见证', connectionType: 'RELATED', strength: 0.8, description: '见证福音' },
  { themeName: '传福音', relatedThemeName: '爱', connectionType: 'RELATED', strength: 0.7, description: '爱推动传福音' },
  { themeName: '见证', relatedThemeName: '圣灵', connectionType: 'RELATED', strength: 0.7, description: '圣灵赐能力作见证' },

  // 圣礼
  { themeName: '圣餐', relatedThemeName: '耶稣基督', connectionType: 'RELATED', strength: 0.9, description: '记念主' },
  { themeName: '圣餐', relatedThemeName: '宝血', connectionType: 'RELATED', strength: 0.8, description: '宝血立新约' },
  { themeName: '洗礼', relatedThemeName: '重生', connectionType: 'RELATED', strength: 0.7, description: '洗礼象征重生' },
  { themeName: '洗礼', relatedThemeName: '信心', connectionType: 'RELATED', strength: 0.7, description: '信心的洗礼' },

  // 家庭伦理
  { themeName: '婚姻', relatedThemeName: '爱', connectionType: 'RELATED', strength: 0.8, description: '婚姻中的爱' },
  { themeName: '婚姻', relatedThemeName: '耶稣基督', connectionType: 'RELATED', strength: 0.7, description: '基督与教会' },
  { themeName: '家庭', relatedThemeName: '孝敬', connectionType: 'RELATED', strength: 0.8, description: '孝敬父母' },
  { themeName: '孝敬', relatedThemeName: '顺服', connectionType: 'RELATED', strength: 0.6, description: '孝敬与顺服' },

  // 社会伦理
  { themeName: '工作', relatedThemeName: '管家职分', connectionType: 'RELATED', strength: 0.7, description: '工作即管家' },
  { themeName: '金钱', relatedThemeName: '十一奉献', connectionType: 'RELATED', strength: 0.8, description: '十一奉献' },
  { themeName: '金钱', relatedThemeName: '慷慨', connectionType: 'RELATED', strength: 0.7, description: '慷慨奉献' },
  { themeName: '金钱', relatedThemeName: '管家职分', connectionType: 'RELATED', strength: 0.7, description: '金钱的管家' },
  { themeName: '十一奉献', relatedThemeName: '祝福', connectionType: 'RELATED', strength: 0.6, description: '奉献得祝福' },

  // 安息与休息
  { themeName: '安息日', relatedThemeName: '休息', connectionType: 'RELATED', strength: 0.8, description: '安息日的休息' },
  { themeName: '安息日', relatedThemeName: '十诫', connectionType: 'RELATED', strength: 0.9, description: '第四诫' },
  { themeName: '休息', relatedThemeName: '安息日', connectionType: 'RELATED', strength: 0.7, description: '安息' },

  // 旧约历史主题
  { themeName: '约', relatedThemeName: '神', connectionType: 'RELATED', strength: 0.9, description: '神与人的约' },
  { themeName: '约', relatedThemeName: '应许之地', connectionType: 'RELATED', strength: 0.7, description: '约的应许' },
  { themeName: '约', relatedThemeName: '耶稣基督', connectionType: 'FULFILLS', strength: 0.8, description: '基督立新约' },

  { themeName: '出埃及', relatedThemeName: '救恩', connectionType: 'RELATED', strength: 0.8, description: '出埃及预表救恩' },
  { themeName: '出埃及', relatedThemeName: '应许之地', connectionType: 'RELATED', strength: 0.8, description: '前往应许之地' },
  { themeName: '出埃及', relatedThemeName: '旷野', connectionType: 'RELATED', strength: 0.8, description: '经过旷野' },

  { themeName: '应许之地', relatedThemeName: '约', connectionType: 'RELATED', strength: 0.7, description: '应许之地是约的成就' },
  { themeName: '应许之地', relatedThemeName: '选民', connectionType: 'RELATED', strength: 0.8, description: '选民得地为业' },

  { themeName: '旷野', relatedThemeName: '选民', connectionType: 'RELATED', strength: 0.8, description: '选民在旷野' },
  { themeName: '旷野', relatedThemeName: '信心', connectionType: 'RELATED', strength: 0.6, description: '旷野中的信心' },

  { themeName: '被掳', relatedThemeName: '选民', connectionType: 'RELATED', strength: 0.9, description: '选民被掳' },
  { themeName: '被掳', relatedThemeName: '罪', connectionType: 'RELATED', strength: 0.8, description: '被掳因罪' },
  { themeName: '被掳', relatedThemeName: '先知', connectionType: 'RELATED', strength: 0.7, description: '先知警告' },
  { themeName: '被掳', relatedThemeName: '流亡', connectionType: 'RELATED', strength: 0.9, description: '流亡他乡' },

  { themeName: '归回', relatedThemeName: '悔改', connectionType: 'RELATED', strength: 0.7, description: '悔改归回' },
  { themeName: '归回', relatedThemeName: '应许之地', connectionType: 'RELATED', strength: 0.7, description: '应许的归回' },

  // 圣殿与会幕
  { themeName: '会幕', relatedThemeName: '圣殿', connectionType: 'RELATED', strength: 0.8, description: '会幕到圣殿' },
  { themeName: '会幕', relatedThemeName: '神', connectionType: 'RELATED', strength: 0.9, description: '神的同在' },
  { themeName: '圣殿', relatedThemeName: '神', connectionType: 'RELATED', strength: 0.9, description: '神的同在' },
  { themeName: '圣殿', relatedThemeName: '耶稣基督', connectionType: 'FULFILLS', strength: 0.7, description: '基督是真正的殿' },
  { themeName: '圣殿', relatedThemeName: '圣灵', connectionType: 'RELATED', strength: 0.7, description: '圣灵住在殿中' },

  // 祭司与献祭
  { themeName: '祭司', relatedThemeName: '献祭', connectionType: 'RELATED', strength: 0.9, description: '祭司献祭' },
  { themeName: '祭司', relatedThemeName: '耶稣基督', connectionType: 'FULFILLS', strength: 0.8, description: '基督是大祭司' },
  { themeName: '献祭', relatedThemeName: '赎罪', connectionType: 'RELATED', strength: 0.9, description: '献祭赎罪' },
  { themeName: '献祭', relatedThemeName: '宝血', connectionType: 'RELATED', strength: 0.8, description: '血是赎罪' },

  // 律法
  { themeName: '律法', relatedThemeName: '十诫', connectionType: 'CHILD', strength: 0.9, description: '十诫是律法核心' },
  { themeName: '律法', relatedThemeName: '罪', connectionType: 'RELATED', strength: 0.8, description: '律法显明罪' },
  { themeName: '律法', relatedThemeName: '耶稣基督', connectionType: 'FULFILLS', strength: 0.7, description: '基督成全律法' },
  { themeName: '十诫', relatedThemeName: '安息日', connectionType: 'RELATED', strength: 0.8, description: '记念安息日' },
  { themeName: '十诫', relatedThemeName: '孝敬', connectionType: 'RELATED', strength: 0.7, description: '孝敬父母' },

  // 领袖人物
  { themeName: '君王', relatedThemeName: '弥赛亚', connectionType: 'RELATED', strength: 0.8, description: '弥赛亚君王' },
  { themeName: '君王', relatedThemeName: '耶稣基督', connectionType: 'FULFILLS', strength: 0.9, description: '基督是万王之王' },

  { themeName: '先知', relatedThemeName: '弥赛亚', connectionType: 'RELATED', strength: 0.7, description: '预言弥赛亚' },

  { themeName: '士师', relatedThemeName: '选民', connectionType: 'RELATED', strength: 0.8, description: '士师拯救选民' },

  // 选民
  { themeName: '选民', relatedThemeName: '以色列', connectionType: 'RELATED', strength: 0.9, description: '以色列是选民' },
  { themeName: '选民', relatedThemeName: '约', connectionType: 'RELATED', strength: 0.8, description: '选民与约' },
  { themeName: '选民', relatedThemeName: '拣选', connectionType: 'RELATED', strength: 0.8, description: '神的拣选' },

  // 弥赛亚预言
  { themeName: '弥赛亚', relatedThemeName: '耶稣基督', connectionType: 'FULFILLS', strength: 1.0, description: '耶稣是弥赛亚' },
  { themeName: '弥赛亚', relatedThemeName: '预言', connectionType: 'RELATED', strength: 0.9, description: '弥赛亚预言' },

  // 末世论
  { themeName: '末世', relatedThemeName: '再来', connectionType: 'RELATED', strength: 0.9, description: '主再来' },
  { themeName: '末世', relatedThemeName: '审判', connectionType: 'RELATED', strength: 0.9, description: '末后的审判' },
  { themeName: '末世', relatedThemeName: '新天新地', connectionType: 'RELATED', strength: 0.8, description: '新天新地' },
  { themeName: '末世', relatedThemeName: '敌基督', connectionType: 'RELATED', strength: 0.7, description: '敌基督出现' },
  { themeName: '末世', relatedThemeName: '大灾难', connectionType: 'RELATED', strength: 0.8, description: '大灾难' },
  { themeName: '末世', relatedThemeName: '被提', connectionType: 'RELATED', strength: 0.7, description: '教会被提' },
  { themeName: '末世', relatedThemeName: '千禧年', connectionType: 'RELATED', strength: 0.6, description: '千禧年国度' },

  { themeName: '审判', relatedThemeName: '神', connectionType: 'RELATED', strength: 0.9, description: '神的审判' },
  { themeName: '审判', relatedThemeName: '地狱', connectionType: 'RELATED', strength: 0.8, description: '地狱的审判' },
  { themeName: '审判', relatedThemeName: '罪', connectionType: 'RELATED', strength: 0.8, description: '罪的审判' },

  { themeName: '新天新地', relatedThemeName: '天堂', connectionType: 'RELATED', strength: 0.9, description: '新天新地与新耶路撒冷' },
  { themeName: '新天新地', relatedThemeName: '永生', connectionType: 'RELATED', strength: 0.8, description: '永恒的生命' },
  { themeName: '新天新地', relatedThemeName: '神', connectionType: 'RELATED', strength: 0.9, description: '神与人同住' },

  { themeName: '敌基督', relatedThemeName: '撒但', connectionType: 'RELATED', strength: 0.9, description: '撒但的工具' },
  { themeName: '敌基督', relatedThemeName: '兽', connectionType: 'RELATED', strength: 0.8, description: '敌基督即兽' },
  { themeName: '敌基督', relatedThemeName: '假先知', connectionType: 'RELATED', strength: 0.8, description: '假先知随从敌基督' },
  { themeName: '敌基督', relatedThemeName: '兽印', connectionType: 'RELATED', strength: 0.8, description: '兽印' },

  { themeName: '撒但', relatedThemeName: '地狱', connectionType: 'RELATED', strength: 0.8, description: '撒但的结局' },

  // 启示录七印七号七碗
  { themeName: '七印', relatedThemeName: '末世', connectionType: 'RELATED', strength: 0.8, description: '末世的印' },
  { themeName: '七号', relatedThemeName: '末世', connectionType: 'RELATED', strength: 0.8, description: '末世的号' },
  { themeName: '七碗', relatedThemeName: '末世', connectionType: 'RELATED', strength: 0.8, description: '末世的碗' },
  { themeName: '七印', relatedThemeName: '七号', connectionType: 'RELATED', strength: 0.7, description: '印后是号' },
  { themeName: '七号', relatedThemeName: '七碗', connectionType: 'RELATED', strength: 0.7, description: '号后是碗' },

  // 创造与护理
  { themeName: '创造', relatedThemeName: '神', connectionType: 'RELATED', strength: 1.0, description: '神创造万物' },
  { themeName: '创造', relatedThemeName: '安息日', connectionType: 'RELATED', strength: 0.7, description: '创造后的安息' },

  // 神的国
  { themeName: '神的国', relatedThemeName: '耶稣基督', connectionType: 'RELATED', strength: 0.9, description: '基督传神国福音' },
  { themeName: '神的国', relatedThemeName: '教会生活', connectionType: 'RELATED', strength: 0.7, description: '教会彰显神国' },
  { themeName: '神的国', relatedThemeName: '千禧年', connectionType: 'RELATED', strength: 0.7, description: '千禧年国度' },
  { themeName: '神的国', relatedThemeName: '新天新地', connectionType: 'RELATED', strength: 0.8, description: '永恒的国度' },

  // 启示相关
  { themeName: '启示', relatedThemeName: '预言', connectionType: 'RELATED', strength: 0.8, description: '预言性启示' },
  { themeName: '预言', relatedThemeName: '先知', connectionType: 'RELATED', strength: 0.8, description: '先知发预言' },
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
    const themeId = themeMap.get(conn.themeName);
    const relatedThemeId = themeMap.get(conn.relatedThemeName);

    if (!themeId || !relatedThemeId) {
      console.log(`警告：找不到主题 "${conn.themeName}" 或 "${conn.relatedThemeName}"`);
      notFound++;
      continue;
    }

    try {
      await prisma.themeConnection.create({
        data: {
          themeId,
          relatedThemeId,
          connectionType: conn.connectionType,
          strength: conn.strength,
        },
      });
      created++;
    } catch (error) {
      if (error.code === 'P2002') {
        skipped++;
      } else {
        console.error(`创建关联失败: ${conn.themeName} - ${conn.relatedThemeName}`, error.message);
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