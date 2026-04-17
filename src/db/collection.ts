import type { CollectionDatabase, CollectionEntry } from '../types'

import { createReader, createWriter, assertSupportedVersion } from './shared'

export function readCollectionDatabase(input: ArrayBuffer | Uint8Array): CollectionDatabase {
	const reader = createReader(input)
	const version = reader.readInt32()
	assertSupportedVersion(version)

	const collectionCount = reader.readInt32()
	const collections: CollectionEntry[] = []

	for (let index = 0; index < collectionCount; index += 1) {
		const name = reader.readString()
		const beatmapCount = reader.readInt32()
		const beatmapMd5Hashes: Array<string | null> = []

		for (let beatmapIndex = 0; beatmapIndex < beatmapCount; beatmapIndex += 1) {
			beatmapMd5Hashes.push(reader.readString())
		}

		collections.push({
			name,
			beatmapMd5Hashes,
		})
	}

	return {
		version,
		collections,
	}
}

export function writeCollectionDatabase(database: CollectionDatabase): Uint8Array {
	assertSupportedVersion(database.version)

	const writer = createWriter()
	writer.writeInt32(database.version)
	writer.writeInt32(database.collections.length)

	for (const collection of database.collections) {
		writer.writeString(collection.name)
		writer.writeInt32(collection.beatmapMd5Hashes.length)

		for (const beatmapMd5Hash of collection.beatmapMd5Hashes) {
			writer.writeString(beatmapMd5Hash)
		}
	}

	return writer.toUint8Array()
}