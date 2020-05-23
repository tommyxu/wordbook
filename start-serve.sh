#!/bin/bash
if which serve; then
echo start serving ...
serve -l 8888 -s build
else
echo 'yarn global install serve'
fi
