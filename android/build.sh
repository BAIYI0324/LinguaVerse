#!/usr/bin/env bash
# 语界 LinguaVerse · APK 直编脚本
# 依赖: Android SDK (build-tools 34.0.0 + platforms/android-34), JDK 17+
set -e
cd "$(dirname "$0")"

SDK=/opt/android-sdk
BT=$SDK/build-tools/36.0.0
PLATFORM=$SDK/platforms/android-34/android.jar

echo "[1/6] aapt2 compile 资源..."
$BT/aapt2 compile --dir res -o build/res.zip

echo "[2/6] aapt2 link 生成基础APK..."
$BT/aapt2 link -o build/base.apk \
  --manifest AndroidManifest.xml \
  -I "$PLATFORM" \
  --min-sdk-version 24 --target-sdk-version 34 \
  --version-code 7 --version-name 5.1.0 \
  -A assets \
  build/res.zip

echo "[3/6] javac 编译..."
mkdir -p build/classes
javac --release 8 -classpath "$PLATFORM" -d build/classes \
  $(find java -name '*.java')

echo "[4/6] d8 转DEX..."
jar cf build/classes.jar -C build/classes .
$BT/d8 --release --min-api 24 --lib "$PLATFORM" \
  build/classes.jar \
  --output build/

echo "[5/6] 打包 + 对齐..."
cd build
cp base.apk unsigned.apk
zip -qj unsigned.apk classes.dex
$BT/zipalign -f 4 unsigned.apk aligned.apk

echo "[6/6] apksigner 签名..."
cd ..
$BT/apksigner sign --ks yujie.keystore \
  --ks-pass pass:yujie2026 --key-pass pass:yujie2026 \
  --out LinguaVerse-v5.1.0.apk build/aligned.apk
$BT/apksigner verify LinguaVerse-v5.1.0.apk && echo "OK"
ls -lh LinguaVerse-v5.1.0.apk
