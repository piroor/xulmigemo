sdkdirname=$1
if [ "$sdkdirname" = '' ]
then
	sdkdirname=xulrunner-sdk
fi

if [ -d ../$sdkdirname ]
then
	sdkroot=../$sdkdirname
fi

if [ -d ../../$sdkdirname ]
then
	sdkroot=../../$sdkdirname
fi

if [ -f ${sdkroot}/bin/xpidl ]
	rm -f components/*.xpt
	rm -f .xpt

	for filename in components/*.idl
	do
		${sdkroot}/bin/xpidl -m typelib -w -v -I ${sdkroot}/idl $filename
	done

	mv *.xpt components/
fi
