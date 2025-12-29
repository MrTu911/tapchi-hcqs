/**
 * Security Dashboard Generator
 * Tạo HTML dashboard để hiển thị tiến độ hardening
 */

import fs from 'fs';
import path from 'path';

const LOGS_DIR = path.join(process.cwd(), 'logs');
const OUTPUT_PATH = path.join(LOGS_DIR, 'security-dashboard.html');

// Find latest scan report
function getLatestReport() {
  const files = fs.readdirSync(LOGS_DIR)
    .filter(f => f.startsWith('security-scan-') && f.endsWith('.json'))
    .sort()
    .reverse();
  
  if (files.length === 0) {
    throw new Error('No security scan reports found. Run: yarn tsx scripts/diagnostics/security-scan.ts');
  }
  
  const reportPath = path.join(LOGS_DIR, files[0]);
  return JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
}

function generateHTML(report: any) {
  const { summary, modules, priorities } = report;
  const timestamp = new Date(report.timestamp).toLocaleString('vi-VN');
  
  // Calculate overall percentage
  const fullPercent = Math.round((summary.full / summary.total) * 100);
  const partialPercent = Math.round((summary.partial / summary.total) * 100);
  const basicPercent = Math.round((summary.basic / summary.total) * 100);
  const nonePercent = Math.round((summary.none / summary.total) * 100);
  
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Dashboard - Tạp chí HCQS</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #1e3a2e 0%, #2d5016 100%);
      color: #333;
      padding: 20px;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #1e3a2e 0%, #2d5016 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
    }
    
    .header p {
      opacity: 0.9;
      font-size: 1.1em;
    }
    
    .content {
      padding: 30px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    
    .stat-card {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 25px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }
    
    .stat-card:hover {
      transform: translateY(-5px);
    }
    
    .stat-card.full {
      background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
      border-left: 4px solid #28a745;
    }
    
    .stat-card.partial {
      background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
      border-left: 4px solid #17a2b8;
    }
    
    .stat-card.basic {
      background: linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%);
      border-left: 4px solid #ffc107;
    }
    
    .stat-card.none {
      background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
      border-left: 4px solid #dc3545;
    }
    
    .stat-number {
      font-size: 3em;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .stat-label {
      font-size: 1.1em;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.8;
    }
    
    .progress-bar {
      width: 100%;
      height: 40px;
      background: #e9ecef;
      border-radius: 20px;
      overflow: hidden;
      margin: 30px 0;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .progress-segment {
      height: 100%;
      float: left;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      transition: width 1s ease;
    }
    
    .progress-full { background: #28a745; }
    .progress-partial { background: #17a2b8; }
    .progress-basic { background: #ffc107; color: #333; }
    .progress-none { background: #dc3545; }
    
    .section {
      margin-bottom: 40px;
    }
    
    .section h2 {
      font-size: 1.8em;
      margin-bottom: 20px;
      color: #1e3a2e;
      border-bottom: 3px solid #2d5016;
      padding-bottom: 10px;
    }
    
    .module-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }
    
    .module-card {
      border: 2px solid #dee2e6;
      border-radius: 8px;
      padding: 20px;
      background: white;
    }
    
    .module-card.excellent { border-color: #28a745; }
    .module-card.good { border-color: #17a2b8; }
    .module-card.fair { border-color: #ffc107; }
    .module-card.needs-work { border-color: #dc3545; }
    
    .module-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    
    .module-name {
      font-size: 1.4em;
      font-weight: bold;
      color: #1e3a2e;
    }
    
    .module-status {
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 0.9em;
      font-weight: bold;
    }
    
    .module-status.excellent { background: #d4edda; color: #155724; }
    .module-status.good { background: #d1ecf1; color: #0c5460; }
    .module-status.fair { background: #fff3cd; color: #856404; }
    .module-status.needs-work { background: #f8d7da; color: #721c24; }
    
    .module-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-top: 15px;
    }
    
    .module-stat {
      font-size: 0.9em;
    }
    
    .module-stat strong {
      display: block;
      font-size: 1.5em;
      color: #2d5016;
    }
    
    .priority-list {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
    }
    
    .priority-section {
      margin-bottom: 20px;
    }
    
    .priority-section h3 {
      margin-bottom: 10px;
      font-size: 1.2em;
    }
    
    .priority-section ul {
      list-style: none;
      padding-left: 0;
    }
    
    .priority-section li {
      padding: 8px 12px;
      background: white;
      margin-bottom: 5px;
      border-radius: 4px;
      border-left: 4px solid #6c757d;
      font-family: monospace;
      font-size: 0.9em;
    }
    
    .priority-section.critical li { border-color: #dc3545; }
    .priority-section.high li { border-color: #fd7e14; }
    .priority-section.medium li { border-color: #ffc107; }
    .priority-section.low li { border-color: #28a745; }
    
    .footer {
      text-align: center;
      padding: 20px;
      background: #f8f9fa;
      color: #6c757d;
      font-size: 0.9em;
    }
    
    @media print {
      body {
        background: white;
      }
      .stat-card:hover {
        transform: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔒 Security Dashboard</h1>
      <p>Tạp chí Điện tử Khoa học Hậu cần Quân sự</p>
      <p style="font-size: 0.9em; margin-top: 10px;">Cập nhật: ${timestamp}</p>
    </div>
    
    <div class="content">
      <!-- Overall Stats -->
      <div class="section">
        <h2>📊 Tổng quan</h2>
        <div class="stats-grid">
          <div class="stat-card full">
            <div class="stat-number">${summary.full}</div>
            <div class="stat-label">✅ Full Hardening</div>
            <div style="font-size: 0.9em; margin-top: 10px;">${fullPercent}%</div>
          </div>
          <div class="stat-card partial">
            <div class="stat-number">${summary.partial}</div>
            <div class="stat-label">🟢 Partial</div>
            <div style="font-size: 0.9em; margin-top: 10px;">${partialPercent}%</div>
          </div>
          <div class="stat-card basic">
            <div class="stat-number">${summary.basic}</div>
            <div class="stat-label">🟡 Basic</div>
            <div style="font-size: 0.9em; margin-top: 10px;">${basicPercent}%</div>
          </div>
          <div class="stat-card none">
            <div class="stat-number">${summary.none}</div>
            <div class="stat-label">🔴 None</div>
            <div style="font-size: 0.9em; margin-top: 10px;">${nonePercent}%</div>
          </div>
        </div>
        
        <div class="progress-bar">
          ${fullPercent > 0 ? `<div class="progress-segment progress-full" style="width: ${fullPercent}%">${fullPercent}%</div>` : ''}
          ${partialPercent > 0 ? `<div class="progress-segment progress-partial" style="width: ${partialPercent}%">${partialPercent}%</div>` : ''}
          ${basicPercent > 0 ? `<div class="progress-segment progress-basic" style="width: ${basicPercent}%">${basicPercent}%</div>` : ''}
          ${nonePercent > 0 ? `<div class="progress-segment progress-none" style="width: ${nonePercent}%">${nonePercent}%</div>` : ''}
        </div>
      </div>
      
      <!-- Module Breakdown -->
      <div class="section">
        <h2>📦 Chi tiết theo Module</h2>
        <div class="module-grid">
          ${Object.entries(modules).map(([name, stats]: [string, any]) => {
            const statusClass = stats.status.includes('EXCELLENT') ? 'excellent' :
                               stats.status.includes('GOOD') ? 'good' :
                               stats.status.includes('FAIR') ? 'fair' : 'needs-work';
            return `
            <div class="module-card ${statusClass}">
              <div class="module-header">
                <div class="module-name">${name}</div>
                <div class="module-status ${statusClass}">${stats.avgScore}/100</div>
              </div>
              <div class="module-stats">
                <div class="module-stat">
                  Tổng routes
                  <strong>${stats.total}</strong>
                </div>
                <div class="module-stat">
                  Coverage
                  <strong>${stats.coverage}%</strong>
                </div>
                <div class="module-stat">
                  ✅ Full
                  <strong>${stats.full}</strong>
                </div>
                <div class="module-stat">
                  🔴 None
                  <strong>${stats.none}</strong>
                </div>
              </div>
            </div>
            `;
          }).join('')}
        </div>
      </div>
      
      <!-- Priority List -->
      <div class="section">
        <h2>🎯 Priority Action List</h2>
        <div class="priority-list">
          ${Object.entries(priorities).map(([priority, routes]: [string, any]) => {
            if (routes.length === 0) return '';
            const priorityClass = priority.includes('CRITICAL') ? 'critical' :
                                 priority.includes('HIGH') ? 'high' :
                                 priority.includes('MEDIUM') ? 'medium' : 'low';
            const displayRoutes = routes.slice(0, 10);
            return `
            <div class="priority-section ${priorityClass}">
              <h3>${priority} (${routes.length} routes)</h3>
              <ul>
                ${displayRoutes.map((route: string) => `<li>${route}</li>`).join('')}
                ${routes.length > 10 ? `<li style="font-style: italic; opacity: 0.7;">... và ${routes.length - 10} routes khác</li>` : ''}
              </ul>
            </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p>Generated by Security Scanner | Tạp chí Khoa học Hậu cần Quân sự</p>
      <p style="margin-top: 10px;">🔄 To update: <code>yarn tsx scripts/diagnostics/security-scan.ts && yarn tsx scripts/diagnostics/security-dashboard.ts</code></p>
    </div>
  </div>
</body>
</html>`;
}

try {
  const report = getLatestReport();
  const html = generateHTML(report);
  
  fs.writeFileSync(OUTPUT_PATH, html);
  
  console.log('\n✅ Security Dashboard generated!');
  console.log(`💾 Saved to: ${OUTPUT_PATH}`);
  console.log(`🌐 Open in browser: file://${OUTPUT_PATH}\n`);
  
} catch (error: any) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
