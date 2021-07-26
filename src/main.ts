import { App, FileSystemAdapter, FuzzySuggestModal, Menu, Modal, normalizePath, Notice, Plugin, PluginSettingTab, Setting, TAbstractFile, View } from 'obsidian';

interface MyPluginSettings {
    mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
    mySetting: 'default'
}

export default class MyPlugin extends Plugin {
    settings: MyPluginSettings;

    async onload() {
        console.log('loading plugin');

        await this.loadSettings();

        // Adding a context menu item
        this.app.workspace.on('file-menu', (menu: Menu, file: TAbstractFile, source: string) => {
            console.log(menu);
            menu.addItem((testItem) => {
                testItem.setTitle('My menu item')
                testItem.onClick(_e => {
                    console.log(file);
                });
            });
        });

        this.addRibbonIcon('dice', 'Sample Plugin', () => {
            new Notice('This is a notice!');
        });

        this.addStatusBarItem().setText('Status Bar Text');

        this.addCommand({
            id: 'open-sample-modal',
            name: 'Open Sample Modal',
            checkCallback: (checking: boolean) => {
                let leaf = this.app.workspace.activeLeaf;
                if (leaf) {
                    if (!checking) {
                        new SampleModal(this.app).open();
                    }
                    return true;
                }
                return false;
            }
        });

        this.addCommand({
            id: 'create-locker',
            name: 'Create Locker',
            callback: () => {
                new FileSelectorModal(this.app).open();
            }
        });  

        this.addSettingTab(new SampleSettingTab(this.app, this));
    }

    onunload() {
        console.log('unloading plugin');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class SampleModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    onOpen() {
        let {contentEl} = this;
        contentEl.setText('Woah!');
    }

    onClose() {
        let {contentEl} = this;
        contentEl.empty();
    }
}

class FileSelectorModal extends FuzzySuggestModal<string> {
    // List of all folders that contain files
    folderList: string[] = [];
    limit = 10;

    constructor(app: App) {
        super(app);
        this.setPlaceholder('Create locker in...');

        let visited: {
            [k: string]: boolean
        } = {};
        this.app.vault.getFiles().forEach(file => {
            if (!file.parent.isRoot() && !visited[file.parent.path]) {
                this.folderList.push('./' + file.path.split('/').slice(0, -1).join('/'));
                visited[file.parent.path] = true;
            }
        });
    }

    getItems(): string[] {
        return this.folderList;
    }

    getItemText(item: string): string {
        return item;
    }

    onChooseItem(item: string, _evt: MouseEvent | KeyboardEvent): void {
        console.log(`${item} was chosen!`);
        const fsAdap = this.app.vault.adapter as FileSystemAdapter;
        const fullPath = fsAdap.getFullPath(normalizePath(item));
        console.log(fullPath);
    }
}

class SampleSettingTab extends PluginSettingTab {
    plugin: MyPlugin;

    constructor(app: App, plugin: MyPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        let {containerEl} = this;

        containerEl.empty();

        containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

        new Setting(containerEl)
            .setName('Setting #1')
            .setDesc('It\'s a secret')
            .addText(text => text
                .setPlaceholder('Enter your secret')
                .setValue('')
                .onChange(async (value) => {
                    console.log('Secret: ' + value);
                    this.plugin.settings.mySetting = value;
                    await this.plugin.saveSettings();
                }));
    }
}
