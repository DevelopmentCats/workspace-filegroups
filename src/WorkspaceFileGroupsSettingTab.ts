import { App, PluginSettingTab, Setting, debounce } from 'obsidian';
import WorkspaceFileGroupsPlugin from './main';

export class WorkspaceFileGroupsSettingTab extends PluginSettingTab {
	plugin: WorkspaceFileGroupsPlugin;
	private searchTerm: string = '';
	private expandedFolders: Set<string> = new Set();

	constructor(app: App, plugin: WorkspaceFileGroupsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	async display(): Promise<void> {
		const {containerEl} = this;

    await this.plugin.syncSettings();

		containerEl.empty();

    // Add header with description
    containerEl.createEl('h2', {text: 'Workspace File Groups'});
    containerEl.createEl('p', {
      text: 'Configure which folders are visible in each workspace. Select the folders you want to see - all others will be hidden. Changes are saved automatically. New folders created while in a workspace are automatically made visible.',
      cls: 'setting-item-description'
    });

    // Get all folders in the vault
    const allFolders = this.getAllFolderPaths();
    
    if (allFolders.length === 0) {
      containerEl.createEl('p', {
        text: 'No folders found in your vault. Create some folders to get started.',
        cls: 'setting-item-description'
      });
      return;
    }

    const workspaces = this.plugin.settings.workspaces;
    const workspaceNames = Object.keys(workspaces);

    if (workspaceNames.length === 0) {
      containerEl.createEl('p', {
        text: 'No workspaces found. Create workspaces using Obsidian\'s core Workspaces plugin first.',
        cls: 'setting-item-description'
      });
      
      this.addInfoSection(containerEl);
      return;
    }

    // Create workspace folder configurators
    for(const workspaceName of workspaceNames) {
      this.createWorkspaceSection(containerEl, workspaceName, allFolders);
    }

    // Add helpful information section
    this.addInfoSection(containerEl);

    // Add support section
    new Setting(containerEl)
      .setName("Support Development")
      .setDesc("If you find this plugin helpful, consider supporting continued development.")
      .addButton((btn) => {
        btn.buttonEl.outerHTML =
          "<a href='https://ko-fi.com/developmentcats' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://cdn.ko-fi.com/cdn/kofi3.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>";
      });
	}

  private createWorkspaceSection(containerEl: HTMLElement, workspaceName: string, allFolders: string[]) {
    const workspaceSettings = this.plugin.settings.workspaces[workspaceName];
    const isCurrentWorkspace = workspaceName === this.plugin.settings.active;
    
    // Migrate old settings if needed
    let visibleFolders = workspaceSettings.visibleFolders || [];
    if (visibleFolders.length === 0 && workspaceSettings.folders) {
      // Convert from "folders to hide" to "folders to show"
      visibleFolders = allFolders.filter(folder => !workspaceSettings.folders!.includes(folder));
      workspaceSettings.visibleFolders = visibleFolders;
      delete workspaceSettings.folders;
    }

    // Create workspace section
    const sectionEl = containerEl.createDiv('workspace-filegroups-workspace-section');
    
    // Workspace header with home icon
    const headerEl = sectionEl.createDiv('workspace-filegroups-workspace-header');
    const headerTitle = headerEl.createDiv();
    
    // Add home icon using Obsidian's icon system
    const iconSpan = headerTitle.createSpan({ cls: 'workspace-header-icon' });
    iconSpan.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-home"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>`;
    
    const title = isCurrentWorkspace ? ` ${workspaceName} (current)` : ` ${workspaceName}`;
    const titleEl = headerTitle.createEl('h3', { text: title });
    titleEl.style.display = 'inline';
    titleEl.style.marginLeft = '6px';
    
    // Create counter element that we can update
    const counterEl = headerEl.createEl('span', {
      cls: 'workspace-filegroups-folder-count'
    });
    
    const updateCounter = () => {
      const selectedCount = workspaceSettings.visibleFolders.length;
      const totalCount = allFolders.length;
      counterEl.setText(`${selectedCount}/${totalCount} folders visible`);
    };
    updateCounter(); // Initial count
// Enhanced controls section
const controlsEl = sectionEl.createDiv('workspace-filegroups-controls');

// Search input
const searchContainer = controlsEl.createDiv('workspace-filegroups-search-container');
const searchInput = searchContainer.createEl('input', {
  type: 'text',
  placeholder: 'Search folders...',
  cls: 'workspace-filegroups-search'
});

const searchIcon = searchContainer.createSpan({ cls: 'workspace-filegroups-search-icon' });
searchIcon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`;

// Quick actions
const actionsEl = controlsEl.createDiv('workspace-filegroups-actions');

// Create all buttons first
const selectAllBtn = actionsEl.createEl('button', {
  text: 'Select All',
  cls: 'mod-cta'
});

const selectNoneBtn = actionsEl.createEl('button', {
  text: 'Select None'
});

const invertBtn = actionsEl.createEl('button', {
  text: 'Invert Selection'
});

const expandBtn = actionsEl.createEl('button', {
  text: 'Expand All'
});

// Folder list container
const foldersEl = sectionEl.createDiv('workspace-filegroups-folder-list');

if (allFolders.length > 0) {
  // Group folders by hierarchy for better organization
  const folderHierarchy = this.buildFolderHierarchy(allFolders);
  this.renderFolderHierarchy(foldersEl, folderHierarchy, workspaceSettings, allFolders, updateCounter);
  
  // Setup button event listeners after folderHierarchy is defined
  selectAllBtn.addEventListener('click', async () => {
    workspaceSettings.visibleFolders = [...allFolders];
    await this.plugin.saveSettings();
    updateCounter();
    this.refreshFolderDisplay(foldersEl, folderHierarchy, workspaceSettings, allFolders, updateCounter);
  });

  selectNoneBtn.addEventListener('click', async () => {
    workspaceSettings.visibleFolders = [];
    await this.plugin.saveSettings();
    updateCounter();
    this.refreshFolderDisplay(foldersEl, folderHierarchy, workspaceSettings, allFolders, updateCounter);
  });

  invertBtn.addEventListener('click', async () => {
    const currentVisible = new Set(workspaceSettings.visibleFolders);
    workspaceSettings.visibleFolders = allFolders.filter(folder => !currentVisible.has(folder));
    await this.plugin.saveSettings();
    updateCounter();
    this.refreshFolderDisplay(foldersEl, folderHierarchy, workspaceSettings, allFolders, updateCounter);
  });

  expandBtn.addEventListener('click', () => {
    const isExpanded = expandBtn.textContent === 'Collapse All';
    if (isExpanded) {
      this.expandedFolders.clear();
      expandBtn.setText('Expand All');
    } else {
      allFolders.forEach(folder => this.expandedFolders.add(folder));
      expandBtn.setText('Collapse All');
    }
    this.refreshFolderDisplay(foldersEl, folderHierarchy, workspaceSettings, allFolders, updateCounter);
  });
  
  // Setup search functionality with debounce
  const debouncedSearch = debounce((searchTerm: string) => {
    this.searchTerm = searchTerm.toLowerCase();
    this.refreshFolderDisplay(foldersEl, folderHierarchy, workspaceSettings, allFolders, updateCounter);
  }, 300);
  
  searchInput.addEventListener('input', (e: any) => {
    const target = e.target as HTMLInputElement;
    debouncedSearch(target.value);
  });
}
  }

  private buildFolderHierarchy(allFolders: string[]): {[key: string]: string[]} {
    const hierarchy: {[key: string]: string[]} = {};
    
    // Group folders by their parent
    allFolders.forEach(folder => {
      const parts = folder.split('/');
      if (parts.length === 1) {
        // Root level folder
        if (!hierarchy['']) hierarchy[''] = [];
        hierarchy[''].push(folder);
      } else {
        // Subfolder
        const parent = parts.slice(0, -1).join('/');
        if (!hierarchy[parent]) hierarchy[parent] = [];
        hierarchy[parent].push(folder);
      }
    });

    return hierarchy;
  }

  private renderFolderHierarchy(
    container: HTMLElement, 
    hierarchy: {[key: string]: string[]}, 
    workspaceSettings: any, 
    allFolders: string[], 
    updateCounter: () => void
  ) {
    // Render root folders first
    const rootFolders = hierarchy[''] || [];
    rootFolders.sort().forEach(folder => {
      this.renderFolder(container, folder, hierarchy, workspaceSettings, allFolders, updateCounter, 0);
    });
  }

  private renderFolder(
    container: HTMLElement,
    folderPath: string,
    hierarchy: {[key: string]: string[]},
    workspaceSettings: any,
    allFolders: string[],
    updateCounter: () => void,
    depth: number
  ) {
    const isVisible = workspaceSettings.visibleFolders.includes(folderPath);
    const hasChildren = hierarchy[folderPath] && hierarchy[folderPath].length > 0;
    const folderName = folderPath.split('/').pop() || folderPath;
    
    // Search filtering
    const matchesSearch = this.searchTerm === '' ||
      folderName.toLowerCase().includes(this.searchTerm) ||
      folderPath.toLowerCase().includes(this.searchTerm);
    
    const folderEl = container.createDiv('workspace-filegroups-folder-item');
    folderEl.style.paddingLeft = `${12 + (depth * 20)}px`; // Indent based on depth
    
    // Hide if doesn't match search
    if (!matchesSearch) {
      folderEl.style.display = 'none';
    }
    
    // Add expand/collapse indicator if has children
    if (hasChildren) {
      const expandIndicator = folderEl.createSpan({
        cls: 'folder-expand-indicator'
      });
      expandIndicator.innerHTML = '▶';
      
      const isExpanded = this.expandedFolders.has(folderPath);
      if (isExpanded) {
        folderEl.addClass('expanded');
      }
      
      expandIndicator.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.expandedFolders.has(folderPath)) {
          this.expandedFolders.delete(folderPath);
          folderEl.removeClass('expanded');
        } else {
          this.expandedFolders.add(folderPath);
          folderEl.addClass('expanded');
        }
        this.refreshFolderDisplay(container.parentElement as HTMLElement, hierarchy, workspaceSettings, allFolders, updateCounter);
      });
    } else {
      // Add spacing for alignment when no expand indicator
      folderEl.createSpan({ text: '   ' });
    }
    
    const checkbox = folderEl.createEl('input', { type: 'checkbox' });
    checkbox.checked = isVisible;
    
    checkbox.addEventListener('change', async () => {
      if (checkbox.checked) {
        // Add this folder
        if (!workspaceSettings.visibleFolders.includes(folderPath)) {
          workspaceSettings.visibleFolders.push(folderPath);
        }
        
        // Hierarchical selection: also add all subfolders
        if (hasChildren) {
          this.selectAllSubfolders(folderPath, hierarchy, workspaceSettings);
        }
      } else {
        // Remove this folder
        const index = workspaceSettings.visibleFolders.indexOf(folderPath);
        if (index > -1) {
          workspaceSettings.visibleFolders.splice(index, 1);
        }
        
        // Also remove all subfolders
        if (hasChildren) {
          this.deselectAllSubfolders(folderPath, hierarchy, workspaceSettings);
        }
      }
      
      // Auto-save changes immediately
      await this.plugin.saveSettings();
      updateCounter();
    });

    const label = folderEl.createEl('label');
    label.appendChild(checkbox);
    
    // Add folder icon and name with search highlighting
    const icon = hasChildren ? '📁' : '📂';
    const displayName = this.highlightSearchTerm(folderName, this.searchTerm);
    label.innerHTML += ` ${icon} ${displayName}`;
    
    // Add subfolder count if it has children
    if (hasChildren) {
      const childCount = this.countAllSubfolders(folderPath, hierarchy);
      label.createEl('span', {
        text: ` (${childCount} subfolders)`,
        cls: 'workspace-filegroups-subfolder-count'
      });
    }

    // Render subfolders if expanded or searching
    if (hasChildren && (this.expandedFolders.has(folderPath) || this.searchTerm !== '')) {
      const subfolders = hierarchy[folderPath] || [];
      subfolders.sort().forEach(subfolder => {
        this.renderFolder(container, subfolder, hierarchy, workspaceSettings, allFolders, updateCounter, depth + 1);
      });
    }
  }

  private highlightSearchTerm(text: string, searchTerm: string): string {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
  }

  private selectAllSubfolders(parentPath: string, hierarchy: {[key: string]: string[]}, workspaceSettings: any) {
    const subfolders = hierarchy[parentPath] || [];
    subfolders.forEach(subfolder => {
      if (!workspaceSettings.visibleFolders.includes(subfolder)) {
        workspaceSettings.visibleFolders.push(subfolder);
      }
      // Recursively select sub-subfolders
      this.selectAllSubfolders(subfolder, hierarchy, workspaceSettings);
    });
  }

  private deselectAllSubfolders(parentPath: string, hierarchy: {[key: string]: string[]}, workspaceSettings: any) {
    const subfolders = hierarchy[parentPath] || [];
    subfolders.forEach(subfolder => {
      const index = workspaceSettings.visibleFolders.indexOf(subfolder);
      if (index > -1) {
        workspaceSettings.visibleFolders.splice(index, 1);
      }
      // Recursively deselect sub-subfolders
      this.deselectAllSubfolders(subfolder, hierarchy, workspaceSettings);
    });
  }

  private countAllSubfolders(parentPath: string, hierarchy: {[key: string]: string[]}): number {
    let count = 0;
    const subfolders = hierarchy[parentPath] || [];
    count += subfolders.length;
    
    subfolders.forEach(subfolder => {
      count += this.countAllSubfolders(subfolder, hierarchy);
    });
    
    return count;
  }

  private refreshFolderDisplay(
    container: HTMLElement, 
    hierarchy: {[key: string]: string[]}, 
    workspaceSettings: any, 
    allFolders: string[], 
    updateCounter: () => void
  ) {
    // Clear and re-render the folder list
    container.empty();
    this.renderFolderHierarchy(container, hierarchy, workspaceSettings, allFolders, updateCounter);
  }

  private addInfoSection(containerEl: HTMLElement) {
    const infoContainer = containerEl.createDiv('workspace-filegroups-info');
    infoContainer.createEl('h3', {text: 'How to use:'});
    const infoList = infoContainer.createEl('ul');
    infoList.createEl('li', {text: 'Create workspaces using Obsidian\'s core Workspaces plugin'});
    infoList.createEl('li', {text: 'Select which folders should be visible in each workspace'});
    infoList.createEl('li', {text: 'Selecting a folder automatically selects all its subfolders'});
    infoList.createEl('li', {text: 'You can manually uncheck specific subfolders if needed'});
    infoList.createEl('li', {text: 'Use the status bar (bottom right) to quickly switch workspaces'});
    infoList.createEl('li', {text: 'Changes are saved automatically as you make them'});
    
    // Add section about auto-add behavior
    infoContainer.createEl('h3', {text: 'Smart folder management:'});
    const smartList = infoContainer.createEl('ul');
    smartList.createEl('li', {text: 'New folders created while in a workspace automatically become visible in that workspace'});
    smartList.createEl('li', {text: 'Subfolders created inside visible folders inherit their parent\'s visibility'});
    smartList.createEl('li', {text: 'Renamed folders automatically update across all workspaces'});
    smartList.createEl('li', {text: 'You can always adjust visibility manually in the settings above'});
  }

  private getAllFolderPaths(): string[] {
    const folders: string[] = [];
    const abstractFiles = this.app.vault.getAllLoadedFiles();
    
    abstractFiles.forEach(file => {
      if ('children' in file && file.children !== undefined) {
        folders.push(file.path);
      }
    });
    
    return folders.sort();
  }
}
