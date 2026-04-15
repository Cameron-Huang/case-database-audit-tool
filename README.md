# 案例数据库审核工具 🎯

自动化声学项目案例库的审核流程。快速生成审核清单、应用修改、生成报告。

## 🚀 快速开始

### 前置条件

- Node.js 14+（[下载](https://nodejs.org)）
- Windows/Mac/Linux
- 已安装 WPS Office（用于编辑Excel）

### 安装

```bash
# 1. 克隆仓库
git clone https://github.com/cameron-huang/case-database-audit-tool.git
cd case-database-audit-tool

# 2. 安装依赖
npm install

# 3. 配置路径（重要！）
编辑 config/paths.config.js，修改以下路径为你的实际路径：
BASE_DIR = 你的项目目录（例如 D:\AI\project\0409）
