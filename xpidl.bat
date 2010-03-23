setlocal

del /Q components\*.xpt
del /Q *.xpt

if exist ..\xulrunner-sdk (
	set sdkroot=..\xulrunner-sdk
)
if exist ..\..\xulrunner-sdk (
	set sdkroot=..\..\xulrunner-sdk
)


for %%f in (components\*.idl) do (
	%sdkroot%\bin\xpidl.exe -m typelib -I %sdkroot%\idl %%f
)

move *.xpt components\
