
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { motion } from 'framer-motion'
import { 
  User, Mail, Building2, Globe, Save, 
  Bell, Lock, Settings as SettingsIcon,
  Shield, Eye, EyeOff, Loader2
} from 'lucide-react'
import { toast } from 'sonner'

export default function AuthorSettingsPage() {
  const { data: session } = useSession() || {}
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    affiliation: '',
    orcid: '',
    bio: '',
    researchInterests: ''
  })

  const [preferences, setPreferences] = useState({
    autoSave: true,
    emailNotifications: true,
    reviewReminders: true,
    theme: 'system'
  })

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false
  })

  useEffect(() => {
    if (session) {
      const s = session as any
      setProfile({
        fullName: s.fullName || '',
        email: s.email || '',
        affiliation: s.affiliation || '',
        orcid: s.orcid || '',
        bio: s.bio || '',
        researchInterests: s.researchInterests || ''
      })
    }
  }, [session])

  const handleProfileUpdate = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })

      if (response.ok) {
        toast.success('Cập nhật hồ sơ thành công')
      } else {
        toast.error('Không thể cập nhật hồ sơ')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Đã xảy ra lỗi khi cập nhật hồ sơ')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (security.newPassword !== security.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }

    if (security.newPassword.length < 8) {
      toast.error('Mật khẩu phải có ít nhất 8 ký tự')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: security.currentPassword,
          newPassword: security.newPassword
        })
      })

      if (response.ok) {
        toast.success('Đổi mật khẩu thành công')
        setSecurity({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          twoFactorEnabled: security.twoFactorEnabled
        })
      } else {
        const data = await response.json()
        toast.error(data.error || 'Không thể đổi mật khẩu')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('Đã xảy ra lỗi khi đổi mật khẩu')
    } finally {
      setLoading(false)
    }
  }

  const handlePreferencesUpdate = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      })

      if (response.ok) {
        toast.success('Cập nhật cài đặt thành công')
      } else {
        toast.error('Không thể cập nhật cài đặt')
      }
    } catch (error) {
      console.error('Error updating preferences:', error)
      toast.error('Đã xảy ra lỗi khi cập nhật cài đặt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 md:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
          <SettingsIcon className="w-8 h-8 text-blue-600" />
          Cài đặt cá nhân
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Quản lý thông tin cá nhân và tùy chọn của bạn
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Hồ sơ
            </TabsTrigger>
            <TabsTrigger value="preferences">
              <SettingsIcon className="w-4 h-4 mr-2" />
              Tùy chọn
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="w-4 h-4 mr-2" />
              Bảo mật
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-xl">
              <CardHeader>
                <CardTitle>Thông tin cá nhân</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Họ và tên *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        value={profile.fullName}
                        onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                        className="pl-10"
                        placeholder="Nguyễn Văn A"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="pl-10"
                        placeholder="email@example.com"
                        disabled
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="affiliation">Đơn vị công tác</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="affiliation"
                        value={profile.affiliation}
                        onChange={(e) => setProfile({ ...profile, affiliation: e.target.value })}
                        className="pl-10"
                        placeholder="Trường Đại học ABC"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orcid">ORCID ID</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="orcid"
                        value={profile.orcid}
                        onChange={(e) => setProfile({ ...profile, orcid: e.target.value })}
                        className="pl-10"
                        placeholder="0000-0000-0000-0000"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="bio">Tiểu sử</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Giới thiệu ngắn về bản thân..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="researchInterests">Lĩnh vực nghiên cứu</Label>
                  <Textarea
                    id="researchInterests"
                    value={profile.researchInterests}
                    onChange={(e) => setProfile({ ...profile, researchInterests: e.target.value })}
                    placeholder="Các lĩnh vực nghiên cứu của bạn..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleProfileUpdate} 
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-blue-700"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Lưu thay đổi
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-xl">
              <CardHeader>
                <CardTitle>Tùy chọn</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoSave" className="text-base">Tự động lưu</Label>
                      <p className="text-sm text-muted-foreground">
                        Tự động lưu bài viết khi bạn đang soạn thảo
                      </p>
                    </div>
                    <Switch
                      id="autoSave"
                      checked={preferences.autoSave}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, autoSave: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="emailNotifications" className="text-base">Thông báo email</Label>
                      <p className="text-sm text-muted-foreground">
                        Nhận thông báo qua email về bài viết của bạn
                      </p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={preferences.emailNotifications}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, emailNotifications: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="reviewReminders" className="text-base">Nhắc nhở phản biện</Label>
                      <p className="text-sm text-muted-foreground">
                        Nhận thông báo khi có phản biện mới hoặc cập nhật
                      </p>
                    </div>
                    <Switch
                      id="reviewReminders"
                      checked={preferences.reviewReminders}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, reviewReminders: checked })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button 
                    onClick={handlePreferencesUpdate} 
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-blue-700"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Lưu thay đổi
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-xl">
              <CardHeader>
                <CardTitle>Bảo mật tài khoản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="currentPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={security.currentPassword}
                        onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                        className="pl-10 pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Mật khẩu mới</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={security.newPassword}
                        onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                        className="pl-10"
                        placeholder="••••••••"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Mật khẩu phải có ít nhất 8 ký tự
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={security.confirmPassword}
                        onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                        className="pl-10"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="twoFactor" className="text-base">Xác thực hai yếu tố (2FA)</Label>
                    <p className="text-sm text-muted-foreground">
                      Tăng cường bảo mật cho tài khoản của bạn
                    </p>
                  </div>
                  <Switch
                    id="twoFactor"
                    checked={security.twoFactorEnabled}
                    onCheckedChange={(checked) => setSecurity({ ...security, twoFactorEnabled: checked })}
                  />
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handlePasswordChange} 
                    disabled={loading || !security.currentPassword || !security.newPassword}
                    className="bg-gradient-to-r from-blue-600 to-blue-700"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Lock className="w-4 h-4 mr-2" />
                    )}
                    Đổi mật khẩu
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
