#!/bin/bash
if which serve; then
echo start serving ...
# serve -l 8888 -s build
forever -w --watchDirectory ./api ./api/index.mjs
else
echo 'yarn global install forever'
fi
