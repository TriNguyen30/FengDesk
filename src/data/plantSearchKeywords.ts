/** Curated plant / garden shop keywords (VN + common names) for client-side search hints. */
export const PLANT_SEARCH_KEYWORDS: readonly string[] = [
  "cây cảnh",
  "cây trong nhà",
  "cây văn phòng",
  "cây phong thủy",
  "cây để bàn",
  "cây mini",
  "cây leo",
  "cây thủy sinh",
  "cây xương rồng",
  "cây sen đá",
  "cây mọng nước",
  "cây lưỡi hổ",
  "cây kim tiền",
  "cây phát tài",
  "cây bàng Singapore",
  "cây monstera",
  "cây trầu bà",
  "cây trầu bà vàng",
  "cây philodendron",
  "cây pothos",
  "cây vạn niên thanh",
  "cây ngọc ngân",
  "cây lan ý",
  "cây hồng môn",
  "cây phú quý",
  "cây thiết mộc lan",
  "cây lộc vừng",
  "cây sung",
  "cây tùng",
  "cây mai",
  "cây đào",
  "cây quất",
  "cây bưởi cảnh",
  "cây chanh",
  "cây ăn quả",
  "cây hoa hồng",
  "cây hoa lan",
  "cây hoa giấy",
  "cây hoa nhài",
  "cây hoa cúc",
  "cây hoa tulip",
  "cây hoa ly",
  "cây hoa lan hồ điệp",
  "cây hoa đồng tiền",
  "cây hoa cẩm tú cầu",
  "cây hoa thược dược",
  "chậu cây",
  "chậu sứ",
  "chậu nhựa",
  "chậu treo",
  "đất trồng",
  "phân bón",
  "dinh dưỡng thủy canh",
  "vỏ sỏi trang trí",
  "đèn LED cây",
  "bình tưới",
  "kéo cắt cành",
  "giá đỡ cây",
  "moss pole",
  "lan hồ điệp",
  "ficus lyrata",
  "fiddle leaf fig",
  "snake plant",
  "zz plant",
  "peace lily",
  "spider plant",
  "rubber plant",
  "bonsai",
  "terrarium",
  "cây air plant",
  "tillandsia",
  "cây dương xỉ",
  "cây dứa cảnh",
  "cây thường xuân",
  "cây trúc",
  "tre trúc",
  "cây phát lộc",
  "cây kim ngân",
  "cây thần tài",
  "cây tài lộc",
  "cây hạnh phúc",
  "cây vạn lộc",
  "cây bạch mã hoàng tử",
  "cây trầu bà cột",
  "cây monstera deliciosa",
  "cây alocasia",
  "cây colocasia",
  "cây calathea",
  "cây maranta",
  "cây begonia",
  "cây peperomia",
  "cây pilea",
  "cây string of pearls",
  "cây string of hearts",
  "cây hoya",
  "cây lan hài",
  "cây ngọc bích",
  "cây sống đời",
  "cây thạch nam",
  "cây rau má",
  "rau thơm",
  "cây gia vị",
  "cây ớt cảnh",
  "cây cà chua",
  "cây rau sạch",
  "vườn ban công",
  "vườn tường xanh",
  "cây lọc không khí",
  "cây chịu bóng",
  "cây chịu nắng",
  "cây dễ sống",
  "cây cho người mới",
  "combo cây + chậu",
  "quà tặng cây cảnh",
];

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

export function filterPlantKeywordSuggestions(query: string, limit = 8): string[] {
  const q = normalizeForMatch(query.trim());
  if (!q) return [];

  const scored: { text: string; score: number }[] = [];
  for (const text of PLANT_SEARCH_KEYWORDS) {
    const n = normalizeForMatch(text);
    if (!n.includes(q)) continue;
    let score = 0;
    if (n.startsWith(q)) score += 2;
    if (text.toLowerCase().startsWith(query.trim().toLowerCase())) score += 1;
    score -= text.length * 0.001;
    scored.push({ text, score });
  }

  scored.sort((a, b) => b.score - a.score || a.text.localeCompare(b.text, "vi"));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const { text } of scored) {
    const key = normalizeForMatch(text);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
    if (out.length >= limit) break;
  }
  return out;
}
