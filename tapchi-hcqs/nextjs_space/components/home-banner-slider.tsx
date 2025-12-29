
'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';
import Image from 'next/image';

interface Banner {
  id: string;
  title?: string;
  subtitle?: string;
  imageUrl: string;
  imageUrlSigned?: string; // Signed URL từ API
  linkUrl?: string;
  buttonText?: string;
}

export default function HomeBannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/banners?active=true');
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        setBanners(data.data);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  if (loading) {
    return (
      <div className="relative w-full aspect-[21/9] bg-muted animate-pulse rounded-lg" />
    );
  }

  if (banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative w-full aspect-[21/9] rounded-lg overflow-hidden group">
      {/* Banner Image */}
      <div className="absolute inset-0">
        <Image
          src={currentBanner?.imageUrlSigned || currentBanner?.imageUrl}
          alt={currentBanner?.title || 'Banner'}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* Banner Content */}
      {(currentBanner?.title || currentBanner?.subtitle) && (
        <div className="absolute inset-0 flex items-end p-8 md:p-12">
          <div className="max-w-2xl text-white space-y-4">
            {currentBanner.title && (
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                {currentBanner.title}
              </h2>
            )}
            {currentBanner.subtitle && (
              <p className="text-lg md:text-xl opacity-90">
                {currentBanner.subtitle}
              </p>
            )}
            {currentBanner.linkUrl && (
              <Link href={currentBanner.linkUrl}>
                <Button size="lg" className="mt-4">
                  {currentBanner.buttonText || 'Xem thêm'}
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
