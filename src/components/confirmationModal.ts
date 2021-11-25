import { App } from 'obsidian';
import InfoModal from './infoModal';

export default class ConfirmationModal extends InfoModal {
  private onConfirm: () => void;
  private onDeny: () => void;

  constructor(app: App, title?: string, body?: string) {
    super(app, title, body);

    // Gotta make sure the callbacks are at least callable functions.
    // Even if they do literally nothing.
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    this.onConfirm = () => { };
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    this.onDeny = () => { };
  }

  setOnConfirm(onConfirmCallback: () => void): void {
    this.onConfirm = onConfirmCallback;
  }

  setOnDeny(onDenyCallBack: () => void): void {
    this.onDeny = onDenyCallBack;
    // Set closing the Modal to be equivalent to denying it
    this.onClose = onDenyCallBack;
  }

  onOpen(): void {
    const buttonGroup = this.contentEl.createDiv();
    buttonGroup.id = 'krypton-button-group';
    
    const deny = buttonGroup.createEl('button');
    deny.id = 'krypton-cancel';
    deny.setText('Cancel');
    
    const confirm = buttonGroup.createEl('button');
    confirm.className = 'mod-cta';
    confirm.setText('Ok');

    deny.onClickEvent(mouseEvent => {
      if (mouseEvent.button !== 0) {
        return;
      }

      this.onDeny();
      this.close();
    });

    confirm.onClickEvent(mouseEvent => {
      if (mouseEvent.button !== 0) {
        return;
      }

      this.onConfirm();
      this.close();
    });
  }
}
