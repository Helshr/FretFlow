import {NextRequest, NextResponse} from 'next/server';

export async function GET(request: NextRequest) {
  const secret = process.env.TONE3000_SECRET_KEY;
  const toneId = request.nextUrl.searchParams.get('tone_id');
  if (!secret) return NextResponse.json({error: 'TONE3000_SECRET_KEY is not configured'}, {status: 500});
  if (!toneId) return NextResponse.json({error: 'tone_id is required'}, {status: 400});
  const params = new URLSearchParams({tone_id: toneId, page: '1', page_size: '300', architecture: '2'});
  const response = await fetch(`https://www.tone3000.com/api/v1/models?${params}`, {headers: {Authorization: `Bearer ${secret}`}, cache: 'no-store'});
  return new NextResponse(await response.text(), {status: response.status, headers: {'Content-Type': 'application/json'}});
}
