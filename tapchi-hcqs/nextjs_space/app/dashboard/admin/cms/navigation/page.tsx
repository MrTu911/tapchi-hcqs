"use client";

import { useState, useEffect } from "react";
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
  GripVertical,
  Save,
  Link as LinkIcon,
  ExternalLink,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NavigationItem {
  id: string;
  label: string;
  labelEn?: string | null;
  url: string;
  position: number;
  parentId?: string | null;
  isActive: boolean;
  target: string;
  icon?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Sortable Item Component
function SortableNavigationItem({ item, onEdit, onDelete, onToggleActive }: {
  item: NavigationItem;
  onEdit: (item: NavigationItem) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 border rounded-lg bg-background hover:bg-muted/50 transition-colors ${
        isDragging ? 'shadow-lg z-50' : ''
      }`}
    >
      {/* Drag Handle */}
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium truncate">{item.label}</span>
          {item.labelEn && (
            <span className="text-sm text-muted-foreground truncate">({item.labelEn})</span>
          )}
          {item.isActive ? (
            <Badge variant="default" className="text-xs shrink-0">
              <Eye className="h-3 w-3 mr-1" />
              Hiển thị
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs shrink-0">
              <EyeOff className="h-3 w-3 mr-1" />
              Ẩn
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <LinkIcon className="h-3 w-3" />
          <span className="truncate">{item.url}</span>
          {item.target === '_blank' && <ExternalLink className="h-3 w-3 shrink-0" />}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onToggleActive(item.id, !item.isActive)}
        >
          {item.isActive ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEdit(item)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(item.id)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function NavigationManagement() {
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NavigationItem | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    label: "",
    labelEn: "",
    url: "",
    isActive: true,
    target: "_self",
    icon: ""
  });

  // Drag & drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/navigation");
      const data = await res.json();
      if (data.success) {
        setItems(data.data || []);
      } else {
        toast.error("Không thể tải danh sách menu");
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách menu");
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      // Update positions in backend
      await updatePositions(newItems);
    }
  };

  const updatePositions = async (reorderedItems: NavigationItem[]) => {
    setSaving(true);
    try {
      const updates = reorderedItems.map((item, index) => ({
        id: item.id,
        position: index
      }));

      const res = await fetch("/api/navigation/bulk-update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: updates }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Đã cập nhật thứ tự menu");
      } else {
        toast.error("Không thể cập nhật thứ tự");
        fetchItems(); // Revert
      }
    } catch (error) {
      toast.error("Lỗi khi cập nhật thứ tự");
      fetchItems(); // Revert
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.label.trim() || !formData.url.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      const res = await fetch("/api/navigation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          position: items.length,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Đã tạo menu mới");
        setCreateDialogOpen(false);
        resetForm();
        fetchItems();
      } else {
        toast.error(data.error || "Không thể tạo menu");
      }
    } catch (error) {
      toast.error("Lỗi khi tạo menu");
    }
  };

  const handleUpdate = async () => {
    if (!editingItem || !formData.label.trim() || !formData.url.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      const res = await fetch(`/api/navigation/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Đã cập nhật menu");
        setEditDialogOpen(false);
        setEditingItem(null);
        resetForm();
        fetchItems();
      } else {
        toast.error(data.error || "Không thể cập nhật menu");
      }
    } catch (error) {
      toast.error("Lỗi khi cập nhật menu");
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      const res = await fetch(`/api/navigation/${itemToDelete}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Đã xóa menu");
        setDeleteDialogOpen(false);
        setItemToDelete(null);
        fetchItems();
      } else {
        toast.error(data.error || "Không thể xóa menu");
      }
    } catch (error) {
      toast.error("Lỗi khi xóa menu");
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/navigation/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(isActive ? "Đã bật menu" : "Đã tắt menu");
        fetchItems();
      } else {
        toast.error("Không thể thay đổi trạng thái");
      }
    } catch (error) {
      toast.error("Lỗi khi thay đổi trạng thái");
    }
  };

  const handleEdit = (item: NavigationItem) => {
    setEditingItem(item);
    setFormData({
      label: item.label,
      labelEn: item.labelEn || "",
      url: item.url,
      isActive: item.isActive,
      target: item.target,
      icon: item.icon || ""
    });
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      label: "",
      labelEn: "",
      url: "",
      isActive: true,
      target: "_self",
      icon: ""
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
          <h1 className="text-3xl font-bold">Quản lý Điều hướng</h1>
          <p className="text-muted-foreground mt-1">
            Kéo thả để sắp xếp thứ tự menu
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saving && (
            <Badge variant="secondary" className="animate-pulse">
              <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full mr-2" />
              Đang lưu...
            </Badge>
          )}
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm menu
          </Button>
        </div>
      </div>

      {/* Warning */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="text-amber-600 dark:text-amber-400 mt-0.5">⚠️</div>
            <div className="flex-1">
              <p className="font-medium text-amber-900 dark:text-amber-100">Lưu ý quan trọng</p>
              <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                Các menu công khai hiện tại đã được đăng ký với Cục Báo chí. Vui lòng cân nhắc kỹ trước khi thay đổi.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items List với Drag & Drop */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
              Danh sách Menu ({items.length})
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Kéo <GripVertical className="h-4 w-4 inline" /> để sắp xếp
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12">
              <LinkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">Chưa có menu nào</p>
              <p className="text-muted-foreground">
                Thêm menu đầu tiên để bắt đầu
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {items.map((item) => (
                    <SortableNavigationItem
                      key={item.id}
                      item={item}
                      onEdit={handleEdit}
                      onDelete={(id) => {
                        setItemToDelete(id);
                        setDeleteDialogOpen(true);
                      }}
                      onToggleActive={handleToggleActive}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm menu mới</DialogTitle>
            <DialogDescription>
              Tạo mục điều hướng mới cho header
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="label">Nhãn hiển thị (VI) *</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Trang chủ"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="labelEn">Nhãn hiển thị (EN)</Label>
              <Input
                id="labelEn"
                value={formData.labelEn}
                onChange={(e) => setFormData({ ...formData, labelEn: e.target.value })}
                placeholder="Home"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">Đường dẫn URL *</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="/"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="target">Mở liên kết</Label>
              <Select
                value={formData.target}
                onValueChange={(value) => setFormData({ ...formData, target: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_self">Cùng tab</SelectItem>
                  <SelectItem value="_blank">Tab mới</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Hiển thị ngay</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCreateDialogOpen(false);
              resetForm();
            }}>
              Hủy
            </Button>
            <Button onClick={handleCreate}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Tạo menu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa menu</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin mục điều hướng
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-label">Nhãn hiển thị (VI) *</Label>
              <Input
                id="edit-label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Trang chủ"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-labelEn">Nhãn hiển thị (EN)</Label>
              <Input
                id="edit-labelEn"
                value={formData.labelEn}
                onChange={(e) => setFormData({ ...formData, labelEn: e.target.value })}
                placeholder="Home"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-url">Đường dẫn URL *</Label>
              <Input
                id="edit-url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="/"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-target">Mở liên kết</Label>
              <Select
                value={formData.target}
                onValueChange={(value) => setFormData({ ...formData, target: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_self">Cùng tab</SelectItem>
                  <SelectItem value="_blank">Tab mới</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="edit-isActive">Hiển thị</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditDialogOpen(false);
              setEditingItem(null);
              resetForm();
            }}>
              Hủy
            </Button>
            <Button onClick={handleUpdate}>
              <Save className="h-4 w-4 mr-2" />
              Lưu thay đổi
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
              Bạn có chắc chắn muốn xóa menu này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
