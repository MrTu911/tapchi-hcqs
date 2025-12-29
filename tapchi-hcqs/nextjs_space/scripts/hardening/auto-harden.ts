/**
 * Auto Hardening Script
 * Tự động cập nhật API routes với security best practices
 */

import fs from 'fs';
import path from 'path';

const API_DIR = path.join(process.cwd(), 'app/api');
const DRY_RUN = process.env.DRY_RUN === 'true';

interface HardeningResult {
  filePath: string;
  modified: boolean;
  changes: string[];
  errors: string[];
}

const results: HardeningResult[] = [];

/**
 * Check if file already has required imports
 */
function hasImport(content: string, importName: string): boolean {
  const importRegex = new RegExp(`import.*${importName}.*from`);
  return importRegex.test(content);
}

/**
 * Check if file has handleApiError in catch blocks
 */
function hasHandleApiError(content: string): boolean {
  return content.includes('handleApiError(');
}

/**
 * Check if file has logger calls
 */
function hasLogger(content: string): boolean {
  return content.includes('logger.');
}

/**
 * Add missing imports at the top of file
 */
function addImports(content: string): { content: string; added: string[] } {
  const added: string[] = [];
  let lines = content.split('\n');
  
  // Find the last import line
  let lastImportIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIndex = i;
    }
  }
  
  if (lastImportIndex === -1) {
    // No imports found, add after first line (usually a comment or blank)
    lastImportIndex = 0;
  }
  
  const importsToAdd: string[] = [];
  
  // Check and add handleApiError
  if (!hasImport(content, 'handleApiError')) {
    importsToAdd.push("import { handleApiError } from '@/lib/error-handler';");
    added.push('handleApiError');
  }
  
  // Check and add logger
  if (!hasImport(content, 'logger')) {
    importsToAdd.push("import { logger } from '@/lib/logger';");
    added.push('logger');
  }
  
  // Insert imports after last import
  if (importsToAdd.length > 0) {
    lines.splice(lastImportIndex + 1, 0, ...importsToAdd);
  }
  
  return {
    content: lines.join('\n'),
    added
  };
}

/**
 * Add JSDoc comment before function if missing
 */
function addJSDoc(content: string, method: string, endpoint: string): string {
  const functionRegex = new RegExp(`export async function ${method}`, 'g');
  
  if (!functionRegex.test(content)) {
    return content; // Function not found
  }
  
  // Check if JSDoc already exists
  const jsDocRegex = /\/\*\*[\s\S]*?\*\/\s*export async function/;
  if (jsDocRegex.test(content)) {
    return content; // JSDoc already exists
  }
  
  // Add JSDoc
  const jsDoc = `/**
 * ${method} ${endpoint}
 * Mô tả: API endpoint
 * Auth: Tùy chỉnh
 */
`;
  
  return content.replace(
    `export async function ${method}`,
    `${jsDoc}export async function ${method}`
  );
}

/**
 * Add logger.info at start of function
 */
function addRequestLogging(content: string, method: string, context: string): string {
  // Find the try block
  const tryRegex = new RegExp(
    `export async function ${method}[^{]*{[^}]*try\\s*{`,
    's'
  );
  
  const match = content.match(tryRegex);
  if (!match) {
    return content; // No try block found
  }
  
  // Check if logging already exists
  if (content.includes('logger.info(') || content.includes('logger.debug(')) {
    return content; // Logging already exists
  }
  
  // Add logging after try {
  const logStatement = `\n    // Log request\n    logger.info('${method} request', {\n      context: '${context}'\n    });\n`;
  
  return content.replace(
    /try\s*{/,
    `try {${logStatement}`
  );
}

/**
 * Replace catch block error handling
 */
function replaceErrorHandling(content: string, context: string): string {
  // Pattern: catch (error) { ... return ... }
  const catchRegex = /catch\s*\([^)]*\)\s*{([^}]*(?:{[^}]*}[^}]*)*)}/g;
  
  let modified = content;
  let match;
  
  while ((match = catchRegex.exec(content)) !== null) {
    const catchBlock = match[0];
    const catchBody = match[1];
    
    // Skip if already using handleApiError
    if (catchBlock.includes('handleApiError')) {
      continue;
    }
    
    // Replace with standardized error handling
    const newCatchBlock = `catch (error) {
    // Log error
    logger.error('Request failed', {
      context: '${context}',
      error: error instanceof Error ? error.message : String(error)
    });
    
    return handleApiError(error, '${context}');
  }`;
    
    modified = modified.replace(catchBlock, newCatchBlock);
  }
  
  return modified;
}

/**
 * Get context name from file path
 */
function getContext(filePath: string): string {
  const relativePath = path.relative(API_DIR, filePath);
  const parts = relativePath.split(path.sep).filter(p => p !== 'route.ts');
  return 'API_' + parts.map(p => p.toUpperCase().replace(/[^A-Z0-9]/g, '_')).join('_');
}

/**
 * Get endpoint from file path
 */
function getEndpoint(filePath: string): string {
  const relativePath = path.relative(API_DIR, filePath);
  const parts = relativePath.split(path.sep).filter(p => p !== 'route.ts');
  return '/api/' + parts.join('/');
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
 * Harden a single route file
 */
function hardenRoute(filePath: string): HardeningResult {
  const result: HardeningResult = {
    filePath,
    modified: false,
    changes: [],
    errors: []
  };
  
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    const context = getContext(filePath);
    const endpoint = getEndpoint(filePath);
    const methods = detectMethods(content);
    
    if (methods.length === 0) {
      result.errors.push('No HTTP methods found');
      return result;
    }
    
    // 1. Add imports
    const { content: contentWithImports, added } = addImports(content);
    if (added.length > 0) {
      content = contentWithImports;
      result.changes.push(`Added imports: ${added.join(', ')}`);
    }
    
    // 2. Add JSDoc for each method
    methods.forEach(method => {
      const before = content;
      content = addJSDoc(content, method, endpoint);
      if (content !== before) {
        result.changes.push(`Added JSDoc for ${method}`);
      }
    });
    
    // 3. Add request logging
    if (!hasLogger(content)) {
      methods.forEach(method => {
        const before = content;
        content = addRequestLogging(content, method, context);
        if (content !== before) {
          result.changes.push(`Added logging for ${method}`);
        }
      });
    }
    
    // 4. Replace error handling
    if (!hasHandleApiError(content)) {
      const before = content;
      content = replaceErrorHandling(content, context);
      if (content !== before) {
        result.changes.push('Replaced error handling');
      }
    }
    
    // Check if any changes were made
    if (content !== originalContent) {
      result.modified = true;
      
      if (!DRY_RUN) {
        // Write back to file
        fs.writeFileSync(filePath, content, 'utf-8');
      }
    }
    
  } catch (error: any) {
    result.errors.push(error.message);
  }
  
  return result;
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
 * Main execution
 */
function main() {
  console.log('\n========================================');
  console.log('  AUTO HARDENING SCRIPT');
  console.log('========================================\n');
  
  if (DRY_RUN) {
    console.log('🟡 DRY RUN MODE - No files will be modified\n');
  }
  
  console.log('Scanning API routes...');
  const routeFiles = scanDirectory(API_DIR);
  console.log(`Found ${routeFiles.length} route files\n`);
  
  console.log('Hardening routes...');
  let processed = 0;
  let modified = 0;
  let errors = 0;
  
  for (const file of routeFiles) {
    const relativePath = path.relative(API_DIR, file);
    process.stdout.write(`\r[${++processed}/${routeFiles.length}] ${relativePath}`);
    
    const result = hardenRoute(file);
    results.push(result);
    
    if (result.modified) modified++;
    if (result.errors.length > 0) errors++;
  }
  
  console.log('\n\n========================================');
  console.log('  SUMMARY');
  console.log('========================================\n');
  
  console.log(`✅ Total routes processed: ${processed}`);
  console.log(`✅ Routes modified: ${modified}`);
  console.log(`❌ Routes with errors: ${errors}`);
  console.log(`🟢 Routes unchanged: ${processed - modified - errors}`);
  
  // Show detailed changes
  console.log('\n========================================');
  console.log('  DETAILED CHANGES');
  console.log('========================================\n');
  
  const modifiedRoutes = results.filter(r => r.modified);
  modifiedRoutes.slice(0, 10).forEach(result => {
    const relativePath = path.relative(API_DIR, result.filePath);
    console.log(`\n✅ ${relativePath}`);
    result.changes.forEach(change => {
      console.log(`   - ${change}`);
    });
  });
  
  if (modifiedRoutes.length > 10) {
    console.log(`\n... and ${modifiedRoutes.length - 10} more routes\n`);
  }
  
  // Show errors
  if (errors > 0) {
    console.log('\n========================================');
    console.log('  ERRORS');
    console.log('========================================\n');
    
    const errorRoutes = results.filter(r => r.errors.length > 0);
    errorRoutes.forEach(result => {
      const relativePath = path.relative(API_DIR, result.filePath);
      console.log(`\n❌ ${relativePath}`);
      result.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    });
  }
  
  // Save report
  const reportPath = path.join(process.cwd(), 'scripts/hardening/auto-harden-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    dryRun: DRY_RUN,
    summary: {
      total: processed,
      modified,
      errors,
      unchanged: processed - modified - errors
    },
    results
  }, null, 2));
  
  console.log(`\n\n✅ Report saved: ${reportPath}\n`);
  
  if (DRY_RUN) {
    console.log('🟡 This was a DRY RUN - no files were actually modified');
    console.log('Run without DRY_RUN=true to apply changes\n');
  } else {
    console.log('✅ All changes have been applied!');
    console.log('Next steps:');
    console.log('  1. Review changes with: git diff');
    console.log('  2. Test the application');
    console.log('  3. Commit if everything works\n');
  }
}

main();
