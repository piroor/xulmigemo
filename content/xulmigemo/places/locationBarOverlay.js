var XMigemoLocationBarOverlay = { 
	get resolversBox()
	{
		if (!this._resolversBox)
			this._resolversBox = document.getElementById('XMigemoLocationBarSearchResolvers');
		return this._resolversBox;
	},
	_resolversBox : null,
 
	resolvers : [],
	 
	handleEvent : function(aEvent) 
	{
		window.removeEventListener('load', this, false);
	},

	createNewResolver : function()
	{
		var id = Math.floor(Math.random() * 65000);

		var panel = document.createElement('panel');
		panel.setAttribute('id', 'hidden-popup-'+id);
		panel.setAttribute('type', 'autocomplete-richlistbox');
		panel.setAttribute('hidden', true);

		var textbox = document.createElement('textbox');
		textbox.setAttribute('id', 'hidden-locationbar-'+id);
		textbox.setAttribute('type', 'autocomplete');
		textbox.setAttribute('autocompletesearch', 'history');
		textbox.setAttribute('autocompletepopup', 'hidden-popup-'+id);

		this.resolversBox.appendChild(panel);
		this.resolversBox.appendChild(textbox);

		return { textbox : textbox, panel : panel };
	},

	doSearch : function(aTerm, aResolver)
	{
		aResolver.textbox.open = true;
		aResolver.textbox.mController.startSearch(aTerm);
	}
 
}; 
  
window.addEventListener('load', XMigemoLocationBarOverlay, false); 
 	
