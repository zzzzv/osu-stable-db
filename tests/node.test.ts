import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { OsuFolder } from '../src/node'

const linkedLocalDir = join(process.cwd(), 'tests', 'files', 'local', 'osu!')
const missingLinkedLocalDirMessage = 'Missing tests/files/local/osu! link. Run pnpm run local:link -- "C:\\path\\to\\osu!".'
const requiredSampleCount = 10

function getLinkedLocalFolder(context: { skip: (message?: string) => never }): OsuFolder {
	if (!existsSync(linkedLocalDir)) {
		context.skip(missingLinkedLocalDirMessage)
	}

	return new OsuFolder(linkedLocalDir)
}

function warnIfSampleCountIsShort(label: string, count: number): void {
	if (count < requiredSampleCount) {
		console.warn(`Expected ${requiredSampleCount} ${label}, but only found ${count} in the linked local database.`)
	}
}

describe('node osu folder helper', () => {
	it('resolves existing osu files for the last 10 beatmaps from the linked local database', async (context) => {
		const folder = getLinkedLocalFolder(context)
		const osu = await folder.readOsuDatabase()
		const lastBeatmaps = osu.beatmaps.slice(-requiredSampleCount)

		warnIfSampleCountIsShort('beatmaps', lastBeatmaps.length)
		expect(lastBeatmaps.length).toBeGreaterThan(0)

		for (const beatmap of lastBeatmaps) {
			const beatmapPath = folder.getOsuFilePath(beatmap)
			expect(existsSync(beatmapPath), beatmapPath).toBe(true)
		}
	})

	it('resolves existing osr files for the last 10 scores from the linked local database', async (context) => {
		const folder = getLinkedLocalFolder(context)
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