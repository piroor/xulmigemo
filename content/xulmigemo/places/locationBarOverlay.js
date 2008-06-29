var XMigemoLocationBarOverlay = { 
	 
	results : [], 
 
	get locationBar() 
	{
		return document.getElementById('urlbar');
	},
 
	get locationBarPanel() 
	{
		if (!this._locationBarPanel)
			this._locationBarPanel = document.getElementById('PopupAutoCompleteRichResult');
		return this._locationBarPanel;
	},
	_locationBarPanel : null,
 
	get resolverPanel() 
	{
		return document.getElementById('XMigemoLocationBarSearchPanel');
	},
	get resolverTextbox()
	{
		return document.getElementById('XMigemoLocationBarSearchTextbox');
	},
	get resultList()
	{
		return document.getAnonymousNodes(this.resolverPanel)[0];
	},
 
	handleEvent : function(aEvent) 
	{
		switch (aEvent.type)
		{
			case 'load':
				this.init();
				break;
		}
	},
 
	init : function() 
	{
		window.removeEventListener('load', this, false);

		eval('LocationBarHelpers._searchComplete = '+
			LocationBarHelpers._searchComplete.toSource().replace(
				/(\}\))?$/,
				'XMigemoLocationBarOverlay.doSearch(document.getElementById("urlbar").value); $1'
			)
		);

		var panel = this.resolverPanel;
		eval('panel._appendCurrentResult = '+
			panel._appendCurrentResult.toSource().replace(
				'return;',
				'XMigemoLocationBarOverlay.onSearchComplete(); return;'
			)
		);
	},
 
	compareFrecency : function(aA, aB) 
	{
		return aB.frecency - aA.frecency;
	},
 
	doSearch : function(aInput) 
	{
dump('\n\n\n-----------------------------------------------------------------\nSTART SEARCH '+aInput+'\n');
		this.clear();

		var terms = XMigemoCore.getTermsForInputFromSource(
				aInput,
				XMigemoPlaces.placesSource
			);
dump('  FOUND TERMS ('+terms.length+')\n');

		function DoSearchEachTerm(aTerms, aSelf) {
			var textbox = aSelf.resolverTextbox;
			var newResults;
			for (var i = 0, maxi = aTerms.length; i < maxi; i++)
			{
				textbox.openPopup();
dump('TERM '+aTerms[i]+'\n');
				textbox.mController.startSearch(aTerms[i]);
				yield true;
				newResults = aSelf.resultList.children.map(function(aItem) {
						aItem = aItem.cloneNode(true);
						aItem.frecency = XMigemoPlaces.getFrecencyFromURI(aItem.getAttribute('url'));
						aItem.setAttribute('frecency', aItem.frecency);
						return aItem;
					})
				if (newResults.length) {
					aSelf.results = aSelf.results.concat(newResults);
dump(aSelf.results.length+'\n');
					textbox.closePopup();
					aSelf.updateResults();
				}
			}
			aSelf.resolver = null;
			yield false;
		}
		this.resolver = DoSearchEachTerm(terms, this);
		this.resolver.next();
	},
 
	onSearchComplete : function() 
	{
dump('onSearchComplete\n');
		if (!this.resolver) return;

		try {
			if (this.onSearchCompleteTimer) {
				window.clearTimeout(this.onSearchCompleteTimer);
			}
			this.onSearchCompleteTimer = window.setTimeout(function(aSelf) {
				aSelf.resolver.next();
				aSelf.onSearchCompleteTimer = null;
			}, 100, this);
		}
		catch(e) {
			dump(e+'\n');
		}
	},
	onSearchCompleteTimer : null,
 
	clear : function() 
	{
dump('CLEAR\n');
		this.results = [];
	},
 
	updateResults : function() 
	{
		var done = {};
		this.results = this.results.filter(function(aResult) {
			if (!aResult) return false;
			var uri = aResult.getAttribute('url');
			if (uri in done) return false;
			done[uri] = true;
			return true;
		}).sort(this.compareFrecency);
dump('DONE '+this.results.length+'\n');

		var listbox = document.getAnonymousNodes(this.locationBarPanel)[0];

		var range = document.createRange();
		range.selectNodeContents(listbox);
		range.deleteContents();

		var fragment = document.createDocumentFragment();
		this.results.forEach(function(aResult) {
			fragment.appendChild(aResult.cloneNode(true));
		});
		range.insertNode(fragment);

		range.detach();

		this.locationBar.openPopup();
	}
 
}; 
 
window.addEventListener('load', XMigemoLocationBarOverlay, false); 
 	 
