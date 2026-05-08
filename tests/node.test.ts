import { existsSync } from 'node:fs'
import { mkdtemp, open } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { GameplayModes, Grades, MINIMUM_SUPPORTED_VERSION, Mods, RankedStatuses } from '../src'
import { getConfiguredOsuFolder, OSU_STABLE_DIR_ENV_VAR, OsuFolder } from '../src/node'

const missingConfiguredOsuDirMessage = `Missing ${OSU_STABLE_DIR_ENV_VAR} in .env.`
const skippedInGitHubActionsMessage = 'Skipping node osu folder tests in GitHub Actions.'
const requiredSampleCount = 10

function getConfiguredLocalFolder(context: { skip: (message?: string) => never }) {
	if (process.env.GITHUB_ACTIONS === 'true') {
		context.skip(skippedInGitHubActionsMessage)
	}

	const folder = getConfiguredOsuFolder()
	if (folder === null) {
		context.skip(missingConfiguredOsuDirMessage)
	}

	return folder
}

function warnIfSampleCountIsShort(label: string, count: number): void {
	if (count < requiredSampleCount) {
		console.warn(`Expected ${requiredSampleCount} ${label}, but only found ${count} in the configured osu database.`)
	}
}

async function areFilesEqual(leftPath: string, rightPath: string): Promise<boolean> {
	const [leftFile, rightFile] = await Promise.all([
		open(leftPath, 'r'),
		open(rightPath, 'r'),
	])

	try {
		const [leftStats, rightStats] = await Promise.all([
			leftFile.stat(),
			rightFile.stat(),
		])

		if (leftStats.size !== rightStats.size) {
			return false
		}

		const chunkSize = 64 * 1024
		const leftBuffer = Buffer.allocUnsafe(chunkSize)
		const rightBuffer = Buffer.allocUnsafe(chunkSize)
		let offset = 0

		while (offset < leftStats.size) {
			const length = Math.min(chunkSize, leftStats.size - offset)
			const [{ bytesRead: leftBytesRead }, { bytesRead: rightBytesRead }] = await Promise.all([
				leftFile.read(leftBuffer, 0, length, offset),
				rightFile.read(rightBuffer, 0, length, offset),
			])

			if (leftBytesRead !== rightBytesRead) {
				return false
			}

			for (let index = 0; index < leftBytesRead; index += 1) {
				if (leftBuffer[index] !== rightBuffer[index]) {
					return false
				}
			}

			offset += leftBytesRead
		}

		return true
	}
	finally {
		await Promise.all([
			leftFile.close(),
			rightFile.close(),
		])
	}
}

function createBeatmap() {
	return {
		artist: 'artist',
		artistUnicode: null,
		title: 'title',
		titleUnicode: null,
		creator: 'creator',
		difficultyName: 'Insane',
		audioFileName: 'audio.mp3',
		md5Hash: 'beatmap-md5',
		osuFileName: 'map.osu',
		rankedStatus: RankedStatuses.Ranked,
		hitCircleCount: 1,
		sliderCount: 2,
		spinnerCount: 3,
		lastModificationTime: 1n,
		approachRate: 9,
		circleSize: 4,
		hpDrain: 6,
		overallDifficulty: 8,
		sliderVelocity: 1.5,
		standardStarRatings: [],
		taikoStarRatings: [],
		catchStarRatings: [],
		maniaStarRatings: [],
		drainTimeSeconds: 95,
		totalTimeMs: 123456,
		previewOffsetMs: 65432,
		timingPoints: [],
		difficultyId: 11,
		beatmapId: 22,
		threadId: 33,
		standardGrade: Grades.N,
		taikoGrade: Grades.N,
		catchGrade: Grades.N,
		maniaGrade: Grades.N,
		localOffset: -10,
		stackLeniency: 0.75,
		gameplayMode: GameplayModes.Osu,
		source: 'source',
		tags: 'tag1 tag2',
		onlineOffset: 12,
		titleFont: 'font',
		isUnplayed: false,
		lastPlayedAt: 2n,
		isOsz2: true,
		beatmapFolderName: 'folder',
		lastCheckedAgainstRepositoryAt: 3n,
		ignoreBeatmapSound: false,
		ignoreBeatmapSkin: true,
		disableStoryboard: false,
		disableVideo: false,
		visualOverride: true,
		lastModificationTimeUnknown: 0,
		maniaScrollSpeed: 18,
	}
}

function createScore(totalScore: number, replayTimestamp: bigint) {
	return {
		gameplayMode: GameplayModes.Osu,
		version: MINIMUM_SUPPORTED_VERSION,
		beatmapMd5Hash: 'beatmap-md5',
		playerName: `player-${totalScore}`,
		replayMd5Hash: `replay-${totalScore}`,
		count300: 1,
		count100: 0,
		count50: 0,
		countGeki: 0,
		countKatu: 0,
		countMiss: 0,
		totalScore,
		maxCombo: totalScore,
		perfectCombo: true,
		mods: Mods.None,
		reservedEmptyString: '',
		replayTimestamp,
		reservedInt32: -1,
		onlineScoreId: BigInt(totalScore),
	}
}

describe('node osu folder helper', () => {
	it('wraps beatmap score query results with bound file path helpers', () => {
		const folder = new OsuFolder('C:/osu!')
		const beatmap = createBeatmap()
		const firstScore = createScore(100, 638804620423450000n)
		const secondScore = createScore(200, 638804620523450000n)
		const query = folder.createBeatmapScoreQuery([beatmap], [
			{
				beatmapMd5Hash: beatmap.md5Hash,
				scores: [firstScore, secondScore],
			},
		])

		expect([...query.iterateBeatmapScoreGroups()]).toEqual([
			{
				beatmap: {
					...beatmap,
					getOsuFilePath: expect.any(Function),
				},
				scores: [
					{
						...firstScore,
						getOsrFilePath: expect.any(Function),
					},
					{
						...secondScore,
						getOsrFilePath: expect.any(Function),
					},
				],
			},
		])

		const [groupMatch] = [...query.iterateBeatmapScoreGroups()]
		const [firstMatch, secondMatch] = [...query.iterateBeatmapScores()]
		const osuFilePath = folder.getOsuFilePath(beatmap)

		expect(groupMatch.beatmap.getOsuFilePath()).toBe(osuFilePath)
		expect(groupMatch.scores.map((score) => score.getOsrFilePath())).toEqual([
			folder.getOsrFilePath(firstScore),
			folder.getOsrFilePath(secondScore),
		])
		expect(firstMatch.beatmap.getOsuFilePath()).toBe(osuFilePath)
		expect(firstMatch.score.getOsrFilePath()).toBe(folder.getOsrFilePath(firstScore))
		expect(secondMatch.score.getOsrFilePath()).toBe(folder.getOsrFilePath(secondScore))
	})

	it('round-trips configured osu!.db bytes through the node folder helper', async (context) => {
		const folder = getConfiguredLocalFolder(context)
		const database = await folder.readOsuDatabase()
		const outputDir = await mkdtemp(join(tmpdir(), 'osu-stable-db-'))
		const outputFolder = new OsuFolder(outputDir)
		const outputPath = join(outputDir, 'osu!.db')

		expect(database.version).toBeGreaterThanOrEqual(MINIMUM_SUPPORTED_VERSION)
		expect(database.beatmaps.length).toBeGreaterThan(0)

		await outputFolder.writeOsuDatabase(database)
		expect(await areFilesEqual(folder.getOsuDatabasePath(), outputPath)).toBe(true)
	})

	it('round-trips configured collection.db bytes through the node folder helper', async (context) => {
		const folder = getConfiguredLocalFolder(context)
		const database = await folder.readCollectionDatabase()
		const outputDir = await mkdtemp(join(tmpdir(), 'osu-stable-db-'))
		const outputFolder = new OsuFolder(outputDir)
		const outputPath = join(outputDir, 'collection.db')

		expect(database.version).toBeGreaterThanOrEqual(MINIMUM_SUPPORTED_VERSION)
		expect(database.collections.length).toBeGreaterThanOrEqual(0)

		await outputFolder.writeCollectionDatabase(database)
		expect(await areFilesEqual(folder.getCollectionDatabasePath(), outputPath)).toBe(true)
	})

	it('round-trips configured scores.db bytes through the node folder helper', async (context) => {
		const folder = getConfiguredLocalFolder(context)
		const database = await folder.readScoresDatabase()
		const outputDir = await mkdtemp(join(tmpdir(), 'osu-stable-db-'))
		const outputFolder = new OsuFolder(outputDir)
		const outputPath = join(outputDir, 'scores.db')

		expect(database.version).toBeGreaterThanOrEqual(MINIMUM_SUPPORTED_VERSION)
		expect(database.beatmaps.length).toBeGreaterThanOrEqual(0)

		await outputFolder.writeScoresDatabase(database)
		expect(await areFilesEqual(folder.getScoresDatabasePath(), outputPath)).toBe(true)
	})

	it('resolves existing osu files for the last 10 beatmaps from the configured osu database', async (context) => {
		const folder = getConfiguredLocalFolder(context)
		const osu = await folder.readOsuDatabase()
		const lastBeatmaps = osu.beatmaps.slice(-requiredSampleCount)

		warnIfSampleCountIsShort('beatmaps', lastBeatmaps.length)
		expect(lastBeatmaps.length).toBeGreaterThan(0)

		for (const beatmap of lastBeatmaps) {
			const beatmapPath = folder.getOsuFilePath(beatmap)
			expect(existsSync(beatmapPath), beatmapPath).toBe(true)
		}
	})

	it('resolves existing osr files for the last 10 scores from the configured osu database', async (context) => {
		const folder = getConfiguredLocalFolder(context)
		const scores = await folder.readScoresDatabase()
		const lastScores = scores.beatmaps
			.flatMap((entry) => entry.scores)
			.slice(-requiredSampleCount)

		warnIfSampleCountIsShort('scores', lastScores.length)
		expect(lastScores.length).toBeGreaterThan(0)

		for (const score of lastScores) {
			const replayPath = folder.getOsrFilePath(score)
			expect(existsSync(replayPath), replayPath).toBe(true)
		}
	})
})