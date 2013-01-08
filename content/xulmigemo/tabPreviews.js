var XMigemoTabPreviews = { 
	enabled  : false,
	 
	init : function() 
	{
		window.removeEventListener('load', this, false);
		if (window
			.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
			.getInterface(Components.interfaces.nsIWebNavigation)
			.QueryInterface(Components.interfaces.nsIDocShell)
			.QueryInterface(Components.interfaces.nsIDocShellTreeItem)
			.parent) // in subframe
			return;

		if (!('ctrlTab' in window) || !('tabList' in ctrlTab)) return;

		window.addEventListener('unload', this, false);

		XMigemoService.addPrefListener(this);
		XMigemoService.firstListenPrefChange(this);

		var getter = ctrlTab.__lookupGetter__('tabList');
		var { here } = Components.utils.import('resource://xulmigemo-modules/here.js', {});
		eval('getter = '+getter.toSource().replace(
			'if (this.searchField.value) {',
			here(/*
				if (this.searchField.value &&
					XMigemoTabPreviews.enabled &&
					migemo.isValidFunctionalInput(this.searchField.value)) {
					list = XMigemoTabPreviews.filterListFromInput(list, this.searchField.value);
				}
				else $&
			*/)
		));
		ctrlTab.__defineGetter__('tabList', getter);
	},
 
	destroy : function() 
	{
		window.removeEventListener('unload', this, false);

		XMigemoService.removePrefListener(this);
	},
 
	filterListFromInput : function(aTabs, aInput) 
	{
		var termsRegExp = {};
		var exceptionRegExp = {};
		var filterRegExp = XMigemoCore.getRegExpFunctional(migemo.trimFunctionalInput(aInput), termsRegExp, exceptionRegExp);
		filterRegExp = new RegExp(filterRegExp, 'gim');
		termsRegExp = new RegExp(filterRegExp.value, 'gim');
		exceptionRegExp = new RegExp(filterRegExp.value, 'im');

		return aTabs.filter(function(aTab) {
			var uri = aTab.linkedBrowser.currentURI.spec;
			try {
				uri = decodeURI(uri);
			}
			catch(e) {
			}
			var string = aTab.label+' '+uri;

			if (exceptionRegExp && exceptionRegExp.test(string))
				return false;

			return filterRegExp.test(string);
		}, this);
	},
 	
	handleEvent : function(aEvent) 
	{
		switch (aEvent.type)
		{
			case 'load':
				window.setTimeout('XMigemoTabPreviews.init();', 0);
				return;

			case 'unload':
				this.destroy();
				return;
		}
	},
 
	observe : function(aSubject, aTopic, aData) 
	{
		switch (aTopic)
		{
			case 'nsPref:changed':
				var value = XMigemoService.getPref(aData);
				switch (aData)
				{
					case 'xulmigemo.ctrlTab.enabled':
						this.enabled = value;
						break;
				}
				break;
		}
	},
	domain  : 'xulmigemo.ctrlTab',
	preferences : 'xulmigemo.ctrlTab.enabled',
  
	dummy : null
}; 
 
window.addEventListener('load', XMigemoTabPreviews, false); 
 
