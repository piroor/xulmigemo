var TEST = false; 
const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');

const Prefs = Cc['@mozilla.org/preferences;1']
			.getService(Ci.nsIPrefBranch);

var timer = {};

var boxObjectModule = {};
function getBoxObjectFor(aNode)
{
	if ('getBoxObjectFor' in aNode.ownerDocument)
		return aNode.ownerDocument.getBoxObjectFor(aNode);

	if (!('boxObject' in boxObjectModule)) {
		Components.utils.import(
			'resource://xulmigemo-modules/boxObject.js',
			boxObjectModule
		);
	}
	return boxObjectModule
			.boxObject
			.getBoxObjectFor(aNode);
}
 
function xmXMigemoTextUtils() { 
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
				.replace(this.kMULTIPLE_BR_PATTERN, '\n')
				.split('\n');
	},
	kMULTIPLE_BR_PATTERN : /\n\n+/g,
	kBRUSH_UP_PATTERN : /^(.+)(\n\1$)+/gim,
	brushUpTermsWithCase : function(aTerms)
	{
		return Array.slice(aTerms || [])
				.sort()
				.join('\n')
				.replace(this.kBRUSH_UP_PATTERN_CASE_SENSITIVE, '$1')
				.replace(this.kMULTIPLE_BR_PATTERN, '\n')
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
		return this.range2TextInternal(aRange);
	},
 
	lazyRange2Text : function(aRange) // for backward compatibility... 
	{
		return this.range2TextInternal(aRange);
	},
 
	range2TextInternal : function(aRange) 
	{
		aRange.QueryInterface(Ci.nsIDOMRange);
		var doc = aRange.startContainer;
		if (doc.ownerDocument) doc = doc.ownerDocument;

		var encoder = Cc['@mozilla.org/layout/documentEncoder;1?type=text/plain']
						.createInstance(Ci.nsIDocumentEncoder);
		encoder.init(
			doc,
			'text/plain',
			Ci.nsIDocumentEncoder.OutputSelectionOnly |
			Ci.nsIDocumentEncoder.OutputBodyOnly |
			Ci.nsIDocumentEncoder.OutputLFLineBreak |
			Ci.nsIDocumentEncoder.SkipInvisibleContent
		);

		if (Prefs.getBoolPref('javascript.enabled')) {
			let noscript = doc.getElementsByTagName('noscript');
			let trash = doc.createRange();
			Array.slice(noscript).forEach(function(aNode) {
				trash.selectNode(aNode);
				trash.deleteContents();
			});
			trash.detach();
		}

		var result = [];

		var textRange = doc.createRange();
		var nodeRange = doc.createRange();

		if (aRange.startContainer == doc)
			textRange.setStartBefore(doc.body || doc.documentElement);
		else
			textRange.setStart(aRange.startContainer, aRange.startOffset);

		try {
			var nodes = doc.evaluate(
					this.kEXCEPTION_EXPRESSION,
					aRange.commonAncestorContainer,
					null,
					Ci.nsIDOMXPathResult.ORDERED_NODE_ITERATOR_TYPE,
					null
				);
			var node;
			var found = false;
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
				let string = textRange.toString();
				if (string) {
					encoder.setRange(textRange);
					result.push(encoder.encodeToString());
				}
				switch (node.localName.toLowerCase())
				{
					case 'textarea':
					case 'input':
					case 'textbox':
						result.push(node.value);
					default:
						break;
				}
				textRange.selectNode(node);
				textRange.collapse(false);
				//textRange.setStartAfter(node);なぜかエラーが出る
				found = true;
			}
		}
		catch(e) {
		}

		if (aRange.endContainer == doc)
			textRange.setEndAfter(doc.body || doc.documentElement);
		else
			textRange.setEnd(aRange.endContainer, aRange.endOffset);

		var string = textRange.toString();
		if (string) {
			encoder.setRange(textRange);
			result.push(encoder.encodeToString());
		}

		nodeRange.detach();
		textRange.detach();

		return result.join('');
	},
	kEXCEPTION_EXPRESSION : <![CDATA[
		descendant::*[
			contains(" SCRIPT script TEXTAREA textarea textbox ", concat(" ", local-name(), " ")) or
			((local-name()="INPUT" or local-name()="input") and contains("TEXT text FILE file", @type))
		]
	]]>.toString(),
  
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
  
	findFirstVisibleNode : function(aDocument, aBackward) 
	{
		var w = aDocument.defaultView;

		var topY = getBoxObjectFor(aDocument.documentElement).screenY;

		this.visibleNodeFilter.found       = false;
		this.visibleNodeFilter.frameHeight = w.innerHeight;
		this.visibleNodeFilter.startY      = w.scrollY + topY;
		this.visibleNodeFilter.endY        = w.scrollY + topY + w.innerHeight;
		this.visibleNodeFilter.minPixels   = 12;
		this.visibleNodeFilter.minSize     = w.innerWidth * w.innerHeight;
		this.visibleNodeFilter.isInvisible =
			this.visibleNodeFilter[aBackward ? 'isBelow' : 'isAbove' ];
		this.visibleNodeFilter.isInScreenCompletely =
			this.visibleNodeFilter[aBackward ? 'isAbove' : 'isBelow' ];

		var lastNode;

		var utils = w.QueryInterface(Ci.nsIInterfaceRequestor)
						.getInterface(Ci.nsIDOMWindowUtils);
		if ('nodesFromRect' in utils) { // Firefox 3.6-
			let nodes = utils.nodesFromRect(
					0,
					0,
					this.visibleNodeFilter.minPixels,
					w.innerWidth+this.visibleNodeFilter.minPixels,
					w.innerHeight+this.visibleNodeFilter.minPixels,
					this.visibleNodeFilter.minPixels,
					true,
					false
				);
			if (aBackward) {
				let i = 0,
					maxi = nodes.length;
				do {
					lastNode = nodes[i];
					i++;
				}
				while (this.visibleNodeFilter.acceptNode(nodes[i]) != this.visibleNodeFilter.kACCEPT && i < maxi);
			}
			else {
				let i = nodes.length-1;
				do {
					lastNode = nodes[i];
					i--;
				}
				while (this.visibleNodeFilter.acceptNode(nodes[i]) != this.visibleNodeFilter.kACCEPT && i > -1);
			}
		}
		else { // -Firefox 3.5
			let walker = aDocument.createTreeWalker(
					aDocument.documentElement,
					Ci.nsIDOMNodeFilter.SHOW_ELEMENT,
					this.visibleNodeFilter,
					false
				);

			if (aBackward) {
				lastNode = aDocument.documentElement;
				while (node = walker.lastChild())
				{
					lastNode = node;
					walker.currentNode = node;
				}
				let node = lastNode;
				this.visibleNodeFilter.found = false;
				if (this.visibleNodeFilter.acceptNode(node) != this.visibleNodeFilter.kACCEPT) {
					while (!this.visibleNodeFilter.found &&
						(node = walker.previousNode()))
					{
						lastNode = node;
						walker.currentNode = node;
					}
				}
			}
			else {
				let node = aDocument.documentElement;
				lastNode = node;
				this.visibleNodeFilter.found = false;
				if (this.visibleNodeFilter.acceptNode(node) != this.visibleNodeFilter.kACCEPT) {
					while (!this.visibleNodeFilter.found &&
						(node = walker.nextNode()))
					{
						lastNode = node;
						walker.currentNode = node;
					}
				}
			}
			if (
				(!lastNode || lastNode == aDocument.documentElement) &&
				this.visibleNodeFilter.lastInScreenNode
				) {
				lastNode = this.visibleNodeFilter.lastInScreenNode;
			}
		}

		this.visibleNodeFilter.clear();

		return lastNode || aDocument.documentElement;
	},
	
	visibleNodeFilter : { 
		kSKIP   : Ci.nsIDOMNodeFilter.FILTER_SKIP,
		kACCEPT : Ci.nsIDOMNodeFilter.FILTER_ACCEPT,
		acceptNode : function(aNode)
		{
			var size = aNode.offsetWidth * aNode.offsetHeight;
			result = (
				size == 0 ||
				this.isInvisible(aNode, true) ||
				/^\s*$/.test(aNode.textContent)
				) ? this.kSKIP : this.kACCEPT ;

			if (result == this.kACCEPT) {
				if (!this.isInScreenCompletely(aNode, true)) {
					this.lastInScreenNode = aNode;
				}
				if (aNode.offsetHeight > this.frameHeight) {
					result = this.kSKIP;
				}
			}
			if (result == this.kACCEPT) {
				if (size > this.minSize) {
					result = this.kSKIP;
				}
				this.minSize = Math.min(this.minSize, size);
			}
			if (!this.found && this.isInScreenCompletely(aNode, false))
				this.found = true;

			return result;
		},
		isAbove : function(aNode, aOutside)
		{
			var y = this.getY(aNode);
			var edge = aOutside ? this.startY : this.endY ;
			return (
				y < edge &&
				y + Math.min(this.frameHeight, aNode.offsetHeight) < edge + this.minPixels
			);
		},
		isBelow : function(aNode, aOutside)
		{
			var y = this.getY(aNode);
			var edge = aOutside ? this.endY : this.startY ;
			return (
				y + Math.min(this.frameHeight, aNode.offsetHeight) > edge &&
				y > edge - this.minPixels
			);
		},
		getY : function(aNode)
		{
			return getBoxObjectFor(aNode).screenY;
		},
		isInvisible : null,
		isInScreenCompletely : null,
		frameHeight : 0,
		startY      : 0,
		endY        : 0,
		minPixels   : 12,
		minSize     : 0,
		found       : false,
		clear : function()
		{
			this.lastInScreenNode = null;
		}
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
 
