ig.module(
    'game.entities.stopper'
)
.requires(
    'plugins.box2d.entity'
)
.defines(function(){

	EntityStopper = ig.Entity.extend({

		type: ig.Entity.TYPE.B,
		checkAgainst: ig.Entity.TYPE.A,
		bounciness: 0,
		gravityFactor: 3,

		_hasCollided: false,

		init: function( x, y, settings ) {
			this.parent( x, y, settings );
			this.friction.x = 1;
		},

		update: function() {
	    	if(this.pos.x < ig.game.screen.x - ig.system.width) this.kill();
	    	this.parent();
	    },

		collideWith: function( other, axis ){
			if(this._hasCollided) return; // Only collide once

			this._hasCollided = true;
	    	this.afterCollide();
	    },

		afterCollide: function() {}

	});

});