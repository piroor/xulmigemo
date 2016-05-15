(function(global) {
	var Cc = Components.classes;
	var Ci = Components.interfaces;
	var Cu = Components.utils;
	var Cr = Components.results;

	var { Services } = Cu.import('resource://gre/modules/Services.jsm', {});

	var { MigemoConstants } = Components.utils.import('resource://xulmigemo-modules/constants.jsm', {});
	Components.utils.import('resource://xulmigemo-modules/finder.jsm', {});

	function free()
	{
		free =
			Cc = Ci = Cu = Cr =
			Services =
			MigemoConstants =
			handleMessage =
				undefined;
	}

	function handleMessage(aMessage)
	{
		switch (aMessage.json.command)
		{
			case MigemoConstants.COMMAND_SET_FIND_MODE:
				
				return;

			case MigemoConstants.COMMAND_SHUTDOWN:
				free();
				return;
		}
	}
	global.addMessageListener(MigemoConstants.MESSAGE_TYPE, handleMessage);
})(this);