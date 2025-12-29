
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Save,
  Loader2,
  Globe,
  Phone,
  Share2,
  Search,
  Palette,
  FileText,
  Settings as SettingsIcon,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface SiteSetting {
  id: string;
  category: string;
  key: string;
  value: string | null;
  label: string;
  labelEn: string | null;
  type: string;
  placeholder: string | null;
  helpText: string | null;
  order: number;
}

export default function SiteSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/site-settings');
      const data = await response.json();

      if (data.success && data.data?.settings) {
        setSettings(data.data.settings);
        
        // Initialize form data
        const initialData: Record<string, string> = {};
        data.data.settings.forEach((setting: SiteSetting) => {
          initialData[setting.key] = setting.value || '';
        });
        setFormData(initialData);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Không thể tải cài đặt');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Prepare updates (only changed values)
      const updates = Object.entries(formData).map(([key, value]) => ({
        key,
        value,
      }));

      const response = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updates }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Đã lưu cài đặt thành công!');
        setHasChanges(false);
        router.refresh();
      } else {
        toast.error(data.message || 'Không thể lưu cài đặt');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Có lỗi xảy ra khi lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    // Reset form to original values
    const resetData: Record<string, string> = {};
    settings.forEach((setting) => {
      resetData[setting.key] = setting.value || '';
    });
    setFormData(resetData);
    setHasChanges(false);
    toast.info('Đã khôi phục giá trị ban đầu');
  };

  // Group settings by category
  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, SiteSetting[]>);

  // Render input based on type
  const renderInput = (setting: SiteSetting) => {
    const value = formData[setting.key] || '';

    switch (setting.type) {
      case 'textarea':
        return (
          <Textarea
            id={setting.key}
            value={value}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            placeholder={setting.placeholder || ''}
            rows={4}
            className="font-mono text-sm"
          />
        );

      case 'color':
        return (
          <div className="flex items-center gap-3">
            <Input
              id={setting.key}
              type="color"
              value={value || '#000000'}
              onChange={(e) => handleChange(setting.key, e.target.value)}
              className="w-20 h-10"
            />
            <Input
              type="text"
              value={value}
              onChange={(e) => handleChange(setting.key, e.target.value)}
              placeholder="#000000"
              className="flex-1 font-mono"
            />
          </div>
        );

      case 'image':
      case 'url':
      case 'email':
        return (
          <Input
            id={setting.key}
            type={setting.type === 'email' ? 'email' : 'url'}
            value={value}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            placeholder={setting.placeholder || ''}
          />
        );

      default:
        return (
          <Input
            id={setting.key}
            type="text"
            value={value}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            placeholder={setting.placeholder || ''}
          />
        );
    }
  };

  // Render settings form for a category
  const renderCategorySettings = (category: string) => {
    const categorySettings = groupedSettings[category] || [];

    if (categorySettings.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Chưa có cài đặt nào trong danh mục này</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {categorySettings.map((setting) => (
          <div key={setting.id} className="space-y-2">
            <Label htmlFor={setting.key} className="text-base font-semibold">
              {setting.label}
              {setting.labelEn && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({setting.labelEn})
                </span>
              )}
            </Label>
            {setting.helpText && (
              <p className="text-sm text-muted-foreground">{setting.helpText}</p>
            )}
            {renderInput(setting)}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
          <p className="text-muted-foreground">Đang tải cài đặt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Cài đặt Website
            </h1>
            <p className="text-muted-foreground mt-2">
              Quản lý các thiết lập chung cho toàn bộ website
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <AlertCircle className="w-3 h-3 mr-1" />
                Có thay đổi chưa lưu
              </Badge>
            )}
            {!hasChanges && (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Đã lưu
              </Badge>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Lưu thay đổi
              </>
            )}
          </Button>
          <Button
            onClick={handleReset}
            disabled={!hasChanges}
            variant="outline"
          >
            Khôi phục
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto">
          <TabsTrigger value="general" className="gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Chung</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="gap-2">
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">Liên hệ</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Mạng xã hội</span>
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-2">
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">SEO</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Giao diện</span>
          </TabsTrigger>
          <TabsTrigger value="footer" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Footer</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-600" />
                Cài đặt chung
              </CardTitle>
              <CardDescription>
                Thông tin cơ bản về tạp chí và website
              </CardDescription>
            </CardHeader>
            <CardContent>{renderCategorySettings('general')}</CardContent>
          </Card>
        </TabsContent>

        {/* Contact Settings */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-600" />
                Thông tin liên hệ
              </CardTitle>
              <CardDescription>
                Email, số điện thoại, địa chỉ và thông tin liên hệ khác
              </CardDescription>
            </CardHeader>
            <CardContent>{renderCategorySettings('contact')}</CardContent>
          </Card>
        </TabsContent>

        {/* Social Media Settings */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-600" />
                Mạng xã hội
              </CardTitle>
              <CardDescription>
                Liên kết tới các trang mạng xã hội của tạp chí
              </CardDescription>
            </CardHeader>
            <CardContent>{renderCategorySettings('social')}</CardContent>
          </Card>
        </TabsContent>

        {/* SEO Settings */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-emerald-600" />
                Cài đặt SEO
              </CardTitle>
              <CardDescription>
                Tối ưu hóa công cụ tìm kiếm và meta tags
              </CardDescription>
            </CardHeader>
            <CardContent>{renderCategorySettings('seo')}</CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-emerald-600" />
                Giao diện
              </CardTitle>
              <CardDescription>
                Màu sắc, font chữ và kiểu hiển thị
              </CardDescription>
            </CardHeader>
            <CardContent>{renderCategorySettings('appearance')}</CardContent>
          </Card>
        </TabsContent>

        {/* Footer Settings */}
        <TabsContent value="footer">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Footer
              </CardTitle>
              <CardDescription>
                Nội dung và thông tin hiển thị ở footer
              </CardDescription>
            </CardHeader>
            <CardContent>{renderCategorySettings('footer')}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Reminder */}
      {hasChanges && (
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <p className="text-sm text-amber-900 font-medium">
                Bạn có thay đổi chưa được lưu. Nhớ nhấn &quot;Lưu thay đổi&quot; để áp dụng.
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Lưu ngay
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
