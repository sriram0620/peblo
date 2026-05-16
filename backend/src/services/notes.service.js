import prisma from '../config/database.js';

/**
 * Get all notes for a user with search, filter, and sort
 */
export async function getNotes(userId, { search, tags, sort, archived }) {
  const where = {
    userId,
    isArchived: archived === 'true' ? true : false,
  };

  // Keyword search on title and content
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { content: { contains: search } },
    ];
  }

  // Filter by tags
  if (tags && tags.length > 0) {
    const tagArray = Array.isArray(tags) ? tags : tags.split(',');
    where.tags = {
      some: {
        tag: {
          name: { in: tagArray },
        },
      },
    };
  }

  // Determine sort order
  let orderBy = { updatedAt: 'desc' };
  if (sort === 'created') {
    orderBy = { createdAt: 'desc' };
  } else if (sort === 'title') {
    orderBy = { title: 'asc' };
  }

  const notes = await prisma.note.findMany({
    where,
    orderBy,
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  // Flatten tags for cleaner response
  return notes.map(note => ({
    ...note,
    tags: note.tags.map(nt => nt.tag),
  }));
}

/**
 * Get a single note by ID (with ownership check)
 */
export async function getNoteById(noteId, userId) {
  const note = await prisma.note.findFirst({
    where: { id: noteId, userId },
    include: {
      tags: {
        include: { tag: true },
      },
    },
  });

  if (!note) {
    throw { status: 404, message: 'Note not found' };
  }

  return {
    ...note,
    tags: note.tags.map(nt => nt.tag),
  };
}

/**
 * Create a new note
 */
export async function createNote(userId, { title, content, tags }) {
  const data = {
    title: title || 'Untitled',
    content: content || '',
    userId,
  };

  // Handle tags
  if (tags && tags.length > 0) {
    data.tags = {
      create: await Promise.all(
        tags.map(async (tagName) => {
          const tag = await prisma.tag.upsert({
            where: { name: tagName.toLowerCase().trim() },
            create: { name: tagName.toLowerCase().trim() },
            update: {},
          });
          return { tagId: tag.id };
        })
      ),
    };
  }

  const note = await prisma.note.create({
    data,
    include: {
      tags: {
        include: { tag: true },
      },
    },
  });

  return {
    ...note,
    tags: note.tags.map(nt => nt.tag),
  };
}

/**
 * Update a note (auto-save compatible)
 */
export async function updateNote(noteId, userId, updates) {
  // Verify ownership
  const existing = await prisma.note.findFirst({
    where: { id: noteId, userId },
  });

  if (!existing) {
    throw { status: 404, message: 'Note not found' };
  }

  const data = {};
  if (updates.title !== undefined) data.title = updates.title;
  if (updates.content !== undefined) data.content = updates.content;
  if (updates.isArchived !== undefined) data.isArchived = updates.isArchived;

  // Handle tags update
  if (updates.tags !== undefined) {
    // Remove existing tags
    await prisma.noteTag.deleteMany({ where: { noteId } });

    // Add new tags
    if (updates.tags.length > 0) {
      for (const tagName of updates.tags) {
        const tag = await prisma.tag.upsert({
          where: { name: tagName.toLowerCase().trim() },
          create: { name: tagName.toLowerCase().trim() },
          update: {},
        });
        await prisma.noteTag.create({
          data: { noteId, tagId: tag.id },
        });
      }
    }
  }

  const note = await prisma.note.update({
    where: { id: noteId },
    data,
    include: {
      tags: {
        include: { tag: true },
      },
    },
  });

  return {
    ...note,
    tags: note.tags.map(nt => nt.tag),
  };
}

/**
 * Delete a note
 */
export async function deleteNote(noteId, userId) {
  const existing = await prisma.note.findFirst({
    where: { id: noteId, userId },
  });

  if (!existing) {
    throw { status: 404, message: 'Note not found' };
  }

  await prisma.note.delete({ where: { id: noteId } });
  return { message: 'Note deleted successfully' };
}

/**
 * Toggle archive status
 */
export async function toggleArchive(noteId, userId) {
  const existing = await prisma.note.findFirst({
    where: { id: noteId, userId },
  });

  if (!existing) {
    throw { status: 404, message: 'Note not found' };
  }

  const note = await prisma.note.update({
    where: { id: noteId },
    data: { isArchived: !existing.isArchived },
    include: {
      tags: {
        include: { tag: true },
      },
    },
  });

  return {
    ...note,
    tags: note.tags.map(nt => nt.tag),
  };
}

/**
 * Get all unique tags for a user
 */
export async function getUserTags(userId) {
  const tags = await prisma.tag.findMany({
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
    orderBy: {
      name: 'asc',
    },
  });

  return tags.map(tag => ({
    id: tag.id,
    name: tag.name,
    count: tag._count.notes,
  }));
}
