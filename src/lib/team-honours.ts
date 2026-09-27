// Shared team-honour register for public pages and exported comparisons.
export const teamHonoursDate = "2026-09-21";

export const trophyRows = [
    { label: "Champions League", messi: 4, ronaldo: 5, note: "Messi: 2006, 2009, 2011, 2015. Ronaldo: 2008, 2014, 2016, 2017, 2018." },
    { label: "Domestic league titles", messi: 12, ronaldo: 8, note: "Messi: 10 La Liga + 2 Ligue 1. Ronaldo: 3 Premier League + 2 La Liga + 2 Serie A + 1 Saudi Pro League (2025/26)." },
    { label: "Domestic cups", messi: 7, ronaldo: 6, note: "Messi: 7 Copa del Rey. Ronaldo: 1 FA Cup, 2 League Cups, 2 Copa del Rey, 1 Coppa Italia." },
    { label: "Domestic super cups", messi: 9, ronaldo: 7, note: "Includes Messi's 2005 Spanish Super Cup and Ronaldo's 2002 Portuguese / 2008 English super cups without a match appearance." },
    { label: "UEFA Super Cup", messi: 3, ronaldo: 3, note: "Ronaldo's 2016 title is included although he did not feature in the squad." },
    { label: "FIFA Club World Cup", messi: 3, ronaldo: 4, note: "Titles in the tournament's earlier format." },
    { label: "MLS Supporters’ Shield", messi: 1, ronaldo: 0, note: "2024 regular-season points title. Separate from the MLS Cup championship." },
    { label: "MLS Cup", messi: 1, ronaldo: 0, note: "2025 playoff championship." },
    { label: "Leagues Cup / Arab Club Champions Cup", messi: 1, ronaldo: 1, note: "Both in 2023, in different competitions." },
    { label: "Campeones Cup", messi: 1, ronaldo: 0, note: "Inter Miami, September 2026." },
    { label: "World Cup", messi: 1, ronaldo: 0, note: "Argentina, 2022." },
    { label: "Copa América / European Championship", messi: 2, ronaldo: 1, note: "Argentina: 2021, 2024. Portugal: 2016. Different tournaments." },
    { label: "Finalissima / UEFA Nations League", messi: 1, ronaldo: 2, note: "Messi: 2022 Finalissima. Ronaldo: 2019, 2025 Nations League. Different competitions." },
    { label: "Conference championship", messi: 1, ronaldo: 0, note: "2025 MLS Eastern Conference. A stage on the way to the MLS Cup; listed separately to make the overlap clear." },
    { label: "Youth & Olympic titles", messi: 2, ronaldo: 0, note: "2005 U20 World Cup and 2008 Olympic gold. Not senior national-team titles." },
];
export const teamTrophyTotals = trophyRows.reduce((totals, row) => ({
    messi: totals.messi + row.messi,
    ronaldo: totals.ronaldo + row.ronaldo,
}), { messi: 0, ronaldo: 0 });
