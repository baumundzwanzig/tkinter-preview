/**
 * Simple Tkinter to HTML Converter - Focused on basic widgets only
 */

import { TkinterWidget } from '../parser/tkinterParser';
import { TkinterBehaviorEngine } from '../behavior/behaviorEngine';

export interface ConversionResult {
    html: string;
    css: string;
    hasErrors: boolean;
    errors: string[];
}

export class TkinterHtmlConverter {
    private idCounter = 0;
    private errors: string[] = [];
    private behaviorEngine: TkinterBehaviorEngine;

    constructor() {
        this.behaviorEngine = new TkinterBehaviorEngine();
    }

    /**
     * Convert Tkinter widgets to HTML - simplified version
     */
    public convert(widgets: TkinterWidget[]): ConversionResult {
        this.idCounter = 0;
        this.errors = [];

        try {
            // Apply Tkinter behaviors before conversion
            const behaviorResult = this.behaviorEngine.applyBehaviors(widgets);
            
            // Add behavior warnings to errors
            if (behaviorResult.warnings.length > 0) {
                this.errors.push(...behaviorResult.warnings.map(w => `Behavior warning: ${w}`));
            }

            // Generate HTML from behavior-modified widgets
            const html = this.generateSimpleHtml(behaviorResult.modifiedWidgets);
            const css = this.generateSimpleCSS();

            return {
                html,
                css,
                hasErrors: this.errors.length > 0,
                errors: [...this.errors]
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown conversion error';
            this.errors.push(`Conversion error: ${errorMessage}`);
            
            return {
                html: `<div class="tkinter-error">Conversion failed: ${errorMessage}</div>`,
                css: this.generateSimpleCSS(),
                hasErrors: true,
                errors: [...this.errors]
            };
        }
    }

    /**
     * Generate simple HTML structure
     */
    private generateSimpleHtml(widgets: TkinterWidget[]): string {
        if (widgets.length === 0) {
            return '<div class="tkinter-empty">No Tkinter widgets found</div>';
        }

        let html = '';
        
        for (const widget of widgets) {
            html += this.generateSimpleWidget(widget);
        }
        
        return html;
    }

    /**
     * Generate HTML for a widget - simplified approach
     */
    private generateSimpleWidget(widget: TkinterWidget): string {
        const widgetId = `tkinter-widget-${++this.idCounter}`;
        
        switch (widget.type.toLowerCase()) {
            case 'tk':
            case 'toplevel':
                return this.generateWindow(widget, widgetId);
            
            case 'label':
                return this.generateLabel(widget, widgetId);
            
            case 'button':
                return this.generateButton(widget, widgetId);
            
            default:
                // Ignoriere andere Widgets für jetzt
                return '';
        }
    }

    /**
     * Generate window HTML
     */
    private generateWindow(widget: TkinterWidget, id: string): string {
        const title = widget.properties.title || 'Tk';
        
        let html = `<div id="${id}" class="tk-window">`;
        html += `<div class="tk-titlebar">${this.escapeHtml(title)}</div>`;
        html += '<div class="tk-content">';
        
        // Pack children vertically
        for (const child of widget.children) {
            html += this.generateSimpleWidget(child);
        }
        
        html += '</div></div>';
        return html;
    }

    /**
     * Generate label HTML
     */
    private generateLabel(widget: TkinterWidget, id: string): string {
        const text = widget.properties.text || '';
        const styles = this.getWidgetStyles(widget);
        return `<div id="${id}" class="tk-label" style="${styles}">${this.escapeHtml(text)}</div>`;
    }

    /**
     * Generate button HTML
     */
    private generateButton(widget: TkinterWidget, id: string): string {
        const text = widget.properties.text || 'Button';
        const styles = this.getWidgetStyles(widget);
        return `<button id="${id}" class="tk-button" style="${styles}">${this.escapeHtml(text)}</button>`;
    }

    /**
     * Get styles for a widget including pack options
     */
    private getWidgetStyles(widget: TkinterWidget): string {
        const styles: string[] = [];
        
        // Pack-Layout-Optionen berücksichtigen
        if (widget.layoutManager === 'pack' && widget.layoutOptions) {
            const options = widget.layoutOptions;
            
            // padx und pady umwandeln
            if (options.padx !== undefined) {
                const padx = parseInt(String(options.padx)) || 0;
                styles.push(`margin-left: ${padx}px`);
                styles.push(`margin-right: ${padx}px`);
            }
            
            if (options.pady !== undefined) {
                const pady = parseInt(String(options.pady)) || 0;
                styles.push(`margin-top: ${pady}px`);
                styles.push(`margin-bottom: ${pady}px`);
            }
            
            // ipadx und ipady (internal padding)
            if (options.ipadx !== undefined) {
                const ipadx = parseInt(String(options.ipadx)) || 0;
                styles.push(`padding-left: ${ipadx}px`);
                styles.push(`padding-right: ${ipadx}px`);
            }
            
            if (options.ipady !== undefined) {
                const ipady = parseInt(String(options.ipady)) || 0;
                styles.push(`padding-top: ${ipady}px`);
                styles.push(`padding-bottom: ${ipady}px`);
            }
        }
        
        // Widget-spezifische Properties
        if (widget.properties.bg || widget.properties.background) {
            styles.push(`background-color: ${widget.properties.bg || widget.properties.background}`);
        }
        
        if (widget.properties.fg || widget.properties.foreground) {
            styles.push(`color: ${widget.properties.fg || widget.properties.foreground}`);
        }
        
        if (widget.properties.width) {
            const width = parseInt(String(widget.properties.width)) || 0;
            if (width > 0) {
                // Bei Tkinter ist width oft in Zeichen, wir konvertieren zu Pixeln
                styles.push(`width: ${width * 8}px`);
            }
        }
        
        if (widget.properties.height) {
            const height = parseInt(String(widget.properties.height)) || 0;
            if (height > 0) {
                styles.push(`height: ${height * 16}px`); // Approximation für Zeilen
            }
        }
        
        return styles.join('; ');
    }

    /**
     * Escape HTML entities
     */
    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Generate simple CSS that mimics Tkinter behavior
     */
    private generateSimpleCSS(): string {
        return `
/* Reset */
* {
    box-sizing: border-box;
}

/* Tkinter Window */
.tk-window {
    background: #f0f0f0;
    border: 2px outset #ddd;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 9pt;
    margin: 10px auto;
    display: inline-block;
    /* Entferne min-width und lasse das Fenster sich an den Inhalt anpassen */
}

.tk-titlebar {
    background: linear-gradient(to bottom, #e8e8e8, #d0d0d0);
    border-bottom: 1px solid #999;
    padding: 4px 8px;
    font-weight: bold;
    font-size: 8pt;
    color: #000;
}

/* Window content - minimales Padding wie in echtem Tkinter */
.tk-content {
    padding: 4px; /* Sehr wenig Padding */
    text-align: center; /* Center align children horizontally */
}

/* Tkinter Label - kein Padding/Margin */
.tk-label {
    display: block; /* Block display for vertical stacking */
    margin: 0; /* Kein Margin */
    padding: 0; /* Kein Padding */
    color: #000;
    background: transparent;
    font-size: 9pt;
    width: fit-content; /* Only as wide as needed */
    margin-left: auto;
    margin-right: auto;
}

/* Tkinter Button - minimales Padding wie in echtem Tkinter */
.tk-button {
    display: block; /* Block display for vertical stacking */
    margin: 0 auto; /* Nur horizontale Zentrierung */
    padding: 1px 6px; /* Sehr wenig Padding wie in echtem Tkinter */
    border: 2px outset #ddd;
    background: linear-gradient(to bottom, #f8f8f8, #e0e0e0);
    color: #000;
    font-family: inherit;
    font-size: 9pt;
    cursor: pointer;
    width: fit-content; /* Only as wide as needed */
}

.tk-button:hover {
    background: linear-gradient(to bottom, #f0f0f0, #d8d8d8);
}

.tk-button:active {
    border-style: inset;
}

/* Error and empty states */
.tkinter-empty {
    padding: 20px;
    text-align: center;
    color: #666;
    font-style: italic;
}

.tkinter-error {
    padding: 20px;
    text-align: center;
    color: #d32f2f;
    background: #fff3f3;
    border: 1px solid #ffcdd2;
    border-radius: 4px;
}
`;
    }
}