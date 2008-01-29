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
	OnItemAdded : function(aParentItem, aItem) {
		this.clearCacheFor(aParentItem.Value);
	},
	OnItemRemoved : function(aParentItem, aItem) {
		this.clearCacheFor(aParentItem.Value);
	},
	OnItemPropertyChanged : function(aItem, aProperty, aOld, aNew) {},
	OnItemIntPropertyChanged : function(aItem, aProperty, aOld, aNew) {},
	OnItemBoolPropertyChanged : function(aItem, aProperty, aOld, aNew) {},
	OnItemUnicharPropertyChanged : function(aItem, aProperty, aOld, aNew) {},
	OnItemPropertyFlagChanged : function(aItem, aProperty, aOld, aNew) {},
	OnItemEvent : function(aItem, aEvent) {},
	clearCacheFor : function(aURI) {
//dump('event onr '+aURI+'\n');
		if (aURI in cache) {
			dump('clear cache for '+aURI+'\n');
			delete cache[aURI];
		}
	},


	folderContentsCache : {},

	getTextTables : function()
	{
		var uri = gDBView.msgFolder.URI;
		if (uri in this.folderContentsCache)
			return this.folderContentsCache[uri];
//dump('make cache for '+uri+'\n');

		var enum = gDBView.db.EnumerateMessages();
		var msg;
		var authors = [];
		var subjects = [];
		var recipients = [];
		var cc = [];
		while (enum.hasMoreElements())
		{
			msg = enum.getNext().QueryInterface(Components.interfaces.nsIMsgDBHdr);
			authors.push(msg.mime2DecodedAuthor);
			subjects.push(msg.mime2DecodedSubject);
			recipients.push(msg.mime2DecodedRecipients);
			cc.push(XMigemoStrUtils.unescapeFromMime(msg.ccList));
		}
		this.folderContentsCache[uri] = {
			authors : authors.join('\n'),
			subjects : subjects.join('\n'),
			recipients : recipients.join('\n'),
			cc : cc.join('\n'),
		};

		return this.folderContentsCache[uri];
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
			var tables = this.getTextTables();
			var table = [];
			if (gSearchInput.searchMode == this.kQuickSearchSubject ||
				gSearchInput.searchMode == this.kQuickSearchFromOrSubject)
				table.push(tables.subjects);
			if (gSearchInput.searchMode == this.kQuickSearchFrom ||
				gSearchInput.searchMode == this.kQuickSearchFromOrSubject)
				table.push(tables.authors);
			if (gSearchInput.searchMode == this.kQuickSearchRecipient) {
				table.push(tables.recipients);
				table.push(tables.cc);
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

		return terms;
	},

	init : function() {
		window.removeEventListener('load', this, false);

		var mailSession = Components.classes[mailSessionContractID].getService(Components.interfaces.nsIMsgMailSession);
		var nsIFolderListener = Components.interfaces.nsIFolderListener;
		mailSession.AddFolderListener(this, nsIFolderListener.added | nsIFolderListener.removed);

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

	destroy : function() {
		window.removeEventListener('unload', this, false);

		var mailSession = Components.classes[mailSessionContractID].getService(Components.interfaces.nsIMsgMailSession);
		mailSession.RemoveFolderListener(this);
	}
};

window.addEventListener('load', XMigemoMailService, false);
window.addEventListener('unload', XMigemoMailService, false);

