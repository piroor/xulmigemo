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
		var doc=aRange.startContainer.ownerDocument;
		var scrs=doc.getElementsByTagName("script");
		var trash=doc.createRange();
		var noscrs=doc.getElementsByTagName("noscript");
		if(Prefs.getBoolPref('javascript.enabled')){
			for(var i=0;i<noscrs.length;i++){
				trash.selectNode(noscrs[i]);
				trash.deleteContents();
			}
		}
		var str=new String();
		var tmp = doc.createRange();
		tmp.setStart(aRange.startContainer,aRange.startOffset);
		var tmp2 = doc.createRange();
		var st=aRange.startContainer;
		var en=aRange.endContainer;
		for(var i=0;i<scrs.length;i++){
			if(scrs[i].parentNode.tagName.toUpperCase()=="HEAD"){continue;}

			tmp2.selectNode(scrs[i]);
			if(aRange.compareBoundaryPoints(0,tmp2)==-1&&
			tmp2.compareBoundaryPoints(2,aRange)==-1){

			tmp.setEndBefore(scrs[i]);
			str+=tmp.toString();
			tmp.selectNode(scrs[i]);
			tmp.collapse(false);
			//tmp.setStartAfter(scrs[i]);なぜかエラーが出る
			}
		}

		tmp.setEnd(aRange.endContainer,aRange.endOffset);
		str+=tmp.toString();
		return str;
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
		str = str.replace(/([\-\:\}\{\|\$\?\*\+\.\^\]\/\[\;\\\(\)])/g,"\\$1");
		return str;
	},
 
	sanitize2 : function(str) 
	{
		//	^.+*?${}\,
		str = str.replace(/([\-\:\}\{\$\?\*\+\.\^\/\;\\])/g,"\\$1");
		return str;
	},
 
	reverseRegExp : function(aExp) 
	{
		var tmp = aExp;
		tmp=tmp.replace(/\[\]\|/im,"")
				.replace(/\(/g,"[[OPEN-PAREN]]")
				.replace(/\)/g,"(")
				.replace(/\[\[OPEN-PAREN\]\]/g,")");
		tmp = tmp.replace(/\[([^\[]+?)\]/img,"\]$1\[").split("").reverse().join("")
		tmp = tmp.replace(/(.)\\/g,"\\$1")
				.replace(/\*(\[[^\]]*\])/g,"$1*")
				.replace(/\*(\([^\)]*\))/g,"$1*");
		return tmp;
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
 
