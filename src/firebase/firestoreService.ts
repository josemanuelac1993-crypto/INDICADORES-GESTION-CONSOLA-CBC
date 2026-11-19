import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';
import { FeedState, IncidentRecord, UploadHistoryRecord } from '../types/console';

const INCIDENTS_COL = 'incidents';
const FEED_COL = 'operationalFeed';
const HISTORY_COL = 'uploadHistory';

// Listen to incidents in Firestore in real time
export function subscribeToIncidents(callback: (incidents: IncidentRecord[]) => void): () => void {
  try {
    const q = query(collection(db, INCIDENTS_COL), orderBy('d', 'desc'), limit(300));
    return onSnapshot(
      q,
      snapshot => {
        const records: IncidentRecord[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          records.push({
            id: docSnap.id,
            a: data.a,
            t: data.t,
            e: data.e,
            d: data.d,
            x: data.x,
            author: data.author,
            source: data.source
          });
        });
        if (records.length > 0) {
          callback(records);
        }
      },
      error => {
        console.warn('Firestore subscription notice (using local cache):', error.message);
      }
    );
  } catch (err) {
    console.warn('Firestore subscribe error:', err);
    return () => {};
  }
}

// Save single incident to Firestore
export async function saveIncidentToFirestore(incident: IncidentRecord): Promise<void> {
  try {
    const ref = doc(db, INCIDENTS_COL, incident.id);
    await setDoc(
      ref,
      {
        ...incident,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Error saving incident to Firestore:', err);
  }
}

// Delete incident from Firestore
export async function deleteIncidentFromFirestore(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, INCIDENTS_COL, id));
  } catch (err) {
    console.warn('Error deleting incident from Firestore:', err);
  }
}

// Batch save multiple incidents (e.g. from Excel or Google Sheets)
export async function saveBatchIncidentsToFirestore(incidents: IncidentRecord[]): Promise<void> {
  if (incidents.length === 0) return;
  try {
    // Process in batches of 200 (Firestore max is 500)
    const chunkSize = 200;
    for (let i = 0; i < incidents.length; i += chunkSize) {
      const chunk = incidents.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach(inc => {
        const ref = doc(db, INCIDENTS_COL, inc.id);
        batch.set(
          ref,
          {
            ...inc,
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      });
      await batch.commit();
    }
  } catch (err) {
    console.warn('Error batch saving to Firestore:', err);
  }
}

// Save operational feed state (cámaras, supervisión, blindados, etc.)
export async function saveFeedToFirestore(feed: FeedState): Promise<void> {
  try {
    const ref = doc(db, FEED_COL, 'current');
    await setDoc(
      ref,
      {
        id: 'current',
        data: JSON.stringify(feed),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Error saving feed to Firestore:', err);
  }
}

// Listen to operational feed in real time
export function subscribeToFeed(callback: (feed: FeedState) => void): () => void {
  try {
    const ref = doc(db, FEED_COL, 'current');
    return onSnapshot(
      ref,
      snapshot => {
        if (snapshot.exists()) {
          const payload = snapshot.data();
          if (payload?.data) {
            try {
              const parsed: FeedState = JSON.parse(payload.data);
              callback(parsed);
            } catch (e) {
              console.warn('Error parsing feed payload:', e);
            }
          }
        }
      },
      error => {
        console.warn('Feed subscription notice:', error.message);
      }
    );
  } catch (err) {
    console.warn('Error subscribing to feed:', err);
    return () => {};
  }
}

// Save upload history record to Firestore
export async function saveUploadHistoryToFirestore(record: UploadHistoryRecord): Promise<void> {
  try {
    const ref = doc(db, HISTORY_COL, record.id);
    await setDoc(ref, {
      id: record.id,
      timestamp: record.timestamp,
      filesCount: record.filesCount,
      fileNames: JSON.stringify(record.fileNames),
      indicatorsUpdated: JSON.stringify(record.indicatorsUpdated),
      summary: record.summary,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Error saving upload history to Firestore:', err);
  }
}
