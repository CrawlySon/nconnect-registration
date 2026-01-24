import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Admin: Remove registration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const registrationId = params.id;
    const supabase = createServerClient();

    // Get registration to find session
    const { data: registration } = await supabase
      .from('registrations')
      .select('session_id')
      .eq('id', registrationId)
      .single();

    if (!registration) {
      return NextResponse.json(
        { error: 'Registrácia nebola nájdená' },
        { status: 404 }
      );
    }

    // Delete registration
    const { error } = await supabase
      .from('registrations')
      .delete()
      .eq('id', registrationId);

    if (error) {
      console.error('Delete registration error:', error);
      return NextResponse.json(
        { error: 'Nepodarilo sa odstrániť registráciu' },
        { status: 500 }
      );
    }

    // Update session count
    const { data: session } = await supabase
      .from('sessions')
      .select('registered_count')
      .eq('id', registration.session_id)
      .single();

    if (session) {
      await supabase
        .from('sessions')
        .update({ registered_count: Math.max(0, session.registered_count - 1) })
        .eq('id', registration.session_id);
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Admin delete registration error:', error);
    return NextResponse.json(
      { error: 'Interná chyba servera' },
      { status: 500 }
    );
  }
}
