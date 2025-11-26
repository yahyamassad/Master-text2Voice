
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { getFirebase } from '../firebaseConfig';
import type { HistoryItem } from '../types';

/**
 * Subscribes to a user's translation history in Firestore and calls a callback with updates.
 */
export function subscribeToHistory(userId: string, callback: (items: HistoryItem[]) => void): () => void {
    const { db } = getFirebase();
    
    if (!db) {
        console.error("Firestore is not initialized. Cannot subscribe to history.");
        return () => {};
    }

    const historyCollectionRef = db.collection('users').doc(userId).collection('history');
    
    const unsubscribe = historyCollectionRef
        .orderBy('timestamp', 'desc')
        .limit(50)
        .onSnapshot((querySnapshot: firebase.firestore.QuerySnapshot) => {
            const historyData: HistoryItem[] = [];
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                historyData.push({
                    ...data,
                    id: docSnap.id,
                    // Safe timestamp conversion
                    timestamp: (data.timestamp as any)?.toMillis ? (data.timestamp as any).toMillis() : Date.now()
                } as HistoryItem);
            });
            callback(historyData);
        }, (error: any) => {
            console.error("Error listening to history:", error);
            callback([]); 
        });

    return unsubscribe;
}

/**
 * Adds a new history item to a user's collection in Firestore.
 */
export async function addHistoryItem(userId: string, item: Omit<HistoryItem, 'id' | 'timestamp'>) {
    const { db } = getFirebase();
    if (!db) throw new Error("Firestore is not initialized.");

    const historyCollectionRef = db.collection('users').doc(userId).collection('history');
    await historyCollectionRef.add({
        ...item,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}

/**
 * Deletes all documents in a user's history subcollection.
 */
export async function clearHistoryForUser(userId: string) {
    const { db } = getFirebase();
    if (!db) throw new Error("Firestore is not initialized.");

    const historyCollectionRef = db.collection('users').doc(userId).collection('history');
    const querySnapshot = await historyCollectionRef.get();

    if (querySnapshot.empty) {
        return;
    }

    const batch = db.batch();
    querySnapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
    });

    await batch.commit();
}

/**
 * Deletes the root document for a user.
 */
export async function deleteUserDocument(userId: string) {
    const { db } = getFirebase();
    if (!db) throw new Error("Firestore is not initialized.");

    const userDocRef = db.collection('users').doc(userId);
    await userDocRef.delete();
}

/**
 * Adds a user to the waitlist collection.
 */
export async function addToWaitlist(userId: string, email: string | null, tier: 'gold' | 'platinum') {
    const { db } = getFirebase();
    if (!db) throw new Error("Firestore is not initialized.");

    // Create a document ID based on user ID to prevent duplicate entries
    const waitlistDocRef = db.collection('waitlist').doc(userId);
    
    await waitlistDocRef.set({
        userId,
        email,
        requestedTier: tier,
        joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'pending' // pending, notified, active
    }, { merge: true }); // Merge to update timestamp if they click again
}
