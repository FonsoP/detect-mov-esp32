import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'subscribers.json');

export async function GET() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return NextResponse.json([]);
        }
        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        const subscribers = JSON.parse(data);
        return NextResponse.json(subscribers);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to load subscribers' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { id, name, action } = await request.json();

        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(DATA_FILE, '[]');
        }

        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        let subscribers = JSON.parse(data);

        if (action === 'add') {
            if (!subscribers.find((s: any) => s.id === id)) {
                subscribers.push({ id, name: name || 'User' });
            }
        } else if (action === 'remove') {
            subscribers = subscribers.filter((s: any) => s.id !== id);
        }

        fs.writeFileSync(DATA_FILE, JSON.stringify(subscribers, null, 2));
        return NextResponse.json(subscribers);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update subscribers' }, { status: 500 });
    }
}
