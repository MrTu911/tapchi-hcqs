
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { CalendarIcon, Download, Search, RefreshCw, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface AuditLog {
  id: string
  action: string
  object: string
  ip: string | null
  createdAt: string
  actor: {
    id: string
    fullName: string
    email: string
    role: string
  } | null
  before: any
  after: any
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })

  // Filters
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [actorFilter, setActorFilter] = useState<string>('')
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()

  const fetchLogs = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (actionFilter && actionFilter !== 'all') {
        params.append('action', actionFilter)
      }

      if (actorFilter) {
        params.append('actorId', actorFilter)
      }

      if (startDate) {
        params.append('startDate', startDate.toISOString())
      }

      if (endDate) {
        params.append('endDate', endDate.toISOString())
      }

      const response = await fetch(`/api/audit-logs?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs')
      }

      const data = await response.json()
      setLogs(data.logs)
      setPagination(data.pagination)
    } catch (error: any) {
      toast.error('Lỗi tải audit logs: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [pagination.page, actionFilter])

  const handleApplyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchLogs()
  }

  const handleResetFilters = () => {
    setActionFilter('all')
    setActorFilter('')
    setStartDate(undefined)
    setEndDate(undefined)
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchLogs()
  }

  const getActionBadge = (action: string, object: string) => {
    const isSuccess = object === 'SUCCESS'
    const variant = isSuccess ? 'default' : 'destructive'
    
    return (
      <Badge variant={variant} className="font-mono text-xs">
        {action}
      </Badge>
    )
  }

  const exportLogs = () => {
    const csv = [
      ['Thời gian', 'Hành động', 'Kết quả', 'Người thực hiện', 'Email', 'Role', 'IP'],
      ...logs.map(log => [
        new Date(log.createdAt).toLocaleString('vi-VN'),
        log.action,
        log.object,
        log.actor?.fullName || 'System',
        log.actor?.email || 'N/A',
        log.actor?.role || 'N/A',
        log.ip || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nhật ký Hoạt động (Audit Logs)</h1>
        <p className="text-muted-foreground mt-1">
          Theo dõi tất cả các hoạt động quan trọng trong hệ thống
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Loại hành động</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="LOGIN_SUCCESS">Đăng nhập thành công</SelectItem>
                  <SelectItem value="LOGIN_FAILED">Đăng nhập thất bại</SelectItem>
                  <SelectItem value="LOGOUT">Đăng xuất</SelectItem>
                  <SelectItem value="USER_CREATED">Tạo user</SelectItem>
                  <SelectItem value="SUBMISSION_CREATED">Tạo submission</SelectItem>
                  <SelectItem value="REVIEW_SUBMITTED">Phản biện</SelectItem>
                  <SelectItem value="DECISION_MADE">Quyết định biên tập</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Từ ngày</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'dd/MM/yyyy') : 'Chọn ngày'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Đến ngày</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'dd/MM/yyyy') : 'Chọn ngày'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleApplyFilters} className="flex-1">
                <Search className="w-4 h-4 mr-2" />
                Áp dụng
              </Button>
              <Button onClick={handleResetFilters} variant="outline">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Danh sách nhật ký</CardTitle>
            <CardDescription>
              Tổng: {pagination.total} bản ghi | Trang {pagination.page}/{pagination.totalPages}
            </CardDescription>
          </div>
          <Button onClick={exportLogs} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Xuất CSV
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Không có dữ liệu</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Hành động</TableHead>
                    <TableHead>Người thực hiện</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Chi tiết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </TableCell>
                      <TableCell>
                        {getActionBadge(log.action, log.object)}
                      </TableCell>
                      <TableCell>
                        {log.actor ? (
                          <div>
                            <div className="font-medium">{log.actor.fullName}</div>
                            <div className="text-xs text-muted-foreground">{log.actor.email}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">System</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.actor?.role ? (
                          <Badge variant="outline">{log.actor.role}</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.ip || '-'}
                      </TableCell>
                      <TableCell>
                        {log.after && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              toast.info(JSON.stringify(log.after, null, 2))
                            }}
                          >
                            Xem
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1 || loading}
              >
                Trang trước
              </Button>
              <span className="text-sm text-muted-foreground">
                Trang {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages || loading}
              >
                Trang sau
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

