import fs from 'fs';
import { fileURLToPath } from 'url';
import * as path from 'path';
import process from 'process';

// Dynamically import ESM modules
const commonModule = await import('./plugin/common.js');
const jjencodeModule = await import('./plugin/jjencode.js');
const sojsonModule = await import('./plugin/sojson.js');
const sojsonv7Module = await import('./plugin/sojsonv7.js');
const obfuscatorModule = await import('./plugin/obfuscator.js');
const awscModule = await import('./plugin/awsc.js');
const jsconfuserModule = await import('./plugin/jsconfuser.js');

// Provide default exports if necessary
const PluginCommon = commonModule.default || commonModule;
const PluginJjencode = jjencodeModule.default || jjencodeModule;
const PluginSojson = sojsonModule.default || sojsonModule;
const PluginSojsonV7 = sojsonv7Module.default || sojsonv7Module;
const PluginObfuscator = obfuscatorModule.default || obfuscatorModule;
const PluginAwsc = awscModule.default || awscModule;
const PluginJsconfuser = jsconfuserModule.default || jsconfuserModule;

// 修复 P1-1/P1-3：健壮的命令行参数解析 + 移除 smEcV 魔法字符串
let encodeFile = 'input.js';
let decodeFile = 'output.js';

const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '-i' && args[i + 1]) {
    encodeFile = args[++i];
  } else if (args[i] === '-o' && args[i + 1]) {
    decodeFile = args[++i];
  } else {
    console.error(`未知参数: ${args[i]}`);
    process.exit(1);
  }
}

// 输入文件存在性前置校验
if (!fs.existsSync(encodeFile)) {
  console.error(`输入文件不存在: ${encodeFile}`);
  process.exit(1);
}

console.log(`输入: ${encodeFile}`);
console.log(`输出: ${decodeFile}`);

// Read source code
const sourceCode = fs.readFileSync(encodeFile, { encoding: 'utf-8' });

let processedCode = sourceCode;
let pluginUsed = '';
let time;

// Try plugins in sequence until the processed code differs from the original
const plugins = [
  { name: 'obfuscator', plugin: PluginObfuscator },
  { name: 'sojsonv7', plugin: PluginSojsonV7 },
  { name: 'sojson', plugin: PluginSojson },
  { name: 'jsconfuser', plugin: PluginJsconfuser },
  { name: 'awsc', plugin: PluginAwsc },
  { name: 'jjencode', plugin: PluginJjencode },
  { name: 'common', plugin: PluginCommon }, // Use common plugin last
];

for (const plugin of plugins) {
  try {
    const code = plugin.plugin(sourceCode);
    if (code && code !== sourceCode) {
      processedCode = code;
      pluginUsed = plugin.name;
      break;
    }
  } catch (error) {
    console.error(`插件 ${plugin.name} 处理时发生错误: ${error.message}`);
  }
}

// Check if processed code differs from source code
if (processedCode !== sourceCode) {
  time = new Date();
  const header = [
    `//${time}`,
    '//Base: https://github.com/echo094/decode-js',
    '//Modify: https://github.com/smallfawn/decode_action',
  ].join('\n');

  // Combine header and processed code
  const outputCode = header + '\n' + processedCode;

  // Write to file
  fs.writeFile(decodeFile, outputCode, (err) => {
    if (err) {
      throw err;
    } else {
      console.log(`使用插件 ${pluginUsed} 成功处理并写入文件 ${decodeFile}`);
    }
  });
} else {
  console.log('所有插件处理后的代码与原代码一致，未写入文件。');
}