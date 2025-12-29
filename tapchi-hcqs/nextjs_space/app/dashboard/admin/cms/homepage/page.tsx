'use client';

import { useState, useEffect } from 'react';
import { 
  Star, Plus, Trash2, LayoutDashboard, FileText, ArrowUp, ArrowDown, Search,
  Eye, Edit, GripVertical, Layout, Image, Type, BarChart, Mail, Box
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FeaturedArticle {
  id: string;
  articleId: string;
  position: number;
  reason?: string;
  isActive: boolean;
  article: {
    id: string;
    submission: {
      title: string;
      titleEn?: string;
      author: { fullName: string };
    };
    issue?: {
      volumeNo: string;
      issueNo: string;
      year: string;
    };
  };
}

interface Article {
  id: string;
  submission: {
    title: string;
    titleEn?: string;
    author: { fullName: string };
  };
  issue?: {
    volumeNo: string;
    issueNo: string;
    year: string;
  };
}

interface HomepageSection {
  id: string;
  key: string;
  type: string;
  title?: string;
  titleEn?: string;
  subtitle?: string;
  subtitleEn?: string;
  content?: string;
  contentEn?: string;
  imageUrl?: string;
  linkUrl?: string;
  linkText?: string;
  linkTextEn?: string;
  settings?: any;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const SECTION_TYPES = [
  { value: 'hero', label: 'Hero Banner', icon: Layout, description: 'Banner chính với hình ảnh lớn' },
  { value: 'articles', label: 'Bài viết', icon: FileText, description: 'Hiển thị danh sách bài viết' },
  { value: 'issues', label: 'Tạp chí', icon: Box, description: 'Hiển thị số tạp chí' },
  { value: 'text', label: 'Văn bản', icon: Type, description: 'Nội dung văn bản tùy chỉnh' },
  { value: 'stats', label: 'Thống kê', icon: BarChart, description: 'Hiển thị số liệu thống kê' },
  { value: 'cards', label: 'Cards', icon: Layout, description: 'Các card thông tin' },
  { value: 'newsletter', label: 'Newsletter', icon: Mail, description: 'Form đăng ký nhận tin' },
] as const;

// Sortable Section Item Component
function SortableSectionItem({ 
  section, 
  onEdit, 
  onDelete, 
  onPreview 
}: { 
  section: HomepageSection; 
  onEdit: (section: HomepageSection) => void;
  onDelete: (section: HomepageSection) => void;
  onPreview: (section: HomepageSection) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sectionType = SECTION_TYPES.find(t => t.value === section.type);
  const Icon = sectionType?.icon || Layout;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-3 flex-1">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">
              {section.title || section.key}
            </h3>
            <Badge variant={section.isActive ? 'default' : 'secondary'}>
              {section.isActive ? 'Hiển thị' : 'Ẩn'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {sectionType?.label} • Key: {section.key}
          </p>
        </div>
      </div>

      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPreview(section)}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(section)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(section)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function HomepageManagementPage() {
  // Featured Articles State
  const [featuredArticles, setFeaturedArticles] = useState<FeaturedArticle[]>([]);
  const [availableArticles, setAvailableArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<FeaturedArticle | null>(null);

  // Homepage Sections State
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [deleteSectionDialog, setDeleteSectionDialog] = useState(false);
  const [currentSection, setCurrentSection] = useState<HomepageSection | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<HomepageSection | null>(null);
  const [activeTab, setActiveTab] = useState('featured');

  // Form state for section editing
  const [formData, setFormData] = useState({
    key: '',
    type: 'hero',
    title: '',
    titleEn: '',
    subtitle: '',
    subtitleEn: '',
    content: '',
    contentEn: '',
    imageUrl: '',
    linkUrl: '',
    linkText: '',
    linkTextEn: '',
    isActive: true,
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchFeaturedArticles();
    fetchAvailableArticles();
    fetchSections();
  }, []);

  const fetchFeaturedArticles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/featured-articles');
      const data = await res.json();
      
      if (data.success) {
        setFeaturedArticles(data.data);
      } else {
        toast.error('Lỗi khi tải bài viết nổi bật');
      }
    } catch (error) {
      console.error('Error fetching featured articles:', error);
      toast.error('Lỗi khi tải bài viết nổi bật');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableArticles = async () => {
    try {
      const res = await fetch('/api/articles?status=PUBLISHED&limit=100');
      const data = await res.json();
      
      if (data.success && data.data?.articles) {
        setAvailableArticles(data.data.articles);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
  };

  // Homepage Sections Functions
  const fetchSections = async () => {
    try {
      setSectionsLoading(true);
      const res = await fetch('/api/homepage-sections');
      const data = await res.json();
      
      if (data.success) {
        setSections(data.data);
      } else {
        toast.error('Lỗi khi tải sections');
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast.error('Lỗi khi tải sections');
    } finally {
      setSectionsLoading(false);
    }
  };

  const handleEditSection = (section: HomepageSection) => {
    setCurrentSection(section);
    setFormData({
      key: section.key,
      type: section.type,
      title: section.title || '',
      titleEn: section.titleEn || '',
      subtitle: section.subtitle || '',
      subtitleEn: section.subtitleEn || '',
      content: section.content || '',
      contentEn: section.contentEn || '',
      imageUrl: section.imageUrl || '',
      linkUrl: section.linkUrl || '',
      linkText: section.linkText || '',
      linkTextEn: section.linkTextEn || '',
      isActive: section.isActive,
    });
    setEditDialog(true);
  };

  const handleCreateSection = () => {
    setCurrentSection(null);
    setFormData({
      key: '',
      type: 'hero',
      title: '',
      titleEn: '',
      subtitle: '',
      subtitleEn: '',
      content: '',
      contentEn: '',
      imageUrl: '',
      linkUrl: '',
      linkText: '',
      linkTextEn: '',
      isActive: true,
    });
    setEditDialog(true);
  };

  const handleSaveSection = async () => {
    try {
      if (!formData.key || !formData.type) {
        toast.error('Key và Type là bắt buộc');
        return;
      }

      const url = currentSection 
        ? `/api/homepage-sections/${currentSection.id}`
        : '/api/homepage-sections';
      
      const method = currentSection ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(currentSection ? 'Đã cập nhật section' : 'Đã tạo section mới');
        setEditDialog(false);
        fetchSections();
      } else {
        toast.error(data.error || 'Lỗi khi lưu section');
      }
    } catch (error) {
      console.error('Error saving section:', error);
      toast.error('Lỗi khi lưu section');
    }
  };

  const handleDeleteSection = async () => {
    if (!sectionToDelete) return;
    
    try {
      const res = await fetch(`/api/homepage-sections/${sectionToDelete.id}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('Đã xóa section');
        setDeleteSectionDialog(false);
        setSectionToDelete(null);
        fetchSections();
      } else {
        toast.error('Lỗi khi xóa');
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error('Lỗi khi xóa');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    
    const newSections = arrayMove(sections, oldIndex, newIndex).map((s, index) => ({
      ...s,
      order: index,
    }));
    
    setSections(newSections);
    
    try {
      await Promise.all(
        newSections.map((s) =>
          fetch(`/api/homepage-sections/${s.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: s.order }),
          })
        )
      );
      toast.success('Đã cập nhật thứ tự sections');
    } catch (error) {
      console.error('Error reordering sections:', error);
      toast.error('Lỗi khi cập nhật thứ tự');
      fetchSections();
    }
  };

  const handlePreviewSection = (section: HomepageSection) => {
    setCurrentSection(section);
    setPreviewDialog(true);
  };

  const handleAddFeatured = async (articleId: string) => {
    try {
      const res = await fetch('/api/featured-articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('Đã thêm bài viết nổi bật');
        fetchFeaturedArticles();
      } else {
        toast.error(data.error || 'Lỗi khi thêm bài viết nổi bật');
      }
    } catch (error) {
      console.error('Error adding featured article:', error);
      toast.error('Lỗi khi thêm bài viết nổi bật');
    }
  };

  const handleDelete = async () => {
    if (!articleToDelete) return;
    
    try {
      const res = await fetch(`/api/featured-articles/${articleToDelete.id}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('Đã xóa bài viết nổi bật');
        setDeleteDialog(false);
        setArticleToDelete(null);
        fetchFeaturedArticles();
      } else {
        toast.error('Lỗi khi xóa');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Lỗi khi xóa');
    }
  };

  const moveArticle = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = featuredArticles.findIndex(a => a.id === id);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= featuredArticles.length) return;
    
    const newArticles = [...featuredArticles];
    [newArticles[currentIndex], newArticles[targetIndex]] = 
      [newArticles[targetIndex], newArticles[currentIndex]];
    
    // Update positions
    const updates = newArticles.map((article, index) => ({
      id: article.id,
      position: index,
    }));
    
    // Optimistic update
    setFeaturedArticles(newArticles.map((a, i) => ({ ...a, position: i })));
    
    try {
      await Promise.all(
        updates.map(u =>
          fetch(`/api/featured-articles/${u.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ position: u.position }),
          })
        )
      );
      toast.success('Đã cập nhật thứ tự');
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Lỗi khi cập nhật thứ tự');
      fetchFeaturedArticles();
    }
  };

  const filteredArticles = availableArticles.filter(article => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      article.submission.title.toLowerCase().includes(query) ||
      article.submission.titleEn?.toLowerCase().includes(query) ||
      article.submission.author.fullName.toLowerCase().includes(query)
    );
  });

  // Filter out already featured articles
  const unfeaturedArticles = filteredArticles.filter(
    article => !featuredArticles.some(fa => fa.articleId === article.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-8 w-8" />
            Quản lý Trang chủ
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý các sections và bài viết nổi bật hiển thị trên trang chủ
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="featured">
            <Star className="h-4 w-4 mr-2" />
            Bài viết nổi bật
          </TabsTrigger>
          <TabsTrigger value="sections">
            <Layout className="h-4 w-4 mr-2" />
            Homepage Sections
          </TabsTrigger>
        </TabsList>

        {/* Featured Articles Tab */}
        <TabsContent value="featured" className="space-y-4 mt-6">

      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Quản lý bài viết nổi bật
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <li>• Chọn bài viết đã xuất bản để hiển thị trên trang chủ</li>
                <li>• Sử dụng nút ↑ ↓ để thay đổi thứ tự hiển thị</li>
                <li>• Bài viết ở vị trí đầu sẽ được ưu tiên hiển thị</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Featured Articles List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Bài viết nổi bật ({featuredArticles.length})
          </CardTitle>
          <CardDescription>
            Các bài viết được hiển thị trên trang chủ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            </div>
          ) : featuredArticles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Star className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Chưa có bài viết nổi bật nào</p>
              <p className="text-sm mt-1">Thêm bài viết từ danh sách bên dưới</p>
            </div>
          ) : (
            <div className="space-y-2">
              {featuredArticles.map((featured, index) => (
                <div
                  key={featured.id}
                  className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </Badge>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold line-clamp-2">
                      {featured.article.submission.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {featured.article.submission.author.fullName}
                    </p>
                    {featured.article.issue && (
                      <Badge variant="secondary" className="text-xs mt-2">
                        Số {featured.article.issue.issueNo}/{featured.article.issue.year}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveArticle(featured.id, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveArticle(featured.id, 'down')}
                      disabled={index === featuredArticles.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <div className="border-t my-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setArticleToDelete(featured);
                        setDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Articles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Bài viết đã xuất bản
            </span>
          </CardTitle>
          <CardDescription>
            Chọn bài viết để thêm vào danh sách nổi bật
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm bài viết..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {unfeaturedArticles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Không có bài viết nào phù hợp</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {unfeaturedArticles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-start justify-between gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium line-clamp-2">
                      {article.submission.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {article.submission.author.fullName}
                    </p>
                    {article.issue && (
                      <Badge variant="secondary" className="text-xs mt-2">
                        Số {article.issue.issueNo}/{article.issue.year}
                      </Badge>
                    )}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleAddFeatured(article.id)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Thêm
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bài viết "
              <strong>{articleToDelete?.article.submission.title}</strong>" khỏi danh sách nổi bật?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </TabsContent>

        {/* Homepage Sections Tab */}
        <TabsContent value="sections" className="space-y-4 mt-6">
          <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Layout className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Quản lý Homepage Sections
                  </h3>
                  <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                    <li>• Tạo và chỉnh sửa các sections hiển thị trên trang chủ</li>
                    <li>• Kéo thả để sắp xếp thứ tự hiển thị</li>
                    <li>• Xem trước trước khi publish</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleCreateSection}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo Section mới
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Homepage Sections ({sections.length})</CardTitle>
              <CardDescription>
                Kéo thả để sắp xếp lại thứ tự hiển thị
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sectionsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                </div>
              ) : sections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Layout className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Chưa có section nào</p>
                  <p className="text-sm mt-1">Nhấn "Tạo Section mới" để bắt đầu</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={sections.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {sections.map((section) => (
                        <SortableSectionItem
                          key={section.id}
                          section={section}
                          onEdit={handleEditSection}
                          onDelete={(s) => {
                            setSectionToDelete(s);
                            setDeleteSectionDialog(true);
                          }}
                          onPreview={handlePreviewSection}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Section Edit/Create Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentSection ? 'Chỉnh sửa Section' : 'Tạo Section mới'}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin section. Key phải unique và không chứa khoảng trắng.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="key">Key * (Unique ID)</Label>
                <Input
                  id="key"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                  placeholder="hero_banner"
                  disabled={!!currentSection}
                />
              </div>
              <div>
                <Label htmlFor="type">Loại Section *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Tiêu đề (VI)</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="titleEn">Title (EN)</Label>
                <Input
                  id="titleEn"
                  value={formData.titleEn}
                  onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subtitle">Phụ đề (VI)</Label>
                <Textarea
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="subtitleEn">Subtitle (EN)</Label>
                <Textarea
                  id="subtitleEn"
                  value={formData.subtitleEn}
                  onChange={(e) => setFormData({ ...formData, subtitleEn: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="content">Nội dung (VI)</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={5}
                  placeholder="HTML hoặc JSON"
                />
              </div>
              <div>
                <Label htmlFor="contentEn">Content (EN)</Label>
                <Textarea
                  id="contentEn"
                  value={formData.contentEn}
                  onChange={(e) => setFormData({ ...formData, contentEn: e.target.value })}
                  rows={5}
                  placeholder="HTML or JSON"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="/images/hero.jpg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="linkUrl">Link URL</Label>
                <Input
                  id="linkUrl"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  placeholder="/about"
                />
              </div>
              <div>
                <Label htmlFor="linkText">Link Text (VI)</Label>
                <Input
                  id="linkText"
                  value={formData.linkText}
                  onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="linkTextEn">Link Text (EN)</Label>
              <Input
                id="linkTextEn"
                value={formData.linkTextEn}
                onChange={(e) => setFormData({ ...formData, linkTextEn: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Hiển thị trên trang chủ</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveSection}>
              {currentSection ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Section Delete Dialog */}
      <AlertDialog open={deleteSectionDialog} onOpenChange={setDeleteSectionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa section "
              <strong>{sectionToDelete?.title || sectionToDelete?.key}</strong>"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSection}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Section Preview Dialog */}
      <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview: {currentSection?.title || currentSection?.key}
            </DialogTitle>
          </DialogHeader>

          {currentSection && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Key:</span> {currentSection.key}
                </div>
                <div>
                  <span className="font-semibold">Type:</span> {currentSection.type}
                </div>
                <div>
                  <span className="font-semibold">Status:</span>{' '}
                  <Badge variant={currentSection.isActive ? 'default' : 'secondary'}>
                    {currentSection.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <span className="font-semibold">Order:</span> {currentSection.order}
                </div>
              </div>

              <div className="border rounded-lg p-6 bg-muted/30">
                <div className="space-y-4">
                  {currentSection.imageUrl && (
                    <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
                      <img
                        src={currentSection.imageUrl}
                        alt={currentSection.title || ''}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {currentSection.title && (
                    <h2 className="text-2xl font-bold">{currentSection.title}</h2>
                  )}

                  {currentSection.subtitle && (
                    <p className="text-muted-foreground">{currentSection.subtitle}</p>
                  )}

                  {currentSection.content && (
                    <div className="prose dark:prose-invert max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: currentSection.content }} />
                    </div>
                  )}

                  {currentSection.linkUrl && currentSection.linkText && (
                    <div>
                      <Button asChild>
                        <a href={currentSection.linkUrl}>
                          {currentSection.linkText}
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setPreviewDialog(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
