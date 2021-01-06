#!/bin/bash
# PUBLIC_URL=/wordbank ./build.sh
rm -rf ./build
./build.sh
tar zcf build.tgz build
scp build.tgz aws:~/projects/wordbook
ssh aws 'cd ~/projects/wordbook && rm -rf build && tar zxf build.tgz && git pull'
rm build.tgz
