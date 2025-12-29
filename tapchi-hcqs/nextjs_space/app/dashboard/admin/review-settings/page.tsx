'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Eye, EyeOff, Settings, Save } from 'lucide-react'

type BlindReviewMode = 'NONE' | 'SINGLE_BLIND' | 'DOUBLE_BLIND'

interface ReviewSettings {
  blindReviewMode: BlindReviewMode
  hideAuthorFromReviewer: boolean
  hideReviewerFromAuthor: boolean
  allowReviewerCommunication: boolean
  autoAssignReviewers: boolean
  minimumReviewers: number
  reviewDeadlineDays: number
}

export default function ReviewSettingsPage() {
  const [settings, setSettings] = useState<ReviewSettings>({
    blindReviewMode: 'DOUBLE_BLIND',
    hideAuthorFromReviewer: true,
    hideReviewerFromAuthor: true,
    allowReviewerCommunication: false,
    autoAssignReviewers: false,
    minimumReviewers: 2,
    reviewDeadlineDays: 14
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/ui-config?category=review')
      const data = await response.json()

      if (data.success && data.data.length > 0) {
        const configMap = data.data.reduce((acc: any, item: any) => {
          acc[item.key] = item.value
          return acc
        }, {})

        setSettings({
          blindReviewMode: (configMap.blindReviewMode || 'DOUBLE_BLIND') as BlindReviewMode,
          hideAuthorFromReviewer: configMap.hideAuthorFromReviewer === 'true',
          hideReviewerFromAuthor: configMap.hideReviewerFromAuthor === 'true',
          allowReviewerCommunication: configMap.allowReviewerCommunication === 'true',
          autoAssignReviewers: configMap.autoAssignReviewers === 'true',
          minimumReviewers: parseInt(configMap.minimumReviewers) || 2,
          reviewDeadlineDays: parseInt(configMap.reviewDeadlineDays) || 14
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Lỗi tải cài đặt')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const promises = Object.entries(settings).map(([key, value]) =>
        fetch('/api/ui-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key,
            value: String(value),
            category: 'review',
            description: getSettingDescription(key)
          })
        })
      )

      await Promise.all(promises)
      toast.success('Lưu cài đặt thành công')
    } catch (error) {
      toast.error('Lỗi lưu cài đặt')
    } finally {
      setSaving(false)
    }
  }

  const getSettingDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      blindReviewMode: 'Chế độ phản biện ẩn danh',
      hideAuthorFromReviewer: 'Ẩn thông tin tác giả khỏi phản biện viên',
      hideReviewerFromAuthor: 'Ẩn thông tin phản biện viên khỏi tác giả',
      allowReviewerCommunication: 'Cho phép phản biện viên trao đổi với nhau',
      autoAssignReviewers: 'Tự động gán phản biện viên',
      minimumReviewers: 'Số lượng phản biện viên tối thiểu',
      reviewDeadlineDays: 'Thời hạn phản biện (ngày)'
    }
    return descriptions[key] || ''
  }

  const handleModeChange = (mode: BlindReviewMode) => {
    let newSettings = { ...settings, blindReviewMode: mode }

    switch (mode) {
      case 'NONE':
        newSettings.hideAuthorFromReviewer = false
        newSettings.hideReviewerFromAuthor = false
        break
      case 'SINGLE_BLIND':
        newSettings.hideAuthorFromReviewer = false
        newSettings.hideReviewerFromAuthor = true
        break
      case 'DOUBLE_BLIND':
        newSettings.hideAuthorFromReviewer = true
        newSettings.hideReviewerFromAuthor = true
        break
    }

    setSettings(newSettings)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Cài đặt Quy trình Phản biện
        </h1>
        <p className="text-muted-foreground mt-2">
          Cấu hình chế độ phản biện ẩn danh và các quy tắc phản biện
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <EyeOff className="h-5 w-5" />
              Chế độ Phản biện Ẩn danh
            </CardTitle>
            <CardDescription>
              Chọn mức độ ẩn danh trong quy trình phản biện
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="blindMode">Chế độ phản biện</Label>
              <Select
                value={settings.blindReviewMode}
                onValueChange={(value) => handleModeChange(value as BlindReviewMode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">
                    Không ẩn danh (Open Review)
                  </SelectItem>
                  <SelectItem value="SINGLE_BLIND">
                    Ẩn danh đơn (Single Blind)
                  </SelectItem>
                  <SelectItem value="DOUBLE_BLIND">
                    Ẩn danh kép (Double Blind)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {settings.blindReviewMode === 'NONE' &&
                  'Cả tác giả và phản biện viên đều biết thông tin của nhau'}
                {settings.blindReviewMode === 'SINGLE_BLIND' &&
                  'Tác giả không biết ai là phản biện viên'}
                {settings.blindReviewMode === 'DOUBLE_BLIND' &&
                  'Cả tác giả và phản biện viên đều ẩn danh'}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
              <div className="flex items-center justify-between space-x-4">
                <div className="flex-1">
                  <Label htmlFor="hideAuthor">Ẩn tác giả</Label>
                  <p className="text-sm text-muted-foreground">
                    Phản biện viên không thấy tên tác giả
                  </p>
                </div>
                <Switch
                  id="hideAuthor"
                  checked={settings.hideAuthorFromReviewer}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, hideAuthorFromReviewer: checked })
                  }
                  disabled={settings.blindReviewMode !== 'NONE'}
                />
              </div>

              <div className="flex items-center justify-between space-x-4">
                <div className="flex-1">
                  <Label htmlFor="hideReviewer">Ẩn phản biện viên</Label>
                  <p className="text-sm text-muted-foreground">
                    Tác giả không biết ai phản biện
                  </p>
                </div>
                <Switch
                  id="hideReviewer"
                  checked={settings.hideReviewerFromAuthor}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, hideReviewerFromAuthor: checked })
                  }
                  disabled={settings.blindReviewMode !== 'NONE'}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cài đặt Quy trình</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Số phản biện viên tối thiểu</Label>
                <Select
                  value={settings.minimumReviewers.toString()}
                  onValueChange={(value) =>
                    setSettings({ ...settings, minimumReviewers: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 phản biện viên</SelectItem>
                    <SelectItem value="2">2 phản biện viên</SelectItem>
                    <SelectItem value="3">3 phản biện viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Thời hạn phản biện (ngày)</Label>
                <Select
                  value={settings.reviewDeadlineDays.toString()}
                  onValueChange={(value) =>
                    setSettings({ ...settings, reviewDeadlineDays: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 ngày</SelectItem>
                    <SelectItem value="14">14 ngày</SelectItem>
                    <SelectItem value="21">21 ngày</SelectItem>
                    <SelectItem value="30">30 ngày</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between space-x-4 pt-4 border-t">
              <div className="flex-1">
                <Label>Tự động gán phản biện viên</Label>
                <p className="text-sm text-muted-foreground">
                  Hệ thống tự động đề xuất phản biện viên
                </p>
              </div>
              <Switch
                checked={settings.autoAssignReviewers}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoAssignReviewers: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </Button>
        </div>
      </div>
    </div>
  )
}
