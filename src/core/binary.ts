import type { DateTimeTicks, IntFloatPair, TimingPoint } from '../types'

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder('utf-8', { ignoreBOM: true })

function toUint8Array(input: ArrayBuffer | Uint8Array): Uint8Array {
	return input instanceof Uint8Array ? input : new Uint8Array(input)
}

export class BinaryReader {
	private readonly bytes: Uint8Array
	private readonly view: DataView
	private offset = 0

	public constructor(input: ArrayBuffer | Uint8Array) {
		this.bytes = toUint8Array(input)
		this.view = new DataView(this.bytes.buffer, this.bytes.byteOffset, this.bytes.byteLength)
	}

	public get position(): number {
		return this.offset
	}

	public get length(): number {
		return this.bytes.byteLength
	}

	public get remaining(): number {
		return this.length - this.offset
	}

	public readByte(): number {
		this.ensureAvailable(1)
		const value = this.view.getUint8(this.offset)
		this.offset += 1
		return value
	}

	public readBoolean(): boolean {
		return this.readByte() !== 0
	}

	public readInt16(): number {
		this.ensureAvailable(2)
		const value = this.view.getInt16(this.offset, true)
		this.offset += 2
		return value
	}

	public readUInt16(): number {
		this.ensureAvailable(2)
		const value = this.view.getUint16(this.offset, true)
		this.offset += 2
		return value
	}

	public readInt32(): number {
		this.ensureAvailable(4)
		const value = this.view.getInt32(this.offset, true)
		this.offset += 4
		return value
	}

	public readUInt32(): number {
		this.ensureAvailable(4)
		const value = this.view.getUint32(this.offset, true)
		this.offset += 4
		return value
	}

	public readInt64(): bigint {
		this.ensureAvailable(8)
		const value = this.view.getBigInt64(this.offset, true)
		this.offset += 8
		return value
	}

	public readSingle(): number {
		this.ensureAvailable(4)
		const value = this.view.getFloat32(this.offset, true)
		this.offset += 4
		return value
	}

	public readDouble(): number {
		this.ensureAvailable(8)
		const value = this.view.getFloat64(this.offset, true)
		this.offset += 8
		return value
	}

	public readDateTimeTicks(): DateTimeTicks {
		return this.readInt64()
	}

	public readBytes(length: number): Uint8Array {
		if (!Number.isInteger(length) || length < 0) {
			throw new RangeError(`Byte length must be a non-negative integer, got ${length}.`)
		}

		this.ensureAvailable(length)
		const value = this.bytes.slice(this.offset, this.offset + length)
		this.offset += length
		return value
	}

	public readUleb128(): number {
		let value = 0
		let shift = 0

		while (true) {
			const byte = this.readByte()
			value |= (byte & 0x7f) << shift

			if ((byte & 0x80) === 0) {
				return value
			}

			shift += 7
			if (shift > 35) {
				throw new RangeError('ULEB128 value is too large for a JavaScript number.')
			}
		}
	}

	public readString(): string | null {
		const marker = this.readByte()

		if (marker === 0x00) {
			return null
		}

		if (marker !== 0x0b) {
			throw new Error(`Invalid string marker 0x${marker.toString(16)}.`)
		}

		const length = this.readUleb128()
		const value = this.readBytes(length)
		return textDecoder.decode(value)
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

	private ensureAvailable(byteLength: number): void {
		if (this.offset + byteLength > this.length) {
			throw new RangeError(
				`Attempted to read ${byteLength} byte(s) at offset ${this.offset}, but only ${this.remaining} remain.`,
			)
		}
	}
}

export class BinaryWriter {
	private buffer: ArrayBuffer
	private view: DataView
	private bytes: Uint8Array
	private offset = 0

	public constructor(initialCapacity = 64) {
		if (!Number.isInteger(initialCapacity) || initialCapacity <= 0) {
			throw new RangeError(`Initial capacity must be a positive integer, got ${initialCapacity}.`)
		}

		this.buffer = new ArrayBuffer(initialCapacity)
		this.view = new DataView(this.buffer)
		this.bytes = new Uint8Array(this.buffer)
	}

	public get position(): number {
		return this.offset
	}

	public writeByte(value: number): void {
		this.ensureCapacity(1)
		this.view.setUint8(this.offset, value)
		this.offset += 1
	}

	public writeBoolean(value: boolean): void {
		this.writeByte(value ? 1 : 0)
	}

	public writeInt16(value: number): void {
		this.ensureCapacity(2)
		this.view.setInt16(this.offset, value, true)
		this.offset += 2
	}

	public writeUInt16(value: number): void {
		this.ensureCapacity(2)
		this.view.setUint16(this.offset, value, true)
		this.offset += 2
	}

	public writeInt32(value: number): void {
		this.ensureCapacity(4)
		this.view.setInt32(this.offset, value, true)
		this.offset += 4
	}

	public writeUInt32(value: number): void {
		this.ensureCapacity(4)
		this.view.setUint32(this.offset, value, true)
		this.offset += 4
	}

	public writeInt64(value: bigint): void {
		this.ensureCapacity(8)
		this.view.setBigInt64(this.offset, value, true)
		this.offset += 8
	}

	public writeSingle(value: number): void {
		this.ensureCapacity(4)
		this.view.setFloat32(this.offset, value, true)
		this.offset += 4
	}

	public writeDouble(value: number): void {
		this.ensureCapacity(8)
		this.view.setFloat64(this.offset, value, true)
		this.offset += 8
	}

	public writeDateTimeTicks(value: DateTimeTicks): void {
		this.writeInt64(value)
	}

	public writeBytes(value: Uint8Array): void {
		this.ensureCapacity(value.byteLength)
		this.bytes.set(value, this.offset)
		this.offset += value.byteLength
	}

	public writeUleb128(value: number): void {
		if (!Number.isInteger(value) || value < 0) {
			throw new RangeError(`ULEB128 value must be a non-negative integer, got ${value}.`)
		}

		let remaining = value
		do {
			let byte = remaining & 0x7f
			remaining >>>= 7
			if (remaining !== 0) {
				byte |= 0x80
			}
			this.writeByte(byte)
		} while (remaining !== 0)
	}

	public writeString(value: string | null): void {
		if (value === null) {
			this.writeByte(0x00)
			return
		}

		this.writeByte(0x0b)
		const encoded = textEncoder.encode(value)
		this.writeUleb128(encoded.byteLength)
		this.writeBytes(encoded)
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

	public toUint8Array(): Uint8Array {
		return this.bytes.slice(0, this.offset)
	}

	private ensureCapacity(additionalBytes: number): void {
		const required = this.offset + additionalBytes
		if (required <= this.buffer.byteLength) {
			return
		}

		let nextCapacity = this.buffer.byteLength
		while (nextCapacity < required) {
			nextCapacity *= 2
		}

		const nextBuffer = new ArrayBuffer(nextCapacity)
		const nextBytes = new Uint8Array(nextBuffer)
		nextBytes.set(this.bytes.subarray(0, this.offset))

		this.buffer = nextBuffer
		this.bytes = nextBytes
		this.view = new DataView(nextBuffer)
	}
}