import { describe, expect, it } from 'vitest'

import { BinaryReader, BinaryWriter } from '../src/core/binary'
import { Mods } from '../src/types'

describe('BinaryWriter and BinaryReader', () => {
	it('round-trips primitive values', () => {
		const writer = new BinaryWriter()
		writer.writeByte(0xab)
		writer.writeBoolean(true)
		writer.writeInt16(-1234)
		writer.writeUInt16(54321)
		writer.writeInt32(-123456789)
		writer.writeUInt32(3456789012)
		writer.writeInt64(638804620123456789n)
		writer.writeSingle(3.5)
		writer.writeDouble(-12.125)

		const reader = new BinaryReader(writer.toUint8Array())
		expect(reader.readByte()).toBe(0xab)
		expect(reader.readBoolean()).toBe(true)
		expect(reader.readInt16()).toBe(-1234)
		expect(reader.readUInt16()).toBe(54321)
		expect(reader.readInt32()).toBe(-123456789)
		expect(reader.readUInt32()).toBe(3456789012)
		expect(reader.readInt64()).toBe(638804620123456789n)
		expect(reader.readSingle()).toBeCloseTo(3.5)
		expect(reader.readDouble()).toBeCloseTo(-12.125)
		expect(reader.remaining).toBe(0)
	})

	it('round-trips ULEB128 values', () => {
		const values = [0, 1, 127, 128, 255, 16384, 624485]
		const writer = new BinaryWriter()

		for (const value of values) {
			writer.writeUleb128(value)
		}

		const reader = new BinaryReader(writer.toUint8Array())
		expect(values.map(() => reader.readUleb128())).toEqual(values)
	})

	it('round-trips null, empty, and utf-8 strings', () => {
		const writer = new BinaryWriter()
		writer.writeString(null)
		writer.writeString('')
		writer.writeString('你好 osu!')

		const reader = new BinaryReader(writer.toUint8Array())
		expect(reader.readString()).toBeNull()
		expect(reader.readString()).toBe('')
		expect(reader.readString()).toBe('你好 osu!')
	})

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