# Simple Grid Test
import tkinter as tk

root = tk.Tk()
root.title("Simple Grid")

# Einfaches 2x2 Grid ohne colspan
label1 = tk.Label(root, text="0,0")
label1.grid(row=0, column=0)

label2 = tk.Label(root, text="0,1") 
label2.grid(row=0, column=1)

label3 = tk.Label(root, text="1,0")
label3.grid(row=1, column=0)

# Test mit colspan
label4 = tk.Label(root, text="COLSPAN 2")
label4.grid(row=2, column=0, columnspan=2)