const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('ASTRA Bot Pro Ticket System with Logs is running!');
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
  ButtonBuilder,
  ButtonStyle,
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

// ID قناة تكت-لوقز مدمج جاهز
const LOG_CHANNEL_ID = '1523537562289967104';

client.once('ready', () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    // أمر إغلاق التذكرة
    if (message.content === '!close') {
        if (message.channel.name.startsWith('ticket-')) {
            await closeTicket(message.channel, message.author);
        }
    }

    // أمر تنزيل لوحة التذاكر
    if (message.content === '!setup-ticket') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('✦ ▬▬▬▬▬▬▬▬▬ [ 📩 مركز الدعم الفني - ASTRA ] ▬▬▬▬▬▬▬▬▬ ✦')
            .setDescription(
                '‏‎ \n' +
                'مرحباً بكم في نظام الدعم الفني الخاص بسيرفر **ASTRA**.\n\n' +
                '📌 **ملاحظات وقوانين مهمة قبل فتح التذكرة:**\n' +
                '• يرجى اختيار نوع التذكرة المناسب لطلبك من القائمة المنسدلة أدناه.\n' +
                '• في حال فتح تذكرة بدون سبب أو الاستهانة بالإدارة سيتم التعامل مع العضو بالعقوبة المناسبة.\n' +
                '• يرجى الصبر وانتظار رد الإدارة وعدم تكرار الإشارات (Mention).\n\n' +
                '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
            )
            .setFooter({ text: 'ASTRA Support System • يرجى اختيار نوع التذكرة بالأسفل' });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('ticket_select')
            .setPlaceholder('اختر نوع التذكرة...')
            .addOptions([
                { label: 'استفسار', description: '@Inquiry', value: 'inquiry', emoji: '❓' },
                { label: 'شكوى', description: '@Complaint', value: 'complaint', emoji: '📝' },
                { label: 'طلب رول تفاعلي', description: '@Active Role', value: 'active_role', emoji: '⭐' },
                { label: 'طلب جروب خاص', description: '@Private Group', value: 'private_group', emoji: '🔒' },
                { label: 'تقديم طلب إداري', description: '@Staff Apply', value: 'staff_apply', emoji: '👑' },
                { label: 'سجلي في التكت', description: 'عرض سجل حظر التكت الخاص بك', value: 'my_logs', emoji: '📜' },
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

client.on('interactionCreate', async (interaction) => {
    // التعامل مع زر إغلاق التذكرة
    if (interaction.isButton() && interaction.customId === 'close_ticket') {
        await closeTicket(interaction.channel, interaction.user, interaction);
        return;
    }

    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === 'ticket_select') {
        const selectedValue = interaction.values[0];

        if (selectedValue === 'my_logs') {
            return interaction.reply({ 
                content: '❌ ليس لديك أي سجل حظر في نظام التذاكر الخاص بسيرفر ASTRA.', 
                ephemeral: true 
            });
        }

        let ticketTypeName = '';
        if (selectedValue === 'inquiry') ticketTypeName = 'استفسار';
        else if (selectedValue === 'complaint') ticketTypeName = 'شكوى';
        else if (selectedValue === 'active_role') ticketTypeName = 'رول-تفاعلي';
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

            await interaction.deferUpdate();
            await interaction.followUp({ content: `✅ تم إنشاء تذكرتك بنجاح: ${channel}`, ephemeral: true });

            const ticketEmbed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle(`📩 تذكرة جديدة: ${ticketTypeName}`)
                .setDescription(
                    `مرحباً بك ${interaction.user} في تذكرة **${ticketTypeName}**!\n\n` +
                    '⏳ **في انتظار الإدارة لقبول التكت.**\n' +
                    '⚠️ **تنبيه هام:** في حالة الإهمال، أو التحدث بشكل غير لائق، يتم تعرض العضو إلى العقوبة المناسبة من قبل طاقم الإدارة.\n\n' +
                    'يرجى كتابة تفاصيل طلبك أو مشكلتك بوضوح هنا.'
                )
                .setFooter({ text: 'لإغلاق التذكرة اضغط على الزر أسفله أو اكتب !close' });

            const closeButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('🔒 إغلاق التذكرة / Close')
                    .setStyle(ButtonStyle.Danger)
            );

            await channel.send({
                content: `${interaction.user}`,
                embeds: [ticketEmbed],
                components: [closeButton],
            });

            // 📜 إرسال لوق تكت جديد
            const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('📂 تكت جديد — ' + ticketTypeName)
                    .addFields(
                        { name: '📌 القناة', value: `${channel}`, inline: true },
                        { name: '🚨 النوع', value: `${ticketTypeName}`, inline: true },
                        { name: '👤 العضو', value: `${interaction.user} (${interaction.user.username})`, inline: true },
                        { name: '🕒 الوقت', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                    )
                    .setFooter({ text: 'ASTRA • سجل التذاكر' });

                await logChannel.send({ embeds: [logEmbed] });
            }

        } catch (error) {
            console.error(error);
            if (!interaction.replied) {
                await interaction.reply({ content: '❌ حدث خطأ أثناء إنشاء التذكرة، يرجى التأكد من صلاحيات البوت.', ephemeral: true });
            }
        }
    }
});

// دالة إغلاق التذكرة وتسجيل اللوق
async function closeTicket(channel, user, interaction = null) {
    if (interaction) {
        await interaction.reply('🔒 جاري إغلاق التذكرة وحذف القناة وتسجيل اللوق خلال 5 ثوانٍ...');
    } else {
        await channel.send('🔒 جاري إغلاق التذكرة وحذف القناة وتسجيل اللوق خلال 5 ثوانٍ...');
    }

    // 📜 إرسال لوق إغلاق التكت
    const logChannel = channel.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel) {
        const closeLogEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('📌 تكت مغلق')
            .addFields(
                { name: '📂 اسم القناة', value: `${channel.name}`, inline: true },
                { name: '👤 تم إغلاقه بواسطة', value: `${user} (${user.username})`, inline: true },
                { name: '🕒 الوقت', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
            )
            .setFooter({ text: 'ASTRA • سجل التذاكر' });

        await logChannel.send({ embeds: [closeLogEmbed] });
    }

    setTimeout(() => channel.delete().catch(() => {}), 5000);
}

client.login(process.env.TOKEN);
