import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocFromServer,
  getDocsFromServer,
  onSnapshot,
  query,
  orderBy,
  limit,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';
import { auth } from './googleAuth';
import { FeedState, IncidentRecord, UploadHistoryRecord } from '../types/console';

const INCIDENTS_COL = 'incidents';
const FEED_COL = 'operationalFeed';
const HISTORY_COL = 'uploadHistory';
const MAX_FEED_DOC_BYTES = 900_000; // Guard safely below Firestore 1MB document limit

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const user = auth.currentUser;
  const errorMsg = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errorMsg,
    authInfo: {
      userId: user?.uid ?? null,
      email: user?.email ?? null,
      emailVerified: user?.emailVerified ?? null,
      isAnonymous: user?.isAnonymous ?? null,
      tenantId: user?.tenantId ?? null,
      providerInfo:
        user?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email
        })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  if (errorMsg.toLowerCase().includes('quota exceeded')) {
    window.dispatchEvent(new CustomEvent('firestore-quota-exceeded'));
  }
  throw new Error(JSON.stringify(errInfo));
}

function mapIncidentDoc(docId: string, data: Record<string, any>): IncidentRecord {
  return {
    id: docId,
    a: data.a,
    t: Number(data.t) || 0,
    e: Number(data.e) || 0,
    d: data.d,
    x: data.x || '',
    author: data.author,
    source: data.source
  };
}

function mapUploadHistoryDoc(docId: string, data: Record<string, any>): UploadHistoryRecord {
  let fileNames: string[] = [];
  let indicatorsUpdated: string[] = [];
  let storedFiles: UploadHistoryRecord['storedFiles'] = [];

  try {
    fileNames =
      typeof data.fileNames === 'string'
        ? JSON.parse(data.fileNames)
        : Array.isArray(data.fileNames)
        ? data.fileNames
        : [];
  } catch {
    fileNames = [];
  }

  try {
    indicatorsUpdated =
      typeof data.indicatorsUpdated === 'string'
        ? JSON.parse(data.indicatorsUpdated)
        : Array.isArray(data.indicatorsUpdated)
        ? data.indicatorsUpdated
        : [];
  } catch {
    indicatorsUpdated = [];
  }

  try {
    storedFiles =
      typeof data.storedFiles === 'string'
        ? JSON.parse(data.storedFiles)
        : Array.isArray(data.storedFiles)
        ? data.storedFiles
        : [];
  } catch {
    storedFiles = [];
  }

  return {
    id: docId,
    timestamp: data.timestamp || '',
    isoDate: data.isoDate || data.createdAt,
    filesCount: Number(data.filesCount) || fileNames.length || 0,
    fileNames,
    indicatorsUpdated,
    summary: data.summary || '',
    storedFiles
  };
}

// Listen to incidents in Firestore in real time (always propagates empty/authoritative list)
export function subscribeToIncidents(
  callback: (incidents: IncidentRecord[], meta: { fromCache: boolean }) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(collection(db, INCIDENTS_COL), orderBy('d', 'desc'), limit(500));
  return onSnapshot(
    q,
    { includeMetadataChanges: false },
    snapshot => {
      const records: IncidentRecord[] = [];
      snapshot.forEach(docSnap => {
        records.push(mapIncidentDoc(docSnap.id, docSnap.data()));
      });
      callback(records, { fromCache: snapshot.metadata.fromCache });
    },
    error => {
      try {
        handleFirestoreError(error, OperationType.LIST, INCIDENTS_COL);
      } catch (wrapped: any) {
        onError?.(wrapped);
      }
    }
  );
}

// Fetch authoritative incidents list directly from Firestore server
export async function fetchIncidentsFromServer(): Promise<IncidentRecord[]> {
  try {
    const q = query(collection(db, INCIDENTS_COL), orderBy('d', 'desc'), limit(500));
    const snapshot = await getDocsFromServer(q);
    const records: IncidentRecord[] = [];
    snapshot.forEach(docSnap => {
      records.push(mapIncidentDoc(docSnap.id, docSnap.data()));
    });
    return records;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, INCIDENTS_COL);
  }
}

// Save single incident to Firestore
export async function saveIncidentToFirestore(incident: IncidentRecord): Promise<void> {
  const path = `${INCIDENTS_COL}/${incident.id}`;
  try {
    const ref = doc(db, INCIDENTS_COL, incident.id);
    await setDoc(
      ref,
      {
        ...incident,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Delete incident from Firestore
export async function deleteIncidentFromFirestore(id: string): Promise<void> {
  const path = `${INCIDENTS_COL}/${id}`;
  try {
    await deleteDoc(doc(db, INCIDENTS_COL, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Batch save multiple incidents (e.g. from Excel or Google Sheets)
export async function saveBatchIncidentsToFirestore(incidents: IncidentRecord[]): Promise<void> {
  if (incidents.length === 0) return;
  try {
    const nowIso = new Date().toISOString();
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
            createdAt: nowIso,
            updatedAt: nowIso
          },
          { merge: true }
        );
      });
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, INCIDENTS_COL);
  }
}

// Save operational feed state (cámaras, supervisión, blindados, novedades, etc.)
export async function saveFeedToFirestore(feed: FeedState): Promise<void> {
  const path = `${FEED_COL}/current`;
  try {
    const serialized = JSON.stringify(feed);
    const byteSize = new TextEncoder().encode(serialized).length;
    if (byteSize > MAX_FEED_DOC_BYTES) {
      throw new Error(
        `El estado consolidado (${Math.round(byteSize / 1024)} KB) excede el límite seguro por documento.`
      );
    }

    const ref = doc(db, FEED_COL, 'current');
    await setDoc(
      ref,
      {
        id: 'current',
        data: serialized,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Fetch operational feed directly from Firestore server
export async function fetchFeedFromServer(): Promise<{
  feed: FeedState | null;
  updatedAt?: string;
}> {
  const path = `${FEED_COL}/current`;
  try {
    const snapshot = await getDocFromServer(doc(db, FEED_COL, 'current'));
    if (!snapshot.exists()) return { feed: null };
    const payload = snapshot.data();
    if (!payload?.data) return { feed: null };
    const parsed: FeedState = JSON.parse(payload.data);
    return { feed: parsed, updatedAt: payload.updatedAt };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

// Listen to operational feed in real time
export function subscribeToFeed(
  callback: (feed: FeedState, meta: { updatedAt?: string; fromCache: boolean }) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `${FEED_COL}/current`;
  const ref = doc(db, FEED_COL, 'current');
  return onSnapshot(
    ref,
    snapshot => {
      if (snapshot.exists()) {
        const payload = snapshot.data();
        if (payload?.data) {
          try {
            const parsed: FeedState = JSON.parse(payload.data);
            callback(parsed, {
              updatedAt: payload.updatedAt,
              fromCache: snapshot.metadata.fromCache
            });
          } catch (e) {
            console.warn('Error parsing feed payload:', e);
          }
        }
      }
    },
    error => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped: any) {
        onError?.(wrapped);
      }
    }
  );
}

// Save upload history record to Firestore
export async function saveUploadHistoryToFirestore(record: UploadHistoryRecord): Promise<void> {
  const path = `${HISTORY_COL}/${record.id}`;
  try {
    const ref = doc(db, HISTORY_COL, record.id);
    await setDoc(ref, {
      id: record.id,
      timestamp: record.timestamp,
      isoDate: record.isoDate || new Date().toISOString(),
      filesCount: record.filesCount,
      fileNames: JSON.stringify(record.fileNames),
      indicatorsUpdated: JSON.stringify(record.indicatorsUpdated),
      summary: record.summary,
      storedFiles: JSON.stringify(record.storedFiles || []),
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Fetch upload history directly from Firestore server
export async function fetchUploadHistoryFromServer(): Promise<UploadHistoryRecord[]> {
  try {
    const q = query(collection(db, HISTORY_COL), orderBy('createdAt', 'desc'), limit(40));
    const snapshot = await getDocsFromServer(q);
    const records: UploadHistoryRecord[] = [];
    snapshot.forEach(docSnap => {
      records.push(mapUploadHistoryDoc(docSnap.id, docSnap.data()));
    });
    return records;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, HISTORY_COL);
  }
}

// Subscribe to upload history records in real time
export function subscribeToUploadHistory(
  callback: (records: UploadHistoryRecord[], meta: { fromCache: boolean }) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(collection(db, HISTORY_COL), orderBy('createdAt', 'desc'), limit(40));
  return onSnapshot(
    q,
    snapshot => {
      const records: UploadHistoryRecord[] = [];
      snapshot.forEach(docSnap => {
        records.push(mapUploadHistoryDoc(docSnap.id, docSnap.data()));
      });
      callback(records, { fromCache: snapshot.metadata.fromCache });
    },
    error => {
      try {
        handleFirestoreError(error, OperationType.LIST, HISTORY_COL);
      } catch (wrapped: any) {
        onError?.(wrapped);
      }
    }
  );
}

// Reset shared Firestore workspace (restores baseline feed & clears custom incidents/history across all devices)
export async function resetFirestoreWorkspace(freshFeed: FeedState): Promise<void> {
  try {
    await saveFeedToFirestore(freshFeed);

    const [incSnap, histSnap] = await Promise.all([
      getDocsFromServer(collection(db, INCIDENTS_COL)),
      getDocsFromServer(collection(db, HISTORY_COL))
    ]);

    const refsToDelete = [...incSnap.docs.map(d => d.ref), ...histSnap.docs.map(d => d.ref)];
    const chunkSize = 200;
    for (let i = 0; i < refsToDelete.length; i += chunkSize) {
      const batch = writeBatch(db);
      refsToDelete.slice(i, i + chunkSize).forEach(r => batch.delete(r));
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, FEED_COL);
  }
}
