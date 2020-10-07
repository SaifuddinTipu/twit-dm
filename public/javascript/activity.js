(function () {
  var activity = {};

  /**
   * Connect to socket
   */
  // Accordia userID: 1293103832314961921
  activity.connect = function (socket_host, activity_event) {
    io.connect(socket_host).on(activity_event, function (data) {
      // get template
      var tmpl_source = document.getElementById("json_template").innerHTML;
      var template = Handlebars.compile(tmpl_source);
      var cards = $("#event-container .card");
      //var json_str = data.event.direct_message_events.shift();

      // control max events
      if (cards.length >= 100) {
        cards.last().remove();
      }
      // render
      $("#event-container").prepend(
        template({
          internal_id: data.internal_id,
          senderUserID: data.senderUserID,
          senderScreenName: data.senderScreenName,
          messageText: data.messageText,
        })
      );
      $("#waiting-msg").hide();
    });
  };

  window.activity = activity;
})();
