var EXPORTED_SYMBOLS = ['XMigemoMail'];

var TEST = false; 
var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource:///modules/quickFilterManager.js');

Cu.import('resource://xulmigemo-modules/service.jsm');
Cu.import('resource://xulmigemo-modules/core/textUtils.js');

Cu.import('resource://xulmigemo-modules/log.jsm');
function log(...aArgs) { MigemoLog('mail', ...aArgs); }


var XMigemoMail = {
	get DBConnection()
	{
		if (typeof GlodaDatastore === 'undefined')
			Cu.import('resource:///modules/gloda/datastore.js');

		return GlodaDatastore.syncConnection;
	},

	FIND_SUBJECT    : (1 << 0),
	FIND_BODY       : (1 << 1),
	FIND_AUTHOR     : (1 << 2),
	FIND_RECIPIENT  : (1 << 3),
	FIND_ATTACHMENT : (1 << 4),

	columnNames : {},

	getActualColumnNames : function()
	{
		var statement = this.DBConnection.createStatement('PRAGMA TABLE_INFO(messagesText_content)');
		var columns = {};
		while (statement.executeStep())
		{
			let name = statement.getString(1);
			if (name.indexOf('subject') > -1)
				columns[this.FIND_SUBJECT] = name;
			else if (name.indexOf('body') > -1)
				columns[this.FIND_BODY] = name;
			else if (name.indexOf('author') > -1)
				columns[this.FIND_AUTHOR] = name;
			else if (name.indexOf('recipients') > -1)
				columns[this.FIND_RECIPIENT] = name;
			else if (name.indexOf('attachmentNames') > -1)
				columns[this.FIND_ATTACHMENT] = name;
		}
		statement.reset();
		return columns;
	},
 
	getTermsList : function(aInput, aFindTargets, aFolder) 
	{
		aFolder.QueryInterface(Ci.nsIMsgFolder);
		var terms = [];
		try {
			var columns = [];
			Object.keys(this.columnNames).forEach(function(aColumn) {
				if (aFindTargets & aColumn)
					columns.push('c.' + this.columnNames[aColumn]);
			}, this);
			if (columns.length) {
				columns = columns.map(function(aColumn) {
					return 'COALESCE(' + aColumn + ', "")';
				});

				let regexp;
				if (
					XMigemoService.getPref('xulmigemo.autostart.regExpFind') &&
					MigemoTextUtils.isRegExp(aInput)
					) {
					regexp = MigemoTextUtils.extractRegExpSource(aInput);
					regexp = new RegExp(regexp, 'ig');
				}
				else {
					regexp = XMigemoCore.getRegExp(aInput);
				}
				regexp = new RegExp(regexp, 'ig');

				let sql = ' \
					SELECT GROUP_CONCAT(%COLUMNS%, ?1) \
					  FROM messagesText_content c \
					       LEFT JOIN messages m ON m.id = c.docid \
					       LEFT JOIN folderLocations f ON f.id = m.folderID \
					  WHERE f.folderURI = ?2 \
					'.replace('%COLUMNS%', columns.join(' || '));
				log('  sql => '+sql);
				let statement = this.DBConnection.createStatement(sql);
				statement.bindStringParameter(0, '\n');
				statement.bindStringParameter(1, aFolder.folderURL);

				var sources;
				while (statement.executeStep())
				{
					sources = statement.getString(0);
				}
				statement.reset();

				terms = sources.replace(/\n/g, ' ').match(regexp);
				if (terms && terms.length)
					terms = MigemoTextUtils.brushUpTerms(terms);
			}
		}
		catch(e) {
			log('getTermsList: '+e);
		}
		terms = terms || [];
		return terms;
	},

	init : function()
	{
		log('typeof MessageTextFilter => '+(typeof MessageTextFilter));
		if (typeof MessageTextFilter != 'undefined' &&
			!('__xm__appendTerms' in MessageTextFilter)) {
			MessageTextFilter.__xm__appendTerms = MessageTextFilter.appendTerms;
			MessageTextFilter.appendTerms = this.MessageTextFilter_appendTerms;
		}

		this.columnNames = this.getActualColumnNames();
		log('columnNames => '+JSON.stringify(this.columnNames));
	},
	MessageTextFilter_appendTerms : function(aTermCreator, aTerms, aFilterValue)
	{
		var activeWindow = Cc['@mozilla.org/focus-manager;1']
							.getService(Ci.nsIFocusManager)
							.activeWindow;
		log('MessageTextFilter_appendTerms '+[activeWindow, aFilterValue.text, aFilterValue.states]);
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
			if (aFilterValue.states.attachment)
				targets |= XMigemoMail.FIND_ATTACHMENT;
			let terms = XMigemoMail.getTermsList(
					aFilterValue.text,
					targets,
					activeWindow.gDBView.msgFolder
				);
			log('  terms => '+terms);
			if (terms.length)
				aFilterValue.text = terms.join(' | ');
		}

		return this.__xm__appendTerms(aTermCreator, aTerms, aFilterValue);
	}
};

XMigemoMail.init();
