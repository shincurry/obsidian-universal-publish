import fs from 'fs';
import path from 'path';
import util from 'util';
import { getFileSHA1 } from './getFileSHA1';

export type VaultFileMeta = {
  sha1: string;
  localFilePath: string;
  relativeFilePath: string;
}

export async function getFileMetaList(directory: string, filter?: (filename: string) => boolean): Promise<VaultFileMeta[]> {
  const lstat = util.promisify(fs.lstat);
  const readdir = util.promisify(fs.readdir);

  const list: VaultFileMeta[] = [];
	const helper = async (filename: string) => {
    const relativeFilePath = path.relative(directory, filename);
    if (filter && !filter(relativeFilePath)) return;
    const fileStat = await lstat(filename)
    if (fileStat.isSymbolicLink()) return;
		if (fileStat.isDirectory()) {
			const files = await readdir(filename);
			for (const file of files) {
				const filepath = path.join(filename, file);
				await helper(filepath);
			}
		} else {
      const _sha1 = await getFileSHA1(filename);
      if (_sha1) list.push({ sha1: _sha1, localFilePath: filename, relativeFilePath: relativeFilePath });
		}
	}
	await helper(directory);
  return list;
}
