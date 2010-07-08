var XMigemoMail = { 
	 
	get service() 
	{
		if (!this.mService) {
			this.mService = Components.classes['@piro.sakura.ne.jp/xmigemo/mail;1']
							.getService(Components.interfaces.xmIXMigemoMail);
		}
		return this.mService;
	},
 
	handleEvent : function(aEvent) 
	{
		window.removeEventListener('load', this, false);

		if ('QuickSearchManager' in window) { // -Thunderbird 3.0
			if (!('__xmigemo_original_createSearchTerms' in QuickSearchManager)) {
				QuickSearchManager.__xmigemo_original_createSearchTerms = QuickSearchManager.createSearchTerms;
				QuickSearchManager.createSearchTerms = this.createSearchTerms;
			}
		}
		else if ('QuickFilterManager' in window) { // Thunderbird 3.1-
		}
	},
 
	createSearchTerms : function(aTermCreator, aSearchMode, aSearchString)
	{
		var ns = {};
		Components.utils.import('resource://xulmigemo-modules/service.jsm', ns); 
		Components.utils.import('resource://xulmigemo-modules/mail.jsm', ns); 

		if (aTermCreator.window &&
			ns.XMigemoService.getPref('xulmigemo.mailnews.threadsearch.enabled')) {
			let terms = ns.XMigemoMail.getTermsList(
					aSearchString,
					aSearchMode,
					aTermCreator.window.domWindow.gDBView.msgFolder
				);
			if (terms.length)
				aSearchString = terms.join('|');
		}

		return this.__xmigemo_original_createSearchTerms.call(this, aTermCreator, aSearchMode, aSearchString);
	}
 
}; 
  
window.addEventListener('load', XMigemoMail, false); 
 	
