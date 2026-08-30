/* ============ 语界 LinguaVerse · 课程数据 v1 ============ */
/* 单词条目老格式: [词, 音标, 释义, 例句, 例句译文]
   分级: en:{A1,A2,B1,B2}, ja:{N5,N4,N3}, ko:{TOPIK-I, TOPIK-II, TOPIK-III} */

const LANGUAGES = {
  en: { id:'en', name:'英语', native:'English', flag:'🇬🇧', levels:[
    {id:'a1', name:'A1 入门', desc:'基础词汇与日常问候'},
    {id:'a2', name:'A2 初级', desc:'描述日常生活与简单对话'},
    {id:'b1', name:'B1 中级', desc:'应对工作学习的常用表达'},
    {id:'b2', name:'B2 进阶', desc:'复杂话题的流利交流'},
  ]},
  ja: { id:'ja', name:'日语', native:'日本語', flag:'🇯🇵', levels:[
    {id:'n5', name:'N5 入门', desc:'五十音起步,最基础表达'},
    {id:'n4', name:'N4 初级', desc:'日常话题的简单阅读'},
    {id:'n3', name:'N3 中级', desc:'能处理一般生活场景'},
  ]},
  ko: { id:'ko', name:'韩语', native:'한국어', flag:'🇰🇷', levels:[
    {id:'t1', name:'TOPIK I', desc:'发音入门与基础句型'},
    {id:'t2', name:'TOPIK II', desc:'生活场景的实用表达'},
    {id:'t3', name:'TOPIK III', desc:'抽象话题与高级词汇'},
  ]},
};

const TYPE_META = {
  vocab:     {name:'单词课', icon:'📇'},
  grammar:   {name:'语法课', icon:'✏️'},
  listening: {name:'听力课', icon:'🎧'},
  speaking:  {name:'口语课', icon:'🎤'},
};

const COURSES = {
  en: {
    a1: [
      { id:'en-a1-u1', title:'Greetings 问候与介绍',
        lessons:[
          {id:'en-a1-u1-v', type:'vocab', title:'基础问候词', xp:15},
          {id:'en-a1-u1-g', type:'grammar', title:'Be 动词入门', xp:15},
        ]},
      { id:'en-a1-u2', title:'Numbers & Time 数字与时间',
        lessons:[
          {id:'en-a1-u2-v', type:'vocab', title:'数字与星期', xp:15},
          {id:'en-a1-u2-l', type:'listening', title:'时间听辨', xp:15},
        ]},
    ],
    a2: [
      { id:'en-a2-u1', title:'Daily Life 日常生活',
        lessons:[
          {id:'en-a2-u1-v', type:'vocab', title:'起居词汇', xp:20},
          {id:'en-a2-u1-s', type:'speaking', title:'早晨情景会话', xp:20},
        ]},
      { id:'en-a2-u2', title:'Food & Drink 饮食',
        lessons:[
          {id:'en-a2-u2-v', type:'vocab', title:'餐厅常用词', xp:20},
          {id:'en-a2-u2-g', type:'grammar', title:'可数与不可数名词', xp:20},
        ]},
    ],
    b1: [
      { id:'en-b1-u1', title:'Work & Study 工作学习',
        lessons:[
          {id:'en-b1-u1-v', type:'vocab', title:'职场基础词', xp:25},
          {id:'en-b1-u1-l', type:'listening', title:'工作安排听力', xp:25},
        ]},
      { id:'en-b1-u2', title:'Travel 旅行',
        lessons:[
          {id:'en-b1-u2-v', type:'vocab', title:'出行必备词', xp:25},
          {id:'en-b1-u2-s', type:'speaking', title:'机场与酒店', xp:25},
        ]},
    ],
    b2: [
      { id:'en-b2-u1', title:'Society 社会话题',
        lessons:[
          {id:'en-b2-u1-v', type:'vocab', title:'新闻媒体词汇', xp:30},
          {id:'en-b2-u1-g', type:'grammar', title:'虚拟语气进阶', xp:30},
        ]},
      { id:'en-b2-u2', title:'Culture 文化交流',
        lessons:[
          {id:'en-b2-u2-v', type:'vocab', title:'文化艺术词汇', xp:30},
          {id:'en-b2-u2-l', type:'listening', title:'访谈听力', xp:30},
        ]},
    ],
  },
  ja: {
    n5: [
      { id:'ja-n5-u1', title:'挨拶 问候与自我介绍',
        lessons:[
          {id:'ja-n5-u1-v', type:'vocab', title:'基本问候', xp:15},
          {id:'ja-n5-u1-g', type:'grammar', title:'「です」「は」', xp:15},
        ]},
      { id:'ja-n5-u2', title:'数字と日常',
        lessons:[
          {id:'ja-n5-u2-v', type:'vocab', title:'数字与时间', xp:15},
          {id:'ja-n5-u2-l', type:'listening', title:'简单听解', xp:15},
        ]},
    ],
    n4: [
      { id:'ja-n4-u1', title:'買い物と旅行',
        lessons:[
          {id:'ja-n4-u1-v', type:'vocab', title:'购物与出行', xp:20},
          {id:'ja-n4-u1-g', type:'grammar', title:'て形入门', xp:20},
        ]},
      { id:'ja-n4-u2', title:'気持ちの表現',
        lessons:[
          {id:'ja-n4-u2-v', type:'vocab', title:'情感词汇', xp:20},
          {id:'ja-n4-u2-s', type:'speaking', title:'表达喜好', xp:20},
        ]},
    ],
    n3: [
      { id:'ja-n3-u1', title:'仕事と敬語',
        lessons:[
          {id:'ja-n3-u1-v', type:'vocab', title:'职场敬语', xp:25},
          {id:'ja-n3-u1-g', type:'grammar', title:'敬语体系', xp:25},
        ]},
      { id:'ja-n3-u2', title:'ニュースと読解',
        lessons:[
          {id:'ja-n3-u2-v', type:'vocab', title:'新闻常用词', xp:25},
          {id:'ja-n3-u2-l', type:'listening', title:'新闻速报听解', xp:25},
        ]},
    ],
  },
  ko: {
    t1: [
      { id:'ko-t1-u1', title:'인사 问候与自我介绍',
        lessons:[
          {id:'ko-t1-u1-v', type:'vocab', title:'基础问候', xp:15},
          {id:'ko-t1-u1-g', type:'grammar', title:'이에요/예요', xp:15},
        ]},
      { id:'ko-t1-u2', title:'숫자와 일상',
        lessons:[
          {id:'ko-t1-u2-v', type:'vocab', title:'数字与日常', xp:15},
          {id:'ko-t1-u2-l', type:'listening', title:'数字听辨', xp:15},
        ]},
    ],
    t2: [
      { id:'ko-t2-u1', title:'쇼핑과 주문',
        lessons:[
          {id:'ko-t2-u1-v', type:'vocab', title:'购物点餐', xp:20},
          {id:'ko-t2-u1-g', type:'grammar', title:'-고 싶어요', xp:20},
        ]},
      { id:'ko-t2-u2', title:'여행과 계획',
        lessons:[
          {id:'ko-t2-u2-v', type:'vocab', title:'旅行计划', xp:20},
          {id:'ko-t2-u2-s', type:'speaking', title:'旅行会话', xp:20},
        ]},
    ],
    t3: [
      { id:'ko-t3-u1', title:'뉴스와 사회',
        lessons:[
          {id:'ko-t3-u1-v', type:'vocab', title:'新闻社会词汇', xp:25},
          {id:'ko-t3-u1-g', type:'grammar', title:'高级连接词尾', xp:25},
        ]},
      { id:'ko-t3-u2', title:'문화와 예술',
        lessons:[
          {id:'ko-t3-u2-v', type:'vocab', title:'文化艺术词汇', xp:25},
          {id:'ko-t3-u2-l', type:'listening', title:'文化访谈听解', xp:25},
        ]},
    ],
  },
};

/* ============ 课时内容 v1 ============ */
const CONTENT = {
  /* ---------- English A1 ---------- */
  'en-a1-u1-v': {words:[
    ['hello','/həˈloʊ/','你好','Hello, nice to meet you.','你好,很高兴认识你。'],
    ['goodbye','/ɡʊdˈbaɪ/','再见','Goodbye, see you tomorrow.','再见,明天见。'],
    ['thank','/θæŋk/','感谢','Thank you for your help.','感谢你的帮助。'],
    ['sorry','/ˈsɑːri/','对不起','I am sorry for being late.','对不起我迟到了。'],
    ['please','/pliːz/','请','Please sit down.','请坐。'],
    ['name','/neɪm/','名字','My name is Tom.','我叫汤姆。'],
    ['friend','/frend/','朋友','She is my best friend.','她是我最好的朋友。'],
  ]},
  'en-a1-u1-g': {items:[
    {q:'I ___ a student.', opts:['am','is','are','be'], a:0, explain:'I 后面用 am。'},
    {q:'She ___ my teacher.', opts:['am','is','are','be'], a:1, explain:'第三人称单数用 is。'},
    {q:'They ___ from China.', opts:['am','is','are','be'], a:2, explain:'复数用 are。'},
    {q:'___ you OK?', opts:['Am','Is','Are','Be'], a:2, explain:'you 用 are。'},
  ]},
  'en-a1-u2-v': {words:[
    ['one','/wʌn/','一','I have one apple.','我有一个苹果。'],
    ['two','/tuː/','二','There are two books.','有两本书。'],
    ['three','/θriː/','三','Three days left.','还剩三天。'],
    ['monday','/ˈmʌndeɪ/','星期一','Today is Monday.','今天是星期一。'],
    ['morning','/ˈmɔːrnɪŋ/','早晨','Good morning!','早上好!'],
    ['evening','/ˈiːvnɪŋ/','傍晚','Good evening.','晚上好。'],
  ]},
  'en-a1-u2-l': {items:[
    {t:'It is nine o clock now.', m:'现在九点了。'},
    {t:'The meeting is on Friday.', m:'会议在星期五。'},
    {t:'See you tomorrow morning.', m:'明天早上见。'},
  ]},
  /* ---------- English A2 ---------- */
  'en-a2-u1-v': {words:[
    ['wake','/weɪk/','醒来','I wake up at 7 every day.','我每天7点醒来。'],
    ['breakfast','/ˈbrekfəst/','早餐','Breakfast is ready.','早餐准备好了。'],
    ['lunch','/lʌntʃ/','午餐','Lunch is at noon.','午餐在中午。'],
    ['dinner','/ˈdɪnər/','晚餐','Dinner with family.','和家人一起晚餐。'],
    ['sleep','/sliːp/','睡觉','I sleep at 11 pm.','我晚上11点睡觉。'],
    ['work','/wɜːrk/','工作','He works in a hospital.','他在医院工作。'],
  ]},
  'en-a2-u1-s': {items:[
    {t:'I usually get up at 7 am.', m:'我通常早上7点起床。'},
    {t:'What do you have for breakfast?', m:'你早餐吃什么?'},
    {t:'I go to work by bus.', m:'我坐公交上班。'},
  ]},
  'en-a2-u2-v': {words:[
    ['coffee','/ˈkɔːfi/','咖啡','A cup of coffee, please.','请来一杯咖啡。'],
    ['water','/ˈwɔːtər/','水','I drink a lot of water.','我喝很多水。'],
    ['bread','/bred/','面包','Fresh bread smells great.','新鲜面包闻起来很香。'],
    ['chicken','/ˈtʃɪkɪn/','鸡肉','I like fried chicken.','我喜欢炸鸡。'],
    ['rice','/raɪs/','米饭','Rice is my staple food.','米饭是我的主食。'],
    ['menu','/ˈmenjuː/','菜单','Can I see the menu?','能看一下菜单吗?'],
  ]},
  'en-a2-u2-g': {items:[
    {q:'I want ___ apple.', opts:['a','an','the','some'], a:1, explain:'apple 以元音开头,用 an。'},
    {q:'There is ___ milk in the fridge.', opts:['a','an','some','many'], a:2, explain:'milk 是不可数名词,用 some。'},
    {q:'How ___ eggs do you need?', opts:['much','many','some','any'], a:1, explain:'eggs 可数复数,用 many。'},
  ]},
  /* ---------- English B1 ---------- */
  'en-b1-u1-v': {words:[
    ['meeting','/ˈmiːtɪŋ/','会议','The meeting starts at 3.','会议三点开始。'],
    ['project','/ˈprɑːdʒekt/','项目','This project is urgent.','这个项目很急。'],
    ['colleague','/ˈkɑːliːɡ/','同事','She is my colleague.','她是我的同事。'],
    ['deadline','/ˈdedlaɪn/','截止日期','The deadline is Friday.','周五截止。'],
    ['report','/rɪˈpɔːrt/','报告','Please submit the report.','请提交报告。'],
    ['interview','/ˈɪntərvjuː/','面试','Job interview tomorrow.','明天面试。'],
  ]},
  'en-b1-u1-l': {items:[
    {t:'The project deadline has been moved to next Monday.', m:'项目截止日期改到下周一了。'},
    {t:'Please attend the meeting at conference room B.', m:'请参加B会议室的会议。'},
    {t:'She will be away on business for three days.', m:'她要出差三天。'},
  ]},
  'en-b1-u2-v': {words:[
    ['airport','/ˈerpɔːrt/','机场','The airport is far away.','机场很远。'],
    ['hotel','/hoʊˈtel/','酒店','I booked a hotel.','我订了酒店。'],
    ['ticket','/ˈtɪkɪt/','票','I bought a train ticket.','我买了火车票。'],
    ['luggage','/ˈlʌɡɪdʒ/','行李','My luggage is lost.','我的行李丢了。'],
    ['passport','/ˈpæspɔːrt/','护照','Do not forget your passport.','别忘了护照。'],
    ['tourist','/ˈtʊrɪst/','游客','Many tourists visit here.','很多游客来这里。'],
  ]},
  'en-b1-u2-s': {items:[
    {t:'I would like to check in, please.', m:'我想办理入住。'},
    {t:'How can I get to the airport?', m:'去机场怎么走?'},
    {t:'Can you recommend a good restaurant?', m:'能推荐好的餐厅吗?'},
  ]},
  /* ---------- English B2 ---------- */
  'en-b2-u1-v': {words:[
    ['journalist','/ˈdʒɜːrnəlɪst/','记者','She is a journalist.','她是记者。'],
    ['headline','/ˈhedlaɪn/','头条','The headline shocked everyone.','头条震惊了所有人。'],
    ['coverage','/ˈkʌvərɪdʒ/','报道','News coverage is extensive.','新闻报道很广泛。'],
    ['politician','/ˌpɑːləˈtɪʃn/','政治家','A famous politician.','一位著名政治家。'],
    ['economy','/ɪˈkɑːnəmi/','经济','The economy is recovering.','经济正在复苏。'],
    ['democracy','/dɪˈmɑːkrəsi/','民主','Democracy matters.','民主很重要。'],
  ]},
  'en-b2-u1-g': {items:[
    {q:'If I ___ rich, I would travel the world.', opts:['am','was','were','be'], a:2, explain:'虚拟语气中 be 动词统一用 were。'},
    {q:'I wish I ___ studied harder.', opts:['have','had','has','having'], a:1, explain:'wish 对过去的事用过去完成时 had studied。'},
    {q:'The report suggests that he ___ resign.', opts:['should','must','could','would'], a:0, explain:'suggest 从句用 should+动词原形。'},
  ]},
  'en-b2-u2-v': {words:[
    ['heritage','/ˈherɪtɪdʒ/','遗产','Cultural heritage.','文化遗产。'],
    ['masterpiece','/ˈmæstərpiːs/','杰作','This is a masterpiece.','这是杰作。'],
    ['symphony','/ˈsɪmfəni/','交响乐','Beethoven symphony.','贝多芬交响曲。'],
    ['exhibition','/ˌeksɪˈbɪʃn/','展览','Art exhibition.','艺术展。'],
    ['sculpture','/ˈskʌlptʃər/','雕塑','A beautiful sculpture.','美丽的雕塑。'],
    ['literature','/ˈlɪtrətʃər/','文学','World literature.','世界文学。'],
  ]},
  'en-b2-u2-l': {items:[
    {t:'The exhibition will run until the end of next month.', m:'展览将持续到下月底。'},
    {t:'Cultural exchange promotes mutual understanding.', m:'文化交流增进相互理解。'},
    {t:'His novel has been translated into 12 languages.', m:'他的小说已被译成12种语言。'},
  ]},
  /* ---------- Japanese N5 ---------- */
  'ja-n5-u1-v': {words:[
    ['こんにちは','konnichiwa','你好','こんにちは、はじめまして。','你好,初次见面。'],
    ['ありがとう','arigatou','谢谢','ありがとうございます。','非常感谢。'],
    ['すみません','sumimasen','对不起','すみません、遅れました。','对不起,我迟到了。'],
    ['おはよう','ohayou','早上好','おはようございます。','早上好。'],
    ['さようなら','sayounara','再见','さようなら、また。','再见。'],
    ['わたし','watashi','我','わたしは学生です。','我是学生。'],
  ]},
  'ja-n5-u1-g': {items:[
    {q:'わたし ___ 学生です。', opts:['は','を','も','の'], a:0, explain:'「は」提示主题。'},
    {q:'これ ___ 本です。', opts:['は','が','を','で'], a:0, explain:'「これは〜です」句型。'},
    {q:'あなた ___ 日本人ですか。', opts:['も','は','を','に'], a:1, explain:'疑问句主题用 は。'},
  ]},
  'ja-n5-u2-v': {words:[
    ['いち','ichi','一','一時です。','一点了。'],
    ['に','ni','二','二人です。','两个人。'],
    ['じかん','jikan','时间','時間がありません。','没有时间了。'],
    ['きょう','kyou','今天','今日は月曜日です。','今天是周一。'],
    ['あした','ashita','明天','明日会いましょう。','明天见吧。'],
    ['まいにち','mainichi','每天','毎日勉強します。','每天学习。'],
  ]},
  'ja-n5-u2-l': {items:[
    {t:'今、三時です。', m:'现在三点。'},
    {t:'明日の十時に会いましょう。', m:'明天十点见吧。'},
    {t:'毎日日本語を勉強します。', m:'每天学日语。'},
  ]},
  /* ---------- Japanese N4 ---------- */
  'ja-n4-u1-v': {words:[
    ['きっぷ','kippu','车票','切符を買います。','买车票。'],
    ['ホテル','hoteru','酒店','ホテルに泊まります。','住酒店。'],
    ['りょこう','ryokou','旅行','来週旅行します。','下周去旅行。'],
    ['おみやげ','omiyage','土特产','お土産を買いました。','买了土特产。'],
    ['でんしゃ','densha','电车','電車で行きます。','坐电车去。'],
    ['やすみ','yasumi','休息','明日は休みです。','明天休息。'],
  ]},
  'ja-n4-u1-g': {items:[
    {q:'図書館で本を ___ ください。', opts:['読んで','読みて','読んでて','読くて'], a:0, explain:'読む的て形是読んで。'},
    {q:'ここで写真を ___ もいいですか。', opts:['撮って','撮りて','撮んで','撮くて'], a:0, explain:'撮る→て形撮って。'},
  ]},
  'ja-n4-u2-v': {words:[
    ['たのしい','tanoshii','开心的','毎日が楽しいです。','每天都开心。'],
    ['かなしい','kanashii','悲伤的','悲しい映画でした。','悲伤的电影。'],
    ['すき','suki','喜欢','音楽が好きです。','喜欢音乐。'],
    ['きらい','kirai','讨厌','野菜が嫌いです。','讨厌蔬菜。'],
    ['きょうみ','kyoumi','兴趣','歴史に興味があります。','对历史有兴趣。'],
    ['おもいで','omoide','回忆','いい思い出です。','美好的回忆。'],
  ]},
  'ja-n4-u2-s': {items:[
    {t:'私は音楽が好きです。', m:'我喜欢音乐。'},
    {t:'旅行はどうでしたか。', m:'旅行怎么样?'},
    {t:'日本のアニメが好きです。', m:'喜欢日本动漫。'},
  ]},
  /* ---------- Japanese N3 ---------- */
  'ja-n3-u1-v': {words:[
    ['おつかれ','otsukare','辛苦了','お疲れ様でした。','辛苦了。'],
    ['おせわ','osewa','照顾','お世話になりました。','承蒙关照。'],
    ['けんじょうご','kenjougo','谦让语','謙譲語を使います。','使用谦让语。'],
    ['そんけいご','sonkeigo','尊敬语','尊敬語が難しいです。','尊敬语很难。'],
    ['かいぎ','kaigi','会议','会議があります。','有会议。'],
    ['しょるい','shorui','文件','書類を整理します。','整理文件。'],
  ]},
  'ja-n3-u1-g': {items:[
    {q:'社長が ___ 。', opts:['いらっしゃいます','います','あります','おります'], a:0, explain:'尊敬语 いらっしゃいます。'},
    {q:'私が ___ 。', opts:['参ります','行きます','いらっしゃいます','おいでになります'], a:0, explain:'谦让语 参ります。'},
  ]},
  'ja-n3-u2-v': {words:[
    ['しんぶん','shinbun','报纸','新聞を読みます。','读报纸。'],
    ['ニュース','nyuusu','新闻','ニュースを見ます。','看新闻。'],
    ['じけん','jiken','事件','大きな事件でした。','是大事件。'],
    ['せいじ','seiji','政治','政治に興味がある。','对政治感兴趣。'],
    ['けいざい','keizai','经济','経済ニュース。','经济新闻。'],
    ['ほうどう','houdou','报道','ニュース報道。','新闻报道。'],
  ]},
  'ja-n3-u2-l': {items:[
    {t:'経済が回復しつつあります。', m:'经济正在恢复。'},
    {t:'午後三時から会議があります。', m:'下午三点开始有会议。'},
    {t:'新しい法律が来月施行されます。', m:'新法律下月实施。'},
  ]},
  /* ---------- Korean TOPIK I ---------- */
  'ko-t1-u1-v': {words:[
    ['안녕하세요','annyeonghaseyo','你好','안녕하세요, 만나서 반갑습니다.','你好,很高兴见到你。'],
    ['감사합니다','gamsahamnida','谢谢','도와주셔서 감사합니다.','谢谢帮忙。'],
    ['죄송합니다','joesonghamnida','对不起','늦어서 죄송합니다.','对不起迟到了。'],
    ['네','ne','是','네, 맞아요.','是,对的。'],
    ['아니요','aniyo','不','아니요, 괜찮아요.','不,没关系。'],
    ['이름','ireum','名字','이름이 뭐예요?','叫什么名字?'],
  ]},
  'ko-t1-u1-g': {items:[
    {q:'저는 학생___.', opts:['이에요','예요','이예','여요'], a:0, explain:'학생有收音,用 이에요。'},
    {q:'저는 리밍___.', opts:['이에요','예요','이예','예'], a:1, explain:'밍无收音,用 예요。'},
  ]},
  'ko-t1-u2-v': {words:[
    ['하나','hana','一','하나 주세요.','请给我一个。'],
    ['둘','dul','二','둘 다 있어요.','两个都有。'],
    ['돈','don','钱','돈이 없어요.','没钱了。'],
    ['오늘','oneul','今天','오늘 무슨 요일이에요?','今天星期几?'],
    ['내일','naeil','明天','내일 만나요.','明天见。'],
    ['시간','sigan','时间','시간이 없어요.','没时间了。'],
  ]},
  'ko-t1-u2-l': {items:[
    {t:'지금 몇 시예요?', m:'现在几点了?'},
    {t:'내일 세 시에 만나요.', m:'明天三点见。'},
    {t:'오늘은 월요일이에요.', m:'今天是星期一。'},
  ]},
  /* ---------- Korean TOPIK II ---------- */
  'ko-t2-u1-v': {words:[
    ['주문','jumun','点餐','주문하겠습니다.','我要点餐了。'],
    ['값','gap','价格','값이 비싸요.','价格贵。'],
    ['카드','kadeu','卡','카드로 계산해요.','刷卡结账。'],
    ['사이즈','saijeu','尺码','사이즈가 안 맞아요.','尺码不合适。'],
    ['맛있는','masinneun','美味的','맛있는 음식.','美味的食物。'],
    ['포장','pojang','打包','포장해 주세요.','请帮我打包。'],
  ]},
  'ko-t2-u1-g': {items:[
    {q:'커피 마시___.', opts:['고 싶어요','가 싶어요','고 싶다','고 싶은'], a:0, explain:'-고 싶어요 表示想做。'},
    {q:'밥을 먹___.', opts:['고 싶어요','가 싶어요','고 싶어','고 싶다'], a:0, explain:'먹고 싶어요 想吃。'},
  ]},
  'ko-t2-u2-v': {words:[
    ['여행','yeohaeng','旅行','여행 가요.','去旅行。'],
    ['비행기','bihaenggi','飞机','비행기로 가요.','坐飞机去。'],
    ['예약','yeyak','预约','호텔 예약했어요.','预订好了酒店。'],
    ['공항','gonghang','机场','공항에 가요.','去机场。'],
    ['계획','gyehoek','计划','계획 있어요.','有计划。'],
    ['사진','sajin','照片','사진 찍어요.','拍照。'],
  ]},
  'ko-t2-u2-s': {items:[
    {t:'여행 계획 세웠어요?', m:'制定旅行计划了吗?'},
    {t:'제주도 여행 갈 거예요.', m:'要去济州岛旅行。'},
    {t:'비행기 표 예약했어요.', m:'订了机票。'},
  ]},
  /* ---------- Korean TOPIK III ---------- */
  'ko-t3-u1-v': {words:[
    ['정치','jeongchi','政治','정치 이슈.','政治话题。'],
    ['경제','gyeongje','经济','경제가 좋아져요.','经济变好。'],
    ['사회','sahoe','社会','사회 문제.','社会问题。'],
    ['언론','eollon','媒体','언론 보도.','媒体报道。'],
    ['선거','seongeo','选举','대통령 선거.','总统选举。'],
    ['법률','beomnyul','法律','법률 개정.','法律修订。'],
  ]},
  'ko-t3-u1-g': {items:[
    {q:'비가 오___ 나가지 않겠어요.', opts:['므로','거나','으니까','아/어서'], a:2, explain:'-으니까 表理由 因为下雨。'},
    {q:'시간이 없___ 빨리 가자.', opts:['으니까','거든','아서','어서'], a:0, explain:'-으니까 表理由。'},
  ]},
  'ko-t3-u2-v': {words:[
    ['문화','munhwa','文化','한국 문화.','韩国文化。'],
    ['예술','yesul','艺术','예술 영화.','艺术电影。'],
    ['전시회','jeonsihoe','展览','미술 전시회.','美术展。'],
    ['음악','eumak','音乐','클래식 음악.','古典音乐。'],
    ['영화','yeonghwa','电影','영화를 봐요.','看电影。'],
    ['문학','munhak','文学','한국 문학.','韩国文学。'],
  ]},
  'ko-t3-u2-l': {items:[
    {t:'한국 문화에 대한 이해가 깊어졌어요.', m:'对韩国文化的理解加深了。'},
    {t:'미술 전시회가 내일부터 시작됩니다.', m:'美术展明天开始。'},
    {t:'그 영화는 국제 영화제에서 수상했어요.', m:'这部电影在国际电影节获奖了。'},
  ]},
};
