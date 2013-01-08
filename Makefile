PACKAGE_NAME = xulmigemo

all: xpi

xpi: buildscript/makexpi.sh
	bash ./make.sh

buildscript/makexpi.sh:
	git submodule update --init
