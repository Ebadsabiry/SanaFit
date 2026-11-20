import Dexie, { type Table } from 'dexie';
import { days, nextSaturday } from './program';
export type SetEntry={id:string;index:number;load?:number;reps?:number;seconds?:number;rir?:number;left?:number;right?:number;leftReps?:number;rightReps?:number;note?:string;warmup?:boolean;skipped?:boolean;done?:boolean};
export type Session={id:string;profileId:string;dayId:string;scheduledDay:string;date:string;startedAt:string;endedAt?:string;status:'active'|'paused'|'complete'|'partial';pausedAt?:string;elapsedBeforePause?:number;revision?:number;ownerTabId?:string;variant:Record<string,string>;techniqueConfirmed?:Record<string,boolean>;prescribedSets?:Record<string,number>;sets:Record<string,SetEntry[]>;updatedAt:string;timer?:{deadline?:number;pausedRemaining?:number;running:boolean}};
export type Profile={id:string;name:string;createdAt:string;startDate:string;startConfirmed?:boolean;timeZone:string;theme:'dark'|'light';increment:number;lighterWeek:boolean;sound:boolean;vibration:boolean};
export type BodyEntry={id:string;profileId:string;date:string;kg:number;note?:string};
export type RecoveryEntry={id:string;profileId:string;date:string;sleep?:number;soreness?:number;note?:string};
class TrainingDB extends Dexie {
 profiles!:Table<Profile,string>; sessions!:Table<Session,string>; body!:Table<BodyEntry,string>; recovery!:Table<RecoveryEntry,string>; locks!:Table<{profileId:string;sessionId:string;updatedAt:string},string>;
 constructor(){super('ebad-training');this.version(1).stores({profiles:'id',sessions:'id,profileId,status,date,[profileId+status]',body:'id,profileId,date',recovery:'id,profileId,date',locks:'profileId'});}
}
export const db=new TrainingDB();
export const uid=()=>crypto.randomUUID();
export function timerSecondsRemaining(timer:Session['timer']|undefined,now=Date.now(),fallback=0){return timer?.running&&timer.deadline?Math.max(0,Math.ceil((timer.deadline-now)/1000)):timer?.pausedRemaining??fallback;}
export async function ensureProfile():Promise<Profile>{const all=await db.profiles.toArray();const selected=typeof localStorage!=='undefined'?localStorage.getItem('ebad-active-profile'):null;let p=all.find(x=>x.id===selected)??all[0];if(p){if(selected!==p.id&&typeof localStorage!=='undefined')localStorage.setItem('ebad-active-profile',p.id);return p;}let now=new Date();p={id:uid(),name:'Athlete',createdAt:now.toISOString(),startDate:nextSaturday(now,'Asia/Kabul'),startConfirmed:false,timeZone:'Asia/Kabul',theme:'dark',increment:2.5,lighterWeek:false,sound:false,vibration:false};await db.profiles.add(p);if(typeof localStorage!=='undefined')localStorage.setItem('ebad-active-profile',p.id);return p;}
export async function createProfile(name:string,from:Profile):Promise<Profile>{const p:Profile={...from,id:uid(),name:name.trim().slice(0,40)||'Athlete',createdAt:new Date().toISOString(),startDate:nextSaturday(new Date(),from.timeZone),startConfirmed:false,lighterWeek:false};await db.profiles.add(p);return p;}
export async function saveSession(s:Session,ownerTabId:string){await db.transaction('rw',db.sessions,db.locks,async()=>{const stored=await db.sessions.get(s.id);if(stored&&(stored.status==='active'||stored.status==='paused')&&stored.ownerTabId&&stored.ownerTabId!==ownerTabId)throw Error('This workout is open in another tab. Close it there before editing this copy.');s.revision=(stored?.revision??0)+1;s.ownerTabId=s.status==='active'||s.status==='paused'?ownerTabId:undefined;s.updatedAt=new Date().toISOString();await db.sessions.put(s);if(s.status==='active'||s.status==='paused')await db.locks.put({profileId:s.profileId,sessionId:s.id,updatedAt:s.updatedAt});else {const lock=await db.locks.get(s.profileId);if(lock?.sessionId===s.id)await db.locks.delete(s.profileId);}});}
export async function createSession(profile:Profile,dayId:string,ownerTabId:string){const lock=await db.locks.get(profile.id);if(lock){const existing=await db.sessions.get(lock.sessionId);if(existing&&(existing.status==='active'||existing.status==='paused'))return existing;}
const now=new Date();const session:Session={id:uid(),profileId:profile.id,dayId,scheduledDay:dayId,date:new Intl.DateTimeFormat('en-CA',{timeZone:profile.timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now),startedAt:now.toISOString(),status:'active',ownerTabId,variant:{},sets:{},updatedAt:now.toISOString()};
for(const ex of days.find(d=>d.id===dayId)?.exercises??[]){const count=profile.lighterWeek?Math.max(1,ex.sets===3?2:1):ex.sets;session.prescribedSets={...session.prescribedSets,[ex.id]:count};session.sets[ex.id]=Array.from({length:count},(_,i)=>({id:uid(),index:i+1}));}await saveSession(session,ownerTabId);return session;}
export function onStorageError(error:unknown){const e=error as DOMException;if(e?.name==='QuotaExceededError')return 'Device storage is full. Export a backup, free space, then try again.';return `Could not save workout data (${e?.message??'storage unavailable'}). Keep this page open and export your data if possible.`;}
export type Backup={schemaVersion:1;exportedAt:string;profile:Profile;sessions:Session[];body:BodyEntry[];recovery:RecoveryEntry[]};
export async function exportProfile(profile:Profile):Promise<Backup>{return {schemaVersion:1,exportedAt:new Date().toISOString(),profile,sessions:await db.sessions.where('profileId').equals(profile.id).toArray(),body:await db.body.where('profileId').equals(profile.id).toArray(),recovery:await db.recovery.where('profileId').equals(profile.id).toArray()};}
export function validateBackup(value:unknown):Backup {
 if(!value||typeof value!=='object')throw Error('This file is not a valid Ebad Training backup.');
 const b=value as Backup;
 if(b.schemaVersion!==1)throw Error('Unsupported backup version. Existing data was not changed.');
 if(!b.profile||typeof b.profile.id!=='string'||typeof b.profile.name!=='string'||b.profile.name.length>40||!Array.isArray(b.sessions)||!Array.isArray(b.body)||!Array.isArray(b.recovery))throw Error('Backup is missing required data.');
 if(JSON.stringify(b).length>15_000_000)throw Error('Backup is larger than 15 MB.');
 try{new Intl.DateTimeFormat('en',{timeZone:b.profile.timeZone})}catch{throw Error('Backup contains an unsupported timezone.')}
 if(!/^\d{4}-\d{2}-\d{2}$/.test(b.profile.startDate))throw Error('Backup contains an invalid block start date.');
 for(const session of b.sessions){
  const day=days.find(item=>item.id===session.dayId);
  if(!session.id||session.profileId!==b.profile.id||!day||!['active','paused','complete','partial'].includes(session.status)||!Number.isFinite(Date.parse(session.startedAt))||!Number.isFinite(Date.parse(session.date+'T12:00:00'))||!session.sets||typeof session.sets!=='object')throw Error('Backup contains an invalid workout record.');
  const allowed=new Set(day.exercises.map(item=>item.id));
  for(const [exerciseId,rows] of Object.entries(session.sets)){
   if(!allowed.has(exerciseId)||!Array.isArray(rows)||rows.length>30)throw Error('Backup contains an invalid exercise reference.');
   for(const row of rows){
    const numeric=(value:number|undefined,min:number,max:number)=>value===undefined||Number.isFinite(value)&&value>=min&&value<=max;
    if(!row.id||!Number.isInteger(row.index)||row.index<1||!numeric(row.load,0,1500)||!numeric(row.reps,0,1000)||!numeric(row.leftReps,0,1000)||!numeric(row.rightReps,0,1000)||!numeric(row.seconds,0,3600)||!numeric(row.left,0,3600)||!numeric(row.right,0,3600)||!numeric(row.rir,0,10)||row.note!==undefined&&(typeof row.note!=='string'||row.note.length>500))throw Error('Backup contains an invalid set value.');
   }
  }
 }
 for(const entry of b.body)if(!entry.id||entry.profileId!==b.profile.id||!Number.isFinite(Date.parse(entry.date))||!Number.isFinite(entry.kg)||entry.kg<20||entry.kg>500)throw Error('Backup contains an invalid body-weight entry.');
 for(const entry of b.recovery)if(!entry.id||entry.profileId!==b.profile.id||!Number.isFinite(Date.parse(entry.date))||(entry.sleep!==undefined&&(!Number.isFinite(entry.sleep)||entry.sleep<0||entry.sleep>24))||(entry.soreness!==undefined&&(!Number.isInteger(entry.soreness)||entry.soreness<0||entry.soreness>10))||(entry.note!==undefined&&(typeof entry.note!=='string'||entry.note.length>500)))throw Error('Backup contains an invalid recovery entry.');
 return b;
}export async function importProfile(b:Backup,mode:'merge'|'replace',target:Profile){await db.transaction('rw',db.profiles,db.sessions,db.body,db.recovery,db.locks,async()=>{if(mode==='replace'){await db.sessions.where('profileId').equals(target.id).delete();await db.body.where('profileId').equals(target.id).delete();await db.recovery.where('profileId').equals(target.id).delete();await db.locks.delete(target.id);}
const profile={...b.profile,id:target.id};await db.profiles.put(profile);for(const s of b.sessions)await db.sessions.put({...s,profileId:target.id});for(const x of b.body)await db.body.put({...x,profileId:target.id});for(const x of b.recovery)await db.recovery.put({...x,profileId:target.id});});}
