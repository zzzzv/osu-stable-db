import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { dateTimeTicksToWindowsFileTimeTicks } from './core/utils'
import type { CollectionDatabase, OsuDatabase, ScoresDatabase, BeatmapEntry, ScoreEntry } from './types'
import {
	readCollectionDatabase,
	readOsuDatabase,
	readScoresDatabase,
	writeCollectionDatabase,
	writeOsuDatabase,
	writeScoresDatabase,
} from './db'

export type DatabaseFilePath = string | URL
export const OSU_STABLE_DIR_ENV_VAR = 'OSU_STABLE_DIR'

export function getConfiguredOsuFolderPath(): string | null {
	const folderPath = process.env[OSU_STABLE_DIR_ENV_VAR]?.trim()
	return folderPath === undefined || folderPath.length === 0 ? null : folderPath
}

export function getConfiguredOsuFolder(): OsuFolder | null {
	const folderPath = getConfiguredOsuFolderPath()
	return folderPath === null ? null : new OsuFolder(folderPath)
}

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

export class OsuFolder {
	folderPath: string

	constructor(folderPath: string) {
		this.folderPath = folderPath
	}

	getOsuDatabasePath(): string {
		return join(this.folderPath, 'osu!.db')
	}

	getCollectionDatabasePath(): string {
		return join(this.folderPath, 'collection.db')
	}

	getScoresDatabasePath(): string {
		return join(this.folderPath, 'scores.db')
	}

	async readOsuDatabase(): Promise<OsuDatabase> {
		return readOsuDatabaseFile(this.getOsuDatabasePath())
	}

	async writeOsuDatabase(database: OsuDatabase): Promise<void> {
		await writeOsuDatabaseFile(this.getOsuDatabasePath(), database)
	}

	async readCollectionDatabase(): Promise<CollectionDatabase> {
		return readCollectionDatabaseFile(this.getCollectionDatabasePath())
	}

	async writeCollectionDatabase(database: CollectionDatabase): Promise<void> {
		await writeCollectionDatabaseFile(this.getCollectionDatabasePath(), database)
	}

	async readScoresDatabase(): Promise<ScoresDatabase> {
		return readScoresDatabaseFile(this.getScoresDatabasePath())
	}

	async writeScoresDatabase(database: ScoresDatabase): Promise<void> {
		await writeScoresDatabaseFile(this.getScoresDatabasePath(), database)
	}

	getOsuFilePath(beatmap: BeatmapEntry): string {
		if (beatmap.beatmapFolderName === null || beatmap.osuFileName === null) {
			throw new Error('Beatmap entry is missing beatmapFolderName or osuFileName')
		}

		return join(this.folderPath, 'Songs', beatmap.beatmapFolderName, beatmap.osuFileName)
	}

	getOsrFilePath(score: ScoreEntry): string {
		if (score.beatmapMd5Hash === null) {
			throw new Error('Score entry is missing beatmapMd5Hash')
		}

		return join(
			this.folderPath,
			'Data',
			'r',
			`${score.beatmapMd5Hash}-${dateTimeTicksToWindowsFileTimeTicks(score.replayTimestamp)}.osr`,
		)
	}
}