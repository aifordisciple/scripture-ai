// scripts/seed_theme_verses.js
// 圣经经文-主题关联种子数据脚本

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 书卷名称到bookId的映射
const BOOK_MAP = {
  '创': 'GEN', '出': 'EXO', '利': 'LEV', '民': 'NUM', '申': 'DEU',
  '书': 'JOS', '士': 'JDG', '得': 'RUT', '撒上': '1SA', '撒下': '2SA',
  '王上': '1KI', '王下': '2KI', '代上': '1CH', '代下': '2CH', '拉': 'EZR',
  '尼': 'NEH', '斯': 'EST', '伯': 'JOB', '诗': 'PSA', '箴': 'PRO',
  '传': 'ECC', '歌': 'SNG', '赛': 'ISA', '耶': 'JER', '哀': 'LAM',
  '结': 'EZK', '但': 'DAN', '何': 'HOS', '珥': 'JOL', '摩': 'AMO',
  '俄': 'OBA', '拿': 'JON', '弥': 'MIC', '鸿': 'NAM', '哈': 'HAB',
  '番': 'ZEP', '该': 'HAG', '亚': 'ZEC', '玛': 'MAL',
  '太': 'MAT', '可': 'MRK', '路': 'LUK', '约': 'JHN', '徒': 'ACT',
  '罗': 'ROM', '林前': '1CO', '林后': '2CO', '加': 'GAL', '弗': 'EPH',
  '腓': 'PHP', '西': 'COL', '帖前': '1TH', '帖后': '2TH', '提前': '1TI',
  '提后': '2TI', '多': 'TIT', '门': 'PHM', '来': 'HEB', '雅': 'JAS',
  '彼前': '1PE', '彼后': '2PE', '约壹': '1JN', '约贰': '2JN', '约叁': '3JN',
  '犹': 'JUD', '启': 'REV'
};

// 解析经文引用 (格式: 书卷章节:节 或 书卷章节:节-节)
function parseVerseRef(ref) {
  // 尝试匹配不同的格式
  // 格式1: 创1:1
  // 格式2: 创1:1-3
  // 格式3: 约壹1:1

  const patterns = [
    /^(\D+)(\d+):(\d+)-(\d+)$/,  // 书卷章节:节-节
    /^(\D+)(\d+):(\d+)$/,        // 书卷章节:节
  ];

  for (const pattern of patterns) {
    const match = ref.match(pattern);
    if (match) {
      const bookName = match[1];
      const chapter = parseInt(match[2]);
      const verseStart = parseInt(match[3]);
      const verseEnd = match[4] ? parseInt(match[4]) : verseStart;
      const bookId = BOOK_MAP[bookName];

      if (bookId) {
        return { bookId, chapter, verseStart, verseEnd };
      }
    }
  }

  return null;
}

// 经文-主题关联定义
const THEME_VERSE_ASSOCIATIONS = [
  // ========== 神学主题 ==========
  // 神
  {
    themeName: '神',
    verseRefs: ['创1:1', '出3:14', '申6:4', '赛43:10', '约1:1', '约4:24', '约壹4:8', '启1:8'],
    relevance: 1.0
  },
  // 耶稣基督
  {
    themeName: '耶稣基督',
    verseRefs: ['太1:21', '约1:14', '约3:16', '约14:6', '腓2:9', '西1:15', '来1:1', '启19:16'],
    relevance: 1.0
  },
  // 圣灵
  {
    themeName: '圣灵',
    verseRefs: ['创1:2', '约14:16', '约16:7', '徒1:8', '徒2:1', '罗8:9', '加5:22', '弗1:13'],
    relevance: 1.0
  },
  // 三位一体
  {
    themeName: '三位一体',
    verseRefs: ['太28:19', '林后13:14', '弗2:18', '彼前1:2', '约壹5:7'],
    relevance: 0.9
  },
  // 救恩
  {
    themeName: '救恩',
    verseRefs: ['诗3:8', '赛45:22', '约3:16', '徒4:12', '弗2:8', '多2:11', '来2:3', '彼前1:9'],
    relevance: 1.0
  },
  // 恩典
  {
    themeName: '恩典',
    verseRefs: ['诗84:11', '约1:16', '徒15:11', '罗3:24', '罗5:20', '弗2:8', '多2:11', '彼前5:10'],
    relevance: 0.9
  },
  // 信心
  {
    themeName: '信心',
    verseRefs: ['创15:6', '哈2:4', '可11:22', '罗1:17', '来11:1', '来11:6', '雅2:17', '彼前1:7'],
    relevance: 0.9
  },
  // 悔改
  {
    themeName: '悔改',
    verseRefs: ['结33:11', '太3:8', '太4:17', '路15:7', '徒3:19', '徒17:30', '罗2:4', '彼后3:9'],
    relevance: 0.9
  },
  // 称义
  {
    themeName: '称义',
    verseRefs: ['诗32:1', '徒13:39', '罗3:24', '罗4:5', '罗5:1', '加2:16', '腓3:9', '雅2:24'],
    relevance: 0.9
  },
  // 成圣
  {
    themeName: '成圣',
    verseRefs: ['出31:13', '约17:17', '徒20:32', '罗6:19', '罗6:22', '林前1:30', '帖前4:3', '来12:14'],
    relevance: 0.9
  },
  // 重生
  {
    themeName: '重生',
    verseRefs: ['约3:3', '约3:5', '多3:5', '彼前1:3', '彼前1:23', '约壹3:9', '约壹5:1', '约壹5:18'],
    relevance: 0.9
  },
  // 永生
  {
    themeName: '永生',
    verseRefs: ['约3:15', '约3:36', '约5:24', '约10:28', '约17:3', '罗6:23', '约壹5:11', '约壹5:13'],
    relevance: 0.9
  },
  // 罪
  {
    themeName: '罪',
    verseRefs: ['创3:6', '诗51:5', '赛53:6', '罗3:23', '罗5:12', '罗6:23', '雅1:15', '约壹1:8'],
    relevance: 0.9
  },
  // 赎罪
  {
    themeName: '赎罪',
    verseRefs: ['利17:11', '赛53:5', '太20:28', '罗3:25', '来9:22', '来10:12', '彼前2:24', '约壹2:2'],
    relevance: 0.9
  },
  // 宝血
  {
    themeName: '宝血',
    verseRefs: ['出12:13', '太26:28', '来9:12', '来10:19', '来13:12', '彼前1:18', '约壹1:7', '启12:11'],
    relevance: 0.8
  },
  // 代赎
  {
    themeName: '代赎',
    verseRefs: ['赛53:4', '可10:45', '罗5:8', '林后5:21', '加3:13', '彼前3:18', '约壹4:10'],
    relevance: 0.8
  },
  // 拣选
  {
    themeName: '拣选',
    verseRefs: ['申7:6', '诗135:4', '赛45:4', '太22:14', '罗8:33', '弗1:4', '帖后2:13', '彼前2:9'],
    relevance: 0.8
  },
  // 预定
  {
    themeName: '预定',
    verseRefs: ['徒4:28', '罗8:29', '林前2:7', '弗1:5', '弗1:11'],
    relevance: 0.7
  },
  // 天堂
  {
    themeName: '天堂',
    verseRefs: ['赛66:1', '太6:9', '约14:2', '林后5:1', '来9:24', '来11:16', '彼前1:4', '启21:1'],
    relevance: 0.8
  },
  // 地狱
  {
    themeName: '地狱',
    verseRefs: ['太5:22', '太10:28', '太25:46', '可9:43', '路16:23', '帖后1:9', '启20:10', '启21:8'],
    relevance: 0.8
  },
  // 道成肉身
  {
    themeName: '道成肉身',
    verseRefs: ['约1:14', '罗8:3', '腓2:6', '提前3:16', '来2:14', '约壹4:2'],
    relevance: 0.9
  },
  // 复活
  {
    themeName: '复活',
    verseRefs: ['诗16:10', '赛26:19', '太28:6', '林前15:3', '林前15:20', '林前15:42', '帖前4:14', '启20:6'],
    relevance: 0.9
  },
  // 升天
  {
    themeName: '升天',
    verseRefs: ['诗68:18', '可16:19', '路24:51', '徒1:9', '弗4:8', '来4:14', '彼前3:22'],
    relevance: 0.8
  },
  // 再来
  {
    themeName: '再来',
    verseRefs: ['但7:13', '太24:30', '太25:31', '徒1:11', '帖前4:16', '多2:13', '来9:28', '启1:7'],
    relevance: 0.9
  },
  // 圣灵感孕
  {
    themeName: '圣灵感孕',
    verseRefs: ['赛7:14', '太1:18', '太1:20', '路1:35'],
    relevance: 0.8
  },
  // 神迹
  {
    themeName: '神迹',
    verseRefs: ['出4:21', '王下6:17', '太11:5', '可16:17', '约2:11', '约20:30', '来2:4'],
    relevance: 0.7
  },
  // 启示
  {
    themeName: '启示',
    verseRefs: ['出20:1', '申29:29', '摩3:7', '罗1:17', '提后3:16', '来1:1', '彼后1:20', '启1:1'],
    relevance: 0.8
  },
  // 预言
  {
    themeName: '预言',
    verseRefs: ['申18:18', '赛46:10', '耶28:9', '珥2:28', '徒2:16', '林前14:1', '彼后1:19'],
    relevance: 0.8
  },
  // 中保
  {
    themeName: '中保',
    verseRefs: ['伯9:33', '赛59:16', '提前2:5', '来8:6', '来9:15', '来12:24', '约壹2:1'],
    relevance: 0.8
  },
  // 代求
  {
    themeName: '代求',
    verseRefs: ['罗8:26', '罗8:34', '来7:25', '约壹2:1', '犹1:20'],
    relevance: 0.7
  },
  // 和好
  {
    themeName: '和好',
    verseRefs: ['赛57:19', '罗5:10', '林后5:18', '弗2:16', '西1:20'],
    relevance: 0.8
  },
  // 收养
  {
    themeName: '收养',
    verseRefs: ['罗8:15', '罗8:23', '加4:5', '弗1:5'],
    relevance: 0.7
  },
  // 创造
  {
    themeName: '创造',
    verseRefs: ['创1:1', '创2:7', '伯38:4', '诗33:6', '赛45:12', '约1:3', '西1:16', '来11:3'],
    relevance: 0.9
  },
  // 神的国
  {
    themeName: '神的国',
    verseRefs: ['诗103:19', '但2:44', '太4:17', '太6:33', '可1:15', '路17:21', '林前6:9', '启11:15'],
    relevance: 0.9
  },
  // 呼召
  {
    themeName: '呼召',
    verseRefs: ['创12:1', '赛6:8', '太4:19', '约15:16', '罗8:30', '林前1:9', '弗4:1', '提后1:9'],
    relevance: 0.8
  },
  // 得荣
  {
    themeName: '得荣',
    verseRefs: ['罗8:17', '罗8:30', '林前15:43', '西3:4', '彼前5:10', '彼后1:3'],
    relevance: 0.7
  },

  // ========== 伦理主题 ==========
  // 爱
  {
    themeName: '爱',
    verseRefs: ['申6:5', '诗136:1', '太22:37', '约13:34', '约15:13', '林前13:1', '约壹3:18', '约壹4:7'],
    relevance: 1.0
  },
  // 盼望
  {
    themeName: '盼望',
    verseRefs: ['诗42:5', '罗5:5', '罗8:24', '罗15:13', '林前13:13', '来6:19', '彼前1:3', '彼前3:15'],
    relevance: 0.9
  },
  // 和平
  {
    themeName: '和平',
    verseRefs: ['诗29:11', '赛9:6', '赛26:3', '约14:27', '罗5:1', '加5:22', '弗2:14', '腓4:7'],
    relevance: 0.8
  },
  // 饶恕
  {
    themeName: '饶恕',
    verseRefs: ['诗32:1', '太6:14', '太18:21', '可11:25', '弗4:32', '西3:13', '约壹1:9'],
    relevance: 0.9
  },
  // 谦卑
  {
    themeName: '谦卑',
    verseRefs: ['诗25:9', '箴16:19', '赛57:15', '太5:3', '太11:29', '腓2:3', '彼前5:5', '雅4:6'],
    relevance: 0.8
  },
  // 祷告
  {
    themeName: '祷告',
    verseRefs: ['诗5:3', '太6:5', '太7:7', '太26:41', '徒2:42', '腓4:6', '帖前5:17', '雅5:16'],
    relevance: 0.9
  },
  // 服事
  {
    themeName: '服事',
    verseRefs: ['书24:15', '太20:26', '可10:45', '路22:26', '约12:26', '加5:13', '彼前4:10'],
    relevance: 0.8
  },
  // 受苦
  {
    themeName: '受苦',
    verseRefs: ['诗34:19', '赛53:3', '太5:10', '罗8:17', '腓1:29', '提后3:12', '彼前4:12', '启2:10'],
    relevance: 0.8
  },
  // 喜乐
  {
    themeName: '喜乐',
    verseRefs: ['尼8:10', '诗16:11', '诗30:5', '赛12:3', '腓4:4', '帖前5:16', '雅1:2', '彼前1:8'],
    relevance: 0.8
  },
  // 忍耐
  {
    themeName: '忍耐',
    verseRefs: ['诗37:7', '箴14:29', '太24:13', '罗5:3', '罗12:12', '来10:36', '雅1:3', '启3:10'],
    relevance: 0.8
  },
  // 恩慈
  {
    themeName: '恩慈',
    verseRefs: ['诗117:2', '箴19:22', '赛54:8', '林前13:4', '弗4:32', '西3:12', '多3:4'],
    relevance: 0.7
  },
  // 良善
  {
    themeName: '良善',
    verseRefs: ['诗23:6', '诗25:7', '诗31:19', '太19:17', '罗15:14', '加5:22', '弗5:9', '帖后1:11'],
    relevance: 0.7
  },
  // 信实
  {
    themeName: '信实',
    verseRefs: ['申7:9', '诗89:1', '哀3:22', '林前1:9', '林前10:13', '加5:22', '来10:23', '约壹1:9'],
    relevance: 0.8
  },
  // 温柔
  {
    themeName: '温柔',
    verseRefs: ['诗37:11', '太5:5', '太11:29', '加5:23', '弗4:2', '西3:12', '提后2:25', '彼前3:4'],
    relevance: 0.7
  },
  // 节制
  {
    themeName: '节制',
    verseRefs: ['箴16:32', '箴25:28', '徒24:25', '加5:22', '提后1:7', '多2:11', '彼后1:6'],
    relevance: 0.7
  },
  // 公义
  {
    themeName: '公义',
    verseRefs: ['申16:20', '诗11:7', '诗85:10', '赛1:17', '太6:33', '罗1:17', '林后5:21', '彼前3:14'],
    relevance: 0.9
  },
  // 诚实
  {
    themeName: '诚实',
    verseRefs: ['出20:16', '诗51:6', '箴12:22', '亚8:16', '弗4:25', '西3:9', '来13:18', '彼前2:1'],
    relevance: 0.7
  },
  // 忠心
  {
    themeName: '忠心',
    verseRefs: ['民12:7', '撒上2:35', '太25:21', '路16:10', '林前4:2', '提后2:2', '启2:10', '启17:14'],
    relevance: 0.8
  },
  // 慷慨
  {
    themeName: '慷慨',
    verseRefs: ['诗112:5', '箴11:25', '太10:8', '林后8:2', '林后9:6', '林后9:11', '提前6:18'],
    relevance: 0.7
  },
  // 接待
  {
    themeName: '接待',
    verseRefs: ['创18:1', '来13:2', '罗12:13', '彼前4:9', '约叁1:5'],
    relevance: 0.6
  },
  // 顺服
  {
    themeName: '顺服',
    verseRefs: ['撒上15:22', '耶7:23', '约14:15', '约15:14', '罗6:16', '来13:17', '雅2:14', '约壹2:3'],
    relevance: 0.8
  },
  // 孝敬
  {
    themeName: '孝敬',
    verseRefs: ['出20:12', '利19:3', '申5:16', '太15:4', '弗6:1', '西3:20'],
    relevance: 0.8
  },
  // 婚姻
  {
    themeName: '婚姻',
    verseRefs: ['创2:24', '太19:4', '弗5:22', '西3:18', '来13:4', '彼前3:1'],
    relevance: 0.8
  },
  // 家庭
  {
    themeName: '家庭',
    verseRefs: ['书24:15', '诗127:3', '诗128:1', '箴22:6', '弗6:4', '提前3:4', '提后3:15'],
    relevance: 0.8
  },
  // 工作
  {
    themeName: '工作',
    verseRefs: ['创2:15', '出20:9', '诗90:17', '箴12:24', '传2:24', '西3:23', '帖后3:10', '雅1:22'],
    relevance: 0.7
  },
  // 金钱
  {
    themeName: '金钱',
    verseRefs: ['太6:19', '太6:24', '路12:15', '提前6:10', '来13:5', '雅5:1'],
    relevance: 0.7
  },
  // 见证
  {
    themeName: '见证',
    verseRefs: ['诗96:3', '赛43:10', '太5:16', '太28:19', '徒1:8', '彼前3:15', '约壹1:1'],
    relevance: 0.8
  },
  // 传福音
  {
    themeName: '传福音',
    verseRefs: ['可16:15', '罗1:16', '罗10:14', '林前1:17', '林前9:16', '提后4:2', '提后4:5'],
    relevance: 0.9
  },
  // 门徒训练
  {
    themeName: '门徒训练',
    verseRefs: ['太28:19', '路14:27', '约8:31', '约15:8', '徒2:42', '提后2:2', '多2:3'],
    relevance: 0.8
  },
  // 教会生活
  {
    themeName: '教会生活',
    verseRefs: ['太16:18', '徒2:42', '罗12:5', '林前12:12', '弗1:22', '弗4:11', '来10:24'],
    relevance: 0.9
  },
  // 圣餐
  {
    themeName: '圣餐',
    verseRefs: ['太26:26', '可14:22', '路22:19', '林前11:23', '林前11:27'],
    relevance: 0.9
  },
  // 洗礼
  {
    themeName: '洗礼',
    verseRefs: ['太3:11', '太28:19', '可16:16', '徒2:38', '徒8:36', '罗6:3', '加3:27', '彼前3:21'],
    relevance: 0.9
  },
  // 十一奉献
  {
    themeName: '十一奉献',
    verseRefs: ['利27:30', '民18:21', '申14:22', '玛3:8', '太23:23', '来7:5'],
    relevance: 0.7
  },
  // 禁食
  {
    themeName: '禁食',
    verseRefs: ['出34:28', '斯4:16', '太6:16', '太17:21', '徒13:2', '徒14:23'],
    relevance: 0.6
  },
  // 管家职分
  {
    themeName: '管家职分',
    verseRefs: ['创1:28', '林前4:1', '林前6:19', '彼前4:10'],
    relevance: 0.7
  },
  // 休息
  {
    themeName: '休息',
    verseRefs: ['出20:8', '出23:12', '出34:21', '诗23:2', '赛30:15', '可6:31'],
    relevance: 0.6
  },

  // ========== 历史主题 ==========
  // 约
  {
    themeName: '约',
    verseRefs: ['创9:9', '创15:18', '创17:2', '出24:8', '耶31:31', '路22:20', '来8:6', '来9:15'],
    relevance: 0.9
  },
  // 应许之地
  {
    themeName: '应许之地',
    verseRefs: ['创12:7', '创13:15', '创15:18', '出3:8', '民13:27', '申1:8', '书1:2', '来11:9'],
    relevance: 0.8
  },
  // 出埃及
  {
    themeName: '出埃及',
    verseRefs: ['出1:11', '出3:10', '出12:31', '出14:21', '出20:2', '申26:8', '诗105:26', '徒7:36'],
    relevance: 0.9
  },
  // 被掳
  {
    themeName: '被掳',
    verseRefs: ['王下17:6', '王下24:14', '王下25:11', '代下36:20', '拉1:1', '尼1:3', '诗137:1', '耶52:28'],
    relevance: 0.8
  },
  // 归回
  {
    themeName: '归回',
    verseRefs: ['拉1:1', '拉2:1', '尼2:5', '赛45:13', '耶29:10', '耶31:8', '亚8:7'],
    relevance: 0.8
  },
  // 会幕
  {
    themeName: '会幕',
    verseRefs: ['出25:8', '出26:1', '出40:2', '出40:34', '利1:1', '民1:50', '来9:2', '启21:3'],
    relevance: 0.8
  },
  // 圣殿
  {
    themeName: '圣殿',
    verseRefs: ['代上28:10', '代下3:1', '代下5:14', '拉3:10', '太21:12', '约2:19', '林前3:16', '启21:22'],
    relevance: 0.9
  },
  // 祭司
  {
    themeName: '祭司',
    verseRefs: ['出28:1', '利8:12', '民18:7', '申10:8', '来5:1', '来7:11', '彼前2:9', '启1:6'],
    relevance: 0.8
  },
  // 献祭
  {
    themeName: '献祭',
    verseRefs: ['创4:4', '创8:20', '出20:24', '利1:1', '利16:6', '来9:12', '来10:1', '来13:15'],
    relevance: 0.8
  },
  // 节期
  {
    themeName: '节期',
    verseRefs: ['利23:1', '民28:16', '申16:16', '约2:13', '约7:2', '徒2:1', '徒20:16'],
    relevance: 0.7
  },
  // 律法
  {
    themeName: '律法',
    verseRefs: ['出20:1', '申5:1', '申27:26', '诗1:2', '诗19:7', '诗119:1', '太5:17', '罗3:20'],
    relevance: 0.9
  },
  // 十诫
  {
    themeName: '十诫',
    verseRefs: ['出20:1', '申5:6', '太19:18', '可12:29', '罗13:9', '雅2:11'],
    relevance: 0.9
  },
  // 安息日
  {
    themeName: '安息日',
    verseRefs: ['创2:2', '出20:8', '出31:13', '申5:12', '赛58:13', '太12:8', '可2:27', '来4:9'],
    relevance: 0.8
  },
  // 君王
  {
    themeName: '君王',
    verseRefs: ['申17:14', '撒上8:7', '撒上16:7', '王上2:12', '诗2:6', '赛9:6', '耶23:5', '启19:16'],
    relevance: 0.8
  },
  // 先知
  {
    themeName: '先知',
    verseRefs: ['申18:15', '撒上3:20', '王上18:36', '王下2:15', '赛6:8', '耶1:5', '摩3:7', '徒3:24'],
    relevance: 0.8
  },
  // 士师
  {
    themeName: '士师',
    verseRefs: ['士2:16', '士3:9', '士6:14', '士13:5', '撒上7:15', '徒13:20'],
    relevance: 0.7
  },
  // 旷野
  {
    themeName: '旷野',
    verseRefs: ['出16:1', '民14:33', '申2:7', '诗107:4', '赛40:3', '太3:1', '太4:1', '来3:8'],
    relevance: 0.7
  },
  // 流亡
  {
    themeName: '流亡',
    verseRefs: ['王下25:11', '代下36:20', '拉1:11', '斯2:6', '诗137:4', '耶29:7', '结1:1', '但1:1'],
    relevance: 0.7
  },
  // 悔改归正
  {
    themeName: '悔改归正',
    verseRefs: ['王上8:47', '代下7:14', '尼9:2', '诗119:59', '赛1:16', '耶3:22', '结18:30', '徒3:19'],
    relevance: 0.8
  },
  // 选民
  {
    themeName: '选民',
    verseRefs: ['申7:6', '申14:2', '诗105:6', '赛43:20', '赛65:9', '太22:14', '罗11:5', '彼前2:9'],
    relevance: 0.8
  },

  // ========== 预言主题 ==========
  // 弥赛亚
  {
    themeName: '弥赛亚',
    verseRefs: ['诗2:2', '赛9:6', '赛11:1', '赛42:1', '赛53:1', '但9:25', '弥5:2', '约1:41'],
    relevance: 1.0
  },
  // 末世
  {
    themeName: '末世',
    verseRefs: ['赛2:2', '但12:1', '太24:3', '提后3:1', '来1:2', '雅5:3', '彼后3:3', '犹1:18'],
    relevance: 0.9
  },
  // 审判
  {
    themeName: '审判',
    verseRefs: ['创18:25', '诗9:7', '赛33:22', '太25:31', '约5:22', '罗2:5', '林后5:10', '启20:12'],
    relevance: 0.9
  },
  // 新天新地
  {
    themeName: '新天新地',
    verseRefs: ['赛65:17', '赛66:22', '彼后3:13', '启21:1', '启21:2', '启22:1'],
    relevance: 0.9
  },
  // 敌基督
  {
    themeName: '敌基督',
    verseRefs: ['但7:25', '太24:15', '帖后2:3', '约壹2:18', '约壹2:22', '约壹4:3', '启13:1'],
    relevance: 0.8
  },
  // 大灾难
  {
    themeName: '大灾难',
    verseRefs: ['但12:1', '太24:21', '可13:19', '启7:14', '启16:1'],
    relevance: 0.8
  },
  // 被提
  {
    themeName: '被提',
    verseRefs: ['林前15:51', '帖前4:16', '帖后2:1'],
    relevance: 0.7
  },
  // 千禧年
  {
    themeName: '千禧年',
    verseRefs: ['赛2:4', '赛11:6', '启20:1', '启20:7'],
    relevance: 0.7
  },
  // 撒但
  {
    themeName: '撒但',
    verseRefs: ['创3:1', '伯1:7', '亚3:1', '太4:10', '路10:18', '彼前5:8', '启12:9', '启20:2'],
    relevance: 0.8
  },
  // 兽
  {
    themeName: '兽',
    verseRefs: ['但7:7', '启13:1', '启13:11', '启17:8', '启19:20', '启20:10'],
    relevance: 0.7
  },
  // 假先知
  {
    themeName: '假先知',
    verseRefs: ['太7:15', '太24:11', '可13:22', '彼后2:1', '约壹4:1', '启13:11', '启16:13', '启19:20'],
    relevance: 0.7
  },
  // 兽印
  {
    themeName: '兽印',
    verseRefs: ['启13:16', '启14:9', '启14:11', '启16:2', '启19:20', '启20:4'],
    relevance: 0.6
  },
  // 七印
  {
    themeName: '七印',
    verseRefs: ['启6:1', '启6:3', '启6:5', '启6:7', '启6:9', '启6:12', '启8:1'],
    relevance: 0.6
  },
  // 七号
  {
    themeName: '七号',
    verseRefs: ['启8:7', '启8:8', '启8:10', '启8:12', '启9:1', '启9:13', '启11:15'],
    relevance: 0.6
  },
  // 七碗
  {
    themeName: '七碗',
    verseRefs: ['启16:2', '启16:3', '启16:4', '启16:8', '启16:10', '启16:12', '启16:17'],
    relevance: 0.6
  },
];

async function main() {
  console.log('开始种子圣经经文-主题关联数据...\n');

  // 获取所有主题
  const themes = await prisma.bibleTheme.findMany();
  const themeMap = new Map();
  for (const theme of themes) {
    themeMap.set(theme.nameZh, theme.id);
  }
  console.log(`找到 ${themes.length} 个主题`);

  let created = 0;
  let skipped = 0;
  let parseError = 0;
  let themeNotFound = 0;

  for (const assoc of THEME_VERSE_ASSOCIATIONS) {
    const themeId = themeMap.get(assoc.themeName);
    if (!themeId) {
      console.log(`警告：找不到主题 "${assoc.themeName}"`);
      themeNotFound++;
      continue;
    }

    for (const ref of assoc.verseRefs) {
      const parsed = parseVerseRef(ref);

      if (!parsed) {
        parseError++;
        continue;
      }

      try {
        await prisma.themeVerseLink.create({
          data: {
            themeId,
            bookId: parsed.bookId,
            chapter: parsed.chapter,
            verseStart: parsed.verseStart,
            verseEnd: parsed.verseEnd,
            relevance: assoc.relevance,
            linkType: 'PRIMARY',
            source: 'MANUAL',
          },
        });
        created++;
      } catch (error) {
        if (error.code === 'P2002') {
          skipped++;
        } else {
          console.error(`创建关联失败: ${assoc.themeName} - ${ref}`, error.message);
        }
      }
    }
  }

  const totalAssociations = await prisma.themeVerseLink.count();

  console.log('\n=== 经文-主题关联数据种子完成 ===');
  console.log(`创建: ${created}`);
  console.log(`跳过（已存在）: ${skipped}`);
  console.log(`解析错误: ${parseError}`);
  console.log(`主题未找到: ${themeNotFound}`);
  console.log(`数据库总关联数: ${totalAssociations}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });