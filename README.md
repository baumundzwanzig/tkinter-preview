# Tkinter Preview Extension

Eine VS Code Extension, die eine Live-Vorschau von Tkinter GUI-Anwendungen bereitstellt, ohne Python-Code ausführen zu müssen.

## Features

- **🔍 Live-Vorschau**: Zeigt Tkinter-Widgets in Echtzeit als HTML-Darstellung an
- **⚡ Ohne Code-Ausführung**: Analysiert Python-Code statisch, ohne ihn auszuführen
- **🎨 Authentisches Design**: Nachbildung des nativen Tkinter-Looks mit CSS
- **🔄 Auto-Refresh**: Automatische Aktualisierung bei Dateiänderungen
- **📐 Layout-Manager**: Unterstützung für pack, grid und place Layout-Manager
- **🧩 Widget-Unterstützung**: Umfassende Unterstützung für Standard-Tkinter-Widgets

## Unterstützte Widgets

### Container-Widgets
- `Tk` (Hauptfenster)
- `Toplevel` (Zusätzliche Fenster)
- `Frame` (Container)
- `LabelFrame` (Container mit Label)

### Input-Widgets
- `Button` (Schaltfläche)
- `Label` (Text-Label)
- `Entry` (Eingabefeld)
- `Text` (Mehrzeiliges Textfeld)
- `Checkbutton` (Checkbox)
- `Radiobutton` (Radio-Button)
- `Listbox` (Listenfeld)
- `Scale` (Schieberegler)
- `Spinbox` (Zahlen-Eingabe)

### Display-Widgets
- `Canvas` (Zeichenfläche)
- `Menu` (Menü)
- `Scrollbar` (Scrollleiste)
- `Progressbar` (Fortschrittsbalken)

## Installation

1. Installieren Sie die Extension aus dem VS Code Marketplace
2. Öffnen Sie eine Python-Datei mit Tkinter-Code
3. Klicken Sie auf das Preview-Symbol in der Editor-Toolbar oder verwenden Sie den Befehl "Open Tkinter Preview"

## Verwendung

### Grundlegende Verwendung

1. Erstellen Sie eine Python-Datei mit Tkinter-Code:

```python
import tkinter as tk

root = tk.Tk()
root.title("Meine App")

label = tk.Label(root, text="Hallo Welt!")
label.pack()

button = tk.Button(root, text="Klick mich!")
button.pack()

# root.mainloop() # Nicht erforderlich für Preview
```

2. Öffnen Sie die Datei in VS Code
3. Klicken Sie auf das Preview-Symbol (👁️) in der Editor-Toolbar
4. Die Vorschau öffnet sich in einem separaten Panel

### Erweiterte Features

**Layout-Manager:**
```python
# Grid Layout
label.grid(row=0, column=0)
button.grid(row=1, column=0)

# Pack Layout
label.pack(side='top', fill='x')
button.pack(side='bottom')

# Place Layout
label.place(x=10, y=10)
button.place(x=10, y=50)
```

**Widget-Eigenschaften:**
```python
# Styling
widget = tk.Button(root, text="Button", 
                   bg='blue', fg='white',
                   font=('Arial', 12, 'bold'))

# Größe
widget = tk.Entry(root, width=20)
```

## Befehle

- **Tkinter Preview: Open Preview** (`tkinter-preview.openPreview`)
  - Öffnet die Vorschau für die aktuelle Python-Datei
- **Tkinter Preview: Refresh** (`tkinter-preview.refreshPreview`)
  - Aktualisiert die Vorschau manuell

## Konfiguration

Die Extension kann über VS Code-Einstellungen konfiguriert werden:

```json
{
  "tkinter-preview.autoRefresh": true,
  "tkinter-preview.refreshDelay": 500,
  "tkinter-preview.showErrors": true
}
```

### Verfügbare Einstellungen

- `autoRefresh`: Automatische Aktualisierung bei Dateiänderungen (Standard: true)
- `refreshDelay`: Verzögerung in Millisekunden vor der Aktualisierung (Standard: 500)
- `showErrors`: Zeige Parsing-Fehler in der Vorschau (Standard: true)

## Limitierungen

### Was funktioniert:
- ✅ Widget-Erstellung und -Eigenschaften
- ✅ Layout-Manager (pack, grid, place)
- ✅ Grundlegende Styling-Eigenschaften
- ✅ Widget-Hierarchien
- ✅ Standard-Widget-Verhalten

### Was nicht funktioniert:
- ❌ Dynamisches Verhalten (Event-Handler)
- ❌ Komplexe Python-Logik
- ❌ Externe Abhängigkeiten
- ❌ Zeichnungen auf Canvas
- ❌ Menü-Interaktionen

## Fehlerbehebung

### Preview zeigt nichts an
- Überprüfen Sie, ob die Python-Datei gültige Tkinter-Imports enthält
- Stellen Sie sicher, dass Widgets erstellt und einem Layout-Manager zugewiesen sind

### Widgets werden nicht korrekt angezeigt
- Überprüfen Sie die Debug-Ausgabe (🐛 Debug-Button in der Preview)
- Häufige Probleme: Fehlende Eltern-Widgets, ungültige Eigenschaften

### Auto-Refresh funktioniert nicht
- Überprüfen Sie die Einstellung `tkinter-preview.autoRefresh`
- Versuchen Sie eine manuelle Aktualisierung (🔄 Refresh-Button)

## Entwicklung

### Lokale Entwicklung

```bash
# Repository klonen
git clone [repository-url]
cd tkinter-preview

# Abhängigkeiten installieren
npm install

# Extension kompilieren
npm run compile

# Im Watch-Modus entwickeln
npm run watch
```

### Architektur

Die Extension besteht aus folgenden Hauptkomponenten:

- **Parser** (`src/parser/`): Analysiert Python-Code und extrahiert Tkinter-Widgets
- **Converter** (`src/converter/`): Wandelt Tkinter-Widgets in HTML/CSS um
- **Behavior Engine** (`src/behavior/`): Implementiert Tkinter-spezifisches Verhalten
- **Webview** (`src/webview/`): Verwaltet das Preview-Panel
- **File Watcher** (`src/watcher/`): Überwacht Dateiänderungen

## Beitragen

Beiträge sind willkommen! Bitte:

1. Forken Sie das Repository
2. Erstellen Sie einen Feature-Branch
3. Implementieren Sie Ihre Änderungen
4. Fügen Sie Tests hinzu
5. Senden Sie einen Pull Request

## Lizenz

MIT License - siehe LICENSE-Datei für Details.

## Changelog

### Version 0.0.1
- Erste Implementierung
- Grundlegende Widget-Unterstützung
- Layout-Manager-Unterstützung
- Live-Preview-Funktionalität
- Auto-Refresh-Feature
