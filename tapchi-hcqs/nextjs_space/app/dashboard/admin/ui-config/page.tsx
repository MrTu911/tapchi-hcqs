
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Save, Settings, Palette, Image as ImageIcon, FileText } from 'lucide-react'

interface ConfigItem {
  id: string
  key: string
  value: string
  description?: string
  category: string
  updatedAt: string
}

const CONFIG_CATEGORIES = {
  branding: {
    label: 'Thương hiệu',
    icon: Palette,
    configs: [
      { key: 'site.name', label: 'Tên tạp chí', description: 'Tên đầy đủ của tạp chí' },
      { key: 'site.name.short', label: 'Tên rút gọn', description: 'Tên viết tắt hoặc rút gọn' },
      { key: 'site.tagline', label: 'Khẩu hiệu', description: 'Mô tả ngắn về tạp chí' },
      { key: 'site.logo.url', label: 'Logo URL', description: 'Đường dẫn đến file logo' },
      { key: 'site.favicon.url', label: 'Favicon URL', description: 'Đường dẫn đến favicon' },
    ]
  },
  visual: {
    label: 'Hình ảnh',
    icon: ImageIcon,
    configs: [
      { key: 'site.banner.url', label: 'Banner URL', description: 'Ảnh banner trang chủ' },
      { key: 'site.footer.url', label: 'Footer URL', description: 'Ảnh footer' },
      { key: 'site.og.image', label: 'OG Image', description: 'Ảnh chia sẻ mạng xã hội' },
    ]
  },
  colors: {
    label: 'Màu sắc',
    icon: Palette,
    configs: [
      { key: 'theme.primary.color', label: 'Màu chủ đạo', description: 'Màu chính của giao diện' },
      { key: 'theme.secondary.color', label: 'Màu phụ', description: 'Màu phụ của giao diện' },
      { key: 'theme.accent.color', label: 'Màu nhấn', description: 'Màu nhấn mạnh' },
    ]
  },
  legal: {
    label: 'Thông tin pháp lý',
    icon: FileText,
    configs: [
      { key: 'legal.license.number', label: 'Số giấy phép', description: 'Số GP-BTTTT' },
      { key: 'legal.license.date', label: 'Ngày cấp', description: 'Ngày cấp giấy phép' },
      { key: 'legal.license.issuer', label: 'Cơ quan cấp', description: 'Cơ quan cấp giấy phép' },
      { key: 'legal.publisher.name', label: 'Cơ quan chủ quản', description: 'Tên đầy đủ cơ quan chủ quản' },
      { key: 'legal.publisher.address', label: 'Địa chỉ', description: 'Địa chỉ trụ sở' },
      { key: 'legal.publisher.phone', label: 'Điện thoại', description: 'Số điện thoại liên hệ' },
      { key: 'legal.publisher.email', label: 'Email', description: 'Email liên hệ' },
      { key: 'legal.issn', label: 'ISSN', description: 'Mã số ISSN' },
    ]
  }
}

export default function UIConfigPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [configs, setConfigs] = useState<ConfigItem[]>([])
  const [formData, setFormData] = useState<Record<string, string>>({})

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    try {
      const response = await fetch('/api/ui-config')
      const data = await response.json()
      
      if (data.success) {
        setConfigs(data.configs)
        const formValues: Record<string, string> = {}
        data.configs.forEach((config: ConfigItem) => {
          formValues[config.key] = config.value
        })
        setFormData(formValues)
      }
    } catch (error) {
      toast.error('Không thể tải cấu hình')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (category: string) => {
    setSaving(true)
    
    try {
      const categoryConfigs = Object.values(CONFIG_CATEGORIES).find(c => 
        c.label === category
      )?.configs || []

      const promises = categoryConfigs.map(configDef => {
        const key = configDef.key
        const value = formData[key] || ''
        
        return fetch('/api/ui-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key,
            value,
            description: configDef.description,
            category: Object.keys(CONFIG_CATEGORIES).find(k => 
              CONFIG_CATEGORIES[k as keyof typeof CONFIG_CATEGORIES].label === category
            )
          })
        })
      })

      await Promise.all(promises)
      toast.success('Đã lưu cấu hình')
      loadConfigs()
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Cấu hình giao diện
        </h1>
        <p className="text-muted-foreground mt-1">
          Tùy chỉnh thương hiệu và giao diện tạp chí
        </p>
      </div>

      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="branding">
            <Palette className="mr-2 h-4 w-4" />
            Thương hiệu
          </TabsTrigger>
          <TabsTrigger value="visual">
            <ImageIcon className="mr-2 h-4 w-4" />
            Hình ảnh
          </TabsTrigger>
          <TabsTrigger value="colors">
            <Palette className="mr-2 h-4 w-4" />
            Màu sắc
          </TabsTrigger>
          <TabsTrigger value="legal">
            <FileText className="mr-2 h-4 w-4" />
            Pháp lý
          </TabsTrigger>
        </TabsList>

        {Object.entries(CONFIG_CATEGORIES).map(([categoryKey, category]) => (
          <TabsContent key={categoryKey} value={categoryKey}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <category.icon className="h-5 w-5" />
                  {category.label}
                </CardTitle>
                <CardDescription>
                  Cấu hình {category.label.toLowerCase()} của tạp chí
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {category.configs.map(configDef => (
                    <div key={configDef.key} className="space-y-2">
                      <Label htmlFor={configDef.key}>
                        {configDef.label}
                      </Label>
                      {configDef.key.includes('url') || configDef.key.includes('image') ? (
                        <Input
                          id={configDef.key}
                          placeholder={configDef.description}
                          value={formData[configDef.key] || ''}
                          onChange={(e) => setFormData({ ...formData, [configDef.key]: e.target.value })}
                        />
                      ) : configDef.key.includes('address') || configDef.key.includes('description') ? (
                        <Textarea
                          id={configDef.key}
                          placeholder={configDef.description}
                          value={formData[configDef.key] || ''}
                          onChange={(e) => setFormData({ ...formData, [configDef.key]: e.target.value })}
                          rows={3}
                        />
                      ) : (
                        <Input
                          id={configDef.key}
                          placeholder={configDef.description}
                          value={formData[configDef.key] || ''}
                          onChange={(e) => setFormData({ ...formData, [configDef.key]: e.target.value })}
                        />
                      )}
                      {configDef.description && (
                        <p className="text-xs text-muted-foreground">
                          {configDef.description}
                        </p>
                      )}
                    </div>
                  ))}

                  <div className="pt-4">
                    <Button onClick={() => handleSave(category.label)} disabled={saving}>
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
