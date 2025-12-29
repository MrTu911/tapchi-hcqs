/**
 * API Scanner - Phân tích và phân loại API routes
 */

import fs from 'fs';
import path from 'path';

interface APIRoute {
  path: string;
  relativePath: string;
  methods: string[];
  hasAuth: boolean;
  hasLogger: boolean;
  hasErrorHandler: boolean;
  hasValidator: boolean;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
}

const API_DIR = path.join(process.cwd(), 'app/api');

function getPriority(routePath: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  if (routePath.includes('/auth/')) return 'CRITICAL';
  if (routePath.includes('/admin/')) return 'HIGH';
  if (routePath.includes('/submissions') || routePath.includes('/reviews')) return 'HIGH';
  if (routePath.includes('/editor/')) return 'HIGH';
  return 'MEDIUM';
}

function getCategory(routePath: string): string {
  if (routePath.includes('/auth/')) return 'Authentication';
  if (routePath.includes('/admin/')) return 'Admin';
  if (routePath.includes('/submissions')) return 'Submissions';
  if (routePath.includes('/reviews')) return 'Reviews';
  if (routePath.includes('/editor/')) return 'Editor';
  if (routePath.includes('/author/')) return 'Author';
  if (routePath.includes('/reviewer/')) return 'Reviewer';
  if (routePath.includes('/articles')) return 'Articles';
  if (routePath.includes('/issues')) return 'Issues';
  if (routePath.includes('/chat')) return 'Chat';
  return 'Other';
}

function scanFile(filePath: string): APIRoute | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(API_DIR, filePath);
    
    // Check methods
    const methods: string[] = [];
    if (content.includes('export async function GET')) methods.push('GET');
    if (content.includes('export async function POST')) methods.push('POST');
    if (content.includes('export async function PUT')) methods.push('PUT');
    if (content.includes('export async function DELETE')) methods.push('DELETE');
    if (content.includes('export async function PATCH')) methods.push('PATCH');
    
    if (methods.length === 0) return null;
    
    // Check security implementations
    const hasAuth = content.includes('requireAuth') || content.includes('getServerSession');
    const hasLogger = content.includes("from '@/lib/logger'");
    const hasErrorHandler = content.includes("from '@/lib/error-handler'");
    const hasValidator = content.includes("from '@/lib/validators'");
    
    return {
      path: filePath,
      relativePath,
      methods,
      hasAuth,
      hasLogger,
      hasErrorHandler,
      hasValidator,
      priority: getPriority(relativePath),
      category: getCategory(relativePath)
    };
  } catch (error) {
    console.error(`Error scanning ${filePath}:`, error);
    return null;
  }
}

function scanDirectory(dir: string): APIRoute[] {
  const routes: APIRoute[] = [];
  
  function walk(currentDir: string) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walk(filePath);
      } else if (file === 'route.ts') {
        const route = scanFile(filePath);
        if (route) routes.push(route);
      }
    }
  }
  
  walk(dir);
  return routes;
}

function generateReport(routes: APIRoute[]) {
  console.log('\n========================================');
  console.log('  API ROUTES SECURITY SCAN REPORT');
  console.log('========================================\n');
  
  // Overall stats
  const total = routes.length;
  const withAuth = routes.filter(r => r.hasAuth).length;
  const withLogger = routes.filter(r => r.hasLogger).length;
  const withErrorHandler = routes.filter(r => r.hasErrorHandler).length;
  const withValidator = routes.filter(r => r.hasValidator).length;
  
  console.log('Tổng quan:');
  console.log(`  Tổng số routes: ${total}`);
  console.log(`  Có Auth: ${withAuth} (${(withAuth/total*100).toFixed(1)}%)`);
  console.log(`  Có Logger: ${withLogger} (${(withLogger/total*100).toFixed(1)}%)`);
  console.log(`  Có Error Handler: ${withErrorHandler} (${(withErrorHandler/total*100).toFixed(1)}%)`);
  console.log(`  Có Validator: ${withValidator} (${(withValidator/total*100).toFixed(1)}%)`);
  
  // By category
  console.log('\nTheo chuyên mục:');
  const byCategory = routes.reduce((acc, route) => {
    if (!acc[route.category]) acc[route.category] = [];
    acc[route.category].push(route);
    return acc;
  }, {} as Record<string, APIRoute[]>);
  
  Object.entries(byCategory)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([category, catRoutes]) => {
      const secured = catRoutes.filter(r => r.hasAuth && r.hasLogger && r.hasErrorHandler).length;
      console.log(`  ${category}: ${catRoutes.length} routes (${secured} secured)`);
    });
  
  // By priority
  console.log('\nTheo ưu tiên:');
  const byPriority = routes.reduce((acc, route) => {
    if (!acc[route.priority]) acc[route.priority] = [];
    acc[route.priority].push(route);
    return acc;
  }, {} as Record<string, APIRoute[]>);
  
  ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].forEach(priority => {
    const prioRoutes = byPriority[priority] || [];
    if (prioRoutes.length > 0) {
      const secured = prioRoutes.filter(r => r.hasAuth && r.hasLogger && r.hasErrorHandler).length;
      console.log(`  ${priority}: ${prioRoutes.length} routes (${secured} secured)`);
    }
  });
  
  // Routes needing hardening
  console.log('\nRoutes CẦN hardening:');
  const needHardening = routes.filter(r => !r.hasAuth || !r.hasLogger || !r.hasErrorHandler);
  
  console.log(`\nTổng số: ${needHardening.length}/${total} routes\n`);
  
  // Group by priority
  ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].forEach(priority => {
    const prioRoutes = needHardening.filter(r => r.priority === priority);
    if (prioRoutes.length > 0) {
      console.log(`\n${priority} Priority (${prioRoutes.length} routes):`);
      prioRoutes.slice(0, 10).forEach(route => {
        console.log(`  - ${route.relativePath}`);
        console.log(`    Methods: ${route.methods.join(', ')}`);
        console.log(`    Missing: ${[
          !route.hasAuth ? 'Auth' : null,
          !route.hasLogger ? 'Logger' : null,
          !route.hasErrorHandler ? 'ErrorHandler' : null,
          !route.hasValidator ? 'Validator' : null
        ].filter(Boolean).join(', ')}`);
      });
      if (prioRoutes.length > 10) {
        console.log(`  ... và ${prioRoutes.length - 10} routes khác`);
      }
    }
  });
  
  // Save detailed report
  const reportPath = path.join(process.cwd(), 'scripts/hardening/scan-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total,
      withAuth,
      withLogger,
      withErrorHandler,
      withValidator
    },
    byCategory,
    byPriority,
    needHardening: needHardening.map(r => ({
      path: r.relativePath,
      category: r.category,
      priority: r.priority,
      missing: {
        auth: !r.hasAuth,
        logger: !r.hasLogger,
        errorHandler: !r.hasErrorHandler,
        validator: !r.hasValidator
      }
    }))
  }, null, 2));
  
  console.log(`\n\n✅ Chi tiết đã lưu tại: ${reportPath}\n`);
}

function main() {
  console.log('Scanning API routes...');
  const routes = scanDirectory(API_DIR);
  generateReport(routes);
}

main();
