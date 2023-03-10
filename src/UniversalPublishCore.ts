import { App, FileSystemAdapter } from 'obsidian';
import { UniversalPublishNotice } from './UniversalPublishNotice';
import { UniversalPublishPlugin } from './UniversalPublishPlugin';
import { getFileMetaList } from './utils/file';
import fs from 'fs';
import path from 'path';
import util from 'util';
import JSZip from 'jszip';

const readFile = util.promisify(fs.readFile);

export type VaultFile = {
  sha1: string;
  path: string;
}

export class UniversalPublishCore {

  protected app: App;
  protected plugin: UniversalPublishPlugin;

	constructor(app: App, plugin: UniversalPublishPlugin) {
    this.app = app;
		this.plugin = plugin;
	}

  public async publish() {
    if (this._isPublishing) return;
    this._isPublishing = true;
    await this._publish();
    this._isPublishing = false;
  }

  private _isPublishing = false;

  private async _publish() {
    if (!this.plugin.settings.serverUrl) {
      new UniversalPublishNotice('Publish server url not set.');
      return;
    }

    // Called when the user clicks the icon.
    const notice = new UniversalPublishNotice('Collecting content...', 60_000);
    const vaultPath = (() => {
      const adapter = app.vault.adapter;
      if (adapter instanceof FileSystemAdapter) {
          return adapter.getBasePath();
      }
      return null;
    })();
    if (!vaultPath) {
      notice.hide();
      new UniversalPublishNotice('Vault not found.');
      return;
    }

    const fileMetaList = await getFileMetaList(vaultPath, (filename: string) => {
      if (filename.endsWith('.DS_Store')) return false;
      if (!this.plugin.settings.includeConfigDir && filename.startsWith(this.app.vault.configDir)) {
        return false;
      }
      return true;
    })
    const prepared = await (async (): Promise<{ diff: { cached: VaultFile[]; uncached: VaultFile[] } } | null> => {
      try {
        const serverURL = new URL("/publish/prepare", this.plugin.settings.serverUrl)
        const filelist = fileMetaList.map((i) => ({ sha1: i.sha1, path: i.relativeFilePath }))
        const response = await fetch(serverURL, {
          method: "POST",
          body: JSON.stringify({ filelist }),
          headers: {
            "Content-Type": "application/json",
          },
        })
        if (response.ok) {
          return await response.json()
        } else {
          return null
        }
      } catch (error) {
        return null
      }
    })()
    const uncachedSha1ListSet = new Set<string>(prepared?.diff.uncached.map((i) => i.sha1))
    const uncachedFileList = fileMetaList.filter((meta) => {
      return uncachedSha1ListSet.has(meta.sha1);
    })

    const zip = new JSZip();
    for (const meta of uncachedFileList) {
      const buffer = await readFile(meta.localFilePath)
      meta.relativeFilePath.split(path.sep).join('/')
      zip.file(meta.relativeFilePath, buffer)
    }

    notice.setMessage('Publishing content...')

    try {
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
      const serverURL = new URL("/publish", this.plugin.settings.serverUrl)
      const data = new FormData()
      data.append('zippack', new File([zipBuffer], "content.zip", {
        type: "application/zip"
      }))
      if (prepared?.diff) data.append('diff', JSON.stringify(prepared.diff))
      const response = await fetch(serverURL, {
        method: "POST",
        body: data,
      })
      if (response.ok) {
        notice.hide();
        new UniversalPublishNotice('Published!');
      } else {
        notice.hide();
        new UniversalPublishNotice('Publish failed!');
      }
    } catch (error) {
      notice.hide();
      new UniversalPublishNotice('Publish failed!');
    }
  }
}