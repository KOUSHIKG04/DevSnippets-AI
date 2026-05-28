# DevSnippets AI

DevSnippets AI is an Expo + React Native + TypeScript mobile app for saving, organizing, exporting, and reviewing reusable code snippets on-device. The app is built with an offline-first core: snippet CRUD, search, favorites, exports, and attachments use local storage.

## Tech Stack

- Expo SDK 55
- React Native
- TypeScript
- Expo Router
- SQLite via `expo-sqlite`
- AsyncStorage
- SecureStore
- Expo FileSystem
- Expo Sharing
- Expo Image Picker

## Current Feature Status

### Implemented

- Create, edit, delete, search, and view snippets
- Mark snippets as favorites
- Store snippets locally in SQLite
- Store theme, default language, and editor font-size preferences in AsyncStorage
- Store AI API key in SecureStore
- Dark/light theme switching
- Reusable snippet card and empty-state components
- Custom in-app alert component
- Syntax-colored code display
- Default language dropdown in Settings and New Snippet
- Code font-size slider in Settings
- Save snippet exports locally as `.txt`, `.js`, and `.json`
- Share snippet exports through native share sheet
- Browse exported files in Files tab
- Delete exported files
- Attach screenshots/images to snippets
- Persist attachment metadata in SQLite
- Store attachment files with Expo FileSystem
- Delete snippet attachments

### Partially Implemented

- File management helpers exist for copy/move/delete, but the Files tab does not yet expose move/copy UI.
- Template/resource directories exist, but template download/resource UI is not implemented yet.
- AI API key storage exists, but AI explanation generation is not implemented yet.

### Still Missing

- Generate AI code explanations, summaries, and improvement suggestions
- Show generated AI response beside the selected snippet
- Download templates/resources from local presets or remote URLs
- Move/copy files between folders from the UI
- Demo video, final screenshots, and GitHub submission notes

## Project Structure

```txt
src/
  app/                 Expo Router screens only
    (tabs)/            Home, Favorites, Files, Settings
    snippet/           New, Edit, Details
  components/          Reusable UI components
  constants/           Shared constants such as language options
  db/                  SQLite database and snippet queries
  files/               Expo FileSystem and Sharing helpers
  storage/             AsyncStorage and SecureStore helpers
  types/               Shared TypeScript types
  theme.tsx            App theme provider
  fontDefaults.ts      App font helpers
```

Non-route code intentionally lives outside `src/app` so Expo Router does not treat utilities as screens.

## Database Structure

SQLite database: `devsnippets.db`

### `snippets`

Stores the core snippet data.

```sql
CREATE TABLE IF NOT EXISTS snippets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  is_favorite INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### `snippet_attachments`

Stores screenshot/image attachment metadata linked to snippets.

```sql
CREATE TABLE IF NOT EXISTS snippet_attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snippet_id INTEGER NOT NULL,
  uri TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE
);
```

## Offline Storage Approach

- Snippets are stored and queried locally with SQLite.
- Search and favorites are local SQLite queries.
- Preferences are stored with AsyncStorage:
  - theme
  - default language
  - editor font size
- Sensitive tokens are stored with SecureStore:
  - AI API key
- Files are stored under Expo FileSystem document storage:
  - exports
  - attachments
  - templates/resources

Core snippet usage works without internet.

## File Management Implementation

File helpers live in:

```txt
src/files/fileService.ts
```

Current capabilities:

- Create app file directories
- Save snippet exports
- List exported files
- Delete files
- Copy files
- Move files
- Save image attachments
- Share exported files

The Files tab currently lists exported files and supports deletion. Move/copy UI is pending.

## Export And Sharing

Snippet detail supports:

- Save `.txt`
- Save `.js`
- Save `.json`
- Share `.txt`
- Share `.js`
- Share `.json`

Exports are saved locally before sharing so they also appear in the Files tab.

## AI Integration Workflow

Current status: pending.

Planned workflow:

1. User stores an AI API key in Settings.
2. Snippet detail shows an Explain/Summarize/Improve action.
3. App reads the key from SecureStore.
4. App sends selected snippet code and language to an AI provider.
5. The response is displayed below or beside the snippet.
6. Optional future improvement: cache AI responses locally in SQLite.

## Running The App

Install dependencies:

```bash
npm install
```

Start Expo:

```bash
npx expo start
```

Clear cache after route/file moves:

```bash
npx expo start -c
```

Run lint:

```bash
npm run lint
```

Run TypeScript check:

```bash
npx tsc --noEmit
```

## Submission Checklist

- GitHub repository link
- Demo video covering:
  - create/edit/delete snippets
  - search
  - favorites
  - file export/share
  - attachments
  - settings/preferences
  - AI workflow once implemented
- Screenshots:
  - Home
  - New Snippet
  - Snippet Details
  - Favorites
  - Files
  - Settings
- Brief explanation of:
  - database structure
  - offline storage approach
  - file management implementation
  - AI integration workflow

