var XMigemoService = { 
	 
	DEBUG : true, 
 
	get ObserverService() 
	{
		if (!this._ObserverService)
			this._ObserverService = Components.classes['@mozilla.org/observer-service;1'].getService(Components.interfaces.nsIObserverService);
		return this._ObserverService;
	},
	_ObserverService : null,
 
	get WindowManager() 
	{
		if (!this._WindowManager)
			this._WindowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
		return this._WindowManager;
	},
	_WindowManager : null,
 
	get TextUtils() { 
		if (!this._TextUtils) {
			try {
				this._TextUtils = Components
					.classes['@piro.sakura.ne.jp/xmigemo/text-utility;1']
					.getService(Components.interfaces.pIXMigemoTextUtils);
			}
			catch(e) {
				throw e;
			}
		}
		return this._TextUtils;
	},
	_TextUtils : null,
 
	get isGecko18() { 
		var version = this.XULAppInfo.platformVersion.split('.');
		return parseInt(version[0]) <= 1 && parseInt(version[1]) <= 8;
	},
	get isGecko19() {
		var version = this.XULAppInfo.platformVersion.split('.');
		return parseInt(version[0]) >= 2 || parseInt(version[1]) >= 9;
	},

	get XULAppInfo() {
		if (!this._XULAppInfo) {
			this._XULAppInfo = Components.classes['@mozilla.org/xre/app-info;1'].getService(Components.interfaces.nsIXULAppInfo);
		}
		return this._XULAppInfo;
	},
	_XULAppInfo : null,
 
/* Prefs */ 
	
	get Prefs() 
	{
		if (!this._Prefs) {
			this._Prefs = Components.classes['@mozilla.org/preferences;1'].getService(Components.interfaces.nsIPrefBranch);
		}
		return this._Prefs;
	},
	_Prefs : null,
 
	knsISupportsString : ('nsISupportsWString' in Components.interfaces) ? Components.interfaces.nsISupportsWString : Components.interfaces.nsISupportsString, 
 
	getPref : function(aPrefstring, aStringType) 
	{
		try {
			switch (this.Prefs.getPrefType(aPrefstring))
			{
				case this.Prefs.PREF_STRING:
					return this.Prefs.getComplexValue(aPrefstring, aStringType || this.knsISupportsString).data;
					break;
				case this.Prefs.PREF_INT:
					return this.Prefs.getIntPref(aPrefstring);
					break;
				default:
					return this.Prefs.getBoolPref(aPrefstring);
					break;
			}
		}
		catch(e) {
		}

		return null;
	},
 
	setPref : function(aPrefstring, aNewValue, aPrefObj) 
	{
		var pref = aPrefObj || this.Prefs ;
		var type;
		try {
			type = typeof aNewValue;
		}
		catch(e) {
			type = null;
		}

		switch (type)
		{
			case 'string':
				var string = ('@mozilla.org/supports-wstring;1' in Components.classes) ?
						Components.classes['@mozilla.org/supports-wstring;1'].createInstance(this.knsISupportsString) :
						Components.classes['@mozilla.org/supports-string;1'].createInstance(this.knsISupportsString) ;
				string.data = aNewValue;
				pref.setComplexValue(aPrefstring, this.knsISupportsString, string);
				break;
			case 'number':
				pref.setIntPref(aPrefstring, parseInt(aNewValue));
				break;
			default:
				pref.setBoolPref(aPrefstring, aNewValue);
				break;
		}
		return true;
	},
 
	clearPref : function(aPrefstring) 
	{
		try {
			this.Prefs.clearUserPref(aPrefstring);
		}
		catch(e) {
		}

		return;
	},
 
	addPrefListener : function(aObserver) 
	{
		var domains = ('domains' in aObserver) ? aObserver.domains : [aObserver.domain] ;
		try {
			var pbi = this.Prefs.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
			for (var i = 0; i < domains.length; i++)
				pbi.addObserver(domains[i], aObserver, false);
		}
		catch(e) {
		}
		if ('preferences' in aObserver &&
			typeof aObserver.preferences == 'string') {
			this.TextUtils.trim(aObserver.preferences)
				.split(/\s+/)
				.forEach(function(aPref) {
					aObserver.observe(null, 'nsPref:changed', aPref);
				});
		}
	},
 
	removePrefListener : function(aObserver) 
	{
		var domains = ('domains' in aObserver) ? aObserver.domains : [aObserver.domain] ;
		try {
			var pbi = this.Prefs.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
			for (var i = 0; i < domains.length; i++)
				pbi.removeObserver(domains[i], aObserver, false);
		}
		catch(e) {
		}
	},
  
/* string bundle */ 
	
	get strbundle() 
	{
		if (!this._strbundle) {
			this._strbundle = new XMigemoStringBundle('chrome://xulmigemo/locale/xulmigemo.properties');
		}
		return this._strbundle;
	},
  
/* Shortcut Keys */ 
	
	parseShortcut : function(aShortcut) 
	{
		var accelKey = navigator.platform.toLowerCase().indexOf('mac') == 0 ? 'meta' : 'ctrl' ;
		aShortcut = aShortcut.replace(/accel/gi, accelKey);

		var keys = aShortcut.split('+');

		var keyCode = keys[keys.length-1].replace(/ /g, '_').toUpperCase();
		var key     = keyCode;

		sotredKeyCode = (keyCode.length == 1 || keyCode == 'SPACE' || !keyCode) ? '' : 'VK_'+keyCode ;
		key = sotredKeyCode ? '' : keyCode ;

		return {
			key      : key,
			charCode : (key ? key.charCodeAt(0) : '' ),
			keyCode  : sotredKeyCode,
			altKey   : /alt/i.test(aShortcut),
			ctrlKey  : /ctrl|control/i.test(aShortcut),
			metaKey  : /meta/i.test(aShortcut),
			shiftKey : /shift/i.test(aShortcut),
			string   : aShortcut,
			modified : false
		};
	},
 
	updateKey : function(aID, aInfo) 
	{
		var node = document.getElementById(aID);
		if (node)
			this.keyset.removeChild(node);

		if (!aInfo.key && !aInfo.keyCode) return;

		node = document.createElement('key');
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

		this.keyset.appendChild(node);
	},
	get keyset()
	{
		return document.getElementById('xmigemo-shortcuts');
	},
 
	checkShortcutForKeyEvent : function(aShortcut, aEvent) 
	{
		return (
				(aShortcut.keyCode && aEvent.keyCode == Components.interfaces.nsIDOMKeyEvent['DOM_'+aShortcut.keyCode]) ||
				(aShortcut.charCode && aEvent.charCode == aShortcut.charCode)
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
			if ('@mozilla.org/content/style-sheet-service;1' in Components.classes) {
				this._SSS = Components.classes['@mozilla.org/content/style-sheet-service;1'].getService(Components.interfaces.nsIStyleSheetService);
			}
			if (!this._SSS)
				this._SSS = null;
		}
		return this._SSS;
	},
//	_SSS : null,
 
	addStyleSheet : function(aURI, aDocument) 
	{
		var newPI = document.createProcessingInstruction('xml-stylesheet',
				'href="'+aURI+'" type="text/css" media="all"');
		aDocument.insertBefore(newPI, document.firstChild);
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
		return {
				width   : pageWidth,
				height  : pageHeight,
				viewWidth  : windowWidth,
				viewHeight : windowHeight,
				xScrillable : (w.scrollMaxX ? true : false ),
				yScrillable : (w.scrollMaxY ? true : false )
			};
	},
 
/* event handling */ 
	 
	isEventFiredInInputField : function(aEvent) 
	{
		try { // in rich-textarea (ex. Gmail)
			var doc = Components.lookupMethod(aEvent.originalTarget, 'ownerDocument').call(aEvent.originalTarget);
			if (Components.lookupMethod(doc, 'designMode').call(doc) == 'on')
				return true;

			var win = Components.lookupMethod(doc, 'defaultView').call(doc);;
			var editingSession = win.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
								.getInterface(Components.interfaces.nsIWebNavigation)
								.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
								.getInterface(Components.interfaces.nsIEditingSession);
			if (editingSession.windowIsEditable(win)) return true;
		}
		catch(e) {
		}

		try { // in rich-textarea (ex. Gmail)
			var doc = Components.lookupMethod(aEvent.originalTarget, 'ownerDocument').call(aEvent.originalTarget);
			if (Components.lookupMethod(doc, 'designMode').call(doc) == 'on')
				return true;
		}
		catch(e) {
		}

		return /^(input|textarea|textbox|select|isindex|object|embed)$/i.test(aEvent.originalTarget.localName);
	},
 
	isEventFiredInFindableDocument : function(aEvent) 
	{
		var doc = Components.lookupMethod(aEvent.originalTarget, 'ownerDocument').call(aEvent.originalTarget);
		var contentType = Components.lookupMethod(doc, 'contentType').call(doc);
		return /^text\/|\+xml$|^application\/((x-)?javascript|xml)$/.test(contentType);
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
  
	goDicManager : function() 
	{
		var uri = 'chrome://xulmigemo/content/dicManager/dicManager.xul';
		var targets = this.WindowManager.getEnumerator('xulmigemo:dictionaryManager', true),
			target;
		while (targets.hasMoreElements())
		{
			target = targets.getNext().QueryInterface(Components.interfaces.nsIDOMWindowInternal);
			if (target.location.href == uri) {
				target.focus();
				return;
			}
		}

		window.openDialog(
			uri,
			'XMigemoDicManager',
			'chrome,all,dependent'
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
			const UConvIF  = Components.interfaces.nsIScriptableUnicodeConverter;
			const UConv = Components.classes[UConvID].getService(UConvIF);
			// UTF-8 から Shift_JIS に変換する
			UConv.charset = 'Shift_JIS';
			sjis_str = UConv.ConvertFromUnicode(str);
			//日本語がうまく出ない！なぜだ！神ハワレヲ見捨テタモウタカ
			dump(sjis_str+"\n");
			return;
		}else{
			return;
		}
	},
  
	dummy : null
}; 
  
function XMigemoStringBundle(aStringBundle) 
{
	this.strbundle = this.stringBundleService.createBundle(aStringBundle);
}
XMigemoStringBundle.prototype = {
	get stringBundleService()
	{
		if (!this._stringBundleService) {
			this._stringBundleService = Components.classes['@mozilla.org/intl/stringbundle;1'].getService(Components.interfaces.nsIStringBundleService);
		}
		return this._stringBundleService;
	},
	_stringBundleService : null,
	strbundle : null,
	getString : function(aKey) {
		try {
			return this.strbundle.GetStringFromName(aKey);
		}
		catch(e) {
		}
		return '';
	}
};
 
