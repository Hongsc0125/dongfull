import {
    PermissionsBitField,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} from 'discord.js';
import { createEvent } from '../../database/events.js';
import { registerGuild } from '../../database/guilds.js';

export async function handleCreateEvent(interaction) {
    // 권한 확인
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return await interaction.reply({
            content: '❌ 이 명령어는 관리자만 사용할 수 있습니다.',
            flags: MessageFlags.Ephemeral
        });
    }

    try {
        // 모달 생성
        const modal = new ModalBuilder()
            .setCustomId('create-event-modal')
            .setTitle('새 이벤트 생성')
            .addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('event-name')
                        .setLabel('이벤트 제목')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                        .setMaxLength(100)
                        .setPlaceholder('예: 스피드런 챌린지')
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('event-description')
                        .setLabel('이벤트 설명')
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true)
                        .setMaxLength(500)
                        .setPlaceholder('이벤트에 대한 설명을 입력하세요')
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('score-type')
                        .setLabel('점수 타입(1. 점수 / 2. 시간)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                        .setPlaceholder('1, 2 중 하나 입력(숫자만입력)')
                        .setMaxLength(1)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('sort-direction')
                        .setLabel('순위 평가기준(1.높은순 / 2.낮은순)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                        .setPlaceholder('1, 2 중 하나 입력(숫자만입력)')
                        .setMaxLength(1)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('score-aggregation')
                        .setLabel('점수 집계방식(1.합산 / 2.평균 / 3.베스트)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                        .setPlaceholder('1, 2, 3 중 하나 입력(숫자만입력)')
                        .setMaxLength(1)
                )
            );

        await interaction.showModal(modal);

    } catch (error) {
        console.error('Error showing create event modal:', error);
        await interaction.reply({
            content: '❌ 이벤트 생성 모달 표시 중 오류가 발생했습니다.',
            flags: MessageFlags.Ephemeral
        });
    }
}

// 모달 응답 처리 함수
export async function handleCreateEventModal(interaction) {
    try {
        const eventName = interaction.fields.getTextInputValue('event-name');
        const description = interaction.fields.getTextInputValue('event-description');
        const scoreTypeNum = parseInt(interaction.fields.getTextInputValue('score-type'));
        const sortDirectionNum = parseInt(interaction.fields.getTextInputValue('sort-direction'));
        const scoreAggregationNum = parseInt(interaction.fields.getTextInputValue('score-aggregation'));

        // 입력값 검증
        if (scoreTypeNum < 1 || scoreTypeNum > 2) {
            return await interaction.reply({
                content: '❌ 점수 타입은 1, 2 중 하나를 선택해야 합니다.',
                flags: MessageFlags.Ephemeral
            });
        }

        if (sortDirectionNum < 1 || sortDirectionNum > 2) {
            return await interaction.reply({
                content: '❌ 순위 평가기준은 1, 2 중 하나를 선택해야 합니다.',
                flags: MessageFlags.Ephemeral
            });
        }

        if (scoreAggregationNum < 1 || scoreAggregationNum > 3) {
            return await interaction.reply({
                content: '❌ 점수 집계방식은 1, 2, 3 중 하나를 선택해야 합니다.',
                flags: MessageFlags.Ephemeral
            });
        }

        // 점수 타입 매핑
        const scoreTypeMap = {
            1: 'points',
            2: 'time_seconds'
        };
        const scoreType = scoreTypeMap[scoreTypeNum];

        // 정렬 방향 매핑
        const sortDirectionMap = {
            1: 'desc', // 높은 순
            2: 'asc'   // 낮은 순
        };
        const sortDirection = sortDirectionMap[sortDirectionNum];

        // 점수 집계 방식 매핑
        const scoreAggregationMap = {
            1: 'sum',     // 합산
            2: 'average', // 평균
            3: 'best'     // 베스트
        };
        const scoreAggregation = scoreAggregationMap[scoreAggregationNum];

        // 길드가 없으면 등록
        await registerGuild(interaction.guildId, interaction.guild.name, interaction.guild.ownerId);

        // 이벤트 생성
        const event = await createEvent(
            interaction.guildId,
            eventName,
            description,
            scoreType,
            interaction.user.id,
            sortDirection,
            scoreAggregation
        );

        // Components v2 UI 생성
        let fullContent = `## 🎉 새 이벤트가 생성되었습니다!\n\n` +
                         `### 📝 이벤트명: ${eventName}\n` +
                         `### 📊 점수 타입: ${getScoreTypeDisplay(scoreType)}\n` +
                         `### 🆔 이벤트 ID: ${event.id}\n` +
                         `### 🔄 정렬방식: ${event.sort_direction === 'desc' ? '내림차순 (높은 점수부터)' : '오름차순 (낮은 점수부터)'}\n` +
                         `### 📈 집계방식: ${getAggregationDisplay(scoreAggregation)}`;

        if (description) {
            fullContent += `\n\n### 📄 설명: ${description}`;
        }

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(fullContent)
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`*생성자: ${interaction.user.tag} • <t:${Math.floor(Date.now() / 1000)}:R>*`)
            );

        await interaction.reply({ 
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });

    } catch (error) {
        console.error('Error creating event:', error);
        
        if (!interaction.replied) {
            await interaction.reply({
                content: '❌ 이벤트 생성 중 오류가 발생했습니다.',
                flags: MessageFlags.Ephemeral
            });
        }
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

function getAggregationDisplay(aggregation) {
    const aggregations = {
        'sum': '🔢 합산 (여러 기록의 점수를 모두 더함)',
        'average': '📊 평균 (여러 기록의 점수 평균값)',
        'best': '🏆 베스트 (여러 기록 중 최고 점수만 반영)'
    };
    return aggregations[aggregation] || aggregations['sum'];
}