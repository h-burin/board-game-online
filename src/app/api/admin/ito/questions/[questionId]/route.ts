/**
 * API Routes for ITO Question Management (Single Question)
 * GET    /api/admin/ito/questions/[questionId]  - Get single question
 * PUT    /api/admin/ito/questions/[questionId]  - Update question
 * DELETE /api/admin/ito/questions/[questionId]  - Delete question
 */

import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface RouteParams {
  params: {
    questionId: string;
  };
}

/**
 * GET /api/admin/ito/questions/[questionId]
 * Get single question by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { questionId } = params;

    const docRef = doc(db, 'ito_questions', questionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: `Question with ID ${questionId} not found`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: docSnap.id,
        ...docSnap.data(),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching question:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch question',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/ito/questions/[questionId]
 * Update question
 *
 * Request Body:
 * {
 *   "questionsTH": "คำถามภาษาไทยที่แก้ไขแล้ว"
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { questionId } = params;
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

    // Check if question exists
    const docRef = doc(db, 'ito_questions', questionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: `Question with ID ${questionId} not found`,
        },
        { status: 404 }
      );
    }

    // Update question
    await updateDoc(docRef, {
      questionsTH: body.questionsTH.trim(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: 'Question updated successfully',
      data: {
        id: questionId,
        questionsTH: body.questionsTH.trim(),
      },
    });
  } catch (error) {
    console.error('❌ Error updating question:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update question',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/ito/questions/[questionId]
 * Delete question
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { questionId } = params;

    // Check if question exists
    const docRef = doc(db, 'ito_questions', questionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: `Question with ID ${questionId} not found`,
        },
        { status: 404 }
      );
    }

    // Delete question
    await deleteDoc(docRef);

    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully',
      data: {
        id: questionId,
      },
    });
  } catch (error) {
    console.error('❌ Error deleting question:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete question',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
