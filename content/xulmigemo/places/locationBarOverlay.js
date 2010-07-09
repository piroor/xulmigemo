Components.utils.import('resource://xulmigemo-modules/places.jsm'); 
 
var XMigemoLocationBarSearchSource = { 
	create : function(aDefinition)
	{
		aDefinition.__proto__ = this;
		return aDefinition;
	},
	isAvailable : function(aFindMode)
	{
		return true;
	},
	getSourceSQL : function(aFindFlag)
	{
		return '';
	},
	getSourceBindingFor : function(aInput)
	{
		return [];
	},
	getItemsSQL : function(aFindFlag)
	{
		return '';
	},
	getItemsBindingFor : function(aInput)
	{
		return [];
	},
	itemFilter : function(aItem, aTerms, aFindFlag) {
		return XMigemoLocationBarOverlay.kITEM_ACCEPT;
	},
	style : null
};
 
var XMigemoLocationBarOverlay = { 
	
	foundItems : [], 
	lastInput : '',
	thread : null,

	enabled   : true,
	isActive  : false,
	delay     : 250,
	useThread : false,

	FIND_MODE_NATIVE : Components.interfaces.xmIXMigemoFind.FIND_MODE_NATIVE,
	FIND_MODE_MIGEMO : Components.interfaces.xmIXMigemoFind.FIND_MODE_MIGEMO,
	FIND_MODE_REGEXP : Components.interfaces.xmIXMigemoFind.FIND_MODE_REGEXP,

	kITEM_ACCEPT  : 1,
	kITEM_SKIP    : 2,
	kITEM_DEFERED : 3,

	MAX_TERMS_COUNT : 100,
 
	sourcesOrder : [
		'KEYWORD_SEARCH',
		'INPUT_HISTORY',
		'MATCHING_BOUNDARY',
		'MATCHING_ANYWHERE',
		'MATCHING_START'
	],
	sources : { 
	
		KEYWORD_SEARCH : XMigemoLocationBarSearchSource.create({ // https://bugzilla.mozilla.org/show_bug.cgi?id=392143 
			getSourceSQL : function(aFindFlag) {
				return XMigemoPlaces.keywordSearchSourceInRangeSQL;
			},
			getSourceBindingFor : function(aInput) {
				var result = this.formatInput(aInput);
				return [result.keyword, result.terms];
			},
			getItemsSQL : function(aFindFlag) {
				return XMigemoPlaces.keywordSearchItemInRangeSQL;
			},
			getItemsBindingFor : function(aInput) {
				var result = this.formatInput(aInput);
				return [result.keyword, result.terms];
			},
			termsGetter : function(aInput, aSource) {
				var result = this.formatInput(aInput);
				return [result.keyword, result.terms];
			},
			exceptionsGetter : function(aInput) {
				return [];
			},
			style : 'keyword',
			formatInput : function(aInput) {
				var input = aInput;
				var index = input.search(/\s/);
				if (index < 0) index = input.length;
				return {
					keyword : XMigemoPlaces.textUtils.trim(input.substring(0, index)),
					terms   : XMigemoPlaces.textUtils.trim(input.substring(index+1))
						.replace(/\+/g, '%2B')
						.replace(/\s+/g, '+')
				};
			}
		}),
 
		INPUT_HISTORY : XMigemoLocationBarSearchSource.create({ 
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
		}),
 
		MATCHING_BOUNDARY : XMigemoLocationBarSearchSource.create({ 
			isAvailable : function(aFindMode) {
				if (!XMigemoPlaces.boundaryFindAvailable) return false;
				return (aFindMode != XMigemoLocationBarOverlay.FIND_MODE_REGEXP) &&
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
						return XMigemoPlaces.textUtils.sanitize(aTerm);
					}).join('|')+')',
					'gim'
				);
				var matched = XMigemoPlaces.textUtils.brushUpTerms(
							XMigemoPlaces.textUtils
								.splitByBoundaries(target.join('\n'))
						).join('\n').match(this.regexp);
				return (matched && matched.length >= aTerms.length) ?
					XMigemoLocationBarOverlay.kITEM_ACCEPT :
					XMigemoLocationBarOverlay.kITEM_DEFERED ;
			},
			regexp : new RegExp()
		}),
 
		MATCHING_ANYWHERE : XMigemoLocationBarSearchSource.create({ 
			isAvailable : function(aFindMode) {
				if (!XMigemoPlaces.boundaryFindAvailable) return XMigemoPlaces.matchBehavior != 3;
				return (aFindMode == XMigemoLocationBarOverlay.FIND_MODE_REGEXP) ||
					XMigemoPlaces.matchBehavior == 0;
			},
			getSourceSQL : function(aFindFlag) {
				return XMigemoPlaces.getPlacesSourceInRangeSQL(aFindFlag);
			},
			getItemsSQL : function(aFindFlag) {
				return XMigemoPlaces.getPlacesItemsSQL(aFindFlag);
			}
		}),
 
		MATCHING_START : XMigemoLocationBarSearchSource.create({ // match start 
			isAvailable : function(aFindMode) {
				return (aFindMode != XMigemoLocationBarOverlay.FIND_MODE_REGEXP) &&
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
						return XMigemoPlaces.textUtils.sanitize(aTerm);
					}).join('|')+')',
					'gim'
				);
				var matched = target.join('\n').match(this.regexp);
				return (matched && matched.length >= aTerms.length) ?
					XMigemoLocationBarOverlay.kITEM_ACCEPT :
					XMigemoLocationBarOverlay.kITEM_SKIP ;
			},
			regexp : new RegExp()
		})
 
	}, 
  
	Converter : Components 
			.classes['@mozilla.org/intl/texttosuburi;1']
			.getService(Components.interfaces.nsITextToSubURI),
	ThreadManager : Components
			.classes['@mozilla.org/thread-manager;1']
			.getService(Components.interfaces.nsIThreadManager),
	textUtils : Components
			.classes['@piro.sakura.ne.jp/xmigemo/text-utility;1']
			.getService(Components.interfaces.xmIXMigemoTextUtils),

	kXULNS : 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul',
 
/* elements */ 
	
	get bar() 
	{
		return document.getElementById('urlbar');
	},
 
	get input() 
	{
		return migemo.trimFunctionalInput(this.bar.value);
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
			this.isActive &&
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
			case 'browser.urlbar.autocomplete.enabled':
				var migemoEnabled = XMigemoService.getPref('xulmigemo.places.locationBar');
				var findEnabled = XMigemoService.getPref('browser.urlbar.autocomplete.enabled');
				if (findEnabled === null) findEnabled = true;
				this.enabled = migemoEnabled && findEnabled;
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
		'xulmigemo.places.locationBar',
		'browser.urlbar.autocomplete.enabled'
	],
	preferences : <![CDATA[
		xulmigemo.places.locationBar
		xulmigemo.places.locationBar.delay
		xulmigemo.places.locationBar.useThread
		browser.urlbar.autocomplete.enabled
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

		var findInfo = XMigemoPlaces.parseInput(this.lastInput);
		this.lastFindInfo = findInfo;
		this.lastInput = findInfo.input;

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
					aSelf.foundItems.length >= maxResults) {
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
				var deferedItems = [];
				var source;
				var result;
				build:
				for (var i in aSelf.sourcesOrder)
				{
					current = 0;
					source = aSelf.sources[aSelf.sourcesOrder[i]];

					if (deferedItems.length) {
						aSelf.foundItems = aSelf.foundItems.concat(deferedItems);
						deferedItems = [];
						aSelf.progressiveBuild();
						if (aSelf.foundItems.length >= maxResults)
							break build;
					}

					if (!source.isAvailable(findInfo.findMode)) continue;
					while (true)
					{
						result = aSelf.findItemsFromRange(findInfo, source, current, XMigemoPlaces.chunk)
						deferedItems = deferedItems.concat(result.deferedItems);
						aSelf.foundItems = aSelf.foundItems.concat(result.items);

						if (result.reachedToEnd) break;

						aSelf.progressiveBuild();
						if (aSelf.foundItems.length >= maxResults) break build;
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
		var deferedItems = [];
		var source;
		var result;
		build:
		for (var i in this.sourcesOrder)
		{
			current = 0;
			source = this.sources[this.sourcesOrder[i]];

			if (deferedItems.length) {
				this.foundItems = this.foundItems.concat(deferedItems);
				deferedItems = [];
				if (this.foundItems.length >= maxResults)
					break build;
			}

			if (!source.isAvailable(this.lastFindInfo.findMode)) continue;
			while (true)
			{
				result = this.findItemsFromRange(this.lastFindInfo, source, current, XMigemoPlaces.chunk);
				deferedItems = deferedItems.concat(result.deferedItems);
				this.foundItems = this.foundItems.concat(result.items);

				if (result.reachedToEnd) break;

				if (this.foundItems.length >= maxResults) break build;
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
  
	findItemsFromRange : function(aFindInfo, aSource, aStart, aRange) 
	{
		var result = {
				items        : [],
				deferedItems : [],
				reachedToEnd : false
			};
		var sources = XMigemoPlaces.getSingleStringFromRange(
				aSource.getSourceSQL(aFindInfo.findFlag),
				aStart, aRange,
				aSource.getSourceBindingFor(aFindInfo.input)
			);
		if (!sources) {
			result.reachedToEnd = true;
			return result;
		}

		var terms = aSource.termsGetter ?
					this.textUtils.brushUpTerms(aSource.termsGetter(aFindInfo.input, sources) || [])
						.filter(function(aTerm) {
							return this.textUtils.trim(aTerm);
						}, this)
						.slice(0, this.MAX_TERMS_COUNT) :
					this.getMatchedTermsFromRegExps(aFindInfo.findRegExps, sources);
		if (!terms || !terms.length) return result;

		var exceptions = [];
		if (aSource.exceptionsGetter) {
			exceptions = aSource.exceptionsGetter();
		}
		else if (aFindInfo.exceptionsRegExp) {
			exceptions = sources.match(aFindInfo.exceptionsRegExp) || [];
			exceptions = this.textUtils.brushUpTerms(exceptions)
				.filter(function(aTerm) {
					return this.textUtils.trim(aTerm);
				}, this);
		}

		var foundItems = this.findItemsFromRangeByTerms(
				aFindInfo,
				aSource,
				aStart,
				aRange,
				terms,
				exceptions
			);
		result.items = foundItems.items;
		result.deferedItems = foundItems.deferedItems;
		return result;
	},
	getMatchedTermsFromRegExps : function(aRegExps, aSources)
	{
		if (!aRegExps || !aRegExps.length || !aSources) return null;
		var utils = this.textUtils;
		var terms = [];
		return aRegExps
				.some(function(aRegExp) {
					let match = aSources.match(aRegExp);
					if (match) {
						let matchedTerms = aRegExp.ignoreCase ?
								utils.brushUpTerms(match) :
								utils.brushUpTermsWithCase(match) ;
						terms.push(
							matchedTerms
								.filter(function(aTerm) {
									return utils.trim(aTerm);
								})
								.slice(0, this.MAX_TERMS_COUNT)
						);
					}
					return !match;
				}, this) ? null : terms.slice(0, this.MAX_TERMS_COUNT) ;
	},
	
	findItemsFromRangeByTerms : function(aFindInfo, aSource, aStart, aRange, aTerms, aExceptions) 
	{
		if (aTerms && aTerms.length && typeof aTerms[0] == 'string')
			aTerms = [aTerms];

		var result = {
				items        : [],
				deferedItems : []
			};
		if (!aExceptions) aExceptions = [];
		if (!aFindInfo.blackList) aFindInfo.blackList = {};

		if (!aTerms.length && !aExceptions.length) return result;

		aTerms = aTerms.slice(0, this.MAX_TERMS_COUNT);

		/* output of the SQL must be:
			SELECT place_title, place_uri, favicon_uri, bookmark_title, tags, findkey
			  FROM ...
		*/
		var sql      = aSource.getItemsSQL(aFindInfo.findFlag);
		var bindings = aSource.getItemsBindingFor(aFindInfo.input);
		var offset   = bindings.length;

		var termsCount = 0;
		var exceptionsCount = aExceptions.length;
		if (/%TERMS_RULES%/i.test(sql)) {
			sql = sql.replace(
					'%TERMS_RULES%',
					(aTerms.length ?
						'('+
						(function() {
							let count = 0;
							return aTerms.map(function(aSubTerms) {
									termsCount += aSubTerms.length;
									return '('+
										aSubTerms.map(function(aSubTerms, aIndex) {
											return 'findkey LIKE ?'+((count++)+offset+1);
										}).join(' OR ')+
										')';
								}).join(' AND ');
						})()+
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
			if (!aRange) return result;
			sql = sql.replace(
				'%SOURCES_LIMIT_PART%',
				'LIMIT ?'+(termsCount+exceptionsCount+offset+1)+',?'+(termsCount+exceptionsCount+offset+2)
			);
		}
		else {
			sql = sql.replace('%SOURCES_LIMIT_PART%', '');
		}

		var statement = this.findItemsFromTerms_lastStatement;
		if (!statement || sql != this.findItemsFromTermsLastSQL) {
			this.findItemsFromTerms_lastStatement = null;
			this.findItemsFromTermsLastSQL = sql;
			if (statement && 'finalize' in statement) statement.finalize();
			try {
				statement = XMigemoPlaces.db.createStatement(sql);
				this.findItemsFromTerms_lastStatement = statement;
			}
			catch(e) {
				this.findItemsFromTermsLastSQL = null;
				dump(e+'\n'+sql+'\n');
				return result;
			}
		}
		try {
			bindings.forEach(function(aValue, aIndex) {
				if (typeof aValue == 'number')
					statement.bindDoubleParameter(aIndex, aValue);
				else
					statement.bindStringParameter(aIndex, aValue);
			});
			if (termsCount) {
				let count = 0;
				aTerms.forEach(function(aSubTerms) {
					aSubTerms.forEach(function(aTerm) {
						statement.bindStringParameter((count++)+offset, '%'+aTerm+'%');
					});
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
			var utils = this.textUtils;
			var maxNum = XMigemoService.getPref('browser.urlbar.maxRichResults');
			var uri;
			while(statement.executeStep())
			{
				uri = statement.getString(1);
				if (uri in aFindInfo.blackList) continue;
				aFindInfo.blackList[uri] = true;

				terms = this.textUtils.brushUpTerms(
						statement.getString(5).match(aFindInfo.termsRegExp) ||
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
				if (aSource.style) {
					item.style = aSource.style;
				}
				if (XMigemoPlaces.openPageAvailable && statement.getDouble(6) > 0) {
					item.uri   = 'moz-action:switchtab,'+item.uri;
					item.style = 'action';
				}

				switch (aSource.itemFilter(item, terms, aFindInfo.findFlag))
				{
					default:
					case this.kITEM_ACCEPT:
						break;
					case this.kITEM_DEFERED:
						result.deferedItems.push(item);
					case this.kITEM_SKIP:
						continue;
				}

				result.items.push(item);

				if (result.items.length >= maxNum) break;
			};
		}
		finally {
			statement.reset();
		}
		return result;
	},
	findItemsFromTerms_lastStatement : null,
	findItemsFromTermsLastSQL : null,
  
	clear : function() 
	{
		this.stopDelayedStart();
		this.stopProgressiveBuild();

		this.foundItems = [];
		this.lastFindInfo = null;
		this.lastInput = '';
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
	
	progressiveBuild : function() 
	{
		if (!this.foundItems.length) return;
		this.foundItems = this.foundItems.slice(0, this.panel.maxResults);
		if (this.foundItems.length == this.builtCount)
			return;

		var controller = this.bar.controller;
		if (!this.builtCount) {
			controller.searchStringOverride = this.lastInput;
			this.clearListbox();
		}
		for (let i = this.builtCount, maxi = this.foundItems.length; i < maxi; i++)
		{
			this.buildItemAt(i);
		}
		this.stopDelayedClose();
		controller.resultsOverride = this.foundItems;
		controller.matchCountOverride = this.foundItems.length;
		this.panel.adjustHeight();
		this.bar.openPopup();
		this.builtCount = this.foundItems.length;

		controller.doCompleteDefaultIndex();
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
		if (aIndex <= this.foundItems.length) {
			item = this.foundItems[aIndex];
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
		XMigemoService.firstListenPrefChange(this);
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
		bar.mController = new XMigemoAutoCompletePopupController(bar.__xmigemo__mController);
	},
  
	destroy : function() 
	{
		window.removeEventListener('unload', this, false);
		this.destroyLocationBar();
		XMigemoService.removePrefListener(this);
		if (this.findItemsFromTerms_lastStatement &&
			'finalize' in this.findItemsFromTerms_lastStatement) {
			this.findItemsFromTerms_lastStatement.finalize();
		}
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
  
function XMigemoAutoCompletePopupController(aBaseController) 
{
	this.init(aBaseController);
}

XMigemoAutoCompletePopupController.prototype = {
	
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
 
	get isMigemoResult() 
	{
		return this.service.isActive && this.resultsOverride.length;
	},
 
	get defaultIndexForComplete()
	{
		let term = (this.searchStringOverride || this.searchString || '').toLowerCase().replace(/^\w+:\/\//, '');
		if (this.resultsOverride.length &&
			this.resultsOverride[0].uri.replace(/^\w+:\/\//, '').indexOf(term) == 0)
			return 0;

		return -1;
	},
 
	init : function(aBaseController) 
	{
		this.mController = aBaseController;
		if (this.input) {
			try {
				this.input.popup.removeEventListener('popupshowing', this, false);
			}
			catch(e) {
			}
		}
	},
 
	destroy : function() 
	{
		try {
			this.input.popup.removeEventListener('popupshowing', this, false);
		}
		catch(e) {
		}
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
 
	handleEvent : function(aEvent) 
	{
		switch (aEvent.type)
		{
			case 'popupshowing':
				return this.doCompleteDefaultIndex();
		}
	},
 
	doCompleteDefaultIndex : function() 
	{
		var input = this.input;
		if (!this.isMigemoResult || !input.completeDefaultIndex)
			return;

		var index = this.defaultIndexForComplete;
		if (index < 0)
			return;

		var term = (this.searchStringOverride || this.searchString || '');
		var uri = this.resultsOverride[index].uri;

		var termForMatching = term.toLowerCase().replace(/^\w+:\/\//, '');
		var uriForMatching = uri.toLowerCase().replace(/^\w+:\/\//, '');

		var rest = uri.substring(uri.length - uriForMatching.length + termForMatching.length);

		input.textValue = term + rest;
		input.selectTextRange(term.length, input.textValue.length);
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
		if (this.controller.input) {
			try {
				this.controller.input.popup.removeEventListener('popupshowing', this, false);
			}
			catch(e) {
			}
		}
		aValue.popup.addEventListener('popupshowing', this, false);
		return this.controller.input = aValue;
	},
 
	get searchStatus(aValue) 
	{
		return this.controller.searchStatus;
	},
 
	get matchCount() 
	{
		if (this.isMigemoResult)
			return this.matchCountOverride || this.controller.matchCount;
		return this.controller.matchCount;
	},
 
	startSearch : function(aString) 
	{
		if (!this.service.textUtils.trim(aString) &&
			this.service.isActive) {
			this.service.clearListbox();
			this.service.isActive = false;
			this.controller.searchString = '';
		}
		return this.controller.startSearch(aString);
	},
 
	stopSearch : function() 
	{
		return this.controller.stopSearch();
	},
 
	handleText : function(aIgnoreSelection) 
	{
		this.service.isActive = true;
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
		if (this.isMigemoResult &&
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
		var isPopupOpen = this.controller.handleEscape();
		if (isPopupOpen) { // back to input
			this.input.textValue = this.searchStringOverride;
		}
		else { // exit
			this.searchStringOverride = '';
		}
		return isPopupOpen;
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
			this.isMigemoResult &&
			(
				aKey == nsIDOMKeyEvent.DOM_VK_UP ||
				aKey == nsIDOMKeyEvent.DOM_VK_DOWN ||
				aKey == nsIDOMKeyEvent.DOM_VK_PAGE_UP ||
				aKey == nsIDOMKeyEvent.DOM_VK_PAGE_DOWN
			)
			) {
			if (popup.popupOpen) {
				let reverse = (aKey == nsIDOMKeyEvent.DOM_VK_UP || aKey == nsIDOMKeyEvent.DOM_VK_PAGE_UP);
				let page = (aKey == nsIDOMKeyEvent.DOM_VK_PAGE_UP || aKey == nsIDOMKeyEvent.DOM_VK_PAGE_DOWN);
				popup.selectBy(reverse, page);
				if (input.completeSelectedIndex) {
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
			this.isMigemoResult &&
			(
				aKey == nsIDOMKeyEvent.DOM_VK_LEFT ||
				aKey == nsIDOMKeyEvent.DOM_VK_RIGHT ||
				(!isMac && aKey == nsIDOMKeyEvent.DOM_VK_HOME)
			)
			) {
			if (popup.popupOpen) {
				let selectedIndex = popup.selectedIndex;
				if (selectedIndex < 0 && input.completeDefaultIndex)
					selectedIndex = this.defaultIndexForComplete;

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
		if (this.isMigemoResult &&
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
		if (this.isMigemoResult)
			return this.resultsOverride[aIndex].uri;
		return this.controller.getValueAt(aIndex);
	},
 
	getCommentAt : function(aIndex) 
	{
		if (this.isMigemoResult)
			return this.resultsOverride[aIndex].title;
		return this.controller.getCommentAt(aIndex);
	},
 
	getStyleAt : function(aIndex) 
	{
		if (this.isMigemoResult)
			return this.resultsOverride[aIndex].style;
		return this.controller.getStyleAt(aIndex);
	},
 
	getImageAt : function(aIndex) 
	{
		if (this.isMigemoResult)
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
  
