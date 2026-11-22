import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db, requireUid } from './firebase';
import type { Recipe, RecipeInput } from '../types';

// Recipes live at users/{uid}/recipes/{recipeId}; security rules restrict
// each user to their own subtree (see firestore.rules).
const recipesCol = (uid: string) => collection(db, 'users', uid, 'recipes');

// Firestore batches are capped at 500 writes.
const BATCH_LIMIT = 500;

function docToRecipe(snap: QueryDocumentSnapshot<DocumentData>): Recipe {
  const d = snap.data();
  return {
    id: snap.id,
    title: d.title,
    description: d.description ?? null,
    servings: d.servings ?? null,
    prepTime: d.prepTime ?? null,
    cookTime: d.cookTime ?? null,
    tags: d.tags ?? [],
    ingredients: d.ingredients ?? [],
    instructions: d.instructions ?? null,
    notes: d.notes ?? null,
    sourceUrl: d.sourceUrl ?? null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

/** Normalizes input so no field is undefined (Firestore rejects undefined). */
function toFields(r: RecipeInput) {
  return {
    title: r.title,
    description: r.description ?? null,
    servings: r.servings ?? null,
    prepTime: r.prepTime ?? null,
    cookTime: r.cookTime ?? null,
    tags: r.tags ?? [],
    ingredients: r.ingredients ?? [],
    instructions: r.instructions ?? null,
    notes: r.notes ?? null,
    sourceUrl: r.sourceUrl ?? null,
  };
}

/** Load all recipes for the current user. Optional client-side text search. */
export async function loadRecipes(search?: string): Promise<Recipe[]> {
  const uid = requireUid();
  const snap = await getDocs(query(recipesCol(uid), orderBy('createdAt', 'desc')));
  let recipes = snap.docs.map(docToRecipe);
  if (search) {
    const q = search.toLowerCase();
    recipes = recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q) ||
        r.ingredients.some((i) => i.toLowerCase().includes(q))
    );
  }
  return recipes;
}

export async function createRecipe(input: RecipeInput): Promise<void> {
  const uid = requireUid();
  const now = new Date().toISOString();
  await addDoc(recipesCol(uid), { ...toFields(input), createdAt: now, updatedAt: now });
}

export async function updateRecipe(id: string, input: RecipeInput): Promise<void> {
  const uid = requireUid();
  await updateDoc(doc(recipesCol(uid), id), {
    ...toFields(input),
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteRecipe(id: string): Promise<void> {
  const uid = requireUid();
  await deleteDoc(doc(recipesCol(uid), id));
}

/** Bulk-import recipes (used by the Import UI). Returns { imported, skipped }. */
export async function importRecipes(
  recipes: unknown[],
  mode: 'merge' | 'replace'
): Promise<{ imported: number; skipped: number }> {
  const uid = requireUid();
  const col = recipesCol(uid);
  const existing = await getDocs(col);

  // Every write goes into a queue that is flushed in batches of BATCH_LIMIT.
  const ops: ((b: ReturnType<typeof writeBatch>) => void)[] = [];

  let existingTitles = new Set<string>();
  if (mode === 'replace') {
    for (const d of existing.docs) ops.push((b) => b.delete(d.ref));
  } else {
    existingTitles = new Set(existing.docs.map((d) => String(d.data().title).toLowerCase()));
  }

  let imported = 0;
  let skipped = 0;
  // Give each recipe a distinct timestamp so the original order survives
  // the createdAt sort (the export file is newest-first).
  const base = Date.now();

  for (const item of recipes) {
    if (!item || typeof item !== 'object') {
      skipped++;
      continue;
    }
    const r = item as Partial<Recipe> & { title?: string };
    if (!r.title) {
      skipped++;
      continue;
    }
    if (mode === 'merge' && existingTitles.has(r.title.toLowerCase())) {
      skipped++;
      continue;
    }
    existingTitles.add(r.title.toLowerCase());
    const createdAt = r.createdAt ?? new Date(base - imported).toISOString();
    const fields = {
      ...toFields({
        title: r.title,
        description: r.description,
        servings: r.servings,
        prepTime: r.prepTime,
        cookTime: r.cookTime,
        tags: r.tags ?? [],
        ingredients: r.ingredients ?? [],
        instructions: r.instructions,
        notes: r.notes,
        sourceUrl: r.sourceUrl,
      }),
      createdAt,
      updatedAt: r.updatedAt ?? createdAt,
    };
    ops.push((b) => b.set(doc(col), fields));
    imported++;
  }

  for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    for (const op of ops.slice(i, i + BATCH_LIMIT)) op(batch);
    await batch.commit();
  }

  return { imported, skipped };
}

/** Derive the unique sorted list of tags from a recipe set. */
export function getAllTags(recipes: Recipe[]): string[] {
  const set = new Set<string>();
  for (const r of recipes) for (const t of r.tags) set.add(t);
  return Array.from(set).sort();
}
