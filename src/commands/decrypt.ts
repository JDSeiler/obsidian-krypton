import { Editor, Notice, MarkdownView } from 'obsidian';
import Krypton from 'src/main';
import { editorCheckCallback, isSome, unwrap } from 'src/types';
import { getReplacementRange, pathToCryptoSystem, fileHasFrontmatter } from '../services/files';
import { decryptWithPassword, PasswordVerificationError } from 'src/services/encryption';
import PasswordPromptModal from 'src/components/passwordPromptModal';
import InfoModal from 'src/components/infoModal';

export const decryptCommand = (plugin: Krypton): editorCheckCallback => {
  return (checking: boolean, editor: Editor, markdownView: MarkdownView) => {
    if (!checking) {
      const currentFile = markdownView.file;
      const { start, end } = getReplacementRange(
        plugin.app, 
        editor, 
        currentFile, 
        plugin.settings.encryptFrontmatter
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
      if (fileHasFrontmatter(plugin.app, currentFile) && plugin.settings.encryptFrontmatter) {
        const helpPopup = new InfoModal(plugin.app);
        helpPopup.setTitleText('Krypton Settings Mismatch:');

        const bodyMessage = `The file "${currentFile.name}" contains plaintext frontmatter but the "Encrypt Frontmatter" option is turned on! ` +
        'When "Encrypt Frontmatter" is turned on, Krypton assumes all encrypted files will not contain plaintext frontmatter. ' +
        'To decrypt this file, first turn "Encrypt Frontmatter" off and then rerun the decryption.';
        helpPopup.setBodyText(bodyMessage);

        helpPopup.open();
        return;
      }
      const encryptedText = editor.getRange(start, end);
      const cryptoSystemLocation = pathToCryptoSystem(plugin.app);
      
      plugin.app.vault.adapter.read(cryptoSystemLocation).then(rawJson => {
        const storedSystem = JSON.parse(rawJson);
        
        const passwordPrompt = new PasswordPromptModal(plugin.app);
        passwordPrompt.open();
        
        passwordPrompt.onClose = () => {
          const maybePassword = passwordPrompt.getPassword();
          if (isSome(maybePassword)) {
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
        const helpPopup = new InfoModal(plugin.app);
        helpPopup.setTitleText('Could not open stored key file:');
        helpPopup.setBodyText(
          'Run "Krypton: Intitial Setup" to choose a password ' + 
          'and create encryption keys.'
        );
        helpPopup.open();
      });
    }
    return true;
  };
};
