# Tkinter Entry Test
import tkinter as tk

root = tk.Tk()
root.title("Entry Test")

# Einfaches Entry
label1 = tk.Label(root, text="Name:")
label1.grid(row=0, column=0)

entry1 = tk.Entry(root)
entry1.grid(row=0, column=1)

# Entry mit Width
label2 = tk.Label(root, text="Email:")
label2.grid(row=1, column=0)

entry2 = tk.Entry(root, width=30)
entry2.grid(row=1, column=1)

# Password Entry
label3 = tk.Label(root, text="Password:")
label3.grid(row=2, column=0)


entry3 = tk.Entry(root, show="*")
entry3.grid(row=2, column=1)

banane 
# Button
button = tk.Button(root, text="Submit")
button.grid(row=3, column=0, columnspan=2, pady=10)