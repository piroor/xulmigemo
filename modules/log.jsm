var EXPORTED_SYMBOLS = ['MigemoLog']; 

var Cu = Components.utils;

Cu.import('resource://gre/modules/Services.jsm');

var DEBUG = false;
function MigemoLog(aModule, ...aArgs) 
{
	if (DEBUG ||
		Services.prefs.getBoolPref('xulmigemo.debug.all') ||
		Services.prefs.getBoolPref('xulmigemo.debug.' + aModule)) {
		let logString = aModule + ': '+aArgs.join(', ');
		Services.console.logStringMessage(logString);
		if (Services.prefs.getBoolPref('xulmigemo.debug.dump'))
			dump(logString+'\n');
	}
}
