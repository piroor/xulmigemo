const Cc = Components.classes; 
const Ci = Components.interfaces;

Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');
Components.utils.import('resource://gre/modules/Services.jsm');

Components.utils.import('resource://xulmigemo-modules/constants.jsm');
Components.utils.import('resource://xulmigemo-modules/lib/prefs.js');
 
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
					Services.obs.addObserver(this, 'profile-after-change', false);
					this.initialized = true;
				}
				return;

			case 'profile-after-change':
				Services.obs.addObserver(this, 'final-ui-startup', false);
				if (this.initialized) {
					Services.obs.removeObserver(this, 'profile-after-change');
					this.initialized = false;
				}
				this.init();
				return;

			case 'final-ui-startup':
				Services.obs.removeObserver(this, 'final-ui-startup');
				this.postInit();
				return;
		}
	},
 
	init : function() 
	{
		this.migratePrefs();

		this.updateGlobalStyleSheets();

		if (prefs.getPref(MigemoConstants.BASE+'lang') == '') {
			Services.ww.openWindow(
				null,
				'chrome://xulmigemo/content/initializer/langchooser.xul',
				'xulmigemo:langchooser',
				'chrome,dialog,modal,centerscreen,dependent',
				null
			);
		}
	},

	migratePrefs : function()
	{
		switch (prefs.getPref(MigemoConstants.BASE+'prefsVersion'))
		{
			case 0:
				prefs.getDescendant('xulmigemo.').forEach(function(aKey) {
					var value = prefs.getPref(aKey);
					var key = aKey.replace(/^xulmigemo\./, '');
					prefs.setPref(MigemoConstants.BASE+key, value);
				});

				prefs.setPref(MigemoConstants.BASE+'prefsVersion', MigemoConstants.PREFS_VERSION);
			case 1:
			default:
				break;
		}
	},
 
	postInit : function() 
	{
		Services.obs.notifyObservers(null, 'XMigemo:initialized', null);

		if (prefs.getPref(MigemoConstants.BASE+'lang')) {
			let { MigemoDicManager } = Components.utils.import('resource://xulmigemo-modules/core/dicManager.js', {});
			MigemoDicManager.init(null, null);
		}
	},
 
	updateGlobalStyleSheets : function() 
	{
		var sheets = [
			];
		sheets.forEach(function(aSheet) {
			var sheet = Services.io.newURI(aSheet, null, null);
			if (!this.SSS.sheetRegistered(sheet, this.SSS.AGENT_SHEET)) {
				this.SSS.loadAndRegisterSheet(sheet, this.SSS.AGENT_SHEET);
			}
		}, this);
	},
	get SSS()
	{
		if (this._SSS === void(0))
			this._SSS = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService);
		return this._SSS;
	}
  
}; 
  
var NSGetFactory = XPCOMUtils.generateNSGetFactory([XMigemoStartupService]); 
 
