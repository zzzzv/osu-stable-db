import { BinaryReader as BaseBinaryReader, BinaryWriter as BaseBinaryWriter } from 'osu-binary'

import type { DateTimeTicks, IntFloatPair, TimingPoint } from '../types'

export class BinaryReader extends BaseBinaryReader {
	public readDateTimeTicks(): DateTimeTicks {
		return this.readInt64()
	}

	public readIntFloatPair(): IntFloatPair {
		const intMarker = this.readByte()
		if (intMarker !== 0x08) {
			throw new Error(`Invalid Int-Float pair int marker 0x${intMarker.toString(16)}.`)
		}

		const mods = this.readInt32()

		const floatMarker = this.readByte()
		if (floatMarker !== 0x0c) {
			throw new Error(`Invalid Int-Float pair float marker 0x${floatMarker.toString(16)}.`)
		}

		return {
			mods,
			starRating: this.readSingle(),
		}
	}

	public readTimingPoint(): TimingPoint {
		return {
			bpm: this.readDouble(),
			offsetMs: this.readDouble(),
			isUninherited: this.readBoolean(),
		}
	}
}

export class BinaryWriter extends BaseBinaryWriter {
	public writeDateTimeTicks(value: DateTimeTicks): void {
		this.writeInt64(value)
	}

	public writeIntFloatPair(value: IntFloatPair): void {
		this.writeByte(0x08)
		this.writeInt32(value.mods)
		this.writeByte(0x0c)
		this.writeSingle(value.starRating)
	}

	public writeTimingPoint(value: TimingPoint): void {
		this.writeDouble(value.bpm)
		this.writeDouble(value.offsetMs)
		this.writeBoolean(value.isUninherited)
	}
}