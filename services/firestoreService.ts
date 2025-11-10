import { db } from '../firebaseConfig';
// Fix: Use Firebase v8 imports and types to match project dependencies.
// FIX: Use compat libraries for Firebase v9 with v8 syntax.
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
        return () => {}; // Return a no-op unsubscribe function
    }

    // Fix: Use Firebase v8 chained method syntax.
    const historyCollectionRef = db.collection(`users/${userId}/history`);
    const q = historyCollectionRef.orderBy('timestamp', 'desc').limit(50);

    const unsubscribe = q.onSnapshot((querySnapshot) => {
        const historyData: HistoryItem[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            historyData.push({
                ...data,
                id: doc.id,
                // Fix: Use namespaced Timestamp type from v8 SDK.
                timestamp: (data.timestamp as firebase.firestore.Timestamp)?.toMillis() || Date.now()
            } as HistoryItem);
        });
        callback(historyData);
    }, (error) => {
        console.error("Error listening to history:", error);
        callback([]); // On error, return an empty array
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

    // Fix: Use Firebase v8 collection.add() method and FieldValue.serverTimestamp().
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

    // Fix: Use Firebase v8 collection.get() method.
    const historyCollectionRef = db.collection(`users/${userId}/history`);
    const querySnapshot = await historyCollectionRef.get();

    if (querySnapshot.empty) {
        return; // Nothing to delete
    }

    // Firestore allows batch writes of up to 500 operations.
    // This will handle up to 500 history items at a time.
    // Fix: Use Firebase v8 db.batch() method.
    const batch = db.batch();
    querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
    });

    await batch.commit();
}

/**
 * Deletes the root document for a user.
 * IMPORTANT: This does NOT delete subcollections. Subcollections must be cleared first.
 * @param userId The UID of the user.
 */
export async function deleteUserDocument(userId: string) {
    if (!db) throw new Error("Firestore is not initialized.");

    // Fix: Use Firebase v8 doc().delete() method.
    const userDocRef = db.collection('users').doc(userId);
    await userDocRef.delete();
}
