import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import { Session } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { attendeeId, sessionIds, previousSessionIds } = await request.json();

    if (!attendeeId || !sessionIds) {
      return NextResponse.json(
        { error: 'Chýbajú povinné parametre' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get attendee
    const { data: attendee, error: attendeeError } = await supabase
      .from('attendees')
      .select('*')
      .eq('id', attendeeId)
      .single();

    if (attendeeError || !attendee) {
      return NextResponse.json(
        { error: 'Účastník nebol nájdený' },
        { status: 404 }
      );
    }

    // Calculate what changed
    const toAdd = sessionIds.filter((id: string) => !previousSessionIds.includes(id));
    const toRemove = previousSessionIds.filter((id: string) => !sessionIds.includes(id));

    // Remove old registrations
    if (toRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('registrations')
        .delete()
        .eq('attendee_id', attendeeId)
        .in('session_id', toRemove);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        return NextResponse.json(
          { error: 'Nepodarilo sa odstrániť registrácie' },
          { status: 500 }
        );
      }

      // Decrement counts for removed sessions
      for (const sessionId of toRemove) {
        const { data: session } = await supabase
          .from('sessions')
          .select('registered_count')
          .eq('id', sessionId)
          .single();
        
        if (session) {
          await supabase
            .from('sessions')
            .update({ registered_count: Math.max(0, session.registered_count - 1) })
            .eq('id', sessionId);
        }
      }
    }

    // Add new registrations
    if (toAdd.length > 0) {
      // Validate capacity and conflicts for new registrations
      for (const sessionId of toAdd) {
        const { data: session } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (!session) {
          return NextResponse.json(
            { error: 'Prednáška nebola nájdená' },
            { status: 404 }
          );
        }

        if (session.registered_count >= session.capacity) {
          return NextResponse.json(
            { error: `Prednáška "${session.title}" je už plne obsadená` },
            { status: 400 }
          );
        }
      }

      // Insert new registrations
      const registrationsToInsert = toAdd.map((sessionId: string) => ({
        attendee_id: attendeeId,
        session_id: sessionId,
      }));

      const { error: insertError } = await supabase
        .from('registrations')
        .insert(registrationsToInsert);

      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json(
          { error: 'Nepodarilo sa vytvoriť registrácie' },
          { status: 500 }
        );
      }

      // Increment counts for added sessions
      for (const sessionId of toAdd) {
        const { data: session } = await supabase
          .from('sessions')
          .select('registered_count')
          .eq('id', sessionId)
          .single();
        
        if (session) {
          await supabase
            .from('sessions')
            .update({ registered_count: session.registered_count + 1 })
            .eq('id', sessionId);
        }
      }
    }

    // Get all current registered sessions for email
    const { data: registrations } = await supabase
      .from('registrations')
      .select('session:sessions(*, stage:stages(*))')
      .eq('attendee_id', attendeeId);

    const allSessions = (registrations?.map(r => r.session) || []) as unknown as Session[];

    // Send summary email only if there were changes
    if (toAdd.length > 0 || toRemove.length > 0) {
      try {
        await sendEmail({
          to: attendee.email,
          attendeeName: attendee.name,
          type: 'update',
          sessions: allSessions,
        });
      } catch (emailError) {
        console.error('Email send error:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Zmeny boli uložené',
      added: toAdd.length,
      removed: toRemove.length,
    });
  } catch (error) {
    console.error('Bulk registration error:', error);
    return NextResponse.json(
      { error: 'Interná chyba servera' },
      { status: 500 }
    );
  }
}
