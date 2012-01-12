$(document).ready(function() {

	$('.logo').
		css({ x: '200px' }).
		transition({ x: 0, delay: 800 }, 500, 'in-out');

	$('.fields').
		css({ opacity: 0 }).
		transition({ opacity: 1, delay:1000 }, 600, 'in-out');


});