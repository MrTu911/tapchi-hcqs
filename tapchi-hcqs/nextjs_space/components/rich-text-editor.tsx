"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { toast } from 'sonner';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
}

export function RichTextEditor({ value, onChange, placeholder = "Nhập nội dung...", height = "300px" }: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);
  const quillRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Custom image handler
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // Validate file
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh không được vượt quá 5MB');
        return;
      }

      // Upload image
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
          // Insert image into editor
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection();
            quill.insertEmbed(range?.index || 0, 'image', data.data.url);
            quill.setSelection((range?.index || 0) + 1);
          }
          toast.success('Đã upload ảnh thành công', { id: toastId });
        } else {
          toast.error(data.message || 'Lỗi khi upload ảnh', { id: toastId });
        }
      } catch (error) {
        toast.error('Lỗi kết nối khi upload ảnh', { id: toastId });
      }
    };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'align': [] }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
  }), []);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet', 'indent',
    'align',
    'blockquote', 'code-block',
    'link', 'image', 'video'
  ];

  if (!mounted) {
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

  return (
    <div className="rich-text-editor-wrapper">
      <ReactQuill
        {...({ ref: quillRef } as any)}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{ height }}
        className="bg-background"
      />
      <style jsx global>{`
        .rich-text-editor-wrapper .quill {
          background: white;
          border-radius: 0.375rem;
        }
        .dark .rich-text-editor-wrapper .quill {
          background: hsl(var(--background));
        }
        .rich-text-editor-wrapper .ql-toolbar {
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
          border-color: hsl(var(--border));
          background: hsl(var(--muted));
        }
        .rich-text-editor-wrapper .ql-container {
          border-bottom-left-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
          border-color: hsl(var(--border));
          font-family: inherit;
        }
        .rich-text-editor-wrapper .ql-editor {
          min-height: ${height};
          font-size: 0.875rem;
          line-height: 1.5;
        }
        .rich-text-editor-wrapper .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
          font-style: normal;
        }
      `}</style>
    </div>
  );
}
