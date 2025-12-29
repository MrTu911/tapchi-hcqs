
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Search,
  FileText,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/rich-text-editor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PublicPage {
  id: string;
  slug: string;
  title: string;
  titleEn?: string | null;
  content: string;
  contentEn?: string | null;
  metaTitle?: string | null;
  metaDesc?: string | null;
  ogImage?: string | null;
  isPublished: boolean;
  publishedAt?: string | null;
  template: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export default function PublicPagesManagement() {
  const router = useRouter();
  const [pages, setPages] = useState<PublicPage[]>([]);
  const [filteredPages, setFilteredPages] = useState<PublicPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [revalidating, setRevalidating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    titleEn: "",
    content: "",
    contentEn: "",
    metaTitle: "",
    metaDesc: "",
    ogImage: "",
    isPublished: false,
    template: "default",
    order: 0
  });

  useEffect(() => {
    fetchPages();
  }, []);

  useEffect(() => {
    // Filter pages based on search query
    const filtered = pages.filter(
      (page) =>
        page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredPages(filtered);
  }, [searchQuery, pages]);

  const fetchPages = async () => {
    try {
      const res = await fetch("/api/public-pages");
      const data = await res.json();
      if (data.success) {
        setPages(data.data);
        setFilteredPages(data.data);
      } else {
        toast.error("Không thể tải danh sách trang");
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách trang");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.slug || !formData.title || !formData.content) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    try {
      const res = await fetch("/api/public-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success("Tạo trang thành công!");
        setCreateDialogOpen(false);
        resetForm();
        fetchPages();
      } else {
        toast.error(data.message || "Không thể tạo trang");
      }
    } catch (error) {
      toast.error("Lỗi khi tạo trang");
    }
  };

  const handleDelete = async () => {
    if (!pageToDelete) return;

    try {
      const res = await fetch(`/api/public-pages/${pageToDelete}`, {
        method: "DELETE",
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success("Xóa trang thành công!");
        setDeleteDialogOpen(false);
        setPageToDelete(null);
        fetchPages();
      } else {
        toast.error(data.message || "Không thể xóa trang");
      }
    } catch (error) {
      toast.error("Lỗi khi xóa trang");
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/public-pages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success(
          !currentStatus ? "Đã xuất bản trang" : "Đã ẩn trang"
        );
        fetchPages();
      } else {
        toast.error(data.message || "Không thể cập nhật trạng thái");
      }
    } catch (error) {
      toast.error("Lỗi khi cập nhật trạng thái");
    }
  };

  const handleRevalidateCache = async () => {
    setRevalidating(true);
    try {
      const res = await fetch("/api/cache/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paths: ["/", ...pages.map(p => `/pages/${p.slug}`)]
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success("Đã làm mới cache thành công!");
      } else {
        toast.error(data.message || "Không thể làm mới cache");
      }
    } catch (error) {
      toast.error("Lỗi khi làm mới cache");
    } finally {
      setRevalidating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      slug: "",
      title: "",
      titleEn: "",
      content: "",
      contentEn: "",
      metaTitle: "",
      metaDesc: "",
      ogImage: "",
      isPublished: false,
      template: "default",
      order: 0
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Trang Công khai</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý nội dung các trang tĩnh (Giới thiệu, Liên hệ, v.v.)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRevalidateCache}
            variant="outline"
            disabled={revalidating}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${revalidating ? 'animate-spin' : ''}`} />
            Làm mới Cache
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo trang mới
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tiêu đề hoặc slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pages List */}
      <div className="grid gap-4">
        {filteredPages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">Chưa có trang nào</p>
              <p className="text-muted-foreground">
                Tạo trang đầu tiên để bắt đầu
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPages.map((page) => (
            <Card key={page.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{page.title}</h3>
                      {page.isPublished ? (
                        <Badge variant="default">
                          <Eye className="h-3 w-3 mr-1" />
                          Đã xuất bản
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Nháp
                        </Badge>
                      )}
                      <Badge variant="outline">{page.template}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Slug: <code className="bg-muted px-2 py-1 rounded">/pages/{page.slug}</code>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Cập nhật: {new Date(page.updatedAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTogglePublish(page.id, page.isPublished)}
                    >
                      {page.isPublished ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Ẩn
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Xuất bản
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/dashboard/admin/cms/pages/${page.id}`)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setPageToDelete(page.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tạo trang mới</DialogTitle>
            <DialogDescription>
              Tạo một trang công khai mới cho website
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug (URL) *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="gioi-thieu"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Tiêu đề *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Giới thiệu"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="titleEn">Tiêu đề tiếng Anh</Label>
              <Input
                id="titleEn"
                value={formData.titleEn}
                onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                placeholder="About"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Nội dung *</Label>
              <RichTextEditor
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
                placeholder="Nhập nội dung trang..."
                height="400px"
              />
              <p className="text-xs text-muted-foreground">
                Sử dụng thanh công cụ để định dạng văn bản, thêm hình ảnh, video, v.v.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="template">Template</Label>
              <Select
                value={formData.template}
                onValueChange={(value) => setFormData({ ...formData, template: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="about">About</SelectItem>
                  <SelectItem value="contact">Contact</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isPublished"
                checked={formData.isPublished}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
              />
              <Label htmlFor="isPublished">Xuất bản ngay</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreate}>
              Tạo trang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa trang này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPageToDelete(null)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
