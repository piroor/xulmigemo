var ObserverService = Components 
			.classes['@mozilla.org/observer-service;1']
			.getService(Components.interfaces.nsIObserverService);

var Prefs = Components
			.classes['@mozilla.org/preferences;1']
			.getService(Components.interfaces.nsIPrefBranch);

var MailSession;
 
function pXMigemoMail() { 
//	dump('create instance pIXMigemoMail\n');
	this.init();
}

pXMigemoMail.prototype = {
	get contractID() {
		return '@piro.sakura.ne.jp/xmigemo/mail;1';
	},
	get classDescription() {
		return 'This is a Migemo mail service itself.';
	},
	get classID() {
		return Components.ID('{15b05450-d389-11dc-95ff-0800200c9a66}');
	},

	get wrappedJSObject() {
		return this;
	},
	 
// summary 
	 
	kDATABASE : 'xulmigemo.sqlite', 

	kTABLE   : 'summaries',

	kKEY       : 'key',
	kID        : 'messageId',
	kAUTHOR    : 'author',
	kSUBJECT   : 'subject',
	kRECIPIENT : 'recipient',
	kCC        : 'cc',
	kBODY      : 'body',
	kDATE      : 'last_updated_on',

	kKEY_INDEX       : 0,
	kID_INDEX        : 1,
	kAUTHOR_INDEX    : 2,
	kSUBJECT_INDEX   : 3,
	kRECIPIENT_INDEX : 4,
	kCC_INDEX        : 5,
	kBODY_INDEX      : 6,
	kDATE_INDEX      : 7,
 
	get summariesDB() 
	{
		if (!this.mSummariesDB) {
			const DirectoryService = Components.classes['@mozilla.org/file/directory_service;1'].getService(Components.interfaces.nsIProperties);
			var file = DirectoryService.get('ProfD', Components.interfaces.nsIFile);
			file.append(this.kDATABASE);

			var storageService = Components.classes['@mozilla.org/storage/service;1'].getService(Components.interfaces.mozIStorageService);
			this.mSummariesDB = storageService.openDatabase(file);

			if (!this.mSummariesDB.tableExists(this.kTABLE)) {
				this.mSummariesDB.createTable(this.kTABLE,
					[
						this.kKEY+' TEXT PRIMARY KEY',
						this.kID+' TEXT',
						this.kAUTHOR+' TEXT',
						this.kSUBJECT+' TEXT',
						this.kRECIPIENT+' TEXT',
						this.kCC+' TEXT',
						this.kBODY+' TEXT',
						this.kDATE+' DATETIME'
					].join(', ')
				);
			}
		}
		return this.mSummariesDB;
	},
	mSummariesDB : null,
 
	loadSummaryCache : function(aFolder, aIds, aAuthors, aSubjects, aRecipients, aCc, aBodies) 
	{
//dump('pIXMigemoMail::loadSummaryCache('+aFolder.URI+')\n');

		var statement = this.summariesDB.createStatement(
				'SELECT * FROM '+this.kTABLE+' WHERE '+this.kKEY+' = ?1');
		statement.bindStringParameter(0, aFolder.URI);
		try {
			statement.executeStep();
			aIds.value = statement.getString(this.kID_INDEX);
			aAuthors.value = statement.getString(this.kAUTHOR_INDEX);
			aSubjects.value = statement.getString(this.kSUBJECT_INDEX);
			aRecipients.value = statement.getString(this.kRECIPIENT_INDEX);
			aCc.value = statement.getString(this.kCC_INDEX);
			aBodies.value = statement.getString(this.kBODY_INDEX);
		}
		catch(e) {
			aIds.value = '';
			aAuthors.value = '';
			aSubjects.value = '';
			aRecipients.value = '';
			aCc.value = '';
			aBodies.value = '';
		}
		statement.reset();
	},
 
	saveSummaryCache : function(aFolder, aIds, aAuthors, aSubjects, aRecipients, aCc, aBodies) 
	{
		var statement = this.summariesDB.createStatement(
				'INSERT OR REPLACE INTO '+this.kTABLE+
				' VALUES(?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)');
		statement.bindStringParameter(this.kKEY_INDEX, aFolder.URI);
		statement.bindStringParameter(this.kID_INDEX, aIds);
		statement.bindStringParameter(this.kAUTHOR_INDEX, aAuthors);
		statement.bindStringParameter(this.kSUBJECT_INDEX, aSubjects);
		statement.bindStringParameter(this.kRECIPIENT_INDEX, aRecipients);
		statement.bindStringParameter(this.kCC_INDEX, aCc);
		statement.bindStringParameter(this.kBODY_INDEX, aBodies);
		statement.bindDoubleParameter(this.kDATE_INDEX, Date.now());
		try {
			statement.executeStep();
		}
		catch(e) {
			dump('error on pIXMigemoMail::saveSummaryCache / '+aFolder.URI+'\n'+e+'\n');
		}
		statement.reset();

//dump('pIXMigemoMail::saveSummaryCache('+aFolder.URI+')\n');
	},
 
	clearSummaryCache : function(aFolder) 
	{
//dump('pIXMigemoMail::clearSummaryCache('+aFolder.URI+')\n');

		var statement = this.summariesDB.createStatement(
				'DELETE FROM '+this.kTABLE+' WHERE '+this.kKEY+' = ?1');
		statement.bindStringParameter(0, aFolder.URI);
		try {
			statement.executeStep();
		}
		catch(e) {
		}
		statement.reset();
	},
 
	refreshSummaryCache : function(aFolder) 
	{
		this.clearSummaryCache(aFolder);
		this.getSummary(aFolder).buildProgressively();
	},
 
	summaries : {}, 
 
	getSummary : function(aFolder) 
	{
		var uri = aFolder.URI;
		if (uri in this.summaries)
			return this.summaries[uri];

//dump('pIXMigemoMail::create new summary for '+uri+'\n');

		this.summaries[uri] = new FolderSummary(aFolder);
		return this.summaries[uri];
	},
  
// create search term list 
	
	kQuickSearchSubject       : 0, 
	kQuickSearchFrom          : 1,
	kQuickSearchFromOrSubject : 2,
	kQuickSearchBody          : 3,
	kQuickSearchRecipient     : 5,
 
	get core() 
	{
		if (!this._core) {
			this._core = Components
				.classes['@piro.sakura.ne.jp/xmigemo/factory;1']
				.getService(Components.interfaces.pIXMigemoFactory)
				.getService(Prefs.getCharPref('xulmigemo.lang'));
		}
		return this._core;
	},
	_core : null,
 
	get textUtils() 
	{
		if (!this._textUtils)
			this._textUtils = Components
					.classes['@piro.sakura.ne.jp/xmigemo/text-utility;1']
					.getService(Components.interfaces.pIXMigemoTextUtils);
		return this._textUtils;
	},
	_textUtils : null,
 
	getTermsList : function(aInput, aSearchMode, aFolder) 
	{
		var terms = [];
		try {
			var summaries = this.getSummary(aFolder);
			var table = [];
			if (aSearchMode == this.kQuickSearchSubject ||
				aSearchMode == this.kQuickSearchFromOrSubject)
				table.push(summaries.subjects);
			if (aSearchMode == this.kQuickSearchFrom ||
				aSearchMode == this.kQuickSearchFromOrSubject)
				table.push(summaries.authors);
			if (aSearchMode == this.kQuickSearchRecipient) {
				table.push(summaries.recipients);
				table.push(summaries.cc);
			}
			if (aSearchMode == this.kQuickSearchBody) {
				table.push(summaries.bodies);
			}
			if (table.length) {
				var regexp;
				if (
					Prefs.getBoolPref('xulmigemo.autostart.regExpFind') &&
					this.textUtils.isRegExp(aInput)
					) {
					regexp = this.textUtils.extractRegExpSource(aInput);
				}
				else {
					regexp = this.core.getRegExp(aInput);
				}
				regexp = new RegExp(regexp, 'ig');
				table = table.join('\n');
				terms = table.match(regexp);
				terms = terms
					.sort()
					.join('\n')
					.replace(/^(.+)$(\n\1)+/mg, '$1')
					.split('\n');
			}
		}
		catch(e) {
		}
		terms = terms || [];
		return terms;
	},
  
	// nsIFolderListener 
	OnItemAdded : function(aParentItem, aItem)
	{
		try {
			var summary = this.getSummary(aParentItem.QueryInterface(Components.interfaces.nsIMsgFolder));
			if (summary.isBuilding) return;
			summary.addItem(aItem.QueryInterface(Components.interfaces.nsIMsgDBHdr));
			summary.updateCache();
		}
		catch(e) {
		}
	},
	OnItemRemoved : function(aParentItem, aItem)
	{
		try {
			var summary = this.getSummary(aParentItem.QueryInterface(Components.interfaces.nsIMsgFolder));
			if (summary.isBuilding) return;
			summary.removeItem(aItem.QueryInterface(Components.interfaces.nsIMsgDBHdr));
			summary.updateCache();
		}
		catch(e) {
		}
	},
	OnItemPropertyChanged : function(aItem, aProperty, aOld, aNew) {},
	OnItemIntPropertyChanged : function(aItem, aProperty, aOld, aNew) {},
	OnItemBoolPropertyChanged : function(aItem, aProperty, aOld, aNew) {},
	OnItemUnicharPropertyChanged : function(aItem, aProperty, aOld, aNew) {},
	OnItemPropertyFlagChanged : function(aItem, aProperty, aOld, aNew) {},
	OnItemEvent : function(aItem, aEvent)
	{
//dump('pIXMigemo::OnItemEvent '+aEvent.toString()+'\n');
		switch (aEvent.toString())
		{
			case 'CompactCompleted':
				this.refreshSummaryCache(aItem.QueryInterface(Components.interfaces.nsIMsgFolder));
				return;

			case 'FolderLoaded':
				this.getSummary(aItem.QueryInterface(Components.interfaces.nsIMsgFolder));
				return;
		}
	},
 
	init : function(aLang) 
	{
		if (this.initialized) return;

		this.initialized = true;

		MailSession = Components.classes['@mozilla.org/messenger/services/session;1']
					.getService(Components.interfaces.nsIMsgMailSession);

		var nsIFolderListener = Components.interfaces.nsIFolderListener;
		MailSession.AddFolderListener(this, nsIFolderListener.added | nsIFolderListener.removed | nsIFolderListener.event);

		ObserverService.addObserver(this, 'quit-application', false);
		ObserverService.addObserver(this, 'XMigemo:compactFolderRequested', false);

//dump('pIXMigemoMail::initialize done\n');
	},
 
	destroy : function() 
	{
		if (!this.initialized) return;

		this.initialized = false;

		MailSession.RemoveFolderListener(this);

		ObserverService.removeObserver(this, 'quit-application');
		ObserverService.removeObserver(this, 'XMigemo:compactFolderRequested');

		for (var i in this.summaries)
		{
			this.summaries[i].destroy();
		}
//dump('pIXMigemoMail::destroy done\n');
	},
 
	observe : function(aSubject, aTopic, aData) 
	{
		switch (aTopic)
		{
			case 'quit-application':
				this.destroy();
				return;

			case 'XMigemo:compactFolderRequested':
				var folder = aSubject.QueryInterface(Components.interfaces.nsIMsgFolder);
				if (!folder.expungedBytes && aData != 'forceCompact')
					this.refreshSummaryCache(folder);
				return;
		}
	},
 
	QueryInterface : function(aIID) 
	{
		if(!aIID.equals(Components.interfaces.pIXMigemoMail) &&
			!aIID.equals(Components.interfaces.nsIFolderListener) &&
			!aIID.equals(Components.interfaces.nsIObserver) &&
			!aIID.equals(Components.interfaces.nsISupports))
			throw Components.results.NS_ERROR_NO_INTERFACE;
		return this;
	}
};
  
function FolderSummary(aFolder) 
{
	this.mFolder = aFolder;
	this.init();
}
FolderSummary.prototype = {
	delay : 10,
	 
	get authors() 
	{
		if (!this.mAuthors.length) {
			this.init();
			if (this.isBuilding) {
				this.stopToBuild();
				this.parseAllMessages();
			}
		}
		return this.mAuthors.join('\n');
	},
	get subjects()
	{
		if (!this.mSubjects.length) {
			this.init();
			if (this.isBuilding) {
				this.stopToBuild();
				this.parseAllMessages();
			}
		}
		return this.mSubjects.join('\n');
	},
	get recipients()
	{
		if (!this.mRecipients.length) {
			this.init();
			if (this.isBuilding) {
				this.stopToBuild();
				this.parseAllMessages();
			}
		}
		return this.mRecipients.join('\n');
	},
	get cc()
	{
		if (!this.mCc.length) {
			this.init();
			if (this.isBuilding) {
				this.stopToBuild();
				this.parseAllMessages();
			}
		}
		return this.mCc.join('\n');
	},
	get bodies()
	{
		if (!this.mBodies.length) {
			this.init();
			if (this.isBuilding) {
				this.stopToBuild();
				this.parseAllMessages();
			}
		}
		return this.mBodies.join('\n');
	},
 
	init : function() 
	{
		var ids = {},
			authors = {},
			subjects = {},
			recipients = {},
			cc = {},
			bodies = {};

		var sv = Components.classes['@piro.sakura.ne.jp/xmigemo/mail;1']
				.getService(Components.interfaces.pIXMigemoMail);
		sv.loadSummaryCache(this.mFolder, ids, authors, subjects, recipients, cc, bodies);
		if (!ids.value) {
			this.buildProgressively();
			return;
		}

		this.mIds = ids.value.split('\n');
		this.mAuthors = authors.value.split('\n');
		this.mSubjects = subjects.value.split('\n');
		this.mRecipients = recipients.value.split('\n');
		this.mCc = cc.value.split('\n');
		this.mBodies = bodies.value.split('\n');
//dump('FolderSummary::initialize done\n');
	},
 
	destroy : function() 
	{
		this.stopToBuild();

		delete this.mFolder;
	},
 
// build 
	
	get isBuilding() 
	{
		return this.mProgressiveBuildTimer ? true : false ;
	},
 
	buildProgressively : function() 
	{
//dump('FolderSummary::buildProgressively('+this.mFolder.URI+')\n');

		this.stopToBuild();

		this.mIds = [];
		this.mAuthors = [];
		this.mSubjects = [];
		this.mRecipients = [];
		this.mCc = [];
		this.mBodies = [];

		this.mMessages = this.mFolder.getMsgDatabase(null).EnumerateMessages();
		this.mProgressiveBuildTimer = Components.classes['@mozilla.org/timer;1']
					.createInstance(Components.interfaces.nsITimer);
		this.mProgressiveBuildTimer.init(this, this.delay,
			this.mProgressiveBuildTimer.TYPE_REPEATING_SLACK);
	},
 
	stopToBuild : function() 
	{
		if (this.mProgressiveBuildTimer) {
			this.mProgressiveBuildTimer.cancel();
			this.mProgressiveBuildTimer = null;
		}
	},
  
// cache 
	
	updateCache : function() 
	{
		if (this.mUpdateCacheTimer) {
			this.mUpdateCacheTimer.cancel();
			this.mUpdateCacheTimer = null;
		}
		this.mUpdateCacheTimer = Components.classes['@mozilla.org/timer;1']
					.createInstance(Components.interfaces.nsITimer);
		this.mUpdateCacheTimer.init(this, 100,
			this.mUpdateCacheTimer.TYPE_ONE_SHOT);
	},
	
	updateCacheCallback : function() 
	{
		var sv = Components.classes['@piro.sakura.ne.jp/xmigemo/mail;1']
				.getService(Components.interfaces.pIXMigemoMail);
		sv.saveSummaryCache(
			this.mFolder,
			this.mIds.join('\n'),
			this.mAuthors.join('\n'),
			this.mSubjects.join('\n'),
			this.mRecipients.join('\n'),
			this.mCc.join('\n'),
			this.mBodies.join('\n')
		);
		this.mUpdateCacheTimer.cancel();
		this.mUpdateCacheTimer = null;
	},
   
// parse 
	 
	parseOneMessage : function() 
	{
		if (!this.mMessages.hasMoreElements()) {
			this.stopToBuild();
			this.updateCache();
			return false;
		}

		var msg = this.mMessages.getNext().QueryInterface(Components.interfaces.nsIMsgDBHdr);
		this.addItem(msg);

		return true;
	},
	 
	addItem : function(aMsgHdr) 
	{
		this.mIds.push((aMsgHdr.messageId || '').replace(/[\r\n]+/g, '\t'));
		this.mAuthors.push((aMsgHdr.mime2DecodedAuthor || '').replace(/[\r\n]+/g, '\t'));
		this.mSubjects.push((aMsgHdr.mime2DecodedSubject || '').replace(/[\r\n]+/g, '\t'));
		this.mRecipients.push((aMsgHdr.mime2DecodedRecipients || '').replace(/[\r\n]+/g, '\t'));
		this.mCc.push(this.decode(aMsgHdr.ccList || '').replace(/[\r\n]+/g, '\t'));
		this.mBodies.push(this.summarize(this.readBody(aMsgHdr)).replace(/[\r\n]+/g, '\t'));
//dump('parse: '+this.mFolder.URI+' / '+aMsgHdr.mime2DecodedAuthor+'\n');
	},
	 
	readBody : function(aMsgHdr) 
	{
		if (!Prefs.getBoolPref('xulmigemo.mailnews.threadsearch.body')) return '';

		var stream = this.mFolder.getOfflineFileStream(aMsgHdr.messageKey, {}, {})
			.QueryInterface(Components.interfaces.nsISeekableStream)
			.QueryInterface(Components.interfaces.nsILineInputStream);
		stream.seek(stream.NS_SEEK_SET, aMsgHdr.messageOffset);

		var multipart = false;
		var boundary = '';
		var charset = null;

		var charsetRegExp = /Content-Type:[^;]+;.*charset=['"]?([^;'"\s]+)/;

		// read header
		var line = {};
		while (stream.readLine(line))
		{
			if (!charset && charsetRegExp.test(line.value)) {
				charset = RegExp.$1;
			}
			if (line.value.indexOf('multipart/') || line.value.indexOf('message/')) {
				multipart = true;
			}
			if (!boundary && line.value.indexOf('boundary=') > -1) {
				boundary = line.value.substring(line.value.indexOf('"')+1);
				boundary = '--' + boundary.substring(0, boundary.indexOf('"'));
			}
			if (!line.value) break;
		}

		// read body
		var msg = [];
		var count  = aMsgHdr.lineCount;
		for (var i = 0; i < count; i++)
		{
			if (!stream.readLine(line)) break;
			msg.push(line.value);
		}

		stream.close();

		var UConv = Components
			.classes['@mozilla.org/intl/scriptableunicodeconverter']
			.getService(Components.interfaces.nsIScriptableUnicodeConverter);

		msg = msg.join('\n');
		if (multipart && boundary) {
			var parts = msg.split(boundary+'\n');
			msg = [];
			for (var i in parts)
			{
				parts[i] = parts[i].split('\n\n');
				if (parts[i][0].indexOf('Content-Type: text/') < 0) continue;
				charsetRegExp.test(parts[i][0]);
				parts[i].splice(0, 1);
				var body = parts[i].join('\n\n');
				if (RegExp.$1) {
					try {
						UConv.charset = RegExp.$1;
						body = UConv.ConvertToUnicode(body);
					}
					catch(e) {
					}
				}
				msg.push(body);
			}

			msg = msg.join('\n\n');
		}
		else if (charset) {
			try {
				UConv.charset = charset;
				msg = UConv.ConvertToUnicode(msg);
			}
			catch(e) {
			}
		}

		return msg;
	},
 
	summarize : function(aInput) 
	{
		return aInput
			.replace(/[\n\r]+/g, '\n')
			.replace(/\s\s+/g, ' ')
			.split('\n')
			.sort()
			.join('\n')
			.replace(/^(.+)$(\n\1)+/mg, '$1');
	},
 
	decode : function(aInput) 
	{
		var encoded = aInput.match(/=\?[-_a-z0-9]+\?.\?[^?]+\?=/gi);
		var self = this;
		encoded.sort().forEach(function(aPart) {
			aInput = aInput.replace(
				aPart,
				self.MIMEHeaderParam.getParameter(aPart, '', '', false, {})
			);
		});
		return aInput;
	},
	MIMEHeaderParam : Components.classes['@mozilla.org/network/mime-hdrparam;1']
		.getService(Components.interfaces.nsIMIMEHeaderParam),
 	 
	removeItem : function(aMsgHdr) 
	{
		var index = this.mIds.indexOf(aMsgHdr.messageId);
		if (index < 0) return;
		this.mIds.splice(index, 1);
		this.mAuthors.splice(index, 1);
		this.mSubjects.splice(index, 1);
		this.mRecipients.splice(index, 1);
		this.mCc.splice(index, 1);
		this.mBodies.splice(index, 1);
	},
  
	parseAllMessages : function() 
	{
		while (this.parseOneMessage()) {}
//dump('FolderSummary end of build '+this.mFolder.URI+' ('+this.mAuthors.length+')\n');
	},
  
	observe : function(aSubject, aTopic, aData) 
	{
		switch (aTopic)
		{
			case 'timer-callback':
				if (aSubject == this.mProgressiveBuildTimer)
					this.parseOneMessage();
				else
					this.updateCacheCallback();
				return;
		}
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
			CID        : pXMigemoMail.prototype.classID,
			contractID : pXMigemoMail.prototype.contractID,
			className  : pXMigemoMail.prototype.classDescription,
			factory    : {
				createInstance : function (aOuter, aIID)
				{
					if (aOuter != null)
						throw Components.results.NS_ERROR_NO_AGGREGATION;
					return (new pXMigemoMail()).QueryInterface(aIID);
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
 
