
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Banner {
  id: string;
  title?: string;
  titleEn?: string;
  subtitle?: string;
  subtitleEn?: string;
  imageUrl: string;
  linkUrl?: string;
  linkTarget: string;
  buttonText?: string;
  buttonTextEn?: string;
  altText?: string;
}

interface HomeBannerSliderDynamicProps {
  initialBanners: Banner[];
}

export function HomeBannerSliderDynamic({ initialBanners }: HomeBannerSliderDynamicProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Only use the first banner
  const banner = initialBanners.length > 0 ? initialBanners[0] : null;

  useEffect(() => {
    // Generate signed URL for the first banner image only
    const loadImage = async () => {
      if (!banner) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/banners/${banner.id}/image-url`);
        const data = await response.json();
        if (data.success && data.url) {
          setImageUrl(data.url);
        }
      } catch (error) {
        console.error('Error loading banner image:', error);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [banner]);

  useEffect(() => {
    // Track banner view
    if (banner) {
      fetch(`/api/banners/${banner.id}/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'view' }),
      }).catch(console.error);
    }
  }, [banner]);

  const handleBannerClick = () => {
    // Track banner click
    if (banner) {
      fetch(`/api/banners/${banner.id}/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'click' }),
      }).catch(console.error);
    }
  };

  if (loading || !banner) {
    return (
      <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] bg-gradient-to-br from-emerald-100 to-blue-100 dark:from-emerald-900 dark:to-blue-900 rounded-xl overflow-hidden animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Đang tải banner...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] rounded-xl overflow-hidden shadow-2xl">
      {/* Banner Image */}
      {imageUrl && (
        <div className="absolute inset-0">
          <Image
            src={imageUrl}
            alt={banner.altText || banner.title || 'Banner'}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        </div>
      )}

      {/* Content Overlay */}
      {(banner.title || banner.subtitle) && (
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl text-white">
              {banner.title && (
                <h2 className="text-3xl md:text-5xl font-bold mb-4 drop-shadow-lg animate-fade-in">
                  {banner.title}
                </h2>
              )}
              {banner.subtitle && (
                <p className="text-lg md:text-xl mb-6 drop-shadow-md opacity-90 animate-fade-in">
                  {banner.subtitle}
                </p>
              )}
              {banner.linkUrl && banner.buttonText && (
                <Button
                  asChild
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg animate-fade-in"
                >
                  <Link
                    href={banner.linkUrl}
                    target={banner.linkTarget}
                    onClick={handleBannerClick}
                  >
                    {banner.buttonText}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
