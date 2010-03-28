setlocal

set sdkdirname=%1
if "%sdkdirname%"=="" set sdkdirname=xulrunner-sdk

if exist ..\%sdkdirname% (
	set sdkroot=..\%sdkdirname%
)
if exist ..\..\%sdkdirname% (
	set sdkroot=..\..\%sdkdirname%
)

if exist %sdkroot%\bin\xpidl.exe (
	del /Q components\*.xpt
	del /Q *.xpt

	for %%f in (components\*.idl) do (
		%sdkroot%\bin\xpidl.exe -m typelib -w -v -I %sdkroot%\idl %%f
	)

	move *.xpt components\
)
