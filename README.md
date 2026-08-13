# decode_action 安全修复版 🛡️

> 基于 [smallfawn/decode_action](https://github.com/smallfawn/decode_action) 的深度审计修复版

## 📌 修复内容

| 等级 | 修复项 | 说明 |
|---|---|---|
| **P0-1** | 🔒 eval.js 沙箱隔离 | 原生 eval → isolated-vm 沙箱，杜绝 RCE 风险 |
| **P0-2** | 🔄 CI 防自触发 | 工作流检测无变更时跳过提交，避免 Actions 死循环 |
| P1-1 | 🧹 移除魔法字符串 | 删除 `smEcV` 硬编码特征，不再误跳过 |
| P1-2 | 🛡️ 空引用守卫 | 死对象不再导致解密管道崩溃 |
| P1-3 | 🔧 参数解析加固 | 命令行参数越界修复 + 文件存在性校验 |
| P1-4 | 🐍 Python 异常守卫 | `find()` 替代 `index()`，全链路 None 保护 |
| P2-1 | 📦 依赖清理 | 移除有 CVE 的 vm2，分离 devDependencies |

## 🚀 快速使用

1. fork 本仓库
2. 把待解密的脚本放入 `input.js`（或 `input.py`）
3. 开启 GitHub Actions（或手动触发 workflow）
4. 等待约 60s，在 `output.js`（或 `output.py`）获取解密结果

```bash
# 本地使用
npm ci
npm run decode
```

## 🧩 支持的加密类型

| 加密类型 | 说明 |
|---|---|
| sojson v6 | 源 jsjiami.v6 |
| sojson v7 | 源 jsjiami.v7 |
| obfuscator | 市面上通用混淆 |
| awsc | 阿里云混淆 |
| jjencode | 源 jjencode |
| jsconfuser | jsconfuser 混淆 |
| common | 通用解密（zlib/bz2/lzma） |

## 📋 项目结构

```
.
├── .github/workflows/decode.yml   # CI 工作流（修复版）
├── src/
│   ├── main.js                      # 入口（修复版）
│   ├── decode.py                    # Python 解密（修复版）
│   ├── plugin/
│   │   ├── eval.js                  # 沙箱解包（修复版）
│   │   ├── common.js
│   │   ├── jjencode.js
│   │   ├── sojson.js / sojsonv7.js
│   │   ├── obfuscator.js
│   │   ├── awsc.js
│   │   └── jsconfuser.js
│   └── visitor/                    # AST 访问者
│       ├── parse-control-flow-storage.js  #（修复版）
│       └── ...
├── patches/
│   ├── apply-fixes.sh              # 一键应用补丁脚本
│   └── PR_DESCRIPTION.md           # 原 PR 描述文档
├── input.js / output.js            # 输入/输出
└── package.json                    # 依赖（修复版）
```

## 📜 许可证

MIT
