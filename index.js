const { Client, Intents } = require("discord.js");
const ytdl = require("ytdl-core");
const { prefix, token, google_key } = require("./config.json");
const google = require('googleapis');

const youtube = new google.youtube_v3.Youtube({
  version: 'v3',
  auth: google_key,
});

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_VOICE_STATES,
    554116843264,
  ],
});

const servers = {
  server: {
    connection: null,
    dispatcher: null,
    queue: [],
    isPlaying: false,
  },
};

client.on("ready", () => {
  console.log("Connected!");
});

client.on("message", async (message) => {
  if (!message.guild) return;

  if (!message.content.startsWith(prefix)) return;

  if (!message.member.voice.channel) {
    message.channel.send("You need to be on a voice channel!");
    return;
  }

  if (message.content === prefix + "join") {
    try {
      servers.server.connection = await message.member?.voice.channel.join();
    } catch (error) {
      console.log('Error when joining a voice channel!');
      console.log(error);
    }
  }

  if (message.content === prefix + "leave") {
    message.member?.voice.channel.leave();
    servers.server.connection = null;
    servers.server.dispatcher = null;
  }

  if (message.content.startsWith(prefix + "play")) {
    let play_music = message.content.slice(6);

    if (play_music.length === 0) {
      message.channel.send('I need something to touch 🤦');
      return;
    }

    if (servers.server.connection === null) {
      try {
        servers.server.connection = await message.member?.voice.channel.join();
      } catch (error) {
        console.log('Error when joining a voice channel!');
        console.log(error);
      }
    }

    if (ytdl.validateURL(play_music)) {
      servers.server.queue.push(play_music);
      console.log('Add: ' + play_music);
    } else {
      youtube.search.list({
        q: play_music,
        part: 'snippet',
        fields: 'items(id(videoId),snippet(title))',
        type: 'video',
      }, function (err, result) {
        if (err) {
          console.log(err);
        }
        if (result) {
          const id = result.data.items[0].id.videoId;
          play_music = 'https://www.youtube.com/watch?v=' + id;
          servers.server.queue.push(play_music);
          console.log('Add: ' + play_music);
        }
      });
    }
    plaYMusic();
  }

  if (message.content === prefix + 'pause') {
    servers.server.dispatcher.pause();
  }

  if (message.content === prefix + 'resume') {
    if (servers.server.dispatcher.paused){
      servers.server.dispatcher.resume();
    }
  }

});

const plaYMusic = () => {
  if (servers.server.isPlaying === false) {
    const playing = servers.server.queue[0];
    servers.server.isPlaying = true;
    servers.server.dispatcher = servers.server.connection.play(
      ytdl(
        playing,
        { filter: "audioonly" }
      )
    );
    servers.server.dispatcher.on('finish', () => {
      servers.server.queue.shift();
      servers.server.isPlaying = false;
      if (servers.server.queue.length > 0) {
        plaYMusic();
      } else {
        servers.server.dispatcher = null;
      }
    });
  }
};

client.login(token);