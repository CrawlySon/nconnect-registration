import { NextRequest, NextResponse } from 'next/server';
import { setAdminCookie, clearAdminCookie, isAdminAuthenticated } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email a heslo sú povinné' },
        { status: 400 }
      );
    }

    // Check credentials against environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error('ADMIN_EMAIL or ADMIN_PASSWORD environment variables are not set');
      return NextResponse.json(
        { error: 'Admin autentifikácia nie je nakonfigurovaná' },
        { status: 500 }
      );
    }

    if (email !== adminEmail || password !== adminPassword) {
      return NextResponse.json(
        { error: 'Nesprávny email alebo heslo' },
        { status: 401 }
      );
    }

    // Create response with JWT cookie
    const response = NextResponse.json({
      success: true,
      message: 'Prihlásenie úspešné',
    });

    await setAdminCookie(response);

    return response;
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { error: 'Interná chyba servera' },
      { status: 500 }
    );
  }
}

// GET - check if currently authenticated
export async function GET() {
  const authenticated = await isAdminAuthenticated();
  return NextResponse.json({ authenticated });
}

// DELETE - logout
export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Odhlásenie úspešné' });
  clearAdminCookie(response);
  return response;
}
