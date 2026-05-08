import type { BeatmapEntry, OsuDatabase, ScoreEntry, ScoresBeatmapEntry, ScoresDatabase } from '../types'

export interface BeatmapScoresGroupMatch {
	beatmap: BeatmapEntry
	scores: ScoreEntry[]
}

export interface BeatmapScoreMatch {
	beatmap: BeatmapEntry
	score: ScoreEntry
}

export type BeatmapQuerySource = OsuDatabase | BeatmapEntry[]
export type ScoreQuerySource = ScoresDatabase | ScoresBeatmapEntry[]

function getBeatmapEntries(source: BeatmapQuerySource): BeatmapEntry[] {
	return Array.isArray(source) ? source : source.beatmaps
}

function getScoreEntries(source: ScoreQuerySource): ScoresBeatmapEntry[] {
	return Array.isArray(source) ? source : source.beatmaps
}

export function createBeatmapScoreQuery(
	beatmapsSource: BeatmapQuerySource,
	scoresSource: ScoreQuerySource,
) {
	const beatmaps = getBeatmapEntries(beatmapsSource)
	const scoreGroups = getScoreEntries(scoresSource)
	const beatmapByMd5Hash = new Map<string, BeatmapEntry>()

	for (const beatmap of beatmaps) {
		if (beatmap.md5Hash !== null) {
			beatmapByMd5Hash.set(beatmap.md5Hash, beatmap)
		}
	}

	function* iterateBeatmapScoreGroups(): Generator<BeatmapScoresGroupMatch> {
		for (const scoreGroup of scoreGroups) {
			if (scoreGroup.beatmapMd5Hash === null) {
				continue
			}

			const beatmap = beatmapByMd5Hash.get(scoreGroup.beatmapMd5Hash)
			if (beatmap !== undefined) {
				yield { beatmap, scores: scoreGroup.scores }
			}
		}
	}

	function* iterateBeatmapScores(): Generator<BeatmapScoreMatch> {
		for (const { beatmap, scores } of iterateBeatmapScoreGroups()) {
			for (const score of scores) {
				yield { beatmap, score }
			}
		}
	}

	return {
		iterateBeatmapScoreGroups,
		iterateBeatmapScores,
	}
}