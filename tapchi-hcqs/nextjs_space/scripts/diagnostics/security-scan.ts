/**
 * Security Scanner Script
 * Quét tự động tất cả API routes và kiểm tra hardening status
 * Sử dụng: yarn tsx scripts/diagnostics/security-scan.ts
 */

import fs from 'fs';
import path from 'path';

const API_DIR = path.join(process.cwd(), 'app/api');
const OUTPUT_DIR = path.join(process.cwd(), 'logs');

// Module definitions
const MODULES = {
  'Auth': ['auth/**'],
  'Submissions': ['submissions/**', 'author/submissions/**'],
  'Reviews': ['reviews/**', 'reviewer/**'],
  'Admin': ['admin/**'],
  'Editor': ['editor/**'],
  'Articles': ['articles/**', 'public/articles/**'],
  'Issues': ['issues/**'],
  'Users': ['users/**'],
  'Categories': ['categories/**'],
  'Keywords': ['keywords/**'],
  'Files': ['files/**'],
  'Chat': ['chat/**', 'messages/**'],
  'Comments': ['comments/**'],
  'Statistics': ['statistics/**'],
  'Search': ['search/**'],
  'Other': ['**']
};

// Security check criteria
interface SecurityCheck {
  hasHandleError: boolean;
  hasLogger: boolean;
  hasApiGuards: boolean;
  hasValidator: boolean;
  hasTryCatch: boolean;
}

interface RouteInfo {
  filePath: string;
  relativePath: string;
  module: string;
  methods: string[];
  security: SecurityCheck;
  score: number; // 0-100
  status: 'FULL' | 'PARTIAL' | 'BASIC' | 'NONE';
}

const results: RouteInfo[] = [];

/**
 * Check if file has specific import
 */
function hasImport(content: string, importName: string): boolean {
  const importRegex = new RegExp(`import.*${importName}.*from`);
  return importRegex.test(content);
}

/**
 * Check if file uses specific function
 */
function usesFunction(content: string, functionName: string): boolean {
  return content.includes(`${functionName}(`);
}

/**
 * Detect HTTP methods in file
 */
function detectMethods(content: string): string[] {
  const methods: string[] = [];
  if (content.includes('export async function GET')) methods.push('GET');
  if (content.includes('export async function POST')) methods.push('POST');
  if (content.includes('export async function PUT')) methods.push('PUT');
  if (content.includes('export async function DELETE')) methods.push('DELETE');
  if (content.includes('export async function PATCH')) methods.push('PATCH');
  return methods;
}

/**
 * Determine module from file path
 */
function getModule(relativePath: string): string {
  for (const [moduleName, patterns] of Object.entries(MODULES)) {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.replace('**', '.*').replace('*', '[^/]*'));
      if (regex.test(relativePath)) {
        if (moduleName === 'Other') continue; // Try other modules first
        return moduleName;
      }
    }
  }
  return 'Other';
}

/**
 * Analyze security of a route file
 */
function analyzeRoute(filePath: string): RouteInfo {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(API_DIR, filePath);
  const module = getModule(relativePath);
  const methods = detectMethods(content);
  
  // Check security measures
  const security: SecurityCheck = {
    hasHandleError: hasImport(content, 'handleError') || hasImport(content, 'handleApiError'),
    hasLogger: hasImport(content, 'logger') && usesFunction(content, 'logger.'),
    hasApiGuards: hasImport(content, 'requireAuth') || hasImport(content, 'requireRole') || hasImport(content, 'api-guards'),
    hasValidator: hasImport(content, 'z.') || hasImport(content, 'zodResolver') || content.includes('Schema'),
    hasTryCatch: content.includes('try {') && content.includes('} catch')
  };
  
  // Calculate security score
  let score = 0;
  if (security.hasHandleError) score += 30;
  if (security.hasLogger) score += 25;
  if (security.hasApiGuards) score += 20;
  if (security.hasValidator) score += 15;
  if (security.hasTryCatch) score += 10;
  
  // Determine status
  let status: 'FULL' | 'PARTIAL' | 'BASIC' | 'NONE';
  if (score >= 90) status = 'FULL';
  else if (score >= 60) status = 'PARTIAL';
  else if (score >= 30) status = 'BASIC';
  else status = 'NONE';
  
  return {
    filePath,
    relativePath,
    module,
    methods,
    security,
    score,
    status
  };
}

/**
 * Scan directory recursively
 */
function scanDirectory(dir: string): string[] {
  const files: string[] = [];
  
  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir);
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (entry === 'route.ts') {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

/**
 * Generate module summary
 */
function getModuleSummary() {
  const summary: Record<string, any> = {};
  
  for (const moduleName of Object.keys(MODULES)) {
    const moduleRoutes = results.filter(r => r.module === moduleName);
    if (moduleRoutes.length === 0) continue;
    
    const total = moduleRoutes.length;
    const full = moduleRoutes.filter(r => r.status === 'FULL').length;
    const partial = moduleRoutes.filter(r => r.status === 'PARTIAL').length;
    const basic = moduleRoutes.filter(r => r.status === 'BASIC').length;
    const none = moduleRoutes.filter(r => r.status === 'NONE').length;
    
    const avgScore = Math.round(
      moduleRoutes.reduce((sum, r) => sum + r.score, 0) / total
    );
    
    summary[moduleName] = {
      total,
      full,
      partial,
      basic,
      none,
      avgScore,
      coverage: Math.round((full / total) * 100),
      status: avgScore >= 90 ? '✅ EXCELLENT' :
              avgScore >= 70 ? '🟢 GOOD' :
              avgScore >= 50 ? '🟡 FAIR' :
              '🔴 NEEDS WORK'
    };
  }
  
  return summary;
}

/**
 * Generate priority list
 */
function getPriorityList() {
  const priorities: Record<string, string[]> = {
    '🔴 CRITICAL': [],
    '🟠 HIGH': [],
    '🟡 MEDIUM': [],
    '🟢 LOW': []
  };
  
  for (const route of results) {
    if (route.status === 'NONE') {
      if (['Auth', 'Admin', 'Submissions'].includes(route.module)) {
        priorities['🔴 CRITICAL'].push(route.relativePath);
      } else if (['Reviews', 'Editor', 'Users'].includes(route.module)) {
        priorities['🟠 HIGH'].push(route.relativePath);
      } else {
        priorities['🟡 MEDIUM'].push(route.relativePath);
      }
    } else if (route.status === 'BASIC') {
      priorities['🟡 MEDIUM'].push(route.relativePath);
    } else if (route.status === 'PARTIAL') {
      priorities['🟢 LOW'].push(route.relativePath);
    }
  }
  
  return priorities;
}

/**
 * Generate console report
 */
function printConsoleReport() {
  console.log('\n========================================');
  console.log('  SECURITY SCAN REPORT');
  console.log('========================================\n');
  
  console.log(`📋 Scanned: ${results.length} API routes`);
  console.log(`⏰ Time: ${new Date().toLocaleString('vi-VN')}\n`);
  
  // Overall statistics
  const full = results.filter(r => r.status === 'FULL').length;
  const partial = results.filter(r => r.status === 'PARTIAL').length;
  const basic = results.filter(r => r.status === 'BASIC').length;
  const none = results.filter(r => r.status === 'NONE').length;
  
  console.log('========================================');
  console.log('  OVERALL STATUS');
  console.log('========================================\n');
  
  console.log(`✅ FULL Hardening:    ${full} routes (${Math.round((full/results.length)*100)}%)`);
  console.log(`🟢 PARTIAL Hardening: ${partial} routes (${Math.round((partial/results.length)*100)}%)`);
  console.log(`🟡 BASIC Protection:  ${basic} routes (${Math.round((basic/results.length)*100)}%)`);
  console.log(`🔴 NONE:              ${none} routes (${Math.round((none/results.length)*100)}%)`);
  
  // Module summary
  const moduleSummary = getModuleSummary();
  
  console.log('\n========================================');
  console.log('  MODULE BREAKDOWN');
  console.log('========================================\n');
  
  for (const [moduleName, stats] of Object.entries(moduleSummary)) {
    console.log(`${stats.status} ${moduleName}`);
    console.log(`   Total: ${stats.total} | Full: ${stats.full} | Partial: ${stats.partial} | Basic: ${stats.basic} | None: ${stats.none}`);
    console.log(`   Average Score: ${stats.avgScore}/100 | Coverage: ${stats.coverage}%\n`);
  }
  
  // Priority list
  const priorities = getPriorityList();
  
  console.log('========================================');
  console.log('  PRIORITY ACTION LIST');
  console.log('========================================\n');
  
  for (const [priority, routes] of Object.entries(priorities)) {
    if (routes.length === 0) continue;
    console.log(`${priority} (${routes.length} routes)`);
    routes.slice(0, 5).forEach(route => {
      console.log(`   - ${route}`);
    });
    if (routes.length > 5) {
      console.log(`   ... và ${routes.length - 5} routes khác\n`);
    } else {
      console.log('');
    }
  }
  
  console.log('========================================');
  console.log('  RECOMMENDATIONS');
  console.log('========================================\n');
  
  if (none > 0) {
    console.log(`⚠️  Bạn có ${none} routes chưa có hardening.`);
    console.log(`   ➡️  Ưu tiên: ${priorities['🔴 CRITICAL'].length} CRITICAL routes`);
  }
  
  if (basic > 0) {
    console.log(`🟡 Bạn có ${basic} routes chỉ có basic protection.`);
    console.log(`   ➡️  Nên thêm logger và error handler`);
  }
  
  if (partial > 0) {
    console.log(`🟢 Bạn có ${partial} routes đang partial hardening.`);
    console.log(`   ➡️  Kiểm tra thêm validator và guards`);
  }
  
  if (full === results.length) {
    console.log(`✅ Tất cả ${full} routes đã được hardening đầy đủ!`);
  }
  
  console.log('\n========================================\n');
}

/**
 * Save detailed report to file
 */
function saveReport() {
  // Create logs directory if not exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(OUTPUT_DIR, `security-scan-${timestamp}.json`);
  const summaryPath = path.join(OUTPUT_DIR, 'security-scan-latest.txt');
  
  // Save JSON report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      full: results.filter(r => r.status === 'FULL').length,
      partial: results.filter(r => r.status === 'PARTIAL').length,
      basic: results.filter(r => r.status === 'BASIC').length,
      none: results.filter(r => r.status === 'NONE').length
    },
    modules: getModuleSummary(),
    priorities: getPriorityList(),
    routes: results
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`💾 JSON Report saved: ${reportPath}`);
  
  // Save text summary
  let summary = `SECURITY SCAN SUMMARY\n`;
  summary += `Generated: ${new Date().toLocaleString('vi-VN')}\n`;
  summary += `Total Routes: ${results.length}\n\n`;
  summary += `FULL: ${report.summary.full}\n`;
  summary += `PARTIAL: ${report.summary.partial}\n`;
  summary += `BASIC: ${report.summary.basic}\n`;
  summary += `NONE: ${report.summary.none}\n\n`;
  summary += `Overall Coverage: ${Math.round((report.summary.full/results.length)*100)}%\n`;
  
  fs.writeFileSync(summaryPath, summary);
  console.log(`💾 Text Summary saved: ${summaryPath}\n`);
}

/**
 * Main execution
 */
function main() {
  console.log('\n🔍 Starting security scan...\n');
  
  // Scan all routes
  const routeFiles = scanDirectory(API_DIR);
  
  for (const file of routeFiles) {
    const routeInfo = analyzeRoute(file);
    results.push(routeInfo);
  }
  
  // Print report
  printConsoleReport();
  
  // Save report
  saveReport();
  
  // Exit with appropriate code
  const criticalIssues = results.filter(r => 
    r.status === 'NONE' && ['Auth', 'Admin', 'Submissions'].includes(r.module)
  ).length;
  
  if (criticalIssues > 0) {
    console.log(`⚠️  WARNING: ${criticalIssues} CRITICAL routes chưa hardening!\n`);
    process.exit(1);
  }
}

main();
