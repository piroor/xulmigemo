var XMigemoCombinationService = {
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


	overrideAutoCompleteManager : function()
	{
		eval('window.acm_applyFilters = '+
			window.acm_applyFilters.toSource().replace(
				/var (titleMatchPos) = (candidate.strippedTitle.indexOf\([^)]+\));/,
				<><![CDATA[
					var $1 = XMigemoService.getPref('xulmigemo.combination.autocompletemanager') ?
						candidate.title.search(XMigemoCore.getCachedRegExp(acm_typedPrefix)) :
						$2;
				]]></>
			)
		);
	},


	init : function() {
		window.removeEventListener('load', this, false);

		if ('acm_applyFilters' in window)
			this.overrideAutoCompleteManager();
	},

	destroy : function() {
		window.removeEventListener('unload', this, false);
	}
};

window.addEventListener('load', XMigemoCombinationService, false);
window.addEventListener('unload', XMigemoCombinationService, false);

