
import { redirect } from 'next/navigation';

/**
 * Contact page - now managed through CMS
 * This page redirects to the dynamic CMS page
 */
export default function ContactPage() {
  redirect('/pages/contact');
}
