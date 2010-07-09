const EXPORTED_SYMBOLS = ['XMigemoService', 'XMigemoCore', 'xulMigemoCore']; 

const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import('resource://xulmigemo-modules/migemo.jsm');

var namespace = {};
Components.utils.import('resource://xulmigemo-modules/prefs.js', namespace);
Components.utils.import('resource://xulmigemo-modules/namespace.jsm', namespace);
Components.utils.import('resource://xulmigemo-modules/animationManager.js');
Components.utils.import('resource://xulmigemo-modules/stringBundle.js');
 
var XMigemoService = { 
	__proto__ : namespace.prefs,
	namespace : namespace.getNamespaceFor('piro.sakura.ne.jp')['piro.sakura.ne.jp'],
	
	DEBUG : true, 
 
	get ObserverService() 
	{
		if (!this._ObserverService)
			this._ObserverService = Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService);
		return this._ObserverService;
	},
	_ObserverService : null,
 
	get WindowManager() 
	{
		if (!this._WindowManager)
			this._WindowManager = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);
		return this._WindowManager;
	},
	_WindowManager : null,
 
	get WindowWatcher() 
	{
		if (!this._WindowWatcher)
			this._WindowWatcher = Cc['@mozilla.org/embedcomp/window-watcher;1'].getService(Ci.nsIWindowWatcher);
		return this._WindowWatcher;
	},
	_WindowWatcher : null,
 
	get textUtils() { 
		if (!this._TextUtils) {
			try {
				this._TextUtils = Cc['@piro.sakura.ne.jp/xmigemo/text-utility;1']
					.getService(Ci.xmIXMigemoTextUtils);
			}
			catch(e) {
				throw e;
			}
		}
		return this._TextUtils;
	},
	_TextUtils : null,
 
	get animationManager() { 
		return this.namespace.animationManager;
	},
 
	get stringBundle() { 
		return this.namespace.stringBundle;
	},
 
	get XULAppInfo() { 
		if (!this._XULAppInfo) {
			this._XULAppInfo = Cc['@mozilla.org/xre/app-info;1']
								.getService(Ci.nsIXULAppInfo)
								.QueryInterface(Ci.nsIXULRuntime);
		}
		return this._XULAppInfo;
	},
	_XULAppInfo : null,
	get Comparator() {
		if (!this._Comparator) {
			this._Comparator = Cc['@mozilla.org/xpcom/version-comparator;1'].getService(Ci.nsIVersionComparator);
		}
		return this._Comparator;
	},
	_Comparator : null,
 
	get strbundle() 
	{
		if (!this._strbundle)
			this._strbundle = this.stringBundle.get('chrome://xulmigemo/locale/xulmigemo.properties');
		return this._strbundle;
	},
 
	firstListenPrefChange : function(aObserver, aList) 
	{
		if (!aList &&
			'preferences' in aObserver &&
			typeof aObserver.preferences == 'string')
			aList = aObserver.preferences;

		aList = this.textUtils.trim(aList || '');
		if (aList)
			aList.split(/\s+/)
				.forEach(function(aPref) {
					aObserver.observe(null, 'nsPref:changed', aPref);
				});
	},
 
/* Shortcut Keys */ 
	
	parseShortcut : function(aShortcut) 
	{
		var accelKey = this.XULAppInfo.OS.indexOf('Darwin') < 0 ? 'ctrl' : 'meta' ;
		aShortcut = aShortcut.replace(/accel/gi, accelKey);

		var keys = aShortcut.split('+');

		var keyCode = keys[keys.length-1].replace(/ /g, '_').toUpperCase();
		var key     = keyCode;

		var keyCodeName = (keyCode.length == 1 || keyCode == 'SPACE' || !keyCode) ? '' : 'VK_'+keyCode ;
		key = keyCodeName ? '' : keyCode ;

		return {
			key      : key,
			charCode : (key ? key.charCodeAt(0) : '' ),
			keyCode  : keyCodeName,
			altKey   : /alt/i.test(aShortcut),
			ctrlKey  : /ctrl|control/i.test(aShortcut),
			metaKey  : /meta/i.test(aShortcut),
			shiftKey : /shift/i.test(aShortcut),
			string   : aShortcut,
			modified : false
		};
	},
 
	updateKey : function(aID, aInfo, aXULDocument) 
	{
		var keyset = aXULDocument.getElementById('xmigemo-shortcuts');
		var node = aXULDocument.getElementById(aID);
		if (node)
			keyset.removeChild(node);

		if (!aInfo.key && !aInfo.keyCode) return;

		node = aXULDocument.createElement('key');
		node.setAttribute('id', aID);
		node.setAttribute('command', aID.replace('shortcut', 'command'));

		if (aInfo.key)
			node.setAttribute('key', aInfo.key);

		if (aInfo.keyCode)
			node.setAttribute('keycode', aInfo.keyCode);

		var modifiers = [];
		if (aInfo.altKey) modifiers.push('alt');
		if (aInfo.ctrlKey) modifiers.push('control');
		if (aInfo.shiftKey) modifiers.push('shift');
		if (aInfo.metaKey) modifiers.push('meta');
		modifiers = modifiers.join(',');
		if (modifiers)
			node.setAttribute('modifiers', modifiers);

		keyset.appendChild(node);
	},
 
	checkShortcutForKeyEvent : function(aShortcut, aEvent) 
	{
		return (
				(aShortcut.keyCode && aEvent.keyCode == Ci.nsIDOMKeyEvent['DOM_'+aShortcut.keyCode]) ||
				(aEvent.type != 'keyup' && aShortcut.charCode && aEvent.charCode == aShortcut.charCode)
			) &&
			aShortcut.shiftKey == aEvent.shiftKey &&
			aShortcut.altKey == aEvent.altKey &&
			aShortcut.ctrlKey == aEvent.ctrlKey &&
			aShortcut.metaKey == aEvent.metaKey;
	},
  
	get useGlobalStyleSheets() 
	{
		if (this._useGlobalStyleSheets === null)
			this._useGlobalStyleSheets = this.SSS ? true : false ;
		return this._useGlobalStyleSheets;
	},
	_useGlobalStyleSheets : null,
	
	get SSS() 
	{
		if (this._SSS === void(0)) {
			if ('@mozilla.org/content/style-sheet-service;1' in Cc) {
				this._SSS = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService);
			}
			if (!this._SSS)
				this._SSS = null;
		}
		return this._SSS;
	},
//	_SSS : null,
 
	addStyleSheet : function(aURI, aDocument) 
	{
		var newPI = aDocument.createProcessingInstruction('xml-stylesheet',
				'href="'+aURI+'" type="text/css" media="all"');
		aDocument.insertBefore(newPI, aDocument.firstChild);
	},
  
	getDocumentSizeInfo : function(aDocument) 
	{
		var w = aDocument.defaultView;
		var xScroll = w.innerWidth + w.scrollMaxX;
		var yScroll = w.innerHeight + w.scrollMaxY;
		var windowWidth  = w.innerWidth;
		var windowHeight = w.innerHeight;
		var pageWidth  = (xScroll < windowWidth) ? windowWidth : xScroll ;
		var pageHeight = (yScroll < windowHeight) ? windowHeight : yScroll ;
		var retVal = {
				width   : pageWidth,
				height  : pageHeight,
				viewWidth  : windowWidth,
				viewHeight : windowHeight,
				xScrollable : (w.scrollMaxX ? true : false ),
				yScrollable : (w.scrollMaxY ? true : false )
			};
		return retVal;
	},
 
/* event handling */ 
	
	isEventFiredInInputField : function(aEvent) 
	{
		try { // in rich-textarea (ex. Gmail)
			var doc = aEvent.originalTarget.ownerDocument || aEvent.originalTarget;
			if (doc.designMode == 'on')
				return true;

			var win = doc.defaultView;
			var editingSession = win.QueryInterface(Ci.nsIInterfaceRequestor)
								.getInterface(Ci.nsIWebNavigation)
								.QueryInterface(Ci.nsIInterfaceRequestor)
								.getInterface(Ci.nsIEditingSession);
			if (editingSession.windowIsEditable(win))
				return true;
		}
		catch(e) {
		}

		return /^(input|textarea|textbox|select|isindex|object|embed)$/i.test(aEvent.originalTarget.localName);
	},
 
	isEventFiredInFindableDocument : function(aEvent) 
	{
		var doc = aEvent.originalTarget.ownerDocument || aEvent.originalTarget;
		return /^text\/|\+xml$|^application\/((x-)?javascript|xml)$/.test(doc.contentType);
	},
 
	isEventFiredOnScrollBar : function(aEvent) 
	{
		var node = aEvent.originalTarget;
		do
		{
			if (/^(scrollbar|scrollbarbutton|slider|thumb|gripper)$/i.test(node.localName))
				return true;
			node = node.parentNode;
		} while (node.parentNode);
		return false;
	},
  
	goDicManager : function(aOwner) 
	{
		var uri = 'chrome://xulmigemo/content/dicManager/dicManager.xul';
		var targets = this.WindowManager.getEnumerator('xulmigemo:dictionaryManager', true),
			target;
		while (targets.hasMoreElements())
		{
			target = targets.getNext().QueryInterface(Ci.nsIDOMWindowInternal);
			if (target.location.href == uri) {
				target.focus();
				return;
			}
		}

		this.WindowWatcher.openWindow(
			aOwner || null,
			uri,
			'XMigemoDicManager',
			'chrome,all,dependent',
			null
		);
	},
 
/* Debug */ 
	
	mydump : function(str) 
	{
		if(this.DEBUG==true){
			if(str.length>30){
				str=str.substring(0,30);
			}
			const UConvID = '@mozilla.org/intl/scriptableunicodeconverter';
			const UConvIF  = Ci.nsIScriptableUnicodeConverter;
			const UConv = Cc[UConvID].getService(UConvIF);
			UConv.charset = 'Shift_JIS';
			sjis_str = UConv.ConvertFromUnicode(str);
			dump(sjis_str+"\n");
			return;
		}else{
			return;
		}
	},
  
	dummy : null
}; 
  
var XMigemoCore = { 
	dictionaries : Ci.xmIXMigemoEngine.ALL_DIC, 
	
	getRegExp : function(aInput) 
	{
		return this.XMigemo.getRegExp(aInput);
	},
 
	getRegExps : function(aInput) 
	{
		return this.XMigemo.getRegExps(aInput);
	},
 
	getRegExpFunctional : function(aInput, aTermsRegExp, aExceptionRegExp) 
	{
		return this.XMigemo.getRegExpFunctional(aInput, aTermsRegExp, aExceptionRegExp);
	},
 
	getRegExpsFunctional : function(aInput, aTermsRegExp, aExceptionRegExp) 
	{
		return this.XMigemo.getRegExpsFunctional(aInput, aTermsRegExp, aExceptionRegExp);
	},
 
	regExpFind : function(aRegExpSource, aRegExpFlags, aFindRange, aStartPoint, aEndPoint, aFindBackwards) 
	{
		return this.XMigemo.regExpFind(aRegExpSource, aRegExpFlags, aFindRange, aStartPoint, aEndPoint, aFindBackwards);
	},
 
	regExpHighlight : function(aRegExpSource, aRegExpFlags, aFindRange, aSurroundNode) 
	{
		return this.XMigemo.regExpHighlight(aRegExpSource, aRegExpFlags, aFindRange, aSurroundNode);
	},
 
	regExpHighlightSelection : function(aRegExpSource, aRegExpFlags, aFindRange, aSurroundNode) 
	{
		return this.XMigemo.regExpHighlightSelection(aRegExpSource, aRegExpFlags, aFindRange, aSurroundNode);
	},
 
	get XMigemo() { 
		if (!this._XMigemo) {
			try {
				this._XMigemo = Cc['@piro.sakura.ne.jp/xmigemo/factory;1']
					.getService(Ci.xmIXMigemoFactory)
					.getService(migemo.language);
			}
			catch(e) {
				throw e;
			}
		}
		return this._XMigemo;
	},
	_XMigemo : null
 
}; 
XMigemoCore.__proto__ = migemo;
  
var xulMigemoCore = XMigemoCore; 
 
