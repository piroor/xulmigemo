const kCID  = Components.ID('{28a475d0-1c24-11dd-bd0b-0800200c9a66}'); 
const kID   = '@piro.sakura.ne.jp/xmigemo/startup;1';
const kNAME = "XUL/Migemo Startup Service";

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
	 
	observe : function(aSubject, aTopic, aData) 
	{
		switch (aTopic)
		{
			case 'app-startup':
				ObserverService.addObserver(this, 'final-ui-startup', false);
				return;

			case 'final-ui-startup':
				ObserverService.removeObserver(this, 'final-ui-startup');
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
	},
 
	updateGlobalStyleSheets : function() 
	{
		var sheets = [
				'chrome://xulmigemo/content/highlight.css',
				'chrome://xulmigemo/content/marker.css'
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
	},
//	_SSS : null,
  
	QueryInterface : function(aIID) 
	{
		if(!aIID.equals(Components.interfaces.nsIObserver) &&
			!aIID.equals(Components.interfaces.nsISupports)) {
			throw Components.results.NS_ERROR_NO_INTERFACE;
		}
		return this;
	}
 
}; 
 	 
var gModule = { 
	registerSelf : function(aCompMgr, aFileSpec, aLocation, aType)
	{
		aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
		aCompMgr.registerFactoryLocation(
			kCID,
			kNAME,
			kID,
			aFileSpec,
			aLocation,
			aType
		);

		var catMgr = Components.classes['@mozilla.org/categorymanager;1']
					.getService(Components.interfaces.nsICategoryManager);
		catMgr.addCategoryEntry('app-startup', kNAME, kID, true, true);
	},

	getClassObject : function(aCompMgr, aCID, aIID)
	{
		return this.factory;
	},

	factory : {
		QueryInterface : function(aIID)
		{
			if (!aIID.equals(Components.interfaces.nsISupports) &&
				!aIID.equals(Components.interfaces.nsIFactory)) {
				throw Components.results.NS_ERROR_NO_INTERFACE;
			}
			return this;
		},
		createInstance : function(aOuter, aIID)
		{
			return new XMigemoStartupService();
		}
	},

	canUnload : function(aCompMgr)
	{
		return true;
	}
};

function NSGetModule(aCompMgr, aFileSpec) {
	return gModule;
}
 
