"""Serve the build with explicit UTF-8 types using the standard http.server CLI."""

import mimetypes
import runpy

if __name__ == "__main__":
    for extension, media_type in {
        ".html": "text/html",
        ".md": "text/markdown",
        ".txt": "text/plain",
        ".css": "text/css",
        ".js": "text/javascript",
    }.items():
        mimetypes.add_type(f"{media_type}; charset=utf-8", extension)

    runpy.run_module("http.server", run_name="__main__")
