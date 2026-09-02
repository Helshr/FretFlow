import {NextResponse} from 'next/server';

export async function GET(_request: Request, {params}: {params: Promise<{id: string}>}) {
  const secret = process.env.TONE3000_SECRET_KEY;
  if (!secret) return NextResponse.json({error: 'TONE3000_SECRET_KEY is not configured'}, {status: 500});
  const {id} = await params;
  const metadataResponse = await fetch(`https://www.tone3000.com/api/v1/models/${encodeURIComponent(id)}`, {headers: {Authorization: `Bearer ${secret}`}, cache: 'no-store', signal: AbortSignal.timeout(15000)});
  if (!metadataResponse.ok) return new NextResponse(await metadataResponse.text(), {status: metadataResponse.status});
  const metadata = await metadataResponse.json();
  if (!metadata.model_url) return NextResponse.json({error: 'Model has no download URL'}, {status: 404});
  const fileResponse = await fetch(metadata.model_url, {headers: {Authorization: `Bearer ${secret}`}, signal: AbortSignal.timeout(20000)});
  if (!fileResponse.ok || !fileResponse.body) return new NextResponse('Model download failed', {status: fileResponse.status || 502});
  const file = await fileResponse.arrayBuffer();
  const filename = `${metadata.name || `tone-${id}`}.nam`.replace(/[\\/:*?"<>|]/g, '_');
  return new NextResponse(file, {status: 200, headers: {'Content-Type': 'application/octet-stream', 'Content-Length': String(file.byteLength), 'Content-Disposition': `attachment; filename="${filename}"`}});
}
