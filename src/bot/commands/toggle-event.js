import {
    PermissionsBitField,
    ContainerBuilder,
    SectionBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags,
    ThumbnailBuilder
} from 'discord.js';
import { getEventById, updateEvent } from '../../database/events.js';

export async function handleToggleEvent(interaction) {
    // Check permissions
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return await interaction.reply({
            content: '❌ 이 명령어는 관리자만 사용할 수 있습니다.',
            flags: MessageFlags.Ephemeral
        });
    }

    const eventId = parseInt(interaction.options.getString('이벤트'));

    try {
        const event = await getEventById(eventId);
        if (!event || event.guild_id !== interaction.guildId) {
            return await interaction.reply({
                content: '❌ 존재하지 않는 이벤트이거나 다른 서버의 이벤트입니다.',
                flags: MessageFlags.Ephemeral
            });
        }

        const newStatus = !event.is_active;
        const updatedEvent = await updateEvent(eventId, { is_active: newStatus });

        const section = new SectionBuilder()
            .setThumbnailAccessory(
                new ThumbnailBuilder().setURL('https://harmari.duckdns.org/static/alarm.png')
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## 🔄 이벤트 상태가 변경되었습니다`)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**${event.event_name}**의 상태가 변경되었습니다.\n\n` +
                    `### 🎯 이벤트명: ${event.event_name}\n` +
                    `### 🔘 이전 상태: ${event.is_active ? '✅ 활성' : '❌ 비활성'}\n` +
                    `### 🔘 현재 상태: ${newStatus ? '✅ 활성' : '❌ 비활성'}`
                )
            );

        if (newStatus) {
            section.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `### ✅ 활성화됨\n` +
                    `• 이제 이 이벤트에 점수를 추가할 수 있습니다\n` +
                    `• 자동완성 목록에 표시됩니다`
                )
            );
        } else {
            section.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `### ❌ 비활성화됨\n` +
                    `• 더 이상 점수를 추가할 수 없습니다\n` +
                    `• 기존 데이터는 보존됩니다\n` +
                    `• 언제든지 다시 활성화할 수 있습니다`
                )
            );
        }

        const container = new ContainerBuilder()
            .addSectionComponents(section)
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`*변경자: ${interaction.user.tag} • <t:${Math.floor(Date.now() / 1000)}:R>*`)
            );

        await interaction.reply({ 
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });

    } catch (error) {
        console.error('Error toggling event:', error);
        await interaction.reply({
            content: '❌ 이벤트 상태 변경 중 오류가 발생했습니다.',
            flags: MessageFlags.Ephemeral
        });
    }
}