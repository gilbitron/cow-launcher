ig.module(
    'game.entities.trampoline'
)
.requires(
    'game.entities.booster'
)
.defines(function(){

	EntityTrampoline = EntityBooster.extend({

		size: {x: 201, y: 53},

		boostPowerMultiplier: 25,

		animSheet: new ig.AnimationSheet( 'media/trampoline.png', 201, 53 ),
		sound: new ig.Sound( 'media/audio/bounce.*' ),

		init: function( x, y, settings ) {
	        this.parent( x, y, settings );

	        this.addAnim( 'idle', 1, [0] );
	        this.addAnim( 'bounce', 0.5, [1,0], true );
	    },

	    afterCollide: function() {
			this.sound.play();
			this.currentAnim = this.anims.bounce;
	    }

	});

});