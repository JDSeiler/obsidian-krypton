import { Editor, MarkdownView, Notice, Plugin } from 'obsidian';

import { decryptWithPassword, encryptWithPassword, PasswordVerificationError, setUpSystem } from './services/encryption';
import { getReplacementRange, pathToCryptoSystem, fileHasFrontmatter } from './services/files';

import PasswordPromptModal from './components/passwordPromptModal';
// The settingsTab has a circular dependency with the Krypton class, but rollup
// seems to be able to handle it just fine.
import KryptonSettingsTab from './components/settingsTab'; 
import InfoModal from './components/infoModal';
import { isSome, unwrap } from './types';
import ConfirmationModal from './components/confirmationModal';

interface KryptonSettings {
  encryptFrontmatter: boolean;
}

const DEFAULT_SETTINGS: KryptonSettings = {
  encryptFrontmatter: true
};

export default class Krypton extends Plugin {
  settings: KryptonSettings;
  
  async onload(): Promise<void> {
    console.log('loading plugin');
    
    await this.loadSettings();
    this.addSettingTab(new KryptonSettingsTab(this.app, this));
    
    this.addCommand({
      id: 'create-encryption-keys',
      name: 'Initial Setup',
      callback: () => {
        const userWarning = 'There is NO WAY to recover this password if you lose it. ' +
          'Any files encrypted with this password will be LOST FOREVER if you forget your ' +
          'password or change it, even if you change it back! \n\n' +
          'If you have previously used Initial Setup to create encryption keys, please use the ' +
          '"Krypton: Change Password" command instead.';

        const confirmation = new ConfirmationModal(this.app, 'WARNING:', userWarning);
        confirmation.setOnConfirm(() => {
          const passwordPrompt = new PasswordPromptModal(this.app);
          passwordPrompt.open();
          passwordPrompt.onClose = () => {
            const maybePassword = passwordPrompt.getPassword();
            if (isSome(maybePassword)) {
              const chosenPassword = unwrap(maybePassword);
              const system = setUpSystem(chosenPassword);
              const saveLocation = this.app.vault.configDir + '/plugins/obsidian-folder-locker/crypto.json';
              this.app.vault.create(saveLocation, JSON.stringify(system)).then(_newFile => {
                new Notice('Encryption keys saved succesfully!');
              }).catch(_e => {
                // Most likely a crypto file already exists
                new Notice(
                  'Could not write encryption keys to disk. ' + 
                  'If you have previously created encryption keys, ' + 
                  'please use "Krypton: Change Password" instead.'
                );
              });
            } else {
              new Notice(
                'No password chosen or provided password was blank. No encryption keys created.'
              );
            }
          };
        });
        confirmation.open();
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
                console.log(`Submitted: ${maybePassword}`);
                try {
                  const cipherText = encryptWithPassword(plainText, unwrap(maybePassword), storedSystem);
                  editor.replaceRange(cipherText, start, end);
                } catch (e) {
                  if (e instanceof PasswordVerificationError) {
                    new Notice('Password is incorrect!');
                  } else {
                    // Something really bad or unexpected happened
                    // Dump the error to the console.
                    throw e;
                  }
                }
              } else {
                new Notice('Encryption cancelled');
              }
            };
          }).catch(_e => {
            const helpPopup = new InfoModal(this.app);
            helpPopup.setTitleText('Could not open stored key file:');
            helpPopup.setBodyText(
              'Run "Krypton: Intitial Setup" to choose a password ' + 
              'and create encryption keys.'
            );
            helpPopup.open();
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
          /*
          BUG:
          1. File is encrypted with `encryptFrontmatter` to false
          2. User changes setting to True
          3. Decryption is attempted
          
          The encryption service is expecting a hex string and chokes
          on the unencrypted characters.
          
          This problem doesn't exist the other way. If you encrypt the
          entire file and then decrypt with `encryptFrontMatter` set
          to false, the file decrypts normally.
          
          The following check should address the issue: Simply don't
          allow decryption if the setting is set incorrectly.
          */
          if (fileHasFrontmatter(this.app, currentFile) && this.settings.encryptFrontmatter) {
            const helpPopup = new InfoModal(this.app);
            helpPopup.setTitleText('Krypton Settings Mismatch:');

            const bodyMessage = `The file "${currentFile.name}" contains plaintext frontmatter but the "Encrypt Frontmatter" option is turned on! ` +
            'When "Encrypt Frontmatter" is turned on, Krypton assumes all encrypted files will not contain plaintext frontmatter. ' +
            'To decrypt this file, first turn "Encrypt Frontmatter" off and then rerun the decryption.';
            helpPopup.setBodyText(bodyMessage);

            helpPopup.open();
            return;
          }
          const encryptedText = editor.getRange(start, end);
          const cryptoSystemLocation = pathToCryptoSystem(this.app);
          
          this.app.vault.adapter.read(cryptoSystemLocation).then(rawJson => {
            const storedSystem = JSON.parse(rawJson);
            
            const passwordPrompt = new PasswordPromptModal(this.app);
            passwordPrompt.open();
            
            passwordPrompt.onClose = () => {
              const maybePassword = passwordPrompt.getPassword();
              if (isSome(maybePassword)) {
                console.log(`Submitted: ${maybePassword}`);
                try {
                  const plainText = decryptWithPassword(encryptedText, unwrap(maybePassword), storedSystem);
                  editor.replaceRange(plainText, start, end);
                } catch (e) {
                  if (e instanceof PasswordVerificationError) {
                    new Notice('Password is incorrect!');
                  } else {
                    // Something really bad or unexpected happened
                    // Dump the error to the console.
                    throw e;
                  }
                }
              } else {
                new Notice('Decryption cancelled');
              }
            };
          }).catch(_e => {
            const helpPopup = new InfoModal(this.app);
            helpPopup.setTitleText('Could not open stored key file:');
            helpPopup.setBodyText(
              'Run "Krypton: Intitial Setup" to choose a password ' + 
              'and create encryption keys.'
            );
            helpPopup.open();
          });
        }
        return true;
      }
    });
  }
  
  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  
  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
