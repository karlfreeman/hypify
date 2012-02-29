// Standard spotify api
var sp = getSpotifyApi(1);

// Spotify models
var m = sp.require('sp://import/scripts/api/models');
var v = sp.require("sp://import/scripts/api/views");
var ui = sp.require("sp://import/scripts/ui");

// User details
var username = "";
var pagination = 1;

// Create a playlist object for songs
var tempPlaylist = new m.Playlist();

// Undocumented util for reacticting to internal changes
var r = sp.require("sp://import/scripts/react");

// Events to subscribe too
var windowLoad  = r.fromDOMEvent(window, "load");
var login  = r.fromDOMEvent(sp.core, "login");
var logout = r.fromDOMEvent(sp.core, "logout");

// Subscribe to when the user logs out
logout.subscribe(isLoggedOut);

// Subscribe to when the user logs in ( from logged out )
login.subscribe(isLoggedIn);

// Subscribe to the initial windowLoad
windowLoad.subscribe(init);

/*
// Debug logging
console.log(sp.core);
console.log(sp.trackPlayer);
console.log(sp.social);
*/

function init() {
	// console.log('init');

	// Check if the user isLoggedIn
	isLoggedIn();

}

function isLoggedIn() {
	// console.log('loggedIn');

	// Is the user logged in? ( online )
	if (sp.core.getLoginMode() == 1) {

		// Set the current user
		$('.username-prompt').html(sp.core.user.username);
		$('.form .username-prompt').live('click', usernamePromt);

		// Animate in the UI
		$('.connection').transition({ opacity: 0 }, 500, 'in-out');
		$('.logo').transition({ x: 0, delay: 800 }, 500, 'in-out');
		$('.fields').transition({ opacity: 1, delay:1000 }, 600, 'in-out');

		// Overwrite the form's post with some validation
		$('.form').submit(function () {

			// Only if the user has a username
			if( $('.form .username').val() !== "" ){
				submitForm();
			}

			return false;
		});

	} else {

		// Show the 'no connection...'
		$('.connection').transition({ opacity: 1 }, 500, 'in-out');

	}

}

function isLoggedOut() {
	// console.log('offline');
}


function submitForm() {

	//Lets keep hold of this for later
	username = $('.form .username').val();

	// Disable the form from multiple submissions ( and visually )
	disableForm();

	// Go go, gadet $.ajax
	$.ajax({
		type: 'GET',
		url: 'http://hypem.com/'+ username +'/?ax=1',
		dataType: 'html'
	})
	.success(function(data, textStatus, xhr) {

		// Success, lets parse away
		if (xhr.status == 200)  {
			usernameFound();
		// Just in case of any 302's
		} else {
			enableForm();
		}

	})
	.error(function(data, textStatus, xhr) {

		// Woah, there. Lets make sure there isn't a typo in the username
		enableForm();

	});

}

function usernamePromt() {

	$('.form .username').val($('.form .username-prompt').text());
	submitForm();

}

function disableForm() {

	$('.form .username').attr('disabled', 'disabled');
	$('.form .username').attr('selectable', 'true');
	$('.form .username').css('-webkit-user-select', 'none');
	$('.form .submit').attr('disabled', 'disabled');
	$('.form .username-prompt').die('click', usernamePromt);
	$('.fields').transition({ opacity: 0.5 }, 400, 'in-out');
}

function enableForm() {

	$('.form .username').removeAttr('disabled');
	$('.form .username').removeAttr('selectable');
	$('.form .username').css('-webkit-user-select', '');
	$('.form .submit').removeAttr('disabled');
	$('.form .username-prompt').live('click', usernamePromt);
	$('.fields').transition({ opacity: 1 }, 400, 'in-out');
	
}

function usernameFound() {

	$('.fields').
		transition({ opacity: 0 }, 400, 'in-out').
		transition({ display: 'none', delay: 10 }, 400);


	$('.logo').
		transition({ x: 190, delay: 300 }, 400, 'in-out').
		transition({ opacity: 0, delay: 100 }, 400, 'in-out').
		transition({ display: 'none', delay: 10 }, 400);
	

	$('.loading').
		transition({ opacity: 1, delay: 1200 }, 200, 'in-out', function() {
			hypemSearching();
			searchHypem();
		});
		
	$('header').
		transition({ y: 0, delay: 1200 }, 400, 'in-out');
	
}

function hideLoading() {
	
	$('.loading').
		transition({ opacity: 0 }, 400, 'in-out').
		transition({ display: 'none', delay: 10 }, 400);

}

function searchHypem() {

	// console.log('http://hypem.com/'+ username +'/'+ pagination +'/?ax=1');

	$.ajax({
		type: 'GET',
		url: 'http://hypem.com/'+ username +'/'+ pagination +'/?ax=1',
		dataType: 'html'
	})
	.success(function(data) {

		// Grab the html page
		var doc = data;

		// Crunch down to find the total songs
		var total_songs = $(doc).find(".user-stats ul li.top:eq(0) a em").text();

		// Lets figure out how many paginations we will allow
		var total_pages = Math.ceil(total_songs / 20);

		//
		// console.log(username + " has " + total_songs + " favorite tracks spread across " + total_pages + " pages");

		var fragment;
		var artist_name;
		var track_name;
		$(doc).find("//h3[class='track_name']").each(function(index, fragment) {

			// Crunch down to find the artist name and track name
			artist_name = $.trim($(fragment).find("a:eq(0)").text());
			track_name = $.trim($(fragment).find("a:eq(1)").text());

			//
			// console.log(track_name + " by " + artist_name);

			//
			searchSpotify(track_name, artist_name);

		});

		//
		if (pagination <= total_pages)  {
			pagination++;
			searchHypem(username,pagination);
		} else {
			hypemSearched();
		}

	})
	.error(function(data, textStatus, xhr) {

		console.log(textStatus);

	});

}

function hypemSearching() {
	
	var playlistArt = new v.Player();
		playlistArt.context = tempPlaylist;
		$("#search-results").append(playlistArt.node);
	
	var saveButton = "<button id='savePlaylist' class='add-playlist button icon'>Save As Playlist</button>";
		$("#search-results .sp-player").append(saveButton);
		$("#search-results .sp-player").css({ opacity: '0.5' });
	
	var playlistList = new v.List(tempPlaylist);
		playlistList.node.classList.add("temporary");
		$("#search-results").append(playlistList.node);

}

function hypemSearched() {

	$("#search-results .sp-player").transition({ opacity: 1 }, 400, 'in-out');

	$("#savePlaylist").live('click',function(e){
		sp.core.library.createPlaylist("Hypem Tracks", tempPlaylist.data.all());
		e.preventDefault();
	});

}

function searchSpotify(trackquery, artistquery) {

	// console.log("Searching for " + trackquery + " by " + artistquery);

	sp.core.search(trackquery, true, false, { // using "true, false" will include local results if available. no idea what the values represent!

		onSuccess: function(response) {

			var trackJWDistance = 0;
			var artistJWDistance = 0;

			var trackresult = null;

			if(response.tracks.length) {

				$.each(response.tracks, function(index,track) {

					trackJWDistance = fuzzySearch.jwDistance(trackquery,track.name);
					artistJWDistance = fuzzySearch.jwDistance(artistquery,track.album.artist.name);

					//console.log(trackquery + " / " + track.name + " | " + trackJWDistance);
					//console.log(artistquery + " / " + track.album.artist.name + " | " + artistJWDistance);

					if (trackJWDistance > 0.9 && artistJWDistance > 0.9) {
						trackresult = track;
					}

				});


				if (trackresult === null) {

					// $("#failed-results").append("<div>No results for '" + trackquery + " by " + artistquery + "'</div>");

				} else {

					tempPlaylist.add(m.Track.fromURI(trackresult.uri));

					// $("#search-results").append('<div><a href="'+trackresult.uri+'">'+trackresult.name+'</a> by <a href="'+trackresult.album.artist.uri+'">'+trackresult.album.artist.name+'</a></div>');


				}

			} else {

				// $("#failed-results").append("<div>No results for '" + trackquery + " by " + artistquery + "'</div>");

			}
			
			
			if($('.loading').css('opacity') == 1) {
				hideLoading();
			}

		}

	});

}