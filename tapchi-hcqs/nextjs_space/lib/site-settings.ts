
import { prisma } from '@/lib/prisma';
import { cache } from 'react';

/**
 * Site Setting interface matching Prisma model
 */
export interface SiteSetting {
  id: string;
  category: string;
  key: string;
  value: string | null;
  label: string;
  labelEn: string | null;
  type: string;
  placeholder: string | null;
  helpText: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all site settings with caching
 */
export const getAllSettings = cache(async (): Promise<SiteSetting[]> => {
  try {
    const settings = await prisma.siteSetting.findMany({
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    });
    return settings;
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return [];
  }
});

/**
 * Get settings by category with caching
 */
export const getSettingsByCategory = cache(async (category: string): Promise<SiteSetting[]> => {
  try {
    const settings = await prisma.siteSetting.findMany({
      where: { category },
      orderBy: { order: 'asc' },
    });
    return settings;
  } catch (error) {
    console.error(`Error fetching settings for category ${category}:`, error);
    return [];
  }
});

/**
 * Get a single setting value by key with caching
 */
export const getSetting = cache(async (key: string): Promise<string | null> => {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key },
    });
    return setting?.value || null;
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return null;
  }
});

/**
 * Get a setting with a default fallback
 */
export const getSettingWithDefault = cache(async (key: string, defaultValue: string): Promise<string> => {
  const value = await getSetting(key);
  return value || defaultValue;
});

/**
 * Get a boolean setting
 */
export const getBooleanSetting = cache(async (key: string, defaultValue = false): Promise<boolean> => {
  const value = await getSetting(key);
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
});

/**
 * Get a JSON setting (parsed)
 */
export const getJsonSetting = cache(async <T = any>(key: string, defaultValue: T | null = null): Promise<T | null> => {
  const value = await getSetting(key);
  if (!value) return defaultValue;
  
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Error parsing JSON setting ${key}:`, error);
    return defaultValue;
  }
});

/**
 * Get settings as a key-value map for easier access
 */
export const getSettingsMap = cache(async (): Promise<Record<string, string>> => {
  const settings = await getAllSettings();
  return settings.reduce((acc, setting) => {
    if (setting.value) {
      acc[setting.key] = setting.value;
    }
    return acc;
  }, {} as Record<string, string>);
});

/**
 * Get settings by category as a key-value map
 */
export const getCategorySettingsMap = cache(async (category: string): Promise<Record<string, string>> => {
  const settings = await getSettingsByCategory(category);
  return settings.reduce((acc, setting) => {
    if (setting.value) {
      acc[setting.key] = setting.value;
    }
    return acc;
  }, {} as Record<string, string>);
});

/**
 * Get general site information
 */
export const getSiteInfo = cache(async () => {
  const [
    siteName,
    siteNameEn,
    siteDescription,
    siteDescriptionEn,
    siteLogo,
    siteFavicon,
    siteKeywords,
  ] = await Promise.all([
    getSettingWithDefault('site_name', 'Tạp chí Khoa học Hậu cần quân sự'),
    getSettingWithDefault('site_name_en', 'Journal of Military Logistics Science'),
    getSettingWithDefault('site_description', 'Tạp chí điện tử Khoa học Hậu cần quân sự'),
    getSettingWithDefault('site_description_en', 'Electronic Journal of Military Logistics Science'),
    getSetting('site_logo'),
    getSetting('site_favicon'),
    getSetting('site_keywords'),
  ]);

  return {
    siteName,
    siteNameEn,
    siteDescription,
    siteDescriptionEn,
    siteLogo,
    siteFavicon,
    siteKeywords,
  };
});

/**
 * Get contact information
 */
export const getContactInfo = cache(async () => {
  const [
    contactEmail,
    contactPhone,
    contactAddress,
    contactAddressEn,
    contactFax,
    contactHours,
  ] = await Promise.all([
    getSetting('contact_email'),
    getSetting('contact_phone'),
    getSetting('contact_address'),
    getSetting('contact_address_en'),
    getSetting('contact_fax'),
    getSetting('contact_hours'),
  ]);

  return {
    contactEmail,
    contactPhone,
    contactAddress,
    contactAddressEn,
    contactFax,
    contactHours,
  };
});

/**
 * Get social media links
 */
export const getSocialLinks = cache(async () => {
  const [
    facebook,
    twitter,
    linkedin,
    youtube,
    instagram,
    zalo,
  ] = await Promise.all([
    getSetting('social_facebook'),
    getSetting('social_twitter'),
    getSetting('social_linkedin'),
    getSetting('social_youtube'),
    getSetting('social_instagram'),
    getSetting('social_zalo'),
  ]);

  return {
    facebook,
    twitter,
    linkedin,
    youtube,
    instagram,
    zalo,
  };
});

/**
 * Get footer content
 */
export const getFooterContent = cache(async () => {
  const [
    footerText,
    footerTextEn,
    footerCopyright,
    footerCopyrightEn,
    footerLogo,
  ] = await Promise.all([
    getSetting('footer_text'),
    getSetting('footer_text_en'),
    getSettingWithDefault('footer_copyright', '© 2025 Tạp chí Khoa học Hậu cần quân sự. All rights reserved.'),
    getSetting('footer_copyright_en'),
    getSetting('footer_logo'),
  ]);

  return {
    footerText,
    footerTextEn,
    footerCopyright,
    footerCopyrightEn,
    footerLogo,
  };
});

/**
 * Get SEO metadata
 */
export const getSeoMetadata = cache(async () => {
  const [
    metaTitle,
    metaTitleEn,
    metaDescription,
    metaDescriptionEn,
    metaKeywords,
    metaAuthor,
    ogImage,
  ] = await Promise.all([
    getSetting('seo_meta_title'),
    getSetting('seo_meta_title_en'),
    getSetting('seo_meta_description'),
    getSetting('seo_meta_description_en'),
    getSetting('seo_meta_keywords'),
    getSetting('seo_meta_author'),
    getSetting('seo_og_image'),
  ]);

  return {
    metaTitle,
    metaTitleEn,
    metaDescription,
    metaDescriptionEn,
    metaKeywords,
    metaAuthor,
    ogImage,
  };
});

/**
 * Get appearance settings
 */
export const getAppearanceSettings = cache(async () => {
  const [
    primaryColor,
    secondaryColor,
    accentColor,
    fontFamily,
    headerStyle,
  ] = await Promise.all([
    getSetting('appearance_primary_color'),
    getSetting('appearance_secondary_color'),
    getSetting('appearance_accent_color'),
    getSetting('appearance_font_family'),
    getSetting('appearance_header_style'),
  ]);

  return {
    primaryColor,
    secondaryColor,
    accentColor,
    fontFamily,
    headerStyle,
  };
});
