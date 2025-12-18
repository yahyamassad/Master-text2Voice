
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { getFirebase } from '../firebaseConfig';
import type { HistoryItem } from '../types';

export function subscribeToHistory(userId: string, callback: (items: HistoryItem[]) => void): () => void {
    const { db } = getFirebase();
    if (!db) return () => {};

    return db.collection('users').doc(userId).collection('history')
        .orderBy('timestamp', 'desc')
        .limit(50)
        .onSnapshot((snap) => {
            const data: HistoryItem[] = [];
            snap.forEach(doc => {
                const d = doc.data();
                data.push({
                    ...d,
                    id: doc.id,
                    timestamp: d.timestamp?.toMillis() || Date.now()
                } as HistoryItem);
            });
            callback(data);
        });
}

export async function addHistoryItem(userId: string, item: Partial<HistoryItem>) {
    const { db } = getFirebase();
    if (!db) return;

    // حماية ضد قيم undefined التي تدمر Firebase
    const safeItem = {
        sourceText: item.sourceText || "",
        translatedText: item.translatedText || "[Audio Only]",
        sourceLang: item.sourceLang || "unknown",
        targetLang: item.targetLang || "unknown",
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(userId).collection('history').add(safeItem);
}

export async function deleteHistoryItem(userId: string, historyId: string) {
    const { db } = getFirebase();
    if (!db) return;
    await db.collection('users').doc(userId).collection('history').doc(historyId).delete();
}

export async function clearHistoryForUser(userId: string) {
    const { db } = getFirebase();
    if (!db) return;
    const snap = await db.collection('users').doc(userId).collection('history').get();
    const batch = db.batch();
    snap.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
}

export async function deleteUserDocument(userId: string) {
    const { db } = getFirebase();
    if (!db) return;
    await db.collection('users').doc(userId).delete();
}

export async function addToWaitlist(userId: string, email: string | null, tier: string) {
    const { db } = getFirebase();
    if (!db) return;
    await db.collection('waitlist').doc(userId).set({
        userId, email, tier, timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}
