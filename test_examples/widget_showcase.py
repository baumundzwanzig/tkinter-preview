# Tkinter Example with Different Widget Types
import tkinter as tk
from tkinter import ttk

root = tk.Tk()
root.title("Widget Showcase")

# LabelFrame for grouping
input_frame = tk.LabelFrame(root, text="Input Controls")
input_frame.pack(fill='x', padx=10, pady=5)

# Various input widgets
tk.Label(input_frame, text="Text Entry:").grid(row=0, column=0, sticky='w', padx=5, pady=2)
entry = tk.Entry(input_frame)
entry.grid(row=0, column=1, sticky='ew', padx=5, pady=2)

tk.Label(input_frame, text="Checkbox:").grid(row=1, column=0, sticky='w', padx=5, pady=2)
checkbox = tk.Checkbutton(input_frame, text="Enable feature")
checkbox.grid(row=1, column=1, sticky='w', padx=5, pady=2)

tk.Label(input_frame, text="Radio Buttons:").grid(row=2, column=0, sticky='w', padx=5, pady=2)
radio_frame = tk.Frame(input_frame)
radio_frame.grid(row=2, column=1, sticky='w', padx=5, pady=2)

radio_var = tk.StringVar()
tk.Radiobutton(radio_frame, text="Option 1", variable=radio_var, value="1").pack(side='left')
tk.Radiobutton(radio_frame, text="Option 2", variable=radio_var, value="2").pack(side='left')

# Configure column weight
input_frame.grid_columnconfigure(1, weight=1)

# Display frame
display_frame = tk.LabelFrame(root, text="Display Controls")
display_frame.pack(fill='both', expand=True, padx=10, pady=5)

# Listbox
tk.Label(display_frame, text="Listbox:").pack(anchor='w', padx=5)
listbox = tk.Listbox(display_frame, height=4)
listbox.pack(fill='x', padx=5, pady=2)

# Canvas
tk.Label(display_frame, text="Canvas:").pack(anchor='w', padx=5, pady=(10,0))
canvas = tk.Canvas(display_frame, height=100, bg='white')
canvas.pack(fill='x', padx=5, pady=2)

# Button frame
button_frame = tk.Frame(root)
button_frame.pack(fill='x', padx=10, pady=5)

tk.Button(button_frame, text="OK").pack(side='left', padx=5)
tk.Button(button_frame, text="Apply").pack(side='left', padx=5)
tk.Button(button_frame, text="Cancel").pack(side='right', padx=5)