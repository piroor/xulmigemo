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
			Components.utils.import('resource://modules/gloda/datastore.js');

		return GlodaDatastore.asyncConnection;
	},
 
	kQuickSearchSubject       : 0, 
	kQuickSearchFrom          : 1,
	kQuickSearchFromOrSubject : 2,
	kQuickSearchBody          : 3,
	kQuickSearchRecipient     : 5,
 
	getTermsList : function(aInput, aSearchMode, aFolder) 
	{
		aFolder.QueryInterface(Ci.nsIMsgFolder);
		var terms = [];
		try {
			var columns = [];
			if (aSearchMode == this.kQuickSearchSubject ||
				aSearchMode == this.kQuickSearchFromOrSubject) {
				columns.push('c0subject');
			}
			if (aSearchMode == this.kQuickSearchBody) {
				columns.push('c1body');
			}
			if (aSearchMode == this.kQuickSearchFrom ||
				aSearchMode == this.kQuickSearchFromOrSubject) {
				columns.push('c3author');
			}
			if (aSearchMode == this.kQuickSearchRecipient) {
				columns.push('c4recipients');
			}
			if (columns.length) {
				let regexp;
				if (
					XMigemoService.getPref('xulmigemo.autostart.regExpFind') &&
					XMigemoService.TextUtils.isRegExp(aInput)
					) {
					regexp = XMigemoService.TextUtils.extractRegExpSource(aInput);
				}
				else {
					regexp = migemo.getRegExp(aInput);
				}
				regexp = new RegExp(regexp, 'ig');

				let sql = <![CDATA[
				]]>.toString().replace('%COLUMNS%', columns.join(','));

				columns = columns.join(', ');
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
	}
};
