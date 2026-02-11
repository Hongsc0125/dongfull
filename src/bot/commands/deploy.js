import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const commands = [
    {
        name: '이벤트생성',
        description: '새로운 이벤트를 생성합니다 (관리자 전용)'
    },
    {
        name: '점수추가',
        description: '참가자에게 점수를 추가합니다 (관리자 전용)',
        options: [
            {
                name: '이벤트',
                description: '이벤트 선택',
                type: 3, // STRING
                required: true,
                autocomplete: true
            }
        ]
    },
    {
        name: '순위',
        description: '이벤트 리더보드를 확인합니다',
        options: [
            {
                name: '이벤트',
                description: '이벤트 선택',
                type: 3, // STRING
                required: true,
                autocomplete: true
            }
        ]
    },
    {
        name: '이벤트목록',
        description: '서버의 모든 이벤트를 확인합니다'
    },
    {
        name: '이벤트정보',
        description: '특정 이벤트의 상세 정보를 확인합니다',
        options: [
            {
                name: '이벤트',
                description: '이벤트 선택',
                type: 3, // STRING
                required: true,
                autocomplete: true
            }
        ]
    },
    {
        name: '이벤트토글',
        description: '이벤트를 활성화/비활성화합니다 (관리자 전용)',
        options: [
            {
                name: '이벤트',
                description: '이벤트 선택',
                type: 3, // STRING
                required: true,
                autocomplete: true
            }
        ]
    }
];

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

export async function deployCommands(clientId, guildId = null) {
    try {
        console.log('Started refreshing application (/) commands.');

        const route = guildId 
            ? Routes.applicationGuildCommands(clientId, guildId)
            : Routes.applicationCommands(clientId);

        await rest.put(route, { body: commands });

        console.log(`Successfully reloaded ${commands.length} application (/) commands.`);
    } catch (error) {
        console.error('Error deploying commands:', error);
    }
}

// If this file is run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
    const clientId = process.env.CLIENT_ID;
    const guildId = process.argv[2]; // Optional guild ID for testing
    
    if (!clientId) {
        console.error('CLIENT_ID not found in environment variables');
        process.exit(1);
    }
    
    deployCommands(clientId, guildId);
}