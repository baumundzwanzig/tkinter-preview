/**
 * Tkinter Python Code Parser
 * 
 * This module analyzes Python code to extract Tkinter widget definitions,
 * their properties, and layout information without executing the code.
 */

export interface TkinterWidget {
    type: string;
    name?: string;
    parent?: string;
    properties: { [key: string]: any };
    children: TkinterWidget[];
    layoutManager?: 'pack' | 'grid' | 'place';
    layoutOptions?: { [key: string]: any };
    line?: number;
}

export interface ParseResult {
    widgets: TkinterWidget[];
    imports: string[];
    hasErrors: boolean;
    errors: string[];
}

export class TkinterParser {
    private supportedWidgets = [
        'Tk', 'Toplevel', 'Frame', 'LabelFrame',
        'Label', 'Button', 'Entry', 'Text', 'Listbox',
        'Checkbutton', 'Radiobutton', 'Scale', 'Spinbox',
        'Canvas', 'Menu', 'Menubutton', 'OptionMenu',
        'Scrollbar', 'PanedWindow', 'Notebook', 'Progressbar',
        'Combobox', 'Treeview', 'Separator'
    ];

    private layoutManagers = ['pack', 'grid', 'place'];

    /**
     * Parse Python code and extract Tkinter widget structure
     */
    public parse(pythonCode: string): ParseResult {
        const result: ParseResult = {
            widgets: [],
            imports: [],
            hasErrors: false,
            errors: []
        };

        try {
            const lines = pythonCode.split('\n');
            const widgets: TkinterWidget[] = [];
            const variableMap = new Map<string, TkinterWidget>();

            // First pass: Extract imports
            result.imports = this.extractImports(lines);

            // Second pass: Extract widget definitions
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const trimmedLine = line.trim();

                if (trimmedLine.startsWith('#') || trimmedLine === '') {
                    continue;
                }

                // Look for widget creation
                const widgetMatch = this.parseWidgetCreation(trimmedLine, i + 1);
                if (widgetMatch) {
                    widgets.push(widgetMatch);
                    if (widgetMatch.name) {
                        variableMap.set(widgetMatch.name, widgetMatch);
                    }
                    continue;
                }

                // Look for layout manager calls
                const layoutMatch = this.parseLayoutManager(trimmedLine, variableMap);
                if (layoutMatch) {
                    // Layout info is already applied to the widget in parseLayoutManager
                    continue;
                }

                // Look for property assignments
                this.parsePropertyAssignment(trimmedLine, variableMap);
            }

            // Third pass: Build hierarchy
            result.widgets = this.buildHierarchy(widgets, variableMap);

        } catch (error) {
            result.hasErrors = true;
            result.errors.push(`Parsing error: ${error}`);
        }

        return result;
    }

    /**
     * Extract import statements to determine tkinter usage
     */
    private extractImports(lines: string[]): string[] {
        const imports: string[] = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.includes('tkinter') || trimmed.includes('Tkinter')) {
                imports.push(trimmed);
            }
        }

        return imports;
    }

    /**
     * Parse widget creation statements like: root = tk.Tk() or label = Label(root, text="Hello")
     */
    private parseWidgetCreation(line: string, lineNumber: number): TkinterWidget | null {
        // Pattern to match: variable = WidgetType(parent, **options)
        const patterns = [
            // tk.Widget() or tkinter.Widget()
            /^(\w+)\s*=\s*(?:tk\.|tkinter\.)?(\w+)\s*\(([^)]*)\)/,
            // Widget() - direct import
            /^(\w+)\s*=\s*(\w+)\s*\(([^)]*)\)/,
            // Just Widget() without assignment
            /^(?:tk\.|tkinter\.)?(\w+)\s*\(([^)]*)\)/
        ];

        for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
                const hasAssignment = match.length > 3;
                const widgetName = hasAssignment ? match[1] : undefined;
                const widgetType = hasAssignment ? match[2] : match[1];
                const argsString = hasAssignment ? match[3] : match[2];

                if (!this.supportedWidgets.includes(widgetType)) {
                    continue;
                }

                const widget: TkinterWidget = {
                    type: widgetType,
                    name: widgetName,
                    properties: {},
                    children: [],
                    line: lineNumber
                };

                // Parse arguments
                if (argsString.trim()) {
                    const args = this.parseArguments(argsString);
                    if (args.parent) {
                        widget.parent = args.parent;
                    }
                    widget.properties = args.properties;
                }

                return widget;
            }
        }

        return null;
    }

    /**
     * Parse layout manager calls like: widget.pack() or widget.grid(row=0, column=1)
     */
    private parseLayoutManager(line: string, variableMap: Map<string, TkinterWidget>): boolean {
        // Pattern: widget.layout_manager(options)
        const pattern = /^(\w+)\.(\w+)\s*\(([^)]*)\)/;
        const match = line.match(pattern);

        if (match) {
            const variableName = match[1];
            const method = match[2];
            const argsString = match[3];

            if (this.layoutManagers.includes(method)) {
                const widget = variableMap.get(variableName);
                if (widget) {
                    widget.layoutManager = method as 'pack' | 'grid' | 'place';
                    widget.layoutOptions = this.parseLayoutOptions(argsString);
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Parse property assignments like: widget.config(text="New text") or widget['text'] = "New"
     */
    private parsePropertyAssignment(line: string, variableMap: Map<string, TkinterWidget>): boolean {
        // Pattern for config(): widget.config(property=value)
        const configPattern = /^(\w+)\.config\s*\(([^)]*)\)/;
        let match = line.match(configPattern);

        if (match) {
            const variableName = match[1];
            const argsString = match[2];
            const widget = variableMap.get(variableName);
            
            if (widget) {
                const properties = this.parseProperties(argsString);
                Object.assign(widget.properties, properties);
                return true;
            }
        }

        // Pattern for dictionary access: widget['property'] = value
        const dictPattern = /^(\w+)\s*\[\s*['"](\w+)['"]\s*\]\s*=\s*(.+)/;
        match = line.match(dictPattern);

        if (match) {
            const variableName = match[1];
            const property = match[2];
            const value = match[3].trim();
            const widget = variableMap.get(variableName);

            if (widget) {
                widget.properties[property] = this.parseValue(value);
                return true;
            }
        }

        return false;
    }

    /**
     * Parse function arguments and separate parent from properties
     */
    private parseArguments(argsString: string): { parent?: string, properties: { [key: string]: any } } {
        const result: { parent?: string, properties: { [key: string]: any } } = { properties: {} };
        
        if (!argsString.trim()) {
            return result;
        }

        const args = this.splitArguments(argsString);
        
        // First argument without = is usually the parent
        for (let i = 0; i < args.length; i++) {
            const arg = args[i].trim();
            if (arg.includes('=')) {
                const [key, value] = arg.split('=', 2);
                result.properties[key.trim()] = this.parseValue(value.trim());
            } else if (i === 0) {
                // First positional argument is parent
                result.parent = arg;
            }
        }

        return result;
    }

    /**
     * Parse layout manager options
     */
    private parseLayoutOptions(argsString: string): { [key: string]: any } {
        return this.parseProperties(argsString);
    }

    /**
     * Parse properties from key=value pairs
     */
    private parseProperties(argsString: string): { [key: string]: any } {
        const properties: { [key: string]: any } = {};
        
        if (!argsString.trim()) {
            return properties;
        }

        const args = this.splitArguments(argsString);
        
        for (const arg of args) {
            const trimmed = arg.trim();
            if (trimmed.includes('=')) {
                const [key, value] = trimmed.split('=', 2);
                properties[key.trim()] = this.parseValue(value.trim());
            }
        }

        return properties;
    }

    /**
     * Split arguments respecting quotes and nested parentheses
     */
    private splitArguments(argsString: string): string[] {
        const args: string[] = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';
        let parenDepth = 0;

        for (let i = 0; i < argsString.length; i++) {
            const char = argsString[i];

            if (!inQuotes && (char === '"' || char === "'")) {
                inQuotes = true;
                quoteChar = char;
            } else if (inQuotes && char === quoteChar) {
                inQuotes = false;
                quoteChar = '';
            } else if (!inQuotes && char === '(') {
                parenDepth++;
            } else if (!inQuotes && char === ')') {
                parenDepth--;
            } else if (!inQuotes && char === ',' && parenDepth === 0) {
                args.push(current);
                current = '';
                continue;
            }

            current += char;
        }

        if (current.trim()) {
            args.push(current);
        }

        return args;
    }

    /**
     * Parse a value (string, number, boolean, etc.)
     */
    private parseValue(value: string): any {
        value = value.trim();

        // Boolean values
        if (value === 'True') {
            return true;
        }
        if (value === 'False') {
            return false;
        }
        if (value === 'None') {
            return null;
        }

        // String values
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
            return value.slice(1, -1);
        }

        // Number values
        if (/^-?\d+$/.test(value)) {
            return parseInt(value);
        }
        if (/^-?\d*\.\d+$/.test(value)) {
            return parseFloat(value);
        }

        // Variable references or complex expressions - return as string
        return value;
    }

    /**
     * Build widget hierarchy from flat list
     */
    private buildHierarchy(widgets: TkinterWidget[], variableMap: Map<string, TkinterWidget>): TkinterWidget[] {
        const roots: TkinterWidget[] = [];
        
        for (const widget of widgets) {
            if (widget.parent) {
                const parent = variableMap.get(widget.parent);
                if (parent) {
                    parent.children.push(widget);
                } else {
                    // Parent not found, treat as root
                    roots.push(widget);
                }
            } else {
                roots.push(widget);
            }
        }

        return roots;
    }

    /**
     * Check if the Python code contains Tkinter imports
     */
    public static hasTkinterImports(pythonCode: string): boolean {
        const lines = pythonCode.split('\n');
        return lines.some(line => {
            const trimmed = line.trim();
            return (trimmed.includes('import tkinter') || 
                   trimmed.includes('import Tkinter') ||
                   trimmed.includes('from tkinter') ||
                   trimmed.includes('from Tkinter'));
        });
    }
}