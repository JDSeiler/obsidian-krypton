import  { App, Modal } from 'obsidian';

export default class InfoModal extends Modal {
  constructor(app: App, title?: string, body?: string) {
    super(app);
    if (title) {
      this.setTitleText(title);
    }

    if (body) {
      this.setBodyText(body);
    }
  }

  setTitleText(content: string): void {
    this.titleEl.setText(content);
  }

  setBodyText(content: string): void {
    const textContainer = this.contentEl.createSpan();
    textContainer.setText(content);
  }
}
