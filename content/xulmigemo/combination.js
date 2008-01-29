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
				'var titleMatchPos = candidate.title.toLowerCase().indexOf(acm_typedPrefix);',
				<><![CDATA[
					var titleMatchPos = XMigemoService.getPref('xulmigemo.combination.autocompletemanager') ?
						candidate.title.search(new RegExp(XMigemoCore.getRegExp(acm_typedPrefix), 'i')) :
						candidate.title.toLowerCase().indexOf(acm_typedPrefix);
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

