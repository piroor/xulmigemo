copy buildscript\make_new.sh .\

call xpidl.bat xulrunner-sdk-1.9.2
bash make_new.sh -n xulmigemo -v 0 -s "1.9.2"

call xpidl.bat xulrunner-sdk-central
bash make_new.sh -n xulmigemo -v 0 -s "central"

del make_new.sh
