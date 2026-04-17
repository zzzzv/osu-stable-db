import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
	readCollectionDatabase,
	readOsuDatabase,
	readScoresDatabase,
	writeCollectionDatabase,
	writeOsuDatabase,
	writeScoresDatabase,
} from '../src'
import {
	readCollectionDatabaseFile,
	readOsuDatabaseFile,
	readScoresDatabaseFile,
	writeCollectionDatabaseFile,
	writeOsuDatabaseFile,
	writeScoresDatabaseFile,
} from '../src/node'

const fixtureDir = join(process.cwd(), 'tests', 'files')

describe('node file wrappers', () => {
	it('reads committed fixture files through node wrappers', async () => {
		const osuPath = join(fixtureDir, 'osu!.db')
		const collectionPath = join(fixtureDir, 'collection.db')
		const scoresPath = join(fixtureDir, 'scores.db')

		const [osu, collection, scores] = await Promise.all([
			readOsuDatabaseFile(osuPath),
			readCollectionDatabaseFile(collectionPath),
			readScoresDatabaseFile(scoresPath),
		])

		expect(osu).toEqual(readOsuDatabase(new Uint8Array(await readFile(osuPath))))
		expect(collection).toEqual(readCollectionDatabase(new Uint8Array(await readFile(collectionPath))))
		expect(scores).toEqual(readScoresDatabase(new Uint8Array(await readFile(scoresPath))))
	})

	it('writes osu!.db through node wrapper with byte-identical output', async () => {
		const fixturePath = join(fixtureDir, 'osu!.db')
		const fixture = new Uint8Array(await readFile(fixturePath))
		const database = readOsuDatabase(fixture)
		const outputDir = await mkdtemp(join(tmpdir(), 'osu-stable-db-'))
		const outputPath = join(outputDir, 'osu!.db')

		await writeOsuDatabaseFile(outputPath, database)

		expect(new Uint8Array(await readFile(outputPath))).toEqual(writeOsuDatabase(database))
	})

	it('writes collection.db and scores.db through node wrappers', async () => {
		const collectionFixture = new Uint8Array(await readFile(join(fixtureDir, 'collection.db')))
		const scoresFixture = new Uint8Array(await readFile(join(fixtureDir, 'scores.db')))
		const collectionDatabase = readCollectionDatabase(collectionFixture)
		const scoresDatabase = readScoresDatabase(scoresFixture)
		const outputDir = await mkdtemp(join(tmpdir(), 'osu-stable-db-'))
		const collectionPath = join(outputDir, 'collection.db')
		const scoresPath = join(outputDir, 'scores.db')

		await Promise.all([
			writeCollectionDatabaseFile(collectionPath, collectionDatabase),
			writeScoresDatabaseFile(scoresPath, scoresDatabase),
		])

		expect(new Uint8Array(await readFile(collectionPath))).toEqual(writeCollectionDatabase(collectionDatabase))
		expect(new Uint8Array(await readFile(scoresPath))).toEqual(writeScoresDatabase(scoresDatabase))
	})
})