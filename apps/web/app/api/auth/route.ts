import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, usePasskey } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email identity is required' }, { status: 400 });
    }

    // Returns simulated successful authentication
    return NextResponse.json({
      authenticated: true,
      mfaRequired: !usePasskey,
      sessionExpiresAt: new Date(Date.now() + 86400000).toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
