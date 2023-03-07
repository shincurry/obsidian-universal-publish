import { App, PluginSettingTab, Setting } from 'obsidian';
import { UniversalPublishPlugin } from './UniversalPublishPlugin';

export interface UniversalPublishSettings {
	serverUrl: string;
	includeConfigDir: boolean;
}

export const DEFAULT_SETTINGS: UniversalPublishSettings = {
	serverUrl: '',
	includeConfigDir: false,
}

export class UniversalPublishSettingTab extends PluginSettingTab {
	plugin: UniversalPublishPlugin;

	constructor(app: App, plugin: UniversalPublishPlugin) {
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
