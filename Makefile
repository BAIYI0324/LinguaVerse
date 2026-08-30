# 语界 LinguaVerse · 常用快捷命令
.PHONY: help dev dev-v1 lint verify apk clean

help: ## 显示所有目标
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev: ## 在 8080 端口启动 v2 版本 (当前主版)
	python3 -m http.server 8080 --directory ./v2

dev-v1: ## 在 8081 端口启动 v1 版本 (历史快照)
	python3 -m http.server 8081 --directory ./v1

lint: ## 对所有 JS 文件执行语法检查
	node --check ./v2/js/app.js
	node --check ./v2/js/data.js
	node --check ./v1/js/app.js
	node --check ./v1/js/data.js
	@echo "✅ 所有 JS 文件语法通过"

verify: lint ## 校验所有关键产物存在
	test -f ./v2/index.html
	test -f ./v2/manifest.json
	test -f ./v2/sw.js
	test -f ./android/build.sh
	test -f ./android/AndroidManifest.xml
	@echo "✅ 所有关键产物存在"

apk: ## 重新构建安卓 APK (需要 Android SDK build-tools 36+, JDK 17+)
	bash ./android/build.sh
	@echo "✅ APK 构建完成,输出: android/语界-LinguaVerse-v3.0.apk"

clean: ## 清理 android/build 临时产物
	rm -rf ./android/build
	@echo "✅ 临时构建目录已删除"
