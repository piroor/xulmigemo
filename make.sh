#!/bin/sh

appname=xulmigemo

for path in extlib/fxaddonlib-animation-manager/animationManager.js \
            extlib/fxaddonlib-boxobject/boxObject.js \
            extlib/fxaddonlib-inherit/inherit.jsm \
            extlib/fxaddonlib-prefs/prefs.js \
            extlib/fxaddonlib-stringbundle/stringBundle.js \
            extlib/js-extended-immutable/extended-immutable.js
do
	if [ ! -f "$path" ]
	then
		git submodule update --init
	fi
	cp "$path" modules/lib/
done

cp makexpi/makexpi.sh ./

./makexpi.sh -n $appname -o

rm ./makexpi.sh

