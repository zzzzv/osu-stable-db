import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import {
	GameplayModes,
	Grades,
	MINIMUM_SUPPORTED_VERSION,
	Mods,
	RankedStatuses,
	createBeatmapScoreQuery,
	type BeatmapEntry,
	type CollectionDatabase,
	type OsuDatabase,
	type ScoresDatabase,
	readCollectionDatabase,
	readOsuDatabase,
	readScoresDatabase,
	writeCollectionDatabase,
	writeOsuDatabase,
	writeScoresDatabase,
} from '../src'

const fixtureDir = join(process.cwd(), 'tests', 'files')

function areBytesEqual(left: Uint8Array, right: Uint8Array): boolean {
	if (left.byteLength !== right.byteLength) {
		return false
	}

	for (let index = 0; index < left.byteLength; index += 1) {
		if (left[index] !== right[index]) {
			return false
		}
	}

	return true
}

function createBeatmap(): BeatmapEntry {
	return {
		artist: 'artist',
		artistUnicode: '艺术家',
		title: 'title',
		titleUnicode: '标题',
		creator: 'creator',
		difficultyName: 'Insane',
		audioFileName: 'audio.mp3',
		md5Hash: 'beatmap-md5',
		osuFileName: 'map.osu',
		rankedStatus: RankedStatuses.Ranked,
		hitCircleCount: 123,
		sliderCount: 45,
		spinnerCount: 6,
		lastModificationTime: 638804620123450000n,
		approachRate: 9,
		circleSize: 4,
		hpDrain: 6,
		overallDifficulty: 8,
		sliderVelocity: 1.5,
		standardStarRatings: [{ mods: Mods.Hidden, starRating: 6.5 }],
		taikoStarRatings: [{ mods: Mods.None, starRating: 5.25 }],
		catchStarRatings: [],
		maniaStarRatings: [{ mods: Mods.DoubleTime, starRating: 7.75 }],
		drainTimeSeconds: 95,
		totalTimeMs: 123456,
		previewOffsetMs: 65432,
		timingPoints: [{ bpm: 180, offsetMs: 0, isUninherited: true }],
		difficultyId: 11,
		beatmapId: 22,
		threadId: 33,
		standardGrade: Grades.S,
		taikoGrade: Grades.A,
		catchGrade: Grades.N,
		maniaGrade: Grades.XH,
		localOffset: -10,
		stackLeniency: 0.75,
		gameplayMode: GameplayModes.Osu,
		source: 'source',
		tags: 'tag1 tag2',
		onlineOffset: 12,
		titleFont: 'font',
		isUnplayed: false,
		lastPlayedAt: 638804620223450000n,
		isOsz2: true,
		beatmapFolderName: 'folder',
		lastCheckedAgainstRepositoryAt: 638804620323450000n,
		ignoreBeatmapSound: false,
		ignoreBeatmapSkin: true,
		disableStoryboard: false,
		disableVideo: false,
		visualOverride: true,
		lastModificationTimeUnknown: 0,
		maniaScrollSpeed: 18,
	}
}

describe('database IO', () => {
	it('round-trips committed osu!.db fixture bytes', async () => {
		const fixture = new Uint8Array(await readFile(join(fixtureDir, 'osu!.db')))
		const database = readOsuDatabase(fixture)

		expect(database).toMatchObject({
			version: 20260412,
			folderCount: 19,
			accountUnlocked: true,
			playerName: 'zzzzv',
			userPermissions: 5,
		})
		expect(database.beatmaps).toHaveLength(85)
		expect(areBytesEqual(writeOsuDatabase(database), fixture)).toBe(true)
	})

	it('round-trips committed collection.db fixture bytes', async () => {
		const fixture = new Uint8Array(await readFile(join(fixtureDir, 'collection.db')))
		const database = readCollectionDatabase(fixture)

		expect(database.version).toBe(20260412)
		expect(database.collections).toHaveLength(2)
		expect(database.collections[0]).toEqual({
			name: '4k',
			beatmapMd5Hashes: [
				'9c8eb80f6e245b5b0a0a100bbb3e274c',
				'b5fbe1a1444e35ecb7f8f03e2b61986b',
				'de4b9a01bf44a847b7cebb96da623ccf',
				'f7f23e1073b508593d98cb50097b0d7e',
			],
		})
		expect(areBytesEqual(writeCollectionDatabase(database), fixture)).toBe(true)
	})

	it('round-trips committed scores.db fixture bytes', async () => {
		const fixture = new Uint8Array(await readFile(join(fixtureDir, 'scores.db')))
		const database = readScoresDatabase(fixture)

		expect(database.version).toBe(20260412)
		expect(database.beatmaps).toHaveLength(2)
		expect(database.beatmaps[0]).toMatchObject({
			beatmapMd5Hash: '238da678283fe6eee86db5e49d4c04f4',
			scores: [
				{
					gameplayMode: GameplayModes.Mania,
					playerName: 'zzzzv',
					totalScore: 942871,
					maxCombo: 687,
					mods: Mods.None,
				},
			],
		})
		expect(areBytesEqual(writeScoresDatabase(database), fixture)).toBe(true)
	})

	it('round-trips osu!.db', () => {
		const database: OsuDatabase = {
			version: MINIMUM_SUPPORTED_VERSION,
			folderCount: 7,
			accountUnlocked: true,
			accountUnlockDate: 638804620023450000n,
			playerName: 'player',
			beatmaps: [createBeatmap()],
			userPermissions: 4,
		}

		expect(readOsuDatabase(writeOsuDatabase(database))).toEqual(database)
	})

	it('round-trips collection.db', () => {
		const database: CollectionDatabase = {
			version: MINIMUM_SUPPORTED_VERSION,
			collections: [
				{
					name: 'Favorites',
					beatmapMd5Hashes: ['hash-a', null, 'hash-b'],
				},
			],
		}

		expect(readCollectionDatabase(writeCollectionDatabase(database))).toEqual(database)
	})

	it('round-trips scores.db with Target Practice payload', () => {
		const database: ScoresDatabase = {
			version: MINIMUM_SUPPORTED_VERSION,
			beatmaps: [
				{
					beatmapMd5Hash: 'beatmap-md5',
					scores: [
						{
							gameplayMode: GameplayModes.Osu,
							version: MINIMUM_SUPPORTED_VERSION,
							beatmapMd5Hash: 'beatmap-md5',
							playerName: 'player',
							replayMd5Hash: 'replay-md5',
							count300: 500,
							count100: 12,
							count50: 1,
							countGeki: 22,
							countKatu: 3,
							countMiss: 0,
							totalScore: 1234567,
							maxCombo: 1234,
							perfectCombo: true,
							mods: Mods.Hidden | Mods.TargetPractice,
							reservedEmptyString: '',
							replayTimestamp: 638804620423450000n,
							reservedInt32: -1,
							onlineScoreId: 987654321012345678n,
							additionalModInfo: {
								targetPracticeAccuracy: 98.25,
							},
						},
					],
				},
			],
		}

		expect(readScoresDatabase(writeScoresDatabase(database))).toEqual(database)
	})

	it('rejects unsupported versions', () => {
		const tooOld = {
			version: MINIMUM_SUPPORTED_VERSION - 1,
			collections: [],
		}

		expect(() => writeCollectionDatabase(tooOld)).toThrow(/Unsupported legacy database version/)
	})

	it('requires additionalModInfo for Target Practice scores', () => {
		const database: ScoresDatabase = {
			version: MINIMUM_SUPPORTED_VERSION,
			beatmaps: [
				{
					beatmapMd5Hash: 'beatmap-md5',
					scores: [
						{
							gameplayMode: GameplayModes.Osu,
							version: MINIMUM_SUPPORTED_VERSION,
							beatmapMd5Hash: 'beatmap-md5',
							playerName: 'player',
							replayMd5Hash: 'replay-md5',
							count300: 1,
							count100: 0,
							count50: 0,
							countGeki: 0,
							countKatu: 0,
							countMiss: 0,
							totalScore: 1,
							maxCombo: 1,
							perfectCombo: true,
							mods: Mods.TargetPractice,
							reservedEmptyString: '',
							replayTimestamp: 638804620423450000n,
							reservedInt32: -1,
							onlineScoreId: 1n,
						},
					],
				},
			],
		}

		expect(() => writeScoresDatabase(database)).toThrow(/additionalModInfo/)
	})

		it('joins beatmaps with score groups and flattened scores', () => {
			const beatmap = createBeatmap()
			const otherBeatmap = {
				...createBeatmap(),
				md5Hash: 'other-md5',
				beatmapId: 23,
			}
			const query = createBeatmapScoreQuery(
				{
					version: MINIMUM_SUPPORTED_VERSION,
					folderCount: 0,
					accountUnlocked: true,
					accountUnlockDate: 0n,
					playerName: null,
					beatmaps: [beatmap, otherBeatmap],
					userPermissions: 0,
				},
				{
					version: MINIMUM_SUPPORTED_VERSION,
					beatmaps: [
						{
							beatmapMd5Hash: beatmap.md5Hash,
							scores: [
								{
									gameplayMode: GameplayModes.Osu,
									version: MINIMUM_SUPPORTED_VERSION,
									beatmapMd5Hash: beatmap.md5Hash,
									playerName: 'p1',
									replayMd5Hash: 'r1',
									count300: 1,
									count100: 0,
									count50: 0,
									countGeki: 0,
									countKatu: 0,
									countMiss: 0,
									totalScore: 100,
									maxCombo: 1,
									perfectCombo: true,
									mods: Mods.None,
									reservedEmptyString: '',
									replayTimestamp: 1n,
									reservedInt32: -1,
									onlineScoreId: 1n,
								},
								{
									gameplayMode: GameplayModes.Osu,
									version: MINIMUM_SUPPORTED_VERSION,
									beatmapMd5Hash: beatmap.md5Hash,
									playerName: 'p2',
									replayMd5Hash: 'r2',
									count300: 2,
									count100: 0,
									count50: 0,
									countGeki: 0,
									countKatu: 0,
									countMiss: 0,
									totalScore: 200,
									maxCombo: 2,
									perfectCombo: true,
									mods: Mods.Hidden,
									reservedEmptyString: '',
									replayTimestamp: 2n,
									reservedInt32: -1,
									onlineScoreId: 2n,
								},
							],
						},
						{
							beatmapMd5Hash: 'missing-md5',
							scores: [],
						},
					],
				},
			)

			expect([...query.iterateBeatmapScoreGroups()]).toEqual([
				{
					beatmap,
					scores: [
						expect.objectContaining({ playerName: 'p1', totalScore: 100 }),
						expect.objectContaining({ playerName: 'p2', totalScore: 200 }),
					],
				},
			])

			expect([...query.iterateBeatmapScores()]).toEqual([
				{
					beatmap,
					score: expect.objectContaining({ playerName: 'p1', totalScore: 100 }),
				},
				{
					beatmap,
					score: expect.objectContaining({ playerName: 'p2', totalScore: 200 }),
				},
			])
		})

		it('accepts raw beatmap and score entry arrays', () => {
			const beatmap = createBeatmap()
			const query = createBeatmapScoreQuery([beatmap], [
				{
					beatmapMd5Hash: beatmap.md5Hash,
					scores: [],
				},
			])

			expect([...query.iterateBeatmapScoreGroups()]).toEqual([
				{
					beatmap,
					scores: [],
				},
			])
		
			expect([...query.iterateBeatmapScores()]).toEqual([])
		})

})