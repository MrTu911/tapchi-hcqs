
import { prisma } from '@/lib/prisma';
import { cache } from 'react';

export interface HomepageSection {
  id: string;
  key: string;
  type: string;
  title?: string | null;
  titleEn?: string | null;
  subtitle?: string | null;
  subtitleEn?: string | null;
  content?: string | null;
  contentEn?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  linkText?: string | null;
  linkTextEn?: string | null;
  settings?: any;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all active homepage sections ordered by position
 * Cached for performance
 */
export const getActiveHomepageSections = cache(async (): Promise<HomepageSection[]> => {
  try {
    const sections = await prisma.homepageSection.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
    return sections;
  } catch (error) {
    console.error('Error fetching homepage sections:', error);
    return [];
  }
});

/**
 * Get a specific homepage section by key
 * Cached for performance
 */
export const getHomepageSectionByKey = cache(async (key: string): Promise<HomepageSection | null> => {
  try {
    const section = await prisma.homepageSection.findUnique({
      where: { key },
    });
    return section;
  } catch (error) {
    console.error(`Error fetching homepage section with key "${key}":`, error);
    return null;
  }
});

/**
 * Check if a section is active
 */
export async function isSectionActive(key: string): Promise<boolean> {
  const section = await getHomepageSectionByKey(key);
  return section?.isActive ?? false;
}

/**
 * Get section settings by key
 */
export async function getSectionSettings(key: string): Promise<any> {
  const section = await getHomepageSectionByKey(key);
  return section?.settings ?? {};
}

/**
 * Get sections by type
 */
export const getSectionsByType = cache(async (type: string): Promise<HomepageSection[]> => {
  try {
    const sections = await prisma.homepageSection.findMany({
      where: { 
        type,
        isActive: true 
      },
      orderBy: { order: 'asc' },
    });
    return sections;
  } catch (error) {
    console.error(`Error fetching sections by type "${type}":`, error);
    return [];
  }
});

/**
 * Get section order mapping
 * Returns a map of section keys to their order values
 */
export async function getSectionOrderMap(): Promise<Map<string, number>> {
  const sections = await getActiveHomepageSections();
  const orderMap = new Map<string, number>();
  sections.forEach(section => {
    orderMap.set(section.key, section.order);
  });
  return orderMap;
}
