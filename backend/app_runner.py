"""Entry point for the packaged macOS app."""
import sys
import os
import webbrowser
import threading
import uvicorn


def is_frozen():
    return getattr(sys, 'frozen', False)


def get_static_dir():
    if is_frozen():
        return os.path.join(sys._MEIPASS, 'dist')
    return os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')


def open_browser():
    webbrowser.open('http://localhost:8000')


def main():
    threading.Timer(1.5, open_browser).start()
    uvicorn.run("main:app", host="127.0.0.1", port=8000)


if __name__ == "__main__":
    main()
