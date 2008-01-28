window.addEventListener('load', function() {
	window.removeEventListener('load', arguments.callee, false);

	eval('window.createSearchTerms = '+
		window.createSearchTerms.toSource().replace(
			'var termList = gSearchInput.value.split("|");',
			<><![CDATA[
				var termList;
				try {
					if (XMigemoService.getPref('xulmigemo.mailnews.threadsearch.enabled')) {
						termList = XMigemoCore.flattenRegExp(
							XMigemoCore.getRegExp(gSearchInput.value)
						);
					}
					termList = termList.slice(0, XMigemoService.getPref('xulmigemo.mailnews.threadsearch.max'));
					dump(termList.length+'\n'+termList.join('\n')+termList.length+'\n');
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
