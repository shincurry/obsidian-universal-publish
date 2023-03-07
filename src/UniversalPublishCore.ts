import { App, FileSystemAdapter } from 'obsidian';
import AdmZip from 'adm-zip';
import { zipAddInsideFilesInFolderRecursive } from './utils/zip';
import { UniversalPublishNotice } from './UniversalPublishNotice';
import { UniversalPublishPlugin } from './UniversalPublishPlugin';

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

    const zip = new AdmZip();
    await zipAddInsideFilesInFolderRecursive(zip, vaultPath, (filename) => {
      if (filename.endsWith('.DS_Store')) return false;
      if (!this.plugin.settings.includeConfigDir && filename.startsWith(this.app.vault.configDir)) {
        return false;
      }
      return true;
    });

    notice.setMessage('Publishing content...')

    try {
      const serverURL = new URL("/publish", this.plugin.settings.serverUrl)
      const data = new FormData()
      data.append('file', new File([zip.toBuffer()], "content.zip", {
        type: "application/zip"
      }))
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