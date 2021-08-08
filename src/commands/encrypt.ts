import { Editor, Notice, MarkdownView } from 'obsidian';
import Krypton from 'src/main';
import { editorCheckCallback, isSome, unwrap } from 'src/types';
import { getReplacementRange, pathToCryptoSystem } from '../services/files';
import { encryptWithPassword, PasswordVerificationError } from 'src/services/encryption';
import PasswordPromptModal from 'src/components/passwordPromptModal';
import InfoModal from 'src/components/infoModal';

export const encryptCommand = (plugin: Krypton): editorCheckCallback => {
  return (checking: boolean, editor: Editor, markdownView: MarkdownView) => {
    if (!checking) {
      const currentFile = markdownView.file;
      const { start, end } = getReplacementRange(
        plugin.app,
        editor,
        currentFile,
        plugin.settings.encryptFrontmatter
      );
      const plainText = editor.getRange(start, end);
      const cryptoSystemLocation = pathToCryptoSystem(plugin.app);
  
      plugin.app.vault.adapter.read(cryptoSystemLocation).then(rawJson => {
        const storedSystem = JSON.parse(rawJson);
  
        const passwordPrompt = new PasswordPromptModal(plugin.app);
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
