// scripts/2_apply_audit_changes.mjs
// 功能：根据审核结果应用修改

import fs from "fs";
import path from "path";
import { readCsv, writeCsv, ensureDir } from "../utils/csv_utils.js";
import { CONFIG, getPath } from "../config/paths.config.js";

const argv = process.argv.slice(2);

function parseArgs() {
  let auditPath = argv[0];
  let indexPath = argv[1];
  
  if (!auditPath || !indexPath) {
    console.error(`
❌ 错误：缺少必要的参数

使用方法：
  node scripts/2_apply_audit_changes.mjs <审核清单CSV> <项目索引CSV>

示例：
  node scripts/2_apply_audit_changes.mjs "D:\\AI\\project\\0409\\00_audit_checklist.csv" "D:\\AI\\project\\0409\\case_database_21_batch11_expanded\\02_indexes\\case_database_index.csv"
    `);
    process.exit(1);
  }
  
  if (!fs.existsSync(auditPath)) {
    console.error(`❌ 审核清单文件不存在：${auditPath}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(indexPath)) {
    console.error(`❌ 项目索引文件不存在：${indexPath}`);
    process.exit(1);
  }
  
  return { auditPath, indexPath };
}

function parseDiffSuggestion(suggestion) {
  /**
   * 解析 "把XXX改为YYY" 格式的建议
   * 返回: { original: "XXX", replacement: "YYY" }
   */
  
  if (!suggestion || suggestion.trim() === "") {
    return null;
  }
  
  const match = suggestion.match(/把\s*(.+?)\s*改为\s*(.+?)(?:\s*[。，；]|$)/);
  if (!match) {
    return null;
  }
  
  return {
    original: match[1].trim(),
    replacement: match[2].trim(),
  };
}

function applyDiff(originalText, diff) {
  /**
   * 应用差异修改
   */
  
  if (!diff || !originalText) {
    return originalText;
  }
  
  return originalText.replace(diff.original, diff.replacement);
}

function generateUpdatedMarkdown(auditRow, projectCard) {
  /**
   * 根据审核行生成更新后的Markdown
   */
  
  // 解析修改建议
  const problemDiff = parseDiffSuggestion(auditRow.问题_修改建议);
  const challengeDiff = parseDiffSuggestion(auditRow.难点_修改建议);
  const solutionDiff = parseDiffSuggestion(auditRow.方案_修改建议);
  const resultDiff = parseDiffSuggestion(auditRow.结果_修改建议);
  
  // 应用修改
  const problem = problemDiff ? 
    applyDiff(auditRow.问题_自动提取, problemDiff) : 
    auditRow.问题_自动提取;
  
  const challenge = challengeDiff ? 
    applyDiff(auditRow.难点_自动提取, challengeDiff) : 
    auditRow.难点_自动提取;
  
  const solution = solutionDiff ? 
    applyDiff(auditRow.方案_自动提取, solutionDiff) : 
    auditRow.方案_自动提取;
  
  const result = resultDiff ? 
    applyDiff(auditRow.结果_自动提取, resultDiff) : 
    auditRow.结果_自动提取;
  
  const markdown = [
    `# ${auditRow.项目名称}`,
    "",
    "## 基本信息",
    `- 分册类型：${auditRow.分册类型}`,
    `- 子类归档：${auditRow.子类}`,
    `- 当前状态：${auditRow.当前状态}`,
    `- 审核状态：${auditRow.整体状态 || "待审核"}`,
    "",
    "## 发现问题",
    problem,
    "",
    "## 项目难点",
    challenge,
    "",
    "## 我们的解决方式",
    solution,
    "",
    "## 结果与可讲述价值",
    result,
    "",
    "---",
    "",
    "### 审核备注",
    auditRow.备注 || "无",
    "",
  ].join("\n");
  
  return markdown;
}

function updateDraftFile(draftPath, markdown) {
  try {
    ensureDir(path.dirname(draftPath));
    fs.writeFileSync(draftPath, "\ufeff" + markdown, "utf8");
    return true;
  } catch (error) {
    console.error(`  ❌ 更新失败: ${error.message}`);
    return false;
  }
}

function applyAuditChanges(auditPath, indexPath) {
  console.log(`\n📖 读取审核清单: ${auditPath}`);
  const auditRows = readCsv(auditPath);
  
  console.log(`📖 读取项目索引: ${indexPath}`);
  const indexRows = readCsv(indexPath);
  
  const projectMap = new Map(indexRows.map(row => [row.project_name, row]));
  
  console.log(`\n🔄 开始应用修改（共 ${auditRows.length} 个项目）\n`);
  
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  const updateLog = [];
  
  for (const auditRow of auditRows) {
    const projectName = auditRow.项目名称;
    const projectCard = projectMap.get(projectName);
    
    if (!projectCard) {
      console.log(`⏭️  跳过：${projectName}（项目未找到）`);
      skipped++;
      updateLog.push({
        序号: updated + skipped + errors + 1,
        项目名称: projectName,
        状态: "SKIP",
        原因: "项目未找到",
      });
      continue;
    }
    
    // 检查是否需要更新
    const needsUpdate = 
      auditRow.问题_修改建议 ||
      auditRow.难点_修改建议 ||
      auditRow.方案_修改建议 ||
      auditRow.结果_修改建议 ||
      auditRow.整体状态 === "通过";
    
    if (!needsUpdate && auditRow.整体状态 !== "通过") {
      console.log(`⏭️  跳过：${projectName}（未进行修改）`);
      skipped++;
      updateLog.push({
        序号: updated + skipped + errors + 1,
        项目名称: projectName,
        状态: "SKIP",
        原因: "未进行修改",
      });
      continue;
    }
    
    try {
      // 生成新的Markdown
      const newMarkdown = generateUpdatedMarkdown(auditRow, projectCard);
      
      // 获取draft文件路径（从projectCard中）
      let draftPath = projectCard.draft_file;
      
      if (!draftPath) {
        // 如果draft_file为空，根据database_folder推断
        draftPath = path.join(projectCard.database_folder, "draft.md");
      }
      
      // 更新draft.md
      if (updateDraftFile(draftPath, newMarkdown)) {
        console.log(`✅ 已更新：${projectName}`);
        updated++;
        updateLog.push({
          序号: updated + skipped + errors,
          项目名称: projectName,
          状态: "SUCCESS",
          原因: "已更新draft.md",
        });
      } else {
        errors++;
        updateLog.push({
          序号: updated + skipped + errors,
          项目名称: projectName,
          状态: "ERROR",
          原因: "draft.md更新失败",
        });
      }
    } catch (error) {
      console.error(`❌ 错误：${projectName} - ${error.message}`);
      errors++;
      updateLog.push({
        序号: updated + skipped + errors,
        项目名称: projectName,
        状态: "ERROR",
        原因: error.message,
      });
    }
  }
  
  // 保存更新日志
  const reportPath = path.join(path.dirname(auditPath), "update_report.csv");
  const reportFieldnames = ["序号", "项目名称", "状态", "原因"];
  writeCsv(reportPath, updateLog, reportFieldnames);
  
  console.log(`
✅ 修改应用完成！

📊 统计：
   ✅ 已更新：${updated} 个
   ⏭️  已跳过：${skipped} 个
   ❌ 错误：${errors} 个

📁 详细报告：${reportPath}

✨ 所有项目已更新，可以继续进行其他流程！
  `);
}

const { auditPath, indexPath } = parseArgs();
applyAuditChanges(auditPath, indexPath);
