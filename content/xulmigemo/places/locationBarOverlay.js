var XMigemoLocationBarOverlay = { 
	 
	results : [], 
	lastFoundPlaces : {},
	lastInput : '',
	lastTerms : [],
	lastFindFlag : 0,
	lastExceptions : [],
	lastFindRegExp : null,
	lastFindMode : 0,
	lastTermsRegExp : null,
	lastExceptionsRegExp : null,
	thread : null,

	enabled   : true,
	delay     : 250,
	useThread : false,

	FIND_MODE_NATIVE : Components.interfaces.pIXMigemoFind.FIND_MODE_NATIVE,
	FIND_MODE_MIGEMO : Components.interfaces.pIXMigemoFind.FIND_MODE_MIGEMO,
	FIND_MODE_REGEXP : Components.interfaces.pIXMigemoFind.FIND_MODE_REGEXP,

	currentSource : 0,
 
	sourcesInfo : [ 
	 
		{ // keyword search ( https://bugzilla.mozilla.org/show_bug.cgi?id=392143 ) 
			getSourceSQL : function(aFindFlag) {
				return XMigemoPlaces.keywordSearchSourceInRangeSQL;
			},
			getSourceBindingFor : function(aInput) {
				var result = XMigemoPlaces.parseInputForKeywordSearch(aInput);
				return [result.keyword, result.terms];
			},
			getItemsSQL : function(aFindFlag) {
				return XMigemoPlaces.keywordSearchItemInRangeSQL;
			},
			getItemsBindingFor : function(aInput) {
				var result = XMigemoPlaces.parseInputForKeywordSearch(aInput);
				return [result.keyword, result.terms];
			},
			termsGetter : function(aInput, aSource) {
				var result = XMigemoPlaces.parseInputForKeywordSearch(aInput);
				return [result.keyword, result.terms];
			},
			exceptionsGetter : function(aInput) {
				return [];
			},
			style : 'keyword'
		},
 
		{ // input history 
			getSourceSQL : function(aFindFlag) {
				return XMigemoPlaces.getInputHistorySourceInRangeSQL(aFindFlag);
			},
			getSourceBindingFor : function(aInput) {
				return [aInput];
			},
			getItemsSQL : function(aFindFlag) {
				return XMigemoPlaces.getInputHistoryItemsSQL(aFindFlag);
			},
			getItemsBindingFor : function(aInput) {
				return [aInput];
			}
		},
 
		{ // match boundary 
			get enabled() {
				return (XMigemoLocationBarOverlay.lastFindMode != XMigemoLocationBarOverlay.FIND_MODE_REGEXP) &&
					(XMigemoPlaces.matchBehavior == 1 || XMigemoPlaces.matchBehavior == 2);
			},
			getSourceSQL : function(aFindFlag) {
				return XMigemoPlaces.getPlacesSourceInRangeSQL(aFindFlag);
			},
			getItemsSQL : function(aFindFlag) {
				return XMigemoPlaces.getPlacesItemsSQL(aFindFlag);
			},
			itemFilter : function(aItem, aTerms, aFindFlag) {
				var target = XMigemoPlaces.getFindTargetsFromFlag(aItem, aFindFlag);
				this.regexp.compile(
					'^(?:'+aTerms.map(function(aTerm) {
						return XMigemoPlaces.TextUtils.sanitize(aTerm);
					}).join('|')+')',
					'gim'
				);
				var matched = XMigemoPlaces.TextUtils.brushUpTerms(
							XMigemoPlaces.TextUtils
								.splitByBoundaries(target.join('\n'))
						).join('\n').match(this.regexp);
				return !matched ? false : matched.length >= aTerms.length ;
			},
			regexp : new RegExp()
		},
 	
		{ // match anywhere 
			get enabled() {
				return XMigemoPlaces.matchBehavior == 0 || XMigemoPlaces.matchBehavior == 1;
			},
			getSourceSQL : function(aFindFlag) {
				return XMigemoPlaces.getPlacesSourceInRangeSQL(aFindFlag);
			},
			getItemsSQL : function(aFindFlag) {
				return XMigemoPlaces.getPlacesItemsSQL(aFindFlag);
			}
		},
 
		{ // match start 
			get enabled() {
				return (XMigemoLocationBarOverlay.lastFindMode != XMigemoLocationBarOverlay.FIND_MODE_REGEXP) &&
					XMigemoPlaces.matchBehavior == 3;
			},
			getSourceSQL : function(aFindFlag) {
				return XMigemoPlaces.getPlacesSourceInRangeSQL(aFindFlag);
			},
			getItemsSQL : function(aFindFlag) {
				return XMigemoPlaces.getPlacesItemsSQL(aFindFlag);
			},
			itemFilter : function(aItem, aTerms, aFindFlag) {
				var target = XMigemoPlaces.getFindTargetsFromFlag(aItem, aFindFlag);
				this.regexp.compile(
					'^(?:'+aTerms.map(function(aTerm) {
						return XMigemoPlaces.TextUtils.sanitize(aTerm);
					}).join('|')+')',
					'gim'
				);
				var matched = target.join('\n').match(this.regexp);
				return !matched ? false : matched.length >= aTerms.length ;
			},
			regexp : new RegExp()
		}
 
	], 
  
	Converter : Components 
			.classes['@mozilla.org/intl/texttosuburi;1']
			.getService(Components.interfaces.nsITextToSubURI),
	ThreadManager : Components
			.classes['@mozilla.org/thread-manager;1']
			.getService(Components.interfaces.nsIThreadManager),
	TextUtils : Components
			.classes['@piro.sakura.ne.jp/xmigemo/text-utility;1']
			.getService(Components.interfaces.pIXMigemoTextUtils),

	kXULNS : 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul',
 
/* elements */ 
	 
	get bar() 
	{
		return document.getElementById('urlbar');
	},
 
	get input() 
	{
		var input = this.TextUtils.trim(this.bar.value);
		if (XMigemoPlaces.notFindAvailable) {
			// ì¸óÕíÜÇÃNOTåüçıópââéZéqÇèúäO
			input = input.replace(/\s+-$/, '');
		}
		return input;
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
 
	get isBlank() 
	{
		return !this.input;
	},
 
	get isMigemoActive() 
	{
		var input = this.input;
		return (
			this.enabled &&
			!this.bar.disableAutoComplete &&
			XMigemoPlaces.isValidInput(input)
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

			case 'xulmigemo.places.locationBar.delay':
				this.delay = value;
				return;

			case 'xulmigemo.places.locationBar.useThread':
				this.useThread = value;
				return;

			default:
				return;
		}
	},
	domains : [
		'xulmigemo.places.locationBar'
	],
	preferences : <![CDATA[
		xulmigemo.places.locationBar
		xulmigemo.places.locationBar.delay
		xulmigemo.places.locationBar.useThread
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
		if (this.lastInput == this.input)
			return;

		this.bar.controller.clearOverride();
		this.clear();
		this.stopDelayedClose();
		this.delayedClose();

		if (!this.isMigemoActive) return;

		this.delayedStartTimer = window.setTimeout(function(aSelf) {
			aSelf.clear();
			aSelf.lastInput = aSelf.input;
			if (aSelf.lastInput)
				aSelf.delayedStart();
		}, this.delay, this);
	},
	 
	delayedStart : function() 
	{
		this.bar.controller.stopSearch();
		this.updateRegExp();
		this.builtCount = 0;
		this.busy = true;

		if (this.useThread) { // thread mode
			this.thread = this.ThreadManager.newThread(0);
			this.threadDone = false;
			var maxResults = this.panel.maxResults;
			this.progressiveBuildTimer = window.setInterval(function(aSelf) {
				if (aSelf.isMigemoActive)
					aSelf.progressiveBuild();
				if (!aSelf.isMigemoActive ||
					aSelf.threadDone ||
					aSelf.results.length >= maxResults) {
					aSelf.busy = false;
					aSelf.stopProgressiveBuild();
				}
			}, 1, this);

			this.thread.dispatch(this, this.thread.DISPATCH_NORMAL);
		}
		else { // timer mode
			function DelayedRunner(aSelf)
			{
				var maxResults = aSelf.panel.maxResults;
				var current;
				build:
				for (var i = 0, maxi = aSelf.sourcesInfo.length; i < maxi; i++)
				{
					current = 0;
					aSelf.currentSource = i;
					if ('enabled' in aSelf.sourcesInfo[aSelf.currentSource] &&
						!aSelf.sourcesInfo[aSelf.currentSource].enabled) continue;
					while (aSelf.updateResultsForRange(current, XMigemoPlaces.chunk))
					{
						aSelf.progressiveBuild();
						if (aSelf.results.length >= maxResults) break build;
						yield;
						current += XMigemoPlaces.chunk;
					}
				}
			}
			var runner = DelayedRunner(this);

			this.progressiveBuildTimer = window.setInterval(function(aSelf) {
				try {
					if (aSelf.isMigemoActive) {
						runner.next();
						return;
					}
				}
				catch(e) {
				}
				aSelf.busy = false;
				aSelf.stopProgressiveBuild();
			}, 1, this);
		}
	},
 
	stopDelayedStart : function() 
	{
		if (!this.delayedStartTimer) return;
		window.clearTimeout(this.delayedStartTimer);
		this.delayedStartTimer = null;
	},
  
	// nsIRunnable 
	run : function()
	{
		var maxResults = this.panel.maxResults;
		var current;
		build:
		for (var i = 0, maxi = this.sourcesInfo.length; i < maxi; i++)
		{
			current = 0;
			this.currentSource = i;
			if ('enabled' in this.sourcesInfo[this.currentSource] &&
				!this.sourcesInfo[this.currentSource].enabled) continue;
			while (this.updateResultsForRange(current, XMigemoPlaces.chunk))
			{
				if (this.results.length >= maxResults) break build;
				current += XMigemoPlaces.chunk;
			}
		}
		this.threadDone = true;
	},
	QueryInterface : function(aIID) {
		if (aIID.equals(Components.interfaces.nsIRunnable) ||
			aIID.equals(Components.interfaces.nsISupports))
			return this;
		throw Components.results.NS_ERROR_NO_INTERFACE;
	},
  
	updateRegExp : function() 
	{
		var updatedInput = {};
		this.lastFindFlag = XMigemoPlaces.getFindFlagFromInput(this.lastInput, updatedInput);
		this.lastInput = updatedInput.value;

		var findInput = this.lastInput;
		if (XMigemoPlaces.autoStartRegExpFind &&
			this.TextUtils.isRegExp(findInput)) {
			var source = this.TextUtils.extractRegExpSource(findInput);
			this.lastFindRegExp =
				this.lastTermsRegExp = new RegExp(source, 'gim');
			this.lastFindMode = Components.interfaces.pIXMigemoFind.FIND_MODE_REGEXP;
		}
		else {
			if (XMigemoPlaces.notFindAvailable) {
				var exceptions = {};
				findInput = XMigemoPlaces.siftExceptions(findInput, exceptions);
				if (exceptions.value.length)
					this.lastExceptionsRegExp = new RegExp(this.TextUtils.getORFindRegExpFromTerms(XMigemoCore.getRegExps(exceptions.value.join(' '))), 'gim');
			}
			var terms = XMigemoCore.getRegExps(findInput);
			this.lastFindRegExp = new RegExp(
				(XMigemoPlaces.andFindAvailable ?
					this.TextUtils.getANDFindRegExpFromTerms(terms) :
					XMigemoCore.getRegExp(findInput)
				),
				'gim'
			);
			this.lastTermsRegExp = new RegExp(
				this.TextUtils.getORFindRegExpFromTerms(terms),
				'gim'
			);
			this.lastFindMode = Components.interfaces.pIXMigemoFind.FIND_MODE_MIGEMO;
		}
	},
 
	updateResultsForRange : function(aStart, aRange) 
	{
		var info = this.sourcesInfo[this.currentSource];
		var sources = XMigemoPlaces.getSourceInRange(
				info.getSourceSQL(this.lastFindFlag),
				aStart, aRange,
				(info.getSourceBindingFor ? info.getSourceBindingFor(this.lastInput) : null )
			);
		if (!sources) return false;

		var terms = info.termsGetter ?
				info.termsGetter(this.lastInput, sources) :
				sources.match(this.lastFindRegExp) ;
		if (!terms) return true;

		var utils = this.TextUtils;

		terms = this.TextUtils.brushUpTerms(terms)
			.filter(function(aTerm) {
				return utils.trim(aTerm);
			});
		this.lastTerms = this.TextUtils.brushUpTerms(this.lastTerms.concat(terms));

		var exceptions = [];
		if (info.exceptionsGetter) {
			exceptions = info.exceptionsGetter();
		}
		else if (this.lastExceptionsRegExp) {
			exceptions = sources.match(this.lastExceptionsRegExp) || [];
			exceptions = this.TextUtils.brushUpTerms(exceptions)
				.filter(function(aTerm) {
					return utils.trim(aTerm);
				});
		}

		results = this.findItemsFromTerms(
			terms,
			exceptions,
			aStart,
			aRange
		);
		this.results = this.results.concat(results);

		return true;
	},
 
	clear : function() 
	{
		this.stopDelayedStart();
		this.stopProgressiveBuild();

		this.results = [];
		this.lastFoundPlaces = {};
		this.lastInput = '';
		this.lastTerms = [];
		this.lastFindFlag = 0;
		this.lastExceptions = [];
		this.lastFindRegExp = null;
		this.lastTermsRegExp = null;
		this.lastExceptionsRegExp = null;
		this.threadDone = true;

		this.panel.overrideValue = null;

		this.busy = false;
	},
 
	delayedClose : function() 
	{
		this.stopDelayedClose();
		this.delayedCloseTimer = window.setTimeout(function(aSelf) {
			aSelf.stopDelayedClose();
			aSelf.bar.closePopup();
		}, this.delay, this);
	},
	stopDelayedClose : function()
	{
		if (!this.delayedCloseTimer) return;
		window.clearTimeout(this.delayedCloseTimer);
		this.delayedCloseTimer = null;
	},
	delayedCloseTimer : null,
 
/* build popup */ 
	builtCount : 0,
	 
	findItemsFromTerms : function(aTerms, aExceptions, aStart, aRange) 
	{
		if (!aExceptions) aExceptions = [];

		var items = [];
		if (!aTerms.length && !aExceptions.length) return items;

		aTerms = aTerms.slice(0, Math.min(100, aTerms.length));

		var info = this.sourcesInfo[this.currentSource];

		var sql      = info.getItemsSQL(this.lastFindFlag);
		var bindings = info.getItemsBindingFor ? info.getItemsBindingFor(this.lastInput) : [] ;
		var offset   = bindings.length;

		var termsCount      = aTerms.length;
		var exceptionsCount = aExceptions.length;
		if (/\%TERMS_RULES\%/i.test(sql)) {
			sql = sql.replace(
					'%TERMS_RULES%',
					(aTerms.length ?
						'('+
						aTerms.map(function(aTerm, aIndex) {
							return 'findkey LIKE ?%d%'
									.replace(/%d%/g, aIndex+offset+1);
						}).join(' OR ')+
						')' :
						''
					)+
					(aExceptions.length ?
						(aTerms.length ? ' AND ' : '' )+
						aExceptions.map(function(aTerm, aIndex) {
							return 'findkey NOT LIKE ?%d%'
								.replace(/%d%/g, aIndex+termsCount+offset+1);
						}).join(' AND ') :
						''
					)
				);
		}
		else {
			termsCount      = 0;
			exceptionsCount = 0;
		}
		if (aStart !== void(0)) {
			aRange = Math.max(0, aRange);
			if (!aRange) return items;
			sql = sql.replace(
				'%SOURCES_LIMIT_PART%',
				'LIMIT ?'+(termsCount+exceptionsCount+offset+1)+',?'+(termsCount+exceptionsCount+offset+2)
			);
		}
		else {
			sql = sql.replace('%SOURCES_LIMIT_PART%', '');
		}

		var statement;
		try {
			statement = XMigemoPlaces.db.createStatement(sql);
		}
		catch(e) {
			dump(e+'\n'+sql+'\n');
			return items;
		}
		try {
			bindings.forEach(function(aValue, aIndex) {
				if (typeof aValue == 'number')
					statement.bindDoubleParameter(aIndex, aValue);
				else
					statement.bindStringParameter(aIndex, aValue);
			});
			if (termsCount) {
				aTerms.forEach(function(aTerm, aIndex) {
					statement.bindStringParameter(aIndex+offset, '%'+aTerm+'%');
				});
			}
			if (exceptionsCount) {
				aExceptions.forEach(function(aTerm, aIndex) {
					statement.bindStringParameter(aIndex+termsCount+offset, '%'+aTerm+'%');
				});
			}
			if (aStart !== void(0)) {
				statement.bindDoubleParameter(termsCount+exceptionsCount+offset, Math.max(0, aStart));
				statement.bindDoubleParameter(termsCount+exceptionsCount+offset+1, Math.max(0, aRange));
			}
			var item, bookmark, terms;
			var utils = this.TextUtils;
			var maxNum = XMigemoService.getPref('browser.urlbar.maxRichResults');
			var uri;
			while(statement.executeStep())
			{
				uri = statement.getString(1);
				if (uri in this.lastFoundPlaces) continue;
				this.lastFoundPlaces[uri] = true;

				terms = this.TextUtils.brushUpTerms(
						statement.getString(5).match(this.lastTermsRegExp) ||
						[]
					).filter(function(aTerm) {
						return utils.trim(aTerm);
					});
				item = {
					title : (statement.getIsNull(0) ? '' : statement.getString(0) ),
					uri   : uri,
					icon  : (statement.getIsNull(2) ? '' : statement.getString(2) ),
					tags  : (statement.getIsNull(4) ? '' : statement.getString(4) ),
					style : 'favicon',
					terms : terms.join(' ')
				};
				if (bookmark = (statement.getIsNull(3) ? '' : statement.getString(3) )) {
					item.title = bookmark;
					item.style = 'bookmark';
				}
				if (item.tags) {
					item.style = 'tag';
				}
				if (info.style) {
					item.style = info.style;
				}

				if (info.itemFilter && !info.itemFilter(item, terms, this.lastFindFlag))
					continue;

				items.push(item);

				if (items.length >= maxNum) break;
			};
		}
		finally {
			statement.reset();
		}
		return items;
	},
 
	progressiveBuild : function() 
	{
		if (!this.results.length ||
			this.results.length == this.builtCount)
			return;

		var controller = this.bar.controller;
		if (!this.builtCount) {
			controller.searchStringOverride = this.lastInput;
			this.clearListbox();
		}
		for (let i = this.builtCount, maxi = this.results.length; i < maxi; i++)
		{
			this.buildItemAt(i);
		}
		this.stopDelayedClose();
		controller.resultsOverride = this.results;
		controller.matchCountOverride = this.results.length;
		this.panel.adjustHeight();
		this.bar.openPopup();
		this.builtCount = this.results.length;
	},
 
	stopProgressiveBuild : function() 
	{
		if (!this.progressiveBuildTimer) return;
		window.clearInterval(this.progressiveBuildTimer);
		this.progressiveBuildTimer = null;
		if (this.thread)
			this.thread.shutdown();
		if (this.isBlank)
			this.bar.closePopup();
	},
 
	buildItemAt : function(aIndex) 
	{
		const listbox = this.listbox;
		var existingCount = listbox.children.length;

		var item = null;
		if (aIndex <= this.results.length) {
			item = this.results[aIndex];
			item.uri = this.Converter.unEscapeURIForUI('UTF-8', item.uri);
		}

		var node;
		if (aIndex < existingCount) {
			node = listbox.childNodes[aIndex];
			if (!item) {
				node = listbox.childNodes[aIndex];
				node.collapsed = true;
				return;
			}
			if (node.getAttribute('text') == item.terms &&
				node.getAttribute('url') == item.uri) {
				node.collapsed = false;
				return;
			}
		}
		else {
			node = document.createElementNS(this.kXULNS, 'richlistitem');
		}
		node.setAttribute('image', 'moz-anno:favicon:'+item.icon);
		node.setAttribute('url', item.uri);
		node.setAttribute('title', item.title + (item.tags ? ' \u2013 ' + item.tags : '' ));
		node.setAttribute('type', item.style);
		node.setAttribute('text', item.terms);
		if (aIndex < existingCount) {
			node._adjustAcItem();
			node.collapsed = false;
		}
		else {
			node.className = 'autocomplete-richlistitem';
			listbox.appendChild(node);
		}
	},
 
	clearListbox : function() 
	{
		const items = this.listbox.children;
		Array.slice(items).forEach(function(aItem) {
			aItem.collapsed = true;
		});
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
			LocationBarHelpers._searchBegin.toSource().replace(
				/(\}\))?$/,
				'if (XMigemoLocationBarOverlay.isMigemoActive) XMigemoLocationBarOverlay.onSearchBegin(); $1'
			)
		);

		var panel = this.panel;
		eval('panel._appendCurrentResult = '+
			panel._appendCurrentResult.toSource().replace(
				'{',
				'{ if (XMigemoLocationBarOverlay.isMigemoActive) return;'
			)
		);
		panel.__defineGetter__('overrideValue', function() {
			return this.mXMigemoOverrideValue;
		});
		panel.__defineSetter__('overrideValue', function(aValue) {
			this.mXMigemoOverrideValue = aValue;
			return aValue;
		});

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

		bar.__xmigemo__mController = bar.mController;
		bar.mController = new XMIgemoAutoCompletePopupController(bar.__xmigemo__mController);
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

		bar.mController.destroy();
		bar.mController = bar.__xmigemo__mController;
		delete bar.__xmigemo__mController;
	}
  
}; 
 
window.addEventListener('load', XMigemoLocationBarOverlay, false); 
  
function XMIgemoAutoCompletePopupController(aBaseController) 
{
	this.init(aBaseController);
}

XMIgemoAutoCompletePopupController.prototype = {
	
	searchStringOverride : '', 
	matchCountOverride   : 0,
	resultsOverride      : [],
 
	get service() 
	{
		return XMigemoLocationBarOverlay;
	},
	get controller()
	{
		return this.mController;
	},
 
	init : function(aBaseController) 
	{
		this.mController = aBaseController;
	},
 
	destroy : function() 
	{
		this.stopSearch();
		delete this.searchStringOverride;
		delete this.matchCountOverride;
		delete this.resultsOverride;
		delete this.mController;
	},
 
	clearOverride : function() 
	{
		this.searchStringOverride = '';
		this.matchCountOverride   = 0;
		this.resultsOverride      = [];
	},
 
	STATUS_NONE              : Components.interfaces.nsIAutoCompleteController.STATUS_NONE, 
	STATUS_SEARCHING         : Components.interfaces.nsIAutoCompleteController.STATUS_SEARCHING,
	STATUS_COMPLETE_NO_MATCH : Components.interfaces.nsIAutoCompleteController.STATUS_COMPLETE_NO_MATCH,
	STATUS_COMPLETE_MATCH    : Components.interfaces.nsIAutoCompleteController.STATUS_COMPLETE_MATCH,
 
	get input() 
	{
		return this.controller.input;
	},
	set input(aValue)
	{
		return this.controller.input = aValue;
	},
 
	get searchStatus(aValue) 
	{
		return this.controller.searchStatus;
	},
 
	get matchCount() 
	{
		return this.matchCountOverride || this.controller.matchCount;
	},
 
	startSearch : function(aString) 
	{
		if (this.service.isMigemoActive) return;
		return this.controller.startSearch(aString);
	},
 
	stopSearch : function() 
	{
		return this.controller.stopSearch();
	},
 
	handleText : function(aIgnoreSelection) 
	{
		if (this.service.isMigemoActive) {
			this.service.onSearchBegin();
			return;
		}
		else {
			this.clearOverride();
			this.service.clear();
		}
		return this.controller.handleText(aIgnoreSelection);
	},
 
	handleEnter : function(aIsPopupSelection) 
	{
		var popup = this.input.popup;
		var index = popup.selectedIndex;
		if (this.resultsOverride.length &&
			index > -1 &&
			popup.popupOpen) {
			popup.overrideValue = this.resultsOverride[index].uri;
			window.setTimeout(function(aSelf) {
				aSelf.service.clear();
				aSelf.service.bar.closePopup();
			}, 0, this);
		}
		else {
			this.service.clear();
		}
		return this.controller.handleEnter(aIsPopupSelection);
	},
 
	handleEscape : function() 
	{
		this.service.clear();
		var retval = this.controller.handleEscape();
		if (retval &&
			this.input.textValue == this.searchString &&
			this.searchStringOverride) {
			this.input.textValue = this.searchStringOverride;
		}
		return retval;
	},
 
	handleStartComposition : function() 
	{
		return this.controller.handleStartComposition();
	},
 
	handleEndComposition : function() 
	{
		return this.controller.handleEndComposition();
	},
 
	handleTab : function() 
	{
		return this.controller.handleTab();
	},
 
	handleKeyNavigation : function(aKey) 
	{
		const nsIDOMKeyEvent = Components.interfaces.nsIDOMKeyEvent;
		var input = this.input;
		var popup = input.popup;
		var isMac = navigator.platform.toLowerCase().indexOf('mac') == 0;
		if (
			this.resultsOverride.length &&
			(
				aKey == nsIDOMKeyEvent.DOM_VK_UP ||
				aKey == nsIDOMKeyEvent.DOM_VK_DOWN ||
				aKey == nsIDOMKeyEvent.DOM_VK_PAGE_UP ||
				aKey == nsIDOMKeyEvent.DOM_VK_PAGE_DOWN
			)
			) {
			if (popup.popupOpen) {
				var reverse = (aKey == nsIDOMKeyEvent.DOM_VK_UP || aKey == nsIDOMKeyEvent.DOM_VK_PAGE_UP);
				var page = (aKey == nsIDOMKeyEvent.DOM_VK_PAGE_UP || aKey == nsIDOMKeyEvent.DOM_VK_PAGE_DOWN);
				var completeSelection = input.completeSelectedIndex;
				popup.selectBy(reverse, page);
				if (completeSelection) {
					var selectedIndex = popup.selectedIndex;
					if (selectedIndex >= 0) {
						input.textValue = this.resultsOverride[selectedIndex].uri;
					}
					else {
						input.textValue = this.searchStringOverride || this.searchString;
					}
					input.selectTextRange(input.textValue.length, input.textValue.length);
				}
				return true;
			}
			else if (
				!isMac ||
				(
					aKey == nsIDOMKeyEvent.DOM_VK_UP ?
					(
						input.selectionStart == 0 &&
						input.selectionStart == input.selectionEnd
					) :
					aKey == nsIDOMKeyEvent.DOM_VK_DOWN ?
					(
						input.selectionStart == input.selectionEnd &&
						input.selectionEnd == input.textValue.length
					) :
					false
				)
				) {
				if (this.matchCountOverride) {
					popup.adjustHeight();
					input.openPopup();
					return true;
				}
			}
		}
		else if (
			this.resultsOverride.length &&
			(
				aKey == nsIDOMKeyEvent.DOM_VK_LEFT ||
				aKey == nsIDOMKeyEvent.DOM_VK_RIGHT ||
				(isMac && aKey == nsIDOMKeyEvent.DOM_VK_HOME)
			)
			) {
			if (popup.popupOpen) {
				var selectedIndex = popup.selectedIndex;
				if (selectedIndex >= 0) {
					input.textValue = this.resultsOverride[selectedIndex].uri;
					input.selectTextRange(input.textValue.length, input.textValue.length);
				}
				input.closePopup();
			}
			this.clearOverride();
			this.searchString = input.textValue;
			return false;
		}
		return this.controller.handleKeyNavigation(aKey);
	},
 
	handleDelete : function() 
	{
		var popup = this.input.popup;
		var index = popup.selectedIndex;
		if (this.resultsOverride.length &&
			index > -1) {
			var retval = false;
			popup.selectedIndex = -1;
			PlacesUtils.history
				.QueryInterface(Components.interfaces.nsIBrowserHistory)
				.removePage(makeURI(this.resultsOverride[index].uri));
			this.resultsOverride.splice(index, 1);
			this.matchCountOverride--;
			if (index >= this.matchCountOverride)
				index = this.matchCountOverride-1;

			if (this.resultsOverride.length) {
				for (var i = index, maxi = this.resultsOverride.length; i < maxi; i++)
				{
					this.service.buildItemAt(i);
				}
				popup.adjustHeight();
				popup.selectedIndex = index;
				this.input.textValue = this.resultsOverride[index].uri;
				retval = true;
			}
			else {
				this.service.clear();
			}
			return retval;
		}
		return this.controller.handleDelete();
	},
 
	getValueAt : function(aIndex) 
	{
		if (this.resultsOverride.length)
			return this.resultsOverride[aIndex].uri;
		return this.controller.getValueAt(aIndex);
	},
 
	getCommentAt : function(aIndex) 
	{
		if (this.resultsOverride.length)
			return this.resultsOverride[aIndex].title;
		return this.controller.getCommentAt(aIndex);
	},
 
	getStyleAt : function(aIndex) 
	{
		if (this.resultsOverride.length)
			return this.resultsOverride[aIndex].style;
		return this.controller.getStyleAt(aIndex);
	},
 
	getImageAt : function(aIndex) 
	{
		if (this.resultsOverride.length)
			return this.resultsOverride[aIndex].icon;
		return this.controller.getImageAt(aIndex);
	},
 
	get searchString() 
	{
		return this.searchStringOverride || this.controller.searchString;
	},
	set searchString(aValue)
	{
		return this.controller.searchString = aValue;
	},
 
	QueryInterface : function(aIID) 
	{
		if (aIID.equals(Components.interfaces.nsIAutoCompleteController) ||
			aIID.equals(Components.interfaces.nsISupports))
			return this;
		throw Components.results.NS_ERROR_NO_INTERFACE;
	}
 
}; 
  
