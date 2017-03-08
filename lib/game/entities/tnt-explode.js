ig.module(
    'game.entities.tnt-explode'
)
.requires(
    'plugins.box2d.entity'
)
.defines(function(){

	EntityTntExplode = ig.Entity.extend({

		type: ig.Entity.TYPE.B,
		checkAgainst: ig.Entity.TYPE.NONE,

		size: {x: 294, y: 239},
		isSensor: true,
		gravityFactor: 0,

		animSheet: new ig.AnimationSheet( 'media/tnt-explode.png', 294, 239 ),

		init: function( x, y, settings ) {
	        this.parent( x, y, settings );

	        this.addAnim( 'explode', 0.04, [0,1,2,3,4,5,6,7,8,9,10], true );
	    },

	    update: function() {
	    	if(this.pos.x < ig.game.screen.x - ig.system.width) this.kill();
	    	this.parent();
	    }

	});

});