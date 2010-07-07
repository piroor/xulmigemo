var TEST = false; 
const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');

var timer = {};

const Prefs = Cc['@mozilla.org/preferences;1']
			.getService(Ci.nsIPrefBranch);
 
function xmXMigemoTextUtils() { 

	var excludeNodesCondition = 'contains(" SCRIPT script TEXTAREA textarea textbox ", concat(" ", local-name(), " "))';
	this._lazyExceptionsExpression = [
			'descendant::*[',
				excludeNodesCondition,
				' or ',
				'((local-name()="INPUT" or local-name()="input") and contains("TEXT text FILE file", @type))',
			']'
		].join('');
	this._exceptionsExpression = this._lazyExceptionsExpression + ' | '+[
			'descendant::text()[',
				'normalize-space()',
				' and ',
				'not(ancestor::*['+excludeNodesCondition+'])',
			']'
		].join('');

}

xmXMigemoTextUtils.prototype = {
	contractID : '@piro.sakura.ne.jp/xmigemo/text-utility;1',
	classDescription : 'xmXMigemoTextUtils',
	classID : Components.ID('{71715174-1dd4-11dc-8314-0800200c9a66}'),

	QueryInterface : XPCOMUtils.generateQI([
		Ci.xmIXMigemoTextUtils,
		Ci.pIXMigemoTextUtils
	]),

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
		return Array.slice(aTerms || [])
				.sort()
				.join('\n')
				.toLowerCase()
				.replace(this.kBRUSH_UP_PATTERN, '$1')
				.split('\n');
	},
	kBRUSH_UP_PATTERN : /^(.+)(\n\1$)+/gim,
	brushUpTermsWithCase : function(aTerms)
	{
		return Array.slice(aTerms || [])
				.sort()
				.join('\n')
				.replace(this.kBRUSH_UP_PATTERN_CASE_SENSITIVE, '$1')
				.split('\n');
	},
	kBRUSH_UP_PATTERN_CASE_SENSITIVE : /^(.+)(\n\1$)+/gm,
 
	splitByBoundaries : function(aString) 
	{
		var parts = aString.split(/\b/);
		var result = [];
		parts.forEach(function(aPart) {
			var matched = aPart.match(this.kBOUNDARY_SPLITTER_PATTERN);
			if (matched)
				result = result.concat(matched);
			else
				result.push(aPart);
		}, this);
		result = result.filter(function(aPart) {
			return this.trim(aPart);
		}, this);
		return result.length ? result : parts ;
	},
	// http://ablog.seesaa.net/article/20969848.html
	kBOUNDARY_SPLITTER_PATTERN : /[\u4e00-\u9fa0\u3005\u3006\u30f5\u30f6]+|[\u3041-\u3093]+|[\u30a1-\u30f4\u30fc]+|[a-zA-Z0-9]+|[\uff41-\uff5a\uff21-\uff3a\uff10-\uff19]+|[\u3001\u3002\uff01!\uff1f?()\uff08\uff09\u300c\u300d\u300e\u300f]+|\n/gim,
  
/* convert HTML to text */ 
	
	range2Text : function(aRange) 
	{
		return this.range2TextInternal(aRange, false);
	},
 
	lazyRange2Text : function(aRange) 
	{
		return this.range2TextInternal(aRange, true);
	},
 
	range2TextInternal : function(aRange, aLazy) 
	{
		aRange.QueryInterface(Ci.nsIDOMRange);
		var doc = aRange.startContainer;
		if (doc.ownerDocument) doc = doc.ownerDocument;

		var encoder = null;
		if ('SkipInvisibleContent' in Ci.nsIDocumentEncoder) { // Firefox 4.0-
			encoder = Cc['@mozilla.org/layout/documentEncoder;1?type=text/plain']
						.createInstance(Ci.nsIDocumentEncoder);
			encoder.init(
				doc,
				'text/plain',
				Ci.nsIDocumentEncoder.OutputBodyOnly |
				Ci.nsIDocumentEncoder.OutputLFLineBreak |
				Ci.nsIDocumentEncoder.SkipInvisibleContent
			);
		}

		if (Prefs.getBoolPref('javascript.enabled')) {
			var noscript = doc.getElementsByTagName('noscript');
			var trash = doc.createRange();
			Array.slice(noscript).forEach(function(aNode) {
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
			var nodes = doc.evaluate(
					(aLazy || encoder ? this._lazyExceptionsExpression : this._exceptionsExpression ),
					aRange.commonAncestorContainer,
					null,
					Ci.nsIDOMXPathResult.ORDERED_NODE_ITERATOR_TYPE,
					null
				);
			var node;
			var found = false;
			var selCon = aLazy || encoder ? null : this.getSelectionController(doc.defaultView) ;
			while (node = nodes.iterateNext())
			{
				nodeRange.selectNode(node);
				if (aRange.compareBoundaryPoints(aRange.START_TO_START, nodeRange) == 1 ||
					nodeRange.compareBoundaryPoints(aRange.END_TO_END, aRange) == 1) {
					if (!found)
						continue;
					else
						break;
				}
				textRange.setEndBefore(node);
				if (encoder) {
					encoder.setRange(textRange);
					result.push(encoder.encodeToString());
				}
				else {
					result.push(textRange.toString());
				}
				if (node.nodeType == node.TEXT_NODE) {
					if (selCon.checkVisibility(node, 0, node.nodeValue.length))
						result.push(node.nodeValue);
				}
				else {
					switch (node.localName.toLowerCase())
					{
						case 'textarea':
						case 'input':
						case 'textbox':
							result.push(node.value);
						default:
							break;
					}
				}
				textRange.selectNode(node);
				textRange.collapse(false);
				//textRange.setStartAfter(node);なぜかエラーが出る
				found = true;
			}
		}
		catch(e) {
		}

		textRange.setEnd(aRange.endContainer, aRange.endOffset);
		if (encoder) {
			encoder.setRange(textRange);
			result.push(encoder.encodeToString());
		}
		else {
			result.push(textRange.toString());
		}

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
 
	sanitizeForTransformInput : function(str) 
	{
		//	()[]|\,
		str = str.replace(this.kSANITIZE_PATTERN_INPUT, "\\$1");
		return str;
	},
	kSANITIZE_PATTERN_INPUT : /([\(\)\[\]\|\\])/g,
 
	sanitizeForTransformOutput : function(str) 
	{
		//	^.+*?${},
		str = str.replace(this.kSANITIZE_PATTERN_OUTPUT, "\\$1");
		return str;
	},
	kSANITIZE_PATTERN_OUTPUT : /([\-\:\}\{\$\?\*\+\.\^\/\;])/g,
 
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
		var flags = '';
		if (this.isRegExp(aRegExp)) {
			var source = this.extractRegExpSource(aRegExp);
			flags = aRegExp.match(/[^\/]+$/);
			if (flags && flags.indexOf('g') < 0)
				flags += 'g';
			regexp = new RegExp(source, flags || 'gim');
		}
		else {
			regexp = new RegExp(aRegExp, 'gim');
		}
		var result = (aSource || '').match(regexp) || [];
		return flags.indexOf('i') < 0 ?
				this.brushUpTermsWithCase(result) :
				this.brushUpTerms(result) ;
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
			var statement = this.db.createStatement('INSERT INTO '+tableName+' (term) VALUES (?1)');
			aTerms.forEach(function(aTerm, aIndex) {
				try {
					statement.bindStringParameter(0, aTerm);
					while (statement.executeStep()) {};
				}
				finally {
					statement.reset();
				}
			});
			if ('finalize' in statement) statement.finalize();

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

			statement = this.db.createStatement(
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
				if ('finalize' in statement) statement.finalize();
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

		const DirectoryService = Cc['@mozilla.org/file/directory_service;1']
			.getService(Ci.nsIProperties);
		var file = DirectoryService.get('ProfD', Ci.nsIFile);
		file.append('xulmigemo.sqlite');

		const StorageService = Cc['@mozilla.org/storage/service;1']
			.getService(Ci.mozIStorageService);
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
  
	setSelectionLook : function(aDocument, aChangeColor) 
	{
		aDocument.QueryInterface(Ci.nsIDOMDocument);
		var range = this.getFoundRange(aDocument.defaultView);
		if (range) this.setSelectionLookForRange(range, aChangeColor);
		this.setSelectionLookForDocument(aDocument, aChangeColor);
	},
	
	setSelectionLookInternal : function(aSelCon, aChangeColor) 
	{
		try {
			if (aChangeColor)
				aSelCon.setDisplaySelection(aSelCon.SELECTION_ATTENTION);
			else
				aSelCon.setDisplaySelection(aSelCon.SELECTION_ON);
		}
		catch(e) {
		}
		try {
			aSelCon.repaintSelection(aSelCon.SELECTION_NORMAL);
		}
		catch(e) {
		}
	},
 
	setSelectionLookForDocument : function(aDocument, aChangeColor) 
	{
		aDocument.QueryInterface(Ci.nsIDOMDocument);
		this.setSelectionLookInternal(this.getSelectionController(aDocument.defaultView), aChangeColor);
	},
 
	setSelectionLookForNode : function(aNode, aChangeColor) 
	{
		aNode.QueryInterface(Ci.nsIDOMNode);
		try {
			var editor;
			var node = aNode;
			while (node)
			{
				if (editor instanceof this.nsIDOMNSEditableElement) {
					editor = node;
					break;
				}
				node = node.parentNode;
			}
			if (editor) {
				this.setSelectionLookInternal(this.getSelectionController(editor), aChangeColor);
				return;
			}
		}
		catch(e) {
		}
		this.setSelectionLookForDocument(aNode.ownerDocument || aNode, aChangeColor);
	},
	nsIDOMNSEditableElement : Ci.nsIDOMNSEditableElement,
 
	setSelectionLookForRange : function(aRange, aChangeColor) 
	{
		aRange.QueryInterface(Ci.nsIDOMRange);
		this.setSelectionLookForNode(aRange.startContainer, aChangeColor);
	},
  
/* Restore selection after "highlight all" */ 
	
	getFoundRange : function(aFrame) 
	{
		if (!aFrame) return null;
		aFrame.QueryInterface(Ci.nsIDOMWindow);
		try {
			var selCon = this.getSelectionController(aFrame);
			if (selCon.getDisplaySelection() == selCon.SELECTION_ATTENTION) {
				var sel = aFrame.getSelection();
				if (!sel.rangeCount && aFrame.document.foundEditable) {
					selCon = this.getSelectionController(aFrame.document.foundEditable);
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
	getSelectionController : function(aTarget)
	{
		if (!aTarget) return null;

		const nsIDOMNSEditableElement = Ci.nsIDOMNSEditableElement;
		const nsIDOMWindow = Ci.nsIDOMWindow;
		try {
			return (aTarget instanceof nsIDOMNSEditableElement) ?
						aTarget.QueryInterface(nsIDOMNSEditableElement)
							.editor
							.selectionController :
					(aTarget instanceof nsIDOMWindow) ?
						this.getDocShellFromFrame(aTarget)
							.QueryInterface(Ci.nsIInterfaceRequestor)
							.getInterface(Ci.nsISelectionDisplay)
							.QueryInterface(Ci.nsISelectionController) :
					null;
		}
		catch(e) {
		}
		return null;
	},
	getDocShellFromFrame : function(aFrame)
	{
		return aFrame
				.QueryInterface(Ci.nsIInterfaceRequestor)
				.getInterface(Ci.nsIWebNavigation)
				.QueryInterface(Ci.nsIDocShell);
	},
 
	isRangeOverlap : function(aBaseRange, aTargetRange) 
	{
		if (!aBaseRange || !aTargetRange)
			return false;

		aBaseRange.QueryInterface(Ci.nsIDOMRange);
		aTargetRange.QueryInterface(Ci.nsIDOMRange);
		if ((aBaseRange.startContainer.ownerDocument || aBaseRange.startContainer) != (aTargetRange.startContainer.ownerDocument || aTargetRange.startContainer))
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
 
	// for sorting
	compareRangePosition : function(aBaseRange, aTargetRange) 
	{
		if (!aBaseRange || !aTargetRange)
			return 0;

		aBaseRange.QueryInterface(Ci.nsIDOMRange);
		aTargetRange.QueryInterface(Ci.nsIDOMRange);
		if ((aBaseRange.startContainer.ownerDocument || aBaseRange.startContainer) != (aTargetRange.startContainer.ownerDocument || aTargetRange.startContainer))
			return 0;

		try {
			if (aBaseRange.compareBoundaryPoints(aBaseRange.START_TO_END, aTargetRange) < 0) {
				return -1;
			}
			else if (aBaseRange.compareBoundaryPoints(aBaseRange.END_TO_START, aTargetRange) > 0) {
				return 1;
			}
		}
		catch(e) {
		}
		return 0;
	},
 
	delayedSelect : function(aNode, aSelectLength, aIsHighlight) 
	{
		aNode.QueryInterface(Ci.nsIDOMNode);

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

		var parent = (aNode.nodeType == aNode.ELEMENT_NODE && !this.isTextNodeOrHighlight(aNode)) ? aNode : aNode.parentNode ;
		if (startOffset || childCount || this.countNextText(aNode).lastNode != aNode) {
			// normalize()によって選択範囲の始点・終点が変わる場合は
			// ノードの再構築が終わった後で選択範囲を復元する
			var range = aNode.ownerDocument.createRange();
			range.selectNodeContents(aNode);
			range.collapse(true);
			range.setStartBefore(parent.firstChild);
			startOffset = range.toString().length;
			range.detach();
			this.selectContentWithDelay(parent, startOffset, aSelectLength, aIsHighlight);
		}
		else {
			this.selectContent(
				parent,
				0,
				(aSelectLength || aNode.textContent.length),
				aIsHighlight
			);
		}
	},
	
	selectContent : function(aParent, aStartOffset, aLength, aHighlight) 
	{
		aParent.QueryInterface(Ci.nsIDOMNode);

		var doc = aParent.ownerDocument;

		// 始点の位置まで移動して、始点を設定
		var node;
		var startNode = aParent.firstChild;
		if (startNode.nodeType != startNode.TEXT_NODE) startNode = this.getNextTextNode(startNode);
		var startOffset = aStartOffset;
		while (startOffset > 0 && startNode.textContent.length <= startOffset)
		{
			startOffset -= startNode.textContent.length;
			node = this.getNextTextNode(startNode);
			if (!node) break;
			startNode = node;
		}
		if (startOffset < 0) startOffset = startNode.textContent.length + startOffset;

		var selectRange = doc.createRange();
		selectRange.setStart(startNode, startOffset);

		var endNode = startNode;
		var offset = aLength;
		while (offset > 0 && endNode.textContent.length <= offset)
		{
			offset -= endNode.textContent.length;
			node = this.getNextTextNode(endNode);
			if (!node) break;
			endNode = node;
		}
		if (offset < 0) offset = endNode.textContent.length + offset;
		if (endNode == startNode) offset += startOffset;

		selectRange.setEnd(endNode, offset);

		var sel = doc.defaultView.getSelection();
		sel.removeAllRanges();
		sel.addRange(selectRange);

		if (aHighlight)
			this.setSelectionLookForRange(selectRange, true);
	},
	
	selectContentWithDelay : function(aParent, aStartOffset, aSelectLength, aIsHighlight) 
	{
		aParent.QueryInterface(Ci.nsIDOMNode);

		if (!('setTimeout' in timer))
			Components.utils.import('resource://xulmigemo-modules/jstimer.jsm', timer);

		if (this.selectContentWithDelayTimer)
			timer.clearTimeout(this.selectContentWithDelayTimer);

		this.selectContentWithDelayTimer = timer.setTimeout(function(aSelf) {
			aSelf.selectContent(aParent, aStartOffset, aSelectLength, aIsHighlight);
		}, 1, this);
	},
	selectContentWithDelayTimer : null,
  
	/* 
		強調表示の有る無しを無視して、終端にあるテキストノードと、
		そこまでの（normalize()によって結合されるであろう）テキストの
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
		var walker = aNode.ownerDocument.createTreeWalker(
				aNode.ownerDocument,
				Ci.nsIDOMNodeFilter.SHOW_TEXT,
				null,
				false
			);
		walker.currentNode = aNode;
		return walker.nextNode();
	}
   
}; 
  
if (XPCOMUtils.generateNSGetFactory) 
	var NSGetFactory = XPCOMUtils.generateNSGetFactory([xmXMigemoTextUtils]);
else
	var NSGetModule = XPCOMUtils.generateNSGetModule([xmXMigemoTextUtils]);
 
