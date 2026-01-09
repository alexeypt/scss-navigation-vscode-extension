import * as vscode from 'vscode';
import * as fs from 'fs';
import { PathResolver } from './pathResolver';
import { parseUseStatements, findSymbolContent, escapeRegex } from './scssHelpers';

interface ScssSymbol {
    name: string;
    type: 'variable' | 'mixin' | 'function';
    moduleName: string | null;
    value?: string;
}

export class ScssCompletionProvider implements vscode.CompletionItemProvider {
    private pathResolver: PathResolver;

    constructor(workspaceRoot: string) {
        this.pathResolver = new PathResolver(workspaceRoot);
    }

    public provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken,
        _context: vscode.CompletionContext
    ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
        const lineText = document.lineAt(position.line).text;
        const textBeforeCursor = lineText.substring(0, position.character);

        // Get all @use statements
        const useStatements = parseUseStatements(document, this.pathResolver);
        const symbols: ScssSymbol[] = [];

        // Collect symbols from current file
        symbols.push(...this.extractSymbolsFromFile(document.uri.fsPath, null));

        // Collect symbols from all imported files
        for (const useStatement of useStatements) {
            symbols.push(...this.extractSymbolsFromFile(useStatement.filePath, useStatement.moduleName));
        }

        // Check what type of completion to provide
        if (textBeforeCursor.match(/@include\s+[\w-]*$/)) {
            // Mixin completion
            return this.createMixinCompletions(symbols);
        } else if (textBeforeCursor.match(/\$[\w-]*$/)) {
            // Variable completion
            return this.createVariableCompletions(symbols);
        } else if (textBeforeCursor.match(/[\w-]+\(/)) {
            // Function completion
            return this.createFunctionCompletions(symbols);
        }

        return [];
    }

    /**
     * Extract all symbols (variables, mixins, functions) from a file
     */
    private extractSymbolsFromFile(filePath: string, moduleName: string | null): ScssSymbol[] {
        if (!fs.existsSync(filePath)) {
            return [];
        }

        const symbols: ScssSymbol[] = [];

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');

            for (const line of lines) {
                // Extract variables: $variable-name: value;
                const varMatch = line.match(/^\s*(\$[\w-]+)\s*:\s*(.+?)(?:\s*!default)?\s*;/);
                if (varMatch) {
                    symbols.push({
                        name: varMatch[1],
                        type: 'variable',
                        moduleName: moduleName,
                        value: varMatch[2].trim()
                    });
                }

                // Extract mixins: @mixin mixin-name
                const mixinMatch = line.match(/^\s*@mixin\s+([\w-]+)\s*(\([^)]*\))?/);
                if (mixinMatch) {
                    symbols.push({
                        name: mixinMatch[1],
                        type: 'mixin',
                        moduleName: moduleName,
                        value: mixinMatch[2] || '()'
                    });
                }

                // Extract functions: @function function-name
                const funcMatch = line.match(/^\s*@function\s+([\w-]+)\s*(\([^)]*\))?/);
                if (funcMatch) {
                    symbols.push({
                        name: funcMatch[1],
                        type: 'function',
                        moduleName: moduleName,
                        value: funcMatch[2] || '()'
                    });
                }
            }
        } catch (err) {
            console.error('Error reading file:', err);
        }

        return symbols;
    }

    /**
     * Create completion items for variables
     */
    private createVariableCompletions(symbols: ScssSymbol[]): vscode.CompletionItem[] {
        return symbols
            .filter(s => s.type === 'variable')
            .map(symbol => {
                const item = new vscode.CompletionItem(
                    symbol.moduleName ? `${symbol.moduleName}.${symbol.name}` : symbol.name,
                    vscode.CompletionItemKind.Variable
                );
                
                item.insertText = symbol.moduleName ? `${symbol.moduleName}.${symbol.name}` : symbol.name;
                item.detail = symbol.value || '';
                item.documentation = new vscode.MarkdownString(`**${symbol.name}**\n\n\`\`\`scss\n${symbol.value}\n\`\`\``);
                
                // Sort local variables first
                item.sortText = symbol.moduleName ? `1_${symbol.name}` : `0_${symbol.name}`;
                
                return item;
            });
    }

    /**
     * Create completion items for mixins
     */
    private createMixinCompletions(symbols: ScssSymbol[]): vscode.CompletionItem[] {
        return symbols
            .filter(s => s.type === 'mixin')
            .map(symbol => {
                const item = new vscode.CompletionItem(
                    symbol.moduleName ? `${symbol.moduleName}.${symbol.name}` : symbol.name,
                    vscode.CompletionItemKind.Function
                );
                
                item.insertText = symbol.moduleName 
                    ? `${symbol.moduleName}.${symbol.name}${symbol.value}`
                    : `${symbol.name}${symbol.value}`;
                item.detail = `@mixin ${symbol.name}${symbol.value}`;
                
                // Get full mixin content for documentation
                const documentation = new vscode.MarkdownString();
                documentation.appendCodeblock(`@mixin ${symbol.name}${symbol.value}`, 'scss');
                item.documentation = documentation;
                
                // Sort local mixins first
                item.sortText = symbol.moduleName ? `1_${symbol.name}` : `0_${symbol.name}`;
                
                return item;
            });
    }

    /**
     * Create completion items for functions
     */
    private createFunctionCompletions(symbols: ScssSymbol[]): vscode.CompletionItem[] {
        return symbols
            .filter(s => s.type === 'function')
            .map(symbol => {
                const item = new vscode.CompletionItem(
                    symbol.moduleName ? `${symbol.moduleName}.${symbol.name}` : symbol.name,
                    vscode.CompletionItemKind.Function
                );
                
                item.insertText = symbol.moduleName 
                    ? `${symbol.moduleName}.${symbol.name}${symbol.value}`
                    : `${symbol.name}${symbol.value}`;
                item.detail = `@function ${symbol.name}${symbol.value}`;
                
                const documentation = new vscode.MarkdownString();
                documentation.appendCodeblock(`@function ${symbol.name}${symbol.value}`, 'scss');
                item.documentation = documentation;
                
                // Sort local functions first
                item.sortText = symbol.moduleName ? `1_${symbol.name}` : `0_${symbol.name}`;
                
                return item;
            });
    }

    /**
     * Reload path mappings
     */
    public reload(): void {
        this.pathResolver.reload();
    }
}
