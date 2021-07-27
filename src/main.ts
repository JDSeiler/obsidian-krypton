import { App, Editor, FileSystemAdapter, FuzzySuggestModal, MarkdownView, Menu, Modal, normalizePath, Notice, Plugin, PluginSettingTab, Setting, TAbstractFile, View } from 'obsidian';
import { decryptWithPassword, encryptWithPassword, setUpSystem } from './encryption';

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

        /*
        Many tasks:
        TODO: Prompt the user for a password instead of hard coding it
        TODO: Create a change password command
        TODO: Write UI code for when passwords don't match, successful encryption, etc.
        TODO: Add a setting for toggling encryption of frontmatter
        PAUSE: Refactor
        TODO: Add a command for encrypting all the files in a directory, recursively.
        */
        this.addCommand({
            id: 'create-encryption-keys',
            name: 'Initial Setup',
            callback: () => {
                // Don't overwrite anything if it already exists, use a separate method for changing password
                const TEST_PASSWORD = 'password';
                const system = setUpSystem(TEST_PASSWORD);
                const saveLocation = this.app.vault.configDir + '/plugins/obsidian-folder-locker/crypto.json';
                // Throws an exception if the file exists, so this is safe currently.
                this.app.vault.create(saveLocation, JSON.stringify(system));
            }
        })

        this.addCommand({
            id: 'encrypt-current-file',
            name: 'Encrypt Current File',
            editorCheckCallback: (checking: boolean, editor: Editor, markdownView: MarkdownView) => {
                if (!checking) {
                    const currentFile = markdownView.file;
                    const meta = this.app.metadataCache.getFileCache(currentFile);
                    const startLine = (meta.frontmatter?.position?.end?.line + 1) || 0;
                    const startPosition = {
                        line: startLine,
                        ch: 0
                    }
                    const endPosition = {
                        line: editor.lineCount(),
                        ch: 0
                    }
                    this.app.vault.configDir
                    const noYaml = editor.getRange(startPosition, endPosition);
                    const storedSystem = this.app.vault.configDir + '/plugins/obsidian-folder-locker/crypto.json';
                    
                    this.app.vault.adapter.read(storedSystem).then(rawJson => {
                        const storedSystem = JSON.parse(rawJson);
                        console.log(rawJson);
                        console.log(storedSystem);
                        
                        const cipherText = encryptWithPassword(noYaml, 'password', storedSystem);
                        editor.replaceRange(cipherText, startPosition, endPosition);
                    });
                }
                return true;
            }
        });

        this.addCommand({
            id: 'decrypt-current-file',
            name: 'Decrypt Current File',
            editorCheckCallback: (checking: boolean, editor: Editor, markdownView: MarkdownView) => {
                if (!checking) {
                    const currentFile = markdownView.file;
                    const meta = this.app.metadataCache.getFileCache(currentFile);
                    const startLine = (meta.frontmatter?.position?.end?.line + 1) || 0;
                    const startPosition = {
                        line: startLine,
                        ch: 0
                    }
                    const endPosition = {
                        line: editor.lineCount(),
                        ch: 0
                    }
                    this.app.vault.configDir
                    const noYamlCiphered = editor.getRange(startPosition, endPosition);
                    const storedSystem = this.app.vault.configDir + '/plugins/obsidian-folder-locker/crypto.json';
                    
                    this.app.vault.adapter.read(storedSystem).then(rawJson => {
                        const storedSystem = JSON.parse(rawJson);
                        console.log(rawJson);
                        console.log(storedSystem);
                        
                        const plainText = decryptWithPassword(noYamlCiphered, 'password', storedSystem);
                        editor.replaceRange(plainText, startPosition, endPosition);
                    });
                }
                return true;
            }
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
