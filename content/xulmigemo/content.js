(function(global) {
	var Cc = Components.classes;
	var Ci = Components.interfaces;
	var Cu = Components.utils;
	var Cr = Components.results;

	var { Services } = Cu.import('resource://gre/modules/Services.jsm', {});

	Components.utils.import('resource://xulmigemo-modules/finder.jsm', {});

	var MESSAGE_TYPE = '{01F8DAE3-FCF4-43D6-80EA-1223B2A9F025}';

	function free()
	{
		free =
			Cc = Ci = Cu = Cr =
			Services =
			MESSAGE_TYPE =
			handleMessage =
				undefined;
	}

	function handleMessage(aMessage)
	{
		switch (aMessage.json.command)
		{
			case 'shutdown':
				free();
				return;
		}
	}
	global.addMessageListener(MESSAGE_TYPE, handleMessage);
})(this);