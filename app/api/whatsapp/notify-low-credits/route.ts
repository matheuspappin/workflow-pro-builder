import { NextRequest, NextResponse } from 'next/server';
import { notifyLowCredits } from '@/lib/whatsapp';
import { checkStudioAccess } from '@/lib/auth';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { studentId, studioId, remainingCredits } = await request.json();

    if (!studentId || !studioId) {
      return NextResponse.json({ success: false, error: 'studentId e studioId são obrigatórios' }, { status: 400 });
    }

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    await notifyLowCredits(studentId, studioId, remainingCredits);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Erro na API notify-low-credits:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
