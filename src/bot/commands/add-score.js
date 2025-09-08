import {
    PermissionsBitField,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    EmbedBuilder
} from 'discord.js';
import { getEventById } from '../../database/events.js';
import { addParticipant, getParticipant, updateParticipantScore } from '../../database/participants.js';
import { getGuildMembers, searchGuildMembers } from '../../database/guild-members.js';

export async function handleAddScore(interaction) {
    // 권한 확인
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return await interaction.reply({
            content: '❌ 이 명령어는 관리자만 사용할 수 있습니다.',
            flags: MessageFlags.Ephemeral
        });
    }

    const eventId = parseInt(interaction.options.getString('이벤트'));

    try {
        // 즉시 응답하여 시간 초과 방지
        await interaction.deferReply();

        // 이벤트 정보 가져오기
        const event = await getEventById(eventId);
        if (!event) {
            return await interaction.editReply({
                content: '❌ 존재하지 않는 이벤트입니다.'
            });
        }

        if (event.guild_id !== interaction.guildId) {
            return await interaction.editReply({
                content: '❌ 다른 서버의 이벤트입니다.'
            });
        }

        if (!event.is_active) {
            return await interaction.editReply({
                content: '❌ 비활성화된 이벤트입니다.'
            });
        }

        // DB에서 멤버 가져오기
        const guild = interaction.guild;
        let userOptions;
        
        try {
            // DB에서 최근 활동한 멤버 24명 가져오기
            const dbMembers = await getGuildMembers(guild.id, 24);
            
            if (dbMembers.length === 0) {
                return await interaction.editReply({
                    content: '❌ DB에 등록된 사용자가 없습니다. 잠시 후 다시 시도해 주세요.\n(스케줄러가 곧 멤버 정보를 동기화합니다)'
                });
            }

            // DB 멤버를 셀렉트 옵션으로 변환
            userOptions = dbMembers.map(member => 
                new StringSelectMenuOptionBuilder()
                    .setLabel(`${member.display_name}`)
                    .setValue(member.user_id)
                    .setDescription(`@${member.username}`)
            );

            // 전체 멤버 수 확인을 위해 간단한 카운트 쿼리
            const { db } = await import('../../database/init.js');
            const countResult = await db.query(`
                SELECT COUNT(*) as total 
                FROM guild_members 
                WHERE guild_id = $1 AND is_bot = false
            `, [guild.id]);
            
            const totalMembers = parseInt(countResult.rows[0]?.total || 0);

            // 검색 옵션 추가 (총 멤버가 24명보다 많을 경우)
            if (totalMembers > 24) {
                userOptions.push(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(`🔍 사용자 검색... (총 ${totalMembers}명)`)
                        .setValue(`search-user-${eventId}`)
                        .setDescription('이름으로 직접 검색하기')
                );
            }

            console.log(`📊 Loaded ${dbMembers.length} members from DB for guild: ${guild.name}`);
        } catch (error) {
            console.error('Error loading members from DB:', error);
            return await interaction.editReply({
                content: '❌ 멤버 정보를 불러오는 중 오류가 발생했습니다.'
            });
        }

        // 사용자 선택 드롭다운 생성 (선택 시 바로 모달 표시)
        const userSelect = new StringSelectMenuBuilder()
            .setCustomId(`user-select-modal-${eventId}`)
            .setPlaceholder('점수를 추가할 사용자를 선택하세요')
            .addOptions(userOptions);

        const userRow = new ActionRowBuilder().addComponents(userSelect);

        // embed 생성
        const embed = {
            color: 0x3498db,
            title: `📊 점수 추가 - ${event.event_name}\n`+`> ${event.description}`,
            fields: [
                {
                    name: '🎯 이벤트 정보',
                    value: `> **점수:** ${getScoreTypeDisplay(event.score_type)}\n> **순위:** ${event.sort_direction === 'desc' ? '높은 점수부터' : '낮은 점수부터'}`,
                    inline: false
                },
                {
                    name: '📋 사용 방법',
                    value: '> 아래에서 사용자를 선택하면 자동으로 점수 입력 창이 표시됩니다.',
                    inline: false
                }
            ],
            footer: {
                text: `서버: ${guild.name} | 관리자: ${interaction.user.tag}`,
                icon_url: guild.iconURL()
            },
            timestamp: new Date().toISOString()
        };

        // if (event.description) {
        //     embed.fields.push({
        //         name: '📄 이벤트 설명',
        //         value: event.description,
        //         inline: false
        //     });
        // }

        // Ephemeral 메시지로 전송 (개인적으로만 보임)
        await interaction.editReply({ 
            embeds: [embed],
            components: [userRow],
            flags: MessageFlags.Ephemeral
        });

    } catch (error) {
        console.error('Error showing add score form:', error);
        
        if (interaction.deferred) {
            await interaction.editReply({
                content: '❌ 점수 추가 폼 표시 중 오류가 발생했습니다.'
            });
        } else {
            await interaction.reply({
                content: '❌ 점수 추가 폼 표시 중 오류가 발생했습니다.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
}

// 사용자 선택 처리 (바로 모달 표시)
export async function handleUserSelect(interaction) {
    const customIdParts = interaction.customId.split('-');
    
    if (customIdParts[2] === 'modal') {
        // 새로운 DM 방식 처리
        const eventId = customIdParts[3];
        const selectedUserId = interaction.values[0];
        
        // 검색 옵션 선택 확인
        if (selectedUserId.startsWith('search-user-')) {
            const searchEventId = selectedUserId.split('-')[2];
            return await showUserSearchModal(interaction, searchEventId);
        }
        
        try {
            const event = await getEventById(parseInt(eventId));
            const guild = interaction.client.guilds.cache.get(event.guild_id);
            const selectedUser = await guild.members.fetch(selectedUserId);

            let modal;
            if (event.score_type === 'time_seconds') {
                // 시간 입력 모달 (분, 초 따로)
                modal = new ModalBuilder()
                    .setCustomId(`score-modal-${eventId}-${selectedUserId}`)
                    .setTitle(`⏱️ ${selectedUser.displayName} - 시간 입력`)
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('minutes')
                                .setLabel('분 (Minutes)')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                                .setPlaceholder('0')
                                .setMaxLength(3)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('seconds')
                                .setLabel('초 (Seconds)')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                                .setPlaceholder('0')
                                .setMaxLength(2)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('note')
                                .setLabel('메모 (선택사항)')
                                .setStyle(TextInputStyle.Paragraph)
                                .setRequired(false)
                                .setMaxLength(200)
                                .setPlaceholder('기록에 대한 메모를 입력하세요')
                        )
                    );
            } else {
                // 포인트 입력 모달
                modal = new ModalBuilder()
                    .setCustomId(`score-modal-${eventId}-${selectedUserId}`)
                    .setTitle(`📊 ${selectedUser.displayName} - 점수 입력`)
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('score')
                                .setLabel('점수')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                                .setPlaceholder('점수를 입력하세요')
                                .setMaxLength(10)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('note')
                                .setLabel('메모 (선택사항)')
                                .setStyle(TextInputStyle.Paragraph)
                                .setRequired(false)
                                .setMaxLength(200)
                                .setPlaceholder('기록에 대한 메모를 입력하세요')
                        )
                    );
            }

            await interaction.showModal(modal);

        } catch (error) {
            console.error('Error showing modal from select:', error);
            await interaction.reply({
                content: '❌ 모달 표시 중 오류가 발생했습니다.',
                flags: MessageFlags.Ephemeral
            });
        }
    } else {
        // 기존 방식 처리 (호환성 위해 유지)
        const eventId = interaction.customId.split('-')[2];
        const selectedUserId = interaction.values[0];
        
        // 버튼 활성화를 위해 컴포넌트 업데이트
        const updatedComponents = interaction.message.components.map((row, index) => {
            if (index === 2) { // 버튼이 있는 행
                const button = ButtonBuilder.from(row.components[0])
                    .setDisabled(false)
                    .setCustomId(`score-input-${eventId}-${selectedUserId}`);
                return new ActionRowBuilder().addComponents(button);
            }
            return ActionRowBuilder.from(row);
        });

        await interaction.update({
            components: updatedComponents
        });
    }
}

// 점수 입력 모달 표시
export async function handleScoreInputButton(interaction) {
    const [, , eventId, selectedUserId] = interaction.customId.split('-');
    
    try {
        const event = await getEventById(parseInt(eventId));
        const guild = interaction.guild;
        const selectedUser = await guild.members.fetch(selectedUserId);

        let modal;
        if (event.score_type === 'time_seconds') {
            // 시간 입력 모달 (분, 초 따로)
            modal = new ModalBuilder()
                .setCustomId(`score-modal-${eventId}-${selectedUserId}`)
                .setTitle(`시간 입력 - ${selectedUser.displayName}`)
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('minutes')
                            .setLabel('분 (Minutes)')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                            .setPlaceholder('0')
                            .setMaxLength(3)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('seconds')
                            .setLabel('초 (Seconds)')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                            .setPlaceholder('0')
                            .setMaxLength(2)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('note')
                            .setLabel('메모 (선택사항)')
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(false)
                            .setMaxLength(200)
                            .setPlaceholder('기록에 대한 메모를 입력하세요')
                    )
                );
        } else {
            // 포인트 입력 모달
            modal = new ModalBuilder()
                .setCustomId(`score-modal-${eventId}-${selectedUserId}`)
                .setTitle(`점수 입력 - ${selectedUser.displayName}`)
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('score')
                            .setLabel('점수')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                            .setPlaceholder('점수를 입력하세요')
                            .setMaxLength(10)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('note')
                            .setLabel('메모 (선택사항)')
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(false)
                            .setMaxLength(200)
                            .setPlaceholder('기록에 대한 메모를 입력하세요')
                    )
                );
        }

        await interaction.showModal(modal);

    } catch (error) {
        console.error('Error showing score input modal:', error);
        await interaction.reply({
            content: '❌ 점수 입력 모달 표시 중 오류가 발생했습니다.',
            flags: MessageFlags.Ephemeral
        });
    }
}

// 점수 입력 모달 처리
export async function handleScoreModal(interaction) {
    const [, , eventId, selectedUserId] = interaction.customId.split('-');
    
    // 처리 시간이 길 수 있으므로 defer 처리
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    } catch (deferError) {
        console.error('Error deferring modal interaction:', deferError);
    }
    
    try {
        const event = await getEventById(parseInt(eventId));
        const guild = interaction.guild || interaction.client.guilds.cache.get(event.guild_id);
        const selectedUser = await guild.members.fetch(selectedUserId);
        const note = interaction.fields.getTextInputValue('note') || null;
        
        let score;
        if (event.score_type === 'time_seconds') {
            // 분과 초를 초 단위로 변환
            const minutes = parseInt(interaction.fields.getTextInputValue('minutes')) || 0;
            const seconds = parseInt(interaction.fields.getTextInputValue('seconds')) || 0;
            score = minutes * 60 + seconds;
            
            if (score <= 0) {
                return await interaction.editReply({
                    content: '❌ 시간은 0보다 커야 합니다.'
                });
            }
        } else {
            score = parseFloat(interaction.fields.getTextInputValue('score'));
            
            if (isNaN(score)) {
                return await interaction.editReply({
                    content: '❌ 올바른 점수를 입력하세요.'
                });
            }
        }

        // 참가자 추가/업데이트
        await addParticipant(
            parseInt(eventId),
            selectedUser.id,
            selectedUser.user.username,
            selectedUser.user.discriminator,
            selectedUser.user.displayAvatarURL()
        );

        const participant = await getParticipant(parseInt(eventId), selectedUser.id);
        if (!participant) {
            return await interaction.editReply({
                content: '❌ 참가자 정보를 가져올 수 없습니다.'
            });
        }

        const updatedParticipant = await updateParticipantScore(
            participant.id,
            score,
            interaction.user.id,
            note
        );

        // 집계 방식에 따른 현재 점수 계산
        let displayScore = updatedParticipant.total_score;
        let scoreLabel = '🏆 총합 점수 🏆';
        
        switch (event.score_aggregation) {
            case 'average':
                displayScore = updatedParticipant.entries_count > 0 ? 
                    updatedParticipant.total_score / updatedParticipant.entries_count : 0;
                scoreLabel = '🏆 평균 점수 🏆';
                break;
            case 'best':
                // 베스트 점수는 별도 쿼리 필요하지만 간단히 처리
                const bestQuery = await import('../../database/init.js');
                const { db } = bestQuery;
                const bestResult = await db.query(`
                    SELECT ${event.sort_direction === 'desc' ? 'MAX(score)' : 'MIN(score)'} as best_score
                    FROM score_entries 
                    WHERE participant_id = $1
                `, [participant.id]);
                displayScore = bestResult.rows[0]?.best_score || score;
                scoreLabel = '🏆 베스트 점수 🏆';
                break;
            case 'sum':
            default:
                scoreLabel = '🏆 총합 점수 🏆';
                break;
        }

        // 성공 메시지 Components v2 UI 생성 (이벤트 생성과 비슷한 스타일)
        let headContent = `## ✅ ${selectedUser.displayName}님에게 점수가 추가되었습니다!\n`;

        headContent += `### ${scoreLabel} (${event.event_name})\n`;
        headContent += `## ${formatScore(displayScore, event.score_type)}\n`;


        let bodyContent = `> **설    명:** ${event.description}\n` +
                         `> **추가점수:** ${formatScore(score, event.score_type)}\n` +
                         `> **참가횟수:** ${updatedParticipant.entries_count}회`;

        if (note) {
            bodyContent += `\n> **메모:** ${note}`;
        }

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
                new TextDisplayBuilder().setContent(`*기록자: ${interaction.user.tag} • <t:${Math.floor(Date.now() / 1000)}:R>*`)
            );

        // 안전한 인터랙션 응답 (defer 했으므로 editReply 사용)
        try {
            await interaction.editReply({ 
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        } catch (replyError) {
            console.error('Error editing reply:', replyError);
            // 응답 실패 시 무시
        }

    } catch (error) {
        console.error('Error processing score modal:', error);
        
        try {
            // defer 했으므로 editReply 사용
            await interaction.editReply({
                content: '❌ 점수 추가 처리 중 오류가 발생했습니다.'
            });
        } catch (errorReplyError) {
            console.error('Error editing error reply:', errorReplyError);
            // 최종적으로 응답할 수 없는 경우 무시
        }
    }
}


function getScoreTypeDisplay(scoreType) {
    const types = {
        'points': '포인트',
        'time_seconds': '시간'
    };
    return types[scoreType] || types['points'];
}



// 사용자 검색 모달 표시
async function showUserSearchModal(interaction, eventId) {
    try {
        const modal = new ModalBuilder()
            .setCustomId(`user-search-modal-${eventId}`)
            .setTitle('사용자 검색')
            .addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('user-search')
                        .setLabel('사용자명 또는 디스플레이명 입력')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                        .setPlaceholder('찾을 사용자의 이름을 입력하세요')
                        .setMaxLength(32)
                )
            );

        await interaction.showModal(modal);
    } catch (error) {
        console.error('Error showing user search modal:', error);
        await interaction.reply({
            content: '❌ 검색 모달 표시 중 오류가 발생했습니다.',
            flags: MessageFlags.Ephemeral
        });
    }
}

// 사용자 검색 모달 처리
export async function handleUserSearchModal(interaction) {
    const eventId = interaction.customId.split('-')[3];
    const searchQuery = interaction.fields.getTextInputValue('user-search').toLowerCase();
    
    try {
        const event = await getEventById(parseInt(eventId));
        
        // DB에서 멤버 검색 (훨씬 빠름!)
        const matchingMembers = await searchGuildMembers(event.guild_id, searchQuery, 25);

        if (matchingMembers.length === 0) {
            return await interaction.reply({
                content: `❌ "${searchQuery}"와 일치하는 사용자를 찾을 수 없습니다.`,
                flags: MessageFlags.Ephemeral
            });
        }

        // 검색 결과를 임베드로 표시 (1명이든 여러 명이든 동일)
        const userOptions = matchingMembers.map(member => 
            new StringSelectMenuOptionBuilder()
                .setLabel(`${member.display_name}`)
                .setValue(member.user_id)
                .setDescription(`@${member.username}`)
        );

        const userSelect = new StringSelectMenuBuilder()
            .setCustomId(`user-search-result-${eventId}`)
            .setPlaceholder(`검색된 사용자 선택 (${matchingMembers.length}명)`)
            .addOptions(userOptions);

        const userRow = new ActionRowBuilder().addComponents(userSelect);

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('🔍 사용자 검색 결과')
            .setDescription(`"**${searchQuery}**" 검색 결과: **${matchingMembers.length}명**\n\n아래에서 점수를 추가할 사용자를 선택하세요.`)
            .addFields(
                matchingMembers.map(member => ({
                    name: `👤 ${member.display_name}`,
                    value: `@${member.username}`,
                    inline: true
                }))
            )
            .setFooter({ text: `이벤트: ${event.event_name}` })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed],
            components: [userRow],
            flags: MessageFlags.Ephemeral
        });

    } catch (error) {
        console.error('Error processing user search:', error);
        await interaction.reply({
            content: '❌ 사용자 검색 중 오류가 발생했습니다.',
            flags: MessageFlags.Ephemeral
        });
    }
}

// 검색 결과에서 사용자 선택 처리
export async function handleUserSearchResult(interaction) {
    const eventId = interaction.customId.split('-')[3];
    const selectedUserId = interaction.values[0];
    
    try {
        const event = await getEventById(parseInt(eventId));
        const guild = interaction.client.guilds.cache.get(event.guild_id);
        const selectedUser = await guild.members.fetch(selectedUserId);
        
        // 선택된 사용자 정보를 임베드로 표시하고 점수 입력 버튼 제공
        const scoreButton = new ButtonBuilder()
            .setCustomId(`score-input-${eventId}-${selectedUserId}`)
            .setLabel(`점수 입력`)
            .setStyle(ButtonStyle.Success)
            .setEmoji('📝');

        const row = new ActionRowBuilder().addComponents(scoreButton);

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ 사용자 선택 완료')
            .setDescription(`**${selectedUser.displayName}** (@${selectedUser.user.username})이(가) 선택되었습니다.`)
            .addFields([
                {
                    name: '📊 이벤트',
                    value: `${event.event_name}`,
                    inline: true
                },
                {
                    name: '👤 선택된 사용자',
                    value: `${selectedUser.displayName}`,
                    inline: true
                }
            ])
            .setThumbnail(selectedUser.user.displayAvatarURL())
            .setFooter({ text: '아래 버튼을 클릭해서 점수를 입력하세요.' })
            .setTimestamp();

        await interaction.update({
            embeds: [embed],
            components: [row]
        });
    } catch (error) {
        console.error('Error handling search result selection:', error);
        await interaction.reply({
            content: '❌ 사용자 선택 처리 중 오류가 발생했습니다.',
            flags: MessageFlags.Ephemeral
        });
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
            const mins = Math.floor(totalMinutes);
            const secs = Math.round((totalMinutes - mins) * 60);
            return secs > 0 ? `${mins}분 ${secs}초` : `${mins}분`;
        case 'points':
        default:
            return `${numScore}점`;
    }
}