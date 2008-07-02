var XMigemoLocationBarOverlay = { 
	 
	results : [], 
	lastInput : '',
	lastTerms : [],
	lastRegExp : '',
	readyToBuild : false,
	searchCompleted : false,

	enabled   : true,
	ignoreURI : true,
	delay     : 250,
	minLength : 3,
	useThreadToFindTerms    : false,
	useThreadToQueryRecords : true,
 
	Converter : Components 
			.classes['@mozilla.org/intl/texttosuburi;1']
			.getService(Components.interfaces.nsITextToSubURI),
	ThreadManager : Components
			.classes['@mozilla.org/thread-manager;1']
			.getService(Components.interfaces.nsIThreadManager),
	kXULNS : 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul',
 
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
 
	get shouldStart() 
	{
		var input = this.bar.value;
		return !(
			!this.enabled ||
			(
				this.ignoreURI &&
				/^\w+:\/\//.test(input)
			) ||
			this.minLength > input.length
			);
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

			case 'xulmigemo.places.locationBar.ignoreURI':
				this.ignoreURI = value;
				return;

			case 'xulmigemo.places.locationBar.delay':
				this.delay = value;
				return;

			case 'xulmigemo.places.locationBar.minLength':
				this.minLength = value;
				return;

			case 'xulmigemo.places.locationBar.thread.findTerms':
				this.useThreadToFindTerms = value;
				return;

			case 'xulmigemo.places.locationBar.thread.queryRecords':
				this.useThreadToQueryRecords = value;
				return;

			default:
				return;
		}
	},
	domain : 'xulmigemo.places',
	preferences : <![CDATA[
		xulmigemo.places.locationBar
		xulmigemo.places.locationBar.ignoreURI
		xulmigemo.places.locationBar.delay
		xulmigemo.places.locationBar.minLength
		xulmigemo.places.locationBar.thread.findTerms
		xulmigemo.places.locationBar.thread.queryRecords
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
		var controller = this.bar.controller;
		controller.resultsOverride      = [];
		controller.searchStringOverride = '';
		controller.matchCountOverride   = 0;

		var input = this.bar.value;
		if (!this.shouldStart || this.lastInput == input)
			return;

		this.clear();

		this.lastInput = input;
		if (!input) return;

dump('START SEARCH '+input+'\n'); // DEBUG
		this.delayedStartTimer = window.setTimeout(function(aSelf) {
			aSelf.stopDelayedStart();
			aSelf.delayedStart();
		}, this.delay, this);
	},
	 
	stopDelayedStart : function() 
	{
		if (!this.delayedStartTimer) return;
		window.clearTimeout(this.delayedStartTimer);
		this.delayedStartTimer = null;
	},
 
	stopDelayedRunning : function() 
	{
		if (!this.delayedRunningTimer) return;
		window.clearInterval(this.delayedRunningTimer);
		this.delayedRunningTimer = null;
	},
 
	stopThreadFinish : function() 
	{
		if (!this.threadFinishTimer) return;
		window.clearInterval(this.threadFinishTimer);
		this.threadFinishTimer = null;
	},
 
	delayedStart : function() 
	{
		if (this.useThreadToFindTerms || this.useThreadToQueryRecords) { // thread mode
			if (this.thread)
				this.thread.shutdown();
			this.thread = this.ThreadManager.newThread(0);

			this.updateRegExp();

			if (!this.useThreadToFindTerms) this.updateTerms();

			this.stopThreadFinish();
			this.busy = true;
			this.threadFinishTimer = window.setInterval(function(aSelf) {
				if (!aSelf.readyToBuild) return;
				aSelf.busy = false;
				aSelf.stopThreadFinish();
				if (!aSelf.useThreadToQueryRecords) aSelf.updateResults();
				aSelf.onSearchComplete();
			}, 10, this);

			this.thread.dispatch(this, this.thread.DISPATCH_NORMAL);
			return;
		}
		else { // timer mode
			this.busy = true;
			function DelayedRunner(aSelf)
			{
				aSelf.updateRegExp();
				yield;
				aSelf.updateTerms();
var start = new Date(); // DEBUG
				var sources = XMigemoPlaces.placesSources;
				var regexp = new RegExp(aSelf.lastRegExp, 'gim');
				while (true)
				{
					try {
						aSelf.lastTerms = aSelf.lastTerms.concat(
							sources.next().match(regexp) || []
						);
						yield;
					}
					catch(e) {
						break;
					}
				}
				aSelf.lastTerms =
					aSelf.lastTerms
						.join('\n')
						.toLowerCase()
						.replace(/^(.+)(\n\1$)+/gim, '$1')
						.split('\n');
var end = new Date(); // DEBUG
dump('XMigemoLocationBarOverlay.delayedStart, DelayedRunner, get terms ('+aSelf.lastInput+') : '+(end.getTime() - starg.getTime())+'\n'); // DEBUG
				aSelf.updateResults();
				yield;
				aSelf.readyToBuild = true;
				aSelf.onSearchComplete();
			}
			var runner = DelayedRunner(this);

			this.stopDelayedRunning();
			this.delayedRunningTimer = window.setInterval(function(aSelf) {
				try {
					runner.next();
				}
				catch(e) {
					aSelf.stopDelayedRunning();
					aSelf.busy = false;
				}
			}, 1, this);
		}
	},
 	 
	updateRegExp : function() 
	{
var start = new Date(); // DEBUG
		this.lastRegExp = XMigemoService.getPref('xulmigemo.places.splitByWhiteSpaces') ?
				XMigemoCore.getRegExpForANDFind(this.lastInput) :
				XMigemoCore.getRegExp(this.lastInput);
var end = new Date(); // DEBUG
dump('XMigemoLocationBarOverlay.updateRegExp ('+this.lastInput+') : '+(end.getTime() - starg.getTime())+'\n'); // DEBUG
	},
	updateTerms : function()
	{
var start = new Date(); // DEBUG
		this.lastTerms = XMigemoCore.getTermsFromSource(
				this.lastRegExp,
				XMigemoPlaces.placesSource
			);
var end = new Date(); // DEBUG
dump('XMigemoLocationBarOverlay.updateTerms ('+this.lastInput+') : '+(end.getTime() - starg.getTime())+'\n'); // DEBUG
	},
	updateResults : function()
	{
var start = new Date(); // DEBUG
		this.results = XMigemoPlaces.findLocationBarItemsFromTerms(this.lastTerms);
var end = new Date(); // DEBUG
dump('XMigemoLocationBarOverlay.updateResults ('+this.lastInput+') : '+(end.getTime() - starg.getTime())+'\n'); // DEBUG
	},
 
	// for thread mode 
	thread : null,
	threadFinishTimer : null,
	run : function()
	{
var start = new Date(); // DEBUG
		if (this.useThreadToFindTerms) this.updateTerms();
		if (this.useThreadToQueryRecords) this.updateResults();
		this.readyToBuild = true;
var end = new Date(); // DEBUG
dump('XMigemoLocationBarOverlay.run ('+this.lastInput+') : '+(end.getTime() - starg.getTime())+'\n'); // DEBUG
	},
	QueryInterface : function(aIID) {
		if (aIID.equals(Components.interfaces.nsIRunnable) ||
			aIID.equals(Components.interfaces.nsISupports))
			return this;
		throw Components.results.NS_ERROR_NO_INTERFACE;
	},
 
	onSearchComplete : function() 
	{
		if (this.readyToBuild || this.searchCompleted) {
			window.setTimeout(function(aSelf) {
				aSelf.startBuild();
			}, 0, this);
			this.readyToBuild = false;
			this.searchCompleted = false;
		}
		else {
			this.searchCompleted = true;
		}
	},
  
	clear : function() 
	{
		this.stopDelayedStart();
		this.stopDelayedRunning();
		this.stopThreadFinish();
		this.stopBuild();

		this.results = [];
		this.lastInput = '';
		this.lastTerms = [];
		this.lastRegExp = '';
		this.readyToBuild = false;
	},
 
/* build popup */ 
	 
	startBuild : function() 
	{
		function BuildResultList(aSelf)
		{
var start = new Date(); // DEBUG
			const listbox = aSelf.listbox;
			const items = aSelf.results;
			const chunk = aSelf.panel.maxRows;
			var count = 0;
			var item, node, existingCount;
			for (let i = 0, maxi = items.length; i < maxi; i++)
			{
				if (count++ > chunk) {
					yield;
					count = 0;
				}

				existingCount = listbox.children.length;
				item = items[i];
				item.uri = aSelf.Converter.unEscapeURIForUI('UTF-8', item.uri);
				if (i < existingCount) {
					node = listbox.childNodes[i];
					if (node.getAttribute('text') == item.terms &&
						node.getAttribute('url') == item.uri) {
						node.collapsed = false;
						continue;
					}
				}
				else {
					node = document.createElementNS(aSelf.kXULNS, 'richlistitem');
				}
				node.setAttribute('image', 'moz-anno:favicon:'+item.icon);
				node.setAttribute('url', item.uri);
				node.setAttribute('title', item.title + (item.tags ? ' \u2013 ' + item.tags : '' ));
				node.setAttribute('type', item.style);
				node.setAttribute('text', item.terms);
				if (i < existingCount) {
					node._adjustAcItem();
					node.collapsed = false;
				}
				else {
					node.className = 'autocomplete-richlistitem';
					listbox.appendChild(node);
				}
			}

			var controller = aSelf.bar.controller;
			controller.resultsOverride = aSelf.results;
			controller.searchStringOverride = aSelf.lastInput;
			controller.matchCountOverride = items.length;
			aSelf.panel.adjustHeight();
			aSelf.bar.openPopup();
var end = new Date(); // DEBUG
dump('XMigemoLocationBarOverlay.startBuild, BuildResultList ('+this.lastInput+') : '+(end.getTime() - starg.getTime())+'\n'); // DEBUG
		}

		this.builder = BuildResultList(this);
		this.buildingTimer = window.setInterval(function(aSelf) {
			try {
				aSelf.builder.next();
			}
			catch(e) {
				aSelf.stopBuild();
			}
		}, 1, this);
	},
 
	stopBuild : function() 
	{
		if (!this.buildingTimer) return;
		window.clearInterval(this.buildingTimer);
		this.buildingTimer = null;
		this.builder = null;
	},
 
	builder : null, 
	buildingimer : null,
  
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

		var panel = this.panel;
		eval('panel._appendCurrentResult = '+
			panel._appendCurrentResult.toSource().replace(
				'{',
				'{ if (XMigemoLocationBarOverlay.shouldStart) return;'
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
			resultsOverride   : 0,

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
				this.service.clear();
				return this.controller.handleEnter(aIsPopupSelection);
			},
			handleEscape : function() {
				this.service.clear();
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
				if (this.resultsOverride.length)
					return this.resultsOverride[aIndex].uri;
				return this.controller.getValueAt(aIndex);
			},
			getCommentAt : function(aIndex) {
				if (this.resultsOverride.length)
					return this.resultsOverride[aIndex].title;
				return this.controller.getCommentAt(aIndex);
			},
			getStyleAt : function(aIndex) {
				if (this.resultsOverride.length)
					return this.resultsOverride[aIndex].style;
				return this.controller.getStyleAt(aIndex);
			},
			getImageAt : function(aIndex) {
				if (this.resultsOverride.length)
					return this.resultsOverride[aIndex].icon;
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
	}
  
}; 
 
window.addEventListener('load', XMigemoLocationBarOverlay, false); 
  
