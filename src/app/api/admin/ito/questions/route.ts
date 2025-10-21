/**
 * API Routes for ITO Questions Management
 * GET    /api/admin/ito/questions       - Get all questions
 * POST   /api/admin/ito/questions       - Create new question
 */

import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

/**
 * GET /api/admin/ito/questions
 * Get all ITO questions
 */
export async function GET() {
  try {
    const questionsRef = collection(db, 'ito_questions');
    const snapshot = await getDocs(questionsRef);

    const questions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      count: questions.length,
      data: questions,
    });
  } catch (error) {
    console.error('❌ Error fetching questions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch questions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/ito/questions
 * Create new ITO question
 *
 * Request Body:
 * {
 *   "questionsTH": "คำถามภาษาไทย"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    if (!body.questionsTH || typeof body.questionsTH !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'questionsTH is required and must be a string',
        },
        { status: 400 }
      );
    }

    if (body.questionsTH.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'questionsTH cannot be empty',
        },
        { status: 400 }
      );
    }

    // Create question
    const questionsRef = collection(db, 'ito_questions');
    const docRef = await addDoc(questionsRef, {
      questionsTH: body.questionsTH.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Question created successfully',
        data: {
          id: docRef.id,
          questionsTH: body.questionsTH.trim(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating question:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create question',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
