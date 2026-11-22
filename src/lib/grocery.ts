import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  where,
  writeBatch,
  type QuerySnapshot,
} from 'firebase/firestore';
import { db, requireUid } from './firebase';
import type { GroceryItem } from '../types';

// Grocery items live at users/{uid}/grocery/{itemId}.
const groceryCol = (uid: string) => collection(db, 'users', uid, 'grocery');

const BATCH_LIMIT = 500;

export async function loadGroceryList(): Promise<GroceryItem[]> {
  const uid = requireUid();
  const snap = await getDocs(query(groceryCol(uid), orderBy('addedAt', 'asc')));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      text: data.text,
      recipeId: data.recipeId ?? null,
      recipeTitle: data.recipeTitle ?? null,
      addedAt: data.addedAt,
    };
  });
}

export async function addGroceryItem(
  text: string,
  recipeId: string | null,
  recipeTitle: string | null
): Promise<void> {
  const uid = requireUid();
  await addDoc(groceryCol(uid), {
    text,
    recipeId,
    recipeTitle,
    addedAt: new Date().toISOString(),
  });
}

async function deleteAll(snap: QuerySnapshot): Promise<void> {
  for (let i = 0; i < snap.docs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    for (const d of snap.docs.slice(i, i + BATCH_LIMIT)) batch.delete(d.ref);
    await batch.commit();
  }
}

/** Remove a specific (text, recipeId) pair from the list. */
export async function removeGroceryItem(text: string, recipeId: string | null): Promise<void> {
  const uid = requireUid();
  const snap = await getDocs(
    query(groceryCol(uid), where('text', '==', text), where('recipeId', '==', recipeId))
  );
  await deleteAll(snap);
}

export async function clearGroceryList(): Promise<void> {
  const uid = requireUid();
  await deleteAll(await getDocs(groceryCol(uid)));
}
