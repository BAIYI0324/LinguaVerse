#!/usr/bin/env node
/**
 * 生成 样例学习数据 JSON(用于 导入导出功能的测试)
 * 输出: examples/sample-user-export.json
 * 用法: node scripts/export-sample-data.js
 */
const fs = require('fs');
const path = require('path');

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => {
  const dt = new Date(d); dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const sample = {
  users: [{
    id: 'u_demo_001',
    name: '示例用户',
    avatar: '🦊',
    lang: 'en',
    level: 'cet4',
    dailyGoal: 20,
    ttsRate: 1,
    xp: 1680,
    badges: ['join','first-deck','streak-3','vocab-50','grammar-5','first-review'],
    srs: {
      'en-c4-u1-v': {
        'contribute': {box:4, due: addDays(today(), 7),  reps: 5, seen: true},
        'boost':      {box:3, due: addDays(today(), 4),  reps: 4, seen: true},
        'eliminate':  {box:2, due: addDays(today(), 2),  reps: 3, seen: true},
        'abandon':    {box:1, due: today(),               reps: 2, seen: true},
        'adapt':      {box:5, due: addDays(today(), 15), reps: 6, seen: true},
        'assess':     {box:0, due: today(),               reps: 1, seen: true},
      }
    },
    lessons: {
      'en-c4-u1-v': {done:true, score:82, xp:34, at: Date.now() - 86400000},
      'en-c4-u1-g': {done:true, score:100, xp:30, at: Date.now() - 86400000},
    },
    stats: {decks:8, words:56, reviews:120, grammar:5, listen:3, speak:2},
    createdAt: Date.now() - 86400000 * 12,
    lastStudyDate: today(),
    streak: 5,
  }],
  session: 'u_demo_001',
  exportedAt: new Date().toISOString(),
  appVersion: '2.0.1',
};

const out = path.resolve(__dirname, '..', 'examples', 'sample-user-export.json');
fs.mkdirSync(path.dirname(out), {recursive:true});
fs.writeFileSync(out, JSON.stringify(sample, null, 2), 'utf8');
console.log('✅ 示例导出文件:', out, '(' + fs.statSync(out).size + ' B)');
