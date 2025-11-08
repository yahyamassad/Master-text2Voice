import { getFirebase } from '../firebaseConfig';
import {
    collection,
    query,
    orderBy,
    getDocs,
    addDoc,
    writeBatch,
    doc,
    deleteDoc,
    serverTimestamp,
    onSnapshot,
    limit,
    Timestamp,
} from 'firebase/firestore';
import type { HistoryItem } from '../types';

/**
 * Subscribes to a user's translation history in Firestore and calls a callback with updates.
 * @param userId The UID of the user.
 * @param callback The function to call with the array of history items.
 * @returns An unsubscribe function to detach the listener.
 */
export function subscribeToHistory(userId: string, callback: (items: HistoryItem[]) => void): () => void {
    const { db } = getFirebase();
    if (!db) {
        console.error("Firestore is not initialized. Cannot subscribe to history.");
        return () => {}; // Return a no-op unsubscribe function
    }

    const historyCollectionRef = collection(db, `users/${userId}/history`);
    const q = query(historyCollectionRef, orderBy('timestamp', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const historyData: HistoryItem[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            historyData.push({
                ...data,
                id: doc.id,
                timestamp: (data.timestamp as Timestamp)?.toMillis() || Date.now()
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
    const { db } = getFirebase();
    if (!db) throw new Error("Firestore is not initialized.");

    const historyCollectionRef = collection(db, `users/${userId}/history`);
    await addDoc(historyCollectionRef, {
        ...item,
        timestamp: serverTimestamp()
    });
}

/**
 * Deletes all documents in a user's history subcollection.
 * @param userId The UID of the user whose history should be cleared.
 */
export async function clearHistoryForUser(userId: string) {
    const { db } = getFirebase();
    if (!db) throw new Error("Firestore is not initialized.");

    const historyCollectionRef = collection(db, `users/${userId}/history`);
    const querySnapshot = await getDocs(historyCollectionRef);

    if (querySnapshot.empty) {
        return; // Nothing to delete
    }

    // Firestore allows batch writes of up to 500 operations.
    // This will handle up to 500 history items at a time.
    const batch = writeBatch(db);
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
    const { db } = getFirebase();
    if (!db) throw new Error("Firestore is not initialized.");

    const userDocRef = doc(db, 'users', userId);
    await deleteDoc(userDocRef);
}