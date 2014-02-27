'use strict';

var Phaser = require('phaser');
var col = require('rancol');

var game = new Phaser.Game(400, 490, Phaser.AUTO, 'game');

var giveGravity = function (sprite) {
	sprite.body.gravity.y = 1000;
};

var goAway = function (sprite) {
	sprite.game.add.tween(sprite).to({
			alpha: 0,
			height: 0,
			width: 0,
			x: sprite.x + 30,
			y: sprite.y + 30
		}, 200, Phaser.Easing.Quadratic.In, true);
};

var die = function (sprite) {
	sprite.body.velocity.x = -200;
	sprite.game.add.tween(sprite)
		.to({
			angle: 90,
			x: 400
		}, 1000, Phaser.Easing.Quadratic.In, true);
};

var flyIn = function (sprite) {
	sprite.flyingIn = sprite.game.add.tween(sprite).to({
			y: 250
		}, 1000, Phaser.Easing.Quadratic.Out, true);

	sprite.flyingIn.onComplete.add(giveGravity.bind(this, sprite));

	sprite.game.add.tween(sprite).to({
			x: 100,
			angle: 0
		}, 1000, Phaser.Easing.Quadratic.Out, true);
};

var gameState = {};

gameState.main = function () {};
gameState.main.prototype = {

	preload: function () {
		this.game.stage.scaleMode = Phaser.StageScaleMode.SHOW_ALL;
		this.game.stage.scale.setShowAll();
		this.game.stage.scale.refresh();
		this.game.stage.backgroundColor = col.hex();
		this.game.load.image('bird', 'assets/img/bird.png');
		this.game.load.image('pipe', 'assets/img/pipe.png');
	},

	create: function () {
		this.noscore = false;
		this.bird = this.game.add.sprite(0, 0, 'bird');
		this.bird.angle = 70;
		flyIn(this.bird);
		this.bird.body.bounce.setTo(1, 1);
		this.downHandler = this.game.input.onDown.add(this.jump, this);

		this.pipes = game.add.group();

		this.pipes.createMultiple(20, 'pipe');

		this.pipeAdder = this.game.time.events.loop(1500, this.addRowOfPipes, this);
		this.highScore = window.localStorage.getItem('flabbyBird') || 0;
		this.score = 0;
		var style = {
			font: '40px Arial',
			fill: '#ffffff',
			stroke: '#000000',
			strokeThickness: 5
		};

		this.labelScore = this.game.add.text(20, 20, this.score, style);

		var highScoreStyle = {
			font: '40px Arial',
			fill: '#D2BE27',
			stroke: '#000000',
			strokeThickness: 5
		};

		this.labelHighScore = this.game.add.text(320, 20, this.highScore, highScoreStyle);
		this.currentPipe = null;
		this.nextPipe = null;
	},

	update: function () {
		this.checkPipes();

		if (!this.bird.inWorld) {
			this.restartGame();
		} else {
			this.game.physics.collide(this.bird, this.pipes, this.collisionHappened, null, this);
		}
	},

	collisionHappened: function () {
		this.noscore = true;
		this.showFinalScore();
		die(this.bird);
		this.pipes.forEach(goAway);
		this.game.input.onDown.removeAll();
	},
	checkPipes: function () {
		if (this.currentPipe == null) {
			this.currentPipe = this.nextPipe;
		}

		if (this.currentPipe != null && this.currentPipe.x < 100) {
			this.addToScore();
			this.currentPipe = this.nextPipe;
		}
	},

	jump: function() {
		if (this.bird.flyingIn) {
			this.bird.flyingIn.stop();
			giveGravity(this.bird);
		}

		this.bird.body.velocity.y = -350;
		this.game.add.tween(this.bird)
			.to({ height: 40 }, 100, Phaser.Easing.Linear.None, true)
			.to({ height: 50 }, 100, Phaser.Easing.Linear.None, true);
	},

	restartGame: function () {
		window.localStorage.setItem('flabbyBird', this.highScore);
		this.game.time.events.remove(this.pipeAdder);
		this.game.state.start('main');
	},

	addOnePipe: function (x, y) {
		var pipe = this.pipes.getFirstDead();
		pipe.reset(x, y);
		pipe.body.velocity.x = -200;
		pipe.outOfBoundsKill = true;

		return pipe;
	},

	addRowOfPipes: function () {
		var hole = Math.floor(Math.random() * 5) + 1;
		for (var i = 0; i < 8; i++) {
			if (i != hole && i != hole + 1) {
				this.nextPipe = this.addOnePipe(400, i * 60 + 10);
			}
		}
	},

	addToScore: function () {
		if (this.noscore === false) {
			this.labelScore.content = ++this.score;

			if (this.score == this.highScore) {
				this.labelHighScore.moveScore = this.game.add.tween(this.labelHighScore).to({ x: 20 }, 300, Phaser.Easing.Sinusoidal.In, true);
			}

			if (this.score >= this.highScore) {
				this.labelHighScore.content = this.highScore = this.score;
			}
		}
	},

	showFinalScore: function () {
		var text = this.score >= this.highScore ? this.labelHighScore : this.labelScore;
		var otherText = text === this.labelScore ? this.labelHighScore : this.labelScore;

		if (text.moveScore) {
			text.moveScore.stop();
		}

		var style = text.style;
		style.font = '80px Arial';
		text.setStyle(style);

		text.game.add.tween(text).to({
				x: 200 - ((text.width + 40) / 2),
				y: 245 - ((text.height + 40) / 2)
			}, 150, Phaser.Easing.Quadratic.Out, true);

		otherText.game.add.tween(otherText).to({
				alpha: 0
			}, 50, Phaser.Easing.Linear.None, true);
	}
};

game.state.add('main', gameState.main);
game.state.start('main');