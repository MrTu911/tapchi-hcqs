'use client';

import { useState, useEffect } from 'react';
import { Play, Maximize2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

interface VideoItem {
  id: string;
  title: string;
  description?: string;
  embedUrl: string;
  thumbnailUrl?: string;
  videoType?: string;
  videoUrl?: string;
  videoId?: string;
}

interface VideoSectionProps {
  videos?: VideoItem[];
  title?: string;
  subtitle?: string;
}

// Helper function to generate YouTube embed URL
const getYouTubeEmbedUrl = (videoUrl: string, videoId?: string): string => {
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  // Extract video ID from URL
  const match = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  
  return videoUrl;
};

// Helper function to generate YouTube thumbnail URL
const getYouTubeThumbnail = (videoUrl: string, videoId?: string): string => {
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  }
  
  const match = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
  if (match && match[1]) {
    return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
  }
  
  return '/images/placeholder.png';
};

export default function VideoSection({ 
  videos: propVideos, 
  title = "Video – Media khoa học",
  subtitle = "Khám phá các video nghiên cứu và ứng dụng khoa học quân sự"
}: VideoSectionProps) {
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>(propVideos || []);
  const [loading, setLoading] = useState(!propVideos || propVideos.length === 0);

  // Fetch videos from API if not provided via props
  useEffect(() => {
    if (!propVideos || propVideos.length === 0) {
      fetchVideos();
    }
  }, [propVideos]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/videos?isActive=true&limit=10');
      const data = await response.json();
      
      if (data.success && data.data.videos && data.data.videos.length > 0) {
        // Transform API data to VideoItem format
        const transformedVideos: VideoItem[] = data.data.videos.map((v: any) => ({
          id: v.id,
          title: v.title,
          description: v.description,
          embedUrl: v.videoType === 'youtube' 
            ? getYouTubeEmbedUrl(v.videoUrl, v.videoId)
            : v.videoUrl,
          thumbnailUrl: v.videoType === 'youtube'
            ? getYouTubeThumbnail(v.videoUrl, v.videoId)
            : v.thumbnailUrl || '/images/placeholder.png',
          videoType: v.videoType,
          videoUrl: v.videoUrl,
          videoId: v.videoId
        }));
        
        setVideos(transformedVideos);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayVideos = videos.length > 0 ? videos : [];
  const mainVideo = selectedVideo || displayVideos[0];

  // Show loading state
  if (loading) {
    return (
      <Card className="overflow-hidden shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white">
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  // Show empty state if no videos
  if (!mainVideo || displayVideos.length === 0) {
    return (
      <Card className="overflow-hidden shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white">
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center text-muted-foreground">
          <p>Chưa có video nào được thêm vào.</p>
          <p className="text-sm mt-2">Vui lòng thêm video qua trang quản lý CMS.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white">
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          {title}
        </CardTitle>
        {subtitle && (
          <CardDescription className="text-blue-100">
            {subtitle}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Main Video Player */}
        {mainVideo && (
          <div className="relative">
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <iframe
                src={mainVideo.embedUrl}
                title={mainVideo.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="mt-3">
              <h4 className="font-semibold text-lg mb-1">{mainVideo.title}</h4>
              {mainVideo.description && (
                <p className="text-sm text-muted-foreground">{mainVideo.description}</p>
              )}
            </div>
          </div>
        )}

        {/* Video Thumbnails */}
        {displayVideos.length > 1 && (
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-muted-foreground">Video khác</h5>
            <div className="grid grid-cols-2 gap-3">
              {displayVideos.slice(1, 5).map((video) => (
                <button
                  key={video.id}
                  onClick={() => setSelectedVideo(video)}
                  className={
                    `relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:border-blue-600 hover:shadow-md ${
                      selectedVideo?.id === video.id ? 'border-blue-600 shadow-md' : 'border-gray-200'
                    }`
                  }
                >
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                    <Play className="h-8 w-8 text-gray-400" />
                  </div>
                  {video.thumbnailUrl && (
                    <img 
                      src={video.thumbnailUrl} 
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Play className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-white text-xs font-medium line-clamp-2">{video.title}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* View All Button */}
        <div className="flex justify-center pt-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Maximize2 className="h-4 w-4" />
            Xem tất cả video
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
