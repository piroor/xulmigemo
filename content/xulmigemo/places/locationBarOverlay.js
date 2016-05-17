(function() {
function log(...aArgs) 
{
	if (Services.prefs.getBoolPref('xulmigemo.debug.all') ||
		Services.prefs.getBoolPref('xulmigemo.debug.places'))
		Services.console.logStringMessage('locationbar: ' + aArgs.join(', '));
}

var { XMigemoPlaces } = Cu.import('resource://xulmigemo-modules/places.jsm', {});

window.XMigemoLocationBarOverlay = { 
	get bar() 
	{
		return document.getElementById('urlbar');
	},
 
	get input() 
	{
		return MigemoAPI.trimFunctionalInput(this.bar.value);
	},
 
	get panel() 
	{
		if (!this._panel)
			this._panel = document.getElementById('PopupAutoCompleteRichResult');
		return this._panel;
	},
	_panel : null,
 
	get listbox() 
	{
		return this.panel.richlistbox;
	},
 
	get items() 
	{
		return this.listbox.children;
	},

	get isMigemoActive() 
	{
		return (
			Services.prefs.getBoolPref('xulmigemo.places.locationBar') &&
			Services.prefs.getBoolPref('browser.urlbar.autocomplete.enabled') &&
			!this.bar.disableAutoComplete &&
			(
				!this.bar.valueIsTyped ||
				XMigemoPlaces.isValidInput(this.input)
			)
		);
	},
  
	handleEvent : function(aEvent) 
	{
		switch (aEvent.type)
		{
			case 'load':
				this.init();
				break;
		}
	},
  
	init : function() 
	{
		window.removeEventListener('load', this, false);

		this.panel.__xm__appendCurrentResult = this.panel._appendCurrentResult;
		this.panel._appendCurrentResult = function(...aArgs) {
			var result = this.__xm__appendCurrentResult(...aArgs);
			if (XMigemoLocationBarOverlay.isMigemoActive) {
				let findInfo = XMigemoPlaces.parseInput(XMigemoLocationBarOverlay.input);
				let controller = this.mInput.controller;
				Array.forEach(XMigemoLocationBarOverlay.items, function(aItem, aIndex) {
					if (!aItem.getAttribute('text'))
						return;
					var source = [aItem.getAttribute('url'), aItem.getAttribute('title')].join('\n');
					var terms = source.match(findInfo.termsRegExp);
					if (!terms)
						return;

					var found = {};
						terms = Array.slice(terms, 0).filter(function(aTerm) {
							if (found[aTerm])
								return false;
							return found[aTerm] = true;
						}).join(' ');
						log('item' + aIndex + ': highlight => '+terms);
						aItem.setAttribute('text', terms);

					// we must reset all other attributes also, to reset emphasys
					aItem.setAttribute('image', controller.getImageAt(aIndex));
					aItem.setAttribute('title', controller.getCommentAt(aIndex));
					aItem.setAttribute('url', controller.getValueAt(aIndex));
					aItem.setAttribute('type', controller.getStyleAt(aIndex));

						aItem._adjustAcItem();
				});
			}
			return result;
		};
	}
}; 
 
window.addEventListener('load', XMigemoLocationBarOverlay, false); 
})();
