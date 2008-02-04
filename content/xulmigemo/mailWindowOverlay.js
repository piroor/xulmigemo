var XMigemoMailService = { 
	 
	kDATABASE : 'xulmigemo.summary.sqlite', 

	kTABLE   : 'summaries',

	kKEY       : 'key',
	kID        : 'messageId',
	kAUTHOR    : 'author',
	kSUBJECT   : 'subject',
	kRECIPIENT : 'recipient',
	kCC        : 'cc',
	kDATE      : 'last_updated_on',

	kKEY_INDEX       : 0,
	kID_INDEX        : 1,
	kAUTHOR_INDEX    : 2,
	kSUBJECT_INDEX   : 3,
	kRECIPIENT_INDEX : 4,
	kCC_INDEX        : 5,
	kDATE_INDEX      : 6,
 
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
		switch (aEvent.toString())
		{
			case 'FolderLoaded':
				this.getSummary();
				return;
			case 'CompactCompleted':
				var summary = this.getSummary();
				summary.stopToBuild();
				summary.clearCache();
				summary.startToBuld();
				return;
		}
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
 
	get summariesDB() 
	{
		if (!this.mSummariesDB) {
			const DirectoryService = Components.classes['@mozilla.org/file/directory_service;1'].getService(Components.interfaces.nsIProperties);
			var file = DirectoryService.get('ProfD', Components.interfaces.nsIFile);
			file.append(this.kDATABASE);

			var storageService = Components.classes['@mozilla.org/storage/service;1'].getService(Components.interfaces.mozIStorageService);
			this.mSummariesDB = storageService.openDatabase(file);

			if(!this.mSummariesDB.tableExists(this.kTABLE)){
				this.mSummariesDB.createTable(this.kTABLE,
					[
						this.kKEY+' TEXT PRIMARY KEY',
						this.kID+' TEXT',
						this.kAUTHOR+' TEXT',
						this.kSUBJECT+' TEXT',
						this.kRECIPIENT+' TEXT',
						this.kCC+' TEXT',
						this.kDATE+' DATETIME'
					].join(', ')
				);
			}
		}
		return this.mSummariesDB;
	},
	mSummariesDB : null,
 
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
 
	initArray : function() 
	{
		this.mIds = [];
		this.mAuthors = [];
		this.mSubjects = [];
		this.mRecipients = [];
		this.mCc = [];
	},
 
	init : function() 
	{
		var mailSession = Components.classes[mailSessionContractID].getService(Components.interfaces.nsIMsgMailSession);
		var nsIFolderListener = Components.interfaces.nsIFolderListener;
		mailSession.AddFolderListener(this, nsIFolderListener.added | nsIFolderListener.removed);

		this.mDB = gDBView.db;

		if (!this.loadCache()) {
			this.startToBuild();
		}
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
		this.initArray();
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
 
	updateCache : function() 
	{
		var sv = XMigemoMailService;
		var statement = sv.summariesDB.createStatement(
				'INSERT OR REPLACE INTO '+sv.kTABLE+
				' VALUES(?1, ?2, ?3, ?4, ?5, ?6, ?7)');
		statement.bindStringParameter(sv.kKEY_INDEX, this.mFolder);
		statement.bindStringParameter(sv.kID_INDEX, this.mIds.join('\n'));
		statement.bindStringParameter(sv.kAUTHOR_INDEX, this.mAuthors.join('\n'));
		statement.bindStringParameter(sv.kSUBJECT_INDEX, this.mSubjects.join('\n'));
		statement.bindStringParameter(sv.kRECIPIENT_INDEX, this.mRecipients.join('\n'));
		statement.bindStringParameter(sv.kCC_INDEX, this.mCc.join('\n'));
		statement.bindDoubleParameter(sv.kDATE_INDEX, Date.now());
		try {
			statement.executeStep();
		}
		catch(e) {
			dump('updateCache / '+this.mFolder+'\n'+e+'\n');
		}
		statement.reset();
	},
 
	loadCache : function() 
	{
		var sv = XMigemoMailService;
		var statement = sv.summariesDB.createStatement(
				'SELECT * FROM '+sv.kTABLE+' WHERE '+sv.kKEY+' = ?1');
		statement.bindStringParameter(0, this.mFolder);
		try {
			statement.executeStep();
			this.mIds = statement.getString(sv.kID_INDEX).split('\n');
			this.mAuthors = statement.getString(sv.kAUTHOR_INDEX).split('\n');
			this.mSubjects = statement.getString(sv.kSUBJECT_INDEX).split('\n');
			this.mRecipients = statement.getString(sv.kRECIPIENT_INDEX).split('\n');
			this.mCc = statement.getString(sv.kCC_INDEX).split('\n');
		}
		catch(e) {
			this.initArray();
		}
		statement.reset();

		return this.mIds.length != 0;
	},
 
	clearCache : function() 
	{
		this.initArray();

		var sv = XMigemoMailService;
		var statement = sv.summariesDB.createStatement(
				'DELETE * FROM '+sv.kTABLE+' WHERE '+sv.kKEY+' = ?1');
		statement.bindStringParameter(0, this.mFolder);
		try {
			statement.executeStep();
		}
		catch(e) {
		}
		statement.reset();
	},
 
	parseOneMessage : function(aSelf, aUseTimer) 
	{
		if (!aSelf.mMessages.hasMoreElements()) {
			if (aUseTimer) aSelf.updateCache();
			return false;
		}

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
		this.updateCache();
//dump('XMigemoMailFolderSummary end of build '+this.mFolder+' ('+this.mAuthors.length+')\n');
	},
 
	// nsIFolderListener 
	OnItemAdded : function(aParentItem, aItem) {
		if (aParentItem.Value == this.mFolder) {
			var msg = aItem.QueryInterface(Components.interfaces.nsIMsgDBHdr);
			this.addItem(msg);
			this.updateCache();
//			this.startToBuild();
		}
	},
	OnItemRemoved : function(aParentItem, aItem) {
		if (aParentItem.Value == this.mFolder) {
			var msg = aItem.QueryInterface(Components.interfaces.nsIMsgDBHdr);
			this.removeItem(msg);
			this.updateCache();
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
 
