const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is working!');
});

// ربط السيرفر بـ 0.0.0.0 للتوافق الكامل مع Render
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});

const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType, 
  PermissionsBitField 
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.Channel],
});

client.once('ready', () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.content === '!setup-ticket') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('create_ticket')
                .setLabel('📩 فتح تذكرة / Open Ticket')
                .setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({
            content: 'إضغط على الزر أسفله لفتح تذكرة دعم فني:',
            components: [row],
        });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'create_ticket') {
        const channelName = `ticket-${interaction.user.username}`;
        
        const channel = await interaction.guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                },
            ],
        });

        await interaction.reply({ content: `تم إنشاء تذكرتك بنجاح: ${channel}`, ephemeral: true });
        await channel.send(`مرحباً بك ${interaction.user}، يرجى كتابة مشكلتك وسيقوم فريق الدعم بالرد عليك قريباً.`);
    }
});

// استخدام process.env.TOKEN المتوافق مع إعدادات Render
client.login(process.env.TOKEN);


