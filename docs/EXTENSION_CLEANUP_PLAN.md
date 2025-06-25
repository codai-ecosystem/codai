# Extension Cleanup Plan

## Current State

The AIDE project currently includes 50+ VS Code extensions, creating a bloated and complex development environment.

## Minimal Extension Strategy

### Keep (Essential Development Stack - 12 extensions)

#### AI & Core Development

1. **GitHub Copilot** (`copilot/`)
   - AI code completion and suggestions
   - Core AI functionality for development

2. **GitHub** (`github/`)
   - GitHub integration for repositories, issues, PRs
   - Essential for version control workflows

#### Language Support (Built into VS Code Core)

3. **TypeScript/JavaScript** (built-in)
   - Core web development languages
   - TypeScript compilation and IntelliSense

4. **Git** (built-in)
   - Version control system
   - Commit, branch, merge operations

#### Configuration & Documentation

5. **JSON Language Features** (`json-language-features/`)
   - package.json, tsconfig.json, configuration files
   - Essential for modern development

6. **Markdown Language Features** (`markdown-language-features/`)
   - README.md, documentation files
   - Project documentation support

7. **YAML** (`yaml/`)
   - CI/CD configurations, Docker Compose
   - DevOps and deployment configs

#### Web Development

8. **HTML Language Features** (`html-language-features/`)
   - HTML editing and IntelliSense
   - Web application development

9. **CSS Language Features** (`css-language-features/`)
   - CSS editing, validation, IntelliSense
   - Styling support for web apps

#### Development Tools

10. **NPM** (`npm/`)
    - Package management and scripts
    - Node.js project management

11. **Simple Browser** (`simple-browser/`)
    - Built-in browser for testing web apps
    - Live preview and development server testing

12. **Docker** (`docker/`)
    - Container support for deployment
    - Build and deploy applications in containers

### Remove (38+ extensions)

All other extensions should be removed to achieve focused development experience:

#### Language Extensions to Remove (Users can install as needed)

- `bat/` - Batch file support
- `clojure/` - Clojure language
- `coffeescript/` - CoffeeScript language
- `cpp/` - C++ language
- `csharp/` - C# language
- `dart/` - Dart language
- `fsharp/` - F# language
- `go/` - Go language
- `groovy/` - Groovy language
- `hlsl/` - HLSL shaders
- `java/` - Java language
- `julia/` - Julia language
- `latex/` - LaTeX support
- `lua/` - Lua language
- `objective-c/` - Objective-C
- `perl/` - Perl language
- `php/` - PHP language
- `php-language-features/` - PHP features
- `powershell/` - PowerShell
- `python/` - Python language
- `r/` - R language
- `ruby/` - Ruby language
- `rust/` - Rust language
- `swift/` - Swift language
- `vb/` - Visual Basic

#### Web Extensions to Remove (Basic support in core)

- `css/` - Basic CSS (keep language features)
- `html/` - Basic HTML (keep language features)
- `less/` - Less preprocessor
- `scss/` - Sass/SCSS
- `handlebars/` - Handlebars templates
- `pug/` - Pug templates

#### Build/Tool Extensions to Remove

- `grunt/` - Grunt task runner
- `gulp/` - Gulp task runner
- `jake/` - Jake build tool
- `make/` - Makefile support

#### Theme Extensions to Remove (Keep 1-2 Max)

- `theme-abyss/`
- `theme-kimbie-dark/`
- `theme-monokai/`
- `theme-monokai-dimmed/`
- `theme-quietlight/`
- `theme-red/`
- `theme-seti/`
- `theme-solarized-dark/`
- `theme-solarized-light/`
- `theme-tomorrow-night-blue/`
- Keep only: `theme-defaults/` (VS Code default themes)

#### Specialized Extensions to Remove

- `debug-auto-launch/` - Auto debugging
- `debug-server-ready/` - Server debugging
- `emmet/` - Emmet abbreviations (basic Emmet is built-in)
- `extension-editing/` - Extension development
- `ipynb/` - Jupyter notebooks
- `media-preview/` - Media file preview
- `merge-conflict/` - Git merge conflict resolution (basic support in git)
- `notebook-renderers/` - Notebook rendering
- `references-view/` - Code references
- `search-result/` - Search results
- `terminal-suggest/` - Terminal suggestions
- `tunnel-forwarding/` - Port forwarding

#### Configuration/Data Extensions to Remove

- `ini/` - INI files
- `log/` - Log files
- `restructuredtext/` - reStructuredText
- `xml/` - XML files

#### Authentication Extensions to Remove

- `microsoft-authentication/` - Microsoft auth
- `github-authentication/` - GitHub auth (use built-in)

## Implementation Steps

### Phase 1: Backup

1. Create backup of current `extensions/` directory
2. Document current extension configurations

### Phase 2: Remove Extensions

1. Delete extension directories (45+ folders)
2. Update extension references in:
   - `package.json`
   - Build configurations
   - VS Code settings

### Phase 3: Update Configurations

1. Update `extensions/package.json`
2. Modify build scripts to exclude removed extensions
3. Update extension manifests

### Phase 4: Test Minimal Set

1. Test basic functionality with minimal extensions
2. Verify GitHub Copilot integration works
3. Test project creation and editing workflows

## Expected Benefits

### Bundle Size Reduction

- **Before**: ~200MB+ with all extensions
- **After**: ~40-50MB with essential development stack
- **Reduction**: 75-80% smaller

### Startup Performance

- **Before**: 10-15 seconds to load all extensions
- **After**: 3-5 seconds with essential set
- **Improvement**: 3-4x faster startup

### User Experience

- **Before**: Overwhelming 50+ extensions
- **After**: 12 focused development extensions + marketplace access
- **Result**: Complete development environment without bloat

### Maintenance

- **Before**: Managing 50+ extension dependencies
- **After**: Maintaining 12 essential extensions
- **Benefit**: Focused on core development workflow

## Risks and Mitigations

### Risk: Users Need Removed Extensions

**Mitigation**: Clear documentation on how to install additional extensions as needed

### Risk: Breaking Existing Workflows

**Mitigation**: Gradual migration with user communication

### Risk: Loss of Functionality

**Mitigation**: Core VS Code functionality remains, users can add extensions manually

## Files to Modify

1. `extensions/package.json` - Remove extension references
2. `build/gulpfile.extensions.js` - Update build process
3. `scripts/` - Update build and packaging scripts
4. `product.json` - Update extension configurations
5. Documentation - Update to reflect minimal extension set

## Timeline

- **Week 1**: Analysis and backup
- **Week 2**: Remove extensions and update configs
- **Week 3**: Testing and validation
- **Week 4**: Documentation and deployment

This cleanup will transform codai.ro from a bloated development environment into a focused, AI-driven coding companion.
