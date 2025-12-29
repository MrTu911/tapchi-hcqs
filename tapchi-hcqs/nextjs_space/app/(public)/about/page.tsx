
import { redirect } from 'next/navigation';

/**
 * About page - now managed through CMS
 * This page redirects to the dynamic CMS page
 */
export default function AboutPage() {
  redirect('/pages/about');
}
