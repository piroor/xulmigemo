var Prefs = Components 
			.classes['@mozilla.org/preferences;1']
			.getService(Components.interfaces.nsIPrefBranch);
 
function pXMigemoTextUtils() {} 

pXMigemoTextUtils.prototype = {
	get contractID() {
		return '@piro.sakura.ne.jp/xmigemo/text-utility;1';
	},
	get classDescription() {
		return 'This is a text utility service for XUL/Migemo.';
	},
	get classID() {
		return Components.ID('{71715174-1dd4-11dc-8314-0800200c9a66}');
	},

	get wrappedJSObject() {
		return this;
	},
	 
/* string operations */ 
	 
	trim : function(aInput) 
	{
		return aInput
				.replace(this.kTRIM_PATTERN, '');
	},
	kTRIM_PATTERN : /^\s+|\s+$/g,
 	
	brushUpTerms : function(aTerms) 
	{
		return aTerms
				.sort()
				.join('\n')
				.toLowerCase()
				.replace(this.kBRUSH_UP_PATTERN, '$1')
				.split('\n');
	},
	kBRUSH_UP_PATTERN : /^(.+)(\n\1$)+/gim,
  
/* convert HTML to text */ 
	
	range2Text : function(aRange) 
	{
		var doc = aRange.startContainer;
		if (doc.ownerDocument) doc = doc.ownerDocument;

		if (Prefs.getBoolPref('javascript.enabled')) {
			var noscript = doc.getElementsByTagName('noscript');
			var trash = doc.createRange();
			Array.prototype.slice.call(noscript).forEach(function(aNode) {
				trash.selectNode(aNode);
				trash.deleteContents();
			});
			trash.detach();
		}

		var result = [];

		var textRange = doc.createRange();
		textRange.setStart(aRange.startContainer, aRange.startOffset);
		var nodeRange = doc.createRange();

		try {
			var specialNodes = doc.evaluate(
					[
						'descendant-or-self::*[local-name()="BODY" or local-name()="body"]/',
						'descendant::*[',
							'contains(" SCRIPT script TEXTAREA textarea textbox ", concat(" ", local-name(), " ")) or ',
							'((local-name()="INPUT" or local-name()="input") and contains("TEXT text FILE file", @type))',
						']'
					].join(''),
					aRange.commonAncestorContainer,
					null,
					Components.interfaces.nsIDOMXPathResult.ORDERED_NODE_ITERATOR_TYPE,
					null
				);

			var node;
			while (node = specialNodes.iterateNext())
			{
				nodeRange.selectNode(node);
				if (aRange.compareBoundaryPoints(aRange.START_TO_START, nodeRange) != -1 ||
					nodeRange.compareBoundaryPoints(aRange.END_TO_END, aRange) != -1)
					continue;

				textRange.setEndBefore(node);
				result.push(textRange.toString());
				switch (node.localName.toLowerCase())
				{
					case 'script':
						break;
					default:
						result.push(node.value);
						break;
				}
				textRange.selectNode(node);
				textRange.collapse(false);
				//textRange.setStartAfter(node);なぜかエラーが出る
			}
		}
		catch(e) {
		}

		textRange.setEnd(aRange.endContainer, aRange.endOffset);
		result.push(textRange.toString());

		nodeRange.detach();
		textRange.detach();

		return result.join('');
	},
  
/* manipulate regular expressions */ 
	 
	sanitize : function(str) 
	{
		//	[]^.+*?$|{}\(),  正規表現のメタキャラクタをエスケープ
		str = str.replace(this.kSANITIZE_PATTERN, "\\$1");
		return str;
	},
	kSANITIZE_PATTERN : /([\-\:\}\{\|\$\?\*\+\.\^\]\/\[\;\\\(\)])/g,
 
	sanitize2 : function(str) 
	{
		//	^.+*?${}\,
		str = str.replace(this.kSANITIZE2_PATTERN, "\\$1");
		return str;
	},
	kSANITIZE2_PATTERN : /([\-\:\}\{\$\?\*\+\.\^\/\;\\])/g,
 
	extractRegExpSource : function(aInput) 
	{
		return this.kREGEXP_PATTERN.test(aInput) ?
			RegExp.$1 :
			aInput ;
	},
	
	isRegExp : function(aInput) 
	{
		return this.kREGEXP_PATTERN.test(aInput);
	},
 
	kREGEXP_PATTERN : /^\/((?:\\.|\[(?:\\.|[^\]])*\]|[^\/])+)\/([gimy]*)$/, 
	// old version: /^\/((?:\\.|[^\/])+)\/[gimy]*$/
	// see http://nanto.asablo.jp/blog/2008/05/22/3535735
  
	getMatchedTermsFromSource : function(aRegExp, aSource) 
	{
		var regexp;
		if (this.isRegExp(aRegExp)) {
			var source = this.extractRegExpSource(aRegExp);
			var flags = aRegExp.match(/[^\/]+$/);
			if (flags && flags.indexOf('g') < 0)
				flags += 'g';
			regexp = new RegExp(source, flags || 'gim');
		}
		else {
			regexp = new RegExp(aRegExp, 'gim');
		}
		var result = (aSource || '').match(regexp) || [];
		return this.brushUpTerms(result);
	},
 
	getORFindRegExpFromTerms : function(aTerms) 
	{
		switch (aTerms.length)
		{
			case 0:
				return '';
			case 1:
				return aTerms[0];
			default:
				break;
		}
		return '(?:'+aTerms.join(')|(?:')+')';
	},
 
	getANDFindRegExpFromTerms : function(aTerms) 
	{
		if (!this.db) return '';

		switch (aTerms.length)
		{
			case 0:
				return '';
			case 1:
				return aTerms[0];
			case 2:
				return '(?:'+aTerms[0]+').*(?:'+aTerms[1]+')|'+
					'(?:'+aTerms[1]+').*(?:'+aTerms[0]+')';
			default:
				break;
		}

		var tableName = 'temp'+parseInt(Math.random() * 65000);
		this.db.executeSimpleSQL('CREATE TEMP TABLE '+tableName+' (term TEXT)');

		try {
			var self = this;
			aTerms.forEach(function(aTerm, aIndex) {
				var statement = self.db.createStatement('INSERT INTO '+tableName+' (term) VALUES (?1)');
				try {
					statement.bindStringParameter(0, aTerm);
					while (statement.executeStep()) {};
				}
				finally {
					statement.reset();
				}
			});
	/*
		SELECT GROUP_CONCAT(
		         '(?:' || term0 || ').*(?:' ||
		                  term1 || ').*(?:' ||
		                  term2 || ').*(?:' ||
		                  term3 || ')',
		         '|'
		       )
		  FROM (SELECT v0.term term0,
		               v1.term term1,
		               v2.term term2,
		               v3.term term3
		          FROM temp v0, temp v1, temp v2, temp v3
		         WHERE term0 NOT IN (term1, term2, term3)
		               AND term1 NOT IN (term0, term2, term3)
		               AND term2 NOT IN (term0, term1, term3)
		               AND term3 NOT IN (term0, term1, term2))
	*/
			var fieldNames = aTerms.map(function(aTerm, aIndex) {
					return 'term'+aIndex;
				});

			var statement = this.db.createStatement(
					'SELECT GROUP_CONCAT("(?:" || '+
						fieldNames.join(' || ").*(?:" || ')+
						' || ")", "|") '+
					'FROM (SELECT '+
						aTerms.map(function(aTerm, aIndex) {
							return 'v'+aIndex+'.term term'+aIndex;
						}).join(', ')+
						' FROM '+
						aTerms.map(function(aTerm, aIndex) {
							return tableName+' v'+aIndex;
						}).join(', ')+
						' WHERE '+
						aTerms.map(function(aTerm, aIndex) {
							return 'term'+aIndex+' NOT IN ('+
								fieldNames.filter(function(aTerm, aRejectIndex) {
									return aRejectIndex != aIndex;
								}).join(', ')+
								')';
						}).join(' AND ')+
						')'
				);
			var result = ''
			try {
				while (statement.executeStep())
				{
					result = statement.getString(0);
				}
			}
			finally {
				statement.reset();
			}
		}
		finally {
			this.db.executeSimpleSQL('DROP TABLE '+tableName);
		}

		return result;
	},
	
	get db() 
	{
		if (this._db)
			return this._db;

		const DirectoryService = Components
			.classes['@mozilla.org/file/directory_service;1']
			.getService(Components.interfaces.nsIProperties);
		var file = DirectoryService.get('ProfD', Components.interfaces.nsIFile);
		file.append('xulmigemo.sqlite');

		const StorageService = Components
			.classes['@mozilla.org/storage/service;1']
			.getService(Components.interfaces.mozIStorageService);
		this._db = StorageService.openDatabase(file);

		return this._db;
	},
//	_db : null,
  
	// obsolete (from 0.8.0)
	reverseRegExp : function(aExp) 
	{
		var tmp = aExp;
		tmp = tmp.replace(/\[\]\|/im,"")
				.replace(/(\([^\)]+\))\?/g, '[[OPERATOR-QUESTION]]$1') // for multiple terms
				.replace(/(\[[^\]]+\])\+/g, '[[OPERATOR-PLUS]]$1') // for multiple terms
				.replace(/(\[[^\]]+\])\*/g, '[[OPERATOR-STAR]]$1') // for multiple terms
				.replace(/(.)\?/g, '[[OPERATOR-QUESTION]]$1')
				.replace(/(.)\+/g, '[[OPERATOR-PLUS]]$1')
				.replace(/(.)\*/g, '[[OPERATOR-STAR]]$1')
				.replace(/\(/g,"[[OPERATOR-OPEN-PAREN]]")
				.replace(/\{/g,"[[OPERATOR-OPEN-BLANKET]]")
				.replace(/\}/g,"{")
				.replace(/\)/g,"(")
				.replace(/\[\[OPERATOR-OPEN-BLANKET\]\]/g,"}")
				.replace(/\[\[OPERATOR-OPEN-PAREN\]\]/g,")")
				.replace(/\[\[OPERATOR-QUESTION\]\]/g,"?")
				.replace(/\[\[OPERATOR-PLUS\]\]/g,"+")
				.replace(/\[\[OPERATOR-STAR\]\]/g,"*");
		tmp = tmp.replace(/\[([^\[]+?)\]/img,"\]$1\[").split("").reverse().join("")
		tmp = tmp.replace(/(.)\\/g,"\\$1");
		return tmp;
	},
  
/* Restore selection after "highlight all" */ 
	
	getFoundRange : function(aFrame) 
	{
		try {
			var docShell = aFrame
				.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
				.getInterface(Components.interfaces.nsIWebNavigation)
				.QueryInterface(Components.interfaces.nsIDocShell);
			var selCon = docShell
				.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
				.getInterface(Components.interfaces.nsISelectionDisplay)
				.QueryInterface(Components.interfaces.nsISelectionController);
			if (selCon.getDisplaySelection() == selCon.SELECTION_ATTENTION) {
				var sel = aFrame.getSelection();
				if (!sel.rangeCount && aFrame.document.foundEditable) {
					selCon = aFrame.document.foundEditable
							.QueryInterface(Components.interfaces.nsIDOMNSEditableElement)
							.editor.selectionController;
					sel = selCon.getSelection(selCon.SELECTION_NORMAL);
				}
				if (sel && sel.rangeCount)
					return sel.getRangeAt(0);
			}
		}
		catch(e) {
		}
		return null;
	},
 
	isRangeOverlap : function(aBaseRange, aTargetRange) 
	{
		if (
			!aBaseRange ||
			!aTargetRange ||
			aBaseRange.startContainer.ownerDocument != aTargetRange.startContainer.ownerDocument
			)
			return false;

		try {
			return (
				aBaseRange.compareBoundaryPoints(aBaseRange.START_TO_START, aTargetRange) >= 0 &&
				aBaseRange.compareBoundaryPoints(aBaseRange.END_TO_END, aTargetRange) <= 0
			) || (
				aTargetRange.compareBoundaryPoints(aBaseRange.START_TO_START, aBaseRange) >= 0 &&
				aTargetRange.compareBoundaryPoints(aBaseRange.END_TO_END, aBaseRange) <= 0
			);
		}
		catch(e) {
		}
		return false;
	},
 
	delayedSelect : function(aNode, aSelectLength, aIsHighlight) 
	{
		/*
			現在の選択範囲の始点が、normalize()後のテキストノードの中で
			何文字目になるかを求める
		*/
		var startNodeInfo = this.countPreviousText(aNode.previousSibling);
		var startOffset = startNodeInfo.count;

		/*
			normalize()後のテキストノードが、親ノードの何番目の子ノードに
			なるかを求める（強調表示が無い状態を想定）
		*/
		var childCount = 0;
		this.countPreviousText(aNode);
		while (startNodeInfo.lastNode && startNodeInfo.lastNode.previousSibling)
		{
			startNodeInfo = this.countPreviousText(startNodeInfo.lastNode.previousSibling);
			childCount++;
		}

		if (startOffset || childCount || this.countNextText(aNode).lastNode != aNode) {
			// normalize()によって選択範囲の始点・終点が変わる場合
			if (this.delayedSelectTimer) {
				this.delayedSelectTimer.cancel();
				this.delayedSelectTimer = null;
			}
			this.delayedSelectTimer = Components
				.classes['@mozilla.org/timer;1']
				.createInstance(Components.interfaces.nsITimer);
	        this.delayedSelectTimer.init(
				this.createDelayedSelectObserver(aNode.parentNode, startOffset, childCount, aSelectLength, aIsHighlight),
				1,
				Components.interfaces.nsITimer.TYPE_ONE_SHOT
			);
		}
		else {
			var doc = aNode.ownerDocument;
			var selectRange = doc.createRange();
			if (aNode.nodeType == aNode.ELEMENT_NODE) {
				selectRange.selectNodeContents(aNode);
			}
			else if (aSelectLength) {
				selectRange.setStart(aNode, 0);
				var endNode = aNode;
				var offset = aSelectLength;
				while (endNode.textContent.length < offset)
				{
					offset -= endNode.textContent.length;
					node = this.getNextTextNode(endNode);
					if (!node) break;
					endNode = node;
				}
				selectRange.setEnd(endNode, offset);
			}
			else {
				selectRange.selectNode(aNode);
			}
			var sel = doc.defaultView.getSelection();
			sel.removeAllRanges();
			sel.addRange(selectRange);
			this.setSelectionLook(doc, aIsHighlight);
		}
	},
	
	delayedSelectTimer : null, 
 
	// ノードの再構築が終わった後で選択範囲を復元する
	createDelayedSelectObserver : function(aStartParent, aStartOffset, aChildCount, aSelectLength, aIsHighlight) 
	{
		return ({
			owner       : this,
			parent      : aStartParent,
			startOffset : aStartOffset,
			childCount  : aChildCount,
			length      : aSelectLength,
			highlight   : aIsHighlight,
			observe     : function(aSubject, aTopic, aData)
			{
				if (aTopic != 'timer-callback') return;

				var doc = this.parent.ownerDocument;

				// 選択範囲の始点を含むテキストノードまで移動
				var startNode = this.parent.firstChild;
				var startNodeInfo;
				while (this.childCount--)
				{
					startNodeInfo = this.owner.countNextText(startNode);
					startNode = startNodeInfo.lastNode.nextSibling;
				}

				var node;
				var startOffset = this.startOffset;
				var selectRange = doc.createRange();
				if (startOffset) {
					// 始点の位置まで移動して、始点を設定
					while (startNode.textContent.length <= startOffset)
					{
						startOffset -= startNode.textContent.length;
						node = this.owner.getNextTextNode(startNode);
						if (!node) break;
						startNode = node;
					}
					selectRange.setStart(startNode, startOffset);
				}
				else {
					selectRange.setStartBefore(this.parent.firstChild);
				}

				var endNode = startNode;
				var offset = this.length;
				while (endNode.textContent.length <= offset)
				{
					offset -= endNode.textContent.length;
					node = this.owner.getNextTextNode(endNode);
					if (!node) break;
					endNode = node;
				}
				if (endNode == startNode) offset += startOffset;
				selectRange.setEnd(endNode, offset);

				var sel = doc.defaultView.getSelection();
				sel.removeAllRanges();
				sel.addRange(selectRange);
				this.owner.setSelectionLook(doc, this.highlight);

				this.owner.delayedSelectTimer.cancel();
				this.owner.delayedSelectTimer = null;
			}
		});
	},
 
	/* 
		強調表示の有る無しを無視して、終端にあるテキストノードと、
		そこまでの（normalize()によって結合されるであろう）テキストノードの
		長さの和を得る。
		強調表示用の要素は常にテキストノードの直上にしか現れ得ないので、
		「強調表示用の要素がある＝強調表示が解除されたらそこはテキストノードになる」
		と判断することができる。
	*/
	countPreviousText : function(aNode)
	{
		var count = 0;
		var node = aNode;
		while (this.isTextNodeOrHighlight(node))
		{
			aNode = node;
			count += aNode.textContent.length;
			var node = aNode.previousSibling;
			if (!node) break;
		}
		return { lastNode : aNode, count : count };
	},
 
	countNextText : function(aNode) 
	{
		var count = 0;
		var node = aNode;
		while (this.isTextNodeOrHighlight(node))
		{
			aNode = node;
			count += aNode.textContent.length;
			var node = aNode.nextSibling;
			if (!node) break;
		}
		return { lastNode : aNode, count : count };
	},
 
	isTextNodeOrHighlight : function(aNode) 
	{
		return aNode && (
				aNode.nodeType == aNode.TEXT_NODE ||
				(
					aNode.nodeType == aNode.ELEMENT_NODE &&
					(
						aNode.getAttribute('id') == '__firefox-findbar-search-id' ||
						aNode.getAttribute('class') == '__firefox-findbar-search'
					)
				)
			);
	},
 
	getNextTextNode : function(aNode) 
	{
		if (!aNode) return null;
		aNode = aNode.nextSibling || aNode.parentNode.nextSibling;
		if (!aNode) return null;
		if (aNode.nodeType != aNode.TEXT_NODE)
			aNode = aNode.firstChild;
		return !aNode ? null :
				aNode.nodeType == aNode.TEXT_NODE ? aNode :
				this.getNextTextNode(aNode);
	},
 
	setSelectionLook : function(aDocument, aChangeColor) 
	{
		var selCon;
		if (aDocument.foundEditable) {
			var editor = aDocument.foundEditable.QueryInterface(Components.interfaces.nsIDOMNSEditableElement).editor;
			selCon = editor.selectionController;

			if (aChangeColor) {
				selCon.setDisplaySelection(selCon.SELECTION_ATTENTION);
			}else{
				selCon.setDisplaySelection(selCon.SELECTION_ON);
			}
			try {
				selCon.repaintSelection(selCon.SELECTION_NORMAL);
			}
			catch(e) {
			}
		}

		var docShell = this.getDocShellForFrame(aDocument.defaultView);
		selCon = docShell
			.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
			.getInterface(Components.interfaces.nsISelectionDisplay)
			.QueryInterface(Components.interfaces.nsISelectionController);

		if (aChangeColor) {
			selCon.setDisplaySelection(selCon.SELECTION_ATTENTION);
		}else{
			selCon.setDisplaySelection(selCon.SELECTION_ON);
		}
		try {
			selCon.repaintSelection(selCon.SELECTION_NORMAL);
		}
		catch(e) {
		}
	},
	getDocShellForFrame : function(aFrame)
	{
		return aFrame
				.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
				.getInterface(Components.interfaces.nsIWebNavigation)
				.QueryInterface(Components.interfaces.nsIDocShell);
	},
   
	QueryInterface : function(aIID) 
	{
		if(!aIID.equals(Components.interfaces.pIXMigemoTextUtils) &&
			!aIID.equals(Components.interfaces.nsISupports))
			throw Components.results.NS_ERROR_NO_INTERFACE;
		return this;
	}
};
  
var gModule = { 
	_firstTime: true,

	registerSelf : function (aComponentManager, aFileSpec, aLocation, aType)
	{
		if (this._firstTime) {
			this._firstTime = false;
			throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;
		}
		aComponentManager = aComponentManager.QueryInterface(Components.interfaces.nsIComponentRegistrar);
		for (var key in this._objects) {
			var obj = this._objects[key];
			aComponentManager.registerFactoryLocation(obj.CID, obj.className, obj.contractID, aFileSpec, aLocation, aType);
		}
	},

	getClassObject : function (aComponentManager, aCID, aIID)
	{
		if (!aIID.equals(Components.interfaces.nsIFactory))
			throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

		for (var key in this._objects) {
			if (aCID.equals(this._objects[key].CID))
				return this._objects[key].factory;
		}

		throw Components.results.NS_ERROR_NO_INTERFACE;
	},

	_objects : {
		manager : {
			CID        : pXMigemoTextUtils.prototype.classID,
			contractID : pXMigemoTextUtils.prototype.contractID,
			className  : pXMigemoTextUtils.prototype.classDescription,
			factory    : {
				createInstance : function (aOuter, aIID)
				{
					if (aOuter != null)
						throw Components.results.NS_ERROR_NO_AGGREGATION;
					return (new pXMigemoTextUtils()).QueryInterface(aIID);
				}
			}
		}
	},

	canUnload : function (aComponentManager)
	{
		return true;
	}
};

function NSGetModule(compMgr, fileSpec)
{
	return gModule;
}
 
