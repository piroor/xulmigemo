var EXPORTED_SYMBOLS = ['MigemoLog']; 

var Cu = Components.utils;

Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource://xulmigemo-modules/constants.jsm');

var DEBUG = false;
function MigemoLog(aModule, ...aArgs) 
{
	if (DEBUG ||
		Services.prefs.getBoolPref(MigemoConstants.BASE+'debug.all') ||
		Services.prefs.getBoolPref(MigemoConstants.BASE+'debug.' + aModule)) {
		let logString = aModule + ': '+aArgs.join(', ');
		Services.console.logStringMessage(logString);
		if (Services.prefs.getBoolPref(MigemoConstants.BASE+'debug.dump'))
			dump(logString+'\n');
	}
}
