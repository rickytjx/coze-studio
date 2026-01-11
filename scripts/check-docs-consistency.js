#!/usr/bin/env node
/**
 * 文档一致性检查脚本
 * 
 * 检查 docs/frontend-architecture/ 和 docs/frontend-deep-dive/ 目录下的 Markdown 文档
 * 
 * 检查项目：
 * 1. 禁用词检查 - 检测推测性措辞
 * 2. 代码块标注规范 - 检查摘录代码是否标注路径和行号
 * 3. 包数量一致性 - 验证文档中声明的包数量与实际一致
 * 4. 术语一致性 - 检查层级术语是否统一
 * 
 * 用法：
 *   node scripts/check-docs-consistency.js [--fix]
 * 
 * 选项：
 *   --fix  尝试自动修复部分问题（仅限术语统一）
 */

const fs = require('fs');
const path = require('path');

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.turbo', '.rush', 'coverage']);
const MAX_RECURSION_DEPTH = 20;

// ============================================================================
// 配置
// ============================================================================

const CONFIG = {
  // 要检查的文档目录
  docDirs: [
    'docs/frontend-architecture',
    'docs/frontend-deep-dive',
  ],
  
  // 禁用词列表（推测性措辞）
  forbiddenWords: [
    { pattern: /广泛使用/g, suggestion: '使用具体引用数或"使用于"' },
    { pattern: /数十个/g, suggestion: '使用具体数字 + 统计口径' },
    { pattern: /通常(?!来说)/g, suggestion: '使用具体条件或删除' },
    { pattern: /大多(?!数情况)/g, suggestion: '使用具体条件或删除' },
    { pattern: /大部分/g, suggestion: '使用具体数量或比例' },
    { pattern: /可能(?!性)/g, suggestion: '使用确定性表述或删除' },
    { pattern: /约\s*\d+/g, suggestion: '使用精确数字' },
    { pattern: /一般(?!来说|情况)/g, suggestion: '使用具体条件或删除' },
    { pattern: /往往/g, suggestion: '使用具体条件或删除' },
    { pattern: /100\+/g, suggestion: '使用精确统计数字' },
  ],
  
  // 标准术语映射（错误 -> 正确）
  terminologyFixes: {
    'Studio 核心业务层': 'Studio核心业务层',
    'Workflow Layer': 'Workflow Engine Layer',
  },
  
  // 标准层级术语
  standardTerminology: [
    '架构基础设施层',
    '通用组件层', 
    '基础服务层',
    'Studio核心业务层',
    '工作流引擎层',
    'Agent IDE层',
    '数据层',
  ],
  
  // 包数量声明模式
  packageCountPattern: /(\d+)\s*个包.*统计口径[：:]\s*[`']?([^`'\n]+)[`']?/g,
};

// ============================================================================
// 工具函数
// ============================================================================

function getAllMarkdownFiles(dirs) {
  const files = [];
  for (const dir of dirs) {
    const fullDir = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullDir)) continue;
    
    const entries = fs.readdirSync(fullDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(path.join(fullDir, entry.name));
      } else if (entry.isDirectory()) {
        const subDir = path.join(fullDir, entry.name);
        const subEntries = fs.readdirSync(subDir, { withFileTypes: true });
        for (const subEntry of subEntries) {
          if (subEntry.isFile() && subEntry.name.endsWith('.md')) {
            files.push(path.join(subDir, subEntry.name));
          }
        }
      }
    }
  }
  return files;
}

function getLineNumber(content, index) {
  return content.substring(0, index).split('\n').length;
}

const GLOB_SINGLE_LEVEL = /^(?<base>.+)\/\*\/package\.json$/;
const GLOB_RECURSIVE = /^(?<base>.+)\/\*\*\/package\.json$/;

function parseGlobPattern(pattern) {
  let match = pattern.match(GLOB_SINGLE_LEVEL);
  if (match) {
    return { base: match.groups.base, mode: 'single' };
  }
  
  match = pattern.match(GLOB_RECURSIVE);
  if (match) {
    return { base: match.groups.base, mode: 'recursive' };
  }
  
  return { base: null, mode: 'unsupported', error: `不支持的统计口径格式: "${pattern}"。仅支持 "path/*/package.json" 或 "path/**/package.json"` };
}

function countPackagesRecursive(dir, depth = 0) {
  if (depth > MAX_RECURSION_DEPTH) {
    return { count: 0, error: `递归深度超过 ${MAX_RECURSION_DEPTH} 层限制` };
  }
  
  let count = 0;
  let entries;
  
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return { count: 0, error: `无法读取目录: ${dir}` };
  }
  
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
    
    const subDir = path.join(dir, entry.name);
    
    try {
      const stat = fs.lstatSync(subDir);
      if (stat.isSymbolicLink()) continue;
    } catch (e) {
      continue;
    }
    
    const pkgPath = path.join(subDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      count++;
    }
    
    const result = countPackagesRecursive(subDir, depth + 1);
    if (result.error) {
      return result;
    }
    count += result.count;
  }
  
  return { count, error: null };
}

function countPackagesSingleLevel(dir) {
  let count = 0;
  let entries;
  
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return { count: -1, error: `无法读取目录: ${dir}` };
  }
  
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
    
    const pkgPath = path.join(dir, entry.name, 'package.json');
    if (fs.existsSync(pkgPath)) {
      count++;
    }
  }
  
  return { count, error: null };
}

function countPackages(globPattern) {
  const parsed = parseGlobPattern(globPattern);
  
  if (parsed.mode === 'unsupported') {
    return { count: -1, error: parsed.error };
  }
  
  const fullPath = path.join(process.cwd(), parsed.base);
  
  if (!fs.existsSync(fullPath)) {
    return { count: -1, error: `目录不存在: ${parsed.base}` };
  }
  
  if (parsed.mode === 'recursive') {
    return countPackagesRecursive(fullPath);
  }
  
  return countPackagesSingleLevel(fullPath);
}

// ============================================================================
// 检查器
// ============================================================================

class DocChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.fixes = [];
  }
  
  addError(file, line, message, suggestion = null) {
    this.errors.push({ file, line, message, suggestion });
  }
  
  addWarning(file, line, message) {
    this.warnings.push({ file, line, message });
  }
  
  addFix(file, oldText, newText) {
    this.fixes.push({ file, oldText, newText });
  }
  
  // 检查禁用词
  checkForbiddenWords(file, content) {
    for (const { pattern, suggestion } of CONFIG.forbiddenWords) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(content)) !== null) {
        const line = getLineNumber(content, match.index);
        this.addError(
          file,
          line,
          `禁用词 "${match[0]}"`,
          suggestion
        );
      }
    }
  }
  
  // 检查代码块标注
  checkCodeBlockAnnotations(file, content) {
    // 匹配代码块
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const blockStart = match.index;
      const line = getLineNumber(content, blockStart);
      const lang = match[1] || '';
      const code = match[2];
      
      // 检查是否是代码摘录（非示例代码）
      const beforeBlock = content.substring(Math.max(0, blockStart - 200), blockStart);
      const isExample = /\(示例代码\)|示例[：:]|\*\*示例\*\*|Example/i.test(beforeBlock);
      const isExcerpt = /摘录自|摘录自|来源[：:]/.test(beforeBlock);
      
      if (!isExample && (lang === 'typescript' || lang === 'tsx' || lang === 'ts' || lang === 'json')) {
        // 检查是否有路径标注
        const pathPattern = /\(摘录自\s*[`']?([^`'\)]+)[`']?\s*\)/;
        const pathMatch = beforeBlock.match(pathPattern);
        
        if (!pathMatch && !isExcerpt) {
          // 检查是否在示例代码段落内
          const paragraphBefore = content.substring(
            Math.max(0, blockStart - 500),
            blockStart
          );
          const isInExampleSection = /##.*示例|开发指南|命名规范/.test(paragraphBefore);
          
          if (!isInExampleSection) {
            this.addWarning(
              file,
              line,
              `代码块可能缺少路径标注 (摘录自 path:lines) 或 (示例代码) 标签`
            );
          }
        } else if (pathMatch) {
          // 验证路径格式
          const annotatedPath = pathMatch[1];
          if (!annotatedPath.startsWith('frontend/') && !annotatedPath.startsWith('backend/')) {
            this.addWarning(
              file,
              line,
              `路径应使用完整仓库相对路径，当前：${annotatedPath}`
            );
          }
        }
      }
    }
  }
  
  checkPackageCounts(file, content) {
    const pattern = /\|\s*包数量\s*\|\s*(\d+)\s*个包.*?[`']([^`']+)[`']/g;
    let match;
    
    while ((match = pattern.exec(content)) !== null) {
      const declaredCount = parseInt(match[1], 10);
      const globPattern = match[2];
      const line = getLineNumber(content, match.index);
      
      const result = countPackages(globPattern);
      
      if (result.error) {
        this.addError(
          file,
          line,
          `统计口径解析失败: ${result.error}`,
          '检查统计口径格式是否正确'
        );
        continue;
      }
      
      if (result.count !== declaredCount) {
        this.addError(
          file,
          line,
          `包数量不一致：文档声明 ${declaredCount}，实际 ${result.count}`,
          `将 ${declaredCount} 改为 ${result.count}`
        );
      }
    }
  }
  
  // 检查术语一致性
  checkTerminology(file, content, shouldFix = false) {
    for (const [wrong, correct] of Object.entries(CONFIG.terminologyFixes)) {
      if (content.includes(wrong)) {
        const line = getLineNumber(content, content.indexOf(wrong));
        this.addError(
          file,
          line,
          `术语不一致 "${wrong}"`,
          `应改为 "${correct}"`
        );
        
        if (shouldFix) {
          this.addFix(file, wrong, correct);
        }
      }
    }
  }
  
  // 运行所有检查
  checkFile(file, shouldFix = false) {
    const content = fs.readFileSync(file, 'utf-8');
    const relativePath = path.relative(process.cwd(), file);
    
    this.checkForbiddenWords(relativePath, content);
    this.checkCodeBlockAnnotations(relativePath, content);
    this.checkPackageCounts(relativePath, content);
    this.checkTerminology(relativePath, content, shouldFix);
  }
  
  // 应用修复
  applyFixes() {
    const fileGroups = {};
    for (const fix of this.fixes) {
      if (!fileGroups[fix.file]) {
        fileGroups[fix.file] = [];
      }
      fileGroups[fix.file].push(fix);
    }
    
    for (const [file, fixes] of Object.entries(fileGroups)) {
      const fullPath = path.join(process.cwd(), file);
      let content = fs.readFileSync(fullPath, 'utf-8');
      
      for (const fix of fixes) {
        content = content.split(fix.oldText).join(fix.newText);
      }
      
      fs.writeFileSync(fullPath, content, 'utf-8');
      console.log(`  ✓ 已修复: ${file}`);
    }
  }
  
  // 打印报告
  printReport() {
    console.log('\n' + '='.repeat(60));
    console.log('文档一致性检查报告');
    console.log('='.repeat(60) + '\n');
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ 所有检查通过！\n');
      return 0;
    }
    
    if (this.errors.length > 0) {
      console.log(`❌ 错误 (${this.errors.length}):\n`);
      for (const { file, line, message, suggestion } of this.errors) {
        console.log(`  ${file}:${line}`);
        console.log(`    ${message}`);
        if (suggestion) {
          console.log(`    → 建议: ${suggestion}`);
        }
        console.log();
      }
    }
    
    if (this.warnings.length > 0) {
      console.log(`⚠️  警告 (${this.warnings.length}):\n`);
      for (const { file, line, message } of this.warnings) {
        console.log(`  ${file}:${line}`);
        console.log(`    ${message}`);
        console.log();
      }
    }
    
    console.log('='.repeat(60));
    console.log(`总计: ${this.errors.length} 错误, ${this.warnings.length} 警告`);
    console.log('='.repeat(60) + '\n');
    
    return this.errors.length > 0 ? 1 : 0;
  }
}

// ============================================================================
// 主程序
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix');
  
  console.log('正在检查文档一致性...\n');
  
  const checker = new DocChecker();
  const files = getAllMarkdownFiles(CONFIG.docDirs);
  
  console.log(`找到 ${files.length} 个 Markdown 文件\n`);
  
  for (const file of files) {
    const relativePath = path.relative(process.cwd(), file);
    console.log(`  检查: ${relativePath}`);
    checker.checkFile(file, shouldFix);
  }
  
  if (shouldFix && checker.fixes.length > 0) {
    console.log('\n正在应用修复...\n');
    checker.applyFixes();
  }
  
  const exitCode = checker.printReport();
  process.exit(exitCode);
}

main();
