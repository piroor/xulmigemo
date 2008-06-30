var XMigemoLocationBarOverlay = { 
	 
	results : [], 

	enabled : true,
	ignoreURIInput : true,
 
/* elements */ 
	
	get bar() 
	{
		return document.getElementById('urlbar');
	},
 
	get panel() 
	{
		if (!this._panel)
			this._panel = document.getElementById('PopupAutoCompleteRichResult');
		return this._panel;
	},
	_panel : null,
 
	get throbber() 
	{
		return document.getElementById('urlbar-throbber');
	},
 
	get listbox() 
	{
		return document.getAnonymousNodes(this.panel)[0];
	},
 
	get items() 
	{
		return this.listbox.children;
	},
  
/* status */ 
	
	get busy() 
	{
		return this.throbber.getAttribute('busy') == 'true';
	},
	set busy(aValue)
	{
		var throbber = this.throbber;
		if (throbber) {
			if (aValue)
				throbber.setAttribute('busy', true);
			else
				throbber.removeAttribute('busy');
		}
		return aValue;
	},
  
/* event handling */ 
	
	observe : function(aSubject, aTopic, aPrefName) 
	{
		if (aTopic != 'nsPref:changed') return;

		var value = XMigemoService.getPref(aPrefName);
		switch (aPrefName)
		{
			case 'xulmigemo.places.locationBar':
				this.enabled = value;
				return;

			case 'xulmigemo.places.ignoreURIInput':
				this.ignoreURIInput = value;
				return;

			default:
				return;
		}
	},
	domain : 'xulmigemo.places',
	preferences : <![CDATA[
		xulmigemo.places.locationBar
		xulmigemo.places.ignoreURIInput
	]]>.toString(),
 
	handleEvent : function(aEvent) 
	{
		switch (aEvent.type)
		{
			case 'load':
				this.init();
				break;

			case 'unload':
				this.destroy();
				break;
		}
	},
 
	onSearchBegin : function() 
	{
		var input = this.bar.value;
		this.bar.controller.searchStringOverride = '';
		this.bar.controller.matchCountOverride = 0;
		if (
			!this.enabled ||
			(
				this.ignoreURIInput &&
				/^\w+:\/\//.test(input)
			) ||
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
			var bar = aSelf.bar;
			aSelf.panel.collapsed = true;
			var newResults;
			for (var i = 0, maxi = aTerms.length; i < maxi; i++)
			{
				bar.mController.startSearch(aTerms[i]);
				aSelf.busy = true;
				yield true;
				aSelf.busy = true;
				newResults = aSelf.items
					.filter(function(aItem) {
						return aItem.getAttribute('collapsed') != 'true';
					})
					.map(function(aItem) {
						aItem = aItem.cloneNode(true);
						aItem.frecency = XMigemoPlaces.getFrecencyFromURI(aItem.getAttribute('url'));
						if (aItem.frecency == 0) {
							aItem.setAttribute('collapsed', true);
						}
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
			aSelf.panel.collapsed = false;
//			bar.mController.searchString = input;
//			bar.mController.startSearch(input);
			window.setTimeout(function() {
				aSelf.busy = false;
				aSelf.onSearchComplete();
			}, 0);
			yield false;
		}
		this.busy = true;
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
  
	init : function() 
	{
		window.removeEventListener('load', this, false);

		this.overrideFunctions();
		this.initLocationBar();

		XMigemoService.addPrefListener(this);
		window.addEventListener('unload', this, false);
	},
	 
	overrideFunctions : function() 
	{
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

		window.__xulmigemo__BrowserCustomizeToolbar = window.BrowserCustomizeToolbar;
		window.BrowserCustomizeToolbar = function() {
			XMigemoLocationBarOverlay.destroyLocationBar();
			window.__xulmigemo__BrowserCustomizeToolbar.call(window);
		};

		var toolbox = document.getElementById('navigator-toolbox');
		if (toolbox.customizeDone) {
			toolbox.__xulmigemo__customizeDone = toolbox.customizeDone;
			toolbox.customizeDone = function(aChanged) {
				this.__xulmigemo__customizeDone(aChanged);
				XMigemoLocationBarOverlay.initLocationBar();
			};
		}
		if ('BrowserToolboxCustomizeDone' in window) {
			window.__xulmigemo__BrowserToolboxCustomizeDone = window.BrowserToolboxCustomizeDone;
			window.BrowserToolboxCustomizeDone = function(aChanged) {
				window.__xulmigemo__BrowserToolboxCustomizeDone.apply(window, arguments);
				XMigemoLocationBarOverlay.initLocationBar();
			};
		}
	},
 	
	initLocationBar : function() 
	{
		var bar = this.bar;
		if (!bar || bar.__xmigemo__mController) return;

		const nsIAutoCompleteController = Components.interfaces.nsIAutoCompleteController;
		bar.__xmigemo__mController = bar.mController;
		bar.mController = {
			service    : this,
			get controller()
			{
				return this.service.bar.__xmigemo__mController;
			},
			STATUS_NONE              : nsIAutoCompleteController.STATUS_NONE,
			STATUS_SEARCHING         : nsIAutoCompleteController.STATUS_SEARCHING,
			STATUS_COMPLETE_NO_MATCH : nsIAutoCompleteController.STATUS_COMPLETE_NO_MATCH,
			STATUS_COMPLETE_MATCH    : nsIAutoCompleteController.STATUS_COMPLETE_MATCH,

			searchStringOverride : '',
			matchCountOverride   : 0,

			get input() {
				return this.controller.input;
			},
			set input(aValue) {
				return this.controller.input = aValue;
			},
			get searchStatus(aValue) {
				return this.controller.searchStatus;
			},
			get matchCount() {
				return this.matchCountOverride || this.controller.matchCount;
			},
			startSearch : function(aString) {
				return this.controller.startSearch(aString);
			},
			stopSearch : function() {
				return this.controller.stopSearch();
			},
			handleText : function(aIgnoreSelection) {
				return this.controller.handleText(aIgnoreSelection);
			},
			handleEnter : function(aIsPopupSelection) {
				return this.controller.handleEnter(aIsPopupSelection);
			},
			handleEscape : function() {
				var retval = this.controller.handleEscape();
				if (retval &&
					this.input.textValue == this.searchString &&
					this.searchStringOverride) {
					this.input.textValue = this.searchStringOverride;
				}
				return retval;
			},
			handleStartComposition : function() {
				return this.controller.handleStartComposition();
			},
			handleEndComposition : function() {
				return this.controller.handleEndComposition();
			},
			handleTab : function() {
				return this.controller.handleTab();
			},
			handleKeyNavigation : function(aKey) {
//dump('handleKeyNavigation\n');
				const nsIDOMKeyEvent = Components.interfaces.nsIDOMKeyEvent;
				var input = this.input;
				var popup = input.popup;
				if (
					(
						aKey == nsIDOMKeyEvent.DOM_VK_UP ||
						aKey == nsIDOMKeyEvent.DOM_VK_DOWN ||
						aKey == nsIDOMKeyEvent.DOM_VK_PAGE_UP ||
						aKey == nsIDOMKeyEvent.DOM_VK_PAGE_DOWN
					) && popup.mPopupOpen
					) {
//dump('overridden\n');
					var reverse = (aKey == nsIDOMKeyEvent.DOM_VK_UP || aKey == nsIDOMKeyEvent.DOM_VK_PAGE_UP);
					var page = (aKey == nsIDOMKeyEvent.DOM_VK_PAGE_UP || aKey == nsIDOMKeyEvent.DOM_VK_PAGE_DOWN);
					var completeSelection = input.completeSelectedIndex;
					popup.selectBy(reverse, page);
					if (completeSelection) {
						var selectedIndex = popup.selectedIndex;
						if (selectedIndex >= 0) {
							var items = this.service.items;
							input.textValue = items[selectedIndex].getAttribute('url');
						}
						else {
							input.textValue = this.searchStringOverride || this.searchString;
						}
						input.selectTextRange(input.textValue.length, input.textValue.length);
					}
				}
				else {
					this.controller.handleKeyNavigation(aKey);
				}
			},
			handleDelete : function() {
				return this.controller.handleDelete();
			},
			getValueAt : function(aIndex) {
				return this.controller.getValueAt(aIndex);
			},
			getCommentAt : function(aIndex) {
				return this.controller.getCommentAt(aIndex);
			},
			getStyleAt : function(aIndex) {
				return this.controller.getStyleAt(aIndex);
			},
			getImageAt : function(aIndex) {
				return this.controller.getImageAt(aIndex);
			},
			get searchString() {
				return this.controller.searchString;
			},
			set searchString(aValue) {
				return this.controller.searchString = aValue;
			},
			QueryInterface : function(aIID) {
				if (aIID.equals(Components.interfaces.nsIAutoCompleteController) ||
					aIID.equals(Components.interfaces.nsISupports))
					return this;
				throw Components.results.NS_ERROR_NO_INTERFACE;
			}
		};
	},
  
	destroy : function() 
	{
		window.removeEventListener('unload', this, false);
		this.destroyLocationBar();
		XMigemoService.removePrefListener(this);
	},
	
	destroyLocationBar : function() 
	{
		var bar = this.bar;
		if (!bar || !bar.__xmigemo__mController) return;

		bar.mController.stopSearch();
		bar.mController.service = null;
		bar.mController = bar.__xmigemo__mController;
	},
  
	clear : function() 
	{
		this.results = [];
	},
 
	updatePopup : function() 
	{
//dump('updatePopup\n');
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

		var listbox = this.listbox;

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
		this.items
			.forEach(function(aItem) {
				if (aItem.getAttribute('input') == input &&
					aItem.getAttribute('frecency') != '0') {
					count++;
					aItem.removeAttribute('collapsed');
				}
				else {
					aItem.setAttribute('collapsed', true);
				}
			});
		this.bar.controller.searchStringOverride = input;
		this.bar.controller.matchCountOverride = count;
		this.panel.adjustHeight();
		this.bar.openPopup();
	},
	compareFrecency : function(aA, aB)
	{
		return aB.frecency - aA.frecency;
	}
 
}; 
 
window.addEventListener('load', XMigemoLocationBarOverlay, false); 
  
