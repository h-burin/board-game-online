/**
 * API Route: Update Room Settings
 * PATCH /api/rooms/[roomId]/update-settings
 *
 * Allows host to update room settings (maxPlayers, timeLimit, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateRoomSettings } from '@/lib/firebase/firestore';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await context.params;
    const body = await request.json();
    const { hostId, maxPlayers, timeLimit } = body;

    // Validation
    if (!hostId) {
      return NextResponse.json(
        { success: false, error: 'Host ID is required' },
        { status: 400 }
      );
    }

    if (maxPlayers !== undefined) {
      if (typeof maxPlayers !== 'number' || maxPlayers < 2 || maxPlayers > 10) {
        return NextResponse.json(
          { success: false, error: 'Max players must be between 2 and 10' },
          { status: 400 }
        );
      }
    }

    // Update room settings
    await updateRoomSettings(roomId, hostId, {
      maxPlayers,
      timeLimit,
    });

    return NextResponse.json({
      success: true,
      message: 'Room settings updated successfully',
    });
  } catch (error) {
    console.error('Update settings error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update room settings',
      },
      { status: 500 }
    );
  }
}
