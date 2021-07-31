import { Editor, MarkdownView, Menu, Notice, Plugin, TAbstractFile } from 'obsidian';
import { decryptWithPassword, encryptWithPassword, setUpSystem } from './services/encryption';
import FolderSelectionModal from './components/folderSelectionModal'
import PasswordPromptModal from './components/passwordPromptModal';
// The settingsTab has a circular dependency with the Krypton class, but rollup
// seems to be able to handle it just fine.
import KryptonSettingsTab from './components/settingsTab'; 
import { isSome, unwrap } from './types';
import { getReplacementRange, pathToCryptoSystem } from './services/files';

interface KryptonSettings {
    encryptFrontmatter: boolean;
}

const DEFAULT_SETTINGS: KryptonSettings = {
    encryptFrontmatter: true
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
        });

        /*
        Many tasks:
        TODO: Handle when password is wrong
        TODO: Handle when the crypto system doesn't exist 
        TODO: Create a change password command
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
                    const { start, end } = getReplacementRange(
                        this.app, 
                        editor, 
                        currentFile, 
                        this.settings.encryptFrontmatter
                    );
                    const plainText = editor.getRange(start, end);
                    const cryptoSystemLocation = pathToCryptoSystem(this.app);
                    
                    this.app.vault.adapter.read(cryptoSystemLocation).then(rawJson => {
                        const storedSystem = JSON.parse(rawJson);
                        
                        const passwordPrompt = new PasswordPromptModal(this.app);
                        passwordPrompt.open();

                        passwordPrompt.onClose = () => {
                            const maybePassword = passwordPrompt.getPassword();
                            if (isSome(maybePassword)) {
                                console.log(`Submitted: ${maybePassword}`)
                                const cipherText = encryptWithPassword(plainText, unwrap(maybePassword), storedSystem);
                                editor.replaceRange(cipherText, start, end);
                            } else {
                                new Notice('Password was blank or encryption was cancelled');
                            }
                        }
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
                    const { start, end } = getReplacementRange(
                        this.app, 
                        editor, 
                        currentFile, 
                        this.settings.encryptFrontmatter
                    );
                    const encryptedText = editor.getRange(start, end);
                    const cryptoSystemLocation = pathToCryptoSystem(this.app);
                    
                    this.app.vault.adapter.read(cryptoSystemLocation).then(rawJson => {
                        const storedSystem = JSON.parse(rawJson);

                        const passwordPrompt = new PasswordPromptModal(this.app);
                        passwordPrompt.open();

                        passwordPrompt.onClose = () => {
                            const maybePassword = passwordPrompt.getPassword();
                            if (isSome(maybePassword)) {
                                console.log(`Submitted: ${maybePassword}`)
                                const plainText = decryptWithPassword(encryptedText, unwrap(maybePassword), storedSystem);
                                editor.replaceRange(plainText, start, end);
                            } else {
                                new Notice('Password was blank or decryption was cancelled');
                            }
                        }
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



