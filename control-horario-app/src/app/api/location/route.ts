import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const response = await fetch('https://ipapi.co/json/', {
            // Añadimos un cache simple o headers si fuera necesario
            next: { revalidate: 3600 } // Cache por 1 hora
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Error from ipapi: ${response.statusText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Proxy API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
