// config/paths.config.js
// ⚠️ 重要：这个文件需要修改为你的实际路径！

export const CONFIG = {
  // 【必须修改】你的项目根目录
  BASE_DIR: "D:\\AI\\project\\0409",
  
  // 【可选】审核清单输出路径
  AUDIT_OUTPUT_DIR: "D:\\AI\\project\\0409",
  AUDIT_FILENAME: "00_audit_checklist.csv",
  
  // 【可选】HTML审核界面输出路径
  HTML_OUTPUT_DIR: "D:\\AI\\project\\0409",
  HTML_FILENAME: "review_interface.html",
  
  // 【可选】修改报告输出路径
  REPORT_OUTPUT_DIR: "D:\\AI\\project\\0409",
  REPORT_FILENAME: "update_report.csv",
  
  // 【可选】数据库版本
  DATABASE_VERSION: "case_database_21_batch11_expanded",
};

// 快速获取完整路径的辅助函数
export function getPath(type) {
  const paths = {
    audit: `${CONFIG.AUDIT_OUTPUT_DIR}\\${CONFIG.AUDIT_FILENAME}`,
    html: `${CONFIG.HTML_OUTPUT_DIR}\\${CONFIG.HTML_FILENAME}`,
    report: `${CONFIG.REPORT_OUTPUT_DIR}\\${CONFIG.REPORT_FILENAME}`,
    index: `${CONFIG.BASE_DIR}\\${CONFIG.DATABASE_VERSION}\\02_indexes\\case_database_index.csv`,
    database: `${CONFIG.BASE_DIR}\\${CONFIG.DATABASE_VERSION}`,
  };
  return paths[type] || paths.audit;
}
