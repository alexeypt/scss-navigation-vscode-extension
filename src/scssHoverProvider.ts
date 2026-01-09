import * as vscode from 'vscode';
import { PathResolver } from './pathResolver';
import { parseUseStatements, parseSymbolReference, findSymbolContent } from './scssHelpers';

export class ScssHoverProvider implements vscode.HoverProvider {
    private pathResolver: PathResolver;

    constructor(workspaceRoot: string) {
        this.pathResolver = new PathResolver(workspaceRoot);
    }

    public provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        const range = document.getWordRangeAtPosition(position, /[\w-]+\.\$[\w-]+|\$[\w-]+|@include\s+[\w-]+\.[\w-]+|@include\s+[\w-]+/);
        
        if (!range) {
            return null;
        }

        const text = document.getText(range);
        const symbolRef = parseSymbolReference(text);
        
        if (!symbolRef) {
            return null;
        }

        const { moduleName, symbolName, isInclude } = symbolRef;

        // Get all @use statements in the document
        const useStatements = parseUseStatements(document, this.pathResolver);
        
        let targetFile: string | null = null;
        
        if (moduleName) {
            // Find the file for the specified module
            const useStatement = useStatements.find(u => u.moduleName === moduleName);
            if (useStatement) {
                targetFile = useStatement.filePath;
            }
        } else {
            // No module prefix, search current file first, then all imported files
            const content = findSymbolContent(document.uri.fsPath, symbolName);
            if (content) {
                return new vscode.Hover(this.formatHoverContent(symbolName, content, isInclude));
            }
            
            // Search in all imported files
            for (const useStatement of useStatements) {
                const content = findSymbolContent(useStatement.filePath, symbolName);
                if (content) {
                    return new vscode.Hover(this.formatHoverContent(symbolName, content, isInclude));
                }
            }
            
            return null;
        }
        
        if (!targetFile) {
            return null;
        }
        
        const content = findSymbolContent(targetFile, symbolName);
        if (content) {
            return new vscode.Hover(this.formatHoverContent(symbolName, content, isInclude));
        }
        
        return null;
    }

    /**
     * Format hover content
     */
    private formatHoverContent(symbolName: string, content: string, isInclude: boolean): vscode.MarkdownString {
        const markdown = new vscode.MarkdownString();
        markdown.supportHtml = true;
        markdown.isTrusted = true;
        
        if (isInclude) {
            // For mixins, show the full mixin code
            markdown.appendCodeblock(content, 'scss');
        } else {
            // For variables, show the value
            markdown.appendMarkdown(`**${symbolName}**\n\n`);
            markdown.appendCodeblock(content, 'scss');
        }
        
        return markdown;
    }

    /**
     * Reload path mappings
     */
    public reload(): void {
        this.pathResolver.reload();
    }
}
