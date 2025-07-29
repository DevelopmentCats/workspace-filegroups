import { Plugin, Notice, Menu } from 'obsidian';
import { WorkspaceFileGroupsSettingTab } from './WorkspaceFileGroupsSettingTab';
import { IWorkspaceFileGroupsSettings, IWorkspaceFileGroupsSetting } from './interfaces';
import { getInternalWorkspaces, getInternalActiveWorkspace } from './utils';

const DEFAULT_SETTINGS: IWorkspaceFileGroupsSettings = {
  active: "",
	workspaces: {}
}

export default class WorkspaceFileGroupsPlugin extends Plugin {
	settings: IWorkspaceFileGroupsSettings = DEFAULT_SETTINGS;
  private statusBarItem: HTMLElement | null = null;
  private isRendering = false; // Prevent concurrent renders

  async onload() {
    console.log('Loading Workspace File Groups plugin');
    
    try {
      await this.syncSettings();

      this.app.workspace.onLayoutReady(async () => {
        this.addSettingTab(new WorkspaceFileGroupsSettingTab(this.app, this));
        this.createStatusBarItem();
        
        // Initial render after layout is ready with transition
        document.body.classList.add('workspace-filegroups-transitioning');
        await this.renderFolders();
      });

      // Listen for workspace changes
      this.registerEvent(this.app.workspace.on(
        "layout-change",
        async () => {
          try {
            const newActiveWorkspace = await getInternalActiveWorkspace(this.app);
            if (newActiveWorkspace !== this.settings.active) {
              this.settings.active = newActiveWorkspace;
              await this.saveData(this.settings);
              
              // Update status bar immediately
              this.updateStatusBar();
              
              // Render folders with minimal delay for smoother transition
              this.renderFoldersOptimized();
            }
          } catch (error) {
            console.error('Workspace File Groups: Error handling layout change:', error);
          }
        }));

      // Listen for file/folder creation to auto-add to current workspace
      this.registerEvent(this.app.vault.on('create', async (file) => {
        await this.handleNewFileOrFolder(file);
      }));

      // Listen for file/folder renames to update paths
      this.registerEvent(this.app.vault.on('rename', async (file, oldPath) => {
        await this.handleFileRename(file, oldPath);
      }));

    } catch (error) {
      console.error('Workspace File Groups: Error during plugin load:', error);
      new Notice('Workspace File Groups: Failed to initialize. Check console for details.');
    }
	}

  // Handle new file/folder creation
  private async handleNewFileOrFolder(file: any) {
    try {
      const currentWorkspace = this.settings.active;
      if (!currentWorkspace) return;

      const workspaceSettings = this.settings.workspaces[currentWorkspace];
      if (!workspaceSettings) return;

      // Only handle folders (files inherit their parent folder's visibility)
      if ('children' in file && file.children !== undefined) {
        const folderPath = file.path;
        
        // Check if this folder should be auto-added
        if (this.shouldAutoAddFolder(folderPath, workspaceSettings.visibleFolders)) {
          // Add to current workspace's visible folders
          if (!workspaceSettings.visibleFolders.includes(folderPath)) {
            workspaceSettings.visibleFolders.push(folderPath);
            await this.saveSettings();
            
            console.log(`Workspace File Groups: Auto-added new folder "${folderPath}" to workspace "${currentWorkspace}"`);
          }
        }
      }
    } catch (error) {
      console.error('Workspace File Groups: Error handling new file/folder:', error);
    }
  }

  // Determine if a new folder should be auto-added to the current workspace
  private shouldAutoAddFolder(folderPath: string, visibleFolders: string[]): boolean {
    // Auto-add if:
    // 1. It's a root folder (no parent)
    // 2. Its parent folder is already visible in this workspace
    
    const pathParts = folderPath.split('/');
    
    if (pathParts.length === 1) {
      // Root folder - auto-add to current workspace
      return true;
    } else {
      // Subfolder - add if parent is visible
      const parentPath = pathParts.slice(0, -1).join('/');
      return visibleFolders.includes(parentPath);
    }
  }

  // Handle file/folder renames to update stored paths
  private async handleFileRename(file: any, oldPath: string) {
    try {
      // Only handle folders
      if (!('children' in file && file.children !== undefined)) return;

      const newPath = file.path;
      let updated = false;

      // Update all workspaces that reference the old path
      for (const workspaceName in this.settings.workspaces) {
        const workspaceSettings = this.settings.workspaces[workspaceName];
        const visibleFolders = workspaceSettings.visibleFolders || [];
        
        const oldIndex = visibleFolders.indexOf(oldPath);
        if (oldIndex > -1) {
          // Replace old path with new path
          visibleFolders[oldIndex] = newPath;
          updated = true;
        }
        
        // Also update any subfolders that were affected by the rename
        for (let i = 0; i < visibleFolders.length; i++) {
          if (visibleFolders[i].startsWith(oldPath + '/')) {
            visibleFolders[i] = visibleFolders[i].replace(oldPath, newPath);
            updated = true;
          }
        }
      }

      if (updated) {
        await this.saveSettings();
        console.log(`Workspace File Groups: Updated folder paths after rename from "${oldPath}" to "${newPath}"`);
      }
    } catch (error) {
      console.error('Workspace File Groups: Error handling file rename:', error);
    }
  }

  private createStatusBarItem() {
    this.statusBarItem = this.addStatusBarItem();
    this.statusBarItem.addClass('workspace-filegroups-status');
    this.updateStatusBar();
    
    // Add click handler for workspace switching
    this.registerDomEvent(this.statusBarItem, 'click', (event) => {
      this.showWorkspaceMenu(event);
    });
  }

  private updateStatusBar() {
    if (!this.statusBarItem) return;

    const currentWorkspace = this.settings.active;
    
    // Clear existing content
    this.statusBarItem.empty();
    
    // Create icon element using Obsidian's native home icon
    const iconEl = this.statusBarItem.createSpan({ cls: 'workspace-icon' });
    // Use Obsidian's native icon system
    iconEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-home"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>`;
    
    // Create workspace name element
    const nameEl = this.statusBarItem.createSpan({ cls: 'workspace-name' });
    nameEl.setText(currentWorkspace || 'No workspace');
    
    // Set title tooltip
    this.statusBarItem.setAttribute('title', `Current workspace: ${currentWorkspace || 'None'}\nClick to switch workspaces`);
  }

  private showWorkspaceMenu(event: MouseEvent) {
    const menu = new Menu();
    
    // Add current workspace indicator with home icon
    const currentWorkspace = this.settings.active || 'Default';
    menu.addItem((item) => {
      item.setTitle(currentWorkspace);
      item.setIcon('home');
      item.setDisabled(true);
    });
    
    menu.addSeparator();
    
    // Add available workspaces
    const workspaces = Object.keys(this.settings.workspaces);
    if (workspaces.length === 0) {
      menu.addItem((item) => {
        item.setTitle('No workspaces configured');
        item.setIcon('info');
        item.setDisabled(true);
      });
      
      menu.addSeparator();
      
      menu.addItem((item) => {
        item.setTitle('Create workspace with Workspaces plugin');
        item.setIcon('plus');
        item.setDisabled(true);
      });
    } else {
      workspaces.sort().forEach((workspace) => {
        menu.addItem((item) => {
          const isCurrent = workspace === this.settings.active;
          item.setTitle(workspace);
          item.setIcon(isCurrent ? 'check-circle' : 'home');
          
          if (!isCurrent) {
            item.onClick(() => {
              this.switchToWorkspace(workspace);
            });
          } else {
            item.setDisabled(true);
          }
        });
      });
    }
    
    menu.addSeparator();
    
    // Add settings link
    menu.addItem((item) => {
      item.setTitle('Configure folder groups...');
      item.setIcon('settings');
      item.onClick(() => {
        const app = this.app as any; // Cast to access private methods
        app.setting.open();
        app.setting.openTabById(this.manifest.id);
      });
    });
    
    menu.showAtMouseEvent(event);
  }

  private async switchToWorkspace(workspaceName: string) {
    try {
      // Use Obsidian's workspace plugin to switch
      const app = this.app as any; // Cast to access internal APIs
      const workspacesPlugin = app.internalPlugins.plugins.workspaces;
      if (workspacesPlugin && workspacesPlugin.enabled) {
        await workspacesPlugin.instance.loadWorkspace(workspaceName);
        new Notice(`Switched to workspace: ${workspaceName}`);
      } else {
        new Notice('Workspaces plugin is not enabled. Please enable it in core plugins.');
      }
    } catch (error) {
      console.error('Failed to switch workspace:', error);
      new Notice('Failed to switch workspace. Please try manually.');
    }
  }

  // Optimized rendering with better performance
  private renderFoldersOptimized() {
    // Prevent concurrent renders
    if (this.isRendering) return;
    
    // Hide file navigator during transition
    document.body.classList.add('workspace-filegroups-transitioning');
    
    // Use a small delay to ensure Obsidian's layout has settled
    requestAnimationFrame(() => {
      this.renderFolders();
    });
  }

  async renderFolders() {
    // Prevent concurrent renders
    if (this.isRendering) return;
    this.isRendering = true;

    try {
      const activeWorkspace = this.settings.active;
      const workspaceSettings = this.settings.workspaces[activeWorkspace];

      // Clear all hidden classes first - batch operation
      this.clearAllHiddenFolders();

      if(!workspaceSettings) {
        this.isRendering = false;
        // Show file navigator again
        document.body.classList.remove('workspace-filegroups-transitioning');
        return;
      }

      // Get folders to show (visible folders)
      let visibleFolders = workspaceSettings.visibleFolders || [];
      
      // Migration: if no visibleFolders but has old 'folders' (to hide), convert them
      if (visibleFolders.length === 0 && workspaceSettings.folders) {
        // Get all folders in vault
        const allFolders = this.getAllFolderPaths();
        // Visible folders = all folders minus the ones to hide
        visibleFolders = allFolders.filter(folder => !workspaceSettings.folders!.includes(folder));
        
        // Update settings with migrated data
        workspaceSettings.visibleFolders = visibleFolders;
        delete workspaceSettings.folders; // Remove old property
        await this.saveSettings();
      }

      // If no visible folders defined, show everything (don't hide anything)
      if (visibleFolders.length === 0) {
        this.isRendering = false;
        // Show file navigator again
        document.body.classList.remove('workspace-filegroups-transitioning');
        return;
      }

      // Optimized folder hiding with improved hierarchical logic
      this.hideFoldersNotInListWithHierarchy(visibleFolders);
      
      // Small delay to let hiding animations complete, then show file navigator
      setTimeout(() => {
        document.body.classList.remove('workspace-filegroups-transitioning');
      }, 50);
      
    } catch (error) {
      console.error('Workspace File Groups: Error rendering folders:', error);
      // Always show file navigator again on error
      document.body.classList.remove('workspace-filegroups-transitioning');
    } finally {
      this.isRendering = false;
    }
  }

  // Optimized method to clear all hidden folders at once
  private clearAllHiddenFolders() {
    const hiddenElements = document.querySelectorAll('.workspace-filegroups-hidden');
    if (hiddenElements.length > 0) {
      // Batch DOM operation
      const fragment = document.createDocumentFragment();
      hiddenElements.forEach((el) => {
        el.classList.remove('workspace-filegroups-hidden');
      });
    }
  }

  // Improved method with proper hierarchical logic
  private hideFoldersNotInListWithHierarchy(visibleFolders: string[]) {
    // Create a Set for O(1) lookup performance
    const visibleSet = new Set(visibleFolders);
    
    // More targeted query - look specifically for navigation folders
    const navFolders = document.querySelectorAll('.nav-folder');
    const elementsToHide: Element[] = [];
    
    navFolders.forEach(folderEl => {
      const titleEl = folderEl.querySelector('.nav-folder-title');
      if (!titleEl) return;
      
      const folderPath = titleEl.getAttribute('data-path');
      if (!folderPath) return;

      // Check if this folder should be visible
      const shouldBeVisible = this.isFolderVisible(folderPath, visibleSet);
      
      if (!shouldBeVisible) {
        elementsToHide.push(folderEl);
      }
    });

    // Batch hide operation
    if (elementsToHide.length > 0) {
      elementsToHide.forEach(el => {
        el.classList.add('workspace-filegroups-hidden');
      });
    }
  }

  // Enhanced visibility check with hierarchical logic
  private isFolderVisible(folderPath: string, visibleSet: Set<string>): boolean {
    // Direct match
    if (visibleSet.has(folderPath)) {
      return true;
    }
    
    // Check if any parent folder is visible (subfolders inherit visibility)
    const pathParts = folderPath.split('/');
    for (let i = pathParts.length - 1; i > 0; i--) {
      const parentPath = pathParts.slice(0, i).join('/');
      if (visibleSet.has(parentPath)) {
        return true;
      }
    }
    
    return false;
  }

  // Helper method to get all folder paths in the vault
  private getAllFolderPaths(): string[] {
    const folders: string[] = [];
    const abstractFiles = this.app.vault.getAllLoadedFiles();
    
    abstractFiles.forEach(file => {
      // Check if it's a folder by testing if it has the children property
      if ('children' in file && file.children !== undefined) {
        folders.push(file.path);
      }
    });
    
    return folders.sort();
  }

  // Since we're tracking the workspaces.json file we need to sync it with our data.json on startup
 async syncSettings() {
    try {
      const internalWorkspaces = await getInternalWorkspaces(this.app);
      let pluginSettings = await this.loadData(); // load the data.json file

      // If we have a data.json file, use it. If not create one based on the default settings.
      pluginSettings = pluginSettings || Object.assign({}, DEFAULT_SETTINGS);
      
      // Preserve the current active workspace if it exists
      const currentActive = await getInternalActiveWorkspace(this.app);
      if (currentActive && pluginSettings.active !== currentActive) {
        console.log(`Workspace File Groups: Updating active workspace from "${pluginSettings.active}" to "${currentActive}"`);
        pluginSettings.active = currentActive;
      }
      
      this.settings = this.repairSettings(internalWorkspaces, pluginSettings);
      await this.saveData(this.settings);
    } catch (error) {
      console.error('Workspace File Groups: Error syncing settings:', error);
      this.settings = DEFAULT_SETTINGS;
      new Notice('Workspace File Groups: Could not sync with workspace settings. Using defaults.');
    }
 }

  // Makes sure that the plugin settings workspaces match what Obsidian is using internally
  repairSettings(internalSettings: any, pluginSettings: IWorkspaceFileGroupsSettings): IWorkspaceFileGroupsSettings {
    // Make sure that the pluginSettings has any new workspaces
    const internalWorkspaceNames = Object.keys(internalSettings.workspaces || {});
    for(const name of internalWorkspaceNames) {
      if(!pluginSettings.workspaces[name]){
        // Only create new workspace entry if it doesn't exist
        // This preserves existing folder selections
        pluginSettings.workspaces[name] = { visibleFolders: [] };
        console.log(`Workspace File Groups: Created new workspace entry for "${name}"`);
      }
    }

    // Make sure that the pluginSettings removes any workspaces that have been deleted
    const pluginWorkspaceNames = Object.keys(pluginSettings.workspaces || {});
    for(const name of pluginWorkspaceNames) {
      if(!internalSettings.workspaces || !internalSettings.workspaces[name]){
        delete pluginSettings.workspaces[name];
      }
    }
    
    return pluginSettings;
  }

	async saveSettings() {
	   try {
	     // Create a backup of current settings before saving
	     const backupKey = `workspace-filegroups-backup-${Date.now()}`;
	     const currentData = await this.loadData();
	     if (currentData && Object.keys(currentData.workspaces || {}).length > 0) {
	       localStorage.setItem(backupKey, JSON.stringify(currentData));
	       
	       // Keep only the latest 3 backups
	       const backupKeys = Object.keys(localStorage).filter(key => key.startsWith('workspace-filegroups-backup-'));
	       if (backupKeys.length > 3) {
	         backupKeys.sort().slice(0, backupKeys.length - 3).forEach(key => {
	           localStorage.removeItem(key);
	         });
	       }
	     }
	     
	     await this.saveData(this.settings);
	     await this.renderFolders();
	     this.updateStatusBar();
	     
	     console.log('Workspace File Groups: Settings saved successfully');
	   } catch (error) {
	     console.error('Workspace File Groups: Error saving settings:', error);
	     new Notice('Workspace File Groups: Failed to save settings');
	     
	     // Try to restore from backup if save failed
	     try {
	       const backupKeys = Object.keys(localStorage).filter(key => key.startsWith('workspace-filegroups-backup-'));
	       if (backupKeys.length > 0) {
	         const latestBackup = backupKeys.sort().pop();
	         const backupData = JSON.parse(localStorage.getItem(latestBackup!) || '{}');
	         this.settings = backupData;
	         console.log('Workspace File Groups: Restored from backup');
	       }
	     } catch (restoreError) {
	       console.error('Workspace File Groups: Failed to restore from backup:', restoreError);
	     }
	   }
	}

  onunload() {
    console.log('Unloading Workspace File Groups plugin');
    
    // Clean up any hidden elements when plugin is disabled
    this.clearAllHiddenFolders();
    
    // Remove transitioning state
    document.body.classList.remove('workspace-filegroups-transitioning');
  }
}

