var XMigemoLocationBarOverlay = { 
	 
	get resolversBox() 
	{
		if (!this._resolversBox)
			this._resolversBox = document.getElementById('XMigemoLocationBarSearchResolvers');
		return this._resolversBox;
	},
	_resolversBox : null,
 
	handleEvent : function(aEvent) 
	{
		window.removeEventListener('load', this, false);
	},
 
	createNewResolver : function() 
	{
		var resolver = new XMigemoLocationBarSearchResolver();
		this.resolversBox.appendChild(resolver.panel);
		this.resolversBox.appendChild(resolver.textbox);
		return resolver;
	}
 
}; 
 
window.addEventListener('load', XMigemoLocationBarOverlay, false); 
  
function XMigemoLocationBarSearchResolver() 
{
	this.init();
}
XMigemoLocationBarSearchResolver.instances = {};
XMigemoLocationBarSearchResolver.prototype = {
	 
	init : function() 
	{
		this.id = Math.floor(Math.random() * 65000);

		var panel = document.createElement('panel');
		panel.setAttribute('id', 'hidden-popup-'+this.id);
		panel.setAttribute('resolver-id', this.id);
		panel.setAttribute('type', 'autocomplete-richlistbox');
		this.panel = panel;

		var textbox = document.createElement('textbox');
		textbox.setAttribute('id', 'hidden-locationbar-'+this.id);
		textbox.setAttribute('resolver-id', this.id);
		textbox.setAttribute('type', 'autocomplete');
		textbox.setAttribute('autocompletesearch', 'history');
		textbox.setAttribute('autocompletepopup', 'hidden-popup-'+this.id);
		textbox.setAttribute('onsearchcomplete', 'XMigemoLocationBarSearchResolver.instances[this.getAttribute("resolver-id")].onSearchComplete();');
		this.textbox = textbox;

		XMigemoLocationBarSearchResolver.instances[this.id] = this;
	},
 
	destroy : function() 
	{
		this.textbox.mController.startSearch("");
		this.textbox.open = false;
		this.panel.parentNode.removeChild(this.panel);
		this.panel = null;
		this.textbox.parentNode.removeChild(this.textbox);
		this.textbox = null;
		delete XMigemoLocationBarSearchResolver.instances[this.id];
	},
 
	get listbox() 
	{
		return document.getAnonymousNodes(this.panel)[0];
	},
 
	get items() 
	{
		return this._items;
	},
	_items : [],
 
	doSearch : function(aTerm) 
	{
		this.textbox.open = true;
		this.textbox.mController.startSearch(aTerm);
	},
 
	onSearchComplete : function() 
	{
		this._items = this.listbox.children;
		this._items.forEach(function(aItem) {
			aItem.frecency = XMigemoPlaces.getFrecencyFromURI(aItem.getAttribute('url'));
			aItem.setAttribute('frecency', aItem.frecency);
		});
		this.destroy();
	}
 
}; 
 	 
