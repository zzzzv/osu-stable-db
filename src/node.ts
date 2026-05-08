import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { dateTimeTicksToWindowsFileTimeTicks } from './core/utils'
import type { CollectionDatabase, OsuDatabase, ScoresDatabase, BeatmapEntry, ScoreEntry } from './types'
import {
	createBeatmapScoreQuery as createBaseBeatmapScoreQuery,
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

	createBeatmapScoreQuery(
		beatmapsSource: OsuDatabase | BeatmapEntry[],
		scoresSource: ScoresDatabase | Array<{ beatmapMd5Hash: string | null, scores: ScoreEntry[] }>,
	) {
		const query = createBaseBeatmapScoreQuery(beatmapsSource, scoresSource)

		const wrapBeatmap = (beatmap: BeatmapEntry) => ({
			...beatmap,
			getOsuFilePath: () => this.getOsuFilePath(beatmap),
		})

		const wrapScore = (score: ScoreEntry) => ({
			...score,
			getOsrFilePath: () => this.getOsrFilePath(score),
		})

		const wrapBeatmapScoresGroupMatch = ({ beatmap, scores }: { beatmap: BeatmapEntry, scores: ScoreEntry[] }) => ({
			beatmap: wrapBeatmap(beatmap),
			scores: scores.map(wrapScore),
		})

		const wrapBeatmapScoreMatch = ({ beatmap, score }: { beatmap: BeatmapEntry, score: ScoreEntry }) => ({
			beatmap: wrapBeatmap(beatmap),
			score: wrapScore(score),
		})

		function* iterateBeatmapScoreGroups() {
			for (const match of query.iterateBeatmapScoreGroups()) {
				yield wrapBeatmapScoresGroupMatch(match)
			}
		}

		function* iterateBeatmapScores() {
			for (const match of query.iterateBeatmapScores()) {
				yield wrapBeatmapScoreMatch(match)
			}
		}

		return {
			iterateBeatmapScoreGroups,
			iterateBeatmapScores,
		}
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