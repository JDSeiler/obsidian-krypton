import Krypton from 'src/main';
import PasswordPromptModal from 'src/components/passwordPromptModal';
import ConfirmationModal from 'src/components/confirmationModal';
import { isSome, unwrap, simpleCallback } from 'src/types';
import { setUpSystem } from 'src/services/encryption';
import { pathToCryptoSystem, pathToPluginFolder } from 'src/services/files';
import { Notice } from 'obsidian';

export const changePasswordCommand = (plugin: Krypton): simpleCallback => {
  return () => {
    const userWarning = 'Once you change your password, all files encrypted with ' +
      'any previous password are IRRECOVERABLE since encryption keys are unique ' +
      'every time you set your password, even if the password itself is the same. ' +
      'So make sure to decrypt ALL files before changing your password.\n\n' +
      'Are you sure you want to continue?';

    const confirmation = new ConfirmationModal(plugin.app, 'WARNING:', userWarning);
    confirmation.setOnConfirm(() => {
      const passwordPrompt = new PasswordPromptModal(plugin.app);
      passwordPrompt.open();
      passwordPrompt.onClose = () => {
        const maybePassword = passwordPrompt.getPassword();
        if (isSome(maybePassword)) {
          const chosenPassword = unwrap(maybePassword);
          const newSystem = setUpSystem(chosenPassword);
          const newCryptoSystemLocation = pathToPluginFolder(plugin.app) + 'crypto-new.json';

          // This should be safe. We only delete the old system if we successfully write 
          // the new file. 
          plugin.app.vault.create(newCryptoSystemLocation, JSON.stringify(newSystem)).then(_newFile => {

            plugin.app.vault.adapter.remove(pathToCryptoSystem(plugin.app));

            // This is the last point of failure I suppose. Though at this point all files
            // are *supposed* to be decrypted by the user so damage would be minimal.
            const test = pathToPluginFolder(plugin.app) + 'crypto.json';
            plugin.app.vault.adapter.copy(newCryptoSystemLocation, test).then(_ok => {
              // .rename wouldn't work, but copy -> remove does? Hmph
              plugin.app.vault.adapter.remove(newCryptoSystemLocation);
              
              new Notice(
                'Password changed'
              );
            }).catch(err => {
              console.error(err);

              new Notice(
                'There was an error finalizing the new encryption keys.\n\n' +
                'The file containing the new encryption keys may need to be renamed to ' +
                '"crypto.json" manually. Check the config directory of this plugin!'
              );
            });
          }).catch(err => {
            console.error(err);

            new Notice(
              'Could not write encryption keys to disk.\n\n' +
              'Old encryption keys not deleted and password not changed.'
            );

            // Clean up!
            plugin.app.vault.adapter.remove(newCryptoSystemLocation);
          });
        } else {
          new Notice(
            'No password chosen or provided password was blank. No encryption keys created.'
          );
        }
      };
    });
    confirmation.open();
  };
};
