//
// Pause/play home video - the HTML5 video is underneath (bu z-index) the .home-hero translucent layer.
// So we need to detect the clicks on the .home-hero layer and then toggle the play/pause of the HTML5 video.
//
jQuery(".home-hero").on('click', function(event) {
	//event.preventDefault();
	var video = jQuery("#home-video");

	// Detect play/pause state of video and toggle
	if (video.get(0).paused) {
		video.get(0).play();
	} else {
		video.get(0).pause();
	}
});
