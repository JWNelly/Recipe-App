# 📦 Recipe Box

A personal recipe manager that runs in your browser, with data synced across your laptop and phone via Firebase. Multi-user — each account has its own private recipe collection.

**Live URL**: `https://jwnelly.github.io/Recipe-App/`

---

## Architecture

- **Frontend**: TypeScript + Vite, vanilla DOM (no framework)
- **Backend**: Firebase (Firestore database + email/password Authentication), free Spark plan — never pauses for inactivity
- **Hosting**: GitHub Pages (static), deployed via GitHub Actions on every push to `main`
- **Data sync**: Phone and laptop both talk to the same Firestore database, so checking off a grocery item on your laptop appears on your phone after a refresh

Data layout in Firestore:

```
users/{uid}/recipes/{recipeId}
users/{uid}/grocery/{itemId}
```

Security rules (`firestore.rules`) let each signed-in user read and write only their own `users/{uid}` subtree.

---

## One-time Setup

### 1. Create the Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Create a project**. Google Analytics is not needed.
2. **Build → Authentication → Get started → Sign-in method** → enable **Email/Password**.
3. **Build → Firestore Database → Create database**. Pick a location near you and start in **production mode**.
4. In Firestore, open the **Rules** tab, replace the contents with `firestore.rules` from this repo, and click **Publish**.
5. **Project settings (⚙️) → General → Your apps** → click the web icon `</>` to register a web app (no Hosting needed). Copy the `apiKey`, `authDomain`, `projectId`, and `appId` values from the config it shows.

### 2. Configure local development

```bash
cp .env.example .env
```

Open `.env` and paste in the four Firebase values.

> These values are **safe to expose** — Firebase web config is public by design; the security rules are what protect the data. `.env` is gitignored anyway as a habit.

### 3. Install dependencies

```bash
npm install
```

### 4. Configure GitHub Pages deployment

In your GitHub repo:

1. **Settings → Pages → Source: GitHub Actions**
2. **Settings → Secrets and variables → Actions → New repository secret** — add each of:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`
3. Push to `main`. The workflow `.github/workflows/deploy.yml` will build and deploy automatically.

---

## Daily Use

### Run locally

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173). Sign up the first time, then sign in normally.

### Deploy

Just push to `main`. GitHub Actions builds and publishes within ~30 seconds.

```bash
git add .
git commit -m "your changes"
git push
```

---

## Moving Recipes Between Backends

Use **Export** in the header to download `recipes.json`, then **Import** (mode: **Merge**) on the new setup. This works for recipes from the old Supabase version or the original Python-server version. The grocery list is not included in exports.

---

## Features

### Recipes
- Add, edit, delete with title, description, servings, prep/cook times, tags, ingredients, instructions, notes, and an optional source URL
- Search by title, description, or ingredients
- Export as JSON, import from JSON

### Tag filtering
- Click **Tags ▾** in the header for the multi-select filter
- Per tag: **✓** to require it, **✕** to exclude it, both off to ignore it
- Stack multiple filters; they apply when the dropdown closes

### Sub-recipes
Add `@Recipe Name` on its own line in the ingredients to link another recipe (e.g., "Eggs Benedict" linking to your "Hollandaise Sauce" recipe). Click the resulting button to navigate; **← Back** in the header returns to the parent.

### Grocery list (synced!)
- Check off ingredients in any recipe → they appear in your master grocery list
- **+ Add all** / **− Remove all** for the whole recipe at once
- The 🛒 **Grocery List** button shows your full list, grouped by recipe
- Open the deployed URL on your phone (signed in as the same account) → list is there

### iPhone QR code
Still available in the Grocery List → QR Code tab. Useful when you want to print the list or you're without internet at the store.

---

## Project Structure

```
recipe-app/
├── index.html                      # Vite entry shell
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example                    # template — copy to .env locally
├── firestore.rules                 # paste into Firestore → Rules
├── src/
│   ├── main.ts                     # entry: auth bootstrap + all UI logic
│   ├── styles.css                  # all styling
│   ├── types.ts                    # Recipe, GroceryItem types
│   ├── vite-env.d.ts               # Vite env var types
│   └── lib/
│       ├── firebase.ts             # Firebase app, auth, and Firestore singletons
│       ├── auth.ts                 # signUp / signIn / signOut / onAuthChange
│       ├── recipes.ts              # recipes CRUD + import
│       └── grocery.ts              # grocery list CRUD
├── .github/workflows/
│   └── deploy.yml                  # GitHub Actions: build + deploy to Pages
└── README.md
```

---

## Troubleshooting

**"Missing Firebase config" error on load**
The `.env` values (locally) or the GitHub secrets (in production) are missing.

**"Missing or insufficient permissions" when loading recipes**
The Firestore rules weren't published. Paste `firestore.rules` into Firestore → Rules and click **Publish**.

**Recipes don't appear after sign-up**
Each user has their own collection — a brand-new account starts empty. Use Import to bring in a `recipes.json`.

**GitHub Pages shows the README instead of the app**
Make sure **Settings → Pages → Source** is set to **GitHub Actions** (not "Deploy from a branch").
