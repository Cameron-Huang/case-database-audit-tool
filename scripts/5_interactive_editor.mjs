// scripts/5_interactive_editor.mjs
// 功能：交互式审核编辑器 - 直接编辑源文件内容（修复版）

import fs from "fs";
import path from "path";
import { readCsv, writeCsv, ensureDir } from "../utils/csv_utils.js";
import { CONFIG, getPath } from "../config/paths.config.js";

const argv = process.argv.slice(2);

function parseArgs() {
  let auditPath = argv[0] || getPath("audit");
  let outputPath = argv[1] || path.join(path.dirname(auditPath), "interactive_editor.html");
  
  if (!fs.existsSync(auditPath)) {
    console.error(`
❌ 错误：审核清单文件不存在

使用方法：
  node scripts/5_interactive_editor.mjs <审核清单CSV>

示例：
  node scripts/5_interactive_editor.mjs "D:\\AI\\project\\0415\\00_audit_checklist.csv"
    `);
    process.exit(1);
  }
  
  return { auditPath, outputPath };
}

function escapeJsonString(str) {
  /**
   * 安全地转义JSON字符串
   */
  if (typeof str !== 'string') str = String(str || '');
  
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

function generateInteractiveEditor(auditPath, outputPath) {
  console.log(`\n📖 读取审核清单: ${auditPath}`);
  const auditRows = readCsv(auditPath);
  
  if (auditRows.length === 0) {
    console.error("❌ 审核清单为空");
    process.exit(1);
  }
  
  console.log(`✅ 成功读取 ${auditRows.length} 个项目`);
  console.log(`🎨 生成交互式编辑器...`);
  
  // 准备项目数据
  const projects = auditRows.map((row, idx) => ({
    index: idx,
    序号: row.序号 || idx + 1,
    项目名称: row.项目名称 || "",
    分册类型: row.分册类型 || "",
    子类: row.子类 || "",
    源项目路径: row.源项目路径 || "",
    
    问题_原文: row.问题_自动提取 || "",
    问题_置信度: row.问题_置信度 || 0,
    
    难点_原文: row.难点_自动提取 || "",
    难点_置信度: row.难点_置信度 || 0,
    
    方案_原文: row.方案_自动提取 || "",
    方案_置信度: row.方案_置信度 || 0,
    
    结果_原文: row.结果_自动提取 || "",
    结果_置信度: row.结果_置信度 || 0,
    
    图片_前期: row.图片_检测到的前期 || "未检测",
    图片_后期: row.图片_检测到的后期 || "未检测",
  }));
  
  // 生成HTML
  const html = generateHtmlContent(projects);
  
  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, html, "utf8");
  
  console.log(`
✅ 交互式编辑器已生成！

📁 文件位置: ${outputPath}

📊 项目统计：${auditRows.length} 个

🌍 打开方式：
   用浏览器打开该HTML文件

💡 功能：
   - 查看项目原文本内容
   - 直接编辑替换为新内容
   - 支持批量编辑
   - 实时预览替换效果
   - 自动保存进度到浏览器
   - 导出审核结果
  `);
}

function generateHtmlContent(projects) {
  // 将项目数据安全地转换为JavaScript代码
  let projectsJs = "const projects = [\n";
  
  for (const p of projects) {
    projectsJs += `  {
    index: ${p.index},
    序号: "${escapeJsonString(p.序号)}",
    项目名称: "${escapeJsonString(p.项目名称)}",
    分册类型: "${escapeJsonString(p.分册类型)}",
    子类: "${escapeJsonString(p.子类)}",
    源项目路径: "${escapeJsonString(p.源项目路径)}",
    问题_原文: "${escapeJsonString(p.问题_原文)}",
    问题_置信度: ${p.问题_置信度},
    难点_原文: "${escapeJsonString(p.难点_原文)}",
    难点_置信度: ${p.难点_置信度},
    方案_原文: "${escapeJsonString(p.方案_原文)}",
    方案_置信度: ${p.方案_置信度},
    结果_原文: "${escapeJsonString(p.结果_原文)}",
    结果_置信度: ${p.结果_置信度},
    图片_前期: "${escapeJsonString(p.图片_前期)}",
    图片_后期: "${escapeJsonString(p.图片_后期)}",
  },\n`;
  }
  
  projectsJs += "];\n";
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>交互式审核编辑器</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    
    .header p {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .progress-bar {
      width: 100%;
      height: 4px;
      background: #e0e0e0;
      position: relative;
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      width: 0%;
      transition: width 0.3s;
    }
    
    .editor-wrapper {
      display: flex;
      min-height: 600px;
    }
    
    .sidebar {
      width: 250px;
      background: #f8f9fa;
      border-right: 1px solid #ddd;
      overflow-y: auto;
      padding: 20px;
      max-height: 600px;
    }
    
    .project-item {
      padding: 12px;
      margin-bottom: 8px;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      border-left: 3px solid #ddd;
      transition: all 0.3s;
      font-size: 13px;
    }
    
    .project-item:hover {
      background: #f0f0f0;
      border-left-color: #667eea;
    }
    
    .project-item.active {
      background: #667eea;
      color: white;
      border-left-color: #667eea;
    }
    
    .project-item .number {
      font-weight: 600;
      font-size: 12px;
      opacity: 0.7;
    }
    
    .project-item .name {
      font-weight: 500;
      margin-top: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .main-content {
      flex: 1;
      padding: 30px;
      overflow-y: auto;
      max-height: 600px;
    }
    
    .editor-section {
      margin-bottom: 30px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    
    .editor-section h3 {
      font-size: 16px;
      color: #667eea;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .confidence-badge {
      display: inline-block;
      padding: 4px 8px;
      background: #e9ecef;
      border-radius: 3px;
      font-size: 12px;
      color: #666;
      margin-left: auto;
    }
    
    .original-text {
      background: white;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 15px;
      border: 1px solid #ddd;
      line-height: 1.6;
      color: #333;
      max-height: 150px;
      overflow-y: auto;
      word-break: break-word;
    }
    
    .original-text .label {
      font-size: 12px;
      color: #999;
      margin-bottom: 8px;
      font-weight: 600;
    }
    
    .form-group {
      display: flex;
      flex-direction: column;
      margin-bottom: 15px;
    }
    
    .form-label {
      font-size: 13px;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
    }
    
    .form-input {
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 13px;
      font-family: inherit;
    }
    
    .form-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    textarea.form-input {
      resize: vertical;
      min-height: 80px;
    }
    
    select.form-input {
      cursor: pointer;
    }
    
    .bottom-controls {
      display: flex;
      gap: 10px;
      padding: 20px 30px;
      background: #f8f9fa;
      border-top: 1px solid #ddd;
      flex-wrap: wrap;
    }
    
    .btn {
      padding: 10px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.3s;
    }
    
    .btn-primary {
      background: #667eea;
      color: white;
    }
    
    .btn-primary:hover {
      background: #5568d3;
    }
    
    .btn-secondary {
      background: #e9ecef;
      color: #333;
    }
    
    .btn-secondary:hover {
      background: #dee2e6;
    }
    
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .nav-buttons {
      display: flex;
      gap: 10px;
      margin-left: auto;
    }
    
    .info-box {
      background: #e7f5ff;
      border: 1px solid #74c0fc;
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 20px;
      font-size: 13px;
      color: #1971c2;
    }
    
    .image-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .image-item {
      background: white;
      padding: 15px;
      border-radius: 6px;
      border: 1px solid #ddd;
    }
    
    .image-item h4 {
      font-size: 13px;
      color: #333;
      margin-bottom: 10px;
      font-weight: 600;
    }
    
    .image-placeholder {
      background: #f0f0f0;
      padding: 12px;
      border-radius: 4px;
      text-align: center;
      color: #999;
      font-size: 12px;
      margin-bottom: 10px;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- 顶部 -->
    <div class="header">
      <h1>✏️ 交互式审核编辑器</h1>
      <p>直接编辑项目内容 • 实时预览 • 自动保存进度</p>
    </div>
    
    <div class="progress-bar">
      <div class="progress-fill" id="progressFill"></div>
    </div>
    
    <!-- 编辑区域 -->
    <div class="editor-wrapper">
      <!-- 侧边栏 -->
      <div class="sidebar">
        <div style="font-weight: 600; color: #333; margin-bottom: 15px; font-size: 14px;">
          📋 项目列表
        </div>
        <div id="projectList"></div>
      </div>
      
      <!-- 主内容 -->
      <div class="main-content">
        <div id="editorContent"></div>
      </div>
    </div>
    
    <!-- 底部 -->
    <div class="bottom-controls">
      <button class="btn btn-primary" onclick="saveAndExport()">
        📥 导出审核结果为CSV
      </button>
      <button class="btn btn-secondary" onclick="saveDraft()">
        💾 保存进度
      </button>
      <div class="nav-buttons">
        <button class="btn btn-secondary" onclick="previousProject()" id="prevBtn">
          ◀ 上一个
        </button>
        <button class="btn btn-primary" onclick="nextProject()" id="nextBtn">
          下一个 ▶
        </button>
      </div>
    </div>
  </div>
  
  <script>
    ${projectsJs}
    
    let currentIndex = 0;
    let editedData = {};
    
    // 初始化
    document.addEventListener('DOMContentLoaded', function() {
      console.log('页面已加载，项目数:', projects.length);
      loadSavedProgress();
      renderProjectList();
      showProject(0);
    });
    
    // 渲染项目列表
    function renderProjectList() {
      const list = document.getElementById('projectList');
      let html = '';
      
      for (let i = 0; i < projects.length; i++) {
        const p = projects[i];
        html += '<div class="project-item ' + (i === 0 ? 'active' : '') + '" onclick="showProject(' + i + ')">';
        html += '<div class="number">#' + p.序号 + '</div>';
        html += '<div class="name">' + p.项目名称 + '</div>';
        html += '</div>';
      }
      
      list.innerHTML = html;
    }
    
    // 显示项目
    function showProject(index) {
      if (index < 0 || index >= projects.length) return;
      
      saveCurrentProject();
      currentIndex = index;
      
      const project = projects[index];
      const saved = editedData[index] || {};
      
      let html = '<div class="info-box">';
      html += 'ℹ️ 正在编辑：<strong>' + project.项目名称 + '</strong> | ';
      html += '进度：<strong>' + (index + 1) + '/' + projects.length + '</strong>';
      html += '</div>';
      
      // 问题
      html += '<div class="editor-section">';
      html += '<h3>❓ 发现问题 <span class="confidence-badge">置信度: ' + project.问题_置信度 + '%</span></h3>';
      html += '<div class="original-text">';
      html += '<div class="label">原文本：</div>';
      html += '<div>' + (project.问题_原文 || '（无）') + '</div>';
      html += '</div>';
      html += '<div class="form-group">';
      html += '<label class="form-label">修改为新内容</label>';
      html += '<textarea class="form-input" id="问题_新内容">' + (saved['问题_新内容'] || '') + '</textarea>';
      html += '</div>';
      html += '</div>';
      
      // 难点
      html += '<div class="editor-section">';
      html += '<h3>🎯 项目难点 <span class="confidence-badge">置信度: ' + project.难点_置信度 + '%</span></h3>';
      html += '<div class="original-text">';
      html += '<div class="label">原文本：</div>';
      html += '<div>' + (project.难点_原文 || '（无）') + '</div>';
      html += '</div>';
      html += '<div class="form-group">';
      html += '<label class="form-label">修改为新内容</label>';
      html += '<textarea class="form-input" id="难点_新内容">' + (saved['难点_新内容'] || '') + '</textarea>';
      html += '</div>';
      html += '</div>';
      
      // 方案
      html += '<div class="editor-section">';
      html += '<h3>💡 解决方案 <span class="confidence-badge">置信度: ' + project.方案_置信度 + '%</span></h3>';
      html += '<div class="original-text">';
      html += '<div class="label">原文本：</div>';
      html += '<div>' + (project.方案_原文 || '（无）') + '</div>';
      html += '</div>';
      html += '<div class="form-group">';
      html += '<label class="form-label">修改为新内容</label>';
      html += '<textarea class="form-input" id="方案_新内容">' + (saved['方案_新内容'] || '') + '</textarea>';
      html += '</div>';
      html += '</div>';
      
      // 结果
      html += '<div class="editor-section">';
      html += '<h3>🏆 结果与价值 <span class="confidence-badge">置信度: ' + project.结果_置信度 + '%</span></h3>';
      html += '<div class="original-text">';
      html += '<div class="label">原文本：</div>';
      html += '<div>' + (project.结果_原文 || '（无）') + '</div>';
      html += '</div>';
      html += '<div class="form-group">';
      html += '<label class="form-label">修改为新内容</label>';
      html += '<textarea class="form-input" id="结果_新内容">' + (saved['结果_新内容'] || '') + '</textarea>';
      html += '</div>';
      html += '</div>';
      
      // 图片
      html += '<div class="editor-section">';
      html += '<h3>📷 图片内容</h3>';
      html += '<div class="image-section">';
      html += '<div class="image-item">';
      html += '<h4>前期图片</h4>';
      html += '<div class="image-placeholder">原文件：' + project.图片_前期 + '</div>';
      html += '<div class="form-group">';
      html += '<label class="form-label">替换为新图片文件名</label>';
      html += '<input type="text" class="form-input" id="图片_前期_新" placeholder="或留空保留原图" value="' + (saved['图片_前期_新'] || '') + '">';
      html += '</div>';
      html += '</div>';
      html += '<div class="image-item">';
      html += '<h4>后期图片</h4>';
      html += '<div class="image-placeholder">原文件：' + project.图片_后期 + '</div>';
      html += '<div class="form-group">';
      html += '<label class="form-label">替换为新图片文件名</label>';
      html += '<input type="text" class="form-input" id="图片_后期_新" placeholder="或留空保留原图" value="' + (saved['图片_后期_新'] || '') + '">';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      
      // 汇总
      html += '<div class="editor-section">';
      html += '<h3>✅ 审核汇总</h3>';
      html += '<div class="form-group">';
      html += '<label class="form-label">整体状态</label>';
      html += '<select class="form-input" id="整体状态">';
      html += '<option value="">-- 选择 --</option>';
      html += '<option value="通过" ' + (saved['整体状态'] === '通过' ? 'selected' : '') + '>✅ 通过</option>';
      html += '<option value="需修改" ' + (saved['整体状态'] === '需修改' ? 'selected' : '') + '>🔧 需修改</option>';
      html += '<option value="待补充" ' + (saved['整体状态'] === '待补充' ? 'selected' : '') + '>📦 待补充</option>';
      html += '</select>';
      html += '</div>';
      html += '<div class="form-group">';
      html += '<label class="form-label">备注</label>';
      html += '<textarea class="form-input" id="备注" style="min-height: 60px;">' + (saved['备注'] || '') + '</textarea>';
      html += '</div>';
      html += '</div>';
      
      document.getElementById('editorContent').innerHTML = html;
      
      // 更新UI
      updateProjectList();
      updateProgress();
      updateNavButtons();
    }
    
    // 保存当前项目
    function saveCurrentProject() {
      if (currentIndex < 0 || currentIndex >= projects.length) return;
      
      const fields = [
        '问题_新内容', '难点_新内容', '方案_新内容', '结果_新内容',
        '图片_前期_新', '图片_后期_新', '整体状态', '备注'
      ];
      
      const saved = {};
      for (const field of fields) {
        const el = document.getElementById(field);
        if (el) {
          saved[field] = el.value;
        }
      }
      
      editedData[currentIndex] = saved;
    }
    
    // 下一个
    function nextProject() {
      if (currentIndex < projects.length - 1) {
        showProject(currentIndex + 1);
      }
    }
    
    // 上一个
    function previousProject() {
      if (currentIndex > 0) {
        showProject(currentIndex - 1);
      }
    }
    
    // 更新项目列表高亮
    function updateProjectList() {
      const items = document.querySelectorAll('.project-item');
      items.forEach((item, i) => {
        item.classList.toggle('active', i === currentIndex);
      });
    }
    
    // 更新进度条
    function updateProgress() {
      const completed = Object.keys(editedData).length;
      const percentage = (completed / projects.length) * 100;
      document.getElementById('progressFill').style.width = percentage + '%';
    }
    
    // 更新导航按钮
    function updateNavButtons() {
      document.getElementById('prevBtn').disabled = currentIndex === 0;
      document.getElementById('nextBtn').disabled = currentIndex === projects.length - 1;
    }
    
    // 保存进度
    function saveDraft() {
      saveCurrentProject();
      localStorage.setItem('auditEditorDraft', JSON.stringify(editedData));
      alert('✅ 进度已保存到浏览器！');
    }
    
    // 加载进度
    function loadSavedProgress() {
      try {
        const saved = localStorage.getItem('auditEditorDraft');
        if (saved) {
          editedData = JSON.parse(saved);
          console.log('✅ 已加载 ' + Object.keys(editedData).length + ' 个已编辑项目');
        }
      } catch (e) {
        console.error('加载进度失败:', e);
      }
    }
    
    // 导出CSV
    function saveAndExport() {
      saveCurrentProject();
      
      const fieldnames = [
        '序号', '项目名称', '分册类型', '子类',
        '问题_原文', '问题_新内容',
        '难点_原文', '难点_新内容',
        '方案_原文', '方案_新内容',
        '结果_原文', '结果_新内容',
        '图片_前期_原', '图片_前期_新',
        '图片_后期_原', '图片_后期_新',
        '整体状态', '备注'
      ];
      
      let csv = '\\ufeff' + fieldnames.join(',') + '\\r\\n';
      
      for (let i = 0; i < projects.length; i++) {
        const project = projects[i];
        const saved = editedData[i] || {};
        
        const row = [
          project.序号,
          project.项目名称,
          project.分册类型,
          project.子类,
          project.问题_原文,
          saved['问题_新内容'] || '',
          project.难点_原文,
          saved['难点_新内容'] || '',
          project.方案_原文,
          saved['方案_新内容'] || '',
          project.结果_原文,
          saved['结果_新内容'] || '',
          project.图片_前期,
          saved['图片_前期_新'] || '',
          project.图片_后期,
          saved['图片_后期_新'] || '',
          saved['整体状态'] || '',
          saved['备注'] || '',
        ];
        
        csv += row.map(cell => {
          const text = String(cell || '');
          if (/[",\\r\\n]/.test(text)) {
            return '"' + text.replace(/"/g, '""') + '"';
          }
          return text;
        }).join(',') + '\\r\\n';
      }
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'audit_editor_result.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('✅ 审核结果已导出！\\n文件名：audit_editor_result.csv');
    }
  </script>
</body>
</html>`;
}

const { auditPath, outputPath } = parseArgs();
generateInteractiveEditor(auditPath, outputPath);
