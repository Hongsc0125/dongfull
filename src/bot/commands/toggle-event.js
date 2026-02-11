import {
    PermissionsBitField,
    MessageFlags
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

        // 간단한 알림창 스타일
        const statusText = newStatus ? '✅ 활성화' : '❌ 비활성화';
        const content = `${statusText}됨: **${event.event_name}**`;

        await interaction.reply({ 
            content: content,
            flags: MessageFlags.Ephemeral
        });

    } catch (error) {
        console.error('Error toggling event:', error);
        await interaction.reply({
            content: '❌ 이벤트 상태 변경 중 오류가 발생했습니다.',
            flags: MessageFlags.Ephemeral
        });
    }
}

