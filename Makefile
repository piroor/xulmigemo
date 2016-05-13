PACKAGE_NAME = xulmigemo

.PHONY: all xpi signed clean

all: xpi

xpi: makexpi/makexpi.sh extlib/fxaddonlib-animation-manager/animationManager.js extlib/fxaddonlib-boxobject/boxObject.js extlib/fxaddonlib-extensions/extensions.js extlib/fxaddonlib-inherit/inherit.jsm extlib/fxaddonlib-prefs/prefs.js extlib/fxaddonlib-stringbundle/stringBundle.js
	cp extlib/fxaddonlib-animation-manager/animationManager.js modules/lib/
	cp extlib/fxaddonlib-boxobject/boxObject.js modules/lib/
	cp extlib/fxaddonlib-extensions/extensions.js modules/lib/
	cp extlib/fxaddonlib-inherit/inherit.jsm modules/lib/
	cp extlib/fxaddonlib-prefs/prefs.js modules/lib/
	cp extlib/fxaddonlib-stringbundle/stringBundle.js modules/lib/
	bash ./make.sh

extlib/fxaddonlib-animation-manager/animationManager.js:
	git submodule update --init

extlib/fxaddonlib-boxobject/boxObject.js:
	git submodule update --init

extlib/fxaddonlib-extensions/extensions.js:
	git submodule update --init

extlib/fxaddonlib-inherit/inherit.jsm:
	git submodule update --init

extlib/fxaddonlib-prefs/prefs.js:
	git submodule update --init

extlib/fxaddonlib-stringbundle/stringBundle.js:
	git submodule update --init

makexpi/makexpi.sh:
	git submodule update --init

signed: xpi
	makexpi/sign_xpi.sh -k $(JWT_KEY) -s $(JWT_SECRET) -p ./$(PACKAGE_NAME)_noupdate.xpi

clean:
	rm $(PACKAGE_NAME).xpi $(PACKAGE_NAME)_noupdate.xpi sha1hash.txt
