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
	 
/* convert HTML to text */ 
	
	range2Text : function(aRange) 
	{
		var doc = aRange.startContainer.ownerDocument;

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
							'contains(" SCRIPT TEXTAREA SELECT script textarea select textbox ", concat(" ", local-name(), " ")) or ',
							'(contains(" INPUT input ", concat(" ", local-name(), " ")) and contains("TEXT text", @type))',
						']'
					].join(''),
					aRange.commonAncestorContainer,
					null,
					XPathResult.ORDERED_NODE_ITERATOR_TYPE,
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
				if (node.localName.toLowerCase() != 'script') {
					result.push(node.value);
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
 
/* 
	body2text : function()
	{
		var scrs = document.getElementsByTagName("script");
		var tmp=document.createRange();
		var str="";
		tmp.setStartBefore(document.body);
		for(var i=0;i<scrs.length;i++){
			if(scrs[i].parentNode.tagName.toUpperCase()=="HEAD"){continue;}
			tmp.setEndBefore(scrs[i]);
			str+=tmp.toString();
			tmp.selectNode(scrs[i]);
			tmp.collapse(false);
			//tmp.setStartAfter(scrs[i]);なぜかエラーが出る
		}
		tmp.setEndAfter(document.body);
		str+=tmp.toString();
		return str;
		//alert(str);
	},
*/
 
/* 
	//htmlToText(by flyson)
	htmlToText : function(aStr)
	{
	    var formatConverter = Components.classes["@mozilla.org/widget/htmlformatconverter;1"]
	                                .createInstance(Components.interfaces.nsIFormatConverter);
	    var fromStr = Components.classes["@mozilla.org/supports-string;1"]
	                                .createInstance(Components.interfaces.nsISupportsString);
	    fromStr.data = aStr;
	    var toStr = { value: null };

	    formatConverter.convert("text/html", fromStr, fromStr.toString().length,
	                            "text/unicode", toStr, {});
	    toStr = toStr.value.QueryInterface(Components.interfaces.nsISupportsString);
	    toStr = toStr.toString();
	    return toStr;
	},
*/
 
/* 
	htmlToPureText : function(aStr)
	{
	},
*/
  
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
 
	kREGEXP_PATTERN : /^\/((?:\\.|[^\/])+)\/[gimy]*$/,
 
	isRegExp : function(aInput) 
	{
		return this.kREGEXP_PATTERN.test(aInput);
	},
 
	extractRegExpSource : function(aInput) 
	{
		return this.kREGEXP_PATTERN.test(aInput) ?
			RegExp.$1 :
			aInput ;
	},
 
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
				sel = selCon.getSelection(selCon.SELECTION_ATTENTION);
			}
			if (sel && sel.rangeCount)
				return sel.getRangeAt(0);
		}
		return null;
	},
 
	isRangeOverlap : function(aBaseRange, aTargetRange) 
	{
		if (!aBaseRange || !aTargetRange) return false;

		return (
			aBaseRange.compareBoundaryPoints(aBaseRange.START_TO_START, aTargetRange) >= 0 &&
			aBaseRange.compareBoundaryPoints(aBaseRange.END_TO_END, aTargetRange) <= 0
		) || (
			aTargetRange.compareBoundaryPoints(aBaseRange.START_TO_START, aBaseRange) >= 0 &&
			aTargetRange.compareBoundaryPoints(aBaseRange.END_TO_END, aBaseRange) <= 0
		);
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
 
