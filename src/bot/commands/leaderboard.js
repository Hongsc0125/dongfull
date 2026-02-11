import {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    SectionBuilder,
    ThumbnailBuilder
} from 'discord.js';
import { getEventById, getActiveEvents } from '../../database/events.js';
import { getLeaderboard } from '../../database/participants.js';

// 순위 명령어 처리 (이벤트 인자 직접 받기)
async function handleRanking(interaction) {
    try {
        // 이벤트 ID를 인자에서 가져오기
        const eventId = interaction.options.getString('이벤트');
        
        if (!eventId) {
            return await interaction.reply({
                content: '❌ 이벤트를 선택해주세요.',
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply();

        // 이벤트 정보 가져오기
        const event = await getEventById(parseInt(eventId));
        
        if (!event) {
            return await interaction.editReply({
                content: '❌ 이벤트를 찾을 수 없습니다.'
            });
        }

        if (event.guild_id !== interaction.guildId) {
            return await interaction.editReply({
                content: '❌ 다른 서버의 이벤트입니다.'
            });
        }

        // 리더보드 표시
        await displayLeaderboard(interaction, event, 10);
    } catch (error) {
        console.error('Error handling ranking command:', error);
        const errorMessage = '❌ 순위 조회 중 오류가 발생했습니다.';
        
        if (!interaction.replied) {
            await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
        } else {
            await interaction.editReply({ content: errorMessage });
        }
    }
}

// 리더보드 표시 함수
async function displayLeaderboard(interaction, event, limit = 999) {
    try {
        // 리더보드 데이터 가져오기
        const leaderboard = await getLeaderboard(event.id, limit);

        if (leaderboard.length === 0) {
            const emptyContent = `## 📊 ${event.event_name}\n\n` +
                                 '아직 참가자가 없습니다.\n\n' + 
                                 '### 📝 참가 방법\n' +
                                 '관리자가 `/점수추가` 명령어로 점수를 추가해야 합니다.';

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(emptyContent)
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`*<t:${Math.floor(Date.now() / 1000)}:R>*`)
                );

            return await interaction.editReply({ 
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        const leaderboardText = leaderboard.map((participant, index) => {
            const rankEmoji = getRankEmoji(participant.rank);
            const displayScore = participant.calculated_score !== undefined ? 
                participant.calculated_score : participant.total_score;
            const score = formatScore(displayScore, event.score_type);
            return `${rankEmoji} **${participant.rank}위** ${participant.display_name} - ${score}`;
        }).join('\n');

        // 집계 방식 표시
        const aggregationDisplay = getAggregationDisplay(event.score_aggregation || 'sum');
        
        let headerContent = `## 🏆 ${event.event_name} 🏆\n\n` +
                            `상위 ${Math.min(limit, leaderboard.length)}명의 랭킹\n\n`;

        let bodyContent = `### 📈 순위\n${leaderboardText}\n\n` +
                          `> 집계 방식: ${aggregationDisplay}\n` +
                          `> 총 참가자: ${leaderboard.length}명`;

        const { STATIC_URLS } = await import('../../config/urls.js');
        const section = new SectionBuilder()
            .setThumbnailAccessory(
                new ThumbnailBuilder().setURL(STATIC_URLS.KING)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(headerContent)
            );

        const container = new ContainerBuilder()
            .addSectionComponents(section)
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
                new TextDisplayBuilder().setContent(`*<t:${Math.floor(Date.now() / 1000)}:R>*`)
            );

        await interaction.editReply({ 
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });

    } catch (error) {
        console.error('Error displaying leaderboard:', error);
        throw error;
    }
}


function getRankEmoji(rank) {
    switch (rank) {
        case 1: return '🥇';
        case 2: return '🥈';
        case 3: return '🥉';
        default: return '🏅';
    }
}

function formatScore(score, scoreType) {
    const numScore = parseFloat(score);
    switch (scoreType) {
        case 'time_seconds':
            const totalSeconds = Math.round(numScore);
            
            if (totalSeconds < 60) {
                // 60초 미만: 초 단위만 표시
                return `${totalSeconds}초`;
            } else if (totalSeconds < 3600) {
                // 1시간 미만: 분:초 형태로 표시
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                return seconds > 0 ? `${minutes}분 ${seconds}초` : `${minutes}분`;
            } else {
                // 1시간 이상: 시:분:초 형태로 표시
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;
                
                let result = `${hours}시간`;
                if (minutes > 0) {
                    result += ` ${minutes}분`;
                }
                if (seconds > 0) {
                    result += ` ${seconds}초`;
                }
                return result;
            }
        case 'time_minutes':
            const totalMinutes = Math.round(numScore);
            if (totalMinutes < 60) {
                return `${totalMinutes}분`;
            } else {
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                return minutes > 0 ? `${hours}시간 ${minutes}분` : `${hours}시간`;
            }
        case 'points':
        default:
            return `${numScore}점`;
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
        'sum': '🔢 합산',
        'average': '📊 평균',
        'best': '🏆 베스트'
    };
    return aggregations[aggregation] || aggregations['sum'];
}

export { handleRanking };