
import { redirect } from 'next/navigation';

/**
 * Publishing Process page - now managed through CMS
 * This page redirects to the dynamic CMS page
 */
export default function PublishingProcessPage() {
  redirect('/pages/publishing-process');
}
