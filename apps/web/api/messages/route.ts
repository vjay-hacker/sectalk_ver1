import { NextResponse } from 'next/server';
import { Message } from '@sectalk/shared-types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { roomId, senderId, content, encrypted } = body;

    if (!roomId || !senderId || !content) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      roomId,
      senderId,
      senderName: senderId === 'usr_alice' ? 'Alice Vance' : 'Bob Smith',
      content,
      encrypted: !!encrypted,
      threadId: null,
      status: 'sent',
      reactions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({ success: true, message: newMessage });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
