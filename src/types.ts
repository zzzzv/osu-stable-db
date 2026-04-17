/**
 * The minimum legacy database version supported by this library.
 *
 * Only the latest stable structure introduced in version 20250107 is modeled.
 */
export const MINIMUM_SUPPORTED_VERSION = 20250107

/**
 * Legacy gameplay mode identifiers used by osu!stable database files.
 */
export const GameplayModes = {
	Osu: 0,
	Taiko: 1,
	Catch: 2,
	Mania: 3,
} as const

/**
 * Beatmap ranked status values stored in osu!.db.
 */
export const RankedStatuses = {
	Unknown: 0,
	Unsubmitted: 1,
	Pending: 2,
	Unused: 3,
	Ranked: 4,
	Approved: 5,
	Qualified: 6,
	Loved: 7,
} as const

/**
 * Grade values stored in osu!.db for each ruleset.
 *
 * This matches legacy stable grade byte values used by osu!.db.
 */
export const Grades = {
	XH: 0,
	SH: 1,
	X: 2,
	S: 3,
	A: 4,
	B: 5,
	C: 6,
	D: 7,
	F: 8,
	N: 9,
} as const

/**
 * User permission flags stored in osu!.db.
 */
export const UserPermissions = {
	None: 0,
	Normal: 1,
	Moderator: 2,
	Supporter: 4,
	Friend: 8,
	Peppy: 16,
	WorldCupStaff: 32,
} as const

/**
 * Legacy mod flags used by scores.db, osu!.db star ratings, and replay-derived data.
 *
 * This is a flag enum expressed as a const object. Values are intended to be combined
 * with bitwise operations such as `Hidden | HardRock`.
 */
export const Mods = {
	None: 0,
	NoFail: 1, // 1 << 0
	Easy: 2, // 1 << 1
	TouchDevice: 4, // 1 << 2
	Hidden: 8, // 1 << 3
	HardRock: 16, // 1 << 4
	SuddenDeath: 32, // 1 << 5
	DoubleTime: 64, // 1 << 6
	Relax: 128, // 1 << 7
	HalfTime: 256, // 1 << 8
	Nightcore: 512, // 1 << 9
	Flashlight: 1024, // 1 << 10
	Autoplay: 2048, // 1 << 11
	SpunOut: 4096, // 1 << 12
	Autopilot: 8192, // 1 << 13
	Perfect: 16384, // 1 << 14
	Key4: 32768, // 1 << 15
	Key5: 65536, // 1 << 16
	Key6: 131072, // 1 << 17
	Key7: 262144, // 1 << 18
	Key8: 524288, // 1 << 19
	FadeIn: 1048576, // 1 << 20
	Random: 2097152, // 1 << 21
	Cinema: 4194304, // 1 << 22
	TargetPractice: 8388608, // 1 << 23
	Key9: 16777216, // 1 << 24
	KeyCoop: 33554432, // 1 << 25
	Key1: 67108864, // 1 << 26
	Key3: 134217728, // 1 << 27
	Key2: 268435456, // 1 << 28
	ScoreV2: 536870912, // 1 << 29
	Mirror: 1073741824, // 1 << 30
} as const

export type GameplayMode = (typeof GameplayModes)[keyof typeof GameplayModes]
export type RankedStatus = (typeof RankedStatuses)[keyof typeof RankedStatuses]
export type Grade = (typeof Grades)[keyof typeof Grades]
export type UserPermission = (typeof UserPermissions)[keyof typeof UserPermissions]
export type UserPermissionFlags = number
export type Mod = (typeof Mods)[keyof typeof Mods]
export type ModFlags = number

/**
 * A 64-bit .NET DateTime ticks value.
 *
 * One tick is 100 nanoseconds since 0001-01-01T00:00:00Z.
 *
 * The legacy database wiki calls some timestamp fields "Windows ticks", but
 * reference implementations decode the corresponding values as .NET DateTime
 * ticks for unlock dates, beatmap timestamps, and replay timestamps.
 */
export type DateTimeTicks = bigint

/**
 * A pair of legacy mod flags and a star rating value.
 */
export interface IntFloatPair {
	/**
	 * Bitwise combination of mods for which this star rating was computed.
	 */
	mods: ModFlags

	/**
	 * Star rating value stored as a 32-bit float in version 20250107 and later.
	 */
	starRating: number
}

/**
 * A timing point entry stored inside a beatmap entry in osu!.db.
 */
export interface TimingPoint {
	/**
	 * BPM value stored by the database.
	 */
	bpm: number

	/**
	 * Offset into the song, in milliseconds.
	 */
	offsetMs: number

	/**
	 * Raw timing-change flag.
	 *
	 * If false, the timing point is inherited.
	 */
	isUninherited: boolean
}

/**
 * Beatmap metadata cached inside osu!.db.
 */
export interface BeatmapEntry {
	/**
	 * Artist name.
	 */
	artist: string | null

	/**
	 * Artist name in Unicode.
	 */
	artistUnicode: string | null

	/**
	 * Song title.
	 */
	title: string | null

	/**
	 * Song title in Unicode.
	 */
	titleUnicode: string | null

	/**
	 * Creator name.
	 */
	creator: string | null

	/**
	 * Difficulty name such as Hard or Insane.
	 */
	difficultyName: string | null

	/**
	 * Audio file name.
	 */
	audioFileName: string | null

	/**
	 * MD5 hash of the beatmap.
	 */
	md5Hash: string | null

	/**
	 * Name of the corresponding .osu file.
	 */
	osuFileName: string | null

	/**
	 * Ranked status byte.
	 */
	rankedStatus: RankedStatus

	/**
	 * Number of hitcircles.
	 */
	hitCircleCount: number

	/**
	 * Number of sliders.
	 */
	sliderCount: number

	/**
	 * Number of spinners.
	 */
	spinnerCount: number

	/**
	 * Last modification time, in .NET DateTime ticks.
	 */
	lastModificationTime: DateTimeTicks

	/**
	 * Approach rate.
	 */
	approachRate: number

	/**
	 * Circle size.
	 */
	circleSize: number

	/**
	 * HP drain.
	 */
	hpDrain: number

	/**
	 * Overall difficulty.
	 */
	overallDifficulty: number

	/**
	 * Slider velocity.
	 */
	sliderVelocity: number

	/**
	 * Star rating info for osu!standard.
	 */
	standardStarRatings: IntFloatPair[]

	/**
	 * Star rating info for osu!taiko.
	 */
	taikoStarRatings: IntFloatPair[]

	/**
	 * Star rating info for osu!catch.
	 */
	catchStarRatings: IntFloatPair[]

	/**
	 * Star rating info for osu!mania.
	 */
	maniaStarRatings: IntFloatPair[]

	/**
	 * Drain time, in seconds.
	 */
	drainTimeSeconds: number

	/**
	 * Total time, in milliseconds.
	 */
	totalTimeMs: number

	/**
	 * Preview start time in beatmap select, in milliseconds.
	 */
	previewOffsetMs: number

	/**
	 * Timing points attached to this beatmap.
	 */
	timingPoints: TimingPoint[]

	/**
	 * Online difficulty ID.
	 */
	difficultyId: number

	/**
	 * Online beatmap ID.
	 */
	beatmapId: number

	/**
	 * Online thread ID.
	 */
	threadId: number

	/**
	 * Grade achieved in osu!standard.
	 */
	standardGrade: Grade

	/**
	 * Grade achieved in osu!taiko.
	 */
	taikoGrade: Grade

	/**
	 * Grade achieved in osu!catch.
	 */
	catchGrade: Grade

	/**
	 * Grade achieved in osu!mania.
	 */
	maniaGrade: Grade

	/**
	 * Local beatmap offset.
	 */
	localOffset: number

	/**
	 * Stack leniency.
	 */
	stackLeniency: number

	/**
	 * osu! gameplay mode.
	 */
	gameplayMode: GameplayMode

	/**
	 * Song source.
	 */
	source: string | null

	/**
	 * Song tags.
	 */
	tags: string | null

	/**
	 * Online offset.
	 */
	onlineOffset: number

	/**
	 * Font used for the song title.
	 */
	titleFont: string | null

	/**
	 * Whether the beatmap is unplayed.
	 */
	isUnplayed: boolean

	/**
	 * Last time the beatmap was played, in .NET DateTime ticks.
	 */
	lastPlayedAt: DateTimeTicks

	/**
	 * Whether the beatmap is stored in osz2 format.
	 */
	isOsz2: boolean

	/**
	 * Beatmap folder name relative to Songs.
	 */
	beatmapFolderName: string | null

	/**
	 * Last time the beatmap was checked against the osu! repository, in .NET DateTime ticks.
	 */
	lastCheckedAgainstRepositoryAt: DateTimeTicks

	/**
	 * Ignore beatmap sound.
	 */
	ignoreBeatmapSound: boolean

	/**
	 * Ignore beatmap skin.
	 */
	ignoreBeatmapSkin: boolean

	/**
	 * Disable storyboard.
	 */
	disableStoryboard: boolean

	/**
	 * Disable video.
	 */
	disableVideo: boolean

	/**
	 * Visual override.
	 */
	visualOverride: boolean

	/**
	 * An unknown 32-bit integer documented as "Last modification time (?)".
	 */
	lastModificationTimeUnknown: number

	/**
	 * Mania scroll speed.
	 */
	maniaScrollSpeed: number
}

/**
 * Top-level structure of osu!.db for supported versions.
 */
export interface OsuDatabase {
	/**
	 * osu! version such as 20250107.
	 */
	version: number

	/**
	 * Folder count.
	 */
	folderCount: number

	/**
	 * AccountUnlocked. Only false when the account is locked or banned in any way.
	 */
	accountUnlocked: boolean

	/**
	 * Date the account will be unlocked, in .NET DateTime ticks.
	 */
	accountUnlockDate: DateTimeTicks

	/**
	 * Player name.
	 */
	playerName: string | null

	/**
	 * Cached beatmaps.
	 */
	beatmaps: BeatmapEntry[]

	/**
	 * User permission flags.
	 */
	userPermissions: UserPermissionFlags
}

/**
 * A collection entry inside collection.db.
 */
export interface CollectionEntry {
	/**
	 * Name of the collection.
	 */
	name: string | null

	/**
	 * Beatmap MD5 hashes contained in the collection.
	 */
	beatmapMd5Hashes: Array<string | null>
}

/**
 * Top-level structure of collection.db.
 */
export interface CollectionDatabase {
	/**
	 * Database version.
	 */
	version: number

	/**
	 * All collections stored in the database.
	 */
	collections: CollectionEntry[]
}

/**
 * Additional score payload written only for specific mods.
 */
export interface ScoreAdditionalModInfo {
	/**
	 * Total accuracy of all hits for Target Practice.
	 * Divide by the number of targets to obtain the in-game displayed accuracy.
	 */
	targetPracticeAccuracy: number
}

/**
 * A score entry stored in scores.db.
 */
export interface ScoreEntry {
	/**
	 * osu! gameplay mode.
	 */
	gameplayMode: GameplayMode

	/**
	 * Version of this score or replay.
	 */
	version: number

	/**
	 * Beatmap MD5 hash.
	 */
	beatmapMd5Hash: string | null

	/**
	 * Player name.
	 */
	playerName: string | null

	/**
	 * Replay MD5 hash.
	 */
	replayMd5Hash: string | null

	/**
	 * Number of 300s.
	 */
	count300: number

	/**
	 * Number of 100s, 150s, or mode-specific equivalent judgements.
	 */
	count100: number

	/**
	 * Number of 50s or mode-specific equivalent judgements.
	 */
	count50: number

	/**
	 * Number of gekis or max 300s.
	 */
	countGeki: number

	/**
	 * Number of katus or 200s.
	 */
	countKatu: number

	/**
	 * Number of misses.
	 */
	countMiss: number

	/**
	 * Replay score.
	 */
	totalScore: number

	/**
	 * Max combo.
	 */
	maxCombo: number

	/**
	 * Perfect combo flag.
	 */
	perfectCombo: boolean

	/**
	 * Bitwise combination of mods used.
	 */
	mods: ModFlags

	/**
	 * Reserved string field that should always be empty in scores.db.
	 */
	reservedEmptyString: string | null

	/**
	 * Replay timestamp, in .NET DateTime ticks.
	 */
	replayTimestamp: DateTimeTicks

	/**
	 * Reserved 32-bit integer field that should always be 0xffffffff (-1).
	 */
	reservedInt32: number

	/**
	 * Online score ID.
	 */
	onlineScoreId: bigint

	/**
	 * Additional mod information.
	 * Present only if Target Practice is enabled.
	 */
	additionalModInfo?: ScoreAdditionalModInfo
}

/**
 * A beatmap section stored in scores.db.
 */
export interface ScoresBeatmapEntry {
	/**
	 * Beatmap MD5 hash.
	 */
	beatmapMd5Hash: string | null

	/**
	 * Scores stored for this beatmap.
	 */
	scores: ScoreEntry[]
}

/**
 * Top-level structure of scores.db.
 */
export interface ScoresDatabase {
	/**
	 * Database version.
	 */
	version: number

	/**
	 * Beatmap score groups.
	 */
	beatmaps: ScoresBeatmapEntry[]
}
