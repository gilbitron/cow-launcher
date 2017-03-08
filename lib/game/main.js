ig.module(
	'game.main'
)
.requires(
	'plugins.box2d.game',

	'game.entities.player',
	'game.entities.canon',
	'game.entities.trampoline',
	'game.entities.tnt',
	'game.entities.scarecrow',

	'plugins.button',
	'plugins.firebase'

	//,'impact.debug.debug'
	//,'plugins.box2d.debug'
)
.defines(function(){

	CowLauncher = ig.Game.extend({

		gravity: 600,

		ground: null,
		mapTileSize: 48,
		player: null,
		canon: null,
		isMenu: true,
		showHelp: false,
		gameOver: false,
		gameOverTimer: null,
		distance: 0,
		db: null,
		isSaving: false,
		buttons: null,
		startButton: null,
		shootButton: null,
		resetButton: null,
		leftButton: null,
		rightButton: null,
		soundButton: null,
		helpButton: null,
		gameCenterButton: null,
		gameCenter: null,
		adBanner: null,

		_lastObjectX: 0,

		bgMain: new ig.Image( 'media/background1.png' ),
		fgMain: new ig.Image( 'media/foreground1.png' ),
		bgSplash: new ig.Image( 'media/splash.png' ),
		font: new ig.Font( 'media/font26.png' ),
		fontLarge: new ig.Font( 'media/font55.png' ),
		fontBackPower: new ig.Image( 'media/font-back-power.png' ),
		fontBackDistance: new ig.Image( 'media/font-back-distance.png' ),
		fontBackHeight: new ig.Image( 'media/font-back-height.png' ),
		gameOverBg: new ig.Image( 'media/game-over-back.png' ),
		buttonsImage: new ig.Image( 'media/buttons.png' ),
		buttonsLargeImage: new ig.Image( 'media/buttons-large.png' ),
		buttonsSplash: new ig.Image( 'media/buttons-splash.png' ),

		init: function() {
			//ig.input.bind( ig.KEY.MOUSE1, 'click' );
			ig.input.bind( ig.KEY.LEFT_ARROW, 'left' );
			ig.input.bind( ig.KEY.RIGHT_ARROW, 'right' );
			ig.input.bind( ig.KEY.SPACE, 'shoot' );
			ig.input.bind( ig.KEY.R, 'reset' );

			this.reset();

			var $this = this; // For use in callbacks

			// Buttons
			this.startButton = new ig.Button( 'start', {left: ig.system.width/2 - this.bgSplash.width/2, top: 0}, this.bgSplash.width, this.bgSplash.height, this.bgSplash, 0 ),
			this.resetButton = new ig.Button( 'reset', {left: 20, top: 20}, 80, 81, this.buttonsLargeImage, 0 ),
			this.leftButton = new ig.Button( 'left', {left: 0, top: 0}, ig.system.width/2, ig.system.height, this.buttonsImage, 10 ),
			this.rightButton = new ig.Button( 'right', {left: ig.system.width/2, top: 0}, ig.system.width/2, ig.system.height, this.buttonsImage, 10 ),
			this.shootButton = new ig.Button( 'shoot', {right: 20, bottom: 20}, 80, 81, this.buttonsLargeImage, 1 ),
			this.soundButton = new ig.Button( 'sound', {left: 20, top: 20}, 48, 48, this.buttonsImage, 0 );
			this.helpButton = new ig.Button( 'help', {left: 30, bottom: 20}, 64, 64, this.buttonsSplash, 0 );
			this.gameCenterButton = new ig.Button( 'gamecenter', {right: 30, bottom: 20}, 64, 64, this.buttonsSplash, 1 );
			this.shootButton.hidden = true;
			this.resetButton.hidden = true;
			this.leftButton.hidden = true;
			this.rightButton.hidden = true;
			if( window.ejecta ){
				this.buttons = new ig.ButtonCollection([
					this.startButton,
					this.resetButton,
					this.shootButton,
					this.leftButton,
					this.rightButton,
					this.helpButton,
					this.gameCenterButton
				]);
			} else {
				this.buttons = new ig.ButtonCollection([
					this.soundButton,
					this.helpButton
				]);
			}
			this.buttons.align();

			// DB
			if( !window.ejecta ) {
				this.db = new ImpactFirebase();
				$('#user-status').on('click', '.login', function(e){
					e.preventDefault();
					$this.db.login(function(user){
						$('#user-status').html('Logged in as '+ user.displayName +'. <a href="#" class="logout">Logout</a>');
					}, function(error){
						$('#user-status').html('<a href="#" class="login">Login</a> to save your scores.');
					});
				});

				$('#user-status').on('click', '.logout', function(e){
					e.preventDefault();
					$this.db.logout();
					$('#user-status').html('<a href="#" class="login">Login</a> to save your scores.');
				});
			} else {
				this.gameCenter = new Ejecta.GameCenter();
				this.gameCenter.softAuthenticate(function(error){});

				this.adBanner = new Ejecta.AdBanner();
				this.adBanner.isAtBottom = true;
			}
		},

		reset: function() {
			this.screen.x = 0;
			this.gameOver = false;
			this.gameOverTimer = new ig.Timer();
			this.player = null;
			this.canon = null;
			this.distance = 0;

			// Create ground
            this.ground = this.createGround();
			this.setupContactListener();
			if(ig.Box2DDebug) this.debugDrawer = new ig.Box2DDebug(ig.world);

			if( window.ejecta && this.adBanner ){
				this.adBanner.hide();
			}
		},

		placeObjects: function() {
			var x = this.screen.x + ig.system.width,
				y = ig.system.height - this.mapTileSize;

			// Throttling
			if(x > this._lastObjectX - (ig.system.width/2) && x < this._lastObjectX + (ig.system.width/2)) return;

			if( Math.random() > 0.3 ) { // 70% chance of placing an object
				if( Math.random() > 0.7 ) { // 30% chance of stopper
					var id = Math.floor(Math.random()*1);
					switch(id){
						case 0:
							this.spawnEntity( EntityScarecrow, x, y - 200 );
							break;
					}
				} else { // booster
					var id = Math.floor(Math.random()*2);
					switch(id){
						case 0:
							this.spawnEntity( EntityTrampoline, x, y - 53 );
							break;
						case 1:
							this.spawnEntity( EntityTnt, x, y - 77 );
							break;
					}
				}
			}

			this._lastObjectX = x;
		},

		update: function() {
			// Update ground
			var vector = new Box2D.Common.Math.b2Vec2(this.screen.x * Box2D.SCALE + (ig.system.width / 2) * Box2D.SCALE,
				(ig.system.height - this.mapTileSize) * Box2D.SCALE + (this.mapTileSize / 2) * Box2D.SCALE);
			this.ground.SetPosition(vector);

			if( !this.player ) this.player = this.getEntitiesByType( EntityPlayer )[0];

			// Start
			if( this.isMenu && (ig.input.pressed('shoot') || ig.input.pressed('start')) && !ig.input.pressed('help') && !ig.input.pressed('gamecenter') ){
				this.canon = ig.game.spawnEntity( EntityCanon, this.mapTileSize + 10, ig.system.height - this.mapTileSize - 125 );
				this.isMenu = false;
				this.screen.x = 0;
			}

			// Help
			if( this.isMenu && ig.input.pressed('help') ){
				if( this.showHelp ){
					this.showHelp = false;
				} else {
					this.showHelp = true;
				}
			}

			// Game Center
			if( this.isMenu && ig.input.pressed('gamecenter') && window.ejecta ){
				if( this.gameCenter.authed ) {
					this.gameCenter.showLeaderboard( 'longest_distance' );
				} else {
					this.gameCenter.authenticate();
				}
			}

			// If playing
			if( this.player ){
				// Screen follows player
				if(this.player.pos.x >= ig.system.width/2){
					this.screen.x = this.player.pos.x - ig.system.width/2;
				}

				// Place objects
				var tileX = this.screen.x / this.mapTileSize;
				if( Math.floor(tileX % 18) === 0 ) { // ~18 tiles per screen
					this.placeObjects();
				}

				// Update score
				this.distance = (this.player.pos.x * Box2D.SCALE);

				// Achievements
				if( window.ejecta && this.gameCenter.authed ) {
					if(Math.floor(this.distance) >= 1000) this.gameCenter.reportAchievement( '1000m', 100 );
					if(Math.floor(this.distance) >= 5000) this.gameCenter.reportAchievement( '5000m', 100 );
					if(Math.floor(this.distance) >= 10000) this.gameCenter.reportAchievement( '10000m', 100 );
					if(Math.floor(this.distance) >= 20000) this.gameCenter.reportAchievement( '20000m', 100 );
					if(Math.floor(this.distance) >= 30000) this.gameCenter.reportAchievement( '30000m', 100 );
				}

				// Game Over?
				if(!this.gameOver && this.player.hasStoppedMoving()){
					if(this.gameOverTimer.delta() >= 0){
						this.gameOver = true;

						if( !window.ejecta ) {
							if(this.db.isLoggedIn()){
								var $this = this;
								this.isSaving = true;
								this.db.saveScore(Math.floor(this.distance), function(){
									$this.isSaving = false;
								});
							}
						} else {
							if( this.gameCenter.authed ) {
								this.gameCenter.reportScore( 'longest_distance', Math.floor(this.distance) );
								this.gameCenter.reportScore( 'longest_bounce', Math.floor(this.player.longestBounce) );
							}
							if( this.adBanner ){
								this.adBanner.show();
							}
						}
					}
				} else {
					this.gameOverTimer.set(2);
				}
			}

			// Sound
			if( ig.input.pressed('sound') ){
				if( ig.soundManager.volume ){
					ig.soundManager.volume = 0;
					this.soundButton.tile = 1;
				} else {
					ig.soundManager.volume = 1;
					this.soundButton.tile = 0;
				}
			}

			// Reset
			if( (!this.isMenu && ig.input.pressed('reset')) ||  (this.player && this.player.pos.x < 0) || (this.player && this.player.pos.y > ig.system.height) ){
				for(var i = 0; i < ig.game.entities.length; i++){
					ig.game.entities[i].kill();
				}

				if( this.player ){
					this.reset();
					this.canon = ig.game.spawnEntity( EntityCanon, this.mapTileSize + 10, ig.system.height - this.mapTileSize - 125 );
				} else {
					this.isMenu = true;
					this.showHelp = false;
				}
			}

			this.parent();
		},

		draw: function() {
			this.parent();

			if( this.isMenu ){
				this.helpButton.hidden = false;

				if( !window.ejecta ){ // Non-mobile splash
					this.bgSplash.draw( ig.system.width/2 - this.bgSplash.width/2, 0 );
					this.fontBackPower.draw( ig.system.width/2 - this.fontBackPower.width/2, ig.system.height - 51 );
					this.font.draw( 'Press SPACE to start', ig.system.width/2, ig.system.height - 49, ig.Font.ALIGN.CENTER );
				}
			} else {
				this.resetButton.hidden = false;
				this.leftButton.hidden = false;
				this.rightButton.hidden = false;
				this.helpButton.hidden = true;

				if( window.ejecta ){
					this.startButton.hidden = true;
					this.gameCenterButton.hidden = true;
				}

				if( this.player ){
					if(this.player.pos.y < 0){
						var height = (this.player.pos.y * -Box2D.SCALE);
						height += (ig.system.height - this.mapTileSize) * Box2D.SCALE;
						this.fontBackHeight.draw( ig.system.width/2 - this.fontBackHeight.width/2, 20 );
						this.font.draw( 'Height: '+ this.numberFormat(height) +'m', ig.system.width/2, 23, ig.Font.ALIGN.CENTER );
					}
				}

				this.fontBackDistance.draw( ig.system.width - this.fontBackDistance.width - 20, 20 );
				this.font.draw( 'Distance: '+ this.numberFormat(this.distance) +'m', ig.system.width - 228, 23, ig.Font.ALIGN.LEFT );

				if( this.canon ){
					var power = Math.round(this.canon.initialPower / 10) * 10;
					if(this.distance < 10){
						if( !window.ejecta ){
							this.font.draw( 'Left/Right - Aim\nSpace - Shoot\nR - Reset', ig.system.width/2, 80, ig.Font.ALIGN.CENTER );
						} else {
							this.shootButton.hidden = false;
						}
						this.fontBackPower.draw( ig.system.width/2 - this.fontBackPower.width/2, ig.system.height - 51 );
						this.font.draw( 'Angle: '+ (360 - this.canon.shootAngle), ig.system.width/2 - 125, ig.system.height - 49, ig.Font.ALIGN.LEFT );
						this.font.draw( 'Power: '+ power +'%', ig.system.width/2 - 3, ig.system.height - 49, ig.Font.ALIGN.LEFT );
					} else {
						if( window.ejecta ){
							this.shootButton.hidden = true;
						}
					}
				}

				if( this.gameOver ){
					var bgX = ig.system.width/2 - this.gameOverBg.width/2,
						bgY = ig.system.height/2 - this.gameOverBg.height/2;
					this.gameOverBg.draw( bgX, bgY );
					this.font.draw( 'You Travelled:', ig.system.width/2, bgY + 30, ig.Font.ALIGN.CENTER );
					this.fontLarge.draw( this.numberFormat(this.distance) +'m', ig.system.width/2, bgY + 75, ig.Font.ALIGN.CENTER );
					this.font.draw( 'Longest bounce: '+ this.numberFormat(this.player.longestBounce) +'m', ig.system.width/2, bgY + 150, ig.Font.ALIGN.CENTER );
					if( window.ejecta ){
						this.font.draw( 'Tap RESET to try again', ig.system.width/2, bgY + this.gameOverBg.height - this.font.height - 25, ig.Font.ALIGN.CENTER );
					} else {
						this.font.draw( 'Press R to try again', ig.system.width/2, bgY + this.gameOverBg.height - this.font.height - 25, ig.Font.ALIGN.CENTER );
					}

					if( !window.ejecta ) {
						if(this.db.isLoggedIn()){
							if( this.isSaving ){
								this.font.draw( 'Saving score...', ig.system.width/2, bgY + this.gameOverBg.height - this.font.height - 55, ig.Font.ALIGN.CENTER );
							}
						} else {
							this.font.draw( 'Login to save your score', ig.system.width/2, bgY + this.gameOverBg.height - this.font.height - 55, ig.Font.ALIGN.CENTER );
						}
					}
				}
			}

			if( this.buttons ) {
				this.buttons.draw();
			}

			if( this.isMenu && window.ejecta ){ // Mobile splash
				this.shootButton.hidden = true;
				this.resetButton.hidden = true;
				this.leftButton.hidden = true;
				this.rightButton.hidden = true;
				this.startButton.hidden = false;
				this.gameCenterButton.hidden = false;
				this.fontBackPower.draw( ig.system.width/2 - this.fontBackPower.width/2, ig.system.height - 51 );
				this.font.draw( 'Tap to start', ig.system.width/2, ig.system.height - 49, ig.Font.ALIGN.CENTER );
			}

			// Help
			if( this.isMenu && this.showHelp ){
				var bgX = ig.system.width/2 - this.gameOverBg.width/2,
					bgY = ig.system.height/2 - this.gameOverBg.height/2;
				this.gameOverBg.draw( bgX, bgY );

				if( window.ejecta ){
					this.font.draw( 'Try and launch your\ncow as far as possible.\n\nTap the Left or Right\nhalf of the screen to\naim the cannon.\n\nHit trampolines and\ndynamite to go further.\nAvoid scarecrows.', ig.system.width/2, bgY + 20, ig.Font.ALIGN.CENTER );
				} else {
					this.font.draw( 'Try and launch your\ncow as far as possible.\n\nLeft/Right - Aim\nSpace - Shoot\nR - Reset\n\nHit trampolines and\ndynamite to go further.\nAvoid scarecrows.', ig.system.width/2, bgY + 20, ig.Font.ALIGN.CENTER );
				}
			}
		},

		drawEntities: function() {
			// Draw background images before entities
			var bgDistance = 3,
				bgScrollx = (this.screen.x / bgDistance) * -1,
				bgX = bgScrollx % this.bgMain.width;

			this.bgMain.draw( bgX, 0 );
			this.bgMain.draw( bgX + this.bgMain.width, 0 );

			var fgDistance = 1,
				fgScrollx = (this.screen.x / fgDistance) * -1,
				fgX = fgScrollx % this.fgMain.width;

			this.fgMain.draw( fgX, 0 );
			this.fgMain.draw( fgX + this.fgMain.width, 0 );

			this.parent();
		},

		createGround: function() {
			var gravity = new Box2D.Common.Math.b2Vec2(0, 0);
            ig.world = new Box2D.Dynamics.b2World(gravity, true);

			var bodyDef = new Box2D.Dynamics.b2BodyDef();
            bodyDef.position.Set(
                0 + (ig.system.width / 2) * Box2D.SCALE,
                (ig.system.height - this.mapTileSize) * Box2D.SCALE + (this.mapTileSize / 2) * Box2D.SCALE);
            var ground = ig.world.CreateBody(bodyDef);

            var shapeDef = new Box2D.Collision.Shapes.b2PolygonShape();
            shapeDef.SetAsBox((ig.system.width / 2 * Box2D.SCALE)*2, this.mapTileSize / 2 * Box2D.SCALE);

            var fixtureDef = new Box2D.Dynamics.b2FixtureDef();
            fixtureDef.shape = shapeDef;

            ground.CreateFixture(fixtureDef);
            return ground;
		},

		numberFormat: function(num) {
			nStr = num.floor().toString();
			x = nStr.split('.');
			x1 = x[0];
			x2 = x.length > 1 ? '.' + x[1] : '';
			var rgx = /(\d+)(\d{3})/;
			while (rgx.test(x1)) {
				x1 = x1.replace(rgx, '$1' + ',' + '$2');
			}
			return x1 + x2;
		}

	});

	CowLauncherLoader = ig.Loader.extend({

		bgSplash: new ig.Image( 'media/splash.png' ),
		font: new ig.Font( 'media/font26.png' ),
		fontBackPower: new ig.Image( 'media/font-back-power.png' ),

		draw: function() {
			var w = ig.system.realWidth;
			var h = ig.system.realHeight;
			ig.system.context.fillStyle = '#000000';
			ig.system.context.fillRect( 0, 0, w, h );

			var percentage = (this.status * 100).round() + '%';

			this.bgSplash.draw( ig.system.width/2 - this.bgSplash.width/2, 0 );
			this.fontBackPower.draw( ig.system.width/2 - this.fontBackPower.width/2, ig.system.height - 51 );
			this.font.draw( 'Loading '+ percentage, ig.system.width/2, ig.system.height - 49, ig.Font.ALIGN.CENTER );
		}

	});

	if( window.ejecta ){
		var height = 480,
			scale = window.innerHeight / height,
			width = window.innerWidth / scale;

		canvas.style.width = window.innerWidth;
		canvas.style.height = window.innerHeight;

		ig.System.drawMode = ig.System.DRAW.AUTHENTIC;

		ig.main( '#canvas', CowLauncher, 60, width, height, 1, CowLauncherLoader );
	} else {
		ig.main( '#canvas', CowLauncher, 60, 852, 480, 1, CowLauncherLoader );
	}


});
