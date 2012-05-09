/*
 * You tube to mp3 download
 */ 

var request = require('request');
var fs = require('fs');
var events = require('events');
var eventEmitter = new events.EventEmitter();

var folder = './playlists/';

var gl_playlist_id = null;
var video_progression = 0;
var heartbeat = 0;

var gl_total = 0;

var SALVE_RATE = 3;
var BY_GROUP_OF = 50;

// multiplication de by_group_of pour la progression
var gl_current_cursor = 0;

eventEmitter.on('heartbeat', function(obj){ 
    heartbeat++;
    if (heartbeat == SALVE_RATE) {
	setTimeout(function() {
	    heartbeat = 0;
	    for_spe(obj);
	}, 20);
    }
});

function process_scode(video, sCode, callback) {
    
    request('http://www.youtube-mp3.org/api/itemInfo/?video_id=' + sCode, function(err, res, body) {	
	
	try { 
	    var obj = eval('{' + body + '}');
	} catch(e) {
	    console.log('Error in parsing JSON ' + e + ' for video ' + video.id);
	    callback();
	    return ;
	}
	
	
	if (info.status == 'loading' || 
	    info.status == 'converting' || 
	    info.status == 'pending') {
	    
	    setTimeout(function() {
		console.log('--------------- Iterating system');
		process_scode(video, sCode, callback);
	    }, 3000);

	    return;
	}
	
	try {
	    var filename = video
		.title
		.replace(/,/g,"")
		.replace(/"/g, "")
		.replace(/\//g, "")
		+ '.mp3';
	    
	    request('http://www.youtube-mp3.org/get?video_id=' + video.id + '&amp;h=' + obj.h, function() {	
		console.log('Successfull writing ' + video.title + '.mp3');
		callback();
	    }).pipe(fs.createWriteStream(folder + filename));
	}
	catch (e) {
	    console.log('#### ' + e + ' ' + obj);
	    callback();
	}
    });    
}

function get_mp3_from_id(video, callback) {
    gl_total++;
    console.log('+- Get ' + video.title + ' with id = ' + video.id);

    var push_url = "http://www.youtube-mp3.org/api/pushItem/?item=" + escape("http://www.youtube.com/watch?v=" + video.id) + "&xy=yx&bf=false";
    console.log('_----s------------ '+ push_url);
    request({url : push_url, 
	     headers : {
		 "Accept-Location": "*",
		 "Referrer": "http://www.youtube-mp3.org/"
	     }}, function(err, res, body) {
		 process_scode(video, body, function() { callback() });	
	     });
}

function get_musics_from_playlist(pl_id, callback) {
    console.log('+- Getting the playlist ' + pl_id);
    var url;

    if (gl_current_cursor == 0)
	url = 'http://gdata.youtube.com/feeds/api/playlists/' + pl_id + '?v=2&alt=jsonc&max-results=' + BY_GROUP_OF;
    else {
	url = 'http://gdata.youtube.com/feeds/api/playlists/' + pl_id + '?v=2&alt=jsonc&max-results=' + BY_GROUP_OF + '&start-index=' + gl_current_cursor;
    }
	console.log('Requested URL = ' + url);

    request({url : url}, function(err, res, body) {
	var obj = JSON.parse(body).data;
	console.log('Author = ' + obj.author
		    + '\nPlaylist name = ' + obj.title
		    + '\nVideo number = ' + obj.totalItems);
	callback(obj);
    });
}

function for_spe(obj) {
    var flag = false;

    var i = video_progression;

    if (obj.items == undefined) {
	throw "Playlist processed";
    }

    if (obj.items.length == i)
	flag = true;
    for (i;
	 i < SALVE_RATE + video_progression && i < obj.items.length; 
	 i++)
    {
	get_mp3_from_id(obj.items[i].video, function() {
	    eventEmitter.emit('heartbeat', obj);
	    video_progression++;
	});
    }

    if (obj.items.length == i && flag == false) {
	eventEmitter.emit('launch');
    }
    
}


eventEmitter.on('launch', function(){
    console.log('+------------------------------------------+' + gl_total);
    console.log('+--- new launch');
    video_progression = 0;
    gl_current_cursor += BY_GROUP_OF;
    heartbeat = 0;
    get_musics_from_playlist(gl_playlist_id, function(obj) {
	for_spe(obj);
    });
});


if (process.argv[3]) {
    gl_current_cursor = parseInt(process.argv[3]);
}

gl_playlist_id = process.argv[2];

get_musics_from_playlist(gl_playlist_id, function(obj) {
    folder += obj.title + '/';

    fs.mkdir(folder, 0777, function() {	
	for_spe(obj);
    });
});
// get_mp3_from_id('KMU0tzLwhbE', 'test');