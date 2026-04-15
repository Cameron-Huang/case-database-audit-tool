// scripts/4_batch_integrate.mjs
// 功能：批量集成审核后的项目到新数据库版本

import fs from "fs";
import path from "path";
import { readCsv, writeCsv, ensureDir } from "../utils/csv_utils.js";
import { CONFIG, getPath } from "../config/paths.config.js";

const argv = process.argv.slice(2);

function parseArgs() {
  let auditFile = argv[0];
  let indexFile = argv[1];
  let outputDatabase = argv[2];
  
  let auditPath, indexPath, outputDir;
  
  // 解析审核文件
  if (!auditFile) {
    auditFile = getPath("audit");
  }
  auditPath = auditFile;
  
  if (!fs.existsSync(auditPath)) {
    console.error(`❌ 审核清单文件不存在: ${auditPath}`);
    process.exit(1);
  }
  
  // 解析索引文件
  if (!indexFile) {
    indexFile = getPath("index");
  }
  indexPath = indexFile;
  
  if (!fs.existsSync(indexPath)) {
    console.error(`❌ 项目索引文件不存在: ${indexPath}`);
    process.exit(1);
  }
  
  // 输出数据库
  if (!outputDatabase) {
    outputDatabase = "case_database_22_audited";
  }
  
  outputDir = path.join(CONFIG.BASE_DIR, outputDatabase);
  
  return { auditPath, indexPath, outputDir, outputDatabase };
}

function copyDirectory(src, dst) {
  ensureDir(dst);
  
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, dstPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

function batchIntegrate(auditPath, indexPath, outputDir, outputDatabase) {
  console.log(`\n📖 读取审核结果: ${auditPath}`);
  const auditRows = readCsv(auditPath);
  
  console.log(`📖 读取项目索引: ${indexPath}`);
  const indexRows = readCsv(indexPath);
  
  console.log(`\n🎯 批量集成审核后的项目`);
  console.log(`📁 输出数据库: ${outputDir}`);
  console.log(`📊 处理项目数: ${auditRows.length}\n`);
  
  // 将索引转换为Map便于查找
  const projectMap = new Map(indexRows.map(row => [row.project_name, row]));
  
  // 创建输出目录结构
  const structureDirs = [
    path.join(outputDir, "00_entry"),
    path.join(outputDir, "01_cases_by_volume"),
    path.join(outputDir, "02_indexes"),
    path.join(outputDir, "03_pending_pools"),
  ];
  
  for (const dir of structureDirs) {
    ensureDir(dir);
  }
  
  // 统计信息
  let copied = 0;
  let skipped = 0;
  let errors = 0;
  const copyLog = [];
  
  for (const auditRow of auditRows) {
    const projectName = auditRow.项目名称;
    const projectCard = projectMap.get(projectName);
    
    if (!projectCard) {
      console.log(`⏭️  跳过: ${projectName} (项目未找到)`);
      skipped++;
      copyLog.push({
        序号: copied + skipped + errors + 1,
        项目名称: projectName,
        状态: "SKIP",
        原因: "项目未找到",
      });
      continue;
    }
    
    // 只复制已通过或已修改的项目
    if (auditRow.整体状态 !== "通过" && auditRow.整体状态 !== "需修改") {
      console.log(`⏭️  跳过: ${projectName} (状态: ${auditRow.整体状态 || '未审核'})`);
      skipped++;
      copyLog.push({
        序号: copied + skipped + errors + 1,
        项目名称: projectName,
        状态: "SKIP",
        原因: `状态: ${auditRow.整体状态 || '未审核'}`,
      });
      continue;
    }
    
    try {
      const sourcePath = projectCard.database_folder;
      const volumeType = projectCard.volume_type || "综合其他";
      const spaceBucket = projectCard.space_bucket || "其他";
      const destPath = path.join(
        outputDir,
        "01_cases_by_volume",
        volumeType,
        spaceBucket,
        projectName
      );
      
      // 复制项目文件夹
      copyDirectory(sourcePath, destPath);
      
      console.log(`✅ 已集成: ${projectName}`);
      copied++;
      copyLog.push({
        序号: copied + skipped + errors,
        项目名称: projectName,
        状态: "SUCCESS",
        原因: "已复制到新数据库",
      });
    } catch (error) {
      console.error(`❌ 错误: ${projectName} - ${error.message}`);
      errors++;
      copyLog.push({
        序号: copied + skipped + errors,
        项目名称: projectName,
        状态: "ERROR",
        原因: error.message,
      });
    }
  }
  
  // 生成新的总索引
  console.log(`\n📊 生成新数据库索引...`);
  
  const newIndexRows = [];
  
  for (const auditRow of auditRows) {
    if (auditRow.整体状态 === "通过" || auditRow.整体状态 === "需修改") {
      const projectCard = projectMap.get(auditRow.项目名称);
      if (projectCard) {
        newIndexRows.push({
          ...projectCard,
          audit_status: auditRow.整体状态,
          audit_notes: auditRow.备注,
          audit_date: new Date().toISOString().split('T')[0],
        });
      }
    }
  }
  
  const indexFieldnames = [
    "review_id", "project_name", "volume_type", "space_bucket", "case_mode",
    "final_status", "source_stage", "source_root", "database_folder", "word_file",
    "draft_file", "visual_index", "evidence_index", "proposal_index",
    "audit_status", "audit_notes", "audit_date"
  ];
  
  const newIndexPath = path.join(outputDir, "02_indexes", "case_database_index.csv");
  writeCsv(newIndexPath, newIndexRows, indexFieldnames);
  
  // 生成README
  const readmePath = path.join(outputDir, "00_entry", "README.md");
  const readmeContent = `# ${outputDatabase} 数据库

本数据库包含所有已审核通过的案例项目。

## 统计信息

- 总项目数: ${auditRows.length}
- 已集成: ${copied}
- 已跳过: ${skipped}
- 错误: ${errors}

## 数据库结构

\`\`\`
${outputDatabase}/
├── 00_entry/         - 入口文件和说明
├── 01_cases_by_volume/ - 按分册和子类组织的案例
├── 02_indexes/       - 数据库索引
└── 03_pending_pools/ - 待处理队列
\`\`\`

## 下一步

运行以下命令生成Word文档：
\`\`\`bash
node scripts/generate_word_documents.mjs "${newIndexPath}"
\`\`\`

生成日期: ${new Date().toISOString()}
`;
  
  fs.writeFileSync(readmePath, readmeContent, "utf8");
  
  // 保存集成日志
  const logPath = path.join(outputDir, "03_pending_pools", "integration_log.csv");
  const logFieldnames = ["序号", "项目名称", "状态", "原因"];
  writeCsv(logPath, copyLog, logFieldnames);
  
  console.log(`
✅ 批量集成完成！

📊 统计：
   ✅ 已集成: ${copied} 个
   ⏭️  已跳过: ${skipped} 个
   ❌ 错误: ${errors} 个

📁 输出位置: ${outputDir}
📋 新索引: ${newIndexPath}
📝 集成日志: ${logPath}

✨ 新数据库已生成！

下一步建议：
1. 检查输出目录结构
2. 验证所有项目都已正确复制
3. 运行其他构建脚本生成最终文档
  `);
}

const { auditPath, indexPath, outputDir, outputDatabase } = parseArgs();
batchIntegrate(auditPath, indexPath, outputDir, outputDatabase);
