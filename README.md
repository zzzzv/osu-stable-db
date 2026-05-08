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

## Node Usage

Use the Node subpath when you want to work with a full osu! folder or with direct file reads and writes through node:fs/promises.

```ts
import {
  OsuFolder,
} from 'osu-stable-db/node'

const osuFolder = new OsuFolder('C:/osu!')

const osuDatabase = await osuFolder.readOsuDatabase()
const scoresDatabase = await osuFolder.readScoresDatabase()

const query = osuFolder.createBeatmapScoreQuery(osuDatabase, scoresDatabase)

for (const { beatmap, score } of query.iterateBeatmapScores()) {
  console.log(beatmap.getOsuFilePath())
  console.log(score.getOsrFilePath())
}
```

If you only need path-based file IO, the same subpath also exports helpers such as readOsuDatabaseFile, writeCollectionDatabaseFile, and writeScoresDatabaseFile.

## Query Helpers

Use createBeatmapScoreQuery when you want to join osu!.db beatmaps with scores.db entries by beatmap MD5 hash.

It accepts either full database objects or the underlying beatmap and score-group arrays, and returns two generators:

- iterateBeatmapScoreGroups yields one beatmap with its matching ScoreEntry array
- iterateBeatmapScores yields one beatmap with one flattened ScoreEntry at a time

```ts
import {
  createBeatmapScoreQuery,
  readOsuDatabase,
  readScoresDatabase,
} from 'osu-stable-db'

const osuDatabase = readOsuDatabase(osuBytes)
const scoresDatabase = readScoresDatabase(scoresBytes)

const query = createBeatmapScoreQuery(osuDatabase, scoresDatabase)

for (const { beatmap, scores } of query.iterateBeatmapScoreGroups()) {
  console.log(beatmap.beatmapId, scores.length)
}

for (const { beatmap, score } of query.iterateBeatmapScores()) {
  console.log(beatmap.difficultyName, score.playerName, score.totalScore)
}
```

## Types And Time Values

- Date-like 64-bit values are exposed as DateTimeTicks, backed by bigint
- Helper functions for DateTimeTicks and mod flags live in [src/core/utils.ts](src/core/utils.ts)

JavaScript Date is not used as the storage type because it loses sub-millisecond tick precision.

## AI Disclosure

This project is 100% AI-generated.

## Tests And Fixtures

Committed minimal fixtures live in [tests/files](tests/files).

To run local node tests against your real osu! installation, set this in [.env](.env):

```dotenv
OSU_STABLE_DIR=C:/osu!
```

When OSU_STABLE_DIR is set, local node tests read your real database files and verify byte-for-byte round-trip for osu!.db, collection.db, and scores.db.

## Development

```bash
pnpm install
pnpm run typecheck
pnpm test -- --run
pnpm run build
```

## Notes On Validation

Local validation also passes against private real-world database files referenced by OSU_STABLE_DIR:

- osu!.db: 58,295,932 bytes, 72,038 beatmaps
- collection.db: 195,402 bytes, 11 collections, 5,743 stored beatmap references
- scores.db: 3,714,272 bytes, 11,331 beatmap score groups, 26,481 scores

Those local tests passed with parsing and byte-for-byte round-trip verification enabled.
