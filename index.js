const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is working perfectly!');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});

const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  EmbedBuilder, 
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
    // الأمر لتنزيل قائمة التذاكر
    if (message.content === '!setup-ticket') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('✦ ASTRA - نظام التذاكر والدعم الفني ✦')
            .setDescription('مرحباً بكم في نظام الدعم الفني الخاص بسيرفر **ASTRA**.\nيرجى اختيار نوع التذكرة المناسب من القائمة المنسدلة أسفله:');

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('ticket_select')
            .setPlaceholder('اختر نوع التذكرة...')
            .addOptions([
                {
                    label: 'استفسار',
                    description: '@Inquiry',
                    value: 'inquiry',
                    emoji: '❓',
                },
                {
                    label: 'شكوى',
                    description: '@Complaint',
                    value: 'complaint',
                    emoji: '📝',
                },
                {
                    label: 'طلب رول نشط',
                    description: '@Active Role',
                    value: 'active_role',
                    emoji: '⭐',
                },
                {
                    label: 'طلب جروب خاص',
                    description: '@Private Group',
                    value: 'private_group',
                    emoji: '🔒',
                },
                {
                    label: 'تقديم طلب إداري',
                    description: '@Staff Apply',
                    value: 'staff_apply',
                    emoji: '👑',
                },
                {
                    label: 'سجلي في التكت',
                    description: 'عرض سجل حظر التكت الخاص بك',
                    value: 'my_logs',
                    emoji: '📜',
                },
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await message.channel.send({
            embeds: [embed],
            components: [row],
        });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === 'ticket_select') {
        const selectedValue = interaction.values[0];

        // إذا اختار "سجلي في التكت"
        if (selectedValue === 'my_logs') {
            return interaction.reply({ 
                content: '❌ ليس لديك أي سجل حظر في نظام التذاكر.', 
                ephemeral: true 
            });
        }

        let ticketTypeName = '';
        if (selectedValue === 'inquiry') ticketTypeName = 'استفسار';
        else if (selectedValue === 'complaint') ticketTypeName = 'شكوى';
        else if (selectedValue === 'active_role') ticketTypeName = 'رول-نشط';
        else if (selectedValue === 'private_group') ticketTypeName = 'جروب-خاص';
        else if (selectedValue === 'staff_apply') ticketTypeName = 'طلب-إداري';

        const channelName = `ticket-${ticketTypeName}-${interaction.user.username}`;
        
        try {
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

            await interaction.reply({ content: `✅ تم إنشاء تذكرتك بنجاح: ${channel}`, ephemeral: true });
            await channel.send(`مرحباً بك ${interaction.user}، يرجى كتابة تفاصيل طلبك الخاص بـ (**${ticketTypeName}**) وسيقوم فريق الدعم بالرد عليك قريباً.`);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ حدث خطأ أثناء إنشاء التذكرة، يرجى التأكد من صلاحيات البوت.', ephemeral: true });
        }
    }
});

client.login(process.env.TOKEN);
