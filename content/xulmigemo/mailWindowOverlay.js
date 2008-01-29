window.addEventListener('load', function() {
	window.removeEventListener('load', arguments.callee, false);

	function getTextTables() {
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
		return {
			authors : authors.join('\n'),
			subjects : subjects.join('\n'),
			recipients : recipients.join('\n'),
			cc : cc.join('\n'),
		};
	}

	const kQuickSearchSubject = 0;
	const kQuickSearchFrom = 1;
	const kQuickSearchFromOrSubject = 2;
	const kQuickSearchBody = 3;
	const kQuickSearchRecipient = 5;


	eval('window.createSearchTerms = '+
		window.createSearchTerms.toSource().replace(
			'var termList = gSearchInput.value.split("|");',
			<><![CDATA[
				var termList;
				try {
					if (XMigemoService.getPref('xulmigemo.mailnews.threadsearch.enabled')) {
						var tables = getTextTables();
						var table = [];
						if (gSearchInput.searchMode == kQuickSearchSubject || gSearchInput.searchMode == kQuickSearchFromOrSubject)
							table.push(tables.subjects);
						if (gSearchInput.searchMode == kQuickSearchFrom || gSearchInput.searchMode == kQuickSearchFromOrSubject)
							table.push(tables.authors);
						if (gSearchInput.searchMode == kQuickSearchRecipient) {
							table.push(tables.recipients);
							table.push(tables.cc);
						}
						if (table.length) {
							table = table.join('\n');
							termList = table.match(new RegExp(XMigemoCore.getRegExp(gSearchInput.value), 'ig'));
						}
dump('TERMS : \n'+termList.join('\n')+'\n');
					}
				}
				catch(e) {
					dump(e+'\n');
				}
				if (!termList) {
					termList = gSearchInput.value.split('|');
				}
			]]></>
		)
	);

}, false);
