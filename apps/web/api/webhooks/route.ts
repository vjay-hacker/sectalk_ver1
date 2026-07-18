import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('x-sectalk-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing security token' }, { status: 401 });
    }

    const payload = await req.json();
    console.log(`[Webhook Event Received]: ${payload.type}`);

    // Return successful receipt response
    return NextResponse.json({ received: true, eventId: payload.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
