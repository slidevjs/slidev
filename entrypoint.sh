#!/bin/sh

if [ -z "${KEEP}" ]; then
    rm -rf /root/slides/node_modules
else
    echo "WARNING : The app may not start"
    echo "If it doesn't start or/and prints an error message, delete or move the node_modules folder"
fi
if [ -f /root/slides/slides.md ]; then
    npx slidev
else
    echo "slides.md not found in the bind mount to /root/slides"
    echo "Please check the presence of that file"
    echo "Exiting"
    exit 1
fi
