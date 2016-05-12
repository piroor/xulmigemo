var TEST = false; 

var EXPORTED_SYMBOLS = ['XMigemoMail'];

const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import('resource://xulmigemo-modules/service.jsm');
Components.utils.import('resource://xulmigemo-modules/migemo.jsm');


try { // -Thunderbird 3.0
	Components.utils.import('resource:///modules/quickSearchManager.js');
}
catch(e) {
}

try { // Thunderbird 3.1-
	Components.utils.import('resource:///modules/quickFilterManager.js');
}
catch(e) {
}


var XMigemoMail = {
	get DBConnection()
	{
		if (typeof GlodaDatastore === 'undefined')
			Components.utils.import('resource:///modules/gloda/datastore.js');

		return GlodaDatastore.syncConnection;
	},

	FIND_SUBJECT   : (1 << 0),
	FIND_BODY      : (1 << 1),
	FIND_AUTHOR    : (1 << 2),
	FIND_RECIPIENT : (1 << 3),
 
	getTermsList : function(aInput, aFindTargets, aFolder) 
	{
		aFolder.QueryInterface(Ci.nsIMsgFolder);
		var terms = [];
		try {
			var columns = [];
			if (aFindTargets & this.FIND_SUBJECT) columns.push('c.c0subject');
			if (aFindTargets & this.FIND_BODY) columns.push('c.c1body');
			if (aFindTargets & this.FIND_AUTHOR) columns.push('c.c3author');
			if (aFindTargets & this.FIND_RECIPIENT) columns.push('c.c4recipients');
			if (columns.length) {
				columns = columns.map(function(aColumn) {
					return 'COALESCE(' + aColumn + ', "")';
				});

				let regexp;
				if (
					XMigemoService.getPref('xulmigemo.autostart.regExpFind') &&
					XMigemoService.textUtils.isRegExp(aInput)
					) {
					regexp = XMigemoService.textUtils.extractRegExpSource(aInput);
					regexp = new RegExp(regexp, 'ig');
				}
				else {
					regexp = XMigemoCore.getRegExp(aInput);
				}
				regexp = new RegExp(regexp, 'ig');

				let sql = "" +
					"SELECT GROUP_CONCAT(%COLUMNS%, ?1) \n" +
					"  FROM messagesText_content c \n" +
					"       LEFT JOIN messages m ON m.id = c.docid \n" +
					"       LEFT JOIN folderLocations f ON f.id = m.folderID \n" +
					"  WHERE f.folderURI = ?2".replace('%COLUMNS%', columns.join(' || '));
				let statement = this.DBConnection.createStatement(sql);
				statement.bindStringParameter(0, '\n');
				statement.bindStringParameter(1, aFolder.folderURL);

				var sources;
				while(statement.executeStep())
				{
					sources = statement.getString(0);
				}
				statement.reset();

				terms = sources.replace(/\n/g, ' ').match(regexp);
				if (terms && terms.length)
					terms = XMigemoService.textUtils.brushUpTerms(terms);
			}
		}
		catch(e) {
		}
		terms = terms || [];
		return terms;
	},

	init : function()
	{
		// -Thunderbird 3.0
		if (typeof QuickSearchManager != 'undefined' &&
			!('__xmigemo_original_createSearchTerms' in QuickSearchManager)) {
			QuickSearchManager.__xmigemo_original_createSearchTerms = QuickSearchManager.createSearchTerms;
			QuickSearchManager.createSearchTerms = this.QuickSearchManager_createSearchTerms;
		}

		// Thunderbird 3.1-
		if (typeof MessageTextFilter != 'undefined' &&
			!('__xmigemo_original_appendTerms' in MessageTextFilter)) {
			MessageTextFilter.__xmigemo_original_appendTerms = MessageTextFilter.appendTerms;
			MessageTextFilter.appendTerms = this.MessageTextFilter_appendTerms;
		}
	},

	// -Thunderbird 3.0
	QuickSearchManager_createSearchTerms : function(aTermCreator, aSearchMode, aSearchString)
	{
		if (aTermCreator.window &&
			XMigemoService.getPref('xulmigemo.mailnews.threadsearch.enabled')) {
			let targets = 0;
			if (aSearchMode == QuickSearchConstants.kQuickSearchSubjectFromOrRecipient ||
				aSearchMode == QuickSearchConstants.kQuickSearchFromOrSubject ||
				aSearchMode == QuickSearchConstants.kQuickSearchRecipientOrSubject ||
				aSearchMode == QuickSearchConstants.kQuickSearchSubject)
				targets |= XMigemoMail.FIND_SUBJECT;
			if (aSearchMode == QuickSearchConstants.kQuickSearchBody)
				targets |= XMigemoMail.FIND_BODY;
			if (aSearchMode == QuickSearchConstants.kQuickSearchSubjectFromOrRecipient ||
				aSearchMode == QuickSearchConstants.kQuickSearchFromOrSubject ||
				aSearchMode == QuickSearchConstants.kQuickSearchFrom)
				targets |= XMigemoMail.FIND_AUTHOR;
			if (aSearchMode == QuickSearchConstants.kQuickSearchSubjectFromOrRecipient ||
				aSearchMode == QuickSearchConstants.kQuickSearchRecipientOrSubject ||
				aSearchMode == QuickSearchConstants.kQuickSearchRecipient)
				targets |= XMigemoMail.FIND_RECIPIENT;
			let terms = XMigemoMail.getTermsList(
					aSearchString,
					targets,
					aTermCreator.window.domWindow.gDBView.msgFolder
				);
			if (terms.length)
				aSearchString = terms.join('|');
		}

		return this.__xmigemo_original_createSearchTerms(aTermCreator, aSearchMode, aSearchString);
	},

	// Thunderbird 3.1-
	MessageTextFilter_appendTerms : function(aTermCreator, aTerms, aFilterValue)
	{
		var activeWindow = Cc['@mozilla.org/focus-manager;1']
							.getService(Ci.nsIFocusManager)
							.activeWindow;
		if (
			activeWindow &&
			aFilterValue.text &&
			aFilterValue.states &&
			XMigemoService.getPref('xulmigemo.mailnews.threadsearch.enabled')
			) {
			let targets = 0;
			if (aFilterValue.states.subject)
				targets |= XMigemoMail.FIND_SUBJECT;
			if (aFilterValue.states.body)
				targets |= XMigemoMail.FIND_BODY;
			if (aFilterValue.states.sender)
				targets |= XMigemoMail.FIND_AUTHOR;
			if (aFilterValue.states.recipients)
				targets |= XMigemoMail.FIND_RECIPIENT;
			let terms = XMigemoMail.getTermsList(
					aFilterValue.text,
					targets,
					activeWindow.gDBView.msgFolder
				);
			if (terms.length)
				aFilterValue.text = terms.join(' ');
		}

		return this.__xmigemo_original_appendTerms(aTermCreator, aTerms, aFilterValue);
	}
};

XMigemoMail.init();
