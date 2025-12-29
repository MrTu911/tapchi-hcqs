
import { BannerForm } from '@/components/dashboard/banner-form';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function EditBannerPage({ params }: { params: { id: string } }) {
  const banner = await prisma.banner.findUnique({
    where: { id: params.id },
  });

  if (!banner) {
    notFound();
  }

  return <BannerForm bannerId={params.id} initialData={banner} />;
}
