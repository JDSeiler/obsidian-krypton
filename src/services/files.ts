import { App, Editor, TFile } from 'obsidian';

interface EditorPos {
  line: number
  ch: number
}

interface EditorRange {
  start: EditorPos;
  end: EditorPos;
}

export function getReplacementRange(app: App, editor: Editor, file: TFile, includeFrontMatter = true): EditorRange {
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
  };
  const endPosition = {
    line: editor.lineCount(),
    ch: 0
  };

  return { start: startPosition, end: endPosition };
}

export function fileHasFrontmatter(app: App, file: TFile): boolean {
  const meta = app.metadataCache.getFileCache(file);
  return meta?.frontmatter !== undefined;
}

export function pathToCryptoSystem(app: App): string {
  return app.vault.configDir + '/plugins/obsidian-folder-locker/crypto.json';
}
