import prisma from '../config/database.js';

/**
 * Get productivity insights for a user
 */
export async function getInsights(userId) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Total notes (active vs archived)
  const [totalActive, totalArchived] = await Promise.all([
    prisma.note.count({ where: { userId, isArchived: false } }),
    prisma.note.count({ where: { userId, isArchived: true } }),
  ]);

  // Recently edited notes (last 7 days)
  const recentlyEdited = await prisma.note.findMany({
    where: {
      userId,
      updatedAt: { gte: sevenDaysAgo },
    },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    select: {
      id: true,
      title: true,
      updatedAt: true,
    },
  });

  // Most-used tags (top 5)
  const allTags = await prisma.tag.findMany({
    where: {
      notes: {
        some: {
          note: { userId },
        },
      },
    },
    include: {
      _count: {
        select: { notes: true },
      },
    },
  });

  const topTags = allTags
    .map(tag => ({ name: tag.name, count: tag._count.notes }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // AI usage stats
  const aiLogs = await prisma.aILog.findMany({
    where: { userId },
  });

  const aiStats = {
    total: aiLogs.length,
    summary: aiLogs.filter(l => l.type === 'summary').length,
    action_items: aiLogs.filter(l => l.type === 'action_items').length,
    title_suggestion: aiLogs.filter(l => l.type === 'title_suggestion').length,
  };

  // Weekly activity (notes created/updated per day, last 7 days)
  const weeklyActivity = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now);
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const [created, updated] = await Promise.all([
      prisma.note.count({
        where: {
          userId,
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      }),
      prisma.note.count({
        where: {
          userId,
          updatedAt: { gte: dayStart, lte: dayEnd },
          createdAt: { lt: dayStart }, // only count updates, not new ones
        },
      }),
    ]);

    weeklyActivity.push({
      date: dayStart.toISOString().split('T')[0],
      day: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
      created,
      updated,
    });
  }

  return {
    notes: {
      total: totalActive + totalArchived,
      active: totalActive,
      archived: totalArchived,
    },
    recentlyEdited,
    topTags,
    aiStats,
    weeklyActivity,
  };
}
