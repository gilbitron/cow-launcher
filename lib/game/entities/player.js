ig.module(
    'game.entities.player'
)
.requires(
    'plugins.box2d.entity'
)
.defines(function(){

	EntityPlayer = ig.Entity.extend({

		type: ig.Entity.TYPE.A,
		checkAgainst: ig.Entity.TYPE.NONE,
		size: {x: 91, y: 75},
		bounciness: 0.6,

		shootAngle: 0,
		initialPower: 0,
		longestBounce: 0,
		lastBounceX: 0,
		_isGround: false,
		_thudTimer: null,

		animSheet: new ig.AnimationSheet( 'media/cow.png', 91, 75 ),

		soundCow: new ig.Sound( 'media/audio/cow.*' ),
		soundThud: new ig.Sound( 'media/audio/thud.*' ),

		init: function( x, y, settings ) {
	        this.parent( x, y, settings );
			this.friction.x = 0.4;

	        this.shootAngle = settings.shootAngle;
	        this.initialPower = settings.initialPower;

	        this.addAnim( 'idle', 1, [0] );

			this.applyForce(this.shootAngle, this.initialPower);
			this.body.ApplyTorque(this.initialPower);

			this.soundCow.play();
			this._thudTimer = new ig.Timer();
	    },

	    update: function() {
			if(this.standing){
				if(this.lastBounceX){
					var dist = (this.pos.x - this.lastBounceX) * Box2D.SCALE;
					if(dist > this.longestBounce) this.longestBounce = dist;
				}
				this.lastBounceX = this.pos.x;

				// Play sound
				if(this._isGround && this._thudTimer.delta() >= 0 && !this.hasStoppedMoving()){
					this.soundThud.volume = this.body.GetLinearVelocity().Length()/30; // vel of 30+ = vol at 100%
					if(this.soundThud.volume > 1.0) this.soundThud.volume = 1.0;
	    			this.soundThud.play();
	    			this._thudTimer.set(0.5);
	    		}

	    		// Avoid the "wiggle" when stopped
	    		if(this.hasStoppedMoving()){
	    			this.pos = this.last;
	    		}
			}

			this.parent();
	    },

	    postSolve: function(other, contact, impulse) {
			// If !other assume ground
			if(!other){
				this._isGround = true;
			} else {
				this._isGround = false;
			}
		},

	    applyForce: function( angle, power ) {
	    	var angleRad = angle.toRad(),
				velx = Math.cos(angleRad),
				vely = Math.sin(angleRad);

			velx *= power;
			vely *= power;

			this.body.ApplyImpulse( new Box2D.Common.Math.b2Vec2(velx,vely), this.body.GetPosition() );
	    },

	    hasStoppedMoving: function() {
	    	return (this.body.GetLinearVelocity().Length() < 2);
	    }

	});

});