var XMigemoMail = { 
	 
	get service() 
	{
		if (!this.mService) {
			this.mService = Components.classes['@piro.sakura.ne.jp/xmigemo/mail;1']
							.getService(Components.interfaces.pIXMigemoMail);
		}
		return this.mService;
	},
 
	handleEvent : function(aEvent) 
	{
		window.removeEventListener('load', this, false);

		eval('window.createSearchTerms = '+
			window.createSearchTerms.toSource().replace(
				'var termList = gSearchInput.value.split("|");',
				<><![CDATA[
					var termList;
					if (XMigemoService.getPref('xulmigemo.mailnews.threadsearch.enabled'))
						termList = XMigemoMail.service.getTermsList(
							gSearchInput.value,
							gSearchInput.searchMode,
							gDBView.msgFolder
						);
					if (!termList || !termList.length)
						termList = gSearchInput.value.split('|');
				]]></>
			)
		);

		eval('window.MsgCompactFolder = '+
			window.MsgCompactFolder.toSource().replace(
				'var expungedBytes = msgfolder.expungedBytes;',
				<><![CDATA[$&
					Components 
						.classes['@mozilla.org/observer-service;1']
						.getService(Components.interfaces.nsIObserverService)
						.notifyObservers(msgfolder, 'XMigemo:compactFolderRequested', isAll ? 'forceCompact' : '' );
				]]></>
			)
		);

		this.service; // initialize
	}
 
}; 
  
window.addEventListener('load', XMigemoMail, false); 
 	
