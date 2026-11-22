// Recipe shape used throughout the UI; Firestore documents store the same
// fields (minus id, which is the document ID).
export interface Recipe {
  id: string;
  title: string;
  description?: string | null;
  servings?: number | null;
  prepTime?: string | null;
  cookTime?: string | null;
  tags: string[];
  ingredients: string[];
  instructions?: string | null;
  notes?: string | null;
  sourceUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Input shape for create/update — id and timestamps are server-managed.
export type RecipeInput = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>;

export interface GroceryItem {
  id: string;
  text: string;
  recipeId: string | null;
  recipeTitle: string | null;
  addedAt?: string;
}
