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

        const passwordConfirmBox = this.contentEl.createEl('input', { type: 'password' });
        passwordConfirmBox.placeholder = 'Confirm Password';

        const submit = this.contentEl.createEl('button', { 'type': 'submit'});
        submit.className = 'mod-cta';
        submit.setText('Submit');

        submit.onClickEvent(_mouseEvent => {
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
    }

    getPassword(): Option<string> {
        return this.verifiedPassword || null;
    }
}