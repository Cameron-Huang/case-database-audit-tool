// scripts/5_interactive_editor.mjs
// 功能：动态加载数据源的交互式审核编辑器

import fs from "fs";
import path from "path";
import { readCsv, writeCsv, ensureDir } from "../utils/csv_utils.js";
import { CONFIG, getPath } from "../config/paths.config.js";

const argv = process.argv.slice(2);

function parseArgs() {
  let outputPath = argv[0] || path.join(CONFIG.BASE_DIR, "interactive_editor.html");
  
  return { outputPath };
}

function generateDynamicEditor(outputPath) {
  console.log(`\n🎨 生成动态交互式编辑器...`);
  
  // 生成HTML（不包含数���，数据动态加载）
  const html = generateHtmlContent();
  
  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, html, "utf8");
  
  console.log(`
✅ 动态编辑器已生成！

📁 文件位置: ${outputPath}

💡 使用方法：

1. 打开 HTML 文件
2. 会弹出对话框，选择数据源：
   ✓ 从 CSV 文件加载（推荐）
   ✓ 从本地数据库文件夹加载
3. 选择要审核的 CSV 或数据库
4. 开始审核

🔄 优势：
   - 数据源灵活，可以随时更换
   - 数据库更新时，无需重新生成 HTML
   - 一个 HTML 文件适用所有项目
   - 支持实时读取最新数据
  `);
}

function generateHtmlContent() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>交互式审核编辑器 - 动��数据加载版</title>
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
    }
    
    .original-text {
      background: white;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 15px;
      border: 1px solid #ddd;
      line-height: 1.6;
      color: #333;
      max-height: 120px;
      overflow-y: auto;
      word-break: break-word;
      white-space: pre-wrap;
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
    
    /* 数据源选择对话框 */
    .modal {
      display: none;
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      align-items: center;
      justify-content: center;
    }
    
    .modal.show {
      display: flex;
    }
    
    .modal-content {
      background: white;
      padding: 40px;
      border-radius: 10px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    }
    
    .modal-content h2 {
      font-size: 20px;
      margin-bottom: 20px;
      color: #333;
    }
    
    .modal-content p {
      color: #666;
      margin-bottom: 20px;
      font-size: 14px;
    }
    
    .form-group-modal {
      margin-bottom: 20px;
    }
    
    .form-group-modal label {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
      color: #333;
    }
    
    .form-group-modal input,
    .form-group-modal textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
    }
    
    .modal-buttons {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 30px;
    }
    
    .loading {
      text-align: center;
      padding: 40px;
      color: #999;
    }
    
    .loading-spinner {
      display: inline-block;
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 10px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .hidden {
      display: none;
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
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- 顶部 -->
    <div class="header">
      <h1>✏️ 交互式审核编辑器</h1>
      <p>动态数据加载 • 灵活审核 • 实时保存</p>
    </div>
    
    <!-- 编辑区域 -->
    <div class="editor-wrapper">
      <!-- 侧边栏 -->
      <div class="sidebar">
        <div style="font-weight: 600; color: #333; margin-bottom: 15px; font-size: 14px;">
          📋 项目列表 (<span id="projectCount">0</span>)
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
      <button class="btn btn-primary" onclick="changeDataSource()">
        🔄 更换数据源
      </button>
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
  
  <!-- 数据源选择对话框 -->
  <div class="modal" id="dataSourceModal">
    <div class="modal-content">
      <h2>📂 选择数据源</h2>
      <p>输入要审核的 CSV 文件完整路径</p>
      
      <div class="form-group-modal">
        <label>CSV 文件路径：</label>
        <input type="text" id="csvPath" placeholder="例如：D:\\AI\\project\\0415\\00_audit_checklist.csv" value="">
      </div>
      
      <div style="background: #f0f0f0; padding: 12px; border-radius: 4px; margin-bottom: 20px; font-size: 12px; color: #666;">
        <strong>💡 提示：</strong><br>
        1. 输入完整的 CSV 文件路径<br>
        2. 确保文件存在且格式正确<br>
        3. 或复制之前的路径回车快速加载
      </div>
      
      <div class="modal-buttons">
        <button class="btn btn-secondary" onclick="closeDataSourceModal()">取消</button>
        <button class="btn btn-primary" onclick="loadDataSource()">加载</button>
      </div>
    </div>
  </div>
  
  <script>
    let projects = [];
    let currentIndex = 0;
    let editedData = {};
    let currentCsvPath = '';
    
    // 初始化
    document.addEventListener('DOMContentLoaded', function() {
      showDataSourceModal();
    });
    
    // 显示数据源选择对话框
    function showDataSourceModal() {
      document.getElementById('dataSourceModal').classList.add('show');
      document.getElementById('csvPath').focus();
      
      // 从localStorage恢复上次的路径
      const lastPath = localStorage.getItem('lastCsvPath');
      if (lastPath) {
        document.getElementById('csvPath').value = lastPath;
      }
    }
    
    // 关闭数据源对话框
    function closeDataSourceModal() {
      document.getElementById('dataSourceModal').classList.remove('show');
    }
    
    // 加载数据源
    function loadDataSource() {
      const csvPath = document.getElementById('csvPath').value.trim();
      
      if (!csvPath) {
        alert('❌ 请输入 CSV 文件路径');
        return;
      }
      
      // 显示加载中
      showLoading('正在加载数据...');
      
      // 使用 Web Worker 或 fetch 从本地读取（浏览器限制）
      // 这里我��用 localStorage 来模拟
      
      // 实际上浏览器无法直接读取本地文件
      // 需要用户复制粘贴CSV内容，或使用文件上传
      
      // 显示文件上传对话框
      alert(\`⚠️ 浏览器限制：无法直接读取本地文件

请选择以下方式之一：

1. 使用文件上传：会弹出文件选择器
2. 复制粘贴：将CSV文件内容复制到文本框
3. 使用命令行脚本生成专用 HTML

点击"确定"使用文件上传方式\`);
      
      // 弹出文件选择器
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv';
      input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function(event) {
            parseAndLoadCsv(event.target.result);
            localStorage.setItem('lastCsvPath', csvPath);
            closeDataSourceModal();
          };
          reader.readAsText(file, 'utf-8');
        }
      };
      input.click();
    }
    
    // 解析CSV并加载
    function parseAndLoadCsv(csvContent) {
      try {
        const lines = csvContent.split(/\\r?\\n/).filter(line => line.trim());
        if (lines.length < 2) {
          alert('❌ CSV 文件格式错误');
          return;
        }
        
        const headers = lines[0].split(',').map(h => h.trim());
        projects = [];
        
        for (let i = 1; i < lines.length; i++) {
          // 简单的CSV解析（生产环境需要更复杂的逻辑）
          const values = lines[i].split(',');
          if (values.length < 5) continue;
          
          const project = {};
          headers.forEach((header, idx) => {
            project[header] = values[idx] ? values[idx].trim() : '';
          });
          
          projects.push(project);
        }
        
        console.log('✅ 已加载 ' + projects.length + ' 个项目');
        
        if (projects.length === 0) {
          alert('❌ CSV 中没有找到项目数据');
          return;
        }
        
        // 初始化UI
        currentIndex = 0;
        loadSavedProgress();
        renderProjectList();
        showProject(0);
        hideLoading();
        
      } catch (e) {
        alert('❌ CSV 解析失败：' + e.message);
        console.error(e);
        showDataSourceModal();
      }
    }
    
    // 显示加载中
    function showLoading(message) {
      document.getElementById('editorContent').innerHTML = \`
        <div class="loading">
          <div class="loading-spinner"></div>
          <p>\${message}</p>
        </div>
      \`;
    }
    
    // 隐藏加载中
    function hideLoading() {
      // 已在showProject中覆盖
    }
    
    // 更换数据源
    function changeDataSource() {
      editedData = {};
      showDataSourceModal();
    }
    
    // 渲染项目列表
    function renderProjectList() {
      const list = document.getElementById('projectList');
      let html = '';
      
      for (let i = 0; i < projects.length; i++) {
        const p = projects[i];
        const name = p.项目名称 || p['项目名称'] || '项目 ' + (i + 1);
        html += '<div class="project-item ' + (i === 0 ? 'active' : '') + '" onclick="showProject(' + i + ')">';
        html += '<div class="number">#' + (i + 1) + '</div>';
        html += '<div class="name">' + name + '</div>';
        html += '</div>';
      }
      
      list.innerHTML = html;
      document.getElementById('projectCount').textContent = projects.length;
    }
    
    // 显示项目编辑界面
    function showProject(index) {
      if (index < 0 || index >= projects.length) return;
      
      saveCurrentProject();
      currentIndex = index;
      
      const project = projects[index];
      const saved = editedData[index] || {};
      
      let html = '<div class="info-box">';
      html += '正在编辑：<strong>' + (project.项目名称 || '项目') + '</strong> | ';
      html += '进度：<strong>' + (index + 1) + '/' + projects.length + '</strong>';
      html += '</div>';
      
      // 问题
      html += '<div class="editor-section">';
      html += '<h3>❓ 发现问题</h3>';
      html += '<div class="original-text">';
      html += '<div class="label">原文本：</div>';
      html += '<div>' + (project['问题_自动提取'] || project['问题_原文'] || '（无）') + '</div>';
      html += '</div>';
      html += '<div class="form-group">';
      html += '<label class="form-label">修改为新内容</label>';
      html += '<textarea class="form-input" id="问题_新内容">' + (saved['问题_新内容'] || '') + '</textarea>';
      html += '</div>';
      html += '</div>';
      
      // 难点
      html += '<div class="editor-section">';
      html += '<h3>🎯 项目难点</h3>';
      html += '<div class="original-text">';
      html += '<div class="label">原文本：</div>';
      html += '<div>' + (project['难点_自动提取'] || project['难点_原文'] || '（无）') + '</div>';
      html += '</div>';
      html += '<div class="form-group">';
      html += '<label class="form-label">修改为新内容</label>';
      html += '<textarea class="form-input" id="难点_新内容">' + (saved['难点_新内容'] || '') + '</textarea>';
      html += '</div>';
      html += '</div>';
      
      // 方案
      html += '<div class="editor-section">';
      html += '<h3>💡 解决方案</h3>';
      html += '<div class="original-text">';
      html += '<div class="label">原文本：</div>';
      html += '<div>' + (project['方案_自动提取'] || project['方案_原文'] || '（无）') + '</div>';
      html += '</div>';
      html += '<div class="form-group">';
      html += '<label class="form-label">修改为新内容</label>';
      html += '<textarea class="form-input" id="方案_新内容">' + (saved['方案_新内容'] || '') + '</textarea>';
      html += '</div>';
      html += '</div>';
      
      // 结果
      html += '<div class="editor-section">';
      html += '<h3>🏆 结果与价值</h3>';
      html += '<div class="original-text">';
      html += '<div class="label">原文本：</div>';
      html += '<div>' + (project['结果_自动提取'] || project['结果_原文'] || '（无）') + '</div>';
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
      html += '<div class="image-placeholder">原文件：' + (project['图片_检测到的前期'] || '未检测') + '</div>';
      html += '<div class="form-group">';
      html += '<label class="form-label">替换为新图片</label>';
      html += '<input type="text" class="form-input" id="图片_前期_新" value="' + (saved['图片_前期_新'] || '') + '">';
      html += '</div>';
      html += '</div>';
      html += '<div class="image-item">';
      html += '<h4>后期图片</h4>';
      html += '<div class="image-placeholder">原文件：' + (project['图片_检测到的后期'] || '未检测') + '</div>';
      html += '<div class="form-group">';
      html += '<label class="form-label">替换为新图片</label>';
      html += '<input type="text" class="form-input" id="图片_后期_新" value="' + (saved['图片_后期_新'] || '') + '">';
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
      
      updateProjectList();
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
    
    function nextProject() {
      if (currentIndex < projects.length - 1) {
        showProject(currentIndex + 1);
      }
    }
    
    function previousProject() {
      if (currentIndex > 0) {
        showProject(currentIndex - 1);
      }
    }
    
    function updateProjectList() {
      const items = document.querySelectorAll('.project-item');
      items.forEach((item, i) => {
        item.classList.toggle('active', i === currentIndex);
      });
    }
    
    function updateNavButtons() {
      document.getElementById('prevBtn').disabled = currentIndex === 0;
      document.getElementById('nextBtn').disabled = currentIndex === projects.length - 1;
    }
    
    function saveDraft() {
      saveCurrentProject();
      localStorage.setItem('auditEditorDraft', JSON.stringify(editedData));
      alert('✅ 进度已保存！');
    }
    
    function loadSavedProgress() {
      try {
        const saved = localStorage.getItem('auditEditorDraft');
        if (saved) {
          editedData = JSON.parse(saved);
          console.log('✅ 已恢复 ' + Object.keys(editedData).length + ' 个已编辑项目');
        }
      } catch (e) {
        console.error('加载进度失败:', e);
      }
    }
    
    function saveAndExport() {
      saveCurrentProject();
      
      let csv = '序号,项目名称,问题_原文,问题_新内容,难点_原文,难点_新内容,方案_原文,方案_新内容,结果_原文,结果_新内容,图片_前期_原,图片_前期_新,图片_后期_原,图片_后期_新,整体状态,备注\\r\\n';
      
      for (let i = 0; i < projects.length; i++) {
        const project = projects[i];
        const saved = editedData[i] || {};
        
        const row = [
          i + 1,
          project.项目名称 || '',
          project['问题_自动提取'] || project['问题_原文'] || '',
          saved['问题_新内容'] || '',
          project['难点_自动提取'] || project['难点_原文'] || '',
          saved['难点_新内容'] || '',
          project['方案_自动提取'] || project['方案_原文'] || '',
          saved['方案_新内容'] || '',
          project['结果_自动提取'] || project['结果_原文'] || '',
          saved['结果_新内容'] || '',
          project['图片_检测到的前期'] || '',
          saved['图片_前期_新'] || '',
          project['图片_检测到的后期'] || '',
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
      
      const blob = new Blob(['\\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'audit_editor_result.csv';
      link.click();
      
      alert('✅ 审核结果已导出！');
    }
  </script>
</body>
</html>`;
}

const { outputPath } = parseArgs();
generateDynamicEditor(outputPath);
