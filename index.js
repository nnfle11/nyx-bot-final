const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('ASTRA Bot Pro Ticket System is running!');
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

client.once('ready', () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    // أمر إغلاق التذكرة إذا كتب العضو أو الإداري !close
    if (message.content === '!close') {
        if (message.channel.name.startsWith('ticket-')) {
            await message.channel.send('🔒 جاري إغلاق التذكرة وحذف القناة خلال 5 ثوانٍ...');
            setTimeout(() => message.channel.delete().catch(() => {}), 5000);
            return;
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
                '• يرجى الصبر وانتظار راد الإدارة وعدم تكرار الإشارات (Mention).\n\n' +
                '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
            )
            .setFooter({ text: 'ASTRA Support System • يرجى اختيار نوع التذكرة بالأسفل' });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('ticket_select')
            .setPlaceholder('اختر نوع التذكرة من هنا...')
            .addOptions([
                {
                    label: 'استفسار',
                    description: '@Inquiry - لطرح أي سؤال أو استفسار عام',
                    value: 'inquiry',
                    emoji: '❓',
                },
                {
                    label: 'شكوى',
                    description: '@Complaint - تقديم شكوى رسمية ضد عضو أو إداري',
                    value: 'complaint',
                    emoji: '📝',
                },
                {
                    label: 'طلب رول نشط',
                    description: '@Active Role - التقديم للحصول على الرتب التفاعلية',
                    value: 'active_role',
                    emoji: '⭐',
                },
                {
                    label: 'طلب جروب خاص',
                    description: '@Private Group - طلب إنشاء روم/جروب خاص بك',
                    value: 'private_group',
                    emoji: '🔒',
                },
                {
                    label: 'تقديم طلب إداري',
                    description: '@Staff Apply - التقديم للانضمام لـ طاقم إدارة ASTRA',
                    value: 'staff_apply',
                    emoji: '👑',
                },
                {
                    label: 'سجلي في التكت',
                    description: 'عرض سجل حظر التكت الخاص بك في السيرفر',
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
    // التعامل مع زر إغلاق التذكرة
    if (interaction.isButton() && interaction.customId === 'close_ticket') {
        await interaction.reply('🔒 جاري إغلاق التذكرة وحذف القناة خلال 5 ثوانٍ...');
        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
        return;
    }

    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === 'ticket_select') {
        const selectedValue = interaction.values[0];

        // في حال اختار "سجلي في التكت"
        if (selectedValue === 'my_logs') {
            return interaction.reply({ 
                content: '❌ ليس لديك أي سجل حظر في نظام التذاكر الخاص بسيرفر ASTRA.', 
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

            // 1. الرد التلقائي لإلغاء تحديد القائمة (يرجع القائمة المنسدلة لأصلها في الروم)
            await interaction.deferUpdate();

            // 2. إرسال رسالة خاصة للعضو برابط التذكرة
            await interaction.followUp({ content: `✅ تم إنشاء تذكرتك بنجاح: ${channel}`, ephemeral: true });

            // 3. إنشاء رسالة الترحيب والتحذير داخل التذكرة المفتوحة
            const ticketEmbed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle(`📩 تذكرة جديدة: ${ticketTypeName}`)
                .setDescription(
                    `مرحباً بك ${interaction.user} في تذكرة **${ticketTypeName}**!\n\n` +
                    '⏳ **يرجى انتظار الإدارة لقائك أو الرد عليك.**\n' +
                    '⚠️ **تنبيه هام:** في حالة الإهمال، التحدث بشكل غير لائق، أو فتح التذكرة بدون سبب واضح، يتعرض العضو للعقوبة المناسبة من قبل طاقم الإدارة.\n\n' +
                    'يرجى كتابة تفاصيل طلبك أو مشكلتك في أسفل الروم بوضوح.'
                )
                .setFooter({ text: 'لإغلاق التذكرة اضغطي على الزر أسفله أو اكتبي !close' });

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

        } catch (error) {
            console.error(error);
            if (!interaction.replied) {
                await interaction.reply({ content: '❌ حدث خطأ أثناء إنشاء التذكرة، يرجى التأكد من صلاحيات البوت.', ephemeral: true });
            }
        }
    }
});

client.login(process.env.TOKEN);
