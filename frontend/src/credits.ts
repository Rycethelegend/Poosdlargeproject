export interface TeamMember {
    name: string;
    role: string;
}

export interface AssetCredit {
    what: string;
    creator: string;
    source: string;
    license: string;
}

export const TEAM: TeamMember[] = [
    { name: 'Levi Buffington', role: 'Project Manager' },
    { name: 'Alec Hayes', role: 'Frontend Developer' },
    { name: 'Nathan Melloul', role: 'Frontend Developer' },
    { name: 'Rudolph Antoine', role: 'API Developer' },
    { name: 'Wenhuang Lin', role: 'Frontend/Mobile Developer' },
    { name: 'Frank Yang', role: 'API Developer' },
    { name: 'Jake Arnold', role: 'Database Engineer' },
];

export const ASSETS: AssetCredit[] = [
    {
        what: 'Playing card, poker chip and card deck sprites',
        creator: 'IvoryRed (Pixel Poker Cards)',
        source: 'https://ivoryred.itch.io/pixel-poker-cards',
        license: 'CC BY 4.0',
    },
    {
        what: 'Joker images',
        creator: 'Our Team',
        source: '',
        license: '',
    },
    {
        what: 'Table background patterns',
        creator: 'Steve Schoger (Hero Patterns)',
        source: 'https://heropatterns.com',
        license: 'CC BY 4.0',
    },
    {
        what: 'Excalifont font',
        creator: 'Excalidraw',
        source: 'https://github.com/excalidraw/excalifont',
        license: 'SIL Open Font License 1.1',
    },
];
