"use client";

import { useEffect, useState } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import { toast } from 'sonner';
import { EditorBubbleMenu } from './editor-bubble-menu';
import { EditorToolbar } from './editor-toolbar';
import { SlashCommand } from './editor-slash-command';
import { MediaPicker } from './media-picker';
import { getImageUrl } from '@/lib/image-utils';

interface ModernEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  enableAutoSave?: boolean;
  onAutoSave?: (content: string) => Promise<void>;
}

export function ModernEditor({
  value,
  onChange,
  placeholder = "Gõ '/' để xem lệnh nhanh...",
  height = "500px",
  enableAutoSave = false,
  onAutoSave,
}: ModernEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      ImageExtension.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline cursor-pointer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      HorizontalRule,
      TextStyle,
      Color.configure({
        types: ['textStyle'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: value,
    immediatelyRender: false, // Fix SSR hydration mismatch
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none max-w-none',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);

      // Auto-save after 3 seconds of inactivity
      if (enableAutoSave && onAutoSave) {
        const timer = setTimeout(async () => {
          try {
            setIsSaving(true);
            await onAutoSave(html);
            setLastSaved(new Date());
          } catch (error) {
            console.error('Auto-save failed:', error);
          } finally {
            setIsSaving(false);
          }
        }, 3000);

        return () => clearTimeout(timer);
      }
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update editor content when value prop changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Open Media Picker
  const handleOpenMediaPicker = () => {
    setShowMediaPicker(true);
  };

  // Handle media selection from picker
  const handleMediaSelect = (media: any) => {
    if (!editor) return;

    const imageUrl = getImageUrl(media.cloudStoragePath);
    
    editor
      .chain()
      .focus()
      .setImage({ 
        src: imageUrl,
        alt: media.altText || media.title || media.fileName,
      })
      .run();

    toast.success('Đã chèn ảnh vào nội dung');
  };

  // Legacy image upload handler (for file input if needed)
  const handleImageUpload = async (file: File): Promise<string> => {
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      throw new Error('Invalid file type');
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 5MB');
      throw new Error('File too large');
    }

    const formData = new FormData();
    formData.append('image', file);

    const toastId = toast.loading('Đang upload ảnh...');

    try {
      const response = await fetch('/api/news/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.data.url) {
        toast.success('Đã upload ảnh thành công', { id: toastId });
        return data.data.url;
      } else {
        toast.error(data.message || 'Lỗi khi upload ảnh', { id: toastId });
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      toast.error('Lỗi kết nối khi upload ảnh', { id: toastId });
      throw error;
    }
  };

  if (!isMounted) {
    return (
      <div
        className="border rounded-md p-4 bg-muted/50 animate-pulse"
        style={{ height }}
      >
        <div className="h-full flex items-center justify-center text-muted-foreground">
          Đang tải editor...
        </div>
      </div>
    );
  }

  if (!editor) {
    return null;
  }

  return (
    <div className="modern-editor-wrapper border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <EditorToolbar 
        editor={editor} 
        onImageUpload={handleImageUpload}
        onOpenMediaPicker={handleOpenMediaPicker}
      />

      {/* Bubble Menu */}
      <EditorBubbleMenu editor={editor} />

      {/* Slash Command */}
      <SlashCommand 
        editor={editor} 
        onImageUpload={handleImageUpload}
        onOpenMediaPicker={handleOpenMediaPicker}
      />

      {/* Media Picker Dialog */}
      <MediaPicker
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={handleMediaSelect}
        allowUpload={true}
      />

      {/* Editor Content */}
      <div
        className="editor-content p-4 overflow-y-auto"
        style={{ minHeight: height }}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Auto-save indicator */}
      {enableAutoSave && (
        <div className="px-4 py-2 bg-muted/50 text-xs text-muted-foreground flex items-center justify-between border-t">
          <span>
            {isSaving
              ? 'Đang lưu...'
              : lastSaved
              ? `Đã lưu lúc ${lastSaved.toLocaleTimeString('vi-VN')}`
              : 'Tự động lưu đã bật'}
          </span>
          <span className="text-xs">
            {editor.storage.characterCount?.characters() || 0} ký tự
          </span>
        </div>
      )}

      <style jsx global>{`
        .modern-editor-wrapper {
          font-family: inherit;
        }

        .modern-editor-wrapper .ProseMirror {
          padding: 1rem;
          min-height: ${height};
        }

        .modern-editor-wrapper .ProseMirror:focus {
          outline: none;
        }

        .modern-editor-wrapper .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
        }

        .modern-editor-wrapper .ProseMirror h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          line-height: 1.2;
        }

        .modern-editor-wrapper .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
          line-height: 1.3;
        }

        .modern-editor-wrapper .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }

        .modern-editor-wrapper .ProseMirror ul,
        .modern-editor-wrapper .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 0.75rem 0;
        }

        .modern-editor-wrapper .ProseMirror li {
          margin: 0.25rem 0;
        }

        .modern-editor-wrapper .ProseMirror blockquote {
          border-left: 4px solid hsl(var(--primary));
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: hsl(var(--muted-foreground));
        }

        .modern-editor-wrapper .ProseMirror code {
          background: hsl(var(--muted));
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
          font-family: 'Courier New', monospace;
        }

        .modern-editor-wrapper .ProseMirror pre {
          background: hsl(var(--muted));
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
        }

        .modern-editor-wrapper .ProseMirror pre code {
          background: none;
          padding: 0;
        }

        .modern-editor-wrapper .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }

        .modern-editor-wrapper .ProseMirror a {
          color: hsl(var(--primary));
          text-decoration: underline;
          cursor: pointer;
        }

        .modern-editor-wrapper .ProseMirror mark {
          background-color: #fef08a;
          padding: 0.125rem 0.25rem;
          border-radius: 0.125rem;
        }

        /* Dark mode adjustments */
        .dark .modern-editor-wrapper .ProseMirror mark {
          background-color: #854d0e;
        }
      `}</style>
    </div>
  );
}
