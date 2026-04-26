import { describe, expect, it } from 'vitest'

import { BinaryReader, BinaryWriter } from '../src/core/binary'
import { Mods } from '../src/types'

describe('BinaryWriter and BinaryReader', () => {
	it('round-trips DateTime ticks, Int-Float pairs, and timing points', () => {
		const writer = new BinaryWriter()
		writer.writeDateTimeTicks(638804620123456789n)
		writer.writeIntFloatPair({
			mods: Mods.Hidden | Mods.HardRock,
			starRating: 6.73,
		})
		writer.writeTimingPoint({
			bpm: 180,
			offsetMs: 1234.5,
			isUninherited: true,
		})

		const reader = new BinaryReader(writer.toUint8Array())
		expect(reader.readDateTimeTicks()).toBe(638804620123456789n)
		expect(reader.readIntFloatPair()).toEqual({
			mods: Mods.Hidden | Mods.HardRock,
			starRating: expect.closeTo(6.73, 5),
		})
		expect(reader.readTimingPoint()).toEqual({
			bpm: 180,
			offsetMs: 1234.5,
			isUninherited: true,
		})
	})

	it('rejects malformed composite markers', () => {
		const reader = new BinaryReader(Uint8Array.from([0x09, 0, 0, 0, 0, 0x0c, 0, 0, 0, 0]))
		expect(() => reader.readIntFloatPair()).toThrow(/Invalid Int-Float pair int marker/)
	})
})