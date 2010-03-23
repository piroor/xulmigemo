#!/bin/sh

appname=xulmigemo

cp buildscript/make_new.sh ./

./xpidl.sh xulrunner-sdk-1.9.2
./make_new.sh -n $appname -v 0 -suffix mozilla-1.9.2

./xpidl.sh xulrunner-sdk-central
./make_new.sh -n $appname -v 0 -suffix mozilla-central

rm ./make_new.sh

