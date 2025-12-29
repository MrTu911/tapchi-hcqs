
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, FolderPlus, Save } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const categoryFormSchema = z.object({
  code: z.string()
    .min(1, 'Mã chuyên mục là bắt buộc')
    .max(20, 'Mã chuyên mục tối đa 20 ký tự')
    .regex(/^[A-Z0-9_-]+$/, 'Mã chuyên mục chỉ chứa chữ in hoa, số, gạch dưới và gạch ngang'),
  name: z.string()
    .min(1, 'Tên chuyên mục là bắt buộc')
    .max(200, 'Tên chuyên mục tối đa 200 ký tự'),
  slug: z.string()
    .min(1, 'Slug là bắt buộc')
    .max(200, 'Slug tối đa 200 ký tự')
    .regex(/^[a-z0-9-]+$/, 'Slug chỉ chứa chữ thường, số và gạch ngang'),
  description: z.string().optional(),
})

type CategoryFormValues = z.infer<typeof categoryFormSchema>

interface CategoryFormProps {
  initialData?: {
    id?: string
    code: string
    name: string
    slug: string
    description?: string | null
  }
  mode?: 'create' | 'edit'
}

export function CategoryForm({ initialData, mode = 'create' }: CategoryFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      code: initialData?.code || '',
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      description: initialData?.description || '',
    },
  })

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const onSubmit = async (data: CategoryFormValues) => {
    setIsLoading(true)
    try {
      const url = mode === 'create' 
        ? '/api/categories' 
        : `/api/admin/categories/${initialData?.id}`
      
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Có lỗi xảy ra')
      }

      toast.success(
        mode === 'create' 
          ? '✅ Tạo chuyên mục thành công!' 
          : '✅ Cập nhật chuyên mục thành công!'
      )
      
      router.push('/dashboard/admin/categories')
      router.refresh()
    } catch (error) {
      console.error('Category form error:', error)
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Có lỗi xảy ra khi lưu chuyên mục'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderPlus className="h-5 w-5" />
          {mode === 'create' ? 'Tạo chuyên mục mới' : 'Chỉnh sửa chuyên mục'}
        </CardTitle>
        <CardDescription>
          {mode === 'create' 
            ? 'Điền thông tin để tạo chuyên mục mới cho tạp chí' 
            : 'Cập nhật thông tin chuyên mục'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Mã chuyên mục <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="VD: HLKT, LSQS, GDDT"
                      {...field}
                      disabled={isLoading}
                      className="uppercase"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormDescription>
                    Mã ngắn gọn để phân loại (chữ in hoa, số, gạch ngang, gạch dưới)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Tên chuyên mục <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="VD: Khoa học Hậu cần - Kỹ thuật"
                      {...field}
                      disabled={isLoading}
                      onChange={(e) => {
                        field.onChange(e)
                        // Auto-generate slug if in create mode and slug is empty
                        if (mode === 'create' && !form.getValues('slug')) {
                          form.setValue('slug', generateSlug(e.target.value))
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Tên đầy đủ của chuyên mục
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Slug (URL thân thiện) <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="VD: khoa-hoc-hau-can-ky-thuat"
                      {...field}
                      disabled={isLoading}
                      className="lowercase"
                    />
                  </FormControl>
                  <FormDescription>
                    Đường dẫn URL cho chuyên mục (tự động tạo từ tên)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mô tả ngắn gọn về chuyên mục..."
                      {...field}
                      disabled={isLoading}
                      rows={4}
                    />
                  </FormControl>
                  <FormDescription>
                    Mô tả chi tiết về phạm vi và nội dung của chuyên mục (không bắt buộc)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-green-700 hover:bg-green-800"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {mode === 'create' ? 'Tạo chuyên mục' : 'Lưu thay đổi'}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Hủy
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
