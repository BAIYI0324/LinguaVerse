#!/usr/bin/env bash
# 发布前校验: 关键文件是否齐全, JS 语法, JSON 合法
set -e
REPO="$(cd "$(dirname "$0")/.."; pwd)"; cd "$REPO"
FAIL=0
check() { if eval "$1" >/dev/null 2>&1; then echo "✅ $2"; else echo "❌ $2"; FAIL=1; fi; }

echo "== 关键文件存在性 ==";
check 'test -f README.md'               '顶层 README.md'
check 'test -f LICENSE'                 'LICENSE (MIT)'
check 'test -f CHANGELOG.md'            'CHANGELOG.md'
check 'test -f v2/index.html'           'v2/index.html'
check 'test -f v2/js/app.js'            'v2/js/app.js'
check 'test -f v2/js/data.js'           'v2/js/data.js'
check 'test -f v2/css/styles.css'       'v2/css/styles.css'
check 'test -f v2/manifest.json'        'v2/manifest.json (PWA)'
check 'test -f v2/sw.js'                'v2/sw.js (Service Worker)'
check 'test -f v1/js/app.js'            'v1 版本完整'
check 'test -f android/build.sh'        '安卓构建脚本'
check 'test -f android/AndroidManifest.xml' 'AndroidManifest'
check 'test -f android/java/com/yujie/app/MainActivity.java' 'WebView 外壳 Java'
check 'test -f docs/ARCHITECTURE.md'    'ARCHITECTURE.md'
check 'test -f docs/CONTRIBUTING.md'    'CONTRIBUTING.md'
check 'test -f docs/FAQ.md'             'FAQ.md'
check 'test -f docs/ROADMAP.md'         'ROADMAP.md'
check 'test -f docs/SECURITY.md'        'SECURITY.md'
check 'test -f .github/workflows/ci.yml' 'CI workflow'
check 'test -f .gitignore'              '.gitignore'
check 'test -f package.json'            'package.json'
check 'test -f Makefile'                'Makefile'

echo; echo "== JS 语法 ==";
for f in v2/js/app.js v2/js/data.js v1/js/app.js v1/js/data.js; do
  if node --check "$f"; then echo "✅ $f syntax OK"; else echo "❌ $f syntax FAIL"; FAIL=1; fi
done

echo; echo "== JSON / YAML 合法性 ==";
for f in package.json v2/manifest.json examples/sample-user-export.json; do
  if node -e "JSON.parse(require('fs').readFileSync('$f'))" 2>/dev/null; then
    echo "✅ $f JSON valid"; else echo "❌ $f JSON INVALID"; FAIL=1; fi
done
if grep -q "^cff-version:" CITATION.cff 2>/dev/null; then echo "✅ CITATION.cff YAML valid";
else echo "❌ CITATION.cff invalid"; FAIL=1; fi

echo; echo "== APK 是否存在 (android 目录内) ==";
check 'ls android/*.apk >/dev/null 2>&1' 'APK 预构建产物'

echo; [ $FAIL -eq 0 ] && echo "🎉 全部通过 ✨" || { echo "💥 有 $FAIL 项失败"; exit 1; }
