require('dotenv').config({ path: './bot/.env' });

const token = process.env.DISCORD_TOKEN;
const discordid = "541388135712423936";
const guildId = "1088461749902118956";

const { Client, IntentsBitField } = require('discord.js');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildPresences,
    ]
});

client.on('clientReady', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;

    await guild.members.fetch();

    setInterval(() => {
        const presence = guild.presences.cache.get(discordid);
        const activity = presence?.activities?.[0];

        if (!presence) {
            console.log('No presence');
            return;
        }

        console.log({
            status: presence.status,
            user: presence.user?.tag || presence.userId,

            name: activity?.name,
            type: activity?.type,
            state: activity?.state,
            details: activity?.details,
            url: activity?.url,

            createdAt: activity?.createdAt,
            createdTimestamp: activity?.createdTimestamp,

            applicationId: activity?.applicationId,
            syncId: activity?.syncId,

            emoji: activity?.emoji,
            party: activity?.party,
            flags: activity?.flags,

            assets: activity?.assets,
            buttons: activity?.buttons,

            timestamps: activity?.timestamps
        });
    }, 5000);
});

client.login(token);