import type { BeatmapEntry, GameplayMode, Grade, IntFloatPair, OsuDatabase, RankedStatus, TimingPoint } from '../types'

import { BinaryReader, BinaryWriter } from '../core/binary'

import { assertSupportedVersion, createReader, createWriter } from './shared'

function readIntFloatPairArray(reader: BinaryReader): IntFloatPair[] {
	const count = reader.readInt32()
	const values: IntFloatPair[] = []

	for (let index = 0; index < count; index += 1) {
		values.push(reader.readIntFloatPair())
	}

	return values
}

function writeIntFloatPairArray(writer: BinaryWriter, values: IntFloatPair[]): void {
	writer.writeInt32(values.length)
	for (const value of values) {
		writer.writeIntFloatPair(value)
	}
}

function readTimingPointArray(reader: BinaryReader): TimingPoint[] {
	const count = reader.readInt32()
	const values: TimingPoint[] = []

	for (let index = 0; index < count; index += 1) {
		values.push(reader.readTimingPoint())
	}

	return values
}

function writeTimingPointArray(writer: BinaryWriter, values: TimingPoint[]): void {
	writer.writeInt32(values.length)
	for (const value of values) {
		writer.writeTimingPoint(value)
	}
}

function readBeatmapEntry(reader: BinaryReader): BeatmapEntry {
	return {
		artist: reader.readString(),
		artistUnicode: reader.readString(),
		title: reader.readString(),
		titleUnicode: reader.readString(),
		creator: reader.readString(),
		difficultyName: reader.readString(),
		audioFileName: reader.readString(),
		md5Hash: reader.readString(),
		osuFileName: reader.readString(),
		rankedStatus: reader.readByte() as RankedStatus,
		hitCircleCount: reader.readUInt16(),
		sliderCount: reader.readUInt16(),
		spinnerCount: reader.readUInt16(),
		lastModificationTime: reader.readDateTimeTicks(),
		approachRate: reader.readSingle(),
		circleSize: reader.readSingle(),
		hpDrain: reader.readSingle(),
		overallDifficulty: reader.readSingle(),
		sliderVelocity: reader.readDouble(),
		standardStarRatings: readIntFloatPairArray(reader),
		taikoStarRatings: readIntFloatPairArray(reader),
		catchStarRatings: readIntFloatPairArray(reader),
		maniaStarRatings: readIntFloatPairArray(reader),
		drainTimeSeconds: reader.readInt32(),
		totalTimeMs: reader.readInt32(),
		previewOffsetMs: reader.readInt32(),
		timingPoints: readTimingPointArray(reader),
		difficultyId: reader.readInt32(),
		beatmapId: reader.readInt32(),
		threadId: reader.readInt32(),
		standardGrade: reader.readByte() as Grade,
		taikoGrade: reader.readByte() as Grade,
		catchGrade: reader.readByte() as Grade,
		maniaGrade: reader.readByte() as Grade,
		localOffset: reader.readInt16(),
		stackLeniency: reader.readSingle(),
		gameplayMode: reader.readByte() as GameplayMode,
		source: reader.readString(),
		tags: reader.readString(),
		onlineOffset: reader.readInt16(),
		titleFont: reader.readString(),
		isUnplayed: reader.readBoolean(),
		lastPlayedAt: reader.readDateTimeTicks(),
		isOsz2: reader.readBoolean(),
		beatmapFolderName: reader.readString(),
		lastCheckedAgainstRepositoryAt: reader.readDateTimeTicks(),
		ignoreBeatmapSound: reader.readBoolean(),
		ignoreBeatmapSkin: reader.readBoolean(),
		disableStoryboard: reader.readBoolean(),
		disableVideo: reader.readBoolean(),
		visualOverride: reader.readBoolean(),
		lastModificationTimeUnknown: reader.readInt32(),
		maniaScrollSpeed: reader.readByte(),
	}
}

function writeBeatmapEntry(writer: BinaryWriter, beatmap: BeatmapEntry): void {
	writer.writeString(beatmap.artist)
	writer.writeString(beatmap.artistUnicode)
	writer.writeString(beatmap.title)
	writer.writeString(beatmap.titleUnicode)
	writer.writeString(beatmap.creator)
	writer.writeString(beatmap.difficultyName)
	writer.writeString(beatmap.audioFileName)
	writer.writeString(beatmap.md5Hash)
	writer.writeString(beatmap.osuFileName)
	writer.writeByte(beatmap.rankedStatus)
	writer.writeUInt16(beatmap.hitCircleCount)
	writer.writeUInt16(beatmap.sliderCount)
	writer.writeUInt16(beatmap.spinnerCount)
	writer.writeDateTimeTicks(beatmap.lastModificationTime)
	writer.writeSingle(beatmap.approachRate)
	writer.writeSingle(beatmap.circleSize)
	writer.writeSingle(beatmap.hpDrain)
	writer.writeSingle(beatmap.overallDifficulty)
	writer.writeDouble(beatmap.sliderVelocity)
	writeIntFloatPairArray(writer, beatmap.standardStarRatings)
	writeIntFloatPairArray(writer, beatmap.taikoStarRatings)
	writeIntFloatPairArray(writer, beatmap.catchStarRatings)
	writeIntFloatPairArray(writer, beatmap.maniaStarRatings)
	writer.writeInt32(beatmap.drainTimeSeconds)
	writer.writeInt32(beatmap.totalTimeMs)
	writer.writeInt32(beatmap.previewOffsetMs)
	writeTimingPointArray(writer, beatmap.timingPoints)
	writer.writeInt32(beatmap.difficultyId)
	writer.writeInt32(beatmap.beatmapId)
	writer.writeInt32(beatmap.threadId)
	writer.writeByte(beatmap.standardGrade)
	writer.writeByte(beatmap.taikoGrade)
	writer.writeByte(beatmap.catchGrade)
	writer.writeByte(beatmap.maniaGrade)
	writer.writeInt16(beatmap.localOffset)
	writer.writeSingle(beatmap.stackLeniency)
	writer.writeByte(beatmap.gameplayMode)
	writer.writeString(beatmap.source)
	writer.writeString(beatmap.tags)
	writer.writeInt16(beatmap.onlineOffset)
	writer.writeString(beatmap.titleFont)
	writer.writeBoolean(beatmap.isUnplayed)
	writer.writeDateTimeTicks(beatmap.lastPlayedAt)
	writer.writeBoolean(beatmap.isOsz2)
	writer.writeString(beatmap.beatmapFolderName)
	writer.writeDateTimeTicks(beatmap.lastCheckedAgainstRepositoryAt)
	writer.writeBoolean(beatmap.ignoreBeatmapSound)
	writer.writeBoolean(beatmap.ignoreBeatmapSkin)
	writer.writeBoolean(beatmap.disableStoryboard)
	writer.writeBoolean(beatmap.disableVideo)
	writer.writeBoolean(beatmap.visualOverride)
	writer.writeInt32(beatmap.lastModificationTimeUnknown)
	writer.writeByte(beatmap.maniaScrollSpeed)
}

export function readOsuDatabase(input: ArrayBuffer | Uint8Array): OsuDatabase {
	const reader = createReader(input)
	const version = reader.readInt32()
	assertSupportedVersion(version)

	const folderCount = reader.readInt32()
	const accountUnlocked = reader.readBoolean()
	const accountUnlockDate = reader.readDateTimeTicks()
	const playerName = reader.readString()
	const beatmapCount = reader.readInt32()
	const beatmaps: BeatmapEntry[] = []

	for (let index = 0; index < beatmapCount; index += 1) {
		beatmaps.push(readBeatmapEntry(reader))
	}

	const userPermissions = reader.readInt32()

	return {
		version,
		folderCount,
		accountUnlocked,
		accountUnlockDate,
		playerName,
		beatmaps,
		userPermissions,
	}
}

export function writeOsuDatabase(database: OsuDatabase): Uint8Array {
	assertSupportedVersion(database.version)

	const writer = createWriter()
	writer.writeInt32(database.version)
	writer.writeInt32(database.folderCount)
	writer.writeBoolean(database.accountUnlocked)
	writer.writeDateTimeTicks(database.accountUnlockDate)
	writer.writeString(database.playerName)
	writer.writeInt32(database.beatmaps.length)

	for (const beatmap of database.beatmaps) {
		writeBeatmapEntry(writer, beatmap)
	}

	writer.writeInt32(database.userPermissions)
	return writer.toUint8Array()
}