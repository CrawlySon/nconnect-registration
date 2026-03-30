import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { SURVEY_QUESTIONS } from '@/lib/survey-config';
import { SurveyAnswers } from '@/types';

export const dynamic = 'force-dynamic';

// GET - fetch survey response for an attendee
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const attendeeId = searchParams.get('attendee');

    if (!attendeeId) {
      return NextResponse.json({ error: 'Chýba ID účastníka' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('survey_responses')
      .select('*')
      .eq('attendee_id', attendeeId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Survey fetch error:', error);
      return NextResponse.json({ error: 'Chyba pri načítaní dotazníka' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || null });
  } catch (error) {
    console.error('Survey GET error:', error);
    return NextResponse.json({ error: 'Interná chyba servera' }, { status: 500 });
  }
}

// POST - save or update survey response (upsert)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { attendee_id, answers } = body as { attendee_id: string; answers: SurveyAnswers };

    if (!attendee_id || !answers) {
      return NextResponse.json({ error: 'Chýbajú povinné údaje' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Verify attendee exists
    const { data: attendee, error: attendeeError } = await supabase
      .from('attendees')
      .select('id')
      .eq('id', attendee_id)
      .single();

    if (attendeeError || !attendee) {
      return NextResponse.json({ error: 'Účastník nenájdený' }, { status: 404 });
    }

    // Validate answers
    const cleanAnswers: SurveyAnswers = {};
    for (const q of SURVEY_QUESTIONS) {
      const val = answers[q.id];

      // Skip hidden questions
      if (q.showWhen) {
        const depVal = answers[q.showWhen.questionId];
        if (!depVal || !q.showWhen.values.includes(String(depVal))) continue;
      }
      if (q.conditionalOn) {
        const depVal = answers[q.conditionalOn.questionId];
        if (depVal !== q.conditionalOn.value) continue;
      }

      if (val === undefined || val === null || val === '') continue;

      if (q.type === 'star_rating' && (typeof val !== 'number' || val < 1 || val > (q.maxStars || 5))) continue;
      if (q.type === 'nps' && (typeof val !== 'number' || val < 1 || val > (q.maxScale || 10))) continue;
      if (q.type === 'text' || q.type === 'conditional_text') {
        cleanAnswers[q.id] = String(val).trim().slice(0, q.maxLength || 1000);
        continue;
      }

      cleanAnswers[q.id] = val;
    }

    const { data, error } = await supabase
      .from('survey_responses')
      .upsert(
        {
          attendee_id,
          answers: cleanAnswers,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'attendee_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Survey upsert error:', error);
      return NextResponse.json({ error: 'Chyba pri ukladaní dotazníka' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Dotazník uložený',
    });
  } catch (error) {
    console.error('Survey POST error:', error);
    return NextResponse.json({ error: 'Interná chyba servera' }, { status: 500 });
  }
}
