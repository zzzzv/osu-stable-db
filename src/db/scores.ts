import type { GameplayMode, ScoreAdditionalModInfo, ScoreEntry, ScoresBeatmapEntry, ScoresDatabase } from '../types'

import { Mods } from '../types'
import { hasMod } from '../core/utils'

import { assertSupportedVersion, createReader, createWriter } from './shared'

function readScoreAdditionalModInfo(reader: ReturnType<typeof createReader>): ScoreAdditionalModInfo {
	return {
		targetPracticeAccuracy: reader.readDouble(),
	}
}

function writeScoreAdditionalModInfo(writer: ReturnType<typeof createWriter>, value: ScoreAdditionalModInfo): void {
	writer.writeDouble(value.targetPracticeAccuracy)
}

function readScoreEntry(reader: ReturnType<typeof createReader>): ScoreEntry {
	const gameplayMode = reader.readByte() as GameplayMode
	const version = reader.readInt32()
	const beatmapMd5Hash = reader.readString()
	const playerName = reader.readString()
	const replayMd5Hash = reader.readString()
	const count300 = reader.readUInt16()
	const count100 = reader.readUInt16()
	const count50 = reader.readUInt16()
	const countGeki = reader.readUInt16()
	const countKatu = reader.readUInt16()
	const countMiss = reader.readUInt16()
	const totalScore = reader.readInt32()
	const maxCombo = reader.readUInt16()
	const perfectCombo = reader.readBoolean()
	const mods = reader.readInt32()
	const reservedEmptyString = reader.readString()
	const replayTimestamp = reader.readDateTimeTicks()
	const reservedInt32 = reader.readInt32()
	const onlineScoreId = reader.readInt64()

	const score: ScoreEntry = {
		gameplayMode,
		version,
		beatmapMd5Hash,
		playerName,
		replayMd5Hash,
		count300,
		count100,
		count50,
		countGeki,
		countKatu,
		countMiss,
		totalScore,
		maxCombo,
		perfectCombo,
		mods,
		reservedEmptyString,
		replayTimestamp,
		reservedInt32,
		onlineScoreId,
	}

	if (hasMod(mods, Mods.TargetPractice)) {
		score.additionalModInfo = readScoreAdditionalModInfo(reader)
	}

	return score
}

function writeScoreEntry(writer: ReturnType<typeof createWriter>, score: ScoreEntry): void {
	writer.writeByte(score.gameplayMode)
	writer.writeInt32(score.version)
	writer.writeString(score.beatmapMd5Hash)
	writer.writeString(score.playerName)
	writer.writeString(score.replayMd5Hash)
	writer.writeUInt16(score.count300)
	writer.writeUInt16(score.count100)
	writer.writeUInt16(score.count50)
	writer.writeUInt16(score.countGeki)
	writer.writeUInt16(score.countKatu)
	writer.writeUInt16(score.countMiss)
	writer.writeInt32(score.totalScore)
	writer.writeUInt16(score.maxCombo)
	writer.writeBoolean(score.perfectCombo)
	writer.writeInt32(score.mods)
	writer.writeString(score.reservedEmptyString)
	writer.writeDateTimeTicks(score.replayTimestamp)
	writer.writeInt32(score.reservedInt32)
	writer.writeInt64(score.onlineScoreId)

	if (hasMod(score.mods, Mods.TargetPractice)) {
		if (score.additionalModInfo === undefined) {
			throw new Error('Target Practice scores require additionalModInfo to be present.')
		}

		writeScoreAdditionalModInfo(writer, score.additionalModInfo)
	}
}

export function readScoresDatabase(input: ArrayBuffer | Uint8Array): ScoresDatabase {
	const reader = createReader(input)
	const version = reader.readInt32()
	assertSupportedVersion(version)

	const beatmapCount = reader.readInt32()
	const beatmaps: ScoresBeatmapEntry[] = []

	for (let beatmapIndex = 0; beatmapIndex < beatmapCount; beatmapIndex += 1) {
		const beatmapMd5Hash = reader.readString()
		const scoreCount = reader.readInt32()
		const scores: ScoreEntry[] = []

		for (let scoreIndex = 0; scoreIndex < scoreCount; scoreIndex += 1) {
			scores.push(readScoreEntry(reader))
		}

		beatmaps.push({
			beatmapMd5Hash,
			scores,
		})
	}

	return {
		version,
		beatmaps,
	}
}

export function writeScoresDatabase(database: ScoresDatabase): Uint8Array {
	assertSupportedVersion(database.version)

	const writer = createWriter()
	writer.writeInt32(database.version)
	writer.writeInt32(database.beatmaps.length)

	for (const beatmap of database.beatmaps) {
		writer.writeString(beatmap.beatmapMd5Hash)
		writer.writeInt32(beatmap.scores.length)

		for (const score of beatmap.scores) {
			writeScoreEntry(writer, score)
		}
	}

	return writer.toUint8Array()
}