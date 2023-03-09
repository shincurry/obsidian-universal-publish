import fs from 'fs';
import util from 'util';
import crypto from 'crypto';

export async function getFileSHA1(filepath: string) {
  const lstat = util.promisify(fs.lstat);
  const readFile = util.promisify(fs.readFile);
  if (!fs.existsSync(filepath)) return null;
  if ((await lstat(filepath)).isDirectory()) return null;
  const file = await readFile(filepath);
  const hashsum = crypto.createHash('sha1');
  hashsum.update(file);
  return hashsum.digest('hex');
}