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
            let headContent = `## 📋 ${interaction.guild.name} 이벤트 목록!\n`;
            
            let bodyContent = `> **총 이벤트:** 0개\n` +
                             `> **활성이벤트:** 0개\n` +
                             `> **비활성이벤트:** 0개`;

            let footerContent = `📝 **이벤트를 생성해보세요!**\n` +
                               `\`/이벤트생성\` 명령어로 새로운 이벤트를 만들 수 있습니다`;

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(headContent)
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(bodyContent)
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(footerContent)
                )
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

        // 선호하는 깔끔한 디자인으로 구성
        let headContent = `## 📋 ${interaction.guild.name} 이벤트 목록!\n`;

        let bodyContent = `> **총 이벤트:** ${events.length}개\n` +
                         `> **활성이벤트:** ${activeEvents.length}개\n` +
                         `> **비활성이벤트:** ${inactiveEvents.length}개`;

        // 이벤트 목록
        let eventListContent = '';
        
        if (activeEvents.length > 0) {
            const activeText = activeEvents.slice(0, 8).map(event => {
                const scoreType = getScoreTypeDisplay(event.score_type);
                const aggregation = getAggregationDisplay(event.score_aggregation);
                return `✅ **${event.event_name}** (ID: ${event.id})\n   ${scoreType} • ${aggregation}`;
            }).join('\n');

            eventListContent += `📌 **활성 이벤트**\n${activeText}`;
        }

        if (inactiveEvents.length > 0) {
            const inactiveText = inactiveEvents.slice(0, 4).map(event => {
                const scoreType = getScoreTypeDisplay(event.score_type);
                const aggregation = getAggregationDisplay(event.score_aggregation);
                return `❌ ~~${event.event_name}~~ (ID: ${event.id})\n   ${scoreType} • ${aggregation}`;
            }).join('\n');

            if (eventListContent) eventListContent += '\n\n';
            eventListContent += `🔒 **비활성 이벤트**\n${inactiveText}`;
        }

        let footerContent = '💡 **명령어 안내**\n' +
                           '`/이벤트정보` `/순위` `/점수추가` `/이벤트토글`';

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(headContent)
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(bodyContent)
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(eventListContent)
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(footerContent)
            )
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
        'time_seconds': '⏱️ 시간',
        'time_minutes': '⏰ 시간 (분)'
    };
    return types[scoreType] || types['points'];
}

function getAggregationDisplay(aggregation) {
    const aggregations = {
        'sum': '🔢 총합',
        'average': '📊 평균', 
        'best': '🏆 베스트'
    };
    return aggregations[aggregation] || aggregations['sum'];
}