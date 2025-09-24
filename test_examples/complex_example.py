# Complex Tkinter Example with Grid Layout
import tkinter as tk
from tkinter import ttk

root = tk.Tk()
root.title("Complex Grid Layout")
root.geometry("400x300")

# Create a frame
main_frame = tk.Frame(root, relief='raised', borderwidth=2)
main_frame.grid(row=0, column=0, sticky='nsew', padx=5, pady=5)

# Configure grid weights
root.grid_columnconfigure(0, weight=1)
root.grid_rowconfigure(0, weight=1)
main_frame.grid_columnconfigure(1, weight=1)

# Labels and entries
tk.Label(main_frame, text="Name:").grid(row=0, column=0, sticky='w', padx=5, pady=5)
name_entry = tk.Entry(main_frame)
name_entry.grid(row=0, column=1, sticky='ew', padx=5, pady=5)

tk.Label(main_frame, text="Email:").grid(row=1, column=0, sticky='w', padx=5, pady=5)
email_entry = tk.Entry(main_frame)
email_entry.grid(row=1, column=1, sticky='ew', padx=5, pady=5)

# Text widget
tk.Label(main_frame, text="Message:").grid(row=2, column=0, sticky='nw', padx=5, pady=5)
text_widget = tk.Text(main_frame, height=6, width=30)
text_widget.grid(row=2, column=1, sticky='nsew', padx=5, pady=5)

# Buttons frame
button_frame = tk.Frame(main_frame)
button_frame.grid(row=3, column=0, columnspan=2, pady=10)

tk.Button(button_frame, text="Submit").pack(side='left', padx=5)
tk.Button(button_frame, text="Cancel").pack(side='left', padx=5)
tk.Button(button_frame, text="Clear").pack(side='left', padx=5)