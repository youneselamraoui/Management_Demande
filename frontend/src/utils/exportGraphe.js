export async function exportSvgAsPng(svgEl, filename = "graphe.png", scale = 2, legend = null) {
  if (!svgEl) throw new Error("SVG introuvable");
  const clone = svgEl.cloneNode(true);
  const all = clone.querySelectorAll("*");
  const origAll = svgEl.querySelectorAll("*");
  all.forEach((el, i) => {
    const cs = window.getComputedStyle(origAll[i]);
    el.style.fill = cs.fill;
    el.style.stroke = cs.stroke;
    el.style.fontFamily = cs.fontFamily;
    el.style.fontSize = cs.fontSize;
    el.style.fontWeight = cs.fontWeight;
  });
  const rect = svgEl.getBoundingClientRect();
  const width = rect.width || 220;
  const height = rect.height || 220;
  clone.setAttribute("width", width);
  clone.setAttribute("height", height);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  const svgData = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.decoding = "sync";

  // Calcul hauteur légende
  const hasLegend = Array.isArray(legend) && legend.length > 0;
  const legendRowH = 20;
  const legendGap = 12;
  const legendCols = hasLegend ? Math.min(legend.length, 2) : 0;
  const legendRows = hasLegend ? Math.ceil(legend.length / legendCols) : 0;
  const legendH = hasLegend ? legendRows * legendRowH + 16 : 0;

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = (height + legendH) * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible");
  ctx.scale(scale, scale);

  await new Promise((resolve, reject) => {
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height + legendH);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve();
    };
    img.onerror = reject;
    img.src = url;
  });

  if (hasLegend) {
    // fond léger légende
    ctx.fillStyle = "#f8fafc";
    // dessiner pastilles + textes
    ctx.font = "12px sans-serif";
    ctx.textBaseline = "middle";
    const colW = width / legendCols;
    legend.forEach((item, idx) => {
      const col = idx % legendCols;
      const row = Math.floor(idx / legendCols);
      const x = col * colW + 16;
      const y = height + 12 + row * legendRowH + legendRowH / 2;
      // pastille
      ctx.fillStyle = item.color || "#94a3b8";
      if (item.dashed) {
        ctx.fillStyle = "#e2e8f0";
        ctx.beginPath(); ctx.arc(x + 6, y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 1; ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(x + 6, y, 6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = "#0f172a";
      const label = `${item.label} ${item.pct ? `(${item.pct})` : ""}`.trim();
      ctx.fillText(label, x + 18, y);
    });
  }

  const pngUrl = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = pngUrl;
  a.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
