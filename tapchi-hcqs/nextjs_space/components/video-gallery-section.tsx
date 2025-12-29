'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Play, Video, Clock, Eye } from 'lucide-react'

interface VideoItem {
  id: string
  title: string
  thumbnail?: string
  url: string
  duration?: string
  views?: number
  category?: string
}

interface VideoGallerySectionProps {
  videos?: VideoItem[]
}

export default function VideoGallerySection({ videos = [] }: VideoGallerySectionProps) {
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null)

  // Default videos if none provided
  const defaultVideos: VideoItem[] = [
    {
      id: '1',
      title: 'Chiến lược Hậu cần trong thời đại số',
      thumbnail: '/images/videos/thumb1.jpg',
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duration: '15:30',
      views: 1250,
      category: 'Chiến lược'
    },
    {
      id: '2',
      title: 'Ứng dụng AI trong quản lý vật tư quân sự',
      thumbnail: '/images/videos/thumb2.jpg',
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duration: '22:15',
      views: 980,
      category: 'Công nghệ'
    },
    {
      id: '3',
      title: 'Hệ thống tước logistic hiện đại',
      thumbnail: '/images/videos/thumb3.jpg',
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duration: '18:45',
      views: 1500,
      category: 'Hậu cần'
    }
  ]

  const displayVideos = videos.length > 0 ? videos : defaultVideos

  return (
    <>
      <section className="py-10 bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-950 rounded-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mb-4">
              <Video className="h-5 w-5 text-white" />
              <h2 className="text-2xl font-bold text-white">
                Video Nổi bật
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Tài liệu hình ảnh và video về nghiên cứu khoa học hậu cần quân sự
            </p>
          </div>

          {/* Video Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayVideos.map((video) => (
              <Card
                key={video.id}
                className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer border-0"
                onClick={() => setSelectedVideo(video)}
              >
                {/* Thumbnail */}
                <div className="relative h-56 overflow-hidden bg-gradient-to-br from-emerald-900 to-teal-800">
                  <Image
                    src={video.thumbnail || '/images/default-video.jpg'}
                    alt={video.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  
                  {/* Dark Overlay */}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-all duration-300" />

                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
                      <Play className="h-8 w-8 text-gray-900 ml-1" fill="currentColor" />
                    </div>
                  </div>

                  {/* Duration Badge */}
                  {video.duration && (
                    <div className="absolute bottom-3 right-3">
                      <Badge className="bg-black/70 text-white border-0 backdrop-blur-sm">
                        <Clock className="h-3 w-3 mr-1" />
                        {video.duration}
                      </Badge>
                    </div>
                  )}

                  {/* Category Badge */}
                  {video.category && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
                        {video.category}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 bg-white dark:bg-gray-800">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-2">
                    {video.title}
                  </h3>
                  {video.views && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <Eye className="h-4 w-4" />
                      <span>{video.views.toLocaleString('vi-VN')} lượt xem</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center mt-8">
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all duration-300"
            >
              <Video className="mr-2 h-5 w-5" />
              Xem tất cả video
            </Button>
          </div>
        </div>
      </section>

      {/* Video Player Dialog */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold">
              {selectedVideo?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video bg-black">
            {selectedVideo && (
              <>
                {/* YouTube/Vimeo embedded video */}
                {(selectedVideo.url.includes('youtube.com') || selectedVideo.url.includes('youtu.be') || selectedVideo.url.includes('vimeo.com')) && (
                  <iframe
                    src={selectedVideo.url.includes('/embed/') ? selectedVideo.url : selectedVideo.url.replace('watch?v=', 'embed/')}
                    title={selectedVideo.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
                
                {/* Uploaded video file */}
                {!selectedVideo.url.includes('youtube.com') && !selectedVideo.url.includes('youtu.be') && !selectedVideo.url.includes('vimeo.com') && (
                  <video
                    src={selectedVideo.url}
                    controls
                    className="w-full h-full"
                    preload="metadata"
                  >
                    Trình duyệt của bạn không hỗ trợ video tag.
                  </video>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
