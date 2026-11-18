"""MEGAnote desktop launcher — hosts the web build in a native WebView2 window.

Data (IndexedDB, caches) persists in %APPDATA%\\MEGAnote so notes survive restarts.
On first run after the Takenotes → MEGAnote rename, the old profile (%APPDATA%\\Takenotes)
is copied over so existing notes are preserved.
"""
import os
import shutil
import sys

import webview


def resource_path(rel: str) -> str:
    base = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base, rel)


def data_dir() -> str:
    appdata = os.environ.get('APPDATA', os.path.expanduser('~'))
    new_dir = os.path.join(appdata, 'MEGAnote')
    old_dir = os.path.join(appdata, 'Takenotes')
    if not os.path.isdir(new_dir) and os.path.isdir(old_dir):
        try:
            shutil.copytree(old_dir, new_dir)
        except OSError:
            pass
    os.makedirs(new_dir, exist_ok=True)
    return new_dir


def main() -> None:
    dist_html = resource_path(os.path.join('dist', 'index.html'))
    html_url = 'file:///' + dist_html.replace('\\', '/')
    webview.create_window(
        'MEGAnote — tus notas, en papel',
        url=html_url,
        width=1440,
        height=900,
        min_size=(1024, 700),
        background_color='#FDFCF8',
        text_select=True,
    )
    webview.start(private_mode=False, storage_path=data_dir())


if __name__ == '__main__':
    main()
