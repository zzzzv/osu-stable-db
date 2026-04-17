import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import {
	readCollectionDatabaseFile,
	readOsuDatabaseFile,
	readScoresDatabaseFile,
	writeCollectionDatabaseFile,
	writeOsuDatabaseFile,
	writeScoresDatabaseFile,
} from '../dist/node.mjs'

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const localDir = resolve(workspaceRoot, 'tests/files/local')
const outputDir = resolve(localDir, 'output')

await mkdir(outputDir, { recursive: true })

const osuDatabase = await readOsuDatabaseFile(resolve(localDir, 'osu!.db'))
await writeOsuDatabaseFile(resolve(outputDir, 'osu!.db'), osuDatabase)

const collectionDatabase = await readCollectionDatabaseFile(resolve(localDir, 'collection.db'))
await writeCollectionDatabaseFile(resolve(outputDir, 'collection.db'), collectionDatabase)

const scoresDatabase = await readScoresDatabaseFile(resolve(localDir, 'scores.db'))
await writeScoresDatabaseFile(resolve(outputDir, 'scores.db'), scoresDatabase)

console.log('Wrote round-tripped local databases to tests/files/local/output')