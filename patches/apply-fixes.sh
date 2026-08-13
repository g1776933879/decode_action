#!/bin/bash
# ============================================================
# decode_action 安全修复一键应用脚本
# 使用方式：在仓库根目录执行 bash patches/apply-fixes.sh
# 
# 修复清单：
#   P0-1  eval.js       — 原生 eval → isolated-vm 沙箱隔离
#   P0-2  decode.yml    — 防 push 自触发死循环
#   P1-1  main.js       — 移除 smEcV 魔法字符串 + 健壮参数解析
#   P1-2  parse-control-flow-storage.js — 空引用崩溃修复
#   P1-3  main.js       — 命令行参数越界修复
#   P1-4  decode.py     — 异常输入全链路守卫
#   P2-1  package.json  — 移除 vm2 危险依赖 + 分离 devDeps
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FIXED_DIR="$SCRIPT_DIR/fixed"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "📦 decode_action 安全修复 v1.0"
echo "================================"
echo "目标目录: $ROOT_DIR"
echo "修复源目录: $FIXED_DIR"
echo ""

# 备份原始文件（创建 .bak）
backup_file() {
    local src="$1"
    if [ -f "$src" ]; then
        cp "$src" "${src}.bak"
        echo "  📄 备份: ${src}.bak"
    fi
}

# 应用修复
apply_fix() {
    local rel_path="$1"
    local target="$ROOT_DIR/$rel_path"
    local source="$FIXED_DIR/$rel_path"
    
    if [ ! -f "$source" ]; then
        echo "  ⚠️  源文件不存在: $source"
        return 1
    fi
    
    backup_file "$target"
    cp "$source" "$target"
    echo "  ✅ 已修复: $rel_path"
}

echo "🔧 开始应用修复..."
echo ""

# P0-1: eval.js 沙箱隔离
apply_fix "src/plugin/eval.js"

# P0-2: workflow 防自触发
apply_fix ".github/workflows/decode.yml"

# P1-1 + P1-3: main.js 修复
apply_fix "src/main.js"

# P1-2: parse-control-flow-storage.js 空引用修复
apply_fix "src/visitor/parse-control-flow-storage.js"

# P1-4: decode.py 异常守卫
apply_fix "src/decode.py"

# P2-1 + P2-2: package.json 清理
apply_fix "package.json"

echo ""
echo "🎉 所有修复已应用完毕！"
echo ""
echo "📋 后续操作："
echo "  1. 删除备份文件（确认无误后）：find . -name '*.bak' -delete"
echo "  2. 重新安装依赖：npm ci"
echo "  3. 提交与推送："
echo "     git add -A"
echo "     git commit -m 'fix: 安全修复与健壮性改进 (P0-1~P1-4)'"
echo "     git push"
echo ""
echo "📝 详细修复说明见：patches/PR_DESCRIPTION.md"