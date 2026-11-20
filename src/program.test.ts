import { beforeEach, describe, expect, it } from 'vitest';
import { allExercises, dayForDate, nextSaturday, planWeek, programWeeks } from './program';
import { exerciseDemoNotes, exerciseMedia } from './exercise-media';
import { cues } from './catalog';
import { attendanceDb, attendanceId } from './attendance';

describe('four-week approved workout plan', () => {
  it('has five six-exercise training days and two rest days in every week', () => {
    expect(programWeeks).toHaveLength(4);
    for (const week of programWeeks) {
      expect(week.days.map(day => day.id)).toEqual(['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri']);
      expect(week.days.filter(day => day.exercises.length === 6)).toHaveLength(5);
      expect(week.days.find(day => day.id === 'tue')?.exercises).toHaveLength(0);
      expect(week.days.find(day => day.id === 'fri')?.exercises).toHaveLength(0);
    }
    expect(allExercises).toHaveLength(120);
  });

  it('preserves the user-provided weekly progression and exercise details', () => {
    expect(programWeeks.map(week => week.title)).toEqual([
      'Original foundation', 'Controlled variation', 'Progressive overload', 'Consolidation',
    ]);
    expect(programWeeks[0].days[0].exercises.map(exercise => [exercise.name, exercise.sets, exercise.min, exercise.max])).toEqual([
      ['Back squat', 3, 6, 8], ['Horizontal leg press', 3, 10, 15], ['Leg extension', 2, 12, 15],
      ['Lying leg curl', 3, 10, 15], ['Standing calf raise', 3, 10, 15], ['Dumbbell walking lunge', 2, 10, 10],
    ]);
    expect(programWeeks[1].days[0].exercises[2].name).toBe('Bulgarian split squat');
    expect(programWeeks[2].days[0].exercises[5].name).toBe('Reverse dumbbell lunge');
    expect(programWeeks[3].days[4].exercises).toHaveLength(6);
  });

  it('maps every unique plan exercise to a pinned, real GIF from the selected catalog', () => {
    const ids = new Set(allExercises.map(exercise => exercise.id));
    for (const id of ids) expect(exerciseMedia[id]).toMatch(/^https:\/\/cdn\.jsdelivr\.net\/gh\/JahelCuadrado\/ExerciseGymGifsDB@v1\.1\.0\/.+\.gif$/);
  });

  it('has movement-specific equipment and coaching cues for every plan exercise', () => {
    const ids = new Set(allExercises.map(exercise => exercise.id));
    for (const id of ids) {
      expect(cues[id]?.equipment, `${id} should name its equipment`).toBeTruthy();
      expect(cues[id]?.muscles, `${id} should name its target muscles`).toBeTruthy();
      expect(cues[id]?.execution, `${id} should have a movement-specific tip`).toBeTruthy();
    }
    expect(new Set([...ids].map(id => cues[id].execution)).size).toBe(ids.size);
    expect(cues['leg-press'].equipment).toContain('Horizontal seated');
    expect(cues.calf.equipment).toContain('Standing calf-raise machine');
    expect(cues.row.equipment).toContain('Chest-supported row machine');
    expect(cues['neutral-pulldown'].equipment).toContain('parallel/V-bar');
    expect(exerciseDemoNotes['leg-press']).toContain('single-leg');
    expect(exerciseDemoNotes['seated-cable-pullover']).toContain('lying rather than seated');
  });

  it('uses Kabul-local dates for weekdays and block weeks', () => {
    expect(dayForDate(new Date('2026-11-07T20:00:00Z'))).toBe('sun');
    expect(dayForDate(new Date('2026-11-07T20:00:00Z'), 'America/Los_Angeles')).toBe('sat');
    expect(nextSaturday(new Date('2026-11-04T12:00:00Z'), 'Asia/Kabul')).toBe('2026-11-07');
    expect(planWeek('2026-11-07', new Date('2026-11-28T12:00:00Z'))).toBe(4);
  });
});

describe('gym attendance', () => {
  beforeEach(async () => { await attendanceDb.entries.clear(); });
  it('stores independent week/day check-ins and supports unchecking them', async () => {
    const weekOneSaturday = attendanceId(1, 'sat');
    const weekTwoSaturday = attendanceId(2, 'sat');
    await attendanceDb.entries.put({ id: weekOneSaturday, week: 1, dayId: 'sat', checkedAt: '2026-11-07T10:00:00Z' });
    await attendanceDb.entries.put({ id: weekTwoSaturday, week: 2, dayId: 'sat', checkedAt: '2026-11-14T10:00:00Z' });
    expect(await attendanceDb.entries.count()).toBe(2);
    await attendanceDb.entries.delete(weekOneSaturday);
    expect(await attendanceDb.entries.get(weekOneSaturday)).toBeUndefined();
    expect(await attendanceDb.entries.get(weekTwoSaturday)).toMatchObject({ week: 2, dayId: 'sat' });
  });
});
