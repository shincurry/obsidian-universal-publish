import { FileSystemAdapter, Plugin } from 'obsidian';
import AdmZip from 'adm-zip';
import { DEFAULT_SETTINGS, UniversalPublishSettings, UniversalPublishSettingTab } from './UniversalPublishSettingTab';
import { zipAddInsideFilesInFolderRecursive } from './utils/zip';
import { UniversalPublishNotice } from './UniversalPublishNotice';


export class UniversalPublishPlugin extends Plugin {
	settings: UniversalPublishSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		this.addRibbonIcon('send', 'Publish', async (evt: MouseEvent) => {
			if (!this.settings.serverUrl) {
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
				if (!this.settings.includeConfigDir && filename.startsWith(this.app.vault.configDir)) {
					return false;
				}
				return true;
			});

			notice.setMessage('Publishing content...')

			try {
				const serverUrl = new URL("/publish", this.settings.serverUrl)
				const data = new FormData()
				data.append('file', new File([zip.toBuffer()], "content.zip", {
					type: "application/zip"
				}))
				const response = await fetch(serverUrl, {
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
		});


		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new UniversalPublishSettingTab(this.app, this));

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
