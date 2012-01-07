$(window).load(function() {

	// get the standard spotify api
	var sp = getSpotifyApi(1);

	// get the spotify models
	var m = sp.require('sp://import/scripts/api/models');

	//
	var username = "KarlFreeman";
	var pagination = "1";

	function searchHypem(username,pagination) {

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
			console.log(username + " has " + total_songs + " favorite tracks spread across " + total_pages + " pages");

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
				search(track_name, artist_name);

			});

			//
			if (pagination !== total_pages) searchHypem(username,pagination+1);

		})
		.error(function() { alert("error"); });

	}

	function search(trackquery, artistquery) {

		console.log("Searching for " + trackquery + " by " + artistquery);

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

						// $("#search-results").append("<div>No results for '" + trackquery + " by " + artistquery + "'</div>");

					} else {

						$("#search-results").append('<div><a href="'+trackresult.uri+'">'+trackresult.name+'</a> by <a href="'+trackresult.album.artist.uri+'">'+trackresult.album.artist.name+'</a></div>');

					}

				} else {

					// $("#search-results").append("<div>No results for '" + trackquery + " by " + artistquery + "'</div>");

				}
			}

		});

	}

	searchHypem(username,1);

});