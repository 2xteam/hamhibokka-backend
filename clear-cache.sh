#!/bin/bash

echo "🧹 서버 캐시 정리 중..."

# NestJS 서버 프로세스 종료
echo "📴 서버 프로세스 종료 중..."
pkill -f "nest start" 2>/dev/null || true
pkill -f "npm run start:dev" 2>/dev/null || true
pkill -f "node.*dist/main" 2>/dev/null || true

# 잠시 대기
sleep 2

# dist 폴더 삭제
echo "🗑️  dist 폴더 삭제 중..."
rm -rf dist/

# node_modules 삭제 (선택적)
read -p "node_modules도 삭제하시겠습니까? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  node_modules 삭제 중..."
    rm -rf node_modules/
    echo "📦 npm install 실행 중..."
    npm install
fi

# npm 캐시 정리
echo "🧹 npm 캐시 정리 중..."
npm cache clean --force

# TypeScript 캐시 정리
echo "🧹 TypeScript 캐시 정리 중..."
rm -rf .tsbuildinfo 2>/dev/null || true

# 로그 파일 정리
echo "🧹 로그 파일 정리 중..."
find . -name "*.log" -delete 2>/dev/null || true

echo "✅ 캐시 정리 완료!"
echo "🚀 서버를 다시 시작하려면: npm run start:dev" 