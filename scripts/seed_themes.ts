// scripts/seed_themes.ts
// 圣经主题数据种子脚本

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 核心圣经主题
const CORE_THEMES = [
  // 神学主题
  {
    nameZh: '救恩',
    nameEn: 'Salvation',
    aliases: ['得救', '救赎', '拯救'],
    category: 'THEOLOGICAL',
    summary: '神为人类提供的从罪和死亡中获救的途径，藉着耶稣基督的死亡和复活成就。',
    description: '救恩是基督教信仰的核心教义，包括称义、成圣和得荣耀三个阶段。人因信称义，靠着神的恩典得救，不是出于行为。',
    keyVerses: ['约3:16', '弗2:8-9', '罗10:9'],
  },
  {
    nameZh: '恩典',
    nameEn: 'Grace',
    aliases: ['恩惠', '恩典'],
    category: 'THEOLOGICAL',
    summary: '神白白赐给人的恩宠，是人所不配得的。',
    description: '恩典是神对人无条件的爱和眷顾。我们得救是本乎恩，也因着信。神的恩典在耶稣基督里显明。',
    keyVerses: ['弗2:8', '罗5:20', '林后12:9'],
  },
  {
    nameZh: '信心',
    nameEn: 'Faith',
    aliases: ['信', '相信', '信靠'],
    category: 'THEOLOGICAL',
    summary: '对神的信靠和顺服，是人与神建立关系的基础。',
    description: '信是所望之事的实底，是未见之事的确据。亚伯拉罕因信称义，成为信心之父。得救的信心包括理智上的认识、情感上的认同和意志上的交托。',
    keyVerses: ['来11:1', '罗4:3', '弗2:8'],
  },
  {
    nameZh: '悔改',
    nameEn: 'Repentance',
    aliases: ['悔改归正', '回转'],
    category: 'THEOLOGICAL',
    summary: '离弃罪恶，转向神，是得救和复兴的必要条件。',
    description: '悔改包括为罪忧伤、承认罪恶、离弃罪恶。施洗约翰和耶稣都以"天国近了，你们应当悔改"开始传道。',
    keyVerses: ['徒3:19', '太4:17', '路15:7'],
  },
  {
    nameZh: '称义',
    nameEn: 'Justification',
    aliases: ['称义', '被算为义'],
    category: 'THEOLOGICAL',
    summary: '神因着耶稣基督的救赎，宣告罪人为义。',
    description: '称义是法律上的宣告，不是内在的改变。人因信被神算为义，罪得赦免，穿上基督的义袍。',
    keyVerses: ['罗3:24', '罗5:1', '加2:16'],
  },
  {
    nameZh: '成圣',
    nameEn: 'Sanctification',
    aliases: ['圣洁', '分别为圣'],
    category: 'THEOLOGICAL',
    summary: '神使信徒在生命和品格上越来越像基督的过程。',
    description: '成圣是地位上的圣洁和渐进的成圣。神呼召我们成为圣洁，因为他是圣洁的。圣灵在我们里面工作，使我们结出圣灵的果子。',
    keyVerses: ['帖前4:3', '来12:14', '彼前1:15-16'],
  },
  {
    nameZh: '复活',
    nameEn: 'Resurrection',
    aliases: ['复活', '复活升天'],
    category: 'THEOLOGICAL',
    summary: '耶稣基督从死里复活，是基督教信仰的基石。',
    description: '基督的复活证明他是神的儿子，战胜了死亡。信徒将来也要复活，得着荣耀的身体。',
    keyVerses: ['林前15:3-4', '林前15:20', '罗6:4'],
  },
  {
    nameZh: '三位一体',
    nameEn: 'Trinity',
    aliases: ['三一神', '圣父圣子圣灵'],
    category: 'THEOLOGICAL',
    summary: '神是独一的，但以圣父、圣子、圣灵三个位格存在。',
    description: '三位一体是神的奥秘，圣父、圣子、圣灵同尊同荣，同受敬拜。圣经没有直接使用"三位一体"一词，但这一真理贯穿新旧约。',
    keyVerses: ['太28:19', '林后13:14', '创1:26'],
  },
  {
    nameZh: '创造',
    nameEn: 'Creation',
    aliases: ['创造天地', '神的创造'],
    category: 'THEOLOGICAL',
    summary: '神从无中创造万有，彰显了他的智慧和权能。',
    description: '神用六日创造了天地万物，一切所造的都甚好。人是按神的形象造的，有尊贵的地位。',
    keyVerses: ['创1:1', '创1:27', '约1:3'],
  },
  {
    nameZh: '神的国',
    nameEn: 'Kingdom of God',
    aliases: ['天国', '神国'],
    category: 'THEOLOGICAL',
    summary: '神掌权的领域，是耶稣传道的核心主题。',
    description: '神的国既已来到，尚未完全。耶稣用比喻教导神国的奥秘。进入神国需要重生。',
    keyVerses: ['太6:33', '可1:15', '路17:21'],
  },

  // 伦理主题
  {
    nameZh: '爱',
    nameEn: 'Love',
    aliases: ['爱心', '爱神爱人'],
    category: 'ETHICAL',
    summary: '基督教的最高美德，包括神对人的爱和人对他人的爱。',
    description: '神就是爱。最大的诫命是尽心尽性尽意尽力爱主你的神，其次也相仿，就是爱人如己。爱是圣灵果子的核心。',
    keyVerses: ['林前13:13', '约一4:8', '太22:37-39'],
  },
  {
    nameZh: '盼望',
    nameEn: 'Hope',
    aliases: ['盼望', '永生的盼望'],
    category: 'ETHICAL',
    summary: '对神应许的坚定期待，是灵魂的锚。',
    description: '信徒的盼望在于基督。这盼望不至羞耻，因为神的爱浇灌在我们心里。盼望是信德和爱心的基础。',
    keyVerses: ['罗5:5', '来6:19', '罗15:13'],
  },
  {
    nameZh: '和平',
    nameEn: 'Peace',
    aliases: ['平安', '和睦'],
    category: 'ETHICAL',
    summary: '与神和好，也与人和睦的关系。',
    description: '耶稣是和平之君。因着他的十字架，我们与神和好，也当尽力与人和睦。平安是圣灵的果子。',
    keyVerses: ['弗2:14', '罗5:1', '太5:9'],
  },
  {
    nameZh: '饶恕',
    nameEn: 'Forgiveness',
    aliases: ['赦免', '宽恕'],
    category: 'ETHICAL',
    summary: '免除他人的罪债，反映神对我们的饶恕。',
    description: '我们因神的饶恕而得救，也当饶恕人。耶稣教导我们要饶恕人七十个七次。不饶恕人的恶仆的比喻警醒我们。',
    keyVerses: ['太6:14-15', '弗4:32', '西3:13'],
  },
  {
    nameZh: '谦卑',
    nameEn: 'Humility',
    aliases: ['谦卑', '虚心'],
    category: 'ETHICAL',
    summary: '认识自己的有限和软弱，倚靠神。',
    description: '神阻挡骄傲的人，赐恩给谦卑的人。耶稣心里柔和谦卑，我们要学他的样式。虚心的人有福了。',
    keyVerses: ['太5:3', '彼前5:5', '腓2:3'],
  },
  {
    nameZh: '祷告',
    nameEn: 'Prayer',
    aliases: ['祈祷', '祈求'],
    category: 'ETHICAL',
    summary: '人与神沟通的方式，是属灵生命的重要操练。',
    description: '耶稣教导门徒主祷文，作为祷告的典范。要常常祷告，不可灰心。祷告是属灵争战的武器。',
    keyVerses: ['太6:9-13', '帖前5:17', '弗6:18'],
  },
  {
    nameZh: '服事',
    nameEn: 'Service',
    aliases: ['侍奉', '服侍'],
    category: 'ETHICAL',
    summary: '用爱心服事神和人，跟随耶稣的榜样。',
    description: '耶稣来不是要受人的服事，乃是要服事人。在基督里，最大的要作众人的仆人。',
    keyVerses: ['可10:45', '加5:13', '约12:26'],
  },
  {
    nameZh: '受苦',
    nameEn: 'Suffering',
    aliases: ['苦难', '试炼'],
    category: 'ETHICAL',
    summary: '信徒在世上可能经历的艰难，是信心的考验。',
    description: '在世上你们有苦难，但耶稣已经胜了世界。受苦是与基督一同受苦，将来的荣耀也更大。',
    keyVerses: ['约16:33', '罗8:17-18', '彼前4:12-13'],
  },

  // 历史主题
  {
    nameZh: '约',
    nameEn: 'Covenant',
    aliases: ['盟约', '圣约'],
    category: 'HISTORICAL',
    summary: '神与人建立的关系框架，包括亚伯拉罕之约、摩西之约、大卫之约和新约。',
    description: '神是立约的神。从挪亚之约到新约，神藉着约向人启示他的信实和恩典。新约是更美的约，由耶稣的血所立。',
    keyVerses: ['创17:7', '耶31:31-34', '来8:6'],
  },
  {
    nameZh: '应许之地',
    nameEn: 'Promised Land',
    aliases: ['迦南地', '流奶与蜜之地'],
    category: 'HISTORICAL',
    summary: '神应许赐给亚伯拉罕和他后裔的土地。',
    description: '神与亚伯拉罕立约，应许将迦南地赐给他的后裔。约书亚带领以色列人进入应许之地。',
    keyVerses: ['创15:18', '书1:2-3', '来11:9'],
  },
  {
    nameZh: '出埃及',
    nameEn: 'Exodus',
    aliases: ['出埃及', '离开埃及'],
    category: 'HISTORICAL',
    summary: '神藉摩西带领以色列人脱离埃及奴役的事件。',
    description: '出埃及是旧约中最重要的救赎事件，预表新约中基督将我们从罪恶中拯救出来。',
    keyVerses: ['出12:31-42', '出14:21-22', '林前10:1-4'],
  },
  {
    nameZh: '被掳',
    nameEn: 'Exile',
    aliases: ['被掳巴比伦', '流亡'],
    category: 'HISTORICAL',
    summary: '犹大国被巴比伦征服，人民被掳到巴比伦。',
    description: '因着百姓的罪，神藉巴比伦惩罚犹大。被掳是以色列历史的转折点，先知在此时传讲复兴的盼望。',
    keyVerses: ['代下36:17-21', '耶29:10-14', '但1:1-2'],
  },
  {
    nameZh: '归回',
    nameEn: 'Return',
    aliases: ['回归', '重建'],
    category: 'HISTORICAL',
    summary: '波斯王居鲁士允许犹太人归回耶路撒冷重建圣殿。',
    description: '神的应许应验，被掳的犹太人在所罗巴伯、以斯拉、尼希米的带领下归回，重建圣殿和城墙。',
    keyVerses: ['拉1:1-4', '尼2:5', '亚1:3'],
  },

  // 预言主题
  {
    nameZh: '弥赛亚',
    nameEn: 'Messiah',
    aliases: ['基督', '受膏者'],
    category: 'PROPHETIC',
    summary: '神所应许的救主，就是耶稣基督。',
    description: '旧约预言弥赛亚将出于大卫的家，他将是君王、祭司、先知。耶稣成就了这些预言。',
    keyVerses: ['赛9:6-7', '赛53章', '太1:1'],
  },
  {
    nameZh: '末世',
    nameEn: 'End Times',
    aliases: ['末后的日子', '末期'],
    category: 'PROPHETIC',
    summary: '基督再来、审判和神国完全实现的时期。',
    description: '耶稣预言末世必有战争、地震、饥荒。他将在荣耀中再来，审判活人死人。',
    keyVerses: ['太24章', '启22:12', '彼后3:10'],
  },
  {
    nameZh: '审判',
    nameEn: 'Judgment',
    aliases: ['神的审判', '末日审判'],
    category: 'PROPHETIC',
    summary: '神对罪恶的审判，也是末日对万民的审判。',
    description: '神是公义的审判者。人人都有一死，死后且有审判。信徒在基督台前交账，不信者受白色大宝座的审判。',
    keyVerses: ['来9:27', '启20:11-15', '林后5:10'],
  },
  {
    nameZh: '新天新地',
    nameEn: 'New Heaven and New Earth',
    aliases: ['新天新地', '新耶路撒冷'],
    category: 'PROPHETIC',
    summary: '神最终将更新的宇宙，信徒永远与神同在。',
    description: '先知预言新天新地，启示录描绘新耶路撒冷。在那里不再有死亡、悲哀、哭号、疼痛。',
    keyVerses: ['赛65:17', '启21:1-4', '彼后3:13'],
  },
];

async function main() {
  console.log('开始种子圣经主题数据...');

  for (const theme of CORE_THEMES) {
    try {
      const created = await prisma.bibleTheme.create({
        data: theme,
      });
      console.log(`创建主题: ${created.nameZh}`);
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`主题已存在: ${theme.nameZh}`);
      } else {
        console.error(`创建主题失败 ${theme.nameZh}:`, error);
      }
    }
  }

  // 创建主题之间的关联
  const themeConnections = [
    { theme: '救恩', related: '恩典', type: 'RELATED', strength: 0.9 },
    { theme: '救恩', related: '信心', type: 'RELATED', strength: 0.9 },
    { theme: '救恩', related: '悔改', type: 'RELATED', strength: 0.8 },
    { theme: '称义', related: '成圣', type: 'CHILD', strength: 0.8 },
    { theme: '恩典', related: '信心', type: 'RELATED', strength: 0.8 },
    { theme: '弥赛亚', related: '救恩', type: 'FULFILLS', strength: 0.9 },
    { theme: '约', related: '弥赛亚', type: 'FULFILLS', strength: 0.7 },
    { theme: '爱', related: '饶恕', type: 'RELATED', strength: 0.8 },
    { theme: '盼望', related: '信心', type: 'RELATED', strength: 0.8 },
    { theme: '末世', related: '审判', type: 'RELATED', strength: 0.9 },
    { theme: '末世', related: '新天新地', type: 'CHILD', strength: 0.8 },
    { theme: '复活', related: '盼望', type: 'RELATED', strength: 0.7 },
    { theme: '出埃及', related: '救恩', type: 'FULFILLS', strength: 0.6 },
  ];

  for (const conn of themeConnections) {
    try {
      const theme = await prisma.bibleTheme.findFirst({
        where: { nameZh: conn.theme },
      });
      const relatedTheme = await prisma.bibleTheme.findFirst({
        where: { nameZh: conn.related },
      });

      if (theme && relatedTheme) {
        await prisma.themeConnection.create({
          data: {
            themeId: theme.id,
            relatedThemeId: relatedTheme.id,
            connectionType: conn.type,
            strength: conn.strength,
          },
        });
        console.log(`创建主题关联: ${conn.theme} -> ${conn.related}`);
      }
    } catch (error: any) {
      if (error.code !== 'P2002') {
        console.error(`创建主题关联失败:`, error);
      }
    }
  }

  console.log('主题数据种子完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });