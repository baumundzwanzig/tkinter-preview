# Test Tkinter Pack Options
import tkinter as tk

root = tk.Tk()
root.title("Pack Options Test")

# Label mit pady
label1 = tk.Label(root, text="Label with pady=10")
label1.pack(pady=10)

# Button mit padx
button1 = tk.Button(root, text="Button with padx=20")
button1.pack(padx=20)

# Label mit beiden
label2 = tk.Label(root, text="Label with padx=15, pady=5")
label2.pack(padx=15, pady=5)

# Button mit ipadx und ipady
button2 = tk.Button(root, text="Button with ipadx=10, ipady=5")
button2.pack(ipadx=10, ipady=5)