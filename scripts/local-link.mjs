import { existsSync } from 'node:fs'
import { lstat, mkdir, realpath, rm, symlink } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const localDir = resolve(workspaceRoot, 'tests/files/local')
const linkPath = resolve(localDir, 'osu!')
const requestedTarget = process.argv[2] ?? process.env.OSU_STABLE_DIR

if (requestedTarget === undefined) {
	throw new Error('Usage: pnpm run local:link -- "C:\\path\\to\\osu!"')
}

const targetPath = resolve(requestedTarget)

if (!existsSync(targetPath)) {
	throw new Error(`Target folder does not exist: ${targetPath}`)
}

await mkdir(localDir, { recursive: true })

if (existsSync(linkPath)) {
	const stats = await lstat(linkPath)
	if (!stats.isSymbolicLink()) {
		throw new Error(`Refusing to replace non-link path: ${linkPath}`)
	}

	const existingTarget = resolve(await realpath(linkPath))
	if (existingTarget === targetPath) {
		console.log(`Local osu! link already points to ${targetPath}`)
		process.exit(0)
	}

	await rm(linkPath, { recursive: true, force: true })
}

await symlink(targetPath, linkPath, process.platform === 'win32' ? 'junction' : 'dir')

console.log(`Linked ${linkPath} -> ${targetPath}`)