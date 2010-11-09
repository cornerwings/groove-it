// JS file with all application logic

$(document).ready(function(){
    var canvas;
    var ctx;
    var width = 960;
    var height=300;
    var MAX_CHANNELS = 3;
    var MAX_VARIATIONS = [3, 4, 3];

    var cur_state = 0;
    var PROB_ARRAY = [0.8, 0.9, 1.0];
    var line_x = 0;

    var MAX_X = 0;

    function init() {
      canvas = document.getElementById("mycanvas");
      canvas.width = width;
      canvas.height = height;
      if (canvas.getContext) {
        ctx = canvas.getContext("2d");
        canvas.addEventListener('click', click_handler, false);
      }
    }

    var ExpandingBubble = function(opts){
      var expanding = true;
      var active = true;
      var minradius = 3 + Math.ceil(Math.random() * 3);
      var maxradius = 10 + Math.ceil(Math.random() * 20);
      var radius = minradius;

      this.draw = function(ctx){
        if(active)
          radius += expanding ? 2 : -2;

        ctx.save();
        ctx.fillStyle = opts.fillColor;
        ctx.beginPath();
        ctx.arc(opts.x,opts.y,radius,0,Math.PI*2,true);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        if(radius > maxradius)
          expanding = false; 

        if(radius < minradius)
          expanding = true;  

        if(opts.x < movingLine.getPos())
          active = false;   
      }

      this.isHit = function(pos){
        if( (pos > opts.x - radius) && (pos < opts.x + radius) ){
          return true;
        }
        return false;
      }

      this.getData = function(){
        return [opts.x, opts.y, radius];
      }

      this.getTweet = function(){
        return opts.tweet;
      }

      this.getColor = function(){
        return opts.fillColor;
      }

      this.setX = function(){
        opts.x = opts.x - canvas.width;
      }
    }

    var MovingLine = function(opts){
      var active = true;
      var position = 1;
  
      this.draw = function(ctx){
        if(!active)
          return;

        position += 2;

        ctx.save();
        ctx.strokeStyle = opts.strokeColor;
        ctx.lineWidth = opts.lineWidth;
        ctx.beginPath(); 
        ctx.moveTo(position,5);
        ctx.lineTo(position,height-5);
        ctx.stroke();

        if(position > canvas.width){
          position = 1;
          for (i=0; i < allShapes.length; ++i) {
            allShapes[i].setX(); 
          }
          MAX_X -= canvas.width;    
        }

        if(position > MAX_X){
          setTimeout(finalize, 500);
        }
      }

      this.getPos = function(){
        return position;
      }
    }
        

    function createBubble(id) {
      var red = Math.floor(Math.random() * 256);
      var green = Math.floor(Math.random() * 256);
      var blue = Math.floor(Math.random() * 256);
      var opacity = Math.random()+0.2;

      var xcoord = line_x + Math.floor(Math.random() * 30);
      var ycoord = Math.floor(Math.random() * canvas.height);
      if(Math.random() < PROB_ARRAY[cur_state]){
        cur_state = 0;
        line_x += 60;
      }
      else{
        cur_state++;
      }

      return new ExpandingBubble({
        x: xcoord, 
        y: ycoord, 
        fillColor: "rgba("+red+", "+green+", "+blue+", "+opacity+")", 
        tweet: tweets[id],
      });
    }

    function createLine() {
      var red = Math.floor(Math.random() * 256);
      var green = Math.floor(Math.random() * 256);
      var blue = Math.floor(Math.random() * 256);
      var opacity = Math.random()+0.5;

      return new MovingLine({
        lineWidth: 1,
        strokeColor: "rgba("+red+", "+green+", "+blue+", "+opacity+")", 
      });
    }

    function generateBubbles(count) {
      var allShapes = [];
      for (i=0; i < count; ++i) {
        allShapes.push(createBubble(i)); 
      }
      MAX_X = allShapes[i-1].getData()[0];
      return allShapes;      
    }
    
    function draw() {
      ctx.clearRect(0, 0, 960, 300);

      for (i=0; i < allShapes.length; ++i) {
        allShapes[i].draw(ctx);
      } 
      movingLine.draw(ctx);
    }

    function initChannels() {
      var audioChannels = new Array();
      for(i=0; i< MAX_CHANNELS; ++i){
        audioChannels[i] = -1;
      }

      for(i=0; i<MAX_CHANNELS; i++){
        for(j=0; j<MAX_VARIATIONS; j++){
          document.getElementById("sound_"+i+"_"+j).addEventListener('ended', function(){
            this.currentTime = 0;
            this.pause();
            audioChannels[i] = -1;
          });
        }
      }
      return audioChannels;
    }

    function resetChannel(i){
      var tmpAudio = document.getElementById("sound_"+i+"_"+audioChannels[i]);

      tmpAudio.currentTime = 0;
      if(!tmpAudio.paused){
        tmpAudio.pause();
      }
    }

    function playChannel(i){
      if(audioChannels[i] >= MAX_VARIATIONS[i])
        audioChannels[i] = Math.floor(Math.random() * MAX_VARIATIONS[i]);

      var tmpAudio = document.getElementById("sound_"+i+"_"+audioChannels[i]);
      tmpAudio.play();
    }

    function playBeat(){
      var newChannels = new Array();
      for(i=0; i< MAX_CHANNELS; ++i){
        newChannels[i] = -1;
      }

      // TODO _ Need new logic here for detecting hits and playing beats
      for (i=0; i < allShapes.length; ++i) {
        if(allShapes[i].isHit(movingLine.getPos())){
          var dat = allShapes[i].getData();
          var channel = Math.floor( dat[1] * MAX_CHANNELS / height );
          if(newChannels[channel] == -1){
            newChannels[channel] = Math.floor( dat[2] * MAX_VARIATIONS[channel] / 30 );
          }
          else{
            newChannels[channel] += Math.floor( dat[2] * MAX_VARIATIONS[channel] / 30 );
          }
        }
      }

      for(i=0; i < MAX_CHANNELS; i++){
        if(newChannels[i] != -1){
          if(audioChannels[i] != -1){
            //resetChannel(i);
          }
          audioChannels[i] = newChannels[i];
          playChannel(i);
        }
      }         
    }

    function click_handler(e){
      var x = e.clientX - canvas.offsetLeft;
      var y = e.clientY - canvas.offsetTop;
      for(i=0; i<allShapes.length; i++){
        var dat = allShapes[i].getData();
        if(x>dat[0]-dat[2] && x<dat[0]+dat[2] && y>dat[1]-dat[2] && y<dat[1]+dat[2]){
          var t = allShapes[i].getTweet();
          var c = allShapes[i].getColor();
          var ul = "http://twitter.com/"+t.from_user;
          var sl = "http://twitter.com/"+t.from_user+"/status/"+t.id_str;

          $('#tweet').html(t.text + "<br>" + "<a href='"+ul+"'>@"+t.from_user+"<\/a> . <a href='"+sl+"'>"+t.created_at+"<\/a>");
          $('#tweet a').css('color', c);
          break;
        }
      }
    }

    function get_tweets(search_url){
      if(tweets.length < 100 && num_call < 10){
        jQuery.ajax({
          url: search_url,
		      dataType: 'jsonp',
	        success: function (data) {
		        tweets = tweets.concat(data.results);
            num_call++;
            if(data.next_page==undefined) num_call += 10; 
            get_tweets(twitter_url+data.next_page); 
			    }
        });
      }
      else{
        //got enough tweets
        init();
        allShapes = generateBubbles(tweets.length);
        movingLine = createLine();
        audioChannels = initChannels();

        drawInterval = setInterval(draw, 30);
        beatInterval = setInterval(playBeat, 500);

        $('#tweet-container').bind('click', click_handler);
      }
    }

    function finalize(){
      clearInterval(drawInterval);
      clearInterval(beatInterval);

      allShapes.splice(0, allShapes.length);
      tweets.splice(0, tweets.length);
      movingLine = null;

      num_call = 0;
      cur_state = 0;
      line_x  = 0;
      MAX_X = 0;
    }

    $('#loading')
      .hide() 
      .ajaxStart(function() {
          $(this).show();
      })
      .ajaxStop(function() {
          $(this).hide();
      });

    var allShapes = new Array();
    var movingLine;
    var audioChannels;

    var twitter_url = "http://search.twitter.com/search.json";
    var rpp = "100";
    var num_call = 0;
    var tweets = new Array();

    var drawInterval;
    var beatInterval;

    $(".box").keyup(function(event){
      if(event.keyCode == 13){
        $(".btn").click();
      }
    });
    $('.btn').click(function(){
      var query = $('.box').val().replace("#","%23");
      if(query.length > 0){
        finalize();
        $('#tweet').html("");
        get_tweets(twitter_url + "?rpp=" + rpp + "&q=" + query);
      }        
    });

    $("#music-help").hover(function(){
      $('#header h4').css('left', '490px');
      $("#music-help").html("Contact me if you have good music background and want to make this sound better");
    }, function(){
      $('#header h4').css('left', '840px');
      $("#music-help").html("Please excuse the shitty music");
    });
});
