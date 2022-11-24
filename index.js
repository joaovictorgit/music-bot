const { Client, Intents, MessageEmbed } = require("discord.js");
const ytdl = require("ytdl-core");
const { prefix, token, google_key } = require("./config.json");
const google = require("googleapis");

const youtube = new google.youtube_v3.Youtube({
  version: "v3",
  auth: google_key,
});
/*
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_VOICE_STATES,
    554116843264,
*/
const client = new Client({
  intents: [7796],
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

  if (message.content === prefix + "Hi") {
    const embed = new MessageEmbed()
      .setColor([216, 46, 46])
      .setThumbnail('https://i.pinimg.com/736x/93/6b/1b/936b1bfb19852fe431aeaf7da6e7917d.jpg')
      .setAuthor('Music Bot', 'https://i.pinimg.com/736x/13/8d/52/138d52a8f429510e2c16bd67990dae3c.jpg', 'https://discord.js.org')
      .setTitle('Instructions on how to use the bot')
      .addFields(
        {name: 'Join the voice channel', value: 'OBS:You need to join the voice channel so the bot can join \n !join' },
        { name: 'Play music', value: '!play <url> or play <artist>'},
        { name: 'Pause music', value: '!pause'},
        { name: 'Resume music', value: '!resume'},
        { name: 'Leave the voice channel', value: '!leave'},
      )
      .setTimestamp();

    message.channel.send(embed);
  }

  if (message.content === prefix + "join") {
    try {
      servers.server.connection = await message.member.voice.channel.join();
    } catch (error) {
      console.log("Error when joining a voice channel!");
      console.log(error);
    }
  }

  if (message.content === prefix + "leave") {
    message.member?.voice.channel.leave();
    servers.server.connection = null;
    servers.server.dispatcher = null;
    servers.server.isPlaying = false;
    servers.server.queue = [];
  }

  if (message.content.startsWith(prefix + "play")) {
    let play_music = message.content.slice(6);

    if (play_music.length === 0) {
      message.channel.send("I need something to touch 🤦");
      return;
    }

    if (servers.server.connection === null) {
      try {
        servers.server.connection = await message.member.voice.channel.join();
      } catch (error) {
        console.log("Error when joining a voice channel!");
        console.log(error);
      }
    }

    if (ytdl.validateURL(play_music)) {
      servers.server.queue.push(play_music);
      console.log("Add: " + play_music);
      plaYMusic();
    } else {
      youtube.search.list(
        {
          q: play_music,
          part: "snippet",
          fields: "items(id(videoId),snippet(title,channelTitle))",
          type: "video",
        },
        function (err, result) {
          if (err) {
            console.log(err);
          }
          if (result) {
            const listResults = [];
            for (let i in result.data.items) {
              const itemMount = {
                id:
                  "https://www.youtube.com/watch?v=" +
                  result.data.items[i].id.videoId,
                titleVideo: result.data.items[i].snippet.title,
                nameChannel: result.data.items[i].snippet.channelTitle,
              };
              listResults.push(itemMount);
            }

            const embed = new MessageEmbed()
              .setColor([216, 46, 46])
              .setAuthor('Music Bot', 'https://i.pinimg.com/736x/13/8d/52/138d52a8f429510e2c16bd67990dae3c.jpg', 'https://discord.js.org')
              .setDescription("Choose your song 1-5:")
              .setTimestamp()
              .setThumbnail(
                "https://i.pinimg.com/originals/39/e4/4f/39e44f1e597af59afd6cc3aeddb3737c.jpg"
              )
              .setFooter("Enjoy the music", 'https://i.pinimg.com/736x/13/8d/52/138d52a8f429510e2c16bd67990dae3c.jpg');
            for (let i in listResults) {
              embed.addField(
                `${parseInt(i) + 1}º - ${listResults[i].titleVideo}`,
                listResults[i].nameChannel
              );
            }

            message.channel.send(embed).then((embedMessage) => {
              const reactions = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];
              for (let i = 0; i < reactions.length; i++) {
                embedMessage.react(reactions[i]);
              }

              const filter = (reaction, user) => {
                return (
                  reactions.includes(reaction.emoji.name) &&
                  user.id === message.author.id
                );
              };

              embedMessage
                .awaitReactions(filter, {
                  max: 1,
                  time: 20000,
                  errors: ["time"],
                })
                .then((collected) => {
                  const reaction = collected.first();
                  const idSelect = reactions.indexOf(reaction.emoji.name);
                  message.channel.send(
                    `You chose ${listResults[idSelect].titleVideo} of ${listResults[idSelect].nameChannel}`
                  );
                  servers.server.queue.push(listResults[idSelect].id);
                  //console.log(servers.server.queue);
                  plaYMusic();
                })
                .catch((error) => {
                  message.reply("You have not chosen a valid option!");
                  console.log(error);
                });
            });

            /*const id = result.data.items[0].id.videoId;
            play_music = "https://www.youtube.com/watch?v=" + id;
            servers.server.queue.push(play_music);
            console.log("Add: " + play_music);
            plaYMusic();*/
          }
        }
      );
    }
  }

  if (message.content === prefix + "pause") {
    servers.server.dispatcher.pause();
  }

  if (message.content === prefix + "resume") {
    if (servers.server.dispatcher.paused) {
      servers.server.dispatcher.resume();
    }
  }
});

const plaYMusic = () => {
  if (servers.server.isPlaying === false) {
    const playing = servers.server.queue[0];
    servers.server.isPlaying = true;
    servers.server.dispatcher = servers.server.connection.play(
      ytdl(playing, { filter: "audioonly", highWaterMark: 1 << 25 })
    );
    servers.server.dispatcher.on("finish", () => {
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
