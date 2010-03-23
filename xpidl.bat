setlocal

set sdkdirname=%1
if "%sdkdirname%"=="" set sdkdirname=xulrunner-sdk

del /Q components\*.xpt
del /Q *.xpt

if exist ..\%sdkdirname% (
	set sdkroot=..\%sdkdirname%
)
if exist ..\..\%sdkdirname% (
	set sdkroot=..\..\%sdkdirname%
)


for %%f in (components\*.idl) do (
	%sdkroot%\bin\xpidl.exe -m typelib -I %sdkroot%\idl %%f
)

move *.xpt components\
