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
    private baseUrl: string;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
        this.baseUrl = '.';
        this.loadPathMappings();
    }

    /**
     * Load path mappings from VS Code configuration
     */
    private loadPathMappings(): void {
        const config = vscode.workspace.getConfiguration('scssNavigation');
        const mappings = config.get<Record<string, string>>('pathMappings', {});
        this.baseUrl = config.get<string>('baseUrl', '.');

        this.pathMappings = [];
        for (const [pattern, targetPath] of Object.entries(mappings)) {
            this.pathMappings.push({
                pattern: pattern,
                targetPath: targetPath
            });
        }
    }

    /**
     * Resolve a module path using configured path mappings
     */
    public resolve(importPath: string, currentFilePath: string): string[] {
        const possiblePaths: string[] = [];

        // Try path mappings first
        for (const mapping of this.pathMappings) {
            const pattern = mapping.pattern.replace(/\*/g, '(.*)');
            const regex = new RegExp(`^${pattern}$`);
            const match = importPath.match(regex);

            if (match) {
                const captured = match[1] || '';
                const resolvedPath = mapping.targetPath.replace(/\*/g, captured);
                const baseDir = path.join(this.workspaceRoot, this.baseUrl);
                
                const fullPath = path.join(baseDir, resolvedPath);
                possiblePaths.push(...this.tryExtensions(fullPath));
            }
        }

        // If no mapping found, try relative to current file
        if (possiblePaths.length === 0) {
            const currentDir = path.dirname(currentFilePath);
            const relativePath = path.join(currentDir, importPath);
            possiblePaths.push(...this.tryExtensions(relativePath));
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
     * Reload path mappings (useful when config changes)
     */
    public reload(): void {
        this.pathMappings = [];
        this.baseUrl = '.';
        this.loadPathMappings();
    }
}
