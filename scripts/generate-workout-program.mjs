import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { programWeeks } from '../src/program.ts';

const rep = ex => `${ex.sets} × ${ex.min === ex.max ? ex.min : `${ex.min}–${ex.max}`} ${ex.unit === 'seconds' ? 'seconds' : ex.unit === 'steps' ? 'steps each direction' : 'reps'}${ex.unilateral && ex.unit !== 'steps' ? ' each side' : ''}`;
const lines = [
  '# SanaFit — Weekly Home Workout Program',
  '',
  'Goal: gain strength, muscle, and healthy body weight. Equipment: small and long resistance bands, 2.5 kg dumbbell(s), yoga ball, mat, chair, and wall.',
  '',
  'Schedule: Saturday — Lower Body + Glutes; Sunday — Rest; Monday — Upper Body + Core; Tuesday — Rest; Wednesday — Full Body + Glutes; Thursday — Rest / light walking; Friday — Full Rest.',
  '',
  '## Warm-up before every workout',
  '',
  ...['Walk in place — 2 minutes','Shoulder circles — 30 seconds','Hip hinges — 10 reps','Bodyweight squats — 10 reps','Arm swings + ankle movements — 1 minute'].map(item => `- ${item}`),
  '',
  '## Progression',
  '',
  programWeeks[0].approach,
  '',
  '## Rest guidance',
  '',
  '- Rest 60–90 seconds between most sets.',
  '- Rest up to 90–120 seconds after squats, lunges, and Romanian deadlifts.',
  '',
];
for (const week of programWeeks) {
  lines.push(`## ${week.title}`, '');
  for (const day of week.days) {
    lines.push(`### ${day.name} — ${day.focus}`, '');
    if (!day.exercises.length) lines.push(day.id === 'thu' ? 'Rest or optional light walking.' : day.id === 'fri' ? 'Full rest.' : 'Rest day.', '');
    for (const [index, ex] of day.exercises.entries()) lines.push(`${index + 1}. ${ex.name} — ${rep(ex)}; rest ${ex.rest}.`);
    if (day.exercises.length) lines.push('');
  }
}
lines.push('Workout length: approximately 30–45 minutes.', '', 'Progression: keep the same plan each week. Gradually add reps. When all sets reach the top of the range comfortably with good form, use more band tension, slower repetitions, greater range of motion, a harder variation, or eventually heavier dumbbells. The final 2–3 reps should feel challenging while technique stays controlled.', '', 'Safety: stop for sharp pain, dizziness, chest pain, or unusual breathing difficulty. Pair the workout with the food program and enough daily calories and protein for muscle and weight gain.', '', 'Attendance in the app records completed workout days locally.', '');
writeFileSync(fileURLToPath(new URL('../WORKOUT_PROGRAM.md', import.meta.url)), lines.join('\n'), 'utf8');
