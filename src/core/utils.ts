import { Mods, type DateTimeTicks, type Mod, type ModFlags } from '../types'

export const TICKS_PER_MILLISECOND = 10_000n
export const UNIX_EPOCH_DATE_TIME_TICKS = 621_355_968_000_000_000n
export const WINDOWS_FILE_TIME_EPOCH_DATE_TIME_TICKS = 504_911_232_000_000_000n

const orderedMods = Object.values(Mods).filter((value) => value !== Mods.None)

/**
 * Converts .NET DateTime ticks to Unix epoch milliseconds.
 */
export function dateTimeTicksToUnixMilliseconds(ticks: DateTimeTicks): bigint {
	return (ticks - UNIX_EPOCH_DATE_TIME_TICKS) / TICKS_PER_MILLISECOND
}

/**
 * Converts Unix epoch milliseconds to .NET DateTime ticks.
 */
export function unixMillisecondsToDateTimeTicks(milliseconds: bigint): DateTimeTicks {
	return milliseconds * TICKS_PER_MILLISECOND + UNIX_EPOCH_DATE_TIME_TICKS
}

/**
 * Converts .NET DateTime ticks to Windows FILETIME ticks.
 *
 * scores.db stores replay timestamps as .NET DateTime ticks, while replay
 * filenames under Data/r use FILETIME ticks starting at 1601-01-01.
 */
export function dateTimeTicksToWindowsFileTimeTicks(ticks: DateTimeTicks): bigint {
	return ticks - WINDOWS_FILE_TIME_EPOCH_DATE_TIME_TICKS
}

/**
 * Converts .NET DateTime ticks to a JavaScript Date.
 *
 * JavaScript Date has millisecond precision, so sub-millisecond tick precision
 * is truncated during conversion.
 */
export function dateTimeTicksToDate(ticks: DateTimeTicks): Date {
	return new Date(Number(dateTimeTicksToUnixMilliseconds(ticks)))
}

/**
 * Converts a JavaScript Date to .NET DateTime ticks.
 *
 * JavaScript Date has millisecond precision, so the resulting tick value will
 * always have its sub-millisecond portion set to zero.
 */
export function dateToDateTimeTicks(date: Date): DateTimeTicks {
	return unixMillisecondsToDateTimeTicks(BigInt(date.getTime()))
}

/**
 * Tests whether all bits from a mod mask are present in the flags value.
 */
export function hasMod(flags: ModFlags, mod: Mod): boolean {
	return (flags & mod) === mod
}

/**
 * Tests whether any bit from a mod mask is present in the flags value.
 */
export function hasAnyMod(flags: ModFlags, modMask: ModFlags): boolean {
	return (flags & modMask) !== 0
}

/**
 * Combines multiple mods into a single bitmask.
 */
export function combineMods(mods: Iterable<Mod>): ModFlags {
	let flags = Mods.None
	for (const mod of mods) {
		flags |= mod
	}
	return flags
}

/**
 * Expands a mod bitmask into its individual mod values.
 */
export function splitMods(flags: ModFlags): Mod[] {
	const result: Mod[] = []
	for (const mod of orderedMods) {
		if (hasMod(flags, mod)) {
			result.push(mod)
		}
	}
	return result
}