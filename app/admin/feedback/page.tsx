// app/admin/feedback/page.tsx
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { FeedbackAdminPanel } from '@/components/admin/FeedbackAdminPanel';

export default async function AdminFeedbackPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/');
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });

  if (user?.role !== 'admin') {
    redirect('/');
  }

  // Get initial feedbacks
  const feedbacks = await prisma.feedback.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true }
      }
    }
  });

  // Get counts
  const [total, open, inProgress, resolved] = await Promise.all([
    prisma.feedback.count(),
    prisma.feedback.count({ where: { status: 'OPEN' } }),
    prisma.feedback.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.feedback.count({ where: { status: 'RESOLVED' } }),
  ]);

  return (
    <FeedbackAdminPanel
      initialFeedbacks={JSON.parse(JSON.stringify(feedbacks))}
      counts={{ total, open, inProgress, resolved }}
      embedded={true}
    />
  );
}