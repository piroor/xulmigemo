const Cc = Components.classes; 
const Ci = Components.interfaces;

Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');

const ObserverService = Cc['@mozilla.org/observer-service;1']
		.getService(Ci.nsIObserverService);

const IOService = Cc['@mozilla.org/network/io-service;1']
		.getService(Ci.nsIIOService);

const Prefs = Cc['@mozilla.org/preferences;1']
		.getService(Ci.nsIPrefBranch);
 
function XMigemoStartupService() { 
}
XMigemoStartupService.prototype = {
	initialized : false,

	classDescription : 'XMigemoStartupService',
	contractID : '@piro.sakura.ne.jp/xmigemo/startup;1',
	classID : Components.ID('{28a475d0-1c24-11dd-bd0b-0800200c9a66}'),

	_xpcom_categories : [
		{ category : 'app-startup', service : true }
	],

	QueryInterface : XPCOMUtils.generateQI([Ci.nsIObserver]),
	
	observe : function(aSubject, aTopic, aData) 
	{
		switch (aTopic)
		{
			case 'app-startup':
				if (!this.initialized) {
					ObserverService.addObserver(this, 'profile-after-change', false);
					this.initialized = true;
				}
				return;

			case 'profile-after-change':
				ObserverService.addObserver(this, 'final-ui-startup', false);
				if (this.initialized) {
					ObserverService.removeObserver(this, 'profile-after-change');
					this.initialized = false;
				}
				this.init();
				return;

			case 'final-ui-startup':
				ObserverService.removeObserver(this, 'final-ui-startup');
				this.postInit();
				return;
		}
	},
 
	init : function() 
	{
		if (this.SSS)
			this.updateGlobalStyleSheets();

		if (Prefs.getCharPref('xulmigemo.lang') == '') {
			var WindowWatcher = Cc['@mozilla.org/embedcomp/window-watcher;1']
				.getService(Ci.nsIWindowWatcher);
			WindowWatcher.openWindow(
				null,
				'chrome://xulmigemo/content/initializer/langchooser.xul',
				'xulmigemo:langchooser',
				'chrome,dialog,modal,centerscreen,dependent',
				null
			);
		}
	},
 
	postInit : function() 
	{
		ObserverService.notifyObservers(null, 'XMigemo:initialized', null);

		if (Prefs.getCharPref('xulmigemo.lang')) {
			Cc['@piro.sakura.ne.jp/xmigemo/dictionary-manager;1']
				.getService(Ci.xmIXMigemoDicManager)
				.init(null, null);
		}
	},
 
	updateGlobalStyleSheets : function() 
	{
		var sheets = [
				'chrome://xulmigemo/content/focus.css',
				'chrome://xulmigemo/content/highlight/highlight.css',
				'chrome://xulmigemo/content/marker/marker.css'
			];
		sheets.forEach(function(aSheet) {
			var sheet = IOService.newURI(aSheet, null, null);
			if (!this.SSS.sheetRegistered(sheet, this.SSS.AGENT_SHEET)) {
				this.SSS.loadAndRegisterSheet(sheet, this.SSS.AGENT_SHEET);
			}
		}, this);
	},
	
	get SSS() 
	{
		if (this._SSS === void(0)) {
			if ('@mozilla.org/content/style-sheet-service;1' in Cc) {
				this._SSS = Cc['@mozilla.org/content/style-sheet-service;1']
						.getService(Ci.nsIStyleSheetService);
			}
			if (!this._SSS)
				this._SSS = null;
		}
		return this._SSS;
	}
//	_SSS : null,
  
}; 
  
if (XPCOMUtils.generateNSGetFactory) 
	var NSGetFactory = XPCOMUtils.generateNSGetFactory([XMigemoStartupService]);
else
	var NSGetModule = XPCOMUtils.generateNSGetModule([XMigemoStartupService]);
 
