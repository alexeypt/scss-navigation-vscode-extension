import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

interface PathMapping {
    pattern: string;
    targetPath: string;
}

export class PathResolver {
    private pathMappings: PathMapping[] = [];
    private workspaceRoot: string;
    private loadPaths: string[] = [];
    private useLoadPaths: boolean = false;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
        this.loadConfiguration();
    }

    /**
     * Load configuration from VS Code settings
     */
    private loadConfiguration(): void {
        const config = vscode.workspace.getConfiguration('scssNavigation');
        const mappings = config.get<Record<string, string>>('pathMappings', {});
        const loadPaths = config.get<string[]>('loadPaths', []);

        // Check if both are specified (mutual exclusivity)
        const hasPathMappings = Object.keys(mappings).length > 0;
        const hasLoadPaths = loadPaths.length > 0;

        if (hasPathMappings && hasLoadPaths) {
            vscode.window.showWarningMessage(
                'SCSS Navigation: Both pathMappings and loadPaths are configured. Only one should be specified. Using pathMappings.'
            );
        }

        // Load pathMappings (takes priority if both are set)
        if (hasPathMappings) {
            this.useLoadPaths = false;
            this.pathMappings = [];
            for (const [pattern, targetPath] of Object.entries(mappings)) {
                this.pathMappings.push({
                    pattern: pattern,
                    targetPath: targetPath
                });
            }
        }
        // Load loadPaths
        else if (hasLoadPaths) {
            this.useLoadPaths = true;
            this.loadPaths = loadPaths.map(p => path.join(this.workspaceRoot, p));
        }
        // Default: empty configuration
        else {
            this.useLoadPaths = false;
            this.pathMappings = [];
            this.loadPaths = [];
        }
    }

    /**
     * Resolve a module path using configured path mappings or load paths
     */
    public resolve(importPath: string, currentFilePath: string): string[] {
        const possiblePaths: string[] = [];

        // Try path mappings first (if configured)
        if (!this.useLoadPaths && this.pathMappings.length > 0) {
            for (const mapping of this.pathMappings) {
                const pattern = mapping.pattern.replace(/\*/g, '(.*)');
                const regex = new RegExp(`^${pattern}$`);
                const match = importPath.match(regex);

                if (match) {
                    const captured = match[1] || '';
                    const resolvedPath = mapping.targetPath.replace(/\*/g, captured);
                    
                    // Always resolve from workspace root
                    const fullPath = path.join(this.workspaceRoot, resolvedPath);
                    possiblePaths.push(...this.tryExtensions(fullPath));
                }
            }
        }

        // Try relative to current file
        if (possiblePaths.length === 0) {
            const currentDir = path.dirname(currentFilePath);
            const relativePath = path.join(currentDir, importPath);
            possiblePaths.push(...this.tryExtensions(relativePath));
        }

        // Try load paths (if configured and no relative match found)
        if (this.useLoadPaths && possiblePaths.length === 0) {
            for (const loadPath of this.loadPaths) {
                const fullPath = path.join(loadPath, importPath);
                possiblePaths.push(...this.tryExtensions(fullPath));
            }
        }

        // Filter to only existing files
        return possiblePaths.filter(p => fs.existsSync(p));
    }

    /**
     * Try different file extensions for SCSS files
     */
    private tryExtensions(basePath: string): string[] {
        const extensions = [
            '.scss',
            '.sass',
            '.css'
        ];

        const indexFiles = [
            'index.scss',
            'index.sass',
            '_index.scss',
            '_index.sass'
        ];

        const paths: string[] = [];

        // Try exact path first
        if (fs.existsSync(basePath)) {
            paths.push(path.normalize(basePath));
        }

        // Try with underscore (SCSS partials)
        const dir = path.dirname(basePath);
        const filename = path.basename(basePath);
        const partialPath = path.join(dir, `_${filename}`);
        
        // Try with extensions
        for (const ext of extensions) {
            const pathWithExt = basePath + ext;
            if (fs.existsSync(pathWithExt)) {
                paths.push(path.normalize(pathWithExt));
            }

            const partialWithExt = partialPath + ext;
            if (fs.existsSync(partialWithExt)) {
                paths.push(path.normalize(partialWithExt));
            }
        }

        // Try index files in directory
        for (const indexFile of indexFiles) {
            const indexPath = path.join(basePath, indexFile);
            if (fs.existsSync(indexPath)) {
                paths.push(path.normalize(indexPath));
            }
        }

        return paths;
    }

    /**
     * Reload configuration (useful when config changes)
     */
    public reload(): void {
        this.pathMappings = [];
        this.loadPaths = [];
        this.useLoadPaths = false;
        this.loadConfiguration();
    }
}
