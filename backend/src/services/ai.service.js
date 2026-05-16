import { GoogleGenAI } from '@google/genai';
import prisma from '../config/database.js';
import env from '../config/env.js';

let ai = null;

function getAI() {
  if (!env.GEMINI_API_KEY) {
    throw { status: 503, message: 'AI service is not configured. Please set GEMINI_API_KEY.' };
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return ai;
}

/**
 * Generate AI summary, action items, and suggested title for a note
 */
export async function generateNoteSummary(noteId, userId) {
  // Fetch the note
  const note = await prisma.note.findFirst({
    where: { id: noteId, userId },
  });

  if (!note) {
    throw { status: 404, message: 'Note not found' };
  }

  if (!note.content || note.content.trim().length < 10) {
    throw { status: 400, message: 'Note content is too short to generate a summary. Please add more content.' };
  }

  const genAI = getAI();

  const prompt = `You are a helpful assistant that analyzes notes. Analyze the following note content and return a JSON response with exactly these three fields:

1. "summary": A concise 2-3 sentence summary of the key points
2. "action_items": An array of actionable to-do items extracted from the content (if any exist, otherwise empty array)
3. "suggested_title": A clear, descriptive title for this note (5-8 words max)

Note content:
"""
${note.content}
"""

Respond ONLY with valid JSON, no markdown formatting, no code blocks, no additional text. Example format:
{"summary": "...", "action_items": ["..."], "suggested_title": "..."}`;

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const responseText = response.text.trim();

    // Clean response — remove markdown code blocks if present
    let cleanJson = responseText;
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(cleanJson);

    // Update the note with AI-generated data
    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: {
        summary: parsed.summary || null,
        actionItems: JSON.stringify(parsed.action_items || []),
      },
    });

    // Log AI usage
    await prisma.aILog.create({
      data: {
        type: 'summary',
        noteId,
        userId,
      },
    });

    return {
      summary: parsed.summary,
      action_items: parsed.action_items || [],
      suggested_title: parsed.suggested_title || note.title,
    };
  } catch (error) {
    if (error.status) throw error;
    console.error('AI generation error:', error);
    throw { status: 500, message: 'Failed to generate AI summary. Please try again.' };
  }
}
