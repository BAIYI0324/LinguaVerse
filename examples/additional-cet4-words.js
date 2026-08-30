/**
 * 📚 CET-4 扩展词库示例(20 条补充分词)
 * 用法: 在 v2/js/data.js 的 COURSES.en.cet4[0].lessons[0]
 *       对应的 words 数组末尾展开这些条目即可。
 * 格式: [词, 音标, 释义, 词根助记, [[例句, 译文, 标签], ...]]
 */
const EXTRA_CET4_WORDS = [
  ['capacity',     '/kəˈpæsəti/',   'n. 容量;能力;才能',    'cap(抓住)+acity → 能抓住的(量)', [
    ['The factory has a production capacity of 200 units a day.', '这家工厂日产量为 200 台。', '真题'],
    ['She has the capacity for great kindness.', '她有能力付出极大的善意。', '日常'],
  ]],
  ['complex',      '/kəmˈpleks/',   'adj. 复杂的; n. 综合体', 'com(一起)+plex(折叠)→叠在一起', [
    ['The problem is more complex than we thought.', '问题比我们想得更复杂。', '真题'],
  ]],
  ['conclude',     '/kənˈkluːd/',   'v. 得出结论;结束',      'con(全部)+clude(关闭)→全部关闭→结束', [
    ['We conclude that the plan is feasible.', '我们得出结论:该方案可行。', '真题'],
    ['She concluded her speech with a famous quote.', '她用一句名言结束了演讲。', '日常'],
  ]],
  ['considerable', '/kənˈsɪdərəbl/', 'adj. 相当大的;值得考虑的', 'consider(考虑)+able → 值得考虑的', [
    ['A considerable amount of money was spent.', '花了相当大一笔钱。', '真题'],
  ]],
  ['constitute',   '/ˈkɒnstɪtjuːt/', 'v. 构成;组成;设立',      'con(一起)+stitute(站立)→站在一起→构成', [
    ['Women constitute nearly half of the workforce.', '女性几乎占劳动力的一半。', '真题'],
  ]],
  ['contemporary', '/kənˈtemprəri/', 'adj. 当代的;同时代的 n. 同代人', 'con+tempor(时间)+ary → 同时间的', [
    ['Contemporary art is very different from traditional art.', '当代艺术与传统艺术截然不同。', '真题'],
  ]],
  ['contract',     '/ˈkɒntrækt/',    'n. 合同; v. 收缩;订合同', 'con+tract(拉)→拉到一起', [
    ['He signed a three-year contract with the company.', '他与公司签了 3 年合同。', '日常'],
    ['Metal contracts as it cools.', '金属冷却时会收缩。', '真题'],
  ]],
  ['convince',     '/kənˈvɪns/',     'v. 使确信;说服',          'con+vinc(征服)→彻底征服(对方疑虑)', [
    ['I convinced him that it was the right thing to do.', '我使他相信这是正确的做法。', '真题'],
  ]],
  ['crucial',      '/ˈkruːʃl/',      'adj. 至关重要的;关键的',   'cruc(十字)+ial → 十字路口的→关键', [
    ['This is a crucial moment in our history.', '这是我们历史上的关键时刻。', '真题'],
  ]],
  ['decline',      '/dɪˈklaɪn/',     'v./n. 下降;衰退;婉拒',     'de(向下)+cline(倾斜)→向下倾斜', [
    ['Sales declined by 10% last year.', '去年销售额下降 10%。', '真题'],
    ['I declined the invitation because of work.', '因工作原因我婉拒了邀请。', '日常'],
  ]],
  ['define',       '/dɪˈfaɪn/',      'v. 下定义;限定;明确',      'de(加强)+fine(边界)→划出边界', [
    ['How do you define success?', '你如何定义成功?', '日常'],
    ['The law clearly defines the rights of citizens.', '法律明确界定了公民的权利。', '真题'],
  ]],
  ['depress',      '/dɪˈpres/',      'v. 使沮丧;使萧条;压低',     'de(向下)+press(压)→向下压', [
    ['Wet weather always depresses me.', '阴雨天总让我情绪低落。', '日常'],
    ['The recession depressed the whole industry.', '经济衰退使整个行业不景气。', '真题'],
  ]],
  ['derive',       '/dɪˈraɪv/',      'v. 得到;源自;推导',        'de(向下)+rive(河)→从河流来→源自', [
    ['Many English words derive from Latin.', '许多英语单词源自拉丁语。', '真题'],
  ]],
  ['desperate',    '/ˈdespərət/',    'adj. 绝望的;不顾一切的',    'de(去掉)+sper(希望)+ate → 没希望', [
    ['The prisoners were desperate to escape.', '囚犯们不顾一切想逃跑。', '真题'],
  ]],
  ['diminish',     '/dɪˈmɪnɪʃ/',     'v. 减少;降低;贬低',         'di(向下)+mini(小)+ish → 变小', [
    ['His influence has diminished over time.', '他的影响力随着时间减弱。', '真题'],
  ]],
  ['distinct',     '/dɪˈstɪŋkt/',    'adj. 明显不同的;清晰的',     'di(分开)+stinct(刺)→刺分开的', [
    ['There are two distinct approaches to this problem.', '这个问题有两种截然不同的方法。', '真题'],
  ]],
  ['dominant',     '/ˈdɒmɪnənt/',    'adj. 占优势的;支配的',       'domin(主人)+ant → 主人般的', [
    ['English is the dominant language in the IT industry.', '英语是 IT 行业的主导语言。', '真题'],
  ]],
  ['dramatic',     '/drəˈmætɪk/',    'adj. 戏剧性的;急剧的',       'drama(戏剧)+tic', [
    ['There has been a dramatic increase in sales.', '销售额有了戏剧性的增长。', '真题'],
  ]],
  ['efficiency',   '/ɪˈfɪʃnsi/',     'n. 效率;效能',             'ef(出)+fic(做)+iency → 做出来的结果', [
    ['New technology improves the efficiency of production.', '新技术提高了生产效率。', '真题'],
  ]],
  ['eliminate',    '/ɪˈlɪmɪneɪt/',   'v. 消除;排除;淘汰',         'e(出)+limin(门槛)+ate → 赶出门槛', [
    ['Credit cards eliminate the need to carry a lot of cash.', '信用卡免去了携带大量现金的需要。', '真题'],
  ]],
];
console.log(`✅ EXTRA_CET4_WORDS 生成,共 ${EXTRA_CET4_WORDS.length} 条`);
