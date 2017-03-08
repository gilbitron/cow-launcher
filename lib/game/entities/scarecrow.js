ig.module(
    'game.entities.scarecrow'
)
.requires(
    'game.entities.stopper'
)
.defines(function(){

	EntityScarecrow = EntityStopper.extend({

		size: {x: 163, y: 200},

		animSheet: new ig.AnimationSheet( 'media/scarecrow.png', 163, 200 ),

		sound: new ig.Sound( 'media/audio/cow.*' ),

		init: function( x, y, settings ) {
	        this.parent( x, y, settings );

	        this.addAnim( 'idle', 1, [0] );
	    },

	    draw: function() {
			this.parent();
		},

	    afterCollide: function() {
			this.sound.play();
	    }

	});

});