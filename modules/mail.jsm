var TEST = false; 

const EXPORTED_SYMBOLS = ['XMigemoMail'];

const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import('resource://xulmigemo-modules/service.jsm');
Components.utils.import('resource://xulmigemo-modules/migemo.jsm');

var XMigemoMail = {
	get DBConnection()
	{
		if (typeof GlodaDatastore === 'undefined')
			Components.utils.import('resource:///modules/gloda/datastore.js');

		return GlodaDatastore.syncConnection;
	},
 
	kQuickSearchSubjectFromOrRecipient : 0,
	kQuickSearchFromOrSubject          : 1,
	kQuickSearchRecipientOrSubject     : 2,
	kQuickSearchSubject                : 3,
	kQuickSearchFrom                   : 4,
	kQuickSearchRecipient              : 5,
	kQuickSearchBody                   : 6,
 
	getTermsList : function(aInput, aSearchMode, aFolder) 
	{
		aFolder.QueryInterface(Ci.nsIMsgFolder);
		var terms = [];
		try {
			var columns = [];
			if (aSearchMode == this.kQuickSearchSubjectFromOrRecipient ||
				aSearchMode == this.kQuickSearchFromOrSubject ||
				aSearchMode == this.kQuickSearchRecipientOrSubject ||
				aSearchMode == this.kQuickSearchSubject) {
				columns.push('c.c0subject');
			}
			if (aSearchMode == this.kQuickSearchBody) {
				columns.push('c.c1body');
			}
			if (aSearchMode == this.kQuickSearchSubjectFromOrRecipient ||
				aSearchMode == this.kQuickSearchFromOrSubject ||
				aSearchMode == this.kQuickSearchFrom) {
				columns.push('c.c3author');
			}
			if (aSearchMode == this.kQuickSearchSubjectFromOrRecipient ||
				aSearchMode == this.kQuickSearchRecipientOrSubject ||
				aSearchMode == this.kQuickSearchRecipient) {
				columns.push('c.c4recipients');
			}
			if (columns.length) {
				columns = columns.map(function(aColumn) {
					return 'COALESCE(' + aColumn + ', "")';
				});

				let regexp;
				if (
					XMigemoService.getPref('xulmigemo.autostart.regExpFind') &&
					XMigemoService.TextUtils.isRegExp(aInput)
					) {
					regexp = XMigemoService.TextUtils.extractRegExpSource(aInput);
					regexp = new RegExp(regexp, 'ig');
				}
				else {
					regexp = migemo.query(aInput);
				}
				regexp = new RegExp(regexp, 'ig');

				let sql = <![CDATA[
					SELECT GROUP_CONCAT(%COLUMNS%, ?1)
					  FROM messagesText_content c
					       LEFT JOIN messages m ON m.id = c.docid
					       LEFT JOIN folderLocations f ON f.id = m.folderID
					 WHERE f.folderURI = ?2
				]]>.toString().replace('%COLUMNS%', columns.join(' || '));
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
				if (terms)
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
	}
};
