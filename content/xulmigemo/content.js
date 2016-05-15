(function(global) {
	var Cc = Components.classes;
	var Ci = Components.interfaces;
	var Cu = Components.utils;
	var Cr = Components.results;

	var { Services } = Cu.import('resource://gre/modules/Services.jsm', {});

	var { MigemoConstants } = Cu.import('resource://xulmigemo-modules/constants.jsm', {});
	Cu.import('resource://xulmigemo-modules/finder.jsm', {});
	Cu.import('resource://xulmigemo-modules/remoteFinder.jsm', {});

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
			case MigemoConstants.COMMAND_SHUTDOWN:
				global.removeMessageListener(MigemoConstants.MESSAGE_TYPE, handleMessage);
				free();
				return;
		}
	}
	global.addMessageListener(MigemoConstants.MESSAGE_TYPE, handleMessage);
})(this);