#!/bin/sh

appname=xulmigemo

cp makexpi/makexpi.sh ./

./makexpi.sh -n $appname -o

rm ./makexpi.sh

