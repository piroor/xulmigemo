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
 
	get resultList()
	{
		return document.getAnonymousNodes(this.locationBarPanel)[0];
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

		eval('LocationBarHelpers._searchBegin = '+
			LocationBarHelpers._searchComplete.toSource().replace(
				/(\}\))?$/,
				'XMigemoLocationBarOverlay.onSearchBegin(); $1'
			)
		);
		eval('LocationBarHelpers._searchComplete = '+
			LocationBarHelpers._searchComplete.toSource().replace(
				/(\}\))?$/,
				'XMigemoLocationBarOverlay.onSearchComplete(); $1'
			)
		);
		this.locationBarPanel.__defineGetter__('_matchCount', function() {
			return Math.min(Math.max(this.mInput.controller.matchCount, this._matchCountXMigemoOverride), this.maxResults);
		});
	},
 
	onSearchBegin : function() 
	{
		var input = this.locationBar.value;
		this.locationBarPanel._matchCountXMigemoOverride = 0;
		if (
			!XMigemoService.getPref('xulmigemo.places.locationBar') ||
			this.lastInput == input ||
			this.readyToUpdate
			)
			return;

		this.lastInput = input;
		if (!input) return;

//dump('\n\n\n-----------------------------------------------------------------\nSTART SEARCH '+input+'\n');
		this.clear();

		var terms = XMigemoCore.getTermsForInputFromSource(
				input,
				XMigemoPlaces.placesSource
			);
//dump(terms.length+' / '+encodeURIComponent(terms)+'\n');

		function DoSearchEachTerm(aTerms, aSelf) {
			var bar = aSelf.locationBar;
			aSelf.locationBarPanel.collapsed = true;
			var newResults;
			for (var i = 0, maxi = aTerms.length; i < maxi; i++)
			{
				bar.mController.startSearch(aTerms[i]);
				yield true;
				newResults = aSelf.resultList.children
					.filter(function(aItem) {
						return aItem.getAttribute('collapsed') != 'true';
					})
					.map(function(aItem) {
						aItem = aItem.cloneNode(true);
						aItem.frecency = XMigemoPlaces.getFrecencyFromURI(aItem.getAttribute('url'));
						aItem.setAttribute('input', input);
						aItem.setAttribute('frecency', aItem.frecency);
						return aItem;
					});
				if (newResults.length)
					aSelf.results = aSelf.results.concat(newResults);
			}
//dump(aSelf.results.length+'\n');
			aSelf.resolver = null;
			aSelf.readyToUpdate = true;
			aSelf.locationBarPanel.collapsed = false;
//			bar.mController.searchString = input;
//			bar.mController.startSearch(input);
			window.setTimeout(function() {
				aSelf.onSearchComplete();
			}, 0);
			yield false;
		}
		this.resolver = DoSearchEachTerm(terms, this);
		this.resolver.next();
	},
 
	onSearchComplete : function() 
	{
//dump('onSearchComplete\n');
		if (this.resolver) {
//dump('next\n');
			this.resolver.next();
		}
		else if (this.readyToUpdate) {
//dump('readyToUpdate\n');
			this.readyToUpdate = false;
			this.updatePopup();
		}
	},
 
	clear : function() 
	{
		this.results = [];
	},
 
	updatePopup : function() 
	{
		var done = {};
		this.results = this.results
			.filter(function(aResult) {
				if (!aResult) return false;
				var uri = aResult.getAttribute('url');
				if (uri in done) return false;
				done[uri] = true;
				return true;
			})
			.sort(this.compareFrecency);

		var listbox = this.resultList;

		var range = document.createRange();
		range.selectNodeContents(listbox);
		range.deleteContents();

		var fragment = document.createDocumentFragment();
		this.results.forEach(function(aResult) {
			fragment.appendChild(aResult.cloneNode(true));
		});
		range.insertNode(fragment);

		range.detach();

		var count = 0;
		var input = this.lastInput;
		this.resultList.children
			.forEach(function(aItem) {
				if (aItem.getAttribute('input') != input) return;
				count++;
				aItem.removeAttribute('collapsed');
			});
		this.locationBarPanel._matchCountXMigemoOverride = count;
		this.locationBarPanel.adjustHeight();
		this.locationBar.openPopup();
	},
	compareFrecency : function(aA, aB) 
	{
		return aB.frecency - aA.frecency;
	}
 
}; 
 
window.addEventListener('load', XMigemoLocationBarOverlay, false); 
 	 
