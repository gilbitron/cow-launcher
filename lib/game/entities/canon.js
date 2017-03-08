ig.module(
    'game.entities.canon'
)
.requires(
    'plugins.box2d.entity'
)
.defines(function(){

	EntityCanon = ig.Entity.extend({

		size: {x: 153, y: 89},
		isSensor: true,
		gravityFactor: 0,

		shootAngle: 315, // 315 degrees (45 up from hor)
		initialPower: 1,
		_controlsDisabled: false,
		_createdTime: 0,

		animSheet: new ig.AnimationSheet( 'media/canon.png', 153, 89 ),
		wheel: new ig.Image( 'media/canon-wheel.png' ),

		sound: new ig.Sound( 'media/audio/blast.*' ),

		init: function( x, y, settings ) {
	        this.parent( x, y, settings );
	        // Wait 0.5s before we are allowed to shoot
	        // (stops from shooting straight after menu)
	        this._createdTime = new ig.Timer();
	        this._createdTime.set( 0.5 );

	        this.addAnim( 'idle', 1, [0] );
	        this.anims.idle.pivot.x = 47;
	        this.anims.idle.pivot.y = 47;
	    },

	    update: function() {
	    	if(!this._controlsDisabled){
	    		// Change shootAngle
				if( ig.input.state('left') && !ig.input.state('shoot') && !ig.input.state('reset') ) {
					this.shootAngle -= 1;
					if(this.shootAngle < 280) this.shootAngle = 280;
				}

				if( ig.input.state('right') && !ig.input.state('shoot') && !ig.input.state('reset') ) {
					this.shootAngle += 1;
					if(this.shootAngle > 350) this.shootAngle = 350;
				}

				this.body.SetAngle( (this.shootAngle).toRad() );

				// Change power
				this.initialPower++;
				if(this.initialPower >= 100) this.initialPower = 1;

				// Shoot
				if( this._createdTime.delta() >= 0 && ig.input.pressed('shoot') ) {
					ig.game.spawnEntity(
						EntityPlayer,
						this.pos.x + (this.size.x * Math.cos(this.shootAngle.toRad())),
						this.pos.y + (this.size.x * Math.sin(this.shootAngle.toRad())),
						{ shootAngle: this.shootAngle, initialPower: this.initialPower * 150 }
					);
					this.sound.play();
					this._controlsDisabled = true;
				}
			}

			this.parent();
		},

		draw: function() {
			this.parent();
			this.wheel.draw( this.pos.x - ig.game.screen.x - 5, this.pos.y + 38 );
		}

	});

});