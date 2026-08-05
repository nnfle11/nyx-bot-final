const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('ASTRA SYSTEM is running perfectly!');
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
    partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember],
});

// ID قناة اللوقز
const LOG_CHANNEL_ID = '1523537562289967104';

// قواعد بيانات الذاكرة
const warnings = new Map();
const muteHistory = new Map();
const userXP = new Map();

client.once('ready', () => {
    console.log(`ASTRA SYSTEM is Online! Logged in as ${client.user.tag}`);
});

// دالة إرسال اللوقز
async function sendLog(guild, title, description, color = '#ff0000') {
    const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel) {
        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(title)
            .setDescription(description)
            .setFooter({ text: 'ASTRA SYSTEM • سجل النظام واللوقز' })
            .setTimestamp();
        await logChannel.send({ embeds: [embed] }).catch(() => {});
    }
}

// -------------------------------------------------------------
// 1. قراءة الرسائل والأوامر
// -------------------------------------------------------------
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // --- الحماية الأوتوماتيكية ---
    const discordInviteRegex = /(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/[a-zA-Z0-9]+/i;
    if (discordInviteRegex.test(message.content) && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        await message.delete().catch(() => {});
        await sendLog(message.guild, 'حماية أوتوماتيكية', `تم مسح رابط سيرفر من العضو ${message.author} في ${message.channel}`);
        return message.channel.send(`${message.author} يمنع نشر روابط السيرفرات هنا!`).then(m => setTimeout(() => m.delete(), 4000));
    }

    // --- زيادة XP للفل ---
    const userId = message.author.id;
    const currentXP = userXP.get(userId) || 0;
    userXP.set(userId, currentXP + 1);

    const args = message.content.trim().split(/ +/);
    const command = args[0];

    // ================== أوامر التذاكر ==================
    if (command === '!close') {
        if (message.channel.name.startsWith('ticket-')) {
            await closeTicket(message.channel, message.author);
        }
        return;
    }

    if (command === '!setup-ticket') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setDescription(
                '# **مَرْكَزُ الدَّعْمِ وَالْخِدْمَاتِ — ASTRA**\n' +
                'أهــــــــــــــلاً بــــــــك فــي قــسـم الــتــذاكر الـخاص بـســيرفـر اســتـرا • يــــــــــــــترجى قراءة التعليمات والتنبيهات أدناه قبل فتح أي تذكرة\n\n' +
                '## **التَّـــــــــــعْـــــــلِـــيمَــاتُ وَالْقَــوَانِــيــنُ**\n' +
                '### **1 اختر التصنيف المناسب لطلبك من القائمة أدناه لتسهيل خدمتك.**\n' +
                '### **2 بانتظار الإدارة لقبول التكت، لا تمنشن اي اداري البوت يختار وحده.**\n' +
                '### **3 فتح التذكرة بدواعي المزاح أو الاستهانة يتعرض صاحبه للعقوبة مباشرة.**'
            )
            .setFooter({ text: 'ASTRA Support System • يرجى اختيار نوع التذكرة بالأسفل' });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('ticket_select')
            .setPlaceholder('اختر نوع التذكرة...')
            .addOptions([
                { label: 'استفسار', description: '@Inquiry', value: 'inquiry' },
                { label: 'شكوى', description: '@Complaint', value: 'complaint' },
                { label: 'طلب رول تفاعلي', description: '@Active Role', value: 'active_role' },
                { label: 'طلب جروب خاص', description: '@Private Group', value: 'private_group' },
                { label: 'تقديم طلب إداري', description: '@Staff Apply', value: 'staff_apply' },
                { label: 'سجلي في التكت', description: 'عرض سجل حظر التكت الخاص بك', value: 'my_logs' },
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await message.channel.send({ embeds: [embed], components: [row] });
        return;
    }

    // ================== أوامر الإدارة ==================
    if (command === 'قفل') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
        await message.channel.permissionOverwrites.edit(message.guild.id, { SendMessages: false });
        await sendLog(message.guild, '🔒 قفل قناة', `تم قفل القناة ${message.channel} بواسطة ${message.author}`, '#ff9900');
        return message.reply('تم قفل القناة بنجاح.');
    }

    if (command === 'فتح') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
        await message.channel.permissionOverwrites.edit(message.guild.id, { SendMessages: true });
        await sendLog(message.guild, '🔓 فتح قناة', `تم فتح القناة ${message.channel} بواسطة ${message.author}`, '#00ff00');
        return message.reply('تم فتح القناة بنجاح.');
    }

    if (command === 'امسح') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;
        let amount = parseInt(args[1]);
        if (message.reference) {
            const targetMsg = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
            if (targetMsg) await targetMsg.delete().catch(() => {});
            await message.delete().catch(() => {});
            await sendLog(message.guild, '🗑️ مسح رسالة', `تم مسح رسالة في ${message.channel} بواسطة ${message.author}`, '#ffff00');
            return;
        } else if (!isNaN(amount)) {
            await message.channel.bulkDelete(Math.min(amount + 1, 100)).catch(() => {});
            await sendLog(message.guild, '🗑️ مسح رسائل متعددة', `تم مسح ${amount} رسالة في ${message.channel} بواسطة ${message.author}`, '#ffff00');
            return;
        } else {
            await message.delete().catch(() => {});
            return;
        }
    }

    // --- الأوامر التي تتطلب الرد (Reply) ---
    if (command === 'اسكت' || command === 'تكلم' || command === 'باند' || command === 'طرد' || command === 'تنبيه' || command === 'سجن' || command === 'pf') {
        
        if (!message.reference) {
            return message.reply('⚠️ يجب عليك إستخدام هذا الأمر بالرد (Reply) على رسالة الشخص المستهدف!');
        }

        const referencedMsg = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
        if (!referencedMsg) return message.reply('تعذر الوصول للرسالة المردود عليها!');
        
        const targetMember = referencedMsg.member || await message.guild.members.fetch(referencedMsg.author.id).catch(() => null);
        if (!targetMember) return message.reply('تعذر العثور على هذا العضو في السيرفر!');

        if (command === 'اسكت') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`mute_reason_${targetMember.id}_${message.author.id}`)
                .setPlaceholder('اختر سبب الإسكات...')
                .addOptions([
                    { label: 'سب وقذف', description: 'إسكات لمدة ساعتين', value: '2h_sub' },
                    { label: 'نشر محتوى غير لائق / صور إباحية', description: 'إسكات لمدة 24 ساعة', value: '24h_porn' },
                    { label: 'إهانة / المساس بالدين', description: 'إسكات لمدة 7 أيام', value: '7d_religion' },
                    { label: 'إثارة المشاكل والجدال', description: 'إسكات لمدة 30 دقيقة', value: '30m_problems' },
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);
            return message.reply({ content: `اختر سبب إسكات العضو ${targetMember}:`, components: [row] });
        }

        if (command === 'تكلم') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;
            await targetMember.timeout(null).catch(() => {});
            await sendLog(message.guild, '🔊 فك الإسكات', `تم فك الإسكات عن ${targetMember} بواسطة ${message.author}`, '#00ff00');
            return message.reply(`تم فك الإسكات عن ${targetMember}.`);
        }

        if (command === 'باند') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return;
            await targetMember.ban({ reason: `باند بواسطة ${message.author.tag}` }).catch(() => {});
            await sendLog(message.guild, '⛔ حظر دائم (باند)', `تم حظر ${targetMember.user.tag} نهائياً بواسطة ${message.author}`, '#ff0000');
            return message.reply(`تم إعطاء باند دائم للعضو ${targetMember.user.tag}.`);
        }

        if (command === 'طرد') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return;
            await targetMember.kick(`طرد بواسطة ${message.author.tag}`).catch(() => {});
            await sendLog(message.guild, '👢 طرد عُضو', `تم طرد ${targetMember.user.tag} بواسطة ${message.author}`, '#ff6600');
            return message.reply(`تم طرد العضو ${targetMember.user.tag} من السيرفر.`);
        }

        if (command === 'تنبيه') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;
            
            let userWarns = (warnings.get(targetMember.id) || 0) + 1;
            warnings.set(targetMember.id, userWarns);

            if (userWarns >= 3) {
                warnings.set(targetMember.id, 0);
                await targetMember.timeout(12 * 60 * 60 * 1000, 'تجاوز 3 تنبيهات').catch(() => {});
                await sendLog(message.guild, '⚠️ عقوبة التنبيه الثالث', `تم إسكات ${targetMember} لمدة 12 ساعة لتجاوزه 3 تنبيهات بواسطة ${message.author}`, '#ff3300');
                return message.reply(`تلقى ${targetMember} التنبيه الثالث! تم إسكاته أوتوماتيكياً لمدة 12 ساعة.`);
            } else {
                await sendLog(message.guild, '⚠️ تنبيه جديد', `تم إعطاء التنبيه (${userWarns}/3) للعضو ${targetMember} بواسطة ${message.author}`, '#ffcc00');
                return message.reply(`تم إعطاء تنبيه لـ ${targetMember}. (عدد التنبيهات الحالي: ${userWarns}/3)`);
            }
        }

        if (command === 'سجن') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
            const jailRole = message.guild.roles.cache.find(r => r.name === 'مسجون' || r.name === 'Jail');
            
            if (!jailRole) {
                return message.reply('لم يتم العثور على رتبة باسم "مسجون" في السيرفر!');
            }

            const currentRoles = targetMember.roles.cache.filter(r => r.id !== message.guild.id);
            await targetMember.roles.remove(currentRoles).catch(() => {});
            await targetMember.roles.add(jailRole).catch(() => {});
            await sendLog(message.guild, '🚨 سجن عضو', `تم سجن ${targetMember} وسحب جميع رتبه بواسطة ${message.author}`, '#880000');
            return message.reply(`تم إدخال ${targetMember} إلى السجن وإزالة رتبه.`);
        }

        if (command === 'pf') {
            const xp = userXP.get(targetMember.id) || 0;
            const level = Math.floor(xp / 20);
            const userWarns = warnings.get(targetMember.id) || 0;
            const history = muteHistory.get(targetMember.id) || { count: 0, reason: 'لا يوجد', duration: 'لا يوجد' };

            const pfEmbed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle(`الملف الشخصي — ${targetMember.user.username}`)
                .addFields(
                    { name: 'اللفل في الشات العام', value: `Level ${level} (${xp} XP)`, inline: true },
                    { name: 'تاريخ دخول الديسكورد', value: `<t:${Math.floor(targetMember.user.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: 'تاريخ دخول السيرفر', value: `<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:R>`, inline: true },
                    { name: 'عدد التحذيرات', value: `${userWarns} / 3`, inline: true },
                    { name: 'عدد الميوتات', value: `${history.count}`, inline: true },
                    { name: 'آخر سبب إسكات', value: `${history.reason}`, inline: true },
                    { name: 'مدة آخر إسكات', value: `${history.duration}`, inline: true }
                )
                .setFooter({ text: 'ASTRA SYSTEM' });

            return message.reply({ embeds: [pfEmbed] });
        }
    }
});

// -------------------------------------------------------------
// 2. القوائم المنسدلة والأزرار
// -------------------------------------------------------------
client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'close_ticket') {
        await closeTicket(interaction.channel, interaction.user, interaction);
        return;
    }

    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === 'ticket_select') {
        const selectedValue = interaction.values[0];

        if (selectedValue === 'my_logs') {
            return interaction.reply({ content: 'ليس لديك أي سجل حظر في نظام التذاكر الخاص بسيرفر ASTRA.', ephemeral: true });
        }

        let ticketTypeName = '';
        if (selectedValue === 'inquiry') ticketTypeName = 'استفسار';
        else if (selectedValue === 'complaint') ticketTypeName = 'شكوى';
        else if (selectedValue === 'active_role') ticketTypeName = 'رول-تفاعلي';
        else if (selectedValue === 'private_group') ticketTypeName = 'جروب-خاص';
        else if (selectedValue === 'staff_apply') ticketTypeName = 'طلب-إداري';

        const channelName = `ticket-${ticketTypeName}-${interaction.user.username}`;
        
        try {
            const members = await interaction.guild.members.fetch();
            const adminMembers = members.filter(m => !m.user.bot && m.permissions.has(PermissionsBitField.Flags.Administrator));
            const randomAdmin = adminMembers.random();
            const assignedAdminText = randomAdmin ? `${randomAdmin}` : 'طاقم الإدارة';

            const channel = await interaction.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                    ...(randomAdmin ? [{ id: randomAdmin.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }] : [])
                ],
            });

            await interaction.deferUpdate();
            await interaction.followUp({ content: `تم إنشاء تذكرتك بنجاح: ${channel}`, ephemeral: true });

            const ticketEmbed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle(`تذكرة جديدة: ${ticketTypeName}`)
                .setDescription(
                    `# مرحباً بك ${interaction.user} في تذكرة **${ticketTypeName}**!\n\n` +
                    `**الإداري المسؤول المستلم للتكت:** ${assignedAdminText}\n\n` +
                    '**بانتظار الإدارة لقبول التكت.**\n' +
                    '**تنبيه هام:** في حالة الإهمال، أو التحدث بشكل غير لائق، يتم تعرض العضو إلى العقوبة المناسبة من قبل طاقم الإدارة.\n\n' +
                    'يرجى كتابة تفاصيل طلبك أو مشكلتك بوضوح هنا.'
                )
                .setFooter({ text: 'لإغلاق التذكرة اضغط على الزر أسفله أو اكتب !close' });

            const closeButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('إغلاق التذكرة / Close')
                    .setStyle(ButtonStyle.Danger)
            );

            await channel.send({ content: `${interaction.user} | ${assignedAdminText}`, embeds: [ticketEmbed], components: [closeButton] });
            await sendLog(interaction.guild, '🎫 تكت جديد — ' + ticketTypeName, `**القناة:** ${channel}\n**العضو:** ${interaction.user}\n**الإداري المكلف:** ${assignedAdminText}`, '#00ff00');

        } catch (error) {
            console.error(error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'حدث خطأ أثناء إنشاء التذكرة، يرجى التأكد من صلاحيات البوت.', ephemeral: true });
            }
        }
    }

    if (interaction.customId.startsWith('mute_reason_')) {
        const parts = interaction.customId.split('_');
        const targetUserId = parts[2];
        const adminId = parts[3];

        const targetMember = await interaction.guild.members.fetch(targetUserId).catch(() => null);

        if (!targetMember) {
            return interaction.reply({ content: 'تعذر العثور على العضو!', ephemeral: true });
        }

        let duration = 0;
        let durationText = '';
        let reasonText = '';

        if (interaction.values[0] === '2h_sub') {
            duration = 2 * 60 * 60 * 1000;
            durationText = 'ساعتين (2h)';
            reasonText = 'سب وقذف';
        } else if (interaction.values[0] === '24h_porn') {
            duration = 24 * 60 * 60 * 1000;
            durationText = '24 ساعة';
            reasonText = 'نشر محتوى غير لائق / صور إباحية';
        } else if (interaction.values[0] === '7d_religion') {
            duration = 7 * 24 * 60 * 60 * 1000;
            durationText = '7 أيام';
            reasonText = 'إهانة / المساس بالدين';
        } else if (interaction.values[0] === '30m_problems') {
            duration = 30 * 60 * 1000;
            durationText = '30 دقيقة';
            reasonText = 'إثارة المشاكل والجدال';
        }

        await targetMember.timeout(duration, reasonText).catch(() => {});

        const userHistory = muteHistory.get(targetMember.id) || { count: 0, reason: '', duration: '' };
        muteHistory.set(targetMember.id, {
            count: userHistory.count + 1,
            reason: reasonText,
            duration: durationText
        });

        await sendLog(
            interaction.guild, 
            '🔇 إسكات عضو (اسكت)', 
            `**العضو:** ${targetMember} (${targetMember.user.username})\n` +
            `**بواسطة الأدمن:** <@${adminId}>\n` +
            `**السبب:** ${reasonText}\n` +
            `**المدة:** ${durationText}`,
            '#ff9900'
        );

        await interaction.update({ 
            content: `تم إسكات العضو ${targetMember} بنجاح!\nالسبب: **${reasonText}**\nالمدة: **${durationText}**`, 
            components: [] 
        });
    }
});

async function closeTicket(channel, user, interaction = null) {
    if (interaction) {
        await interaction.reply('جاري إغلاق التذكرة وحذف القناة وتسجيل اللوق خلال 5 ثوانٍ...');
    } else {
        await channel.send('جاري إغلاق التذكرة وحذف القناة وتسجيل اللوق خلال 5 ثوانٍ...');
    }

    await sendLog(channel.guild, '🔒 تكت مغلق', `**اسم القناة:** ${channel.name}\n**تم إغلاقه بواسطة:** ${user} (${user.username})`, '#ff0000');
    setTimeout(() => channel.delete().catch(() => {}), 5000);
}

client.login(process.env.TOKEN);
