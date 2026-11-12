/**
 * Offline Intelligent Rule-Based Wardrobe Recommendation Engine
 */
const COLOR_HARMONY_MAP = {
  "Black": ["White", "Grey", "Red", "Beige", "Light Blue", "Navy Blue", "Maroon"],
  "White": ["Navy Blue", "Black", "Olive Green", "Beige", "Maroon", "Denim"],
  "Navy Blue": ["White", "Beige", "Grey", "Cream", "Brown", "Khaki"],
  "Beige": ["Navy Blue", "Brown", "White", "Black", "Maroon", "Olive Green"],
  "Red": ["Black", "White", "Navy Blue"],
  "Maroon": ["Beige", "Cream", "Gold", "White", "Black"],
  "Grey": ["Black", "White", "Navy Blue", "Maroon"],
  "Olive Green": ["Beige", "White", "Black", "Cream"]
};

export const OfflineFashionMatcher = {
  generateOutfit(wardrobe, occasion) {
    if (!wardrobe || wardrobe.length === 0) return null;

    const singlePieces = wardrobe.filter(i => 
      ["Dresses", "Gowns", "Sarees", "Salwar suits", "Anarkalis", "Ethnic dresses", "Sherwani", "Kurta pajama"].includes(i.category)
    );
    const tops = wardrobe.filter(i => 
      ["Tops", "T-shirts", "Shirts", "Polo shirts", "Kurtis", "Kurta", "Sweaters"].includes(i.category)
    );
    const bottoms = wardrobe.filter(i => 
      ["Jeans", "Trousers", "Leggings", "Shorts", "Skirts", "Dhoti"].includes(i.category)
    );
    const footwear = wardrobe.filter(i => 
      ["Shoes", "Sneakers", "Sandals"].includes(i.category)
    );

    let selected = [];
    let outfitTitle = "";

    const isEthnic = ["Wedding", "Festival", "Family function"].includes(occasion);

    if (isEthnic && singlePieces.length > 0) {
      selected.push(singlePieces[0]);
      outfitTitle = `Traditional ${singlePieces[0].name} Look`;
    } else if (tops.length > 0 && bottoms.length > 0) {
      let matchedTop = tops[0];
      let matchedBottom = null;

      for (const t of tops) {
        const allowedColors = COLOR_HARMONY_MAP[t.primaryColor] || [];
        matchedBottom = bottoms.find(b => allowedColors.includes(b.primaryColor));
        if (matchedBottom) {
          matchedTop = t;
          break;
        }
      }
      if (!matchedBottom) matchedBottom = bottoms[0];

      selected.push(matchedTop, matchedBottom);
      outfitTitle = `${matchedTop.primaryColor} & ${matchedBottom.primaryColor} Outfit`;
    } else if (singlePieces.length > 0) {
      selected.push(singlePieces[0]);
      outfitTitle = `Curated ${singlePieces[0].name}`;
    } else {
      selected.push(wardrobe[0]);
      outfitTitle = `Styled ${wardrobe[0].name}`;
    }

    if (footwear.length > 0) selected.push(footwear[0]);

    return {
      outfitName: outfitTitle,
      selectedItemIds: selected.map(i => i.id),
      matchingExplanation: "Carefully paired using color contrast harmony and event suitability.",
      colorCoordination: `${selected.map(i => i.primaryColor).join(" + ")} complementary tones.`,
      missingItemSuggestion: footwear.length === 0 ? "Neutral white sneakers or leather loafers" : "A minimal wrist watch"
    };
  }
};
