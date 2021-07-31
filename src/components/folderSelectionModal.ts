import { App, FileSystemAdapter, FuzzySuggestModal, normalizePath  } from 'obsidian';

export default class FolderSelectionModal extends FuzzySuggestModal<string> {
  // List of all folders that contain files
  folderList: string[] = [];
  limit = 10;
  
  constructor(app: App) {
    super(app);
    this.setPlaceholder('Create locker in...');
    
    const visited: {
      [k: string]: boolean
    } = {};
    this.app.vault.getFiles().forEach(file => {
      if (!file.parent.isRoot() && !visited[file.parent.path]) {
        this.folderList.push('./' + file.path.split('/').slice(0, -1).join('/'));
        visited[file.parent.path] = true;
      }
    });
  }
  
  getItems(): string[] {
    return this.folderList;
  }
  
  getItemText(item: string): string {
    return item;
  }
  
  onChooseItem(item: string, _evt: MouseEvent | KeyboardEvent): void {
    console.log(`${item} was chosen!`);
    const fsAdap = this.app.vault.adapter as FileSystemAdapter;
    const fullPath = fsAdap.getFullPath(normalizePath(item));
    console.log(fullPath);
  }
}