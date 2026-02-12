import { NextRequest, NextResponse } from 'next/server';
import { notifyLowCredits } from '@/lib/whatsapp';

export async function POST(request: NextRequest) {
  try {
    const { studentId, studioId, remainingCredits } = await request.json();

    if (!studentId || !studioId) {
      return NextResponse.json({ success: false, error: 'studentId e studioId são obrigatórios' }, { status: 400 });
    }

    await notifyLowCredits(studentId, studioId, remainingCredits);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro na API notify-low-credits:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
