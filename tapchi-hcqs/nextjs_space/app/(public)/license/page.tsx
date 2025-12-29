import { redirect } from 'next/navigation';

/**
 * License page - now managed through CMS
 * This page redirects to the dynamic CMS page
 */
export default function LicensePage() {
  redirect('/pages/license');
}
