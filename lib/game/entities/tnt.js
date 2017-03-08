ig.module(
    'game.entities.tnt'
)
.requires(
    'game.entities.booster',
    'game.entities.tnt-explode'
)
.defines(function(){

	EntityTnt = EntityBooster.extend({

		size: {x: 65, y: 77},

		boostPowerMultiplier: 50,

		animSheet: new ig.AnimationSheet( 'media/tnt.png', 65, 77 ),
		sound: new ig.Sound( 'media/audio/bomb.*' ),

		init: function( x, y, settings ) {
	        this.parent( x, y, settings );

	        this.addAnim( 'idle', 1, [0] );
	    },

	    afterCollide: function() {
			this.sound.play();
			ig.game.spawnEntity(EntityTntExplode, this.pos.x - 110, this.pos.y - 176);
			this.kill();
	    }

	});

});