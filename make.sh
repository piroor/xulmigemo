#!/bin/sh

appname=xulmigemo

cp buildscript/makexpi.sh ./

./xpidl.sh xulrunner-sdk-1.9.2
./makexpi.sh -n $appname -v 0
# ./makexpi.sh -n $appname -v 0 -s mozilla-1.9.2

# ./xpidl.sh xulrunner-sdk-central
# ./makexpi.sh -n $appname -v 0 -s mozilla-central

rm ./makexpi.sh

