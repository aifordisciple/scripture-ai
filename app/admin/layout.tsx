// app/admin/layout.tsx
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });

  if (user?.role !== 'admin') {
    redirect('/');
  }

  return <AdminLayout>{children}</AdminLayout>;
}