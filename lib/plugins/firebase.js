ig.module(
	'plugins.firebase'
)
.requires()
.defines(function(){

	ImpactFirebase = ig.Class.extend({

		_fb: null,
		_auth: null,
		_loggedIn: false,
		_user: null,

		init: function() {
			this._fb = new Firebase('https://cowlauncher.firebaseio.com');
		},

		login: function(successCallback, errorCallback) {
			var $this = this;

			this._auth = new FirebaseSimpleLogin(this._fb, function(error, user) {
				$this._loggedIn = false;
				if(error){
					if(typeof errorCallback === 'function') errorCallback(error.message);
				} else if(user){
					$this._loggedIn = true;
					$this._user = user;
					if(typeof successCallback === 'function') successCallback(user);
				} else {
					$this._doLogin();
				}
			});
		},

		_doLogin: function() {
			this._auth.login('facebook', {
				rememberMe: true,
				scope: 'email'
			});
		},

		logout: function() {
			this._auth.logout();
			this._loggedIn = false;
			this._user = null;
		},

		isLoggedIn: function() {
			return this._loggedIn;
		},

		user: function() {
			return this._user;
		},

		saveScore: function(score, completeCallback, errorCallback) {
			if(!this._user){
				if(typeof errorCallback === 'function') errorCallback('Invalid user.');
				return;
			}

			var scores = this._fb.child('scores'),
				newScore = scores.push();

			newScore.setWithPriority({ user: { id: this._user.id, name: this._user.displayName }, score: score, time: new Date().getTime() }, score, function(error){
				if(error){
					if(typeof errorCallback === 'function') errorCallback(error.message);
				} else {
					if(typeof completeCallback === 'function') completeCallback();
				}
			});
		}

	});

});