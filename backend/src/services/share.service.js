import { nanoid } from 'nanoid';
import prisma from '../config/database.js';

/**
 * Toggle public sharing for a note and generate/remove share link
 */
export async function toggleShare(noteId, userId) {
  const note = await prisma.note.findFirst({
    where: { id: noteId, userId },
  });

  if (!note) {
    throw { status: 404, message: 'Note not found' };
  }

  const isCurrentlyPublic = note.isPublic;

  const updatedNote = await prisma.note.update({
    where: { id: noteId },
    data: {
      isPublic: !isCurrentlyPublic,
      shareId: isCurrentlyPublic ? null : nanoid(12),
    },
    include: {
      tags: {
        include: { tag: true },
      },
    },
  });

  return {
    ...updatedNote,
    tags: updatedNote.tags.map(nt => nt.tag),
    shareUrl: updatedNote.isPublic ? `/shared/${updatedNote.shareId}` : null,
  };
}

/**
 * Get a publicly shared note by shareId (no auth required)
 */
export async function getSharedNote(shareId) {
  const note = await prisma.note.findUnique({
    where: { shareId },
    include: {
      user: {
        select: {
          name: true,
        },
      },
      tags: {
        include: { tag: true },
      },
    },
  });

  if (!note || !note.isPublic) {
    throw { status: 404, message: 'Shared note not found or is no longer public' };
  }

  return {
    id: note.id,
    title: note.title,
    content: note.content,
    summary: note.summary,
    actionItems: note.actionItems ? JSON.parse(note.actionItems) : [],
    author: note.user.name,
    tags: note.tags.map(nt => nt.tag),
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}
