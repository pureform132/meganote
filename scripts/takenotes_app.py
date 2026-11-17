"""Takenotes desktop launcher — hosts the web build in a native WebView2 window.

Data (IndexedDB, caches) persists in %APPDATA%\\Takenotes so notes survive restarts.
"""
import os
import sys

import webview


def resource_path(rel: str) -> str:
    base = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base, rel)


def main() -> None:
    html_url = 'file:///' + resource_path(os.path.join('dist', 'index.html')).replace('\\', '/')
    data_dir = os.path.join(os.environ.get('APPDATA', os.path.expanduser('~')), 'Takenotes')
    os.makedirs(data_dir, exist_ok=True)
    webview.create_window(
        'Takenotes — your notes, on paper',
        url=html_url,
        width=1440,
        height=900,
        min_size=(1024, 700),
        background_color='#FDFCF8',
        text_select=True,
    )
    webview.start(private_mode=False, storage_path=data_dir)


if __name__ == '__main__':
    main()
