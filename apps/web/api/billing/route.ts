import { NextResponse } from 'next/server';
import { calculateProratedSeatAddition } from '@sectalk/billing';

export async function POST(req: Request) {
  try {
    const { tier, currentSeats, addedSeats } = await req.json();

    const start = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + 1); // 30 days out

    const calculations = calculateProratedSeatAddition(
      tier || 'free',
      currentSeats || 0,
      addedSeats || 0,
      start,
      end,
      start
    );

    return NextResponse.json({ success: true, calculations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
