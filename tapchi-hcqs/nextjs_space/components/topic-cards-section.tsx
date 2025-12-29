
import Image from 'next/image';
import Link from 'next/link';
import { Layers, ArrowRight } from 'lucide-react';

interface Topic {
  id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
}

interface TopicCardsSectionProps {
  topics: Topic[];
}

export default function TopicCardsSection({ topics }: TopicCardsSectionProps) {
  if (!topics || topics.length === 0) return null;

  // More vibrant gradient colors for topics
  const defaultGradients = [
    {
      bg: 'from-emerald-500 via-emerald-400 to-teal-500',
      border: 'border-emerald-400',
      hover: 'hover:border-emerald-500',
      text: 'text-emerald-600'
    },
    {
      bg: 'from-blue-500 via-blue-400 to-cyan-500',
      border: 'border-blue-400',
      hover: 'hover:border-blue-500',
      text: 'text-blue-600'
    },
    {
      bg: 'from-purple-500 via-purple-400 to-indigo-500',
      border: 'border-purple-400',
      hover: 'hover:border-purple-500',
      text: 'text-purple-600'
    },
    {
      bg: 'from-orange-500 via-amber-400 to-yellow-500',
      border: 'border-orange-400',
      hover: 'hover:border-orange-500',
      text: 'text-orange-600'
    },
  ];

  return (
    <section className="mt-16 mb-12 text-center">
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="h-1 w-12 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-full"></div>
        <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-blue-700 dark:from-emerald-400 dark:to-blue-400 font-['Montserrat']">
          Các chủ đề nổi bật
        </h3>
        <Layers className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
        <div className="h-1 w-12 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full"></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {topics.slice(0, 4).map((topic, index) => {
          const gradient = defaultGradients[index % defaultGradients.length];
          return (
            <Link
              key={topic.id}
              href={`/categories/${topic.slug}`}
              className={`bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border-2 ${gradient.border} ${gradient.hover} shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 group`}
            >
              <div className="relative aspect-[4/3]">
                {topic.image ? (
                  <Image
                    src={topic.image}
                    alt={topic.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${gradient.bg} flex flex-col items-center justify-center relative overflow-hidden`}>
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                    
                    <div className="text-white text-6xl font-bold opacity-90 mb-2 drop-shadow-lg">
                      {topic.name.charAt(0)}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                )}
                {/* Overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient.bg} opacity-0 group-hover:opacity-30 transition-opacity duration-300`}></div>
              </div>
              <div className="p-5 bg-gradient-to-br from-white to-slate-50 dark:from-gray-800 dark:to-gray-900">
                <h4 className={`text-base font-bold ${gradient.text} dark:text-white mb-2 group-hover:scale-105 transition-transform duration-300 leading-tight`}>
                  {topic.name}
                </h4>
                <div className="flex items-center justify-center gap-1 text-xs text-gray-600 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  <span className="font-medium">Khám phá</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
