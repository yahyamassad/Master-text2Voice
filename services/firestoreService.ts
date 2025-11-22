
import { db } from '../firebaseConfig';
// Use compat imports to match the initialized app in firebaseConfig.ts
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import type { HistoryItem } from '../types';

/**
 * Subscribes to a user's translation history in Firestore and calls a callback with updates.
 * @param userId The UID of the user.
 * @param callback The function to call with the array of history items.
 * @returns An unsubscribe function to detach the listener.
 */
export function subscribeToHistory(userId: string, callback: (items: HistoryItem[]) => void): () => void {
    if (!db) {
        console.error("Firestore is not initialized. Cannot subscribe to history.");
        return () => {};
    }

    // Use Compat syntax: db.collection(...)
    const historyCollectionRef = db.collection(`users/${userId}/history`);
    const q = historyCollectionRef.orderBy('timestamp', 'desc').limit(50);

    const unsubscribe = q.onSnapshot((querySnapshot) => {
        const historyData: HistoryItem[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            historyData.push({
                ...data,
                id: doc.id,
                // Use Compat Timestamp
                timestamp: (data.timestamp as firebase.firestore.Timestamp)?.toMillis() || Date.now()
            } as HistoryItem);
        });
        callback(historyData);
    }, (error) => {
        console.error("Error listening to history:", error);
        callback([]); 
    });

    return unsubscribe;
}

/**
 * Adds a new history item to a user's collection in Firestore.
 * @param userId The UID of the user.
 * @param item The history item to add (without id and timestamp).
 */
export async function addHistoryItem(userId: string, item: Omit<HistoryItem, 'id' | 'timestamp'>) {
    if (!db) throw new Error("Firestore is not initialized.");

    // Use Compat syntax: collection.add() and FieldValue
    const historyCollectionRef = db.collection(`users/${userId}/history`);
    await historyCollectionRef.add({
        ...item,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}

/**
 * Deletes all documents in a user's history subcollection.
 * @param userId The UID of the user whose history should be cleared.
 */
export async function clearHistoryForUser(userId: string) {
    if (!db) throw new Error("Firestore is not initialized.");

    const historyCollectionRef = db.collection(`users/${userId}/history`);
    const querySnapshot = await historyCollectionRef.get();

    if (querySnapshot.empty) {
        return;
    }

    const batch = db.batch();
    querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
    });

    await batch.commit();
}

/**
 * Deletes the root document for a user.
 * @param userId The UID of the user.
 */
export async function deleteUserDocument(userId: string) {
    if (!db) throw new Error("Firestore is not initialized.");

    const userDocRef = db.collection('users').doc(userId);
    await userDocRef.delete();
}
