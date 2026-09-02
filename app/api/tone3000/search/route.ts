import {NextRequest, NextResponse} from 'next/server';

export async function GET(request: NextRequest) {
  const secret = process.env.TONE3000_SECRET_KEY;
  if (!secret) return NextResponse.json({error: 'TONE3000_SECRET_KEY is not configured'}, {status: 500});
  const input = request.nextUrl.searchParams;
  const params = new URLSearchParams({
    query: input.get('query') || '', page: input.get('page') || '1', page_size: input.get('page_size') || '25',
    format: 'nam', architecture: '2',
  });
  const response = await fetch(`https://www.tone3000.com/api/v1/tones/search?${params}`, {headers: {Authorization: `Bearer ${secret}`}, cache: 'no-store'});
  return new NextResponse(await response.text(), {status: response.status, headers: {'Content-Type': 'application/json'}});
}
