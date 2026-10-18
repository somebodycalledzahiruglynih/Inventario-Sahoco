import { NextResponse } from 'next/server';
import { resolveAppsScriptUrl } from '../../../lib/appsScriptUrl';

const APPS_SCRIPT_URL = resolveAppsScriptUrl(process.env.NEXT_PUBLIC_APPS_SCRIPT_URL);

// GET /api/inventory  (opcional: ?action=get_recipes)
export async function GET(req: Request) {
  try {
    const action = new URL(req.url).searchParams.get('action') || 'get';
    const safeAction = /^[a-z_]{1,30}$/i.test(action) ? action : 'get';

    const res = await fetch(`${APPS_SCRIPT_URL}?action=${encodeURIComponent(safeAction)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { status: 'error', message: `Apps Script status ${res.status}` },
        { status: 502 }
      );
    }

    const text = await res.text();
    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      return NextResponse.json(
        { status: 'error', message: 'Apps Script retorno HTML en lugar de JSON' },
        { status: 502 }
      );
    }

    const json = JSON.parse(text);
    return NextResponse.json(json, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ status: 'error', message: msg }, { status: 503 });
  }
}

// POST /api/inventory
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      redirect: 'follow',
      signal: AbortSignal.timeout(30000),
    });

    const text = await res.text();
    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      return NextResponse.json({
        status: 'success',
        message: 'Guardado sin confirmacion directa de Apps Script',
      });
    }

    const json = JSON.parse(text);
    return NextResponse.json(json, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ status: 'error', message: msg }, { status: 503 });
  }
}
