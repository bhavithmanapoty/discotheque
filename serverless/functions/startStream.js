const twilio = require("twilio");

console.log("1");
exports.handler = async function (context, event, callback) {
  console.log("2");
  if (!event.streamName) {
    const response = new twilio.Response();
    response.setStatusCode(401);
    response.setBody({
      message: "Missing stream name",
    });
    return callback(null, response);
  }
  console.log("3");
  if (!event.username) {
    const response = new twilio.Response();
    response.setStatusCode(401);
    response.setBody({
      message: "Missing user identity",
    });
    return callback(null, response);
  }
  console.log("4");
  const twilioClient = context.getTwilioClient();

  // Create the video room, player streamer, and audio mixer
  let room;
  console.log("5");
  try {
    room = await twilioClient.video.rooms.create({
      uniqueName: event.streamName,
      audioOnly: true,
      type: "group",
    });
    console.log("6");
  } catch (error) {
    console.log("7");
    const response = new twilio.Response();
    response.setStatusCode(400);
    response.setBody({
      message: "Cannot create room",
      error: error,
    });
    return callback(null, response);
  }
  console.log("8");
  const playerStreamer = await twilioClient.media.playerStreamer.create({
    video: false,
  });
  console.log("9");
  const mediaProcessor = await twilioClient.media.mediaProcessor.create({
    extension: "audio-mixer-v1",
    extensionContext: JSON.stringify({
      identity: "audio-mixer-v1",
      room: {
        name: room.sid,
      },
      outputs: [playerStreamer.sid],
    }),
  });

  console.log("10");
  // Create an access token
  const token = new twilio.jwt.AccessToken(
    context.ACCOUNT_SID,
    context.API_KEY_SID,
    context.API_KEY_SECRET
  );

  // Create a video grant
  const videoGrant = new twilio.jwt.AccessToken.VideoGrant({
    room: event.streamName,
  });

  // Add the video grant and the user's identity to the token
  token.addGrant(videoGrant);
  token.identity = event.username;

  return callback(null, {
    streamDetails: {
      roomId: room.sid,
      streamName: event.streamName,
      playerStreamerId: playerStreamer.sid,
      mediaProcessorId: mediaProcessor.sid,
    },
    token: token.toJwt(),
  });
};
