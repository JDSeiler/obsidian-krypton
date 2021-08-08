import { Plugin } from 'obsidian';

// The settingsTab has a circular dependency with the Krypton class, but rollup
// seems to be able to handle it just fine.
import KryptonSettingsTab from './components/settingsTab'; 

import { encryptCommand } from './commands/encrypt';
import { decryptCommand } from './commands/decrypt';
import { intialSetupCommand } from './commands/initialSetup';

interface KryptonSettings {
  encryptFrontmatter: boolean;
}

const DEFAULT_SETTINGS: KryptonSettings = {
  encryptFrontmatter: true
};

export default class Krypton extends Plugin {
  settings: KryptonSettings;
  
  async onload(): Promise<void> {
    console.log('loading plugin');
    
    await this.loadSettings();
    this.addSettingTab(new KryptonSettingsTab(this.app, this));
    
    this.addCommand({
      id: 'create-encryption-keys',
      name: 'Initial Setup',
      callback: intialSetupCommand(this)
    });
    
    this.addCommand({
      id: 'encrypt-current-file',
      name: 'Encrypt Current File',
      editorCheckCallback: encryptCommand(this)
    });
      
    this.addCommand({
      id: 'decrypt-current-file',
      name: 'Decrypt Current File',
      editorCheckCallback: decryptCommand(this)
    });
  }
  
  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  
  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
