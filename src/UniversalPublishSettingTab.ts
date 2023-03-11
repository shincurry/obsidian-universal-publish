import { App, PluginSettingTab, Setting } from 'obsidian';
import { UniversalPublishPlugin } from './UniversalPublishPlugin';

export interface UniversalPublishSettings {
	serverUrl: string;
	password: string;
	includeConfigDir: boolean;
}

export const DEFAULT_SETTINGS: UniversalPublishSettings = {
	serverUrl: '',
	password: '',
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
			.setDesc('The url of server api.')
			.addText(text => {
				text.inputEl.style.width = "100%";
				text
					.setPlaceholder('Enter your secret')
					.setValue(this.plugin.settings.serverUrl)
					.onChange(async (value) => {
						this.plugin.settings.serverUrl = value;
						await this.plugin.saveSettings();
					});
			})

		new Setting(containerEl)
			.setName('Password')
			.setDesc('The password of server api.')
			.addText(text => {
				text.inputEl.style.width = "100%";
				text.inputEl.type = "password";
				text
					.setPlaceholder('Enter your password')
					.setValue(this.plugin.settings.password || '')
					.onChange(async (value) => {
						this.plugin.settings.password = value;
						await this.plugin.saveSettings();
					});
			})

		new Setting(containerEl)
			.setName('Include Config Directory')
			.setDesc('Whether to include Obsidian Config Directory (.obsidian) When sending content to server. Note that you need to ensure that the server you are using is secure and trusted, as the .obsidian folder may contain authentication information.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.includeConfigDir)
				.onChange(async (value) => {
					this.plugin.settings.includeConfigDir = value;
					await this.plugin.saveSettings();
				}));
	}
}
