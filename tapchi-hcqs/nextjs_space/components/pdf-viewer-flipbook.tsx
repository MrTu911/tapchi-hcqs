
'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize, Minimize, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

// Dynamic import to avoid SSR issues with DOM dependencies
const HTMLFlipBook = dynamic(() => import('react-pageflip'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
});

// Set worker path - use local worker file
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;
}

interface PdfFlipbookProps {
  fileUrl: string;
  width?: number;
  height?: number;
}

export default function PdfFlipbook({ fileUrl, width = 600, height = 800 }: PdfFlipbookProps) {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1.5);
  const flipBookRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);

        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        const renderPages: string[] = [];
        
        setTotalPages(pdf.numPages);

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          await page.render({ 
            canvasContext: ctx, 
            viewport
          }).promise;
          
          renderPages.push(canvas.toDataURL());
        }

        setPages(renderPages);
        setLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Không thể tải file PDF. Vui lòng thử lại.');
        setLoading(false);
      }
    };

    loadPdf();
  }, [fileUrl, scale]);

  const onFlip = (e: any) => {
    setCurrentPage(e.data);
  };

  const nextPage = () => {
    if (flipBookRef.current) {
      flipBookRef.current.pageFlip().flipNext();
    }
  };

  const prevPage = () => {
    if (flipBookRef.current) {
      flipBookRef.current.pageFlip().flipPrev();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const zoomIn = () => {
    if (scale < 3) {
      setScale(scale + 0.2);
    }
  };

  const zoomOut = () => {
    if (scale > 0.8) {
      setScale(scale - 0.2);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Đang tải PDF...</p>
        <p className="text-sm text-muted-foreground mt-2">
          Vui lòng đợi trong giây lát
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="bg-destructive/10 text-destructive px-6 py-4 rounded-lg">
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!pages.length) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Không có nội dung để hiển thị</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col items-center bg-gray-100 dark:bg-gray-900 p-6 rounded-lg">
      {/* Controls */}
      <div className="mb-4 flex items-center gap-2 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md">
        <Button variant="outline" size="sm" onClick={prevPage} disabled={currentPage === 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="px-4 text-sm font-medium">
          Trang {currentPage + 1} / {totalPages}
        </div>
        
        <Button variant="outline" size="sm" onClick={nextPage} disabled={currentPage >= totalPages - 1}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-gray-300 mx-2" />
        
        <Button variant="outline" size="sm" onClick={zoomOut} disabled={scale <= 0.8}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <div className="px-2 text-xs text-muted-foreground">
          {Math.round(scale * 100)}%
        </div>
        
        <Button variant="outline" size="sm" onClick={zoomIn} disabled={scale >= 3}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-gray-300 mx-2" />
        
        <Button variant="outline" size="sm" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      </div>

      {/* Flipbook */}
      <div className="shadow-2xl">
        <HTMLFlipBook
          ref={flipBookRef}
          width={width}
          height={height}
          size="stretch"
          minWidth={300}
          maxWidth={1000}
          minHeight={400}
          maxHeight={1400}
          maxShadowOpacity={0.5}
          showCover={true}
          mobileScrollSupport={true}
          onFlip={onFlip}
          className="shadow-lg"
          style={{}}
          startPage={0}
          drawShadow={true}
          flippingTime={1000}
          usePortrait={true}
          startZIndex={0}
          autoSize={true}
          clickEventForward={true}
          useMouseEvents={true}
          swipeDistance={30}
          showPageCorners={true}
          disableFlipByClick={false}
        >
          {pages.map((src, idx) => (
            <div key={idx} className="bg-white shadow-inner">
              <img 
                src={src} 
                alt={`Trang ${idx + 1}`} 
                className="w-full h-full object-contain"
                style={{ userSelect: 'none' }}
              />
            </div>
          ))}
        </HTMLFlipBook>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-sm text-muted-foreground">
        <p>💡 Mẹo: Nhấp vào góc trang hoặc kéo để lật trang</p>
      </div>
    </div>
  );
}
