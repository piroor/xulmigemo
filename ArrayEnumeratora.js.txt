function ArrayEnumerator(aItems) 
{
	this._index = 0;
	this._contents = aItems;
}

ArrayEnumerator.prototype = {
	interfaces : [
		Components.interfaces.nsISimpleEnumerator,
		Components.interfaces.nsISupports
	],

	QueryInterface : function (iid)
	{
		if (!iid.equals(Components.interfaces.nsISimpleEnumerator) &&
			!iid.equals(Components.interfaces.nsISupports))
			throw Components.results.NS_ERROR_NO_INTERFACE;
		return this;
	},

	_index    : 0,
	_contents : [],

	hasMoreElements : function()
	{
		return this._index < this._contents.length;
	},
	getNext : function()
	{
		return this._contents[this._index++];
	}
};
 
