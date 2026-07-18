import { NextResponse } from 'next/server';
import { analyzeMessageContent } from '@sectalk/ai-threat';

export async function POST(req: Request) {
  try {
    const { content } = await req.json();
    if (!content) {
      return NextResponse.json({ error: 'Text content is required' }, { status: 400 });
    }

    const evaluation = analyzeMessageContent(content);
    return NextResponse.json({ success: true, evaluation });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
