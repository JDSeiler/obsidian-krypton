import { App, PluginSettingTab, Setting } from 'obsidian';
import Krypton from 'src/main';

export default class KryptonSettingsTab extends PluginSettingTab {
    plugin: Krypton;

    constructor(app: App, plugin: Krypton) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        let {containerEl} = this;

        containerEl.empty();

        containerEl.createEl('h2', {text: 'Krypton Settings'});

        new Setting(containerEl)
            .setName('Encrypt Frontmatter')
            .setDesc('When turned on, Krypton will also encrypt the frontmatter of your notes. Turn off to leave frontmatter unencrypted.')
            .addToggle(toggle => {
               toggle
                .setValue(this.plugin.settings.encryptFrontmatter)
                .setTooltip('Encrypt Frontmatter')
                .onChange(async (value) => {
                    this.plugin.settings.encryptFrontmatter = value;
                    await this.plugin.saveSettings();
                });
            });
    }
}