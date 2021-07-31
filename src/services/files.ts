import { App, Editor, TFile } from 'obsidian';

export function getReplacementRange(app: App, editor: Editor, file: TFile, includeFrontMatter: boolean = true) {
    const meta = app.metadataCache.getFileCache(file);
    let startLine;
    if (includeFrontMatter) {
        startLine = 0;
    } else {
        startLine = (meta?.frontmatter?.position?.end?.line || -1) + 1;
    }
    const startPosition = {
        line: startLine,
        ch: 0
    }
    const endPosition = {
        line: editor.lineCount(),
        ch: 0
    }

    return {start: startPosition, end: endPosition}
}

export function pathToCryptoSystem(app: App) {
    return app.vault.configDir + '/plugins/obsidian-folder-locker/crypto.json';
}