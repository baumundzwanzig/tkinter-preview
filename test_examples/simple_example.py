# Simple Tkinter Example
import tkinter as tk

root = tk.Tk()
root.title("Hello Tkinter")

label = tk.Label(root, text="Hello, World!")
label.pack()

button = tk.Button(root, text="Click Me!")
button.pack()

# root.mainloop() - This line would normally run the app, but we don't need it for preview