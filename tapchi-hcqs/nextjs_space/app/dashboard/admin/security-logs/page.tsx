
'use client'

/**
 * ✅ Phase 2: Security Logs Viewer Page
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, Download, Filter, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface AuditLog {
  id: string
  action: string
  object: string
  ip: string | null
  createdAt: string
  actor: {
    fullName: string
    email: string
    role: string
  } | null
}

export default function SecurityLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })
  const [filters, setFilters] = useState({
    action: '',
    search: '',
    fromDate: '',
    toDate: ''
  })
  const [availableActions, setAvailableActions] = useState<string[]>([])

  useEffect(() => {
    fetchLogs()
  }, [pagination.page])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.action && { action: filters.action }),
        ...(filters.search && { search: filters.search }),
        ...(filters.fromDate && { fromDate: filters.fromDate }),
        ...(filters.toDate && { toDate: filters.toDate })
      })

      const res = await fetch(`/api/audit-logs?${params}`)
      
      if (!res.ok) {
        throw new Error('Failed to fetch logs')
      }

      const data = await res.json()
      setLogs(data.logs)
      setPagination(data.pagination)
      if (data.filters?.actions) {
        setAvailableActions(data.filters.actions)
      }
    } catch (error: any) {
      toast.error('Không thể tải logs: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFilter = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchLogs()
  }

  const handleReset = () => {
    setFilters({
      action: '',
      search: '',
      fromDate: '',
      toDate: ''
    })
    setPagination(prev => ({ ...prev, page: 1 }))
    setTimeout(fetchLogs, 100)
  }

  const handleExport = async () => {
    toast.info('Export functionality coming soon')
  }

  const getActionColor = (action: string) => {
    if (action.includes('SUCCESS') || action.includes('CREATED')) return 'default'
    if (action.includes('FAILED') || action.includes('DENIED') || action.includes('DELETED')) return 'destructive'
    if (action.includes('UPDATED') || action.includes('CHANGED')) return 'secondary'
    return 'outline'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Logs</h1>
        <p className="text-muted-foreground">
          Xem và phân tích nhật ký hoạt động hệ thống
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
          <CardDescription>Tìm kiếm và lọc audit logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Hành động</label>
              <Select
                value={filters.action || "all"}
                onValueChange={(value) => setFilters(prev => ({ ...prev, action: value === "all" ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {availableActions.map(action => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tìm kiếm</label>
              <Input
                placeholder="IP, action, object..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Từ ngày</label>
              <Input
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Đến ngày</label>
              <Input
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleFilter} size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Áp dụng
            </Button>
            <Button onClick={handleReset} variant="outline" size="sm">
              Đặt lại
            </Button>
            <Button onClick={handleExport} variant="outline" size="sm" className="ml-auto">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>
            Hiển thị {logs.length} / {pagination.total} logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không tìm thấy logs
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Người dùng</TableHead>
                      <TableHead>Hành động</TableHead>
                      <TableHead>Đối tượng</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          {log.actor ? (
                            <div>
                              <div className="font-medium">{log.actor.fullName}</div>
                              <div className="text-xs text-muted-foreground">
                                {log.actor.email}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">System</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionColor(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.object}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.ip || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Trang {pagination.page} / {pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
