Components.utils.import('resource://gre/modules/Services.jsm');
Components.utils.import('resource://xulmigemo-modules/service.jsm'); 
Components.utils.import('resource://xulmigemo-modules/places.jsm');

(function() {

var { MigemoLog } = Components.utils.import('resource://xulmigemo-modules/log.jsm', {});
function log(...aArgs) { MigemoLog('places.history', ...aArgs); }

var XMigemoHistoryPanelOverlay = { 
	 
	handleEvent : function(aEvent) 
	{
		window.removeEventListener('load', this, false);

		var tree = document.getElementById('historyTree');
		tree.__xm__load = tree.load;
		tree.load = function(aQueries, aOptions) {
			if (!this.__xm__callingFromProgressiveLoad)
				XMigemoPlaces.stopProgressiveLoad(this);
			if (!this.__xm__callingFromProgressiveLoad &&
				aQueries.length == 1 &&
				XMigemoService.getMyPref('places.historyPanel') &&
				XMigemoPlaces.isValidInput(aQueries[0].searchTerms)) {
				log(' => override');
				XMigemoPlaces.startProgressiveLoad(aQueries[0], aOptions, this,
					XMigemoPlaces.historyInRangeSQL);
			}
			else {
				log(' => default');
				return this.__xm__load(aQueries, aOptions);
			}
		};
	}
 
}; 
  
window.addEventListener('load', XMigemoHistoryPanelOverlay, false); 
 	
})();
