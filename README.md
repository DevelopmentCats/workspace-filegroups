# Obsidian Workspace File Groups

**Organize your vault by showing only specific folders in each workspace.** Create focused work environments by defining folder groups for different contexts - perfect for separating work, personal, research, or project-specific content.

## ✨ Features

- 🗂️ **Workspace-specific folder visibility** - Only show relevant folders in each workspace
- 🎯 **Focus enhancement** - Reduce distractions by hiding irrelevant folders  
- ⚡ **Seamless integration** - Automatically syncs with Obsidian's workspace system
- 📱 **Cross-platform** - Works on desktop and mobile
- 🎨 **Theme compatible** - Works with all Obsidian themes

## 🚀 Use Cases

- **Work vs Personal**: Hide personal folders during work hours
- **Project Management**: Show only project-relevant folders per workspace
- **Subject-based Study**: Organize folders by academic subjects or research topics
- **Client Work**: Separate client files and resources
- **Content Creation**: Hide utility folders (templates, scripts) during writing

## 📦 Installation

### From Obsidian Community Plugins (Recommended)
1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "Workspace File Groups"
4. Install and enable the plugin

### Manual Installation
1. Download the latest release from [GitHub](https://github.com/DevelopmentCats/workspace-filegroups)
2. Extract to your vault's `.obsidian/plugins/workspace-filegroups/` folder
3. Enable the plugin in Obsidian settings

## ⚙️ Setup

1. **Create workspaces** in Obsidian (Workspaces are available in the command palette)
2. **Open plugin settings** and configure folder rules for each workspace
3. **List folder paths** (one per line) that should be hidden in each workspace
4. **Switch workspaces** to see the effect!

### Example Configuration

**Workspace: "Work"** - Hide personal folders:
```
Personal
Daily Notes/Personal
Resources/Hobbies
```

**Workspace: "Personal"** - Hide work folders:
```
Projects/Work
Meeting Notes
Business
```

## 💡 Tips

- Use **relative paths** from your vault root (no leading slash)
- **Folder names are case-sensitive**
- **Individual files** can also be hidden (include the file extension)
- **Restart Obsidian** if folders don't update immediately after changing settings

## 🛠️ Development

This plugin is a modernized fork of the original [workspace-folder-hider](https://github.com/JEBoothjr/workspace-folder-hider) by JEBoothjr.

### Building from Source
```bash
npm install
npm run build
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Credits

- Original concept and implementation by [JEBoothjr](https://github.com/JEBoothjr)
- Modernized and maintained by [DevelopmentCats](https://github.com/DevelopmentCats)

## 💖 Support

If you find this plugin helpful, consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs or requesting features
- ☕ [Supporting development](https://ko-fi.com/developmentcats)
