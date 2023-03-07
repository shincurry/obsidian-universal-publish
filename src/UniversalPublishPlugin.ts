import { App, Plugin, PluginManifest } from 'obsidian';
import { DEFAULT_SETTINGS, UniversalPublishSettingTab } from './UniversalPublishSettingTab';
import type { UniversalPublishSettings } from './UniversalPublishSettingTab';
import { UniversalPublishCore } from './UniversalPublishCore';


export class UniversalPublishPlugin extends Plugin {
	settings: UniversalPublishSettings;
	core: UniversalPublishCore;

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.core = new UniversalPublishCore(app, this);
	}

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		this.addRibbonIcon('send', 'Publish', async (evt: MouseEvent) => {
			await this.core.publish()
		});

		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'publish',
			name: 'Publish content',
			callback: async () => {
				await this.core.publish()
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
