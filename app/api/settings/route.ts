import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

export async function GET() {
    try {
        if (!fs.existsSync(SETTINGS_FILE)) {
            return NextResponse.json({ delay: 1500 }); // Default
        }
        const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
        return NextResponse.json(JSON.parse(data));
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(body, null, 2));
        return NextResponse.json(body);
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
