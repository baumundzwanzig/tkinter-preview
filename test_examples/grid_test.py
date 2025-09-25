# Tkinter Grid Layout Test
import tkinter as tk

root = tk.Tk()
root.title("Grid Layout Test")

# Grid Layout: 2x2 Raster
label1 = tk.Label(root, text="Row 0, Col 0")
label1.grid(row=0, column=0)

button1 = tk.Button(root, text="Row 0, Col 1")
button1.grid(row=0, column=1)

label2 = tk.Label(root, text="Row 1, Col 0")
label2.grid(row=1, column=0)

button2 = tk.Button(root, text="Row 1, Col 1")
button2.grid(row=1, column=1)

# Mit Padding
label3 = tk.Label(root, text="With Padding")
label3.grid(row=2, column=0, padx=10, pady=5)

# Mit Sticky
button3 = tk.Button(root, text="Sticky East")
button3.grid(row=2, column=1, sticky="e")

# Mit Span
label4 = tk.Label(root, text="Column Span 2")
label4.grid(row=3, column=0, columnspan=2, sticky="ew")