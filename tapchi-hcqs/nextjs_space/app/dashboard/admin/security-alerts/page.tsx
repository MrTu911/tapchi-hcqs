
/**
 * 🧠 SECURITY ALERTS DASHBOARD
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { AlertTriangle, Shield, Activity, Eye, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface SecurityAlert {
  id: string
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED'
  description: string
  ipAddress?: string
  userAgent?: string
  metadata?: any
  user?: {
    id: string
    fullName: string
    email: string
    role: string
  }
  createdAt: string
  reviewedBy?: string
  reviewedAt?: string
  notes?: string
}

interface SecurityStats {
  totalAlerts: number
  criticalAlerts: number
  pendingAlerts: number
  alertsByType: Array<{ type: string; count: number }>
}

export default function SecurityAlertsPage() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [stats, setStats] = useState<SecurityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [filter, setFilter] = useState({
    type: 'all',
    severity: 'all',
    status: 'PENDING'
  })

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter.type !== 'all') params.append('type', filter.type)
      if (filter.severity !== 'all') params.append('severity', filter.severity)
      if (filter.status !== 'all') params.append('status', filter.status)
      
      const res = await fetch(`/api/security/alerts?${params.toString()}`)
      const data = await res.json()
      
      if (data.alerts) {
        setAlerts(data.alerts)
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
      toast.error('Không thể tải danh sách cảnh báo')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/security/alerts?action=stats')
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  useEffect(() => {
    fetchAlerts()
    fetchStats()
  }, [filter])

  const handleReview = async (status: 'REVIEWED' | 'RESOLVED') => {
    if (!selectedAlert) return
    
    try {
      const res = await fetch(`/api/security/alerts/${selectedAlert.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          notes: reviewNotes
        })
      })
      
      if (res.ok) {
        toast.success(
          status === 'REVIEWED' 
            ? 'Đã đánh dấu là đã xem xét' 
            : 'Đã giải quyết cảnh báo'
        )
        setSelectedAlert(null)
        setReviewNotes('')
        fetchAlerts()
        fetchStats()
      } else {
        toast.error('Không thể cập nhật trạng thái')
      }
    } catch (error) {
      console.error('Error updating alert:', error)
      toast.error('Lỗi khi cập nhật trạng thái')
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive'
      case 'HIGH': return 'destructive'
      case 'MEDIUM': return 'default'
      case 'LOW': return 'secondary'
      default: return 'default'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'BRUTE_FORCE': return <Shield className="h-4 w-4" />
      case 'SUSPICIOUS_IP': return <AlertTriangle className="h-4 w-4" />
      case 'UNUSUAL_ACTIVITY': return <Activity className="h-4 w-4" />
      case 'ROLE_ESCALATION': return <Eye className="h-4 w-4" />
      default: return <Shield className="h-4 w-4" />
    }
  }

  const getTypeName = (type: string) => {
    const names: Record<string, string> = {
      'BRUTE_FORCE': 'Brute Force Attack',
      'SUSPICIOUS_IP': 'IP đáng ngờ',
      'UNUSUAL_ACTIVITY': 'Hoạt động bất thường',
      'ROLE_ESCALATION': 'Tăng quyền',
      'DATA_ACCESS': 'Truy cập dữ liệu'
    }
    return names[type] || type
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">🧠 Cảnh báo Bảo mật</h1>
        <p className="text-muted-foreground">
          Giám sát và xử lý các cảnh báo bảo mật hệ thống
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng cảnh báo (7 ngày)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAlerts}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">
                Cảnh báo nghiêm trọng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.criticalAlerts}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-600">
                Chưa xử lý
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {stats.pendingAlerts}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Select
            value={filter.status}
            onValueChange={(value) => setFilter({ ...filter, status: value })}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="PENDING">Chưa xử lý</SelectItem>
              <SelectItem value="REVIEWED">Đã xem xét</SelectItem>
              <SelectItem value="RESOLVED">Đã giải quyết</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filter.severity}
            onValueChange={(value) => setFilter({ ...filter, severity: value })}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Mức độ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả mức độ</SelectItem>
              <SelectItem value="CRITICAL">Nghiêm trọng</SelectItem>
              <SelectItem value="HIGH">Cao</SelectItem>
              <SelectItem value="MEDIUM">Trung bình</SelectItem>
              <SelectItem value="LOW">Thấp</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filter.type}
            onValueChange={(value) => setFilter({ ...filter, type: value })}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Loại cảnh báo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              <SelectItem value="BRUTE_FORCE">Brute Force</SelectItem>
              <SelectItem value="SUSPICIOUS_IP">IP đáng ngờ</SelectItem>
              <SelectItem value="UNUSUAL_ACTIVITY">Hoạt động bất thường</SelectItem>
              <SelectItem value="ROLE_ESCALATION">Tăng quyền</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Cảnh báo</CardTitle>
          <CardDescription>
            {alerts.length} cảnh báo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không có cảnh báo nào
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <Card 
                  key={alert.id}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => setSelectedAlert(alert)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(alert.type)}
                          <span className="font-semibold">
                            {getTypeName(alert.type)}
                          </span>
                          <Badge variant={getSeverityColor(alert.severity) as any}>
                            {alert.severity}
                          </Badge>
                          <Badge variant={
                            alert.status === 'PENDING' ? 'default' :
                            alert.status === 'REVIEWED' ? 'secondary' :
                            'outline'
                          }>
                            {alert.status === 'PENDING' ? 'Chưa xử lý' :
                             alert.status === 'REVIEWED' ? 'Đã xem xét' :
                             'Đã giải quyết'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm">{alert.description}</p>
                        
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          {alert.user && (
                            <span>User: {alert.user.fullName}</span>
                          )}
                          {alert.ipAddress && (
                            <span>IP: {alert.ipAddress}</span>
                          )}
                          <span>
                            {new Date(alert.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Detail Dialog */}
      <Dialog 
        open={!!selectedAlert} 
        onOpenChange={(open) => !open && setSelectedAlert(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết Cảnh báo</DialogTitle>
          </DialogHeader>
          
          {selectedAlert && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getTypeIcon(selectedAlert.type)}
                <span className="font-semibold">
                  {getTypeName(selectedAlert.type)}
                </span>
                <Badge variant={getSeverityColor(selectedAlert.severity) as any}>
                  {selectedAlert.severity}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">Mô tả:</h4>
                <p className="text-sm">{selectedAlert.description}</p>
              </div>
              
              {selectedAlert.user && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Người dùng:</h4>
                  <div className="text-sm">
                    <div>{selectedAlert.user.fullName}</div>
                    <div className="text-muted-foreground">
                      {selectedAlert.user.email} • {selectedAlert.user.role}
                    </div>
                  </div>
                </div>
              )}
              
              {selectedAlert.ipAddress && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Địa chỉ IP:</h4>
                  <p className="text-sm font-mono">{selectedAlert.ipAddress}</p>
                </div>
              )}
              
              {selectedAlert.metadata && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Thông tin bổ sung:</h4>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                    {JSON.stringify(selectedAlert.metadata, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedAlert.status === 'PENDING' && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Ghi chú xử lý:</h4>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Nhập ghi chú về việc xử lý cảnh báo này..."
                    rows={3}
                  />
                  
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => handleReview('REVIEWED')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Đánh dấu đã xem
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => handleReview('RESOLVED')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Đã giải quyết
                    </Button>
                  </div>
                </div>
              )}
              
              {selectedAlert.notes && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Ghi chú:</h4>
                  <p className="text-sm">{selectedAlert.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
