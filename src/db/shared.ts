import { BinaryReader, BinaryWriter } from '../core/binary'
import { MINIMUM_SUPPORTED_VERSION } from '../types'

export function createReader(input: ArrayBuffer | Uint8Array): BinaryReader {
	return new BinaryReader(input)
}

export function createWriter(): BinaryWriter {
	return new BinaryWriter()
}

export function assertSupportedVersion(version: number): void {
	if (version < MINIMUM_SUPPORTED_VERSION) {
		throw new RangeError(
			`Unsupported legacy database version ${version}. Minimum supported version is ${MINIMUM_SUPPORTED_VERSION}.`,
		)
	}
}