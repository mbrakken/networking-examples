const WebSocket = require('ws');

const list = Symbol('channelList');
const publisherClient = Symbol('publisher');
const subscriberClient = Symbol('subscriber');
const subscribersSym = Symbol('subscribers');

class Channel {
  constructor(channel, subClient) {
    this.name = channel;
    this[subscribersSym] = new Set();
    this[subscriberClient] = subClient;
  }

  subscribe(socket) {
    this[subscribersSym].add(socket);
  }

  unsubscribe(socket) {
    this[subscribersSym].delete(socket);
  }

  get subscribers() {
    return this[subscribersSym];
  }
}

class ChatBot {
  constructor(redisClient) {
    this[publisherClient] = redisClient;
    this[subscriberClient] = redisClient.duplicate();
    this[list] = new Map();
  }

  async init() {
    await this[subscriberClient].connect();

    // keep a separate list with metadata?
    const channelList = await this[subscriberClient].pubSubChannels();

    console.log('Initialize channels:', channelList);

    // populate a local collection of channels
    channelList.forEach(async (channel) => {
      await this.addChannel(channel);
    });

    console.log('added active channels');

    if (!this[list].has('general')) {
      await this.addChannel('general');
    }

    console.log('Current channels:', this.channels);

    // remove all this from here, just manage subscriber list?
    await this[subscriberClient].pSubscribe(
      '*',
      (publishedMessage, channelName) => {
        console.log(`${channelName} subscriber got message`, publishedMessage);
        const { person, message } = JSON.parse(publishedMessage);

        const subscribers = this.getChannel(channelName).subscribers;
        console.log(`Try sending to ${subscribers.size} subscribers`);

        for (let socket of subscribers) {
          try {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(`[ ${channelName} ] ${person}: ${message}`);
            }
          } catch (e) {
            console.error('Failed to send message', e);
          }
        }
      }
    );
  }

  async addChannel(channelName) {
    const channels = this[list];

    if (channels.has(channelName)) {
      console.warn(`Channel "${channelName}" already exists`);
    } else {
      console.log('Add channel', channelName);
      const channel = new Channel(channelName, this[subscriberClient]);
      channels.set(channelName, channel);
    }
  }

  getChannel(channel) {
    if (!this[list].has(channel)) {
      throw new Error('Channel does not exist');
    }

    return this[list].get(channel);
  }

  async addSubscriber(channel, socket) {
    if (!this[list].has(channel)) {
      throw new Error('Channel does not exist');
    }

    console.log(`Add subscriber to ${channel}`);

    await this[list].get(channel).subscribe(socket);
  }

  async removeSubscriber(channel, socket) {
    if (!this[list].has(channel)) {
      throw new Error('Channel does not exist');
    }

    console.log(`Remove subscriber from ${channel}`);

    await this[list].get(channel).unsubscribe(socket);
  }

  hangUp(socket) {
    this[list].forEach((channel) => {
      channel.unsubscribe(socket);
    });
  }

  postMessage(message, person = 'ChatBort', channel = 'general') {
    console.log('POST MESSAGE TO', channel);
    this[publisherClient].publish(
      channel,
      JSON.stringify({
        person,
        message: message.toString(),
      })
    );
  }

  get channels() {
    return Array.from(this[list].keys());
  }
}

module.exports = ChatBot;
