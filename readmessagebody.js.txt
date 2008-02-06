var hdr = gDBView.db.GetMsgHdrForKey(gDBView.keyForFirstSelectedMessage);
var folder = gDBView.msgFolder;


var stream = folder.getOfflineFileStream(hdr.messageKey, {}, {})
	.QueryInterface(Components.interfaces.nsISeekableStream)
	.QueryInterface(Components.interfaces.nsILineInputStream);
stream.seek(stream.NS_SEEK_SET, hdr.messageOffset);

var multipart = false;
var boundary = '';
var charset = null;

var charsetRegExp = /Content-Type:[^;]+;.*charset=([^;\s]+)/;

// read header
var line = {};
while (stream.readLine(line))
{
	if (!charset && charsetRegExp.test(line.value)) {
		charset = RegExp.$1;
	}
	if (line.value.indexOf('multipart/') || line.value.indexOf('message/')) {
		multipart = true;
	}
	if (!boundary && line.value.indexOf('boundary=') > -1) {
		boundary = line.value.substring(line.value.indexOf('"')+1);
		boundary = '--' + boundary.substring(0, boundary.indexOf('"'));
	}
	if (!line.value) break;
}

// read body
var msg = [];
var count  = hdr.lineCount;
for (var i = 0; i < count; i++)
{
	if (!stream.readLine(line)) break;
	msg.push(line.value);
}

stream.close();

var UConv = Components
	.classes['@mozilla.org/intl/scriptableunicodeconverter']
	.getService(Components.interfaces.nsIScriptableUnicodeConverter);

msg = msg.join('\n');
if (multipart && boundary) {
	var parts = msg.split(boundary+'\n');
	msg = [];
	for (var i in parts)
	{
		parts[i] = parts[i].split('\n\n');
		if (parts[i][0].indexOf('Content-Type: text/') < 0) continue;
		charsetRegExp.test(parts[i][0]);
		parts[i].splice(0, 1);
		var body = parts[i].join('\n\n');
		if (RegExp.$1) {
			UConv.charset = RegExp.$1;
			body = UConv.ConvertToUnicode(body);
		}
		msg.push(body);
	}

	msg = msg.join('\n\n');
}
else if (charset) {
	UConv.charset = charset;
	msg = UConv.ConvertToUnicode(msg);
}


_setClipBoard(msg);

