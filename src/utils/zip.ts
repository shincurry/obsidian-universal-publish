import AdmZip from "adm-zip";
import fs from 'fs';
import path from 'path';
import util from 'util';

export async function zipAddInsideFilesInFolderRecursive(zip: AdmZip, directory: string, filter?: (filename: string) => boolean) {
	const helper = async (filename: string) => {
		const lstat = util.promisify(fs.lstat);
		const readdir = util.promisify(fs.readdir);
		const zipFile = path.relative(directory, filename);
		const zipDir = path.dirname(path.relative(directory, filename))
		if (filter && !filter(zipFile)) return;
		if ((await lstat(filename)).isDirectory()) {
			const files = await readdir(filename);
			for (const file of files) {
				const filepath = path.join(filename, file);
				await helper(filepath);
			}
		} else {
			zip.addLocalFile(filename, zipDir === '.' ? undefined : zipDir);
		}
	}
	await helper(directory);
}
