/**
 * File Watcher for Tkinter Preview
 * 
 * Monitors Python files for changes and triggers preview updates
 */

import * as vscode from 'vscode';
import { TkinterPreviewPanel } from '../webview/previewPanel';
import { TkinterParser } from '../parser/tkinterParser';

export class TkinterFileWatcher {
    private fileSystemWatcher: vscode.FileSystemWatcher | undefined;
    private textDocumentWatcher: vscode.Disposable | undefined;
    private updateTimeouts: Map<string, NodeJS.Timeout> = new Map();
    private disposables: vscode.Disposable[] = [];
    private currentPythonFile: vscode.Uri | undefined;

    constructor(private extensionUri: vscode.Uri) {
        this.setupWatchers();
    }

    private setupWatchers() {
        // Watch for Python file changes on disk
        this.fileSystemWatcher = vscode.workspace.createFileSystemWatcher(
            '**/*.py',
            false, // don't ignore create
            false, // don't ignore change
            true   // ignore delete for now
        );

        // Handle file system changes
        this.fileSystemWatcher.onDidChange((uri) => {
            this.handleFileChange(uri);
        }, null, this.disposables);

        this.fileSystemWatcher.onDidCreate((uri) => {
            this.handleFileChange(uri);
        }, null, this.disposables);

        // Watch for active editor changes
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            this.handleActiveEditorChange(editor);
        }, null, this.disposables);

        // Watch for text document changes (in-editor changes)
        this.textDocumentWatcher = vscode.workspace.onDidChangeTextDocument((event) => {
            this.handleTextDocumentChange(event);
        }, null, this.disposables);

        // Initialize with current active editor
        this.handleActiveEditorChange(vscode.window.activeTextEditor);
    }

    private handleFileChange(uri: vscode.Uri) {
        if (!this.shouldHandleFile(uri)) {
            return;
        }

        // Check if this file has Tkinter imports (read file content)
        vscode.workspace.fs.readFile(uri).then((content) => {
            const pythonCode = Buffer.from(content).toString('utf8');
            if (TkinterParser.hasTkinterImports(pythonCode)) {
                this.scheduleUpdate(uri);
            }
        }, (error: any) => {
            console.log(`Error reading file ${uri.fsPath}: ${error.message}`);
        });
    }

    private handleActiveEditorChange(editor: vscode.TextEditor | undefined) {
        if (!editor || !this.shouldHandleFile(editor.document.uri)) {
            return;
        }

        const uri = editor.document.uri;
        const pythonCode = editor.document.getText();

        if (TkinterParser.hasTkinterImports(pythonCode)) {
            this.currentPythonFile = uri;
            
            // Set context for command availability
            vscode.commands.executeCommand('setContext', 'tkinter-preview.hastkinter', true);
            
            // Update preview if panel is open
            if (TkinterPreviewPanel.currentPanel) {
                this.scheduleUpdate(uri);
            }
        } else {
            vscode.commands.executeCommand('setContext', 'tkinter-preview.hastkinter', false);
        }
    }

    private handleTextDocumentChange(event: vscode.TextDocumentChangeEvent) {
        const uri = event.document.uri;
        
        if (!this.shouldHandleFile(uri)) {
            return;
        }

        // Get configuration for auto-refresh
        const config = vscode.workspace.getConfiguration('tkinter-preview');
        const autoRefresh = config.get<boolean>('autoRefresh', true);
        
        if (!autoRefresh) {
            return;
        }

        const pythonCode = event.document.getText();
        
        if (TkinterParser.hasTkinterImports(pythonCode)) {
            // Update context
            vscode.commands.executeCommand('setContext', 'tkinter-preview.hastkinter', true);
            
            // Schedule update if preview panel is open
            if (TkinterPreviewPanel.currentPanel) {
                this.scheduleUpdate(uri, true); // Use debouncing for text changes
            }
        } else {
            vscode.commands.executeCommand('setContext', 'tkinter-preview.hastkinter', false);
        }
    }

    private scheduleUpdate(uri: vscode.Uri, useDebouncing: boolean = false) {
        const key = uri.toString();
        
        // Clear existing timeout for this file
        const existingTimeout = this.updateTimeouts.get(key);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        // Get debouncing delay from configuration
        const config = vscode.workspace.getConfiguration('tkinter-preview');
        const delay = useDebouncing ? config.get<number>('refreshDelay', 500) : 100;

        // Schedule new update
        const timeout = setTimeout(() => {
            this.updatePreview(uri);
            this.updateTimeouts.delete(key);
        }, delay);

        this.updateTimeouts.set(key, timeout);
    }

    private updatePreview(uri: vscode.Uri) {
        if (TkinterPreviewPanel.currentPanel) {
            TkinterPreviewPanel.currentPanel.updateContent(uri);
        }
    }

    private shouldHandleFile(uri: vscode.Uri): boolean {
        // Only handle Python files
        if (!uri.fsPath.endsWith('.py')) {
            return false;
        }

        // Don't handle files that are not in the workspace
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (!workspaceFolder) {
            return false;
        }

        return true;
    }

    public getCurrentPythonFile(): vscode.Uri | undefined {
        return this.currentPythonFile;
    }

    public setCurrentPythonFile(uri: vscode.Uri) {
        this.currentPythonFile = uri;
    }

    public forceRefresh() {
        if (this.currentPythonFile && TkinterPreviewPanel.currentPanel) {
            this.updatePreview(this.currentPythonFile);
        }
    }

    public dispose() {
        // Clear all timeouts
        for (const timeout of this.updateTimeouts.values()) {
            clearTimeout(timeout);
        }
        this.updateTimeouts.clear();

        // Dispose watchers
        if (this.fileSystemWatcher) {
            this.fileSystemWatcher.dispose();
        }

        if (this.textDocumentWatcher) {
            this.textDocumentWatcher.dispose();
        }

        // Dispose all subscriptions
        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}