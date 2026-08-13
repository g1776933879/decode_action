/**
 * 解包/打包 eval 包裹的混淆代码
 * 使用 isolated-vm 沙箱执行，杜绝主进程 RCE 风险
 * 
 * 修复：P0-1 — 原生 eval → isolated-vm 隔离执行 + 超时控制
 */
import { parse } from '@babel/parser'
import _generate from '@babel/generator'
const generator = _generate.default
import _traverse from '@babel/traverse'
const traverse = _traverse.default
import * as t from '@babel/types'
import ivm from 'isolated-vm'

// 复用隔离上下文，减少创建开销
const isolate = new ivm.Isolate({ memoryLimit: 128 })
const context = isolate.createContextSync()

function unpack(code) {
  let ast = parse(code, { errorRecovery: true })
  let lines = ast.program.body
  let data = null
  for (let line of lines) {
    if (t.isEmptyStatement(line)) {
      continue
    }
    if (data) {
      return null
    }
    if (
      t.isCallExpression(line?.expression) &&
      line.expression.callee?.name === 'eval' &&
      line.expression.arguments.length === 1 &&
      t.isCallExpression(line.expression.arguments[0])
    ) {
      data = t.expressionStatement(line.expression.arguments[0])
      continue
    }
    return null
  }
  if (!data) {
    return null
  }
  const expr = generator(data, { minified: true }).code
  try {
    // 在隔离沙箱中执行，1秒超时，防止死循环/恶意代码
    return context.evalSync(expr, { timeout: 1000 })
  } catch (e) {
    console.error(`[eval-sandbox] 隔离执行失败: ${e.message}`)
    return null
  }
}

function pack(code) {
  let ast1 = parse('(function(){}())')
  let ast2 = parse(code)
  traverse(ast1, {
    FunctionExpression(path) {
      let body = t.blockStatement(ast2.program.body)
      path.replaceWith(t.functionExpression(null, [], body))
      path.stop()
    },
  })
  code = generator(ast1, { minified: false }).code
  return code
}

export default {
  unpack,
  pack,
}