#!/bin/bash
# PUBLIC_URL=/wordbank ./build.sh
rm -rf ./build
./build.sh
tar zcf build.tgz build
scp build.tgz aws:~/wordbook
ssh aws 'cd wordbook && rm -rf build && tar zxf build.tgz && git pull && yarn'
