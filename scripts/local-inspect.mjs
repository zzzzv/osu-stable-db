import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

import {
	readOsuDatabaseFile,
	readScoresDatabaseFile,
} from '../dist/node.mjs'

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const localDir = resolve(workspaceRoot, 'tests/files/local')
const reportDir = resolve(localDir, 'reports')
const defaultBeatmapId = 5288868
const TICKS_PER_MILLISECOND = 10000n
const UNIX_EPOCH_DATE_TIME_TICKS = 621355968000000000n

function parseBeatmapId(argument) {
	if (argument === undefined) {
		return defaultBeatmapId
	}

	const parsed = Number.parseInt(argument, 10)
	if (!Number.isSafeInteger(parsed) || parsed < 0) {
		throw new Error(`Invalid beatmapId: ${argument}`)
	}

	return parsed
}

function toIsoStringFromTicks(ticks) {
	const unixMilliseconds = Number((ticks - UNIX_EPOCH_DATE_TIME_TICKS) / TICKS_PER_MILLISECOND)
	return new Date(unixMilliseconds).toISOString()
}

function toJson(value) {
	return JSON.stringify(value, (_, currentValue) => {
		return typeof currentValue === 'bigint' ? currentValue.toString() : currentValue
	}, 2)
}

const targetBeatmapId = parseBeatmapId(process.argv[2])

const osuDatabase = await readOsuDatabaseFile(resolve(localDir, 'osu!.db'))
const scoresDatabase = await readScoresDatabaseFile(resolve(localDir, 'scores.db'))
const beatmapByBeatmapId = osuDatabase.beatmaps.find((entry) => entry.beatmapId === targetBeatmapId)
const beatmapByDifficultyId = osuDatabase.beatmaps.find((entry) => entry.difficultyId === targetBeatmapId)
const beatmap = beatmapByBeatmapId ?? beatmapByDifficultyId ?? null

const scoreGroup = beatmap === null
	? undefined
	: scoresDatabase.beatmaps.find((entry) => entry.beatmapMd5Hash === beatmap.md5Hash)
const highestScore = scoreGroup?.scores.reduce((best, current) => {
	if (best === null) {
		return current
	}

	if (current.totalScore > best.totalScore) {
		return current
	}

	if (current.totalScore === best.totalScore && current.maxCombo > best.maxCombo) {
		return current
	}

	return best
}, null) ?? null

await mkdir(reportDir, { recursive: true })

const report = {
	generatedAt: new Date().toISOString(),
	targetBeatmapId,
	search: {
		matchedBy: beatmapByBeatmapId !== undefined ? 'beatmapId' : beatmapByDifficultyId !== undefined ? 'difficultyId' : null,
		found: beatmap !== null,
		osuBeatmapCount: osuDatabase.beatmaps.length,
		scoresBeatmapCount: scoresDatabase.beatmaps.length,
	},
	beatmap: beatmap === null
		? null
		: {
			...beatmap,
			lastModificationTime: toIsoStringFromTicks(beatmap.lastModificationTime),
			lastPlayedAt: toIsoStringFromTicks(beatmap.lastPlayedAt),
			lastCheckedAgainstRepositoryAt: toIsoStringFromTicks(beatmap.lastCheckedAgainstRepositoryAt),
		},
	highestScore: highestScore === null
		? null
		: {
			...highestScore,
			replayTimestamp: toIsoStringFromTicks(highestScore.replayTimestamp),
		},
}

const outputPath = resolve(reportDir, `beatmap-${targetBeatmapId}.json`)
await writeFile(outputPath, toJson(report))

console.log(`Wrote local inspection report to ${outputPath}`)