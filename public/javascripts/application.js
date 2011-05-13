// Place your application-specific JavaScript functions and classes here
// This file is automatically included by javascript_include_tag :defaults


$(function() {
  var chat_history = [];
  var current_value = '';
  var current_position = 0;
  
  var faye = new Faye.Client('http://192.168.1.149:9292/faye');

  faye.subscribe('/messages/clean', function (data) {
    $('#chat_box').append($('<div class="message"><div class="timestamp">' + data.timestamp + '</div><div class="username">' + data.username + '</div><div class="text">' + data.text + '</div></div>'));
    $('#chat_box').scrollTop(1000000);
  });
  
  $('#message_submit').click(function(e) {
    e.preventDefault();
    
    chat_history.unshift($('#message_text').val());
    current_value = '';
    current_position = 0;
    
    // intercept all messages that start with '/'
    if($('#message_text').val().indexOf('/') === 0) {
      if($('#message_text').val().indexOf('/play ') === 0) {
        // make some music
        var sound_map = {
          "bounce": "http://rpg.hamsterrepublic.com/wiki-images/d/d7/Oddbounce.ogg",
          "cancel": "http://rpg.hamsterrepublic.com/wiki-images/5/5e/Cancel8-Bit.ogg",
          "hit": "http://rpg.hamsterrepublic.com/wiki-images/7/7c/SmallExplosion8-Bit.ogg"
        }
        var sound_key = $('#message_text').val().substring(6);
        var sound_url = sound_map[sound_key];
        var audioElement = document.createElement('audio');
        audioElement.setAttribute('src', sound_url);
        audioElement.addEventListener("load", function() {
          audioElement.play();
          $(".duration span").html(audioElement.duration);
          $(".filename span").html(audioElement.src);
        }, true);
        audioElement.load()
        audioElement.play();
      } else {
        // send to our shiny new interceptor
        faye.publish('/interceptor/new', {
          username: $('#message_username').val(),
          timestamp: formatTime(),
          text: $('#message_text').val()
        });
      }
    } else {  
      // this is a dirty message -- clean it up  
      faye.publish('/messages/dirty', {
        username: $('#message_username').val(),
        timestamp: formatTime(),
        text: $('#message_text').val()
      });
    }

    $('#message_text').val("");
    return false;
  });
  
  // catch some arrows
  $('#message_text').keydown(function(e) {
    if(e.keyCode == 38) { // up arrow goes up in history
      if(current_position == 0) {
        current_value = $('#message_text').val();
      }
    
      var history_value = chat_history[current_position];
      if(history_value) {
        $('#message_text').val(history_value);
      }
      
      current_position++;
      
      if(current_position >= chat_history.length) {
        current_position = chat_history.length - 1;
      }
    }

    if(e.keyCode == 40) { // down arrow goes down in history    
      var history_value = chat_history[current_position];
      if(history_value) {
        $('#message_text').val(history_value);
      }
      
      current_position--;
    
      if(current_position < 0) {
        $('#message_text').val(current_value);
        current_position = 0;
      }
    }
  });
  
  
  
  var formatTime = function() { 
    var dt = new Date(); 
    var hours = dt.getHours(); 
    var minutes = dt.getMinutes(); 
    var seconds = dt.getSeconds(); 
    // the above dt.get...() functions return a single digit 
    // so I prepend the zero here when needed 
    if (hours < 10) hours = '0' + hours; 
    if (minutes < 10) minutes = '0' + minutes; 
    if (seconds < 10) seconds = '0' + seconds; 
    return hours + ":" + minutes + ":" + seconds; 
  } 
  
}); 