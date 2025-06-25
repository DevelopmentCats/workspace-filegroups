/** Settings Structure
 * {
 *  workspaces: {
  *  "Workspace A": {
  *    visibleFolders: []  // Folders to SHOW in this workspace
  *  },
  *  "Workspace B": {
  *    visibleFolders: []
  *   }
 *  }
 * }
 */

export interface IWorkspaceFileGroupsSettings {
  active: string,
	workspaces: {
    [name: string]: IWorkspaceFileGroupsSetting
  };
}

export interface IWorkspaceFileGroupsSetting {
	visibleFolders: Array<string>  // Changed from 'folders' to 'visibleFolders' for clarity
	folders?: Array<string>       // Keep for backward compatibility during migration
}

