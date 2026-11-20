import { useEffect, useMemo, useState } from 'react';
import { Activity, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronRight, Clock3, Download, Dumbbell, Info, Moon, Printer, Search, Sun, Target } from 'lucide-react';
import { allExercises, programWeeks, dayForDate, weekStartKey, warmup, type Exercise, type TrainingDay, type TrainingDay as Day } from './program';
import { cacheAllExerciseMedia, exerciseMedia, exerciseDemoNotes, exerciseGifCredits } from './exercise-media';
import { cueFor } from './catalog';
import { attendanceDb, attendanceId, requestPersistentAttendanceStorage, type AttendanceRecord } from './attendance';

type Screen = 'today' | 'week' | 'exercises' | 'progress';
type Theme = 'dark' | 'light';
const screenFromHash = (hash:string):Screen => {
 const screen=hash.replace(/^#/,'');
 return screen==='week'||screen==='exercises'||screen==='progress'?screen:'today';
};
const dayKeys = ['sat','sun','mon','tue','wed','thu','fri'];
const scheduledDays = ['sat','mon','wed'];
const dose = (exercise:Exercise) => `${exercise.sets} × ${exercise.min === exercise.max ? exercise.min : `${exercise.min}–${exercise.max}`} ${exercise.unit === 'seconds' ? 'sec' : exercise.unit === 'steps' ? 'steps' : 'reps'}${exercise.unilateral ? (exercise.unit === 'steps' ? ' each direction' : ' each side') : ''}`;
const dayTitle:Record<string,string>={sat:'Lower body + glutes',sun:'Rest',mon:'Upper body + core',tue:'Rest',wed:'Full body + glutes',thu:'Rest / light walking',fri:'Full rest'};
const targetMuscles:Record<string,string[]>={sat:['Thighs','Glutes','Hamstrings','Calves'],sun:['Recovery'],mon:['Shoulders','Arms','Core'],tue:['Recovery'],wed:['Full body','Glutes','Core'],thu:['Easy walking','Recovery'],fri:['Full recovery']};
const storedTheme = ():Theme => localStorage.getItem('sanafit-theme')==='light'?'light':'dark';
export default function App(){
 const today=useMemo(()=>dayForDate(new Date(),'Asia/Kabul'),[]);
 const [screen,setScreen]=useState<Screen>(()=>screenFromHash(window.location.hash));
 const currentWeek=useMemo(()=>weekStartKey(new Date(),'Asia/Kabul'),[]);
 const [theme,setTheme]=useState<Theme>(storedTheme);
 const [selectedDay,setSelectedDay]=useState(today);
 const [attendance,setAttendance]=useState<AttendanceRecord[]>([]);
 const [attendanceError,setAttendanceError]=useState('');
 const activeWeek=programWeeks[0];
 const selected=activeWeek.days.find(day=>day.id===selectedDay)??activeWeek.days[0];
 const isToday=selected.id===today;
 useEffect(()=>{attendanceDb.entries.toArray().then(setAttendance).catch(()=>setAttendanceError('Attendance storage is unavailable on this browser.'))},[]);
 useEffect(()=>{const syncScreen=()=>setScreen(screenFromHash(window.location.hash));window.addEventListener('hashchange',syncScreen);if(!window.location.hash)window.history.replaceState(null,'','#today');return()=>window.removeEventListener('hashchange',syncScreen)},[]);
 const navigate=(next:Screen)=>{if(screenFromHash(window.location.hash)!==next)window.location.hash=next;setScreen(next)};
 const toggleTheme=()=>setTheme(current=>{const next=current==='dark'?'light':'dark';localStorage.setItem('sanafit-theme',next);return next});
 const toggleAttendance=async(dayId:string)=>{
  const id=attendanceId(currentWeek,dayId);
  try{const existing=attendance.find(row=>row.id===id);if(existing){await attendanceDb.entries.delete(id);setAttendance(rows=>rows.filter(row=>row.id!==id))}else{const entry:AttendanceRecord={id,week:currentWeek,dayId,checkedAt:new Date().toISOString()};await attendanceDb.entries.put(entry);void requestPersistentAttendanceStorage();setAttendance(rows=>[...rows.filter(row=>row.id!==id),entry])}setAttendanceError('')}catch{setAttendanceError('Could not save attendance. Keep this page open and try again.')}
 };
 const isAttended=(dayId:string)=>attendance.some(row=>row.id===attendanceId(currentWeek,dayId));
 return <div className={`guide-shell view-${screen}`} data-theme={theme}>
  <header className="guide-header">
   <a className="guide-brand" href="#today" onClick={event=>{event.preventDefault();navigate('today');setSelectedDay(today)}} aria-label="SanaFit home"><span className="guide-brand-icon"><span className="brand-letter-s">S</span></span><span className="guide-brand-copy"><b>SANAFIT</b><small>HOME WORKOUT PLAN</small></span></a>
   <nav className="guide-nav" aria-label="Main navigation"><button className={screen==='today'?'guide-nav-item current':'guide-nav-item'} onClick={()=>navigate('today')}><Target size={16}/> Workout</button><button className={screen==='week'?'guide-nav-item current':'guide-nav-item'} onClick={()=>navigate('week')}><CalendarDays size={16}/> Weekly plan</button><button className={screen==='exercises'?'guide-nav-item current':'guide-nav-item'} onClick={()=>navigate('exercises')}><Dumbbell size={16}/> Exercises</button><button className={screen==='progress'?'guide-nav-item current':'guide-nav-item'} onClick={()=>navigate('progress')}><CheckCircle2 size={16}/> Progress</button></nav>
   <div className="guide-header-actions"><button className="guide-theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme==='dark'?'light':'dark'} mode`} title={`Switch to ${theme==='dark'?'light':'dark'} mode`}>{theme==='dark'?<Sun size={16}/>:<Moon size={16}/>}<span>{theme==='dark'?'Light mode':'Dark mode'}</span></button><button className="guide-print" onClick={()=>window.print()}><Printer size={16}/><span>Print plan</span></button></div>
  </header>
  <main className="guide-main">
   {screen==='today'&&<>
    <section className="guide-intro"><div className="guide-overline">{isToday?'YOUR WORKOUT TODAY':'WEEKLY HOME PLAN'}</div><h1>{isToday?`Today · ${selected.name}`:selected.name}</h1><p>{activeWeek.approach}</p></section>
    <DayPicker selected={selectedDay} today={today} days={activeWeek.days} onSelect={setSelectedDay}/>
    <DayOverview day={selected} isToday={isToday} attended={isAttended(selected.id)} onToggle={()=>void toggleAttendance(selected.id)}/>
    {selected.exercises.length>0&&<Warmup/>}<ExerciseList day={selected}/><ProgressionNote/>
   </>}
   {screen==='week'&&<>
    <section className="guide-intro week-intro"><div><div className="guide-overline">SANA’S HOME WORKOUT SCHEDULE</div><h1>{activeWeek.title}</h1><p>{activeWeek.approach}</p></div><button className="guide-print large-print" onClick={()=>window.print()}><Printer size={16}/> Print plan</button></section>
    <h1 className="week-print-title">SanaFit · Weekly Home Plan</h1>
    <div className="week-plan-list">{activeWeek.days.map(day=><WeekDay key={day.id} day={day} attended={isAttended(day.id)} onToggle={()=>void toggleAttendance(day.id)} onOpen={()=>{setSelectedDay(day.id);navigate('today')}}/>)}</div>
   </>}
   {screen==='exercises'&&<ExerciseLibrary/>}
   {screen==='progress'&&<ProgressPage attendance={attendance} currentWeek={currentWeek}/ >}
   {attendanceError&&<div role="alert" className="attendance-error">{attendanceError}</div>}
  </main>
  <footer className="guide-footer"><span><Activity size={15}/> SANAFIT</span><span>Home program · workouts Saturday, Monday & Wednesday</span><span>Stop for sharp pain, dizziness, chest pain, or unusual breathing difficulty.</span></footer>
 </div>;
}
function DayPicker({selected,today,days,onSelect}:{selected:string;today:string;days:TrainingDay[];onSelect:(day:string)=>void}){return <div className="day-picker" aria-label="Choose workout day">{dayKeys.map(key=>{const day=days.find(item=>item.id===key)!;return <button key={key} className={`day-pick ${selected===key?'day-pick-active':''} ${today===key?'day-pick-today':''}`} onClick={()=>onSelect(day.id)} aria-pressed={selected===key}><span>{day.name.slice(0,3)}</span><i>{day.exercises.length?'TRAIN':'REST'}</i></button>})}</div>}
function DayOverview({day,isToday,attended,onToggle}:{day:TrainingDay;isToday:boolean;attended:boolean;onToggle:()=>void}){return <section className="day-overview"><div className="day-overview-top"><span className="focus-label"><Target size={15}/>{isToday?'TODAY’S FOCUS':'DAY FOCUS'}</span></div><h2>{dayTitle[day.id]}</h2><div className="muscle-tags">{targetMuscles[day.id].map(muscle=><span key={muscle}>{muscle}</span>)}</div><div className="day-facts"><span><Dumbbell size={16}/>{day.exercises.length?`${day.exercises.length} exercises`:'Recovery day'}</span><span><Clock3 size={16}/>{day.exercises.length?'About 30–45 minutes':day.id==='thu'?'Optional light walk':'Rest'}</span></div>{day.exercises.length>0&&<><p className="day-tip">Use your home equipment and move with control. Most rests are 60–90 seconds; take up to 90–120 seconds after squats, lunges, and Romanian deadlifts.</p><button className={`attendance-toggle ${attended?'attended':''}`} onClick={onToggle} aria-pressed={attended}>{attended?<Check size={18}/>:<span className="attendance-empty"/>}<span><b>{attended?'Workout completed':'Mark workout complete'}</b><small>{attended?'Checked for this week':'Tap after you finish your home workout'}</small></span></button></>}</section>}
function Warmup(){return <section className="warmup-card"><div><div className="guide-overline">BEFORE EVERY WORKOUT</div><h2>Warm up · about 5 minutes</h2></div><ul>{warmup.map(item=><li key={item}>{item}</li>)}</ul></section>}
function ExerciseList({day}:{day:TrainingDay}){if(!day.exercises.length)return <section className="exercise-section rest-section"><div className="rest-symbol">✦</div><div><h2>{day.id==='thu'?'Rest or take a light walk':'Rest and recover'}</h2><p>{day.id==='sun'?'Sunday is a full rest day.':day.id==='thu'?'Keep it easy with optional light walking.':'Friday is your full rest day.'} No catch-up workout is needed.</p></div></section>;return <section className="exercise-section"><div className="exercise-section-head"><div><div className="guide-overline">IN ORDER</div><h2>Today’s exercises</h2></div><span>{day.exercises.length} movements</span></div><div className="exercise-cards">{day.exercises.map((exercise,index)=><ExerciseCard key={`${exercise.id}-${index}`} exercise={exercise} index={index}/>)}</div></section>}
const exerciseCategories=['All','Legs','Chest','Back','Shoulders','Arms','Core'] as const;
type ExerciseCategory=typeof exerciseCategories[number];
function categoryFor(exercise:Exercise):Exclude<ExerciseCategory,'All'>{
 const name=exercise.name.toLowerCase();
 if(/crunch|plank|knee raise|dead bug|bird dog|balance/.test(name))return 'Core';
 if(/curl|triceps|pushdown|extension/.test(name)&&!/leg extension|leg curl/.test(name))return 'Arms';
 if(/lateral raise|rear.?delt|shoulder/.test(name))return 'Shoulders';
 if(/bench|chest|pec deck|fly/.test(name))return 'Chest';
 if(/pulldown|pullover|row/.test(name))return 'Back';
 return 'Legs';
}
function ExerciseLibrary(){
 const [category,setCategory]=useState<ExerciseCategory>('All');
 const [query,setQuery]=useState('');
 const [offlineBusy,setOfflineBusy]=useState(false);
 const [offlineProgress,setOfflineProgress]=useState({done:0,total:0});
 const [offlineMessage,setOfflineMessage]=useState('');
 const saveForOffline=async()=>{
  setOfflineBusy(true);setOfflineMessage('');setOfflineProgress({done:0,total:0});
  try{const result=await cacheAllExerciseMedia((done,total)=>setOfflineProgress({done,total}));setOfflineMessage(result.failed?`Saved ${result.saved} of ${result.total} demos. Connect to the internet and retry the remaining files.`:`All ${result.total} exercise demos are saved on this device. SanaFit can now open offline.`)}catch{setOfflineMessage('Offline saving is unavailable here. Open SanaFit over HTTPS and try again.')}finally{setOfflineBusy(false)}
 };
 const catalog=useMemo(()=>{
  const seen=new Set<string>();
  return allExercises.filter(exercise=>{const key=exercise.name.toLowerCase();if(seen.has(key))return false;seen.add(key);return true});
 },[]);
 const filtered=catalog.filter(exercise=>(category==='All'||categoryFor(exercise)===category)&&exercise.name.toLowerCase().includes(query.trim().toLowerCase()));
 return <>
  <section className="guide-intro"><div className="guide-overline">HOME MOVEMENT DIRECTORY</div><h1>Exercises in Sana’s plan</h1><p>Browse the movements in the weekly home program. Search by name or filter by category; each exercise includes equipment, sets, reps, rest, and form guidance. Exact demos appear where an accurate animation is available.</p></section>
  <p className="demo-attribution">Exercise demos: <a href={exerciseGifCredits.exerciseGym} target="_blank" rel="noreferrer">Exercise Gym GIFs DB</a> and the custom files supplied in the New Exersices folder.</p>
  <section className="offline-pack"><div><div className="guide-overline">OFFLINE ACCESS</div><h2>Take SanaFit with you</h2><p>Save all exercise demos on this device. After the first online visit, the workout plan will open without an internet connection.</p></div><div className="offline-pack-action"><button className="offline-pack-button" onClick={()=>void saveForOffline()} disabled={offlineBusy}><Download size={16}/>{offlineBusy?`Saving ${offlineProgress.done}/${offlineProgress.total||'…'}`:'Save all demos offline'}</button>{offlineMessage&&<small className="offline-pack-status" role="status">{offlineMessage}</small>}</div></section>
  <div className="library-tools"><label className="exercise-search"><Search size={17}/><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search plan exercises" aria-label="Search plan exercises"/></label><span className="library-count">{filtered.length} of {catalog.length} exercises</span></div>
  <div className="library-categories" aria-label="Filter exercises by category">{exerciseCategories.map(item=><button key={item} className={category===item?'library-category active':'library-category'} onClick={()=>setCategory(item)} aria-pressed={category===item}>{item}</button>)}</div>
  {filtered.length?<div className="exercise-cards library-exercise-cards">{filtered.map((exercise,index)=><div className="library-entry" key={`${exercise.id}-${exercise.name}`}><div className="library-entry-label"><span>{categoryFor(exercise)}</span><span>IN YOUR PROGRAM</span></div><ExerciseCard exercise={exercise} index={index}/></div>)}</div>:<div className="library-empty">No plan exercises match that search.</div>}
 </>;
}
function ExerciseCard({exercise,index}:{exercise:Exercise;index:number}){const cues=cueFor(exercise.id);const[mediaUnavailable,setMediaUnavailable]=useState(false);const gifUrl=exerciseMedia[exercise.id];return <article className="guide-exercise-card"><div className="exercise-visual" aria-label={`Exercise guidance for ${exercise.name}`}>{gifUrl&&!mediaUnavailable?<img className="exercise-gif" src={gifUrl} alt={`${exercise.name} movement demonstration`} loading="lazy" onError={()=>setMediaUnavailable(true)}/>:<div className="visual-empty"><span className="visual-icon"><Dumbbell size={21}/></span><b>{mediaUnavailable?'Demo unavailable':'Exercise guide'}</b><small>{exerciseDemoNotes[exercise.id]??'Follow the setup and form cues below'}</small></div>}<span className="exercise-number">{String(index+1).padStart(2,'0')}</span>{gifUrl&&exerciseDemoNotes[exercise.id]&&<small className="exercise-demo-note">{exerciseDemoNotes[exercise.id]}</small>}</div><div className="exercise-information"><div className="exercise-title-row"><div><span className="exercise-kicker">EXERCISE {String(index+1).padStart(2,'0')}</span><h3>{exercise.name}</h3></div><span className="dose-pill">{dose(exercise)}</span></div><div className="exercise-meta"><span><Dumbbell size={14}/>{cues.equipment}</span><span><Clock3 size={14}/>Rest {exercise.rest}</span></div><p className="exercise-muscles"><b>Targets</b> {cues.muscles}</p><p className="exercise-hint">{cues.execution}</p><details className="exercise-cues"><summary>Setup and form cues <ChevronDown size={15}/></summary><div className="cue-content"><p><b>Setup</b>{cues.setup}</p><p><b>Movement</b>{cues.execution}</p><p><b>Breathing</b>{cues.breathing}</p><p><b>Avoid</b>{cues.mistakes}</p>{exercise.alternatives?.length?<p><b>Alternative</b>{exercise.alternatives.join(' or ')}</p>:null}</div></details></div></article>}
function WeekDay({day,attended,onToggle,onOpen}:{day:Day;attended:boolean;onToggle:()=>void;onOpen:()=>void}){return <article className="week-plan-card"><div className="week-plan-heading"><div><span>{day.name.toUpperCase()}</span><h2>{dayTitle[day.id]}</h2></div>{day.exercises.length>0&&<AttendanceButton attended={attended} onToggle={onToggle}/>}</div>{day.exercises.length?<><ol>{day.exercises.map(ex=><li key={ex.id}><button onClick={onOpen}><span>{ex.name}</span><b>{dose(ex)}</b></button></li>)}</ol><button className="week-detail-link" onClick={onOpen}>Open exercise demos and cues <ChevronRight size={14}/></button></>:<p className="week-rest-text">Rest day · No workout attendance needed</p>}</article>}
function AttendanceButton({attended,onToggle}:{attended:boolean;onToggle:()=>void}){return <button className={`week-attendance ${attended?'attended':''}`} onClick={onToggle} aria-pressed={attended}>{attended?<Check size={15}/>:<span className="attendance-empty small-empty"/>}{attended?'Completed':'Mark complete'}</button>}
function ProgressionNote(){return <><aside className="plan-note"><Info size={17}/><div><b>Progress gradually</b><p>{programWeeks[0].approach} Rest 60–90 seconds between most sets and up to 90–120 seconds after squats, lunges, and Romanian deadlifts.</p></div></aside><aside className="plan-note safety-note"><Info size={17}/><div><b>Train safely</b><p>Stop if you experience sharp pain, dizziness, chest pain, or unusual breathing difficulty. For healthy weight and muscle gain, pair this training with the food program and enough daily calories and protein.</p></div></aside></>}
function ProgressPage({attendance,currentWeek}:{attendance:AttendanceRecord[];currentWeek:string}){const thisWeek=attendance.filter(row=>row.week===currentWeek);return <><section className="guide-intro"><div className="guide-overline">CONSISTENCY & PROGRESSION</div><h1>Your progress</h1><p>Check off each home session after you complete it. Your history stays on this device.</p></section><div className="progress-stats"><article><span>Sessions this week</span><b>{thisWeek.length}<small> / 3</small></b></article><article><span>Total sessions checked in</span><b>{attendance.length}</b></article><article><span>Weekly plan</span><b>3<small> workouts</small></b></article></div><section className="progress-week-card"><header><div><span>THIS WEEK</span><h2>Workout check-ins</h2></div><b>{thisWeek.length}/3</b></header><div className="progress-track"><i style={{width:`${thisWeek.length/3*100}%`}}/></div><div className="attendance-days">{scheduledDays.map(dayId=>{const day=programWeeks[0].days.find(value=>value.id===dayId)!;const done=thisWeek.some(record=>record.dayId===dayId);return <div key={dayId} className={done?'attendance-dot done':'attendance-dot'}><span>{day.name.slice(0,3)}</span>{done?<Check size={14}/>:<i/>}</div>})}</div></section><aside className="plan-note"><Info size={17}/><div><b>Build strength gradually</b><p>Repeat the same plan each week. Add reps with controlled form; once you reach the top of the range easily, increase band tension, slow repetitions, range of motion, variation difficulty, or dumbbell weight.</p></div></aside></>}
