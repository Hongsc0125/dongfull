import {
    ContainerBuilder,
    SectionBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags,
    ThumbnailBuilder
} from 'discord.js';
import { getEvents } from '../../database/events.js';

export async function handleEventList(interaction) {
    try {
        const events = await getEvents(interaction.guildId);

        if (events.length === 0) {
            const section = new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## 📋 이벤트 목록`)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('생성된 이벤트가 없습니다.\n\n### 🆕 이벤트 생성\n`/이벤트생성` 명령어로 새 이벤트를 만들어보세요!')
                );

            const container = new ContainerBuilder()
                .addSectionComponents(section)
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`*<t:${Math.floor(Date.now() / 1000)}:R>*`)
                );

            return await interaction.reply({ 
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        // Group events by active/inactive
        const activeEvents = events.filter(event => event.is_active);
        const inactiveEvents = events.filter(event => !event.is_active);

        const section = new SectionBuilder()
            .setThumbnailAccessory(
                new ThumbnailBuilder().setURL('https://harmari.duckdns.org/static/alarm.png')
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## 📋 ${interaction.guild.name}의 이벤트 목록`)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`총 ${events.length}개의 이벤트`)
            );

        let eventListContent = '';

        if (activeEvents.length > 0) {
            const activeText = activeEvents.slice(0, 10).map(event => {
                const scoreType = getScoreTypeDisplay(event.score_type);
                const createdDate = new Date(event.created_at).toLocaleDateString('ko-KR');
                return `**${event.event_name}** (ID: ${event.id})\n${scoreType} • ${createdDate}`;
            }).join('\n\n');

            eventListContent += `### ✅ 활성 이벤트 (${activeEvents.length}개)\n${activeText}\n\n`;
        }

        if (inactiveEvents.length > 0) {
            const inactiveText = inactiveEvents.slice(0, 5).map(event => {
                const scoreType = getScoreTypeDisplay(event.score_type);
                const createdDate = new Date(event.created_at).toLocaleDateString('ko-KR');
                return `~~${event.event_name}~~ (ID: ${event.id})\n${scoreType} • ${createdDate}`;
            }).join('\n\n');

            eventListContent += `### ❌ 비활성 이벤트 (${inactiveEvents.length}개)\n${inactiveText}\n\n`;
        }

        eventListContent += `### 🔧 사용 가능한 명령어\n` +
                           `• \`/이벤트정보\` - 이벤트 상세 정보\n` +
                           `• \`/랭킹\` - 리더보드 확인\n` +
                           `• \`/점수추가\` - 점수 추가 (관리자)\n` +
                           `• \`/이벤트토글\` - 이벤트 활성화/비활성화 (관리자)`;

        section.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(eventListContent)
        );

        const container = new ContainerBuilder()
            .addSectionComponents(section)
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`*<t:${Math.floor(Date.now() / 1000)}:R>*`)
            );

        await interaction.reply({ 
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });

    } catch (error) {
        console.error('Error getting event list:', error);
        await interaction.reply({
            content: '❌ 이벤트 목록을 불러오는 중 오류가 발생했습니다.',
            flags: MessageFlags.Ephemeral
        });
    }
}

function getScoreTypeDisplay(scoreType) {
    const types = {
        'points': '📈 포인트',
        'time_seconds': '⏱️ 시간 (초)',
        'time_minutes': '⏰ 시간 (분)'
    };
    return types[scoreType] || types['points'];
}