sdkdirname=$1
if [ "$sdkdirname" = '' ]
then
	sdkdirname=xulrunner-sdk
fi

rm -f components/*.xpt
rm -f .xpt

if [ -d ../$sdkdirname ]
then
	sdkroot=../$sdkdirname
fi

if [ -d ../../$sdkdirname ]
then
	sdkroot=../../$sdkdirname
fi

for filename in components/*.idl
do
	${sdkroot}/bin/xpidl -m typelib -I ${sdkroot}/idl $filename
done

mv *.xpt components/
