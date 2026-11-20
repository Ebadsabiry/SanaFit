import Dexie, { type Table } from 'dexie';
import { weekStartKey } from './program';

export type AttendanceRecord = { id: string; week: string | 1 | 2 | 3 | 4; dayId: string; checkedAt: string };
class AttendanceDatabase extends Dexie {
  entries!: Table<AttendanceRecord, string>;
  constructor() {
    super('sanafit-home-workout-attendance');
    this.version(1).stores({ entries: 'id,week,dayId,checkedAt,[week+dayId]' });
    this.version(2).stores({ entries: 'id,week,dayId,checkedAt,[week+dayId]' }).upgrade(async transaction => {
      const table = transaction.table('entries');
      const records = await table.toArray();
      for (const record of records) {
        if (typeof record.week === 'number') {
          const oldId = record.id;
          record.week = weekStartKey(new Date(record.checkedAt));
          record.id = attendanceId(record.week, record.dayId);
          await table.put(record);
          if (oldId !== record.id) await table.delete(oldId);
        }
      }
    });
  }
}
export const attendanceDb = new AttendanceDatabase();
export const attendanceId = (week:string|number,dayId:string) => `${week}-${dayId}`;
export async function requestPersistentAttendanceStorage(){
  try { return await navigator.storage?.persist?.() ?? false; }
  catch { return false; }
}
