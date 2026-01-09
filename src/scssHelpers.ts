import * as vscode from 'vscode';
import * as fs from 'fs';
import { PathResolver } from './pathResolver';

export interface UseStatement {
    moduleName: string;
    filePath: string;
}

export interface SymbolReference {
    moduleName: string | null;
    symbolName: string;
    isInclude: boolean;
}

/**
 * Parse all @use statements in a document
 */
export function parseUseStatements(document: vscode.TextDocument, pathResolver: PathResolver): UseStatement[] {
    const useStatements: UseStatement[] = [];
    const text = document.getText();
    const useRegex = /@use\s+['"]([^'"]+)['"](?:\s+as\s+([\w-]+))?/g;
    
    let match;
    while ((match = useRegex.exec(text)) !== null) {
        const importPath = match[1];
        const alias = match[2];
        
        const resolvedPaths = pathResolver.resolve(importPath, document.uri.fsPath);
        
        if (resolvedPaths.length > 0 && fs.existsSync(resolvedPaths[0])) {
            // Determine module name (alias or last part of path)
            let moduleName: string;
            if (alias) {
                moduleName = alias;
            } else {
                // Use the last part of the import path as module name
                const parts = importPath.split('/');
                moduleName = parts[parts.length - 1].replace(/^_/, '');
            }
            
            useStatements.push({
                moduleName: moduleName,
                filePath: resolvedPaths[0]
            });
        }
    }
    
    return useStatements;
}

/**
 * Parse a symbol reference (variable or mixin)
 */
export function parseSymbolReference(text: string): SymbolReference | null {
    let moduleName: string | null = null;
    let symbolName: string;
    let isInclude = false;
    
    // Check for @include mixin-name or @include module.mixin-name
    const includeMatch = text.match(/@include\s+([\w-]+)\.([\w-]+)|@include\s+([\w-]+)/);
    if (includeMatch) {
        isInclude = true;
        if (includeMatch[1]) {
            // @include module.mixin
            moduleName = includeMatch[1];
            symbolName = '@mixin ' + includeMatch[2];
        } else {
            // @include mixin (no module prefix)
            symbolName = '@mixin ' + includeMatch[3];
        }
    } else {
        // Check for module.$variable or $variable
        const varMatch = text.match(/([\w-]+)\.(\$[\w-]+)|(\$[\w-]+)/);
        if (!varMatch) {
            return null;
        }
        
        if (varMatch[1]) {
            // module.$variable
            moduleName = varMatch[1];
            symbolName = varMatch[2];
        } else {
            // $variable (no module prefix)
            symbolName = varMatch[3];
        }
    }
    
    return { moduleName, symbolName, isInclude };
}

/**
 * Find a symbol declaration location in a specific file
 */
export function findSymbolInFile(filePath: string, symbolName: string): vscode.Location | null {
    if (!fs.existsSync(filePath)) {
        return null;
    }
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        // Create regex pattern based on symbol type
        let pattern: RegExp;
        if (symbolName.startsWith('@mixin ')) {
            const mixinName = symbolName.substring(7);
            pattern = new RegExp(`^\\s*@mixin\\s+${escapeRegex(mixinName)}\\s*[({]`, 'm');
        } else if (symbolName.startsWith('$')) {
            pattern = new RegExp(`^\\s*${escapeRegex(symbolName)}\\s*:`, 'm');
        } else {
            return null;
        }
        
        for (let i = 0; i < lines.length; i++) {
            if (pattern.test(lines[i])) {
                const uri = vscode.Uri.file(filePath);
                const position = new vscode.Position(i, 0);
                return new vscode.Location(uri, position);
            }
        }
    } catch (err) {
        console.error('Error reading file:', err);
    }
    
    return null;
}

/**
 * Find symbol content (variable value or mixin code)
 */
export function findSymbolContent(filePath: string, symbolName: string): string | null {
    if (!fs.existsSync(filePath)) {
        return null;
    }
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        if (symbolName.startsWith('@mixin ')) {
            return extractMixinContent(lines, symbolName.substring(7));
        } else if (symbolName.startsWith('$')) {
            return extractVariableValue(lines, symbolName);
        }
    } catch (err) {
        console.error('Error reading file:', err);
    }
    
    return null;
}

/**
 * Extract variable value from lines
 */
function extractVariableValue(lines: string[], variableName: string): string | null {
    const pattern = new RegExp(`^\\s*${escapeRegex(variableName)}\\s*:\\s*(.+?)\\s*(!default)?\\s*;?\\s*$`, 'm');
    
    for (const line of lines) {
        const match = line.match(pattern);
        if (match) {
            return match[1].trim();
        }
    }
    
    return null;
}

/**
 * Extract mixin content from lines
 */
function extractMixinContent(lines: string[], mixinName: string): string | null {
    const startPattern = new RegExp(`^\\s*@mixin\\s+${escapeRegex(mixinName)}\\s*[({]`, 'm');
    
    let startIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (startPattern.test(lines[i])) {
            startIndex = i;
            break;
        }
    }
    
    if (startIndex === -1) {
        return null;
    }
    
    // Find the closing brace
    let braceCount = 0;
    let inMixin = false;
    const mixinLines: string[] = [];
    
    for (let i = startIndex; i < lines.length && i < startIndex + 50; i++) {
        const line = lines[i];
        mixinLines.push(line);
        
        for (const char of line) {
            if (char === '{') {
                braceCount++;
                inMixin = true;
            } else if (char === '}') {
                braceCount--;
                if (inMixin && braceCount === 0) {
                    return mixinLines.join('\n');
                }
            }
        }
    }
    
    // Return first 20 lines if closing brace not found
    return mixinLines.slice(0, 20).join('\n') + '\n...';
}

/**
 * Escape special regex characters
 */
export function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
