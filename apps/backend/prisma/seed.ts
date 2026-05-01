import { PrismaClient } from '@prisma/client';
import { auth } from '../src/modules/auth/auth';

const prisma = new PrismaClient();

async function main() {
  await prisma.notificationRead.deleteMany();
  await prisma.notificationTarget.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.referralCode.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.order.updateMany({ data: { couponId: null } });
  await prisma.coupon.deleteMany();
  await prisma.dailyActivity.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();

  await prisma.mockExamRecord.deleteMany();
  await prisma.mockPaperQuestion.deleteMany();
  await prisma.mockPaper.deleteMany();
  await prisma.practiceRecord.deleteMany();
  await prisma.practiceProgress.deleteMany();
  await prisma.favoriteQuestion.deleteMany();
  await prisma.vocabularyWord.deleteMany();
  await prisma.questionContent.deleteMany();
  await prisma.questionItem.deleteMany();
  await prisma.questionTopic.deleteMany();
  await prisma.userBindingConfig.deleteMany();
  await prisma.userMembership.deleteMany();
  await prisma.order.deleteMany();
  await prisma.membershipPlan.deleteMany();
  await prisma.questionBank.deleteMany();

  const bankGdEn = await prisma.questionBank.create({
    data: {
      name: '广东省英语导游口试题库',
      province: '广东',
      language: '英语',
      examType: '笔试+面试',
      interviewForm: '标准面试',
      status: 'active',
    },
  });

  const bankGdJp = await prisma.questionBank.create({
    data: {
      name: '广东省日语导游口试题库',
      province: '广东',
      language: '日语',
      examType: '笔试+面试',
      interviewForm: '标准面试',
      status: 'active',
    },
  });

  const scenicEn = await prisma.questionTopic.create({
    data: { bankId: bankGdEn.id, code: 'scenic-intro', name: '景点介绍', sortOrder: 1 },
  });

  const welcomeEn = await prisma.questionTopic.create({
    data: { bankId: bankGdEn.id, code: 'welcome-speech', name: '欢迎词', sortOrder: 2 },
  });

  const scenicQuestions = [
    {
      title: 'Canton Tower (广州塔)',
      difficulty: 3,
      suggestedDurationSec: 120,
      keywords: ['landmark', 'architecture', 'Pearl River'],
      focusWords: ['skyscraper', 'observation deck', 'illuminated'],
      promptEn: 'Please introduce Canton Tower to our guests.',
      promptZh: '请向客人介绍广州塔。',
      answerEn:
        'Canton Tower, also known as Guangzhou TV Astronomical and Sightseeing Tower, stands at 600 meters tall, making it the tallest television tower in China. Located on the south bank of the Pearl River, it was completed in 2010 and features a stunning lattice-steel structure that twists 45 degrees along its height. The tower offers multiple observation decks, a restaurant, and a sky walk experience that attracts millions of visitors annually.',
      answerZh:
        '广州塔，又称广州电视观光塔，高达600米，是中国最高的电视塔。坐落于珠江南岸，建于2010年，其标志性的格栅钢结构沿高度扭转45度。塔内设有多个观光层、餐厅和高空步行体验，每年吸引数百万游客。',
      summary: '广州地标性建筑，高600米的电视塔',
    },
    {
      title: 'Shamian Island (沙面岛)',
      difficulty: 2,
      suggestedDurationSec: 90,
      keywords: ['colonial architecture', 'historical', 'Guangzhou'],
      focusWords: ['concession', 'European style', 'heritage'],
      promptEn: 'Can you tell us about Shamian Island?',
      promptZh: '请介绍一下沙面岛。',
      answerEn:
        'Shamian Island is a small sandbank island in Guangzhou that served as a foreign concession during the 19th and early 20th centuries. The island features over 150 well-preserved colonial buildings in European architectural styles, including Victorian, Baroque, and Neoclassical. Today it is a popular destination for photography and leisure, lined with banyan trees and peaceful boulevards.',
      answerZh:
        '沙面岛是广州的一座小沙洲岛，19至20世纪初曾作为外国租界。岛上保存着150余栋欧式殖民风格建筑，包括维多利亚式、巴洛克式和新古典主义风格。如今它是摄影和休闲的热门目的地，榕树成荫，街道宁静。',
      summary: '保存完好的欧式殖民建筑历史岛屿',
    },
    {
      title: 'Chen Clan Ancestral Hall (陈家祠)',
      difficulty: 3,
      suggestedDurationSec: 120,
      keywords: ['Lingnan architecture', 'folk art', 'ancestral hall'],
      focusWords: ['woodcarving', 'stone sculpture', 'Qing dynasty'],
      promptEn: 'Please introduce the Chen Clan Ancestral Hall.',
      promptZh: '请介绍陈家祠。',
      answerEn:
        'The Chen Clan Ancestral Hall, built between 1888 and 1894 during the Qing Dynasty, is a masterpiece of traditional Lingnan architecture. It was constructed by the Chen family clans from 72 counties across Guangdong Province. The hall is renowned for its elaborate decorative arts, including wood carvings, stone sculptures, brick carvings, iron castings, and ceramic moldings. Today it houses the Guangdong Folk Arts Museum.',
      answerZh:
        '陈家祠建于1888至1894年清朝时期，是岭南传统建筑的杰作。它由广东省72个县的陈氏家族共同出资兴建。该祠堂以精美的装饰艺术著称，包括木雕、石雕、砖雕、铁铸和陶塑。现为广东民间工艺博物馆。',
      summary: '清代岭南民间艺术建筑瑰宝',
    },
    {
      title: 'Sun Yat-sen Memorial Hall (中山纪念堂)',
      difficulty: 2,
      suggestedDurationSec: 100,
      keywords: ['Sun Yat-sen', 'Republican China', 'octagonal design'],
      focusWords: ['memorial', 'civic building', 'octagonal'],
      promptEn: 'Tell me about the Sun Yat-sen Memorial Hall.',
      promptZh: '请介绍中山纪念堂。',
      answerEn:
        'The Sun Yat-sen Memorial Hall in Guangzhou was built to commemorate Dr. Sun Yat-sen, the founding father of modern China. Completed in 1931, the hall features a distinctive octagonal design blending Chinese palace architecture with modern construction techniques. It seats around 5,000 people and has hosted major cultural and political events. The surrounding garden includes a statue of Dr. Sun Yat-sen.',
      answerZh:
        '广州中山纪念堂是为纪念中国近代民主革命先行者孙中山先生而建。建于1931年，以独特的八角形设计著称，融合了中国宫殿建筑与现代建造技术。可容纳约5000人，曾举办重大文化政治活动。周围园林内设有孙中山先生雕像。',
      summary: '纪念孙中山先生的标志性八角形礼堂',
    },
    {
      title: 'Baiyun Mountain (白云山)',
      difficulty: 2,
      suggestedDurationSec: 90,
      keywords: ['nature', 'hiking', 'city park'],
      focusWords: ['scenic area', 'summit', 'botanical garden'],
      promptEn: 'Please describe Baiyun Mountain to our visitors.',
      promptZh: '请向游客描述白云山。',
      answerEn:
        'Baiyun Mountain is a large nature park located in the northern part of Guangzhou. Covering over 20,000 acres, it includes 30 peaks, with Moxing Peak being the highest at 382 meters. The mountain is known for its lush greenery, fresh air, and scenic views of the city skyline. It features numerous hiking trails, gardens, cable cars, and recreational facilities, making it a favorite weekend destination for Guangzhou residents.',
      answerZh:
        '白云山是广州北部的一座大型自然公园，占地逾2万亩，包含30座山峰，其中摩星岭最高，海拔382米。白云山以葱郁的绿色植被、清新空气和俯瞰城市的壮阔景色著称，设有众多登山步道、园林、缆车和休闲设施，是广州市民周末出游的热门去处。',
      summary: '广州最大的城市自然公园，城市绿肺',
    },
    {
      title: 'Guangzhou Museum of Art (广州艺术博物馆)',
      difficulty: 3,
      suggestedDurationSec: 110,
      keywords: ['art', 'museum', 'Chinese painting'],
      focusWords: ['collection', 'contemporary art', 'exhibits'],
      promptEn: 'Can you introduce the Guangzhou Museum of Art?',
      promptZh: '请介绍广州艺术博物馆。',
      answerEn:
        'The Guangzhou Museum of Art is one of the leading art institutions in South China. Founded in 1957, it houses an extensive collection of Chinese paintings, calligraphy, and ceramic works spanning from ancient times to the modern era. The museum regularly hosts temporary exhibitions featuring works by prominent Chinese and international artists. It plays an important role in promoting art education and cultural exchange in the Pearl River Delta region.',
      answerZh:
        '广州艺术博物馆是华南地区重要的艺术机构之一，成立于1957年，珍藏中国画、书法和陶瓷等藏品，跨越古代至现代。博物馆定期举办国内外知名艺术家的临时展览，在珠三角地区艺术教育和文化交流中发挥重要作用。',
      summary: '华南重要艺术机构，中国书画陶瓷珍藏',
    },
    {
      title: 'Guangdong Provincial Museum (广东省博物馆)',
      difficulty: 3,
      suggestedDurationSec: 120,
      keywords: ['history', 'Guangdong', 'cultural relics'],
      focusWords: ['artifacts', 'exhibition hall', 'maritime trade'],
      promptEn: 'Please introduce the Guangdong Provincial Museum.',
      promptZh: '请介绍广东省博物馆。',
      answerEn:
        'The Guangdong Provincial Museum is the largest comprehensive museum in Guangdong Province. The current building, shaped like a Chinese treasure box, was inaugurated in 2010. The museum features permanent exhibitions on Guangdong history, natural history, and arts and crafts, with highlights including ancient maritime trade artifacts, Chaozhou woodcarving, and Cantonese opera costumes. It hosts millions of visitors each year.',
      answerZh:
        '广东省博物馆是广东省规模最大的综合性博物馆。现馆建于2010年，外形酷似中国古代宝盒。博物馆设有广东历史、自然史和工艺美术常设展览，重点展品包括古代海上贸易文物、潮州木雕和粤剧戏服，每年接待数百万观众。',
      summary: '广东最大综合博物馆，珍藏海丝文物',
    },
    {
      title: 'Yuexiu Park (越秀公园)',
      difficulty: 2,
      suggestedDurationSec: 90,
      keywords: ['Five Rams Statue', 'park', 'city legend'],
      focusWords: ['goat', 'legend', 'ancient city wall'],
      promptEn: 'Tell our guests about Yuexiu Park.',
      promptZh: '请介绍越秀公园。',
      answerEn:
        'Yuexiu Park is the largest park in Guangzhou and home to the iconic Five Rams Statue, a symbol of the city. According to legend, five immortals rode five rams bearing rice spikes to Guangzhou, blessing the city with prosperity and earning it the nickname "City of Rams." The park also contains a section of the ancient city wall from the Ming Dynasty and the Guangzhou Museum, making it an important cultural and recreational destination.',
      answerZh:
        '越秀公园是广州最大的公园，以标志性的五羊雕像而闻名，该雕像是广州的城市象征。传说中，五位仙人骑着五只衔着稻穗的羊降临广州，赐予这座城市繁荣，使其得名"羊城"。公园内还保存有明代古城墙遗址和广州博物馆，是重要的文化休闲圣地。',
      summary: '广州最大公园，五羊雕像城市地标',
    },
    {
      title: 'Chimelong Safari Park (长隆野生动物世界)',
      difficulty: 2,
      suggestedDurationSec: 100,
      keywords: ['wildlife', 'theme park', 'family'],
      focusWords: ['safari', 'giant panda', 'nocturnal animals'],
      promptEn: 'Please introduce Chimelong Safari Park.',
      promptZh: '请介绍长隆野生动物世界。',
      answerEn:
        "Chimelong Safari Park, located in Panyu District, Guangzhou, is one of China's premier wildlife theme parks. It is home to over 20,000 animals representing more than 700 species, including giant pandas, white lions, and African elephants. The park features drive-through safari zones, walk-through habitats, animal shows, and a dedicated giant panda breeding center. It consistently ranks among the top wildlife attractions in Asia.",
      answerZh:
        '长隆野生动物世界位于广州番禺区，是中国顶级野生动物主题公园之一。园内有超过20000只、700余种动物，包括大熊猫、白狮和非洲象。公园设有驾车穿越动物区、步行生态区、动物表演和大熊猫繁育中心，长期位居亚洲顶级野生动物景区之列。',
      summary: '中国顶级野生动物主题公园，700余种动物',
    },
    {
      title: 'Liwan Lake Park (荔湾湖公园)',
      difficulty: 1,
      suggestedDurationSec: 80,
      keywords: ['Cantonese culture', 'old Guangzhou', 'garden'],
      focusWords: ['lotus', 'traditional teahouse', 'Xiguan'],
      promptEn: 'Can you describe Liwan Lake Park?',
      promptZh: '请描述荔湾湖公园。',
      answerEn:
        'Liwan Lake Park is nestled in the heart of Liwan District, one of the oldest and most culturally rich areas of Guangzhou, also known as Xiguan. The park features a picturesque lotus lake surrounded by traditional Cantonese garden architecture, willow trees, and stone bridges. Visitors can enjoy traditional Cantonese tea house culture and folk performances. The park offers a glimpse into the leisurely lifestyle of old Guangzhou.',
      answerZh:
        '荔湾湖公园坐落于荔湾区中心，这里是广州历史最悠久、文化最丰富的地区之一，又称西关。公园以荷花湖为中心，四周是岭南传统园林建筑、杨柳和石桥。游客可体验传统粤式茶文化和民俗表演，感受旧广州的悠闲生活气息。',
      summary: '西关腹地的传统粤式园林，荷花湖景',
    },
  ];

  const questionItems: any[] = [];
  for (const q of scenicQuestions) {
    const item = await prisma.questionItem.create({
      data: {
        topicId: scenicEn.id,
        title: q.title,
        difficulty: q.difficulty,
        suggestedDurationSec: q.suggestedDurationSec,
        masteryScore: Math.floor(Math.random() * 60),
        keywords: q.keywords,
        focusWords: q.focusWords,
        content: {
          create: {
            promptEn: q.promptEn,
            promptZh: q.promptZh,
            answerEn: q.answerEn,
            answerZh: q.answerZh,
            summary: q.summary,
          },
        },
      },
    });
    questionItems.push(item);
  }

  const welcomeQuestions = [
    {
      title: 'Welcome Speech for a Group Tour',
      difficulty: 2,
      suggestedDurationSec: 90,
      keywords: ['greeting', 'introduction', 'itinerary'],
      focusWords: ['itinerary', 'accommodate', 'hospitality'],
      promptEn: 'Give a welcome speech for a group of foreign tourists arriving in Guangzhou.',
      promptZh: '给到达广州的外国旅游团致欢迎词。',
      answerEn:
        "Good morning, ladies and gentlemen! On behalf of our tour company, I warmly welcome you all to Guangzhou, the vibrant heart of South China. My name is [Guide Name], and I will be your guide throughout this wonderful journey. Over the next few days, we will explore the rich history, culture, and cuisine that make Guangzhou one of China's most fascinating cities. Please don't hesitate to ask if you need any assistance. I hope we will have a wonderful time together.",
      answerZh:
        '女士们先生们，早上好！我代表我们的旅行社热忱欢迎大家来到广州——华南充满活力的中心。我叫（导游姓名），将在这次精彩旅程中全程为您服务。在接下来的几天里，我们将探索广州丰富的历史、文化和美食，这正是广州成为中国最迷人城市之一的原因。如有任何需要，请随时告知。希望我们共度美好时光。',
      summary: '标准欢迎词，适用于抵达广州的旅游团',
    },
    {
      title: 'Welcome to a Cultural Heritage Tour',
      difficulty: 3,
      suggestedDurationSec: 100,
      keywords: ['cultural heritage', 'history', 'Lingnan'],
      focusWords: ['heritage', 'dynasty', 'preserve'],
      promptEn: 'Welcome the tourists to a cultural heritage tour of Guangdong.',
      promptZh: '欢迎游客参加广东文化遗产之旅。',
      answerEn:
        'Welcome, dear friends! You have chosen a truly extraordinary journey — a cultural heritage tour through the magnificent land of Guangdong. For centuries, this region has been a cradle of civilization, where the Lingnan culture flourished and where East met West in remarkable ways. Today we will walk through ancient ancestral halls, admire traditional architecture, and discover the stories that shaped this land. I am honored to be your guide on this voyage through history.',
      answerZh:
        '亲爱的朋友们，欢迎您！您选择了一段非凡的旅程——广东文化遗产之旅。数百年来，这片土地一直是文明的摇篮，岭南文化在此发扬光大，东西方文化在此交融碰撞。今天我们将漫步古老的宗祠，欣赏传统建筑，探寻塑造这片土地的历史故事。能作为您的导游踏上这段历史之旅，我深感荣幸。',
      summary: '文化遗产主题旅游欢迎词',
    },
  ];

  for (const q of welcomeQuestions) {
    await prisma.questionItem.create({
      data: {
        topicId: welcomeEn.id,
        title: q.title,
        difficulty: q.difficulty,
        suggestedDurationSec: q.suggestedDurationSec,
        masteryScore: 0,
        keywords: q.keywords,
        focusWords: q.focusWords,
        content: {
          create: {
            promptEn: q.promptEn,
            promptZh: q.promptZh,
            answerEn: q.answerEn,
            answerZh: q.answerZh,
            summary: q.summary,
          },
        },
      },
    });
  }

  const scenicJp = await prisma.questionTopic.create({
    data: { bankId: bankGdJp.id, code: 'scenic-intro', name: '観光地紹介', sortOrder: 1 },
  });
  await prisma.questionTopic.create({
    data: { bankId: bankGdJp.id, code: 'welcome-speech', name: 'ようこそスピーチ', sortOrder: 2 },
  });

  await prisma.questionItem.create({
    data: {
      topicId: scenicJp.id,
      title: '広州塔 (Canton Tower)',
      difficulty: 3,
      suggestedDurationSec: 120,
      masteryScore: 0,
      keywords: ['ランドマーク', '建築', '珠江'],
      focusWords: ['超高層ビル', '展望台', 'ライトアップ'],
      content: {
        create: {
          promptEn: '広州塔についてご紹介ください。',
          promptZh: '请向客人介绍广州塔（日语版）。',
          answerEn:
            '広州塔は高さ600メートルの電波塔で、中国で最も高いテレビ塔です。珠江南岸に位置し、2010年に完成しました。美しい格子鋼構造が特徴で、年間数百万人の観光客が訪れます。',
          answerZh: '（日语版）广州塔是高600米的电视塔，是中国最高的电视塔，位于珠江南岸，完成于2010年。',
          summary: '广州标志性建筑（日语版）',
        },
      },
    },
  });

  const standardPaper = await prisma.mockPaper.create({
    data: {
      bankId: bankGdEn.id,
      title: '广东英语导游标准模拟卷',
      paperType: 'standard',
      suggestedMinutes: 30,
      focus: ['景点介绍', '欢迎词', '文化知识'],
    },
  });

  const intensePaper = await prisma.mockPaper.create({
    data: {
      bankId: bankGdEn.id,
      title: '广东英语导游强化模拟卷',
      paperType: 'intensive',
      suggestedMinutes: 45,
      focus: ['景点介绍', '临场应变', '英语口语'],
    },
  });

  for (let i = 0; i < 5 && i < questionItems.length; i++) {
    await prisma.mockPaperQuestion.create({
      data: {
        paperId: standardPaper.id,
        questionId: questionItems[i].id,
        sortOrder: i,
      },
    });
  }

  for (let i = 2; i < 7 && i < questionItems.length; i++) {
    await prisma.mockPaperQuestion.create({
      data: {
        paperId: intensePaper.id,
        questionId: questionItems[i].id,
        sortOrder: i - 2,
      },
    });
  }

  await prisma.membershipPlan.create({
    data: {
      name: '标准会员',
      level: 'standard',
      price: 9800,
      yearlyPrice: 98000,
      period: 'month',
      durationDays: 30,
      features: ['完整题库', '模考练习', '练习记录', '收藏题目', '生词本', 'AI 点评'],
      sortOrder: 1,
      highlighted: false,
      revenueCatEntitlementId: 'pro_standard',
    },
  });

  await prisma.membershipPlan.create({
    data: {
      name: '进阶会员',
      level: 'advanced',
      price: 19800,
      yearlyPrice: 198000,
      period: 'month',
      durationDays: 30,
      features: ['所有标准功能', '无限 AI 点评', '录音上传', '错题分析', '专项突破', '优先客服'],
      sortOrder: 2,
      highlighted: true,
      revenueCatEntitlementId: 'pro_advanced',
    },
  });

  await auth.api.signUpEmail({
    body: {
      name: '普通用户',
      email: 'user@guideready.local',
      password: 'user123456',
    },
  });

  await auth.api.signUpEmail({
    body: {
      name: '管理员',
      email: 'z1309014381@gmail.com',
      password: 'admin123456',
    },
  });

  // 将管理员账号的 role 设为 admin
  const adminUser = await prisma.user.update({
    where: { email: 'z1309014381@gmail.com' },
    data: { role: 'admin' },
  });

  const normalUser = await prisma.user.findUnique({
    where: { email: 'user@guideready.local' },
  });

  // ──── 优惠券 Seed ────
  const couponNewUser = await prisma.coupon.create({
    data: {
      code: 'NEWUSER20',
      type: 'percentage',
      value: 20,
      minAmount: 9800,
      maxUses: 100,
      usedCount: 12,
      validFrom: new Date('2026-01-01'),
      validUntil: new Date('2027-12-31'),
      isActive: true,
    },
  });

  await prisma.coupon.create({
    data: {
      code: 'WELCOME10',
      type: 'fixed',
      value: 1000,
      maxUses: 50,
      usedCount: 8,
      validFrom: new Date(),
      isActive: true,
    },
  });

  await prisma.coupon.create({
    data: {
      code: 'FREETRIAL7',
      type: 'free_trial',
      value: 7,
      maxUses: 200,
      usedCount: 45,
      validUntil: new Date('2027-06-30'),
      isActive: true,
    },
  });

  await prisma.coupon.create({
    data: {
      code: 'VIP50',
      type: 'percentage',
      value: 50,
      minAmount: 19800,
      maxUses: 10,
      usedCount: 0,
      validFrom: new Date(),
      validUntil: new Date('2026-12-31'),
      isActive: true,
    },
  });

  await prisma.coupon.create({
    data: {
      code: 'EXPIRED99',
      type: 'percentage',
      value: 99,
      validFrom: new Date('2025-01-01'),
      validUntil: new Date('2025-12-31'),
      isActive: false,
    },
  });

  // ──── 邀请码 Seed ────
  if (adminUser && normalUser) {
    const adminReferral = await prisma.referralCode.create({
      data: {
        userId: adminUser.id,
        code: 'ADMIN001',
        totalInvited: 3,
        totalReward: 9,
      },
    });

    const userReferral = await prisma.referralCode.create({
      data: {
        userId: normalUser.id,
        code: 'USER001',
        totalInvited: 1,
        totalReward: 3,
      },
    });

    // 模拟几个被邀请用户
    for (let i = 0; i < 3; i++) {
      const fakeEmail = `invited${i}@guideready.local`;
      const result = await auth.api.signUpEmail({
        body: {
          name: `被邀请用户${i + 1}`,
          email: fakeEmail,
          password: 'test123456',
        },
      });
      const invitedUserId = (result as any)?.user?.id;
      if (invitedUserId && adminReferral) {
        await prisma.referral.create({
          data: {
            referrerId: adminReferral.id,
            referredUserId: invitedUserId,
            rewardedAt: i < 2 ? new Date() : null,
          },
        });
      }
    }
  }

  // ──── 成就解锁 Seed ────
  if (adminUser && normalUser) {
    // 给管理员解锁大多数成就
    const allAchievements = [
      { key: 'first_practice', name: '初次练习', description: '完成第一次练习', icon: 'Play', category: 'practice', condition: { type: 'practice_count', threshold: 1 }, sortOrder: 1 },
      { key: 'practice_10', name: '学有所成', description: '累计完成 10 次练习', icon: 'BookOpen', category: 'practice', condition: { type: 'practice_count', threshold: 10 }, sortOrder: 2 },
      { key: 'practice_50', name: '勤奋刻苦', description: '累计完成 50 次练习', icon: 'PenLine', category: 'practice', condition: { type: 'practice_count', threshold: 50 }, sortOrder: 3 },
      { key: 'practice_100', name: '百题斩', description: '累计完成 100 次练习', icon: 'Zap', category: 'practice', condition: { type: 'practice_count', threshold: 100 }, sortOrder: 4 },
      { key: 'practice_500', name: '学神降临', description: '累计完成 500 次练习', icon: 'Crown', category: 'practice', condition: { type: 'practice_count', threshold: 500 }, sortOrder: 5 },
      { key: 'streak_3', name: '三日之约', description: '连续 3 天打卡学习', icon: 'Flame', category: 'streak', condition: { type: 'streak_days', threshold: 3 }, sortOrder: 6 },
      { key: 'streak_7', name: '周而复始', description: '连续 7 天打卡学习', icon: 'Flame', category: 'streak', condition: { type: 'streak_days', threshold: 7 }, sortOrder: 7 },
      { key: 'streak_30', name: '月度达人', description: '连续 30 天打卡学习', icon: 'Flame', category: 'streak', condition: { type: 'streak_days', threshold: 30 }, sortOrder: 8 },
      { key: 'first_mock', name: '初试锋芒', description: '完成第一次模拟考试', icon: 'GraduationCap', category: 'mock', condition: { type: 'mock_count', threshold: 1 }, sortOrder: 9 },
      { key: 'mock_5', name: '身经百战', description: '完成 5 次模拟考试', icon: 'Trophy', category: 'mock', condition: { type: 'mock_count', threshold: 5 }, sortOrder: 10 },
      { key: 'mock_90', name: '九十分先生', description: '模拟考试得分 90 分以上', icon: 'Star', category: 'mock', condition: { type: 'mock_score', threshold: 90 }, sortOrder: 11 },
      { key: 'mock_100', name: '满分达人', description: '模拟考试满分 100 分', icon: 'Sparkles', category: 'mock', condition: { type: 'mock_score', threshold: 100 }, sortOrder: 12 },
      { key: 'favorite_10', name: '收藏达人', description: '收藏 10 道题目', icon: 'Heart', category: 'collection', condition: { type: 'favorite_count', threshold: 10 }, sortOrder: 13 },
      { key: 'word_20', name: '词汇大师', description: '生词本收集 20 个单词', icon: 'BookMarked', category: 'collection', condition: { type: 'word_count', threshold: 20 }, sortOrder: 14 },
    ];

    for (const a of allAchievements) {
      await prisma.achievement.upsert({
        where: { key: a.key },
        create: a,
        update: {},
      });
    }

    // 管理员解锁前 8 个成就
    const adminAchievements = await prisma.achievement.findMany({
      where: { sortOrder: { lte: 8 } },
    });
    for (const a of adminAchievements) {
      await prisma.userAchievement.create({
        data: {
          userId: adminUser.id,
          achievementId: a.id,
          unlockedAt: new Date(Date.now() - Math.random() * 30 * 86400000),
        },
      });
    }

    // 普通用户解锁前 3 个成就
    const userAchievements = await prisma.achievement.findMany({
      where: { sortOrder: { lte: 3 } },
    });
    for (const a of userAchievements) {
      await prisma.userAchievement.create({
        data: {
          userId: normalUser.id,
          achievementId: a.id,
          unlockedAt: new Date(),
        },
      });
    }
  }

  // ──── 反馈 Seed ────
  if (normalUser) {
    await prisma.feedback.create({
      data: {
        userId: normalUser.id,
        type: 'bug',
        content: '在练习页面中，TTS 自动播放有时会失效，需要手动点击播放按钮。希望修复这个问题。',
        contact: 'user@guideready.local',
        status: 'pending',
      },
    });

    await prisma.feedback.create({
      data: {
        userId: normalUser.id,
        type: 'suggestion',
        content: '建议增加夜间模式的自动切换功能，根据系统时间自动切换主题。',
        status: 'resolved',
        adminNote: '感谢建议！目前已经支持跟随系统主题（设置 → 外观 → 跟随系统）。',
      },
    });

    await prisma.feedback.create({
      data: {
        userId: normalUser.id,
        type: 'suggestion',
        content: '希望可以增加学习数据导出功能，方便打印和分享。',
        status: 'pending',
      },
    });
  }

  // ──── 排行榜 Seed：为所有用户生成练习记录和打卡数据 ────
  const allUsers = await prisma.user.findMany();
  for (const user of allUsers) {
    // 随机 0-30 条练习记录
    const practiceCount = Math.floor(Math.random() * 30) + 1;
    for (let i = 0; i < practiceCount; i++) {
      const randomQuestion = questionItems[Math.floor(Math.random() * questionItems.length)];
      if (randomQuestion) {
        try {
          await prisma.practiceRecord.create({
            data: {
              userId: user.id,
              questionId: randomQuestion.id,
              actionType: i % 3 === 0 ? 'listen' : i % 3 === 1 ? 'speak' : 'answer',
              createdAt: new Date(Date.now() - Math.random() * 30 * 86400000),
            },
          });
        } catch { /* ignore */ }
      }
    }

    // 全年随机天数的打卡（约 1/3 的天有记录）
    const uniqueDays = new Set<string>()
    const now = new Date()
    const yearStart = new Date(now.getFullYear(), 0, 1)
    const daysInYear = Math.floor((now.getTime() - yearStart.getTime()) / 86400000)
    const activeDayCount = Math.floor(Math.random() * daysInYear * 0.35) + 10 // ~35% active days
    for (let d = 0; d < activeDayCount; d++) {
      const day = new Date(yearStart)
      day.setDate(day.getDate() + Math.floor(Math.random() * daysInYear))
      const dayKey = day.toISOString().split('T')[0]
      if (!uniqueDays.has(dayKey)) {
        uniqueDays.add(dayKey)
        try {
          await prisma.dailyActivity.upsert({
            where: { userId_date: { userId: user.id, date: day } },
            create: { userId: user.id, date: day, count: Math.floor(Math.random() * 10) + 1 },
            update: {},
          })
        } catch { /* ignore */ }
      }
    }
  }

  // ──── 模拟考试记录 Seed ────
  for (const user of allUsers) {
    const examCount = Math.floor(Math.random() * 5);
    for (let i = 0; i < examCount; i++) {
      const paper = i % 2 === 0 ? standardPaper : intensePaper;
      try {
        await prisma.mockExamRecord.create({
          data: {
            userId: user.id,
            paperId: paper.id,
            score: Math.floor(Math.random() * 40) + 60,
            weakness: ['景点介绍', '应变能力'].slice(0, Math.random() > 0.5 ? 2 : 1),
            takenAt: new Date(Date.now() - Math.random() * 30 * 86400000),
          },
        });
      } catch { /* ignore */ }
    }
  }

  // ──── 收藏/生词 Seed ────
  for (const user of allUsers) {
    // 随机收藏题目
    const favCount = Math.floor(Math.random() * 8) + 1;
    const addedIds = new Set<string>();
    for (let i = 0; i < favCount; i++) {
      const q = questionItems[Math.floor(Math.random() * questionItems.length)];
      if (q && !addedIds.has(q.id)) {
        addedIds.add(q.id);
        try {
          await prisma.favoriteQuestion.create({
            data: { userId: user.id, questionId: q.id },
          });
        } catch { /* ignore */ }
      }
    }

    // 随机生词
    const wordCount = Math.floor(Math.random() * 10) + 1;
    const sampleWords = [
      { term: 'skyscraper', definition: '摩天大楼' },
      { term: 'heritage', definition: '遗产' },
      { term: 'concession', definition: '租界' },
      { term: 'artifacts', definition: '文物' },
      { term: 'itinerary', definition: '行程' },
      { term: 'hospitality', definition: '款待' },
      { term: 'dynasty', definition: '朝代' },
      { term: 'architecture', definition: '建筑' },
      { term: 'octagonal', definition: '八角形的' },
      { term: 'pavilion', definition: '亭子' },
      { term: 'memorial', definition: '纪念堂' },
      { term: 'observation deck', definition: '观景台' },
      { term: 'botanical garden', definition: '植物园' },
      { term: 'ancestral hall', definition: '宗祠' },
      { term: 'maritime trade', definition: '海上贸易' },
    ];
    const shuffled = [...sampleWords].sort(() => Math.random() - 0.5).slice(0, wordCount);
    for (const w of shuffled) {
      try {
        await prisma.vocabularyWord.create({
          data: { userId: user.id, term: w.term, definition: w.definition },
        });
      } catch { /* ignore */ }
    }
  }

  console.log('Seed complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
