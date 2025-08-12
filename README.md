## DataGreg

**Available here:** [https://datagreg.rnouille.space/](https://datagreg.rnouille.space/)

Edit and manage fine-tuning datasets for AI/LLMs directly in your browser. Data is stored locally in a folder you choose via the File System Access API. Import/export JSONL for Gemini and OpenAI Chat, maintain multiple datasets, and keep automatic/manual backups — no server required.

### Features
- **Local-first storage**: Uses the browser File System Access API; your data stays in the folder you select.
- **Multi-dataset management**: Create, rename, delete datasets.
- **CRUD for training pairs**: Add, edit, delete input/output pairs with timestamps.
- **Import**: JSONL for **Gemini** and **OpenAI Chat**.
- **Export**: JSONL for **Gemini** and **OpenAI Chat**.
- **Backups**: Manual and auto-backups written to your chosen folder.
- **Folder persistence**: Optionally remember the folder permission for next time.

### Requirements
- **Node.js**: 18.18+ (20+ recommended)
- **Package manager**: npm (repo includes `package-lock.json`)
- **Browser (runtime)**:
  - Chrome/Chromium or Microsoft Edge (required for File System Access API)
  - Firefox and Safari are not supported for local folder access

### Quick start

```powershell
# Install dependencies
npm ci

# Start the dev server (Turbopack)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Then open `http://localhost:3000`.

### Using the app
1. **Select data folder**: On first load, choose a local folder. Optionally check “Remember this folder” to persist permission.
2. **Create datasets**: From the home page, create one or more datasets.
3. **Add training pairs**: For each dataset, add input/output pairs. You can edit or delete later.
4. **Import JSONL**: On a dataset page, paste JSONL content and choose format (Gemini or OpenAI Chat) to import.
5. **Export JSONL**: Choose a format and export; a `.jsonl` file will download.
6. **Backups**: Use Backup Management to manually create or restore backups. Auto-backup periodically writes a backup file if changes have settled.

### Data files in your folder
- **Primary database**: `DataGreg.json`
- **Backups**: `backup-YYYYMMDD-HHMMSS.json` (and potentially `db-YYYYMMDD-HHMMSS.json` if present)

Backups are simple JSON snapshots of the full database. The primary file uses a v2 schema supporting multiple datasets.

### Import/Export formats

- **Gemini JSONL** (one JSON object per line):

```jsonl
{"contents":[{"role":"user","parts":[{"text":"INPUT"}]},{"role":"model","parts":[{"text":"OUTPUT"}]}]}
```

- **OpenAI Chat JSONL** (one JSON object per line):

```jsonl
{"messages":[{"role":"user","content":"INPUT"},{"role":"assistant","content":"OUTPUT"}]}
```

Lines with invalid JSON are skipped during import. Empty inputs/outputs are ignored.

### Scripts
- **dev**: `next dev --turbopack`
- **build**: `next build`
- **start**: `next start`
- **lint**: `next lint`

### Tech stack
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**

### Project structure (key parts)
- `src/app/page.tsx`: Home page (folder selection, datasets grid)
- `src/app/dataset/[id]/page.tsx`: Dataset editor (pairs, import/export, backups)
- `src/lib/clientDb.ts`: Local database logic (File System Access API, backups, import/export)
- `src/lib/exporters.ts`: JSONL exporters
- `src/components/*`: UI components (dataset cards, forms, items, import section)

### Browser support notes
- The File System Access API is available in Chromium-based browsers. If unsupported, the app will show a helpful message.
- If you previously “remembered” a folder and later revoke permission, use “Change Data Folder” on the home page to re-authorize.

### Troubleshooting
- **“Browser not supported”**: Switch to Chrome/Edge (or another Chromium-based browser).
- **“No directory selected” or permission issues**: Click “Change Data Folder” and reselect the folder; ensure read/write permission is granted.
- **Backups can’t be deleted**: Some browser versions don’t expose deletion for local files via API; the app will warn you. Delete the backup file directly from your file system if needed.

### License
This repository is under MIT license.

