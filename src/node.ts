import { readFile, writeFile } from 'node:fs/promises'

import type { CollectionDatabase, OsuDatabase, ScoresDatabase } from './types'
import {
	readCollectionDatabase,
	readOsuDatabase,
	readScoresDatabase,
	writeCollectionDatabase,
	writeOsuDatabase,
	writeScoresDatabase,
} from './db'

export type DatabaseFilePath = string | URL

export async function readOsuDatabaseFile(path: DatabaseFilePath): Promise<OsuDatabase> {
	return readOsuDatabase(new Uint8Array(await readFile(path)))
}

export async function writeOsuDatabaseFile(path: DatabaseFilePath, database: OsuDatabase): Promise<void> {
	await writeFile(path, writeOsuDatabase(database))
}

export async function readCollectionDatabaseFile(path: DatabaseFilePath): Promise<CollectionDatabase> {
	return readCollectionDatabase(new Uint8Array(await readFile(path)))
}

export async function writeCollectionDatabaseFile(path: DatabaseFilePath, database: CollectionDatabase): Promise<void> {
	await writeFile(path, writeCollectionDatabase(database))
}

export async function readScoresDatabaseFile(path: DatabaseFilePath): Promise<ScoresDatabase> {
	return readScoresDatabase(new Uint8Array(await readFile(path)))
}

export async function writeScoresDatabaseFile(path: DatabaseFilePath, database: ScoresDatabase): Promise<void> {
	await writeFile(path, writeScoresDatabase(database))
}