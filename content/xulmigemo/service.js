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
					.getService(Components.interfaces.xmIXMigemoTextUtils);
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
			this._XULAppInfo = Components.classes['@mozilla.org/xre/app-info;1'].getService(Components.interfaces.nsIXULAppInfo);
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

		aList = this.TextUtils.trim(aList || '');
		if (aList)
			aList.split(/\s+/)
				.forEach(function(aPref) {
					aObserver.observe(null, 'nsPref:changed', aPref);
				});
	},
 
/* Shortcut Keys */ 
	
	parseShortcut : function(aShortcut) 
	{
		var accelKey = navigator.platform.toLowerCase().indexOf('mac') == 0 ? 'meta' : 'ctrl' ;
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
			var editingSession = win.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
								.getInterface(Components.interfaces.nsIWebNavigation)
								.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
								.getInterface(Components.interfaces.nsIEditingSession);
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
(function() {
	var namespace = {};
	Components.utils.import('resource://xulmigemo-modules/prefs.js', namespace);
	Components.utils.import('resource://xulmigemo-modules/namespace.jsm', namespace);
	XMigemoService.__proto__ = namespace.prefs;
	XMigemoService.namespace = namespace.getNamespaceFor('piro.sakura.ne.jp')['piro.sakura.ne.jp'];
	Components.utils.import('resource://xulmigemo-modules/animationManager.js');
	Components.utils.import('resource://xulmigemo-modules/stringBundle.js');
})();
  
