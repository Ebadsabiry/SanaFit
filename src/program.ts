export type Exercise = {
  id: string; name: string; sets: number; min: number; max: number;
  unit?: 'reps' | 'seconds' | 'steps'; unilateral?: boolean; rest: string; alternatives?: string[];
};
export type TrainingDay = { id: string; name: string; focus: string; exercises: Exercise[] };
export type ProgramWeek = { title: string; approach: string; days: TrainingDay[] };
const e = (id:string,name:string,sets:number,min:number,max:number,rest:string,extra:Partial<Exercise>={}) => ({id,name,sets,min,max,rest,...extra});
const day = (id:string,name:string,focus:string,exercises:Exercise[]):TrainingDay => ({id,name,focus,exercises});
const restDay = (id:string,name:string,focus='Rest'):TrainingDay => day(id,name,focus,[]);

const weeklyDays:TrainingDay[] = [
 day('sat','Saturday','Lower body + glutes',[
  e('goblet-chair-squat','Goblet Chair Squat',3,8,12,'90–120 sec'),
  e('dumbbell-rdl','Dumbbell Romanian Deadlift',3,10,12,'90–120 sec'),
  e('mini-band-glute-bridge','Mini-Band Glute Bridge',3,12,15,'60–90 sec'),
  e('supported-reverse-lunge','Supported Reverse Lunge',2,8,10,'90–120 sec',{unilateral:true}),
  e('mini-band-lateral-walk','Mini-Band Lateral Walk',2,10,12,'60–90 sec',{unit:'steps',unilateral:true}),
  e('standing-calf-raise','Standing Calf Raise',3,12,20,'60–90 sec'),
  e('ball-wall-squat-hold','Yoga-Ball Wall Squat Hold',2,20,30,'60–90 sec',{unit:'seconds'}),
 ]),
 restDay('sun','Sunday'),
 day('mon','Monday','Upper body + core',[
  e('long-band-seated-row','Long-Band Seated Row',3,10,15,'60–90 sec'),
  e('dumbbell-shoulder-press','Dumbbell Shoulder Press',3,8,12,'60–90 sec'),
  e('wall-push-up','Wall Push-Up',3,8,15,'60–90 sec'),
  e('long-band-biceps-curl','Long-Band Biceps Curl',3,10,15,'60–90 sec'),
  e('long-band-triceps-extension','Long-Band Triceps Extension',2,10,15,'60–90 sec'),
  e('dumbbell-lateral-raise','Dumbbell Lateral Raise',2,10,12,'60–90 sec',{unilateral:true}),
  e('dead-bug','Dead Bug',2,8,10,'60–90 sec',{unilateral:true}),
  e('yoga-ball-seated-balance','Yoga-Ball Seated Balance',2,30,45,'60–90 sec',{unit:'seconds'}),
 ]),
 restDay('tue','Tuesday'),
 day('wed','Wednesday','Full body + glutes',[
  e('dumbbell-squat','Dumbbell Squat',3,10,12,'90–120 sec'),
  e('dumbbell-rdl','Dumbbell Romanian Deadlift',3,10,12,'90–120 sec'),
  e('long-band-row','Long-Band Row',3,10,15,'60–90 sec'),
  e('wall-counter-push-up','Wall or Counter Push-Up',3,8,12,'60–90 sec'),
  e('single-leg-glute-bridge','Single-Leg Glute Bridge',2,8,10,'60–90 sec',{unilateral:true,alternatives:['Normal mini-band glute bridge']}),
  e('mini-band-standing-abduction','Mini-Band Standing Leg Abduction',2,10,15,'60–90 sec',{unilateral:true}),
  e('dumbbell-biceps-curl','Dumbbell Biceps Curl',2,10,12,'60–90 sec'),
  e('bird-dog','Bird Dog',2,8,10,'60–90 sec',{unilateral:true}),
  e('ball-wall-squat','Yoga-Ball Wall Squat',2,10,12,'60–90 sec'),
 ]),
 restDay('thu','Thursday','Rest / light walking'),
 restDay('fri','Friday','Full rest'),
];

const approach='Repeat the same workout. Add reps gradually while keeping your form controlled. When every set reaches the top of its range comfortably, make it harder with more band tension, slower reps, greater range, a harder variation, or heavier dumbbells. The last 2–3 reps should feel challenging without losing control.';
export const programWeeks:ProgramWeek[]=[{title:'Weekly home plan',approach,days:weeklyDays}];
export const days = programWeeks[0].days;
export const allExercises = days.flatMap(trainingDay=>trainingDay.exercises);
export const trainingDays = ['sat','mon','wed'] as const;
export const progression = (_week=1) => programWeeks[0];
export const dayForDate=(date:Date,timeZone='Asia/Kabul')=>{const wd=new Intl.DateTimeFormat('en-US',{weekday:'short',timeZone}).format(date).toLowerCase();return ({sat:'sat',sun:'sun',mon:'mon',tue:'tue',wed:'wed',thu:'thu',fri:'fri'} as Record<string,string>)[wd]??'sat'};
export const localDateKey=(date:Date,timeZone='Asia/Kabul')=>new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
export const nextSaturday=(now=new Date(),timeZone='Asia/Kabul')=>{let day=new Intl.DateTimeFormat('en-US',{weekday:'short',timeZone}).format(now);let n=day==='Sat'?7:({Sun:6,Mon:5,Tue:4,Wed:3,Thu:2,Fri:1} as Record<string,number>)[day]??7;let d=new Date(now.getTime()+n*86400000);return localDateKey(d,timeZone)};
export function planWeek(startDate:string,today:Date,timeZone='Asia/Kabul'){const fmt=(d:Date)=>localDateKey(d,timeZone);const start=new Date(`${startDate}T12:00:00`);const nowKey=fmt(today);const now=new Date(`${nowKey}T12:00:00`);const diff=Math.floor((Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())-Date.UTC(start.getFullYear(),start.getMonth(),start.getDate()))/86400000);return diff<0?0:Math.floor(diff/7)+1;}
export function progressionEligible(exercise:Exercise,sets:{reps?:number;seconds?:number;load?:number;rir?:number;skipped?:boolean;left?:number;right?:number;leftReps?:number;rightReps?:number}[],variant:string,previousVariant:string,techniqueConfirmed:boolean){
 if(variant!==previousVariant||sets.length!==exercise.sets||!techniqueConfirmed)return false;
 const loads=sets.map(set=>set.load).filter((value):value is number=>value!==undefined);
 if(exercise.unit!=='seconds'&&(loads.length!==exercise.sets||new Set(loads).size!==1))return false;
 return sets.every(set=>{if(set.skipped||set.rir===undefined||set.rir<1||set.rir>3)return false;if(exercise.unit==='seconds')return (set.left??0)>=exercise.max&&(set.right??0)>=exercise.max;if(exercise.unilateral)return (set.leftReps??0)>=exercise.max&&(set.rightReps??0)>=exercise.max;return (set.reps??0)>=exercise.max;});
}
export const workingSetEntries=<T extends {warmup?:boolean}>(rows:T[])=>rows.filter(row=>!row.warmup);
export const warmup = ['Walk in place — 2 minutes','Shoulder circles — 30 seconds','Hip hinges — 10 reps','Bodyweight squats — 10 reps','Arm swings + ankle movements — 1 minute'];
export const weekStartKey=(date=new Date(),timeZone='Asia/Kabul')=>{
 const weekday=new Intl.DateTimeFormat('en-US',{weekday:'short',timeZone}).format(date);
 const daysSinceSaturday=({Sat:0,Sun:1,Mon:2,Tue:3,Wed:4,Thu:5,Fri:6} as Record<string,number>)[weekday]??0;
 const localKey=localDateKey(date,timeZone);
 const localNoon=new Date(`${localKey}T12:00:00`);
 localNoon.setDate(localNoon.getDate()-daysSinceSaturday);
 return localDateKey(localNoon,timeZone);
};
