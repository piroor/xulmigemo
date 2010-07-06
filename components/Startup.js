Components.utils.import('resource://gre/modules/XPCOMUtils.jsm'); 

const ObserverService = Components
		.classes['@mozilla.org/observer-service;1']
		.getService(Components.interfaces.nsIObserverService);

const IOService = Components
		.classes['@mozilla.org/network/io-service;1']
		.getService(Components.interfaces.nsIIOService);

const Prefs = Components
		.classes['@mozilla.org/preferences;1']
		.getService(Components.interfaces.nsIPrefBranch);
 
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

	QueryInterface : XPCOMUtils.generateQI([Components.interfaces.nsIObserver]),
	
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
				if (this.initialized) {
					ObserverService.addObserver(this, 'profile-after-change', false);
					this.initialized = false;
				}
				this.init();
				return;
		}
	},
 
	init : function() 
	{
		if (this.SSS)
			this.updateGlobalStyleSheets();

		if (Prefs.getCharPref('xulmigemo.lang') == '') {
			var WindowWatcher = Components
				.classes['@mozilla.org/embedcomp/window-watcher;1']
				.getService(Components.interfaces.nsIWindowWatcher);
			WindowWatcher.openWindow(
				null,
				'chrome://xulmigemo/content/initializer/langchooser.xul',
				'xulmigemo:langchooser',
				'chrome,dialog,modal,centerscreen,dependent',
				null
			);
		}

		ObserverService.notifyObservers(null, 'XMigemo:initialized', null);
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
			if ('@mozilla.org/content/style-sheet-service;1' in Components.classes) {
				this._SSS = Components.classes['@mozilla.org/content/style-sheet-service;1']
						.getService(Components.interfaces.nsIStyleSheetService);
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
 
