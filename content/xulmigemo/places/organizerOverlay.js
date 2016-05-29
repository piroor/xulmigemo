Components.utils.import('resource://gre/modules/Services.jsm');
Components.utils.import('resource://xulmigemo-modules/service.jsm'); 
Components.utils.import('resource://xulmigemo-modules/places.jsm');

(function() {
var { MigemoLog } = Components.utils.import('resource://xulmigemo-modules/log.jsm', {});
function log(...aArgs) { MigemoLog('places.organizer', ...aArgs); }

window.XMigemoOrganizerOverlay = { 
	 
	handleEvent : function(aEvent) 
	{
		window.removeEventListener('load', this, false);

		Object.defineProperty(ContentArea, '__xm__currentView',
			Object.getOwnPropertyDescriptor(ContentArea, 'currentView'));
		Object.defineProperty(ContentArea, 'currentView', {
			get: function() {
				XMigemoOrganizerOverlay.updateView(this.__xm__currentView);
				return this.__xm__currentView;
			},
			set: function(aNewView) {
				return this.__xm__currentView = aNewView;
			}
		});
	},

	updateView : function(aView)
	{
		if (aView.__xm__load)
			return;

		aView.__xm__load = aView.load;
		aView.load = function(aQueries, aOptions) {
			if (!this.__xm__callingFromProgressiveLoad)
				XMigemoPlaces.stopProgressiveLoad(this);
			if (!this.__xm__callingFromProgressiveLoad &&
				aQueries.length == 1 &&
				XMigemoService.getMyPref('places.organizer') &&
				XMigemoPlaces.isValidInput(aQueries[0].searchTerms)) {
				log(' => override');
				XMigemoPlaces.startProgressiveLoad(aQueries[0], aOptions, this,
					aOptions.queryType == Ci.nsINavHistoryQueryOptions.QUERY_TYPE_HISTORY ?
						XMigemoPlaces.historyInRangeSQL :
						XMigemoPlaces.bookmarksInRangeSQL,
					XMigemoOrganizerOverlay.saveCommand);
			}
			else {
				log(' => default');
				if (XMigemoOrganizerOverlay.saveCommand)
					XMigemoOrganizerOverlay.saveCommand.removeAttribute('disabled');
				return this.__xm__load(aQueries, aOptions);
			}
		};
	},

	get saveCommand()
	{
		return document.getElementById('OrganizerCommand_search:save');
	}
 
}; 
  
window.addEventListener('load', XMigemoOrganizerOverlay, false); 
})();
 	
