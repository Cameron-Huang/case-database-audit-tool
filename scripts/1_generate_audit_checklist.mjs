// scripts/1_generate_audit_checklist.mjs
// 功能：从项目索引生成审核清单

import fs from "fs";
import path from "path";
import { readCsv, writeCsv, ensureDir } from "../utils/csv_utils.js";
import { CONFIG, getPath } from "../config/paths.config.js";

const argv = process.argv.slice(2);

function parseArgs() {
  let inputPath = argv[0];
  let outputPath = argv[1] || getPath("audit");
  
  if (!inputPath) {
    console.error(`
❌ 错误：缺少输入文件路径

使用方法：
  node scripts/1_generate_audit_checklist.mjs <项目索引CSV文件路径> [输出文件路径]

示例：
  node scripts/1_generate_audit_checklist.mjs "D:\\AI\\project\\0409\\case_database_21_batch11_expanded\\02_indexes\\case_database_index.csv"

  node scripts/1_generate_audit_checklist.mjs "D:\\AI\\project\\0409\\case_database_21_batch11_expanded\\02_indexes\\case_database_index.csv" "D:\\AI\\project\\0409\\my_checklist.csv"
    `);
    process.exit(1);
  }
  
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ 文件不存在：${inputPath}`);
    process.exit(1);
  }
  
  return { inputPath, outputPath };
}

function generateAuditRow(projectCard, index) {
  return {
    序号: index,
    项目名称: projectCard.project_name || "",
    分册类型: projectCard.volume_type || "",
    子类: projectCard.space_bucket || "",
    当前状态: projectCard.final_status || "",
    源项目路径: projectCard.source_root || "",
    
    // ========== 发现问题 ==========
    问题_自动提取: projectCard.problem || "",
    问题_来源: projectCard.problemSourceFile || "",
    问题_置信度: projectCard.problemConfidence || 0,
    问题_人工审核结果: "",
    问题_修改建议: "",
    问题_最终确认: "",
    
    // ========== 项目难点 ==========
    难点_自动提取: projectCard.challenge || "",
    难点_来源: projectCard.challengeSourceFile || "",
    难点_置信度: projectCard.challengeConfidence || 0,
    难点_人工审核结果: "",
    难点_修改建议: "",
    难点_最终确认: "",
    
    // ========== 解决方式 ==========
    方案_自动提取: projectCard.solution || "",
    方案_来源: projectCard.solutionSourceFile || "",
    方案_置信度: projectCard.solutionConfidence || 0,
    方案_人工审核结果: "",
    方案_修改建议: "",
    方案_最终确认: "",
    
    // ========== 结果与价值 ==========
    结果_自动提取: projectCard.result || "",
    结果_来源: projectCard.resultSourceFile || "",
    结果_置信度: projectCard.resultConfidence || 0,
    结果_人工审核结果: "",
    结果_修改建议: "",
    结果_最终确认: "",
    
    // ========== 图片 ==========
    图片_检测到的前期: projectCard.visualsBefore || "",
    图片_前期_置信度: projectCard.visualsBeforeConfidence || 0,
    图片_前期_人工审核: "",
    图片_前期_替换建议: "",
    
    图片_检测到的后期: projectCard.visualsAfter || "",
    图片_后期_置信度: projectCard.visualsAfterConfidence || 0,
    图片_后期_人工审核: "",
    图片_后期_替换建议: "",
    
    // ========== 汇总 ==========
    整体状态: "",
    备注: "",
  };
}

function generateChecklist(inputPath, outputPath) {
  console.log(`\n📖 读取项目索引: ${inputPath}`);
  
  try {
    const indexRows = readCsv(inputPath);
    console.log(`✅ 成功读取 ${indexRows.length} 个项目`);
    
    if (indexRows.length === 0) {
      console.error("❌ 项目索引为空");
      process.exit(1);
    }
    
    // 按置信度排序（低置信度优先审核）
    const sortedRows = indexRows.map(row => {
      const avgConfidence = (
        parseFloat(row.problemConfidence || 0) +
        parseFloat(row.challengeConfidence || 0) +
        parseFloat(row.solutionConfidence || 0) +
        parseFloat(row.resultConfidence || 0)
      ) / 4;
      return { ...row, avgConfidence };
    }).sort((a, b) => a.avgConfidence - b.avgConfidence);
    
    // 生成审核行
    console.log(`📝 生成审核清单...`);
    const checklistRows = sortedRows.map((row, idx) => 
      generateAuditRow(row, idx + 1)
    );
    
    const fieldnames = [
      "序号", "项目名称", "分册类型", "子类", "当前状态", "源项目路径",
      "问题_自动提取", "问题_来源", "问题_置信度", "问题_人工审核结果", "问题_修改建议", "问题_最终确认",
      "难点_自动提取", "难点_来源", "难点_置信度", "难点_人工审核结果", "难点_修改建议", "难点_最终确认",
      "方案_自动提取", "方案_来源", "方案_置信度", "方案_人工审核结果", "方案_修改建议", "方案_最终确认",
      "结果_自动提取", "结果_来源", "结果_置信度", "结果_人工审核结果", "结果_修改建议", "结果_最终确认",
      "图片_检测到的前期", "图片_前期_置信度", "图片_前期_人工审核", "图片_前期_替换建议",
      "图片_检测到的后期", "图片_后期_置信度", "图片_后期_人工审核", "图片_后期_替换建议",
      "整体状态", "备注",
    ];
    
    // 确保输出目录存在
    ensureDir(path.dirname(outputPath));
    
    // 写入CSV
    writeCsv(outputPath, checklistRows, fieldnames);
    
    // 统计信息
    const stats = {
      总项目数: checklistRows.length,
      高置信度: sortedRows.filter(r => r.avgConfidence > 70).length,
      中置信度: sortedRows.filter(r => r.avgConfidence >= 50 && r.avgConfidence <= 70).length,
      低置信度: sortedRows.filter(r => r.avgConfidence < 50).length,
    };
    
    console.log(`
✅ 审核清单已生成！

📁 文件位置: ${outputPath}

📊 统计信息：
   ✅ 总项目数: ${stats.总项目数}
   🟢 高置信度 (>70%): ${stats.高置信度} 个 - 可快速通过
   🟡 中置信度 (50-70%): ${stats.中置信度} 个 - 需要仔细审核
   🔴 低置信度 (<50%): ${stats.低置信度} 个 - 优先审核这些

📋 下一步：
   1. 用 WPS Office 或 Excel 打开文件
   2. 从第一行开始逐行检查
   3. 如果自动提取的文案对，填"对"；不对填"不对"
   4. 如果需要改，在修改建议列填 "把XXX改为YYY"
   5. 在最终确认列填"确认"或"已修改"
   6. 保存文件
   7. 运行：node scripts/2_apply_audit_changes.mjs
    `);
    
  } catch (error) {
    console.error(`\n❌ 错误: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

const { inputPath, outputPath } = parseArgs();
generateChecklist(inputPath, outputPath);
