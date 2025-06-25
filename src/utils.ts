import { App, FileSystemAdapter } from 'obsidian';

/*
Creates a "lite" copy of the internal workspaces to align with the plugin settings.
This is to ensure that we are always working with the correct workspaces.
*/
const getInternalWorkspaces = async (app: App): Promise<any> => {
  try {
    const adapter = app.vault.adapter;
    if (!(adapter instanceof FileSystemAdapter)) {
      throw new Error('FileSystemAdapter not available');
    }

    const workspacesFile = await FileSystemAdapter.readLocalFile(`${adapter.getBasePath()}/.obsidian/workspaces.json`);
    const workspaces = JSON.parse(String.fromCharCode.apply(null, Array.from(new Uint8Array(workspacesFile))));
    
    const workspaceNames = Object.keys(workspaces.workspaces || {});
    const result: any = { workspaces: {} };

    for(const name of workspaceNames) {
      result.workspaces[name] = { visibleFolders: [] }; // Updated to use visibleFolders
    }
    result.active = workspaces.active || '';
    return result;
  } catch (error) {
    console.error('Workspace File Groups: Error reading workspaces file:', error);
    return { workspaces: {}, active: '' };
  }
}

const getInternalActiveWorkspace = async (app: App): Promise<string> => {
  try {
    const adapter = app.vault.adapter;
    if (!(adapter instanceof FileSystemAdapter)) {
      return '';
    }

    const workspacesFile = await FileSystemAdapter.readLocalFile(`${adapter.getBasePath()}/.obsidian/workspaces.json`);
    const workspaces = JSON.parse(String.fromCharCode.apply(null, Array.from(new Uint8Array(workspacesFile))));

    return workspaces.active || '';
  } catch (error) {
    console.error('Workspace File Groups: Error reading active workspace:', error);
    return '';
  }
}

export {
  getInternalWorkspaces,
  getInternalActiveWorkspace
}