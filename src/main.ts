import { Editor, MarkdownView, Menu, Plugin, TAbstractFile } from 'obsidian';
import { decryptWithPassword, encryptWithPassword, setUpSystem } from './services/encryption';
import FolderSelectionModal from './components/folderSelectionModal'
import PasswordPromptModal from './components/passwordPromptModal';
// The settingsTab has a circular dependency with the Krypton class, but rollup
// seems to be able to handle it just fine.
import KryptonSettingsTab from './components/settingsTab'; 
import { isSome } from './types';

interface KryptonSettings {
    mySetting: string;
}

const DEFAULT_SETTINGS: KryptonSettings = {
    mySetting: 'default'
}

export default class Krypton extends Plugin {
    settings: KryptonSettings;

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

        this.addCommand({
            id: 'modal-test',
            name: 'Modal Test',
            callback: () => {
                const passwordPrompt = new PasswordPromptModal(this.app);
                passwordPrompt.open();
                passwordPrompt.onClose = () => {
                    const maybePassword = passwordPrompt.getPassword();
                    if (isSome(maybePassword)) {
                        console.log(`Submitted: ${maybePassword}`)
                    } else {
                        console.log('Nothing was submitted or passwords did not match');
                    }
                }
            }
        })

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
        });

        this.addCommand({
            id: 'encrypt-current-file',
            name: 'Encrypt Current File',
            editorCheckCallback: (checking: boolean, editor: Editor, markdownView: MarkdownView) => {
                if (!checking) {
                    const currentFile = markdownView.file;
                    const meta = this.app.metadataCache.getFileCache(currentFile);
                    const startLine = (meta?.frontmatter?.position?.end?.line || -1) + 1;
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
                    const startLine = (meta?.frontmatter?.position?.end?.line || -1) + 1;
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

        this.addCommand({
            id: 'create-locker',
            name: 'Create Locker',
            callback: () => {
                new FolderSelectionModal(this.app).open();
            }
        });  

        this.addSettingTab(new KryptonSettingsTab(this.app, this));
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



