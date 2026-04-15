// scripts/3_generate_html_review.mjs
// 功能：生成HTML审核界面，支持在线审核

import fs from "fs";
import path from "path";
import { readCsv, writeCsv, ensureDir } from "../utils/csv_utils.js";
import { CONFIG, getPath } from "../config/paths.config.js";

const argv = process.argv.slice(2);

function parseArgs() {
  let auditPath = argv[0] || getPath("audit");
  let outputPath = argv[1] || getPath("html");
  
  if (!fs.existsSync(auditPath)) {
    console.error(`
❌ 错误：审核清单文件不存在

使用方法：
  node scripts/3_generate_html_review.mjs <审核清单CSV> [输出HTML路径]

示例：
  node scripts/3_generate_html_review.mjs "D:\\AI\\project\\0409\\00_audit_checklist.csv"
    `);
    process.exit(1);
  }
  
  return { auditPath, outputPath };
}

function generateHtmlReviewInterface(auditPath, outputPath) {
  console.log(`\n📖 读取审核清单: ${auditPath}`);
  const auditRows = readCsv(auditPath);
  
  if (auditRows.length === 0) {
    console.error("❌ 审核清单为空");
    process.exit(1);
  }
  
  console.log(`✅ 成功读取 ${auditRows.length} 个项目`);
  console.log(`🎨 生成HTML审核界面...`);
  
  // 统计数据
  const stats = {
    总数: auditRows.length,
    已审核: auditRows.filter(r => r.整体状态).length,
    未审核: auditRows.filter(r => !r.整体状态).length,
    已通过: auditRows.filter(r => r.整体状态 === "通过").length,
    需修改: auditRows.filter(r => r.整体状态 === "需修改").length,
    待补充: auditRows.filter(r => r.整体状态 === "待补充").length,
  };
  
  // 按置信度分类
  const byConfidence = {
    高置信: [],
    中置信: [],
    低置信: [],
  };
  
  for (const row of auditRows) {
    const avgConfidence = (
      parseFloat(row.问题_置信度 || 0) +
      parseFloat(row.难点_置信度 || 0) +
      parseFloat(row.方案_置信度 || 0) +
      parseFloat(row.结果_置信度 || 0)
    ) / 4;
    
    if (avgConfidence > 70) byConfidence.高置信.push(row);
    else if (avgConfidence >= 50) byConfidence.中置信.push(row);
    else byConfidence.低置信.push(row);
  }
  
  // 生成HTML
  const html = generateHtmlContent(auditRows, stats, byConfidence);
  
  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, html, "utf8");
  
  console.log(`
✅ HTML审核界面已生成！

📁 文件位置: ${outputPath}

📊 统计信息：
   ✅ 总项目数: ${stats.总数}
   📝 已审核: ${stats.已审核}
   ❓ 未审核: ${stats.未审核}
   
   🟢 已通过: ${stats.已通过}
   🟡 需修改: ${stats.需修改}
   🔴 待补充: ${stats.待补充}

🌍 打开方式：
   用浏览器打开: ${outputPath}
   
   或者直接双击打开文件

💡 功能：
   - 在线预览所有项目
   - 点击项目查看详情
   - 直接在网页上审核
   - 导出结果为CSV
  `);
}

function generateHtmlContent(auditRows, stats, byConfidence) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>案例数据库审核工具</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 10px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 32px;
      margin-bottom: 10px;
    }
    
    .header p {
      font-size: 16px;
      opacity: 0.9;
    }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 40px;
      background: #f8f9fa;
    }
    
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      text-align: center;
    }
    
    .stat-card .number {
      font-size: 32px;
      font-weight: bold;
      color: #667eea;
      margin-bottom: 10px;
    }
    
    .stat-card .label {
      color: #666;
      font-size: 14px;
    }
    
    .controls {
      padding: 20px 40px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      background: #f8f9fa;
    }
    
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s;
    }
    
    .btn-primary {
      background: #667eea;
      color: white;
    }
    
    .btn-primary:hover {
      background: #5568d3;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    
    .btn-secondary {
      background: #e9ecef;
      color: #333;
    }
    
    .btn-secondary:hover {
      background: #dee2e6;
    }
    
    .btn-success {
      background: #51cf66;
      color: white;
    }
    
    .btn-warning {
      background: #ffd43b;
      color: #333;
    }
    
    .btn-danger {
      background: #ff6b6b;
      color: white;
    }
    
    .content {
      padding: 40px;
    }
    
    .filter-tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }
    
    .filter-tab {
      padding: 8px 16px;
      border: 2px solid #ddd;
      background: white;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.3s;
      font-size: 14px;
    }
    
    .filter-tab:hover {
      border-color: #667eea;
      color: #667eea;
    }
    
    .filter-tab.active {
      background: #667eea;
      border-color: #667eea;
      color: white;
    }
    
    .project-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }
    
    .project-card {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    .project-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      border-color: #667eea;
    }
    
    .project-card.high {
      border-left: 4px solid #51cf66;
    }
    
    .project-card.medium {
      border-left: 4px solid #ffd43b;
    }
    
    .project-card.low {
      border-left: 4px solid #ff6b6b;
    }
    
    .project-card .title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 10px;
      color: #333;
    }
    
    .project-card .meta {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
      flex-wrap: wrap;
      font-size: 12px;
    }
    
    .badge {
      background: #e9ecef;
      padding: 4px 8px;
      border-radius: 3px;
      color: #666;
    }
    
    .badge.confidence-high {
      background: #d3f9d8;
      color: #2f9e44;
    }
    
    .badge.confidence-medium {
      background: #fff3bf;
      color: #d9a024;
    }
    
    .badge.confidence-low {
      background: #ffe0e0;
      color: #c92a2a;
    }
    
    .badge.status-done {
      background: #d3f9d8;
      color: #2f9e44;
    }
    
    .badge.status-pending {
      background: #fff3bf;
      color: #d9a024;
    }
    
    .badge.status-hold {
      background: #ffe0e0;
      color: #c92a2a;
    }
    
    .project-card .preview {
      background: #f8f9fa;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 15px;
      font-size: 12px;
      line-height: 1.5;
      color: #666;
      max-height: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .project-card .actions {
      display: flex;
      gap: 10px;
    }
    
    .project-card .actions button {
      flex: 1;
      padding: 8px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.3s;
    }
    
    .modal {
      display: none;
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      animation: fadeIn 0.3s;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .modal.show {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .modal-content {
      background: white;
      padding: 40px;
      border-radius: 10px;
      max-width: 800px;
      max-height: 80vh;
      overflow-y: auto;
      width: 90%;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid #ddd;
    }
    
    .modal-header h2 {
      font-size: 24px;
      color: #333;
    }
    
    .modal-close {
      background: none;
      border: none;
      font-size: 28px;
      cursor: pointer;
      color: #999;
    }
    
    .modal-close:hover {
      color: #333;
    }
    
    .modal-section {
      margin-bottom: 30px;
    }
    
    .modal-section h3 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 10px;
      color: #667eea;
      padding-bottom: 10px;
      border-bottom: 2px solid #667eea;
    }
    
    .modal-section p {
      line-height: 1.8;
      color: #555;
      margin-bottom: 10px;
    }
    
    .field-group {
      margin-bottom: 20px;
    }
    
    .field-label {
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
      display: block;
    }
    
    .field-input {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      font-family: inherit;
    }
    
    .field-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    .confidence-bar {
      background: #e9ecef;
      height: 8px;
      border-radius: 4px;
      overflow: hidden;
      margin: 10px 0;
    }
    
    .confidence-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #51cf66 0%, #ffd43b 50%, #ff6b6b 100%);
      background-size: 300% 100%;
    }
    
    .export-section {
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      margin-top: 30px;
    }
    
    .footer {
      text-align: center;
      padding: 20px;
      color: #999;
      font-size: 12px;
      background: #f8f9fa;
    }
    
    @media (max-width: 768px) {
      .header h1 {
        font-size: 24px;
      }
      
      .stats {
        grid-template-columns: 1fr 1fr;
      }
      
      .project-grid {
        grid-template-columns: 1fr;
      }
      
      .modal-content {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- 顶部 -->
    <div class="header">
      <h1>🎯 案例数据库审核工具</h1>
      <p>智能审核、高效管理、一键发布</p>
    </div>
    
    <!-- 统计卡片 -->
    <div class="stats">
      <div class="stat-card">
        <div class="number">${stats.总数}</div>
        <div class="label">总项目数</div>
      </div>
      <div class="stat-card">
        <div class="number">${stats.已审核}</div>
        <div class="label">已审核</div>
      </div>
      <div class="stat-card">
        <div class="number">${stats.未审核}</div>
        <div class="label">未审核</div>
      </div>
      <div class="stat-card">
        <div class="number" style="color: #51cf66;">${stats.已通过}</div>
        <div class="label">已通过</div>
      </div>
      <div class="stat-card">
        <div class="number" style="color: #ffd43b;">${stats.需修改}</div>
        <div class="label">需修改</div>
      </div>
      <div class="stat-card">
        <div class="number" style="color: #ff6b6b;">${stats.待补充}</div>
        <div class="label">待补充</div>
      </div>
    </div>
    
    <!-- 控制栏 -->
    <div class="controls">
      <button class="btn btn-primary" onclick="exportToCSV()">📥 导出结果为CSV</button>
      <button class="btn btn-secondary" onclick="location.reload()">🔄 刷新</button>
      <button class="btn btn-secondary" onclick="showStats()">📊 查看统计</button>
    </div>
    
    <!-- 主内容 -->
    <div class="content">
      <div class="filter-tabs">
        <div class="filter-tab active" onclick="filterByStatus('all')">全部</div>
        <div class="filter-tab" onclick="filterByStatus('通过')">✅ 已通过</div>
        <div class="filter-tab" onclick="filterByStatus('需修改')">🔧 需修改</div>
        <div class="filter-tab" onclick="filterByStatus('待补充')">📦 待补充</div>
        <div class="filter-tab" onclick="filterByStatus('未审核')">❓ 未审核</div>
      </div>
      
      <div class="project-grid" id="projectGrid"></div>
    </div>
    
    <!-- 页脚 -->
    <div class="footer">
      💡 提示：点击任意项目卡片可查看详情并进行审核 | 修改完成后点击"导出结果为CSV"
    </div>
  </div>
  
  <!-- 详情模态框 -->
  <div class="modal" id="detailModal">
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="projectTitle"></h2>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      
      <div id="projectDetails"></div>
      
      <div class="export-section">
        <button class="btn btn-success" onclick="saveAndClose()">✅ 保存并关闭</button>
        <button class="btn btn-secondary" onclick="closeModal()">❌ 取消</button>
      </div>
    </div>
  </div>
  
  <script>
    // 数据
    const auditData = ${JSON.stringify(auditRows)};
    let currentFilter = 'all';
    let currentProject = null;
    
    // 初始化
    document.addEventListener('DOMContentLoaded', () => {
      renderProjects();
    });
    
    // 渲染项目卡片
    function renderProjects() {
      const filtered = auditData.filter(project => {
        if (currentFilter === 'all') return true;
        return project.整体状态 === currentFilter;
      });
      
      const grid = document.getElementById('projectGrid');
      grid.innerHTML = filtered.map((project, idx) => {
        const avgConfidence = (
          parseFloat(project.问题_置信度 || 0) +
          parseFloat(project.难点_置信度 || 0) +
          parseFloat(project.方案_置信度 || 0) +
          parseFloat(project.结果_置信度 || 0)
        ) / 4;
        
        let confidenceClass = 'high';
        if (avgConfidence < 50) confidenceClass = 'low';
        else if (avgConfidence < 70) confidenceClass = 'medium';
        
        let statusBadge = '';
        if (project.整体状态 === '通过') {
          statusBadge = '<span class="badge status-done">✅ 已通过</span>';
        } else if (project.整体状态 === '需修改') {
          statusBadge = '<span class="badge status-pending">🔧 需修改</span>';
        } else if (project.整体状态 === '待补充') {
          statusBadge = '<span class="badge status-hold">📦 待补充</span>';
        }
        
        return \`
          <div class="project-card \${confidenceClass}" onclick="openModal(\${idx})">
            <div class="title">\${project.项目名称}</div>
            <div class="meta">
              <span class="badge">\${project.分册类型}</span>
              <span class="badge">\${project.子类}</span>
              <span class="badge confidence-\${confidenceClass}">置信度: \${avgConfidence.toFixed(0)}%</span>
              \${statusBadge}
            </div>
            <div class="preview">
              <strong>问题预览：</strong> \${project.问题_自动提取.substring(0, 60)}...
            </div>
            <div class="actions">
              <button class="btn btn-primary" style="margin: 0;">查看详情</button>
            </div>
          </div>
        \`;
      }).join('');
    }
    
    // 打开详情模态框
    function openModal(idx) {
      currentProject = auditData[idx];
      
      document.getElementById('projectTitle').textContent = currentProject.项目名称;
      
      const avgConfidence = (
        parseFloat(currentProject.问题_置信度 || 0) +
        parseFloat(currentProject.难点_置信度 || 0) +
        parseFloat(currentProject.方案_置信度 || 0) +
        parseFloat(currentProject.结果_置信度 || 0)
      ) / 4;
      
      let html = \`
        <div class="modal-section">
          <h3>基本信息</h3>
          <p><strong>分册类型：</strong> \${currentProject.分册类型}</p>
          <p><strong>子类归档：</strong> \${currentProject.子类}</p>
          <p><strong>当前状态：</strong> \${currentProject.当前状态}</p>
          <p><strong>源项目路径：</strong> <code>\${currentProject.源项目路径}</code></p>
        </div>
        
        <div class="modal-section">
          <h3>📝 发现问题 (置信度: \${currentProject.问题_置信度}%)</h3>
          <p><strong>自动提取：</strong></p>
          <p>\${currentProject.问题_自动提取}</p>
          <div class="field-group">
            <label class="field-label">你的审核结果</label>
            <select class="field-input" id="问题_人工审核结果">
              <option value="">-- 选择 --</option>
              <option value="对" \${currentProject.问题_人工审核结果 === '对' ? 'selected' : ''}>对</option>
              <option value="不对" \${currentProject.问题_人工审核结果 === '不对' ? 'selected' : ''}>不对</option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">修改建议 (格式: 把XXX改为YYY)</label>
            <textarea class="field-input" id="问题_修改建议" rows="3">\${currentProject.问题_修改建议}</textarea>
          </div>
          <div class="field-group">
            <label class="field-label">最终确认</label>
            <select class="field-input" id="问题_最终确认">
              <option value="">-- 选择 --</option>
              <option value="确认" \${currentProject.问题_最终确认 === '确认' ? 'selected' : ''}>确认</option>
              <option value="已修改" \${currentProject.问题_最终确认 === '已修改' ? 'selected' : ''}>已修改</option>
              <option value="待补充" \${currentProject.问题_最终确认 === '待补充' ? 'selected' : ''}>待补充</option>
            </select>
          </div>
        </div>
        
        <div class="modal-section">
          <h3>🎯 项目难点 (置信度: \${currentProject.难点_置信度}%)</h3>
          <p><strong>自动提取：</strong></p>
          <p>\${currentProject.难点_自动提取}</p>
          <div class="field-group">
            <label class="field-label">修改建议</label>
            <textarea class="field-input" id="难点_修改建议" rows="3">\${currentProject.难点_修改建议}</textarea>
          </div>
        </div>
        
        <div class="modal-section">
          <h3>💡 解决方式 (置信度: \${currentProject.方案_置信度}%)</h3>
          <p><strong>自动提取：</strong></p>
          <p>\${currentProject.方案_自动提取}</p>
          <div class="field-group">
            <label class="field-label">修改建议</label>
            <textarea class="field-input" id="方案_修改建议" rows="3">\${currentProject.方案_修改建议}</textarea>
          </div>
        </div>
        
        <div class="modal-section">
          <h3>🏆 结果与价值 (置信度: \${currentProject.结果_置信度}%)</h3>
          <p><strong>自动提取：</strong></p>
          <p>\${currentProject.结果_自动提取}</p>
          <div class="field-group">
            <label class="field-label">修改建议</label>
            <textarea class="field-input" id="结果_修改建议" rows="3">\${currentProject.结果_修改建议}</textarea>
          </div>
        </div>
        
        <div class="modal-section">
          <h3>📷 图片检查</h3>
          <p><strong>前期图片：</strong> \${currentProject.图片_检测到的前期 || '未检测'}</p>
          <div class="field-group">
            <label class="field-label">前期图片是否正确</label>
            <select class="field-input" id="图片_前期_人工审核">
              <option value="">-- 选择 --</option>
              <option value="对" \${currentProject.图片_前期_人工审核 === '对' ? 'selected' : ''}>对</option>
              <option value="不对" \${currentProject.图片_前期_人工审核 === '不对' ? 'selected' : ''}>不对</option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">替换建议 (文件名)</label>
            <input type="text" class="field-input" id="图片_前期_替换建议" value="\${currentProject.图片_前期_替换建议}" placeholder="输入备选文件名">
          </div>
          
          <p style="margin-top: 15px;"><strong>后期图片：</strong> \${currentProject.图片_检测到的后期 || '未检测'}</p>
          <div class="field-group">
            <label class="field-label">后期图片是否正确</label>
            <select class="field-input" id="图片_后期_人工审核">
              <option value="">-- 选择 --</option>
              <option value="对" \${currentProject.图片_后期_人工审核 === '对' ? 'selected' : ''}>对</option>
              <option value="不对" \${currentProject.图片_后期_人工审核 === '不对' ? 'selected' : ''}>不对</option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">替换建议 (文件名)</label>
            <input type="text" class="field-input" id="图片_后期_替换建议" value="\${currentProject.图片_后期_替换建议}" placeholder="输入备选文件名">
          </div>
        </div>
        
        <div class="modal-section">
          <h3>✅ 汇总</h3>
          <div class="field-group">
            <label class="field-label">整体状态</label>
            <select class="field-input" id="整体状态">
              <option value="">-- 选择 --</option>
              <option value="通过" \${currentProject.整体状态 === '通过' ? 'selected' : ''}>✅ 通过</option>
              <option value="需修改" \${currentProject.整体状态 === '需修改' ? 'selected' : ''}>🔧 需修改</option>
              <option value="待补充" \${currentProject.整体状态 === '待补充' ? 'selected' : ''}>📦 待补充</option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">备注</label>
            <textarea class="field-input" id="备注" rows="3">\${currentProject.备注}</textarea>
          </div>
        </div>
      \`;
      
      document.getElementById('projectDetails').innerHTML = html;
      document.getElementById('detailModal').classList.add('show');
    }
    
    // 关闭模态框
    function closeModal() {
      document.getElementById('detailModal').classList.remove('show');
    }
    
    // 保存并关闭
    function saveAndClose() {
      if (!currentProject) return;
      
      // 保存修改到内存
      currentProject.问题_人工审核结果 = document.getElementById('问题_人工审核结果')?.value || '';
      currentProject.问题_修改建议 = document.getElementById('问题_修改建议')?.value || '';
      currentProject.问题_最终确认 = document.getElementById('问题_最终确认')?.value || '';
      currentProject.难点_修改建议 = document.getElementById('难点_修改建议')?.value || '';
      currentProject.方案_修改建议 = document.getElementById('方案_修改建议')?.value || '';
      currentProject.结果_修改建议 = document.getElementById('结果_修改建议')?.value || '';
      currentProject.图片_前期_人工审核 = document.getElementById('图片_前期_人工审核')?.value || '';
      currentProject.图片_前期_替换建议 = document.getElementById('图片_前期_替换建议')?.value || '';
      currentProject.图片_后期_人工审核 = document.getElementById('图片_后期_人工审核')?.value || '';
      currentProject.图片_后期_替换建议 = document.getElementById('图片_后期_替换建议')?.value || '';
      currentProject.整体状态 = document.getElementById('整体状态')?.value || '';
      currentProject.备注 = document.getElementById('备注')?.value || '';
      
      alert('✅ 修改已保存到浏览器内存！\n\n点击"导出结果为CSV"按钮导出修改结果。');
      closeModal();
      renderProjects();
    }
    
    // 过滤项目
    function filterByStatus(status) {
      currentFilter = status;
      
      document.querySelectorAll('.filter-tab').forEach((tab, idx) => {
        tab.classList.remove('active');
      });
      
      event.target.classList.add('active');
      renderProjects();
    }
    
    // 导出为CSV
    function exportToCSV() {
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
      
      const escapeCell = (value) => {
        const text = value == null ? "" : String(value);
        if (/[",\\r\\n]/.test(text)) {
          return \`"\${text.replaceAll('"', '""')}"\`;
        }
        return text;
      };
      
      const lines = [fieldnames.map(escapeCell).join(",")];
      
      for (const row of auditData) {
        lines.push(fieldnames.map(name => escapeCell(row[name] ?? "")).join(","));
      }
      
      const csv = "\\ufeff" + lines.join("\\r\\n") + "\\r\\n";
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "audit_checklist_result.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('✅ CSV已导出！文件名：audit_checklist_result.csv');
    }
    
    // 显示统计
    function showStats() {
      const total = auditData.length;
      const reviewed = auditData.filter(p => p.整体状态).length;
      const passed = auditData.filter(p => p.整体状态 === '通过').length;
      const needsEdit = auditData.filter(p => p.整体状态 === '需修改').length;
      const onHold = auditData.filter(p => p.整体状态 === '待补充').length;
      
      alert(\`
📊 审核统计

总项目数: \${total}
已审核: \${reviewed} / \${total} (\${((reviewed/total)*100).toFixed(1)}%)
待审核: \${total - reviewed}

✅ 已通过: \${passed}
🔧 需修改: \${needsEdit}
📦 待补充: \${onHold}
      \`);
    }
  </script>
</body>
</html>`;
}

const { auditPath, outputPath } = parseArgs();
generateHtmlReviewInterface(auditPath, outputPath);
