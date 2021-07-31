import { App, Modal, Notice } from 'obsidian';
import { Option } from 'src/types';

export default class PasswordPromptModal extends Modal {
    private verifiedPassword: string;

    constructor(app: App) {
        super(app);
        this.titleEl.setText('Enter your password');
    }

    onOpen() {
        const passwordBox = this.contentEl.createEl('input', { type: 'password' });
        passwordBox.placeholder = 'Password';
        passwordBox.className = 'krypton-pw-input';
        passwordBox.id = 'krypton-pw';

        const passwordConfirmBox = this.contentEl.createEl('input', { type: 'password' });
        passwordConfirmBox.placeholder = 'Confirm Password';
        passwordConfirmBox.className = 'krypton-pw-input';
        passwordConfirmBox.id = 'krypton-pw-confirm';''

        const buttonGroup = this.contentEl.createDiv();
        buttonGroup.id = 'krypton-button-group';

        const cancel = buttonGroup.createEl('button');
        cancel.id = 'krypton-cancel';
        cancel.setText('Cancel');

        const submit = buttonGroup.createEl('button', { 'type': 'submit'});
        submit.className = 'mod-cta';
        submit.setText('Submit');

        submit.onClickEvent(mouseEvent => {
            // If not a left click, ignore the event
            if (mouseEvent.button !== 0) {
                return;
            }
            const password = passwordBox.value;
            const confirmPassword = passwordConfirmBox.value;

            if (password === confirmPassword) {
                this.verifiedPassword = password;
                this.close();
            } else {
                new Notice('Passwords do not match!');
                passwordBox.value = '';
                passwordConfirmBox.value = '';
            }
        });

        cancel.onClickEvent(mouseEvent => {
            if (mouseEvent.button !== 0) {
                return;
            }

            this.verifiedPassword = '';
            this.close();
        });
    }

    getPassword(): Option<string> {
        return this.verifiedPassword || null;
    }
}