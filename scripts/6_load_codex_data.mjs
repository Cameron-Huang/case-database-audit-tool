// scripts/6_load_codex_data.mjs
// 功能：从Codex生成的数据库读取Word和JSON内容

import fs from "fs";
import path from "path";
import mammoth from "mammoth";

const argv = process.argv.slice(2);

async function loadProjectData(folderPath) {
  /**
   * 从项目文件夹读取所有数据
   * 
   * 期望的文件夹结构：
   * 项目文件夹/
   *   ├── project_card.json
   *   ├── draft.md
   *   ├── draft.docx (可选)
   *   ├── 海峡之声广场...技术核心直播室.docx (Word文件)
   *   └── selected_assets/
   *       ├── effect_01.jpg
   *       ├── before.jpg
   *       └── ...
   */
  
  console.log(`\n📂 加载项目数据...`);
  console.log(`📁 路径: ${folderPath}\n`);
  
  // 1. 读取 project_card.json
  console.log(`📖 读取项目信息 (project_card.json)...`);
  const cardPath = path.join(folderPath, 'project_card.json');
  
  if (!fs.existsSync(cardPath)) {
    console.error(`❌ 错误: 找不到 project_card.json`);
    console.error(`   路径: ${cardPath}`);
    return null;
  }
  
  let projectCard = {};
  try {
    const cardContent = fs.readFileSync(cardPath, 'utf8');
    projectCard = JSON.parse(cardContent);
    console.log(`✅ 项目名称: ${projectCard.project_name}`);
  } catch (e) {
    console.error(`❌ 无法读取 project_card.json: ${e.message}`);
    return null;
  }
  
  // 2. 读取 draft.md
  console.log(`\n📖 读取Markdown内容 (draft.md)...`);
  let draftMarkdown = "";
  const draftMdPath = path.join(folderPath, 'draft.md');
  
  if (fs.existsSync(draftMdPath)) {
    try {
      draftMarkdown = fs.readFileSync(draftMdPath, 'utf8');
      console.log(`✅ 已读取 draft.md (${draftMarkdown.length} 字符)`);
    } catch (e) {
      console.error(`⚠️ 无法读取 draft.md: ${e.message}`);
    }
  } else {
    console.warn(`⚠️ 找不到 draft.md`);
  }
  
  // 3. 查找并读取Word文件
  console.log(`\n📖 查找Word文件...`);
  let wordContent = "";
  let wordFilePath = "";
  
  // 获取Word文件路径 (从project_card.json中获取)
  if (projectCard.word_file) {
    wordFilePath = projectCard.word_file;
    if (!path.isAbsolute(wordFilePath)) {
      wordFilePath = path.join(folderPath, wordFilePath);
    }
  } else {
    // 如果没有在JSON中找到，自动查找Word文件
    console.log(`   正在扫描文件夹查找 .docx 文件...`);
    const files = fs.readdirSync(folderPath);
    const wordFile = files.find(f => f.endsWith('.docx') && !f.startsWith('~'));
    
    if (wordFile) {
      wordFilePath = path.join(folderPath, wordFile);
      console.log(`   找到: ${wordFile}`);
    }
  }
  
  if (wordFilePath && fs.existsSync(wordFilePath)) {
    try {
      console.log(`📄 读取Word文件: ${path.basename(wordFilePath)}...`);
      const arrayBuffer = fs.readFileSync(wordFilePath);
      const result = await mammoth.extractRawText({ arrayBuffer });
      wordContent = result.value;
      console.log(`✅ 已读取Word文件 (${wordContent.length} 字符)`);
    } catch (e) {
      console.error(`❌ 无法读取Word文件: ${e.message}`);
    }
  } else {
    console.warn(`⚠️ 找不到Word文件`);
  }
  
  // 4. 读取图片列表
  console.log(`\n📷 查找图片文件...`);
  let images = [];
  const assetsPath = path.join(folderPath, 'selected_assets');
  
  if (fs.existsSync(assetsPath)) {
    try {
      const files = fs.readdirSync(assetsPath);
      images = files.filter(f => /\\.(jpg|jpeg|png|gif|webp)$/i.test(f));
      console.log(`✅ 找到 ${images.length} 张图片`);
      images.forEach(img => console.log(`   - ${img}`));
    } catch (e) {
      console.warn(`⚠️ 无法读取图片文件夹: ${e.message}`);
    }
  } else {
    console.warn(`⚠️ 找不到 selected_assets 文件夹`);
  }
  
  // 5. 从Word提取结构化内容
  console.log(`\n🔍 解析Word内容...`);
  const sections = extractSections(wordContent);
  
  console.log(`✅ 已提取以下内容：`);
  console.log(`   - 问题/发现问题: ${sections.question ? '✓' : '✗'}`);
  console.log(`   - 难点: ${sections.difficulty ? '✓' : '✗'}`);
  console.log(`   - 方案/解决方案: ${sections.solution ? '✓' : '✗'}`);
  console.log(`   - 结果/结果与价值: ${sections.result ? '✓' : '✗'}`);
  
  // 返回完整数据
  return {
    projectCard,
    draftMarkdown,
    wordContent,
    sections,
    images,
    folderPath,
    wordFilePath
  };
}

function extractSections(text) {
  /**
   * 从Word文本中提取关键内容
   */
  
  const sections = {
    question: '',
    difficulty: '',
    solution: '',
    result: ''
  };
  
  const lines = text.split(/\\n+/);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 检测标题
    if (/^#+\\s*(发现|问题|Question)/i.test(line)) {
      sections.question = extractContent(lines, i);
    } else if (/^#+\\s*(难点|Difficulty)/i.test(line)) {
      sections.difficulty = extractContent(lines, i);
    } else if (/^#+\\s*(方案|解决|Solution)/i.test(line)) {
      sections.solution = extractContent(lines, i);
    } else if (/^#+\\s*(结果|价值|Result)/i.test(line)) {
      sections.result = extractContent(lines, i);
    }
  }
  
  return sections;
}

function extractContent(lines, startIndex) {
  /**
   * 从指定位置提取段落内容
   */
  
  const content = [];
  
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 遇到下一个标题就停止
    if (/^#+\\s/.test(line)) {
      break;
    }
    
    // 跳过空行
    if (!line) continue;
    
    // 限制长度
    if (content.join(' ').length > 1000) break;
    
    content.push(line);
  }
  
  return content.join(' ').substring(0, 500);
}

// 主程序
if (argv.length === 0) {
  console.log(\`
❌ 错误：需要指定项目文件夹路径

使用方法：
  node scripts/6_load_codex_data.mjs <项目文件夹路径>

示例：
  node scripts/6_load_codex_data.mjs "D:\\\\AI\\\\project\\\\0409\\\\case_database_21_batch11_expanded\\\\01_cases_by_volume\\\\广电搜体与播控空间\\\\直播室\\\\海峡之声广场技术核心直播室"

  \`);
  process.exit(1);
}

const folderPath = argv[0];

if (!fs.existsSync(folderPath)) {
  console.error(\`❌ 文件夹不存在: ${folderPath}\`);
  process.exit(1);
}

loadProjectData(folderPath)
  .then(data => {
    if (data) {
      console.log(\`
✅ 数据加载完成！

📊 数据摘要：
   项目: \${data.projectCard.project_name}
   Word内容: \${data.wordContent.length} 字符
   图片: \${data.images.length} 张
   问题: \${data.sections.question.substring(0, 50)}...
   难点: \${data.sections.difficulty.substring(0, 50)}...
   方案: \${data.sections.solution.substring(0, 50)}...
   结果: \${data.sections.result.substring(0, 50)}...
      \`);
    }
  })
  .catch(e => {
    console.error(\`❌ 错误: \${e.message}\`);
    process.exit(1);
  });
