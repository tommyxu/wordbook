#!/bin/bash
if which forever; then
echo start serving ...
# serve -l 8888 -s build
forever -w --watchDirectory ./api ./api/index.mjs
else
echo 'please install "forever"'
echo 'yarn global install forever'
fi
