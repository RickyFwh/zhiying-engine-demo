import { NextResponse } from 'next/server';
import { getAllAnalytics } from '@/lib/analytics';

export async function GET() {
  try {
    const data = getAllAnalytics();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
