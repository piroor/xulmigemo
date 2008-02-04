var XMigemoMailService = { 
	 
	handleEvent : function(aEvent) 
	{
		switch (aEvent.type)
		{
			case 'load':
				this.init();
				return;
			case 'unload':
				this.destroy();
				return;
		}
	},
 
	// nsIFolderListener 
	OnItemAdded : function(aParentItem, aItem) {},
	OnItemRemoved : function(aParentItem, aItem) {},
	OnItemPropertyChanged : function(aItem, aProperty, aOld, aNew) {},
	OnItemIntPropertyChanged : function(aItem, aProperty, aOld, aNew) {},
	OnItemBoolPropertyChanged : function(aItem, aProperty, aOld, aNew) {},
	OnItemUnicharPropertyChanged : function(aItem, aProperty, aOld, aNew) {},
	OnItemPropertyFlagChanged : function(aItem, aProperty, aOld, aNew) {},
	OnItemEvent : function(aItem, aEvent) {
		if (aEvent.toString() == 'FolderLoaded')
			this.getSummary();
	},
 
	summaries : {}, 
 
	getSummary : function() 
	{
		var uri = gDBView.msgFolder.URI;
		if (uri in this.summaries)
			return this.summaries[uri];
		this.summaries[uri] = new XMigemoMailFolderSummary(uri);
		return this.summaries[uri];
	},
 
	kQuickSearchSubject       : 0, 
	kQuickSearchFrom          : 1,
	kQuickSearchFromOrSubject : 2,
	kQuickSearchBody          : 3,
	kQuickSearchRecipient     : 5,
 
	getSearchTermsList : function() 
	{
		var terms = [];
		if (!XMigemoService.getPref('xulmigemo.mailnews.threadsearch.enabled'))
			return terms;

		try {
			var summaries = this.getSummary();
			var table = [];
			if (gSearchInput.searchMode == this.kQuickSearchSubject ||
				gSearchInput.searchMode == this.kQuickSearchFromOrSubject)
				table.push(summaries.subjects);
			if (gSearchInput.searchMode == this.kQuickSearchFrom ||
				gSearchInput.searchMode == this.kQuickSearchFromOrSubject)
				table.push(summaries.authors);
			if (gSearchInput.searchMode == this.kQuickSearchRecipient) {
				table.push(summaries.recipients);
				table.push(summaries.cc);
			}
			if (table.length) {
				table = table.join('\n');
				terms = table.match(new RegExp(XMigemoCore.getRegExp(gSearchInput.value), 'ig'));
				terms = terms
					.sort()
					.join('\n')
					.replace(/^(.+)$(\n\1)+/mg, '$1')
					.split('\n');
			}
//dump('TERMS : \n'+terms.join('\n')+'\n');
		}
		catch(e) {
		}

		return terms || [];
	},
 
	init : function() 
	{
		window.removeEventListener('load', this, false);

		var mailSession = Components.classes[mailSessionContractID].getService(Components.interfaces.nsIMsgMailSession);
		var nsIFolderListener = Components.interfaces.nsIFolderListener;
		mailSession.AddFolderListener(this, nsIFolderListener.event);

		eval('window.createSearchTerms = '+
			window.createSearchTerms.toSource().replace(
				'var termList = gSearchInput.value.split("|");',
				<><![CDATA[
					var termList = XMigemoMailService.getSearchTermsList();
					if (!termList.length)
						termList = gSearchInput.value.split('|');
				]]></>
			)
		);
	},
 
	destroy : function() 
	{
		window.removeEventListener('unload', this, false);

		var mailSession = Components.classes[mailSessionContractID].getService(Components.interfaces.nsIMsgMailSession);
		mailSession.RemoveFolderListener(this);

		for (var i in this.summaries)
		{
			this.summaries[i].destroy();
		}
	}
 
}; 
  
function XMigemoMailFolderSummary(aFolder) 
{
//dump('XMigemoMailFolderSummary initialize'+aFolder+'\n');

	this.mFolder = aFolder;
	this.init();
}
XMigemoMailFolderSummary.prototype = {
	delay : 10,
	 
	get authors() 
	{
		this.parseAllMessages();
		return this.mAuthors.join('\n');
	},
	get subjects()
	{
		this.parseAllMessages();
		return this.mSubjects.join('\n');
	},
	get recipients()
	{
		this.parseAllMessages();
		return this.mRecipients.join('\n');
	},
	get cc()
	{
		this.parseAllMessages();
		return this.mCc.join('\n');
	},
 
	mIds : [], 
	mAuthors : [],
	mSubjects : [],
	mRecipients : [],
	mCc : [],
 
	init : function() 
	{
		var mailSession = Components.classes[mailSessionContractID].getService(Components.interfaces.nsIMsgMailSession);
		var nsIFolderListener = Components.interfaces.nsIFolderListener;
		mailSession.AddFolderListener(this, nsIFolderListener.added | nsIFolderListener.removed);

		this.mDB = gDBView.db;
		this.startToBuild();
	},
 
	destroy : function() 
	{
		this.stopToBuild();

		delete this.mFolder;
		delete this.mDB;

		var mailSession = Components.classes[mailSessionContractID].getService(Components.interfaces.nsIMsgMailSession);
		mailSession.RemoveFolderListener(this);
	},
 
	startToBuild : function() 
	{
//dump('XMigemoMailFolderSummary start to build '+this.mFolder+'\n');
		this.stopToBuild();
		this.mIds = [];
		this.mAuthors = [];
		this.mSubjects = [];
		this.mRecipients = [];
		this.mCc = [];
		this.mMessages = this.mDB.EnumerateMessages();
		this.mTimer = window.setTimeout(this.parseOneMessage, this.delay, this, true);
	},
 
	stopToBuild : function() 
	{
		if (this.mTimer) {
			window.clearTimeout(this.mTimer);
			this.mTimer = null;
		}
	},
 
	parseOneMessage : function(aSelf, aUseTimer) 
	{
		if (!aSelf.mMessages.hasMoreElements()) return false;

		var msg = aSelf.mMessages.getNext().QueryInterface(Components.interfaces.nsIMsgDBHdr);
		aSelf.addItem(msg);

		if (aUseTimer) {
			aSelf.mTimer = window.setTimeout(aSelf.parseOneMessage, aSelf.delay, aSelf, true);
		}

		return true;
	},
	 
	addItem : function(aMsgHdr) 
	{
		this.mIds.push(aMsgHdr.messageId);
		this.mAuthors.push(aMsgHdr.mime2DecodedAuthor);
		this.mSubjects.push(aMsgHdr.mime2DecodedSubject);
		this.mRecipients.push(aMsgHdr.mime2DecodedRecipients);
		this.mCc.push(XMigemoStrUtils.unescapeFromMime(aMsgHdr.ccList));
//dump('parse: '+this.mFolder+' / '+aMsgHdr.mime2DecodedAuthor+'\n');
	},
 
	removeItem : function(aMsgHdr) 
	{
		var index = this.mIds.indexOf(aMsgHdr.messageId);
		if (index < 0) return;
		this.mIds.splice(index, 1);
		this.mAuthors.splice(index, 1);
		this.mSubjects.splice(index, 1);
		this.mRecipients.splice(index, 1);
		this.mCc.splice(index, 1);
	},
 	 
	parseAllMessages : function() 
	{
		while (this.parseOneMessage(this)) {}
//dump('XMigemoMailFolderSummary end of build '+this.mFolder+' ('+this.mAuthors.length+')\n');
	},
 
	// nsIFolderListener 
	OnItemAdded : function(aParentItem, aItem) {
		if (aParentItem.Value == this.mFolder) {
			var msg = aItem.QueryInterface(Components.interfaces.nsIMsgDBHdr);
			this.addItem(msg);
//			this.startToBuild();
		}
	},
	OnItemRemoved : function(aParentItem, aItem) {
		if (aParentItem.Value == this.mFolder) {
			var msg = aItem.QueryInterface(Components.interfaces.nsIMsgDBHdr);
			this.removeItem(msg);
//			this.startToBuild();
		}
	},
	OnItemPropertyChanged : function(aItem, aProperty, aOld, aNew) {},
	OnItemIntPropertyChanged : function(aItem, aProperty, aOld, aNew) {},
	OnItemBoolPropertyChanged : function(aItem, aProperty, aOld, aNew) {},
	OnItemUnicharPropertyChanged : function(aItem, aProperty, aOld, aNew) {},
	OnItemPropertyFlagChanged : function(aItem, aProperty, aOld, aNew) {},
	OnItemEvent : function(aItem, aEvent) {}
 
}; 
  
window.addEventListener('load', XMigemoMailService, false); 
window.addEventListener('unload', XMigemoMailService, false);
 
