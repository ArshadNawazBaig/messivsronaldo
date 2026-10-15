import type { Revision } from "./revisions";
const reason = "Replace a generic opening with a localized, dated answer and comparison table; remove repeated longevity/legacy passages while retaining relevant match examples and counting qualifications.";
export const localizedRevisions: Record<string, Revision> = {
  "es/messi-goals-2009": {
    summary: "Messi marcó 41 goles en 64 apariciones durante el año natural 2009: 38 con el Barcelona y 3 con Argentina. Los 38 goles de la temporada 2008/09 pertenecen a otro periodo, aunque la cifra coincida con su subtotal de club en 2009. La tabla separa esos conjuntos para evitar mezclarlos.",
    opening: [{ heading: "Goles de Messi en 2009: año natural y temporada" }, { rows: [["Periodo y equipo","Goles","Apariciones"],["Enero–diciembre de 2009 · Barcelona",38,54],["Enero–diciembre de 2009 · Argentina",3,10],["Enero–diciembre de 2009 · Total",41,64],["Temporada 2008/09 · Barcelona",38,"Periodo distinto"]] }, { text: "La suma del año natural es 38 + 3 = 41 goles y 54 + 10 = 64 apariciones. No se añaden los 38 de la temporada: algunos de sus partidos ya forman parte de 2009. Para calcular goles por aparición en el año, 41 ÷ 64 = 0,64, redondeando al final." }, { link: ["Consultar el archivo del año natural 2009", "/es/seasons/2009"] }],
    keep: [[4,11],[18,37]], reason,
  },
  "pt/messi-career-goals": {
    summary: "Na base histórica de 21 de setembro de 2026, Messi soma 930 golos: 805 por clubes e 125 pela Argentina. Barcelona contribui com 672, PSG com 32 e Inter Miami com 101. Este artigo explica essa conta datada; o perfil do jogador apresenta as atualizações publicadas depois dessa data.",
    opening: [{ heading: "Como se obtém o total de 930 golos" }, { rows: [["Equipa · 21 de setembro de 2026","Golos"],["Barcelona",672],["Paris Saint-Germain",32],["Inter Miami",101],["Subtotal dos clubes",805],["Argentina",125],["Total da carreira",930]] }, { text: "672 + 32 + 101 = 805; 805 + 125 = 930. Os golos da Liga dos Campeões já estão incluídos nos clubes. Somá-los novamente duplicaria eventos. Um artigo revisto hoje pode conservar um exemplo histórico, desde que a data dos números permaneça explícita." }, { link: ["Perfil de Messi com os dados publicados mais recentes", "/pt/players/messi"] }],
    keep: [[7,10],[17,35]], reason,
  },
  "pt/messi-ronaldo-hat-tricks": {
    summary: "O registo de 21 de setembro de 2026 apresenta 62 hat-tricks para Messi e 66 para Ronaldo. Messi soma 51 por clubes e 11 pela seleção; Ronaldo, 56 e 10. Um jogo com quatro ou cinco golos conta apenas uma vez. Estes valores são históricos; a página estatística mostra as atualizações posteriores.",
    opening: [{ heading: "Hat-tricks por âmbito: fotografia de setembro de 2026" }, { rows: [["Registo · 21 de setembro de 2026","Messi","Ronaldo"],["Clubes",51,56],["Seleção principal",11,10],["Carreira",62,66],["Liga dos Campeões, já incluída nos clubes",8,8]] }, { text: "A diferença de carreira é 66 − 62 = 4 jogos. Nos clubes, Ronaldo tem mais cinco; nas seleções, Messi tem mais um. Multiplicar cada total por três fornece apenas um mínimo de golos nesses jogos: alguns tiveram quatro ou cinco. O hat-trick não acrescenta golos ao total que já conta cada finalização." }, { link: ["Registos de hat-tricks e respetiva cobertura", "/pt/hat-tricks"] }],
    keep: [[8,11],[17,24],[27,43]], reason,
  },
  "fr/messi-ronaldo-career-appearances": {
    summary: "Au 21 septembre 2026, le relevé du site compte 1 176 apparitions pour Messi et 1 337 pour Ronaldo, soit un écart de 161. Une entrée en jeu compte comme une apparition, quelle que soit sa durée. La comparaison ci-dessous est historique ; les profils et le journal des mises à jour donnent la couverture publiée plus récente.",
    opening: [{ heading: "Retrouver les 161 apparitions d’écart" }, { rows: [["Périmètre · 21 septembre 2026","Messi","Ronaldo"],["Clubs",969,1104],["Sélection A",207,233],["Total",1176,1337],["Écart en faveur de Ronaldo","—",161]] }, { text: "1 104 − 969 = 135 apparitions d’écart en club ; 233 − 207 = 26 en sélection ; 135 + 26 = 161. Les matchs européens sont déjà compris dans les clubs. Les ajouter à nouveau gonflerait le total. Une présence sur le banc sans entrée en jeu n’ajoute aucune apparition." }, { link: ["Comparer les statistiques et leur date de couverture", "/fr/compare"] }],
    keep: [[7,17],[31,38],[42,45]], reason,
  },
  "fr/messi-ronaldo-free-kick-records": {
    summary: "Le relevé du 21 septembre 2026 attribue 75 buts sur coup franc direct à Messi et 65 à Ronaldo. En Ligue des champions, le sous-ensemble donne 5 à Messi et 12 à Ronaldo. Ces comptes ne mesurent pas le taux de réussite : il faudrait aussi connaître tous les tirs correspondants. Les chiffres restent datés.",
    opening: [{ heading: "Coups francs directs : total et sous-ensemble" }, { rows: [["Relevé · 21 septembre 2026","Messi","Ronaldo"],["Carrière",75,65],["Ligue des champions, comprise dans la carrière",5,12],["Taux de réussite sur l’ensemble de la carrière","Non calculé","Non calculé"]] }, { text: "Un taux de réussite se calcule en divisant les buts par les tentatives sur le même ensemble de matchs. Diviser par les apparitions répond à une autre question. Le nombre de tentatives n’étant pas établi ici pour toute la carrière, une case absente ne doit pas devenir zéro." }, { link: ["Les coups francs et les mises à jour publiées", "/fr/free-kicks"] }],
    keep: [[4,10],[16,33],[36,43]], reason,
  },
  "de/messi-ronaldo-free-kick-records": {
    summary: "Im Datenstand vom 21. September 2026 führt Messi bei direkten Freistoßtoren mit 75 zu 65. In der Champions League führt Ronaldo mit 12 zu 5. Diese historischen Torzahlen ergeben noch keine Trefferquote: Dafür fehlen hier vollständige, vergleichbare Versuchszahlen. Neuere veröffentlichte Werte stehen auf der Statistikseite.",
    opening: [{ heading: "Direkte Freistoßtore nach Bereich" }, { rows: [["Datenstand · 21. September 2026","Messi","Ronaldo"],["Vereine",63,54],["A-Nationalmannschaft",12,11],["Karriere",75,65],["Champions League, bereits in Vereinen enthalten",5,12]] }, { text: "63 + 12 = 75 und 54 + 11 = 65. Die Champions-League-Zeile darf nicht noch einmal addiert werden. Eine Trefferquote wäre Tore ÷ direkte Freistoßversuche × 100 bei identischer Abdeckung. Tore pro Einsatz ersetzen diesen Nenner nicht." }, { link: ["Aktuelle veröffentlichte Freistoßstatistik", "/de/free-kicks"] }],
    keep: [[9,13],[24,40]], reason,
  },
  "ar/messi-ronaldo-2026-goals-comparison": {
    summary: "في لقطة 21 سبتمبر 2026، يتقدم رونالدو في أهداف المسيرة بنتيجة 979 مقابل 930، بينما يتقدم ميسي في أهداف عام 2026 حتى ذلك التاريخ بنتيجة 34 مقابل 22. هاتان فترتان مختلفتان، وليستا نتيجتين متناقضتين. الأرقام هنا تاريخية؛ صفحة العام تعرض الإضافات المنشورة الأحدث.",
    opening: [{ heading: "المسيرة وعام 2026: افصل الفترة قبل المقارنة" }, { rows: [["النطاق حتى 21 سبتمبر 2026","ميسي","رونالدو"],["أهداف المسيرة",930,979],["أهداف عام 2026 حتى تاريخ اللقطة",34,22],["الفارق في المسيرة لصالح رونالدو","—",49],["الفارق في العام لصالح ميسي",12,"—"]] }, { text: "979 − 930 = 49 هدفًا في المسيرة، و34 − 22 = 12 هدفًا في العام. أهداف 2026 جزء من المسيرة؛ لا تُضاف إليها مرة أخرى. كما أن حصيلة سبتمبر ليست حصيلة عام مكتمل، ولا يكفي تغيير تاريخ تحرير المقال لتحديث المباريات التي تشملها الأرقام." }, { link: ["إحصاءات 2026 وتاريخ التغطية المنشور", "/ar/2026"] }],
    keep: [[17,26],[27,42],[53,58]], reason,
  },
  "nl/messi-ronaldo-team-trophies": {
    summary: "De ruime historische telling van 21 september 2026 geeft Messi 49 teamprijzen en Ronaldo 37. Bij Messi zijn daarin ook een jeugdwereldtitel, olympisch goud en een MLS-conferentietitel opgenomen. Zonder die drie vermeldingen wordt dezelfde telling 46–37. De gekozen definitie bepaalt dus mede het antwoord.",
    opening: [{ heading: "Twee afbakeningen van dezelfde prijzenlijst" }, { rows: [["Telling · 21 september 2026","Messi","Ronaldo"],["Ruime definitie van de site",49,37],["Zonder jeugdwereldtitel, olympisch goud en MLS-conferentietitel",46,37]] }, { text: "49 − 3 = 46. Deze tweede rij is een alternatieve selectie, geen extra verzameling prijzen. Leg eerst vast welke toernooien en deelnamevoorwaarden meetellen. Een verschil in definities kan een andere totaalscore opleveren zonder dat een beker uit de geschiedenis verdwijnt." }, { link: ["De prijzenlijst en telregels bekijken", "/nl/honours"] }],
    keep: [[4,12],[29,46]], reason,
  },
  "th/messi-vs-ronaldo-stats-guide": {
    summary: "เริ่มจากคำถามที่ต้องการตอบ แล้วเลือกสถิติที่ใช้ขอบเขต วันตัดยอด และนิยามเดียวกัน ยอดประตูสะสมบอกปริมาณผลงาน ส่วนประตูต่อเกมหรือต่อ 90 นาทีบอกความถี่ในกลุ่มข้อมูลนั้น ผู้นำจึงเปลี่ยนได้เมื่อเปลี่ยนตัวชี้วัด โดยไม่จำเป็นต้องมีตัวเลขใดผิด",
    opening: [{ heading: "เลือกสถิติให้ตรงกับคำถาม" }, { rows: [["คำถาม","ข้อมูลที่ควรใช้","สิ่งที่ต้องตรวจ"],["ใครทำประตูสะสมมากกว่า","ยอดรวมสโมสรและทีมชาติชุดใหญ่","ขอบเขตและวันตัดยอด"],["ใครทำประตูถี่กว่า","ประตูต่อเกมหรือต่อ 90 นาที","จำนวนนัดหรือนาทีในช่วงเดียวกัน"],["ใครสร้างโอกาสมากกว่า","แอสซิสต์และข้อมูลการสร้างโอกาส","นิยามของผู้ให้ข้อมูลและความครบถ้วน"],["ใครชนะรางวัลมากกว่า","รายการรางวัลที่ระบุชื่อชัดเจน","กติกาการนับและรางวัลที่ซ้ำกัน"]] }, { heading: "ตัวอย่างจากแชมเปียนส์ลีก" }, { text: "โรนัลโดมี 140 ประตูจาก 183 นัด คิดเป็นประมาณ 0.77 ประตูต่อเกม เมสซีมี 129 ประตูจาก 163 นัด คิดเป็นประมาณ 0.79 โรนัลโดจึงนำด้านยอดรวม ส่วนเมสซีนำด้านอัตราต่อเกมในข้อมูลชุดนี้ ทั้งสองข้อสรุปเป็นจริงพร้อมกันได้ แต่ยังไม่ได้ปรับความแตกต่างของนาที คู่แข่ง หรือบทบาทในทีม" }, { link: ["ดูสถิติแชมเปียนส์ลีกและขอบเขตข้อมูล", "/th/champions-league"] }],
    keep: [[18,34]], reason,
  },
};
