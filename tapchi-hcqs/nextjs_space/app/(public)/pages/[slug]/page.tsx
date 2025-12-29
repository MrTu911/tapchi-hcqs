import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";

export const revalidate = 3600;

interface PageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  const pages = await prisma.publicPage.findMany({
    where: { isPublished: true },
    select: { slug: true }
  });

  return pages.map((page) => ({
    slug: page.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = await prisma.publicPage.findUnique({
    where: { slug: params.slug, isPublished: true }
  });

  if (!page) {
    return {
      title: "Không tìm thấy trang",
      description: "Trang bạn đang tìm kiếm không tồn tại."
    };
  }

  return {
    title: page.metaTitle || page.title,
    description: page.metaDesc || page.content.substring(0, 160),
    openGraph: {
      title: page.metaTitle || page.title,
      description: page.metaDesc || page.content.substring(0, 160),
      images: page.ogImage ? [page.ogImage] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: page.metaTitle || page.title,
      description: page.metaDesc || page.content.substring(0, 160),
      images: page.ogImage ? [page.ogImage] : [],
    }
  };
}

export default async function PublicPage({ params }: PageProps) {
  const page = await prisma.publicPage.findUnique({
    where: { 
      slug: params.slug,
      isPublished: true 
    }
  });

  if (!page) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-5xl">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm flex items-center gap-2">
          <a href="/" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors font-medium">
            <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Trang chủ
          </a>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-700 dark:text-gray-300 font-semibold">{page.title}</span>
        </nav>

        <Card className="shadow-2xl border-0 overflow-hidden">
          {/* Header with vibrant gradient and decorative elements */}
          <div className="relative bg-gradient-to-br from-emerald-600 via-blue-600 to-purple-600 p-8 sm:p-12 lg:p-16 text-white overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/3"></div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Thông tin chính thức
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight drop-shadow-lg">
                {page.title}
              </h1>
              {page.titleEn && (
                <p className="text-lg sm:text-xl text-emerald-100 italic font-light drop-shadow-md">
                  {page.titleEn}
                </p>
              )}
            </div>

            {/* Decorative bottom wave */}
            <div className="absolute bottom-0 left-0 right-0">
              <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-12">
                <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z" fill="white" className="dark:fill-gray-800"/>
              </svg>
            </div>
          </div>

          <CardContent className="p-6 sm:p-8 lg:p-12 bg-white dark:bg-gray-800">
            <div 
              className="prose prose-lg dark:prose-invert max-w-none 
                         prose-headings:text-emerald-700 dark:prose-headings:text-emerald-400 
                         prose-headings:font-bold
                         prose-a:text-blue-600 dark:prose-a:text-blue-400 
                         hover:prose-a:text-emerald-600 dark:hover:prose-a:text-emerald-400
                         prose-a:no-underline prose-a:font-semibold
                         prose-img:rounded-2xl prose-img:shadow-xl
                         prose-p:leading-relaxed prose-p:text-gray-700 dark:prose-p:text-gray-300
                         prose-strong:text-emerald-700 dark:prose-strong:text-emerald-400"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />

            {page.contentEn && (
              <div className="mt-16 pt-10 border-t-2 border-dashed border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-1 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
                  <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-purple-700 dark:from-blue-400 dark:to-purple-400 uppercase tracking-wide">
                    English Version
                  </h2>
                </div>
                <div 
                  className="prose prose-lg dark:prose-invert max-w-none 
                             prose-headings:text-blue-700 dark:prose-headings:text-blue-400 
                             prose-headings:font-bold
                             prose-a:text-blue-600 dark:prose-a:text-blue-400 
                             hover:prose-a:text-purple-600 dark:hover:prose-a:text-purple-400
                             prose-a:no-underline prose-a:font-semibold
                             prose-img:rounded-2xl prose-img:shadow-xl
                             prose-p:leading-relaxed prose-p:text-gray-700 dark:prose-p:text-gray-300"
                  dangerouslySetInnerHTML={{ __html: page.contentEn }}
                />
              </div>
            )}

            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-0.5">Cập nhật lần cuối</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    {new Date(page.updatedAt).toLocaleDateString('vi-VN', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-blue-100 dark:from-emerald-900/20 dark:to-blue-900/20 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-full text-sm font-bold border-2 border-emerald-200 dark:border-emerald-800">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Được xác thực
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to home button */}
        <div className="mt-10 text-center">
          <a 
            href="/"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 hover:from-emerald-500 hover:via-blue-500 hover:to-purple-500 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 font-bold text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Quay về trang chủ</span>
          </a>
        </div>
      </div>
    </div>
  );
}
