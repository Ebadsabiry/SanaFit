/** Exercise GIFs and still demo supplied for Sana's weekly home program. */
const BASE = 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0';
const gif = (path: string) => `${BASE}/${path}`;
const local = (name: string) => `/exercise-media/${name}`;

export const exerciseMedia: Readonly<Record<string, string>> = {
  'goblet-chair-squat': gif('quads/dumbbell-goblet-squat.gif'),
  'dumbbell-rdl': gif('glutes/dumbbell-romanian-deadlift.gif'),
  'mini-band-glute-bridge': local('mini-band-glute-bridge.gif'),
  'supported-reverse-lunge': local('supported-reverse-lunge.gif'),
  'mini-band-lateral-walk': local('mini-band-lateral-walk.gif'),
  'standing-calf-raise': gif('calves/bodyweight-standing-calf-raise.gif'),
  'ball-wall-squat-hold': local('yoga-ball-wall-squat-hold.gif'),
  'long-band-seated-row': gif('upper-back/resistance-band-seated-straight-back-row.gif'),
  'dumbbell-shoulder-press': gif('delts/dumbbell-seated-shoulder-press.gif'),
  'wall-push-up': gif('pectorals/push-up-wall.gif'),
  'long-band-biceps-curl': gif('biceps/band-alternating-biceps-curl.gif'),
  'long-band-triceps-extension': local('long-band-triceps-extension.gif'),
  'dumbbell-lateral-raise': gif('delts/dumbbell-lateral-raise.gif'),
  'dead-bug': gif('abs/dead-bug.gif'),
  'yoga-ball-seated-balance': local('yoga-ball-seated-balance.jpg'),
  'dumbbell-squat': gif('glutes/dumbbell-squat.gif'),
  'long-band-row': gif('upper-back/band-one-arm-standing-low-row.gif'),
  'wall-counter-push-up': gif('pectorals/push-up-wall.gif'),
  'single-leg-glute-bridge': gif('glutes/single-leg-bridge-with-outstretched-leg.gif'),
  'mini-band-standing-abduction': local('mini-band-standing-abduction.gif'),
  'dumbbell-biceps-curl': gif('biceps/dumbbell-standing-biceps-curl.gif'),
  'bird-dog': local('bird-dog.gif'),
  'ball-wall-squat': local('yoga-ball-wall-squat-hold.gif'),
};

export const offlineExerciseMediaCache = 'sanafit-exercise-media-v1';

export async function cacheAllExerciseMedia(onProgress: (done: number, total: number) => void) {
  if (!('caches' in window) || !('serviceWorker' in navigator)) throw new Error('Offline storage is unavailable in this browser.');
  await navigator.serviceWorker.ready;
  const urls = [...new Set(Object.values(exerciseMedia))];
  const cache = await caches.open(offlineExerciseMediaCache);
  let saved = 0;
  let failed = 0;

  for (let index = 0; index < urls.length; index += 1) {
    const url = urls[index];
    try {
      if (!await cache.match(url)) {
        const response = await fetch(new Request(url, { mode: 'no-cors', cache: 'reload' }));
        if (!response.ok && response.type !== 'opaque') throw new Error('Could not cache media');
        await cache.put(url, response);
      }
      saved += 1;
    } catch {
      failed += 1;
    }
    onProgress(index + 1, urls.length);
  }

  return { saved, failed, total: urls.length };
}

export const exerciseDemoNotes: Readonly<Record<string, string>> = {
  'goblet-chair-squat': 'Goblet squat demo; use the chair as your depth target.',
  'long-band-biceps-curl': 'Standing band curl shown with alternating arms.',
  'long-band-row': 'Standing band row; use a secure anchor. This differs from the seated row above.',
};

export const exerciseGifCredits = {
  exerciseGym: 'https://github.com/JahelCuadrado/ExerciseGymGifsDB',
};
