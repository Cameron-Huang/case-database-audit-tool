// scripts/5_interactive_editor.mjs
// 功能：交互式审核编辑器 - 直接编辑源文件内容

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
  node scripts/5_interactive_editor.mjs <审核清单CSV> [输出HTML路径]

示例：
  node scripts/5_interactive_editor.mjs "D:\\AI\\project\\0415\\00_audit_checklist.csv"
    `);
    process.exit(1);
  }
  
  return { auditPath, outputPath };
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
  
  // 读取每个项目的源文件
  const projectsWithContent = [];
  
  for (let i = 0; i < auditRows.length; i++) {
    const row = auditRows[i];
    const projectData = {
      index: i,
      序号: row.序号,
      项目名称: row.项目名称,
      分册类型: row.分册类型,
      子类: row.子类,
      源项目路径: row.源项目路径,
      
      // 问题
      问题_原文: row.问题_自动提取 || "",
      问题_置信度: row.问题_置信度 || 0,
      问题_修改建议: row.问题_修改建议 || "",
      问题_最终确认: row.问题_最终确认 || "",
      
      // 难点
      难点_原文: row.难点_自动提取 || "",
      难点_置信度: row.难点_置信度 || 0,
      难点_修改建议: row.难点_修改建议 || "",
      难点_最终确认: row.难点_最终确认 || "",
      
      // 方案
      方案_原文: row.方案_自动提取 || "",
      方案_置信度: row.方案_置信度 || 0,
      方案_修改建议: row.方案_修改建议 || "",
      方案_最终确认: row.方案_最终确认 || "",
      
      // 结果
      结果_原文: row.结果_自动提取 || "",
      结果_置信度: row.结果_置信度 || 0,
      结果_修改建议: row.结果_修改建议 || "",
      结果_最终确认: row.结果_最终确认 || "",
      
      // 图片
      图片_前期: row.图片_检测到的前期 || "未检测",
      图片_前期_替换: row.图片_前期_替换建议 || "",
      图片_后期: row.图片_检测到的后期 || "未检测",
      图片_后期_替换: row.图片_后期_替换建议 || "",
      
      // 汇总
      整体状态: row.整体状态 || "",
      备注: row.备注 || "",
    };
    
    projectsWithContent.push(projectData);
  }
  
  // 生成HTML
  const html = generateHtmlContent(projectsWithContent, auditPath);
  
  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, html, "utf8");
  
  console.log(`
✅ 交互式编辑器已生成！

📁 文件位置: ${outputPath}

📊 项目统计：${auditRows.length} 个

🌍 打开方式：
   用浏览器打开: ${outputPath}

💡 功能：
   - 查看项目原文本内容
   - 直接编辑替换为新内容
   - 可选：导航回源文件目录
   - 支持批量编辑
   - 实时预览替换效果
   - 自动保存进度到浏览器
   - 导出审核结果
  `);
}

function generateHtmlContent(projects, auditPath) {
  const projectsJson = JSON.stringify(projects);
  
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
      min-height: calc(100vh - 200px);
    }
    
    .sidebar {
      width: 250px;
      background: #f8f9fa;
      border-right: 1px solid #ddd;
      overflow-y: auto;
      padding: 20px;
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
      max-height: 60px;
      overflow: hidden;
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
    }
    
    .main-content {
      flex: 1;
      padding: 40px;
      overflow-y: auto;
    }
    
    .editor-section {
      margin-bottom: 40px;
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
    }
    
    .original-text {
      background: white;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 15px;
      border: 1px solid #ddd;
      line-height: 1.6;
      color: #333;
    }
    
    .original-text .label {
      font-size: 12px;
      color: #999;
      margin-bottom: 8px;
      font-weight: 600;
    }
    
    .original-text .content {
      color: #555;
      word-break: break-word;
    }
    
    .editor-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 15px;
    }
    
    .form-group {
      display: flex;
      flex-direction: column;
    }
    
    .form-label {
      font-size: 13px;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
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
    
    .action-buttons {
      display: flex;
      gap: 10px;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
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
    
    .btn-open {
      background: #51cf66;
      color: white;
      font-size: 12px;
      padding: 6px 12px;
    }
    
    .btn-open:hover {
      background: #40c057;
    }
    
    .image-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 40px;
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
      padding: 20px;
      border-radius: 4px;
      text-align: center;
      color: #999;
      font-size: 12px;
      margin-bottom: 10px;
    }
    
    .bottom-controls {
      display: flex;
      gap: 10px;
      padding: 20px 40px;
      background: #f8f9fa;
      border-top: 1px solid #ddd;
      flex-wrap: wrap;
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
    
    .empty-state {
      text-align: center;
      padding: 60px 40px;
      color: #999;
    }
    
    .empty-state h2 {
      font-size: 24px;
      margin-bottom: 10px;
      color: #666;
    }
    
    @media (max-width: 1000px) {
      .editor-wrapper {
        flex-direction: column;
      }
      
      .sidebar {
        width: 100%;
        max-height: 200px;
        border-right: none;
        border-bottom: 1px solid #ddd;
        display: flex;
        overflow-x: auto;
      }
      
      .project-item {
        flex-shrink: 0;
        min-width: 150px;
      }
      
      .editor-group {
        grid-template-columns: 1fr;
      }
      
      .image-section {
        grid-template-columns: 1fr;
      }
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
      <!-- 侧边栏：项目列表 -->
      <div class="sidebar">
        <div style="font-weight: 600; color: #333; margin-bottom: 15px;">
          📋 项目列表 (<span id="totalCount">0</span>)
        </div>
        <div id="projectList"></div>
      </div>
      
      <!-- 主内容区 -->
      <div class="main-content">
        <div id="editorContent"></div>
      </div>
    </div>
    
    <!-- 底部控制 -->
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
    // 数据
    const projects = ${projectsJson};
    const auditPath = "${path.dirname(auditPath).replace(/\\\\/g, '\\\\\\\\')}";
    
    let currentIndex = 0;
    let editedData = {};
    
    // 初始化
    document.addEventListener('DOMContentLoaded', () => {
      loadSavedProgress();
      renderProjectList();
      showProject(0);
    });
    
    // 渲染项目列表
    function renderProjectList() {
      const list = document.getElementById('projectList');
      list.innerHTML = projects.map((p, idx) => \`
        <div class="project-item \${idx === 0 ? 'active' : ''}" onclick="showProject(\${idx})">
          <div class="number">#\${p.序号}</div>
          <div class="name">\${p.项目名称}</div>
        </div>
      \`).join('');
      
      document.getElementById('totalCount').textContent = projects.length;
    }
    
    // 显示项目编辑界面
    function showProject(index) {
      if (index < 0 || index >= projects.length) return;
      
      saveCurrentProject();
      currentIndex = index;
      
      const project = projects[index];
      const saved = editedData[index] || {};
      
      let html = \`
        <div class="info-box">
          ℹ️ 正在编辑：<strong>\${project.项目名称}</strong> | 
          进度：<strong>\${index + 1}/${projects.length}</strong> | 
          分册：\${project.分册类型}
        </div>
      \`;
      
      // 问题部分
      html += \`
        <div class="editor-section">
          <h3>
            ❓ 发现问题
            <span class="confidence-badge">置信度: \${project.问题_置信度}%</span>
          </h3>
          
          <div class="original-text">
            <div class="label">原文本：</div>
            <div class="content">\${escapeHtml(project.问题_原文)}</div>
          </div>
          
          <div class="editor-group">
            <div class="form-group">
              <label class="form-label">审核结果</label>
              <select class="form-input" id="问题_审核结果">
                <option value="">-- 选择 --</option>
                <option value="对" \${saved['问题_审核结果'] === '对' ? 'selected' : ''}>✅ 对</option>
                <option value="不对" \${saved['问题_审核结果'] === '不对' ? 'selected' : ''}>❌ 不对</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">最终确认</label>
              <select class="form-input" id="问题_最终确认">
                <option value="">-- 选择 --</option>
                <option value="确认" \${saved['问题_最终确认'] === '确认' ? 'selected' : ''}>✓ 确认</option>
                <option value="已修改" \${saved['问题_最终确认'] === '已修改' ? 'selected' : ''}>✎ 已修改</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">修改为新内容（留空则保留原文）</label>
            <textarea class="form-input" id="问题_新内容" placeholder="输入修改后的内容...">\${saved['问题_新内容'] || ''}</textarea>
          </div>
        </div>
      \`;
      
      // 难点部分
      html += \`
        <div class="editor-section">
          <h3>
            🎯 项目难点
            <span class="confidence-badge">置信度: \${project.难点_置信度}%</span>
          </h3>
          
          <div class="original-text">
            <div class="label">原文本：</div>
            <div class="content">\${escapeHtml(project.难点_原文)}</div>
          </div>
          
          <div class="form-group">
            <label class="form-label">修改为新内容（留空则保留原文）</label>
            <textarea class="form-input" id="难点_新内容" placeholder="输入修改后的内容...">\${saved['难点_新内容'] || ''}</textarea>
          </div>
        </div>
      \`;
      
      // 方案部分
      html += \`
        <div class="editor-section">
          <h3>
            💡 解决方案
            <span class="confidence-badge">置信度: \${project.方案_置信度}%</span>
          </h3>
          
          <div class="original-text">
            <div class="label">原文本：</div>
            <div class="content">\${escapeHtml(project.方案_原文)}</div>
          </div>
          
          <div class="form-group">
            <label class="form-label">修改为新内容（留空则保留原文）</label>
            <textarea class="form-input" id="方案_新内容" placeholder="输入修改后的内容...">\${saved['方案_新内容'] || ''}</textarea>
          </div>
        </div>
      \`;
      
      // 结果部分
      html += \`
        <div class="editor-section">
          <h3>
            🏆 结果与价值
            <span class="confidence-badge">置信度: \${project.结果_置信度}%</span>
          </h3>
          
          <div class="original-text">
            <div class="label">原文本：</div>
            <div class="content">\${escapeHtml(project.结果_原文)}</div>
          </div>
          
          <div class="form-group">
            <label class="form-label">修改为新内容（留空则保留原文）</label>
            <textarea class="form-input" id="结果_新内容" placeholder="输入修改后的内容...">\${saved['结果_新内容'] || ''}</textarea>
          </div>
        </div>
      \`;
      
      // 图片部分
      html += \`
        <div class="image-section">
          <div class="image-item">
            <h4>📷 前期图片</h4>
            <div class="image-placeholder">
              原图片：\${project.图片_前期}
            </div>
            <div class="form-group">
              <label class="form-label">替换为新图片文件名</label>
              <input type="text" class="form-input" id="图片_前期_新" 
                placeholder="输入新图片文件名，或留空保留原图" 
                value="\${saved['图片_前期_新'] || ''}">
            </div>
          </div>
          
          <div class="image-item">
            <h4>📷 后期图片</h4>
            <div class="image-placeholder">
              原图片：\${project.图片_后期}
            </div>
            <div class="form-group">
              <label class="form-label">替换为新图片文件名</label>
              <input type="text" class="form-input" id="图片_后期_新" 
                placeholder="输入新图片文件名，或留空保留原图" 
                value="\${saved['图片_后期_新'] || ''}">
            </div>
          </div>
        </div>
      \`;
      
      // 汇总部分
      html += \`
        <div class="editor-section">
          <h3>✅ 审核汇总</h3>
          
          <div class="editor-group">
            <div class="form-group">
              <label class="form-label">整体状态</label>
              <select class="form-input" id="整体状态">
                <option value="">-- 选择 --</option>
                <option value="通过" \${saved['整体状态'] === '通过' ? 'selected' : ''}>✅ 通过</option>
                <option value="需修改" \${saved['整体状态'] === '需修改' ? 'selected' : ''}>🔧 需修改</option>
                <option value="待补充" \${saved['整体状态'] === '待补充' ? 'selected' : ''}>📦 待补充</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">源文件路径</label>
              <input type="text" class="form-input" value="\${project.源项目路径}" readonly>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">备注</label>
            <textarea class="form-input" id="备注" placeholder="添加任何其他说明...">\${saved['备注'] || ''}</textarea>
          </div>
        </div>
      \`;
      
      document.getElementById('editorContent').innerHTML = html;
      
      // 更新UI
      updateProjectList();
      updateProgress();
      updateNavButtons();
    }
    
    // 保存当���项目编辑内容
    function saveCurrentProject() {
      if (currentIndex < 0 || currentIndex >= projects.length) return;
      
      const fields = [
        '问题_审核结果', '问题_最终确认', '问题_新内容',
        '难点_新内容', '方案_新内容', '结果_新内容',
        '图片_前期_新', '图片_后期_新',
        '整体状态', '备注'
      ];
      
      const saved = {};
      for (const field of fields) {
        const el = document.getElementById(field);
        if (el) {
          saved[field] = el.value;
        }
      }
      
      editedData[currentIndex] = saved;
      saveDraft();
    }
    
    // 下一个项目
    function nextProject() {
      if (currentIndex < projects.length - 1) {
        showProject(currentIndex + 1);
      }
    }
    
    // 上一个项目
    function previousProject() {
      if (currentIndex > 0) {
        showProject(currentIndex - 1);
      }
    }
    
    // 更新项目列表高亮
    function updateProjectList() {
      document.querySelectorAll('.project-item').forEach((item, idx) => {
        item.classList.toggle('active', idx === currentIndex);
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
    
    // 保存进度到浏览器本地存储
    function saveDraft() {
      saveCurrentProject();
      localStorage.setItem('auditEditorDraft', JSON.stringify(editedData));
      console.log('✅ 进度已保存到浏览器');
    }
    
    // 加载之前保存的进度
    function loadSavedProgress() {
      const saved = localStorage.getItem('auditEditorDraft');
      if (saved) {
        editedData = JSON.parse(saved);
        console.log('✅ 加载了之前的进度');
      }
    }
    
    // 导出审核结果为CSV
    function saveAndExport() {
      saveCurrentProject();
      
      const rows = [];
      
      for (let i = 0; i < projects.length; i++) {
        const project = projects[i];
        const saved = editedData[i] || {};
        
        rows.push({
          序号: project.序号,
          项目名称: project.项目名称,
          分册类型: project.分册类型,
          子类: project.子类,
          源项目路径: project.源项目路径,
          
          // 原文本
          问题_原文: project.问题_原文,
          难点_原文: project.难点_原文,
          方案_原文: project.方案_原文,
          结果_原文: project.结果_原文,
          
          // 新内容
          问题_新内容: saved['问题_新内容'] || '',
          难点_新内容: saved['难点_新内容'] || '',
          方案_新内容: saved['方案_新内容'] || '',
          结果_新内容: saved['结果_新内容'] || '',
          
          // 图片
          图片_前期_原: project.图片_前期,
          图片_前期_新: saved['图片_前期_新'] || '',
          图片_后期_原: project.图片_后期,
          图片_后期_新: saved['图片_后期_新'] || '',
          
          // 审核意见
          问题_审核结果: saved['问题_审核结果'] || '',
          问题_最终确认: saved['问题_最终确认'] || '',
          整体状态: saved['整体状态'] || '',
          备注: saved['备注'] || '',
        });
      }
      
      // 导出CSV
      const fieldnames = [
        '序号', '项目名称', '分册类型', '子类', '源项目路径',
        '问题_原文', '难点_原文', '方案_原文', '结果_原文',
        '问题_新���容', '难点_新内容', '方案_新内容', '结果_新内容',
        '图片_前期_原', '图片_前期_新', '图片_后期_原', '图片_后期_新',
        '问题_审核结果', '问题_最终确认', '整体状态', '备注'
      ];
      
      const escapeCell = (value) => {
        const text = value == null ? "" : String(value);
        if (/[",\\r\\n]/.test(text)) {
          return \`"\${text.replaceAll('"', '""')}"\`;
        }
        return text;
      };
      
      const lines = [fieldnames.map(escapeCell).join(",")];
      
      for (const row of rows) {
        lines.push(fieldnames.map(name => escapeCell(row[name] ?? "")).join(","));
      }
      
      const csv = "\\ufeff" + lines.join("\\r\\n") + "\\r\\n";
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "audit_editor_result.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('✅ 审���结果已导出！\\n文件名：audit_editor_result.csv\\n\\n下一步：运行 node scripts/2_apply_audit_changes.mjs');
    }
    
    // HTML转义
    function escapeHtml(text) {
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return text.replace(/[&<>"']/g, m => map[m]);
    }
  </script>
</body>
</html>`;
}

const { auditPath, outputPath } = parseArgs();
generateInteractiveEditor(auditPath, outputPath);
