import { SurveyQuestion } from '@/types';

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: 'status',
    label: 'Aký je váš status?',
    type: 'single_choice',
    required: true,
    options: [
      { value: 'student', label: 'Študent' },
      { value: 'zamestnanec', label: 'Zamestnanec' },
      { value: 'podnikatel', label: 'Podnikateľ' },
      { value: 'ine', label: 'Iné' },
    ],
  },
  {
    id: 'motivation',
    label: 'Čo vás motivovalo zúčastniť sa?',
    type: 'multi_choice',
    options: [
      { value: 'temy', label: 'Zaujímavé témy' },
      { value: 'speakri', label: 'Meno speakerov' },
      { value: 'firmy', label: 'Meno spoločností' },
      { value: 'networking', label: 'Networking' },
      { value: 'obcerstvenie', label: 'Občerstvenie' },
      { value: 'ospravedlnenie', label: 'Ospravedlnenie z výučby' },
    ],
  },
  {
    id: 'discovery',
    label: 'Ako ste sa o nConnect dozvedeli?',
    type: 'multi_choice',
    options: [
      { value: 'socialne_siete', label: 'Sociálne siete' },
      { value: 'skola', label: 'Škola' },
      { value: 'kamarati', label: 'Kamaráti' },
      { value: 'email', label: 'Email' },
      { value: 'ine', label: 'Iné' },
    ],
  },
  {
    id: 'attendance_form',
    label: 'Forma účasti',
    type: 'single_choice',
    required: true,
    options: [
      { value: 'osobne', label: 'Osobne' },
      { value: 'online', label: 'Online' },
    ],
  },
  {
    id: 'speaker_quality',
    label: 'Celková kvalita speakerov',
    type: 'star_rating',
    maxStars: 5,
  },
  {
    id: 'organization',
    label: 'Celková organizácia konferencie',
    type: 'star_rating',
    maxStars: 5,
  },
  {
    id: 'format_ok',
    label: 'Vyhovoval vám formát prednášky (45 min)?',
    type: 'single_choice',
    options: [
      { value: 'ano', label: 'Áno' },
      { value: 'nie', label: 'Nie' },
    ],
  },
  {
    id: 'format_reason',
    label: 'Ak nie, akú dĺžku by ste navrhovali a prečo?',
    type: 'conditional_text',
    conditionalOn: { questionId: 'format_ok', value: 'nie' },
    placeholder: 'Napíšte svoj návrh...',
    maxLength: 500,
  },
  {
    id: 'qa_participation',
    label: 'Zapojili ste sa počas konferencie do diskusie alebo Q&A?',
    type: 'single_choice',
    options: [
      { value: 'aktivne', label: 'Áno, aktívne' },
      { value: 'slido', label: 'Áno, cez Slido' },
      { value: 'chcel_som', label: 'Nie, ale mal/a som záujem' },
      { value: 'nie', label: 'Nie, nemal/a som záujem' },
    ],
  },
  {
    id: 'stream_quality',
    label: 'Ako hodnotíte kvalitu online streamu?',
    type: 'star_rating',
    maxStars: 5,
    showWhen: { questionId: 'attendance_form', values: ['online'] },
  },
  {
    id: 'liked_most',
    label: 'Čo sa vám páčilo najviac?',
    type: 'text',
    placeholder: 'Napíšte, čo vás zaujalo...',
    maxLength: 1000,
  },
  {
    id: 'improvements',
    label: 'Čo by ste zlepšili?',
    type: 'text',
    placeholder: 'Vaše návrhy na zlepšenie...',
    maxLength: 1000,
  },
  {
    id: 'nps',
    label: 'Odporučili by ste nConnect svojim známym alebo kolegom?',
    type: 'nps',
    maxScale: 10,
  },
  {
    id: 'volunteer',
    label: 'Máte záujem zapojiť sa do organizácie budúceho ročníka nConnect27 ako dobrovoľník?',
    type: 'single_choice',
    options: [
      { value: 'ano', label: 'Áno' },
      { value: 'nie', label: 'Nie' },
    ],
  },
];
