
'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface SlideItem {
  id: string;
  image: string;
  title: string;
  description: string;
  linkUrl?: string;
  buttonText?: string;
}

interface HeroBannerSliderProps {
  slides: SlideItem[];
}

export default function HeroBannerSlider({ slides }: HeroBannerSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (slides.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  if (slides.length === 0) {
    return (
      <div className="relative w-full h-[450px] bg-gradient-to-r from-emerald-500 to-blue-600 dark:from-emerald-700 dark:to-blue-800 rounded-2xl flex items-center justify-center shadow-2xl">
        <p className="text-white text-lg font-medium">Không có slides</p>
      </div>
    );
  }

  const currentSlide = slides[currentIndex];

  return (
    <div className="relative w-full h-[450px] rounded-2xl overflow-hidden shadow-2xl group">
      {/* Current Slide Image */}
      <div className="relative w-full h-full">
        <Image
          src={currentSlide.image}
          alt={currentSlide.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          priority
        />
        {/* Gradient Overlay - More vibrant */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        {/* Additional accent gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-transparent to-blue-600/20" />
      </div>

      {/* Caption */}
      <div className="absolute bottom-8 left-8 right-8 z-10 max-w-3xl">
        <div className="bg-gradient-to-r from-black/70 via-black/60 to-black/70 backdrop-blur-md px-8 py-6 rounded-2xl border border-white/10 shadow-2xl">
          <h2 className="text-white text-2xl md:text-3xl lg:text-4xl font-bold mb-3 leading-tight drop-shadow-lg">
            {currentSlide.title}
          </h2>
          <p className="text-emerald-200 text-base md:text-lg font-medium mb-5 leading-relaxed">
            {currentSlide.description}
          </p>
          {currentSlide.linkUrl && (
            <Link
              href={currentSlide.linkUrl}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-6 py-3 rounded-xl text-base font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {currentSlide.buttonText || 'Đọc chi tiết'}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          )}
        </div>
      </div>

      {/* Navigation Arrows - More prominent */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-emerald-600 hover:text-emerald-700 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-110 z-20"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-emerald-600 hover:text-emerald-700 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-110 z-20"
            aria-label="Next slide"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        </>
      )}

      {/* Slide Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-white w-8' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
