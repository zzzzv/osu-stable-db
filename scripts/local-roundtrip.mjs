import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
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
const linkedLocalDir = resolve(localDir, 'osu!')
const outputDir = resolve(localDir, 'output')

function resolveLocalDatabasePath(fileName) {
	const linkedPath = resolve(linkedLocalDir, fileName)
	if (existsSync(linkedPath)) {
		return linkedPath
	}

	return resolve(localDir, fileName)
}

await mkdir(outputDir, { recursive: true })

const osuDatabase = await readOsuDatabaseFile(resolveLocalDatabasePath('osu!.db'))
await writeOsuDatabaseFile(resolve(outputDir, 'osu!.db'), osuDatabase)

const collectionDatabase = await readCollectionDatabaseFile(resolveLocalDatabasePath('collection.db'))
await writeCollectionDatabaseFile(resolve(outputDir, 'collection.db'), collectionDatabase)

const scoresDatabase = await readScoresDatabaseFile(resolveLocalDatabasePath('scores.db'))
await writeScoresDatabaseFile(resolve(outputDir, 'scores.db'), scoresDatabase)

console.log('Wrote round-tripped local databases to tests/files/local/output')