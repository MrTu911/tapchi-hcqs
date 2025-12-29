/**
 * Health Check Endpoint
 * For monitoring system health in internal military network
 * Can be used with cron jobs for auto-restart
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: {
      status: 'ok' | 'error';
      message?: string;
      latency?: number;
    };
    memory: {
      status: 'ok' | 'warning' | 'critical';
      usage: {
        used: number;
        total: number;
        percentage: number;
      };
    };
    disk?: {
      status: 'ok' | 'warning' | 'critical';
      usage?: {
        used: number;
        total: number;
        percentage: number;
      };
    };
  };
  version?: string;
  environment?: string;
}

/**
 * Check database connectivity and latency
 */
async function checkDatabase(): Promise<HealthStatus['checks']['database']> {
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1 as health`;
    const latency = Date.now() - startTime;

    return {
      status: 'ok',
      latency,
      message: `Connected (${latency}ms)`,
    };
  } catch (error) {
    logger.error({
      context: 'HEALTH_CHECK',
      check: 'database',
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Database connection failed',
    };
  }
}

/**
 * Check memory usage
 */
function checkMemory(): HealthStatus['checks']['memory'] {
  const usage = process.memoryUsage();
  const totalMemory = usage.heapTotal;
  const usedMemory = usage.heapUsed;
  const percentage = (usedMemory / totalMemory) * 100;

  let status: 'ok' | 'warning' | 'critical' = 'ok';
  if (percentage > 90) {
    status = 'critical';
  } else if (percentage > 75) {
    status = 'warning';
  }

  return {
    status,
    usage: {
      used: Math.round(usedMemory / 1024 / 1024), // MB
      total: Math.round(totalMemory / 1024 / 1024), // MB
      percentage: Math.round(percentage * 100) / 100,
    },
  };
}

/**
 * GET /api/health
 * Returns comprehensive health status
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Parallel health checks
    const [dbCheck, memCheck] = await Promise.all([
      checkDatabase(),
      Promise.resolve(checkMemory()),
    ]);

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (dbCheck.status === 'error') {
      overallStatus = 'unhealthy';
    } else if (memCheck.status === 'critical') {
      overallStatus = 'unhealthy';
    } else if (memCheck.status === 'warning' || (dbCheck.latency && dbCheck.latency > 1000)) {
      overallStatus = 'degraded';
    }

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: dbCheck,
        memory: memCheck,
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'production',
    };

    const responseTime = Date.now() - startTime;

    // Log health check
    if (overallStatus !== 'healthy') {
      logger.warn({
        context: 'HEALTH_CHECK',
        status: overallStatus,
        responseTime,
        ...healthStatus.checks,
      });
    }

    // Return appropriate status code
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(healthStatus, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${responseTime}ms`,
      },
    });
  } catch (error) {
    logger.error({
      context: 'HEALTH_CHECK',
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 503 }
    );
  }
}

/**
 * HEAD /api/health
 * Quick health check (no body)
 */
export async function HEAD(req: NextRequest) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
