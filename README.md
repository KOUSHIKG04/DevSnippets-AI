# DevShelf

DevShelf is an Expo, React Native, and TypeScript mobile app for saving, organizing, exporting, and understanding reusable code snippets directly on-device. The app is offline-first for core snippet and file workflows, with optional Gemini-powered AI explanations when an internet connection and API key are available.

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
- Gemini API

## Features

- Create, edit, delete, search, and view snippets
- Mark snippets as favorites
- Store snippets locally in SQLite
- Store theme, default language, and editor font-size preferences in AsyncStorage
- Store Gemini API keys securely with SecureStore
- Dark/light theme switching
- Syntax-colored code display
- Screenshot/image attachments for snippets
- Full-screen attachment preview with native sharing
- Export snippets as `.txt`, `.js`, and `.json`
- Share exported snippets through the native share sheet
- Browse local exports, attachments, and templates in the Files tab
- Copy, move, delete, and use locally stored files/templates
- Save starter templates locally
- Floating Gemini AI assistant on snippet details
- Generate snippet explanations, summaries, and improvement suggestions
- Formatted AI responses with headings, lists, inline code, and code blocks

## Project Structure

```txt
src/
  app/                 Expo Router screens only
    (tabs)/            Home, Favorites, Files, Settings
    snippet/           New, Edit, Details
  ai/                  Gemini AI service
  components/          Reusable UI components
  constants/           Shared constants such as language options
  db/                  SQLite database and snippet queries
  files/               Expo FileSystem and Sharing helpers
  storage/             AsyncStorage and SecureStore helpers
  types/               Shared TypeScript types
  theme.tsx            App theme provider
  fontDefaults.ts      App font helpers
```

Non-route code lives outside `src/app` so Expo Router does not treat utilities as screens.

## Database Structure

SQLite database: `devsnippets.db`

Database setup lives in `src/db/database.ts`. Query and mutation helpers live in `src/db/snippet.ts`.

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

Notes:

- `tags` is stored as JSON text and parsed in the app.
- `is_favorite` is stored as `0` or `1`.
- Snippets are ordered by `updated_at DESC`.
- Search checks title, code, and language locally.

### `snippet_attachments`

Stores local image attachment metadata linked to snippets.

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

Notes:

- Attachment files are stored with Expo FileSystem.
- SQLite stores the file URI and metadata.
- Deleting an attachment removes both metadata and the local file.

## Offline Storage Approach

DevShelf is local-first for its core workflows.

- SQLite stores snippets and attachment metadata.
- AsyncStorage stores app preferences:
  - theme
  - default language
  - editor font size
- SecureStore stores sensitive data:
  - Gemini API key
- Expo FileSystem stores local files:
  - exports
  - attachments
  - templates

Works offline:

- create snippets
- edit snippets
- delete snippets
- search snippets
- view favorites
- attach and view already saved images
- browse local files
- export snippets locally
- use saved templates

Requires internet:

- Gemini AI explanation, summary, and improvement generation

## File Management Implementation

File helpers live in `src/files/fileService.ts`.

Local directories:

```txt
documentDirectory/devsnippets/
  exports/
  attachments/
  templates/
```

Implemented file operations:

- create required directories
- save snippet exports
- list files by folder
- delete files
- copy files between folders
- move files between folders
- save image attachments
- read template files
- share files with the native share sheet

Files tab behavior:

- `Exports` shows locally exported snippets.
- `Attachments` shows saved image files.
- `Templates` shows starter template actions and saved template files.
- Template files can be opened into the New Snippet screen.

## AI Integration Workflow

AI generation uses Gemini through `src/ai/aiService.ts`.

Workflow:

1. User saves a Gemini API key in Settings.
2. The key is stored in SecureStore.
3. User opens a snippet detail screen.
4. User taps the floating `AI` button.
5. User chooses:
   - Explain
   - Summarize
   - Improve
6. The app reads the Gemini key from SecureStore.
7. The selected snippet title, language, tags, and code are sent to Gemini.
8. The generated response appears in the floating AI window.

AI UX handling:

- Missing key: asks the user to add a Gemini API key in Settings.
- Bad or rejected key: tells the user to check the saved Gemini key.
- No internet: tells the user Gemini could not be reached.
- Rate limit/quota: tells the user Gemini quota or rate limit was reached.
- Server issue: tells the user Gemini is temporarily unavailable.
- Loading: floating AI window shows a loading state while the request runs.
- Long responses: response content scrolls inside the floating AI window.

Improve prompt behavior:

- Reviews the exact snippet only.
- Returns bugs/risks, readability improvements, performance/edge cases, and an improved code example only when useful.

## Export And Sharing

Snippet detail supports:

- Save as `.txt`
- Save as `.js`
- Save as `.json`
- Share as `.txt`
- Share as `.js`
- Share as `.json`

Exports are saved locally before sharing so they also appear in the Files tab.

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

Run React Doctor:

```bash
npx react-doctor@latest --verbose --diff
```

## Submission Checklist

- GitHub repository link
- Demo video covering:
  - create/edit/delete snippets
  - search
  - favorites
  - image attachments and preview
  - file export/share
  - file manager copy/move/delete
  - templates
  - settings/preferences
  - Gemini AI Explain/Summarize/Improve workflow
- Screenshots:
  - Home
  - New Snippet
  - Snippet Details
  - Floating AI response
  - Favorites
  - Files
  - Settings
- Brief explanation of:
  - database structure
  - offline storage approach
  - file management implementation
  - AI integration workflow
