ig.module(
    'game.entities.booster'
)
.requires(
    'plugins.box2d.entity'
)
.defines(function(){

	EntityBooster = ig.Entity.extend({

		type: ig.Entity.TYPE.B,
		checkAgainst: ig.Entity.TYPE.A,
		isSensor: true,
		gravityFactor: 0,

		boostAngle: 315,
		boostPowerMultiplier: 1.5,
		minPower: 2000,
		_hasCollided: false,

		update: function() {
	    	if(this.pos.x < ig.game.screen.x - ig.system.width) this.kill();
	    	this.parent();
	    },

		collideWith: function( player, axis ) {
			if(this._hasCollided) return; // Only collide once

			if(typeof player.applyForce !== 'undefined'){
				var power = player.body.GetLinearVelocity().Length() * this.boostPowerMultiplier;
				if(power < this.minPower) power = this.minPower;
				player.applyForce( this.boostAngle, power );
			}

			this._hasCollided = true;
			this.afterCollide();
		},

		afterCollide: function() {}

	});

});