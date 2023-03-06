import { App, FileSystemAdapter, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import util from 'util';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	serverUrl: string;
	includeConfigDir: boolean;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	serverUrl: '',
	includeConfigDir: false,
}

export default class UniPublisherPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		this.addRibbonIcon('send', 'Publish', async (evt: MouseEvent) => {
			if (!this.settings.serverUrl) {
				new UniPublisherNotice('Publish server url not set.');
				return;
			}

			// Called when the user clicks the icon.
			const notice = new UniPublisherNotice('Collecting content...', 60_000);
			const vaultPath = (() => {
				const adapter = app.vault.adapter;
				if (adapter instanceof FileSystemAdapter) {
						return adapter.getBasePath();
				}
				return null;
			})();
			if (!vaultPath) {
				notice.hide();
				new UniPublisherNotice('Vault not found.');
				return;
			}

			const zip = new AdmZip();
			await zipDirectoryInsideRecursive(zip, vaultPath, (filename) => {
				if (filename.endsWith('.DS_Store')) return false;
				if (!this.settings.includeConfigDir && filename.startsWith('.obsidian')) {
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
					mode: 'cors',
				})
				if (response.status === 204) {
					notice.hide();
					new UniPublisherNotice('Published!');
				} else {
					notice.hide();
					new UniPublisherNotice('Publish failed!');
				}
			} catch (error) {
				notice.hide();
				new UniPublisherNotice('Publish failed!');
			}
		});


		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new UniPublisherSettingTab(this.app, this));

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

class UniPublisherSettingTab extends PluginSettingTab {
	plugin: UniPublisherPlugin;

	constructor(app: App, plugin: UniPublisherPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for Universal Publish.'});

		new Setting(containerEl)
			.setName('Server URL')
			.setDesc('The server url of publishing api.')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.serverUrl)
				.onChange(async (value) => {
					this.plugin.settings.serverUrl = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Include Config Directory')
			.setDesc('Whether to include Obsidian Config Directory (.obsidian) When sending content to server.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.includeConfigDir)
				.onChange(async (value) => {
					this.plugin.settings.includeConfigDir = value;
					await this.plugin.saveSettings();
				}));
	}
}

class UniPublisherNotice extends Notice {
	constructor(message: string | DocumentFragment, timeout?: number) {
		super(`Universal Publish: ${message}`, timeout)
	}

	setMessage(message: string | DocumentFragment): this {
		return super.setMessage(`Universal Publish: ${message}`)
	}
}

async function zipDirectoryInsideRecursive(zip: AdmZip, directory: string, filter?: (filename: string) => boolean) {
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
