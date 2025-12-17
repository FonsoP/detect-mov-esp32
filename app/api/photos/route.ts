import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function GET() {
    try {
        if (!fs.existsSync(UPLOADS_DIR)) {
            return NextResponse.json([]);
        }

        const files = fs.readdirSync(UPLOADS_DIR)
            .filter(file => file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.jpeg'))
            .map(file => {
                const filePath = path.join(UPLOADS_DIR, file);
                const stats = fs.statSync(filePath);
                return {
                    name: file,
                    url: `/uploads/${file}`,
                    time: stats.mtime.getTime(),
                    date: stats.mtime.toLocaleString()
                };
            })
            .sort((a, b) => b.time - a.time); // Newest first

        return NextResponse.json(files);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to list photos' }, { status: 500 });
    }
}
