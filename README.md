# osu-stable-db

TypeScript reader and writer for osu!stable database files.

This project is implemented entirely according to the official osu! wiki page for stable database files: [Legacy database file structure](https://github.com/ppy/osu/wiki/Legacy-database-file-structure).

This library currently supports the latest database structure from version 20250107 onward for:

- osu!.db
- collection.db
- scores.db

The core binary and database logic is browser-compatible. A separate Node-only subpath is provided for direct file reads, writes, and osu! folder helpers.

## Scope

- Supports only 20250107 and later database structures
- Preserves null string semantics used by the stable database format
- Uses bigint for 64-bit values such as DateTime ticks
- Exposes byte-array database APIs from the main entry
- Exposes direct file APIs from the ./node subpath

Older stable database versions are intentionally out of scope.

## Install

```bash
pnpm add osu-stable-db
```

## Browser Usage

Use the main entry when you already have bytes in memory.

```ts
import {
  readOsuDatabase,
  writeCollectionDatabase,
  type CollectionDatabase,
} from 'osu-stable-db'

const osuBytes: ArrayBuffer = bytesFromSomewhere
const osuDatabase = readOsuDatabase(osuBytes)

const collectionDatabase: CollectionDatabase = {
  version: osuDatabase.version,
  collections: [
    {
      name: 'Favorites',
      beatmapMd5Hashes: ['d41d8cd98f00b204e9800998ecf8427e'],
    },
  ],
}

const collectionBytes = writeCollectionDatabase(collectionDatabase)
```

Main entry exports:

- All public types and constants
- readOsuDatabase and writeOsuDatabase
- readCollectionDatabase and writeCollectionDatabase
- readScoresDatabase and writeScoresDatabase

## Node Usage

Use the Node subpath when you want to work with a full osu! folder or with direct file reads and writes through node:fs/promises.

```ts
import {
  OsuFolder,
} from 'osu-stable-db/node'

const osuFolder = new OsuFolder('C:/Games/osu!')
const osuDatabase = await osuFolder.readOsuDatabase()
const scoresDatabase = await osuFolder.readScoresDatabase()

const newestBeatmap = osuDatabase.beatmaps.at(-1)
const newestScore = scoresDatabase.beatmaps.at(-1)?.scores.at(-1)

if (newestBeatmap !== undefined) {
  const osuFilePath = osuFolder.getOsuFilePath(newestBeatmap)
  console.log(osuFilePath)
}

if (newestScore !== undefined) {
  const osrFilePath = osuFolder.getOsrFilePath(newestScore)
  console.log(osrFilePath)
}
```

If you only need path-based file IO, the same subpath also exports helpers such as readOsuDatabaseFile, writeCollectionDatabaseFile, and writeScoresDatabaseFile.

## Types And Time Values

- Date-like 64-bit values are exposed as DateTimeTicks, backed by bigint
- Helper functions for DateTimeTicks and mod flags live in [src/core/utils.ts](src/core/utils.ts)

JavaScript Date is not used as the storage type because it loses sub-millisecond tick precision.

## AI Disclosure

This project is 100% AI-generated.

## Tests And Fixtures

Committed minimal fixtures live in [tests/files](tests/files).

Large real-world local fixtures can be placed in:

- [tests/files/local](tests/files/local)
- [tests/files/local/osu!](tests/files/local/osu!) via a directory link created by the package script below

That directory is git-ignored. When those files are present, the test suite will:

- parse them
- verify byte-for-byte round-trip for osu!.db, collection.db, and scores.db

To link your real local osu! folder into the workspace on Windows, run:

```bash
pnpm run local:link -- "C:\\path\\to\\osu!"
```

This creates [tests/files/local/osu!](tests/files/local/osu!) as a directory junction. Tests and local scripts now prefer databases from that linked folder, and fall back to [tests/files/local](tests/files/local) for the previous workflow.

You can also generate a local inspection report for a specific beatmap identifier with:

```bash
pnpm run local:inspect -- 5288868
```

The generated report is written to:

- [tests/files/local/reports](tests/files/local/reports)

## Development

```bash
pnpm install
pnpm run typecheck
pnpm test -- --run
pnpm run build
```

## Notes On Validation

Local validation also passes against private real-world database files in [tests/files/local/osu!](tests/files/local/osu!):

- osu!.db: 58,295,932 bytes, 72,038 beatmaps
- collection.db: 195,402 bytes, 11 collections, 5,743 stored beatmap references
- scores.db: 3,714,272 bytes, 11,331 beatmap score groups, 26,481 scores

Those local tests passed with parsing and byte-for-byte round-trip verification enabled.
