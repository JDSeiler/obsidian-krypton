import { Notice } from 'obsidian';
import Krypton from 'src/main';
import { isSome, simpleCallback, unwrap } from 'src/types';
import { setUpSystem } from 'src/services/encryption';
import PasswordPromptModal from 'src/components/passwordPromptModal';
import ConfirmationModal from 'src/components/confirmationModal';
import { pathToCryptoSystem } from 'src/services/files';

export const intialSetupCommand = (plugin: Krypton): simpleCallback => {
  return () => {
    const userWarning = 'There is NO WAY to recover the plugin password if you lose it. ' +
      'Any files encrypted with the plugin password will be LOST FOREVER if you forget your ' +
      'password or change it, even if you change it back! \n\n' +
      'If you have previously used Initial Setup to create encryption keys, please use the ' +
      '"Krypton: Change Password" command instead.';

    const confirmation = new ConfirmationModal(plugin.app, 'WARNING:', userWarning);
    confirmation.setOnConfirm(() => {
      const passwordPrompt = new PasswordPromptModal(plugin.app);
      passwordPrompt.open();
      passwordPrompt.onClose = () => {
        const maybePassword = passwordPrompt.getPassword();
        if (isSome(maybePassword)) {
          const chosenPassword = unwrap(maybePassword);
          const system = setUpSystem(chosenPassword);
          const saveLocation = pathToCryptoSystem(plugin.app);

          plugin.app.vault.create(saveLocation, JSON.stringify(system)).then(_newFile => {
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
  };
};
