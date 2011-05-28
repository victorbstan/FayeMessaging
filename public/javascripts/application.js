// the client code for Interceptor Group Chat

$(function() {
  var chat_history = [];
  var current_value = '';
  var current_position = 0;
  var faye;

  // get faye url
  $.getJSON('/faye_url.json', function(data) {
    if (data.length) {
      chat(data);
      console.log(data);
    } else {
      alert('Cannot get Faye IP');
    }

  });

  function chat(faye_url) {
    
    console.log(faye_url+"/faye");

    faye = new Faye.Client(faye_url+"/faye");
    // console.log(faye);

      // faye.subscribe('/messages/clean', function (data) {
    faye.subscribe('/messages/new', function (data) {
      // build the new message
      var message = $($('#message_template').html());
      $('.timestamp', message).text(data.timestamp);
      $('.wrong_classification a', message).click(function(e) {
        e.preventDefault();

        var that = $(this), options = "<select>", drop_down;

        $.each(["", "Love", "Joy", "Sadness", "Fear", "Anger", "Surprise"], function(i,sentiment) {
          options = options + '<option value="' + sentiment + '">' + sentiment + '</option>'
        });

        drop_down = $(options + '</select>');

        drop_down.select(function() {
          var dropd = $(this);

          faye.publish('/classifier/wrong', {
            text: "love!",
            username: dropd.val()
          });

          dropd.remove();
        });

        drop_down.insertAfter(that);
        that.remove();
      });
      $('.classification', message).text(data.classification);
      $('.username', message).text(data.username);
      $('.text', message).html(data.text);

      $('#chat_box').append(message);
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
        // faye.publish('/messages/dirty', {
        // faye.publish('/messages/new', {
        faye.publish('/classifier/new', {
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

    // training for ankusa





    // copied from some mysterious online js distillery
    var formatTime = function() {
      var dt = new Date();
      var hours = dt.getHours();
      var minutes = dt.getMinutes();
      var seconds = dt.getSeconds();
      if (hours < 10) hours = '0' + hours;
      if (minutes < 10) minutes = '0' + minutes;
      if (seconds < 10) seconds = '0' + seconds;
      return hours + ":" + minutes + ":" + seconds;
    }

  } // end function chat
  
}); 
