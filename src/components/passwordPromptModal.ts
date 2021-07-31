import { App, Modal, Notice } from 'obsidian';
import { Option } from 'src/types';

export default class PasswordPromptModal extends Modal {
    private verifiedPassword: string;
    private passwordBox: HTMLInputElement;
    private passwordConfirmBox: HTMLInputElement;

    constructor(app: App) {
        super(app);
        this.titleEl.setText('Enter your password');
    }

    onOpen() {
        /*
        ===============
        Create Elements
        ===============
        */
        this.passwordBox = this.contentEl.createEl('input', { type: 'password' });
        this.passwordBox.placeholder = 'Password';
        this.passwordBox.className = 'krypton-pw-input';
        this.passwordBox.id = 'krypton-pw';

        this.passwordConfirmBox = this.contentEl.createEl('input', { type: 'password' });
        this.passwordConfirmBox.placeholder = 'Confirm Password';
        this.passwordConfirmBox.className = 'krypton-pw-input';
        this.passwordConfirmBox.id = 'krypton-pw-confirm';''

        const buttonGroup = this.contentEl.createDiv();
        buttonGroup.id = 'krypton-button-group';

        const cancel = buttonGroup.createEl('button');
        cancel.id = 'krypton-cancel';
        cancel.setText('Cancel');

        const submit = buttonGroup.createEl('button', { 'type': 'submit'});
        submit.className = 'mod-cta';
        submit.setText('Submit');

        /*
        ========================
        Register Event Listeners
        ========================
        */

        this.passwordBox.onkeypress = (kbEvent) => {
            if (kbEvent.key === 'Enter') {
                this.passwordConfirmBox.focus();
            }
        }

        this.passwordConfirmBox.onkeypress = (kbEvent) => {
            if (kbEvent.key === 'Enter') {
                this.submitPassword();
            }
        }

        submit.onClickEvent(mouseEvent => {
            // If not a left click, ignore the event
            if (mouseEvent.button !== 0) {
                return;
            }

            this.submitPassword();
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

    private submitPassword(): void {
        const password = this.passwordBox.value;
        const confirmPassword = this.passwordConfirmBox.value;

        if (password === confirmPassword) {
            this.verifiedPassword = password;
            this.close();
        } else {
            new Notice('Passwords do not match!');
            this.passwordBox.value = '';
            this.passwordConfirmBox.value = '';
        }
    }
}