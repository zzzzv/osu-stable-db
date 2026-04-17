import { describe, expect, it } from 'vitest'

import {
	UNIX_EPOCH_DATE_TIME_TICKS,
	TICKS_PER_MILLISECOND,
	combineMods,
	dateTimeTicksToDate,
	dateTimeTicksToUnixMilliseconds,
	hasAnyMod,
	hasMod,
	splitMods,
	unixMillisecondsToDateTimeTicks,
	dateToDateTimeTicks,
} from '../src/core/utils'
import { Mods } from '../src/types'

describe('core utils', () => {
	it('converts between DateTime ticks and unix milliseconds', () => {
		const ticks = 638804620123450000n
		const milliseconds = dateTimeTicksToUnixMilliseconds(ticks)

		expect(milliseconds).toBe((ticks - UNIX_EPOCH_DATE_TIME_TICKS) / TICKS_PER_MILLISECOND)
		expect(unixMillisecondsToDateTimeTicks(milliseconds)).toBe(ticks)
	})

	it('converts between DateTime ticks and Date at millisecond precision', () => {
		const ticks = 638804620123456789n
		const date = dateTimeTicksToDate(ticks)
		const roundTripTicks = dateToDateTimeTicks(date)

		expect(date.getTime()).toBe(Number(dateTimeTicksToUnixMilliseconds(ticks)))
		expect(roundTripTicks).toBe(638804620123450000n)
	})

	it('combines, checks, and splits mod flags', () => {
		const flags = combineMods([Mods.Hidden, Mods.HardRock, Mods.DoubleTime])

		expect(flags).toBe(Mods.Hidden | Mods.HardRock | Mods.DoubleTime)
		expect(hasMod(flags, Mods.Hidden)).toBe(true)
		expect(hasMod(flags, Mods.HardRock)).toBe(true)
		expect(hasMod(flags, Mods.Flashlight)).toBe(false)
		expect(hasAnyMod(flags, Mods.Flashlight | Mods.DoubleTime)).toBe(true)
		expect(splitMods(flags)).toEqual([Mods.Hidden, Mods.HardRock, Mods.DoubleTime])
	})
})